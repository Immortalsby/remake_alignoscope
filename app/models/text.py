from app import db
from sqlalchemy import text
import re



class Text(db.Model):
    __tablename__ = 'jeanchristophe'
    
    id = db.Column(db.Integer, primary_key=True)
    lang0 = db.Column(db.Text)
    lang1 = db.Column(db.Text)
    
    @classmethod
    def regexp(cls, column, pattern):
        """自定义 REGEXP 操作符"""
        return text(f'`{column}` REGEXP :pattern').bindparams(pattern=pattern)
    
    @classmethod
    def normalize_quotes(cls, text):
        """标准化各种引号为标准单引号"""
        # 所有可能的引号变体
        quotes = {"'", "’", "‘", "`", "′", "‵", "՚", "＇", "｀"}
        # 标准化为 ASCII 单引号
        result = text
        for quote in quotes:
            result = result.replace(quote, "'")
        return result
    
    @classmethod
    def get_total_blocks(cls):
        """获取有效块数（lang0和lang1都不为空的记录数）"""
        return cls.query.filter(
            db.and_(
                cls.lang0.isnot(None),
                cls.lang0 != '',
                cls.lang1.isnot(None),
                cls.lang1 != ''
            )
        ).count()
    
    @classmethod
    def has_quote(cls, text):
        """检查文本中是否包含任型的引号"""
        quotes = {"'", "’", "‘", "`", "′", "‵", "՚", "＇", "｀"}
        return any(quote in text for quote in quotes)

    @classmethod
    def split_by_quote(cls, text):
        """按任意引号分割文本，返回分割后的部分"""
        # 先标准化所有引号
        normalized = cls.normalize_quotes(text)
        # 然后按标准单引号分割
        parts = normalized.split("'")
        if len(parts) == 2:
            return parts
        return None

    @classmethod
    def search(cls, table_name, pos0='', neg0='', pos1='', neg1=''):
        cls.__table__.name = table_name
        
        # 初始查询
        query = cls.query
        
        # 分别处理左右两侧的条件
        left_conditions = []
        right_conditions = []
        
        # 获取所有记录
        results = query.all()
        results_with_type = []
        
        # 如果没有任何搜索条件，返回空的匹配类型
        if not any([pos0, neg0, pos1, neg1]):
            for result in results:
                results_with_type.append({
                    'id': result.id,
                    'lang0': result.lang0,
                    'lang1': result.lang1,
                    'match_type': []
                })
            return results_with_type, {'pos': None, 'neg': None}
        
        # 处理左侧条件
        if pos0:
            pos0_conditions = []
            term_groups = pos0.split()
            for term_group in term_groups:
                terms = term_group.split('|')
                term_patterns = []
                for term in terms:
                    if term.strip():
                        pattern = term.strip().replace('_', ' ')
                        if '.*' in pattern:
                            pattern = pattern.replace('.*', '[a-zA-Z]*?')
                            pattern = f"\\b{pattern}\\b"
                        else:
                            pattern = f"\\b{pattern}\\b"
                        term_patterns.append(pattern)
                
                if term_patterns:
                    group_pattern = '|'.join(term_patterns)
                    pos0_conditions.append(cls.regexp('lang0', group_pattern))
            
            if pos0_conditions:
                left_conditions.append(db.and_(*pos0_conditions))
        
        # 处理右侧条件
        if pos1:
            pos1_conditions = []
            term_groups = pos1.split()
            for term_group in term_groups:
                terms = term_group.split('|')
                term_patterns = []
                for term in terms:
                    if term.strip():
                        pattern = term.strip().replace('_', ' ')
                        if '.*' in pattern:
                            pattern = pattern.replace('.*', '[\\u4e00-\\u9fa5]*?')
                            pattern = f"\\b{pattern}\\b"
                        else:
                            pattern = f"\\b{pattern}\\b"
                        term_patterns.append(pattern)
                
                if term_patterns:
                    group_pattern = '|'.join(term_patterns)
                    pos1_conditions.append(cls.regexp('lang1', group_pattern))
            
            if pos1_conditions:
                right_conditions.append(db.and_(*pos1_conditions))
        
        # 处理每个结果
        for result in results:
            match_types = []
            
            # 独立检查左侧匹配
            has_left_match = True  # 如果没有左侧条件，默认为True
            if left_conditions:
                has_left_match = False
                if pos0:
                    terms = pos0.split()
                    for term in terms:
                        sub_terms = term.split('|')
                        for sub_term in sub_terms:
                            if sub_term.strip():
                                pattern = sub_term.strip().replace('_', ' ')
                                if '.*' in pattern:
                                    # 修改通配符模式以包含法语字符
                                    pattern = pattern.replace('.*', '[a-zàáâãäçèéêëìíîïñòóôõöùúûüýÿæœA-ZÀÁÂÃÄÇÈÉÊËÌÍÎÏÑÒÓÔÕÖÙÚÛÜÝŸÆŒ]*')
                                pattern = f"\\b{pattern}\\b"
                                sql = text("SELECT 1 FROM dual WHERE :text REGEXP :pattern")
                                result_match = db.session.execute(
                                    sql,
                                    {'text': result.lang0, 'pattern': pattern}
                                ).scalar() is not None
                                if result_match:
                                    has_left_match = True
                                    break
                        if has_left_match:
                            break
            
            # 独立检查右侧匹配
            has_right_match = True
            if right_conditions:
                has_right_match = False
                if pos1:
                    terms = pos1.split()
                    for term in terms:
                        sub_terms = term.split('|')
                        for sub_term in sub_terms:
                            if sub_term.strip():
                                pattern = sub_term.strip().replace("_", " ")
                                if '.*' in pattern:
                                    pattern = pattern.replace('.*', '[\\u4e00-\\u9fa5]*?')
                                    pattern = f"\\b{pattern}\\b"
                                else:
                                    pattern = f"\\b{pattern}\\b"
                                sql = text("SELECT 1 FROM dual WHERE :text REGEXP :pattern")
                                result_match = db.session.execute(
                                    sql,
                                    {'text': result.lang1, 'pattern': pattern}
                                ).scalar() is not None
                                if result_match:
                                    has_right_match = True
                                    break
                        if has_right_match:
                            break
            
            # 修改负向匹配的判断逻辑
            has_left_negative = False
            if neg0:
                terms = neg0.split()
                for term in terms:
                    pattern = term.strip().replace("_", " ")
                    pattern = cls.normalize_quotes(pattern)
                    if "'" in pattern:
                        parts = pattern.split("'")
                        if len(parts) == 2:
                            quote_patterns = [
                                f"{parts[0]}'{parts[1]}",
                                f"{parts[0]}'{parts[1]}",
                                f"{parts[0]}'{parts[1]}",
                                f"{parts[0]}`{parts[1]}",
                                f"{parts[0]}′{parts[1]}"
                            ]
                            for quote_pattern in quote_patterns:
                                sql = text("SELECT 1 FROM dual WHERE LOWER(:text) LIKE LOWER(:pattern)")
                                for pattern_with_spaces in [
                                    f"% {quote_pattern} %",
                                    f"{quote_pattern} %",
                                    f"% {quote_pattern}"
                                ]:
                                    result_match = db.session.execute(
                                        sql,
                                        {'text': result.lang0, 'pattern': pattern_with_spaces}
                                    ).scalar() is not None
                                    if result_match:
                                        has_left_negative = True
                                        break
                                if has_left_negative:
                                    break
                    else:
                        pattern = f"\\b{pattern}\\b"
                        sql = text("SELECT 1 FROM dual WHERE :text REGEXP :pattern")
                        result_match = db.session.execute(
                            sql,
                            {'text': result.lang0, 'pattern': pattern}
                        ).scalar() is not None
                        if result_match:
                            has_left_negative = True
                            break
            
            has_right_negative = False
            if neg1:
                terms = neg1.split()
                for term in terms:
                    pattern = term.strip()
                    if '.*' in pattern:
                        pattern = pattern.replace('.*', '[\\u4e00-\\u9fa5]*?')
                        pattern = f"\\b{pattern}\\b"
                    else:
                        pattern = f"\\b{pattern}\\b"
                    
                    sql = text("SELECT 1 FROM dual WHERE :text REGEXP :pattern")
                    result_match = db.session.execute(
                        sql,
                        {'text': result.lang1, 'pattern': pattern}
                    ).scalar() is not None
                    
                    if result_match:
                        has_right_negative = True
                        break
            
            # 独立设置左右匹配类型
            if has_left_match and (pos0 or neg0):
                match_types.append('left')
                
            if has_right_match and (pos1 or neg1):
                match_types.append('right')
                
            # 只有当左右都匹配时才添加both
            if 'left' in match_types and 'right' in match_types:
                match_types.append('both')
                
            # 独立添加负向匹配标记
            if has_left_negative:
                match_types.append('negative_left')
            if has_right_negative:
                match_types.append('negative_right')
            # 添加结果 - 只要有任何一边匹配就添加
            if match_types:
                results_with_type.append({
                    'id': result.id,
                    'lang0': result.lang0,
                    'lang1': result.lang1,
                    'match_type': match_types
                })
        
        # 设置高亮模式（使用 MySQL REGEXP 语法）
        highlight_patterns = {
            'pos': None,
            'neg': None
        }
        
        # 正向高亮模式
        if pos0 or pos1:
            pos_terms = []
            # 处理法语搜索词高亮
            if pos0:
                term_groups = pos0.split()
                for term_group in term_groups:
                    sub_terms = term_group.split('|')
                    for sub_term in sub_terms:
                        if sub_term.strip():
                            pattern = sub_term.strip().replace('_', ' ')
                            if '.*' in pattern:
                                # 修改通配符模式以包含法语字符
                                pattern = pattern.replace('.*', '[a-zàáâãäçèéêëìíîïñòóôõöùúûüýÿæœA-ZÀÁÂÃÄÇÈÉÊËÌÍÎÏÑÒÓÔÕÖÙÚÛÜÝŸÆŒ]*')
                                pattern = f"\\b{pattern}\\b"
                            elif "'" in pattern:
                                parts = pattern.split("'")
                                if len(parts) == 2:
                                    pattern = f"\\b{parts[0]}'{parts[1]}\\b"
                            else:
                                pattern = f"\\b{pattern}\\b"
                            pos_terms.append(pattern)
            
            # 处理中文搜索词高亮
            if pos1:
                term_groups = pos1.split()
                for term_group in term_groups:
                    sub_terms = term_group.split('|')
                    for sub_term in sub_terms:
                        if sub_term.strip():
                            pattern = sub_term.strip()
                            if '.*' in pattern:
                                pattern = pattern.replace('.*', '[\\u4e00-\\u9fa5]*?')
                                pattern = f"\\b{pattern}\\b"
                            else:
                                pattern = f"\\b{pattern}\\b"
                            pos_terms.append(pattern)
            
            if pos_terms:
                # 使用非捕获组 (?:) 来组合模式
                pos_pattern = '|'.join(f'(?:{term})' for term in pos_terms)
                highlight_patterns['pos'] = re.compile(f'({pos_pattern})', 
                                                    re.IGNORECASE | re.MULTILINE | re.UNICODE)
        
        # 负向高亮模式
        if neg0 or neg1:
            neg_terms = []
            if neg0:
                term_groups = neg0.split()
                for term_group in term_groups:
                    sub_terms = term_group.split('|')
                    for sub_term in sub_terms:
                        if sub_term.strip():
                            pattern = sub_term.strip().replace('_', ' ')
                            if '.*' in pattern:
                                pattern = pattern.replace('.*', '[\\u4e00-\\u9fa5]*?')
                            else:
                                pattern = re.escape(pattern)
                            neg_terms.append(pattern)
            
            if neg1:
                term_groups = neg1.split()
                for term_group in term_groups:
                    sub_terms = term_group.split('|')
                    for sub_term in sub_terms:
                        if sub_term.strip():
                            neg_terms.append(re.escape(sub_term.strip()))
            
            if neg_terms:
                neg_pattern = '|'.join(neg_terms)
                highlight_patterns['neg'] = re.compile(f'({neg_pattern})', 
                                                     re.IGNORECASE | re.MULTILINE | re.UNICODE)
        print(highlight_patterns)
        return results_with_type, highlight_patterns
    
    @classmethod
    def create_table_from_files(cls, table_name, file1_path, file2_path, split_char='#'):
        # 读取文件
        with open(file1_path, 'r', encoding='utf-8') as f1, \
             open(file2_path, 'r', encoding='utf-8') as f2:
            text1 = f1.read()
            text2 = f2.read()
        
        # 分割文本
        blocks1 = text1.split(split_char)[:-1]
        blocks2 = text2.split(split_char)[:-1]
        
        if len(blocks1) != len(blocks2):
            raise ValueError('文件内容不匹配')
            
        # 创建新表
        create_table_sql = text(f"""
        CREATE TABLE IF NOT EXISTS {table_name} (
            id INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
            lang0 TEXT CHARACTER SET utf8mb4,
            lang1 TEXT CHARACTER SET utf8mb4
        ) ENGINE = MYISAM;
        """)
        db.session.execute(create_table_sql)
        
        # 插入数据
        insert_sql = text(f"""
        INSERT INTO {table_name} (lang0, lang1)
        VALUES (:lang0, :lang1)
        """)
        
        # 批量插入数据
        for b1, b2 in zip(blocks1, blocks2):
            db.session.execute(insert_sql, {'lang0': b1.strip(), 'lang1': b2.strip()})
        
        db.session.commit()
    
    @staticmethod
    def get_all_tables():
        sql = text("SHOW TABLES")
        result = db.session.execute(sql)
        tables = [row[0] for row in result if row[0] != 'alembic_version']
        return tables
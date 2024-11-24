from app import db
from sqlalchemy import text
import re
from sqlalchemy.ext.hybrid import hybrid_method
from sqlalchemy import func

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
    def get_total_blocks(cls):
        """获取总块数"""
        return cls.query.count()
    
    @classmethod
    def search(cls, table_name, pos0='', neg0='', pos1='', neg1=''):
        """搜索函数，支持正则表达式"""
        cls.__table__.name = table_name
        
        # 法语特殊字符处理
        leftbor = r"\b|'"
        rightbor = r"'|…|\b"
        apo = "'"
        dot = "[[:alnum:]]*"
        
        # MySQL 查询构建
        query = cls.query
        conditions = []
        
        # 处理法语正向搜索
        if pos0:
            pos0_conditions = []
            term_groups = pos0.split()
            for term_group in term_groups:
                terms = term_group.split('|')
                term_patterns = []
                for term in terms:
                    if term.strip():
                        pattern = term.strip().replace('_', ' ').replace('.*', dot)
                        term_patterns.append(pattern)
                
                if term_patterns:
                    group_pattern = '|'.join(term_patterns)
                    final_pattern = f"({leftbor})({group_pattern})({rightbor})"
                    pos0_conditions.append(cls.regexp('lang0', final_pattern))
            
            if pos0_conditions:
                conditions.append(db.and_(*pos0_conditions))
        
        # 处理中文正向搜索
        if pos1:
            pos1_conditions = []
            term_groups = pos1.split()
            for term_group in term_groups:
                terms = term_group.split('|')
                term_patterns = []
                for term in terms:
                    if term.strip():
                        pattern = term.strip().replace('_', ' ')
                        term_patterns.append(pattern)
                
                if term_patterns:
                    group_pattern = '|'.join(term_patterns)
                    pos1_conditions.append(cls.regexp('lang1', group_pattern))
            
            if pos1_conditions:
                conditions.append(db.and_(*pos1_conditions))
        
        # 合并所有正向搜索条件
        if conditions:
            query = query.filter(db.or_(*conditions))
        
        # 执行查询获取结果
        results = query.all()
        results_with_type = []
        
        # 处理每个结果的匹配类型
        for result in results:
            match_types = []
            
            # 检查左侧（法语）匹配
            has_left_match = False
            if pos0:
                terms = pos0.replace("|", " ").replace("'", apo).split()
                for term in terms:
                    pattern = f"({leftbor}){term}({rightbor})"
                    pattern = pattern.replace("_", " ").replace(".*", dot)
                    if re.search(pattern, result.lang0, re.IGNORECASE):
                        has_left_match = True
                        break
            
            # 检查右侧（中文）匹配
            has_right_match = False
            if pos1:
                terms = pos1.split()
                for term in terms:
                    pattern = term.replace("_", " ")
                    if re.search(pattern, result.lang1):
                        has_right_match = True
                        break
            
            # 检查法语负向匹配
            has_left_negative = False
            if neg0 and has_left_match:  # 只在有左侧匹配时检查左侧负向
                terms = neg0.replace("|", " ").replace("'", apo).split()
                for term in terms:
                    pattern = f"({leftbor}){term}({rightbor})"
                    pattern = pattern.replace("_", " ").replace(".*", dot)
                    if re.search(pattern, result.lang0, re.IGNORECASE):
                        has_left_negative = True
                        break
            
            # 检查中文负向匹配
            has_right_negative = False
            if neg1 and has_right_match:  # 只在有右侧匹配时检查右侧负向
                terms = neg1.split()
                for term in terms:
                    pattern = term.strip().replace("_", " ")
                    if re.search(pattern, result.lang1):
                        has_right_negative = True
                        break
            
            # 设置匹配类型
            if has_left_match and has_right_match:
                if not has_left_negative and not has_right_negative:
                    match_types.append('both')
            
            if has_left_match and not has_left_negative:
                match_types.append('left')
            
            if has_right_match and not has_right_negative:
                match_types.append('right')
            
            if (has_left_match and not has_left_negative) or (has_right_match and not has_right_negative):
                match_types.append('positive')
            
            # 只有当对应语言有正向匹配时，才添加负向匹配标记
            if has_left_negative and has_left_match:
                match_types.append('negative_left')
            if has_right_negative and has_right_match:
                match_types.append('negative_right')
            
            if match_types:  # 只添加有匹配的结果
                results_with_type.append({
                    'id': result.id,
                    'lang0': result.lang0,
                    'lang1': result.lang1,
                    'match_type': match_types
                })
        
        # 设置高亮模式
        highlight_patterns = {
            'pos': None,
            'neg': None
        }
        
        # 正向高亮模式
        if pos0 or pos1:
            pos_terms = []
            if pos0:
                # 处理法语搜索词
                term_groups = pos0.split()
                for term_group in term_groups:
                    # 处理包含 | 的词组
                    sub_terms = term_group.split('|')
                    for sub_term in sub_terms:
                        if sub_term.strip():
                            # 添加边界匹配
                            pattern = f"({leftbor}){re.escape(sub_term.strip())}({rightbor})"
                            pos_terms.append(pattern)
            
            if pos1:
                # 处理中文搜索词
                term_groups = pos1.split()
                for term_group in term_groups:
                    # 处理包含 | 的词组
                    sub_terms = term_group.split('|')
                    for sub_term in sub_terms:
                        if sub_term.strip():
                            pos_terms.append(re.escape(sub_term.strip()))
            
            if pos_terms:
                # 创建包含所有搜索词的正则表达式
                pos_pattern = '|'.join(pos_terms)
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
                            pattern = f"({leftbor}){re.escape(sub_term.strip())}({rightbor})"
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
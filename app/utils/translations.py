class Trans:
    translations = {
        "Romain Roland: Jean-Christophe - Original": {
            "fr": "Romain Roland: Jean-Christophe - L'original",
            "zh": "罗曼·罗兰：约翰·克利斯朵夫-原著"
        },
        "Chinese Translation by Fu Lei (傅雷)": {
            "fr": "Traduction Chinoise par Fu Lei (傅雷)",
            "zh": "傅雷中译本"
        },
        "Contains:": {
            "fr": "Contient",
            "zh": "包含"
        },
        "Does Not Contain:": {
            "fr": "Ne Contient Pas",
            "zh": "不包含"
        },
        "Search": {
            "fr": "Chercher",
            "zh": "搜索"
        },
        "Howto": {
            "fr": "Mode D'emploi",
            "zh": "使用说明"
        },
        "Presentation": {
            "fr": "Présentation",
            "zh": "项目介绍"
        },
        "Idea & Alignment by <a href='https://miaojun.net' class='text-light'>Miao Jun</a>": {
            "fr": "Idée & Alignement par <a href='https://miaojun.net' class='text-light'>Miao Jun</a>",
            "zh": "创意与对齐：<a href='https://miaojun.net' class='text-light'>缪君</a>"
        },
        "Inspired by Serge Fleury's MkAlign": {
            "fr": "Inspiré par MkAlign de Serge Fleury",
            "zh": "灵感来自 Serge Fleury 的 MkAlign"
        },
        "Other Projects": {
            "fr": "Autres Projets",
            "zh": "其他项目"
        },
        "French-Chinese Political Corpus <a href='https://politics.corpusmart.cn/' class='text-light' target='_blank'><i class='fas fa-external-link-alt'></i></a>": {
            "fr": "Corpus Politique Franco-Chinois <a href='https://politics.corpusmart.cn/' class='text-light' target='_blank'><i class='fas fa-external-link-alt'></i></a>",
            "zh": "中法政治语料库 <a href='https://politics.corpusmart.cn/' class='text-light' target='_blank'><i class='fas fa-external-link-alt'></i></a>"
        },
        "Upload New Files": {
            "fr": "Télécharger de Nouveaux Fichiers",
            "zh": "上传新文件"
        },
        "New Table Name:": {
            "fr": "Nom de la Nouvelle Table :",
            "zh": "新表名："
        },
        "File 1:": {
            "fr": "Fichier 1 :",
            "zh": "文件1："
        },
        "File 2:": {
            "fr": "Fichier 2 :",
            "zh": "文件2："
        },
        "Cancel": {
            "fr": "Annuler",
            "zh": "取消"
        },
        "Upload": {
            "fr": "Télécharger",
            "zh": "上传"
        },
        "Originally programmed by <a href='http://gerdes.fr' class='text-light'>Kim Gerdes</a>, rewritten by Boyuan SHI in <i class='fab fa-python'></i> Flask with <i class='fab fa-js'></i> and <i class='fas fa-database'></i>": {
            "fr": "Initialement Programmé par <a href='http://gerdes.fr' class='text-light'>Kim Gerdes</a>, Réécrit par Boyuan SHI en <i class='fab fa-python'></i> Flask avec <i class='fab fa-js'></i> et <i class='fas fa-database'></i>",
            "zh": "原作者 <a href='http://gerdes.fr' class='text-light'>Kim Gerdes</a>，由 Boyuan SHI 使用 <i class='fab fa-python'></i> Flask、<i class='fab fa-js'></i> 和 <i class='fas fa-database'></i> 重制开发"
        }
    }

    def __init__(self, lang_code='en'):
        self.lang_code = lang_code

    def _(self, text):
        """翻译函数"""
        if self.lang_code == 'en':
            return text
        
        if text in self.translations:
            return self.translations[text].get(self.lang_code, text)
        return text
    
    def manual(self):
        """返回使用说明的HTML内容"""
        if self.lang_code == 'zh':
            return """
            <p><b>搜索说明：</b></p>
            <ul>
                <li>在左侧输入框中输入法语关键词，在右侧输入框中输入中文关键词</li>
                <li>使用空格分隔多个关键词，表示同时包含这些词</li>
                <li>使用 | 分隔多个关键词，表示包含其中任意一个词</li>
                <li>使用 _ 代替空格进行精确匹配</li>
                <li>使用 .* 表示任意字符</li>
                <li>"不包含"框中的词将被排除</li>
            </ul>
            <p><b>显示说明：</b></p>
            <ul>
                <li>灰色方块：表示该段落不包含搜索词</li>
                <li>红色方块：表示该段落仅包含法语搜索词</li>
                <li>蓝色方块：表示该段落仅包含中文搜索词</li>
                <li>紫色方块：表示该段落同时包含法语和中文搜索词</li>
            </ul>
            """
        elif self.lang_code == 'fr':
            return """
            <p><b>Instructions de recherche :</b></p>
            <ul>
                <li>Entrez les mots-clés français dans la zone de gauche et les mots-clés chinois dans la zone de droite</li>
                <li>Utilisez des espaces pour séparer plusieurs mots-clés (ET logique)</li>
                <li>Utilisez | pour séparer les alternatives (OU logique)</li>
                <li>Utilisez _ pour remplacer un espace dans une expression exacte</li>
                <li>Utilisez .* pour représenter n'importe quel caractère</li>
                <li>Les mots dans la zone "ne contient pas" seront exclus</li>
            </ul>
            <p><b>Légende des couleurs :</b></p>
            <ul>
                <li>Gris : paragraphe ne contenant pas les mots recherchés</li>
                <li>Rouge : paragraphe contenant uniquement les mots français</li>
                <li>Bleu : paragraphe contenant uniquement les mots chinois</li>
                <li>Violet : paragraphe contenant les mots français et chinois</li>
            </ul>
            """
        else:  # 英文（默认）
            return """
            <p><b>Search Instructions:</b></p>
            <ul>
                <li>Enter French keywords in the left box and Chinese keywords in the right box</li>
                <li>Use spaces to separate multiple keywords (logical AND)</li>
                <li>Use | to separate alternatives (logical OR)</li>
                <li>Use _ to replace space in exact phrases</li>
                <li>Use .* to represent any characters</li>
                <li>Words in "does not contain" boxes will be excluded</li>
            </ul>
            <p><b>Color Legend:</b></p>
            <ul>
                <li>Gray: paragraph does not contain search words</li>
                <li>Red: paragraph contains only French search words</li>
                <li>Blue: paragraph contains only Chinese search words</li>
                <li>Purple: paragraph contains both French and Chinese search words</li>
            </ul>
            """
    
    def pres(self):
        """返回项目介绍的HTML内容"""
        if self.lang_code == 'zh':
            return """
            <p>Alignoscope 是一个双语对齐文本搜索工具，专门用于法语-中文平行语料库的检索和分析。</p>
            <p>本工具基于《约翰·克利斯朵夫》的法语原著与傅雷中文译本，提供精确的段落对齐和灵活的搜索功能。</p>
            <p>特别感谢所有为本项目做出贡献的人员。</p>
            """
        elif self.lang_code == 'fr':
            return """
            <p>Alignoscope est un outil de recherche de textes alignés bilingues, spécialement conçu pour l'exploration et l'analyse de corpus parallèles français-chinois.</p>
            <p>Cet outil est basé sur le texte original français de "Jean-Christophe" et sa traduction chinoise par Fu Lei.</p>
            <p>Nous remercions tous ceux qui ont contribué à ce projet.</p>
            """
        else:  # 英文（默认）
            return """
            <p>Alignoscope is a bilingual aligned text search tool, specifically designed for searching and analyzing French-Chinese parallel corpora.</p>
            <p>This tool is based on the French original text of "Jean-Christophe" and its Chinese translation by Fu Lei.</p>
            <p>Special thanks to all who contributed to this project.</p>
            """
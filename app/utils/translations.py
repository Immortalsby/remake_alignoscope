class Trans:
    translations = {
        "Romain Roland: Jean-Christophe - Original": {
            "fr": "Romain Roland: Jean-Christophe - l'original",
            "zh": "罗曼·罗兰：约翰·克利斯朵夫-原著"
        },
        "Chinese Translation by Fu Lei (傅雷)": {
            "fr": "Traduction chinoise par Fu Lei (傅雷)",
            "zh": "傅雷中译本"
        },
        "contains:": {
            "fr": "contient",
            "zh": "包含"
        },
        "does not contain:": {
            "fr": "ne contient pas",
            "zh": "不包含"
        },
        "search": {
            "fr": "chercher",
            "zh": "搜索"
        }
        # 可以根据需要添加更多翻译
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
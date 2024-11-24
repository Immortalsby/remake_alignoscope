import gzip
import re

def process_sql_file():
    # 读取原始的 gz 文件
    with open('import.sql', 'rt', encoding='utf-8') as f:
        content = f.read()
    
    # 提取所有 INSERT 语句
    insert_pattern = r"INSERT INTO `jeanchristoph` \(`id`, `lang0`, `lang1`\) VALUES\s*\((.*?)\);"
    matches = re.findall(insert_pattern, content, re.DOTALL)
    
    # 写入新的 SQL 文件
    with open('export.sql', 'w', encoding='utf-8') as f:
        # 写入配置和表结构
        f.write("""
SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;
SET sql_mode = '';

DROP TABLE IF EXISTS `jeanchristophe`;

CREATE TABLE `jeanchristophe` (
  `id` int NOT NULL AUTO_INCREMENT,
  `lang0` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `lang1` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  PRIMARY KEY (`id`),
  FULLTEXT KEY `lang0` (`lang0`),
  FULLTEXT KEY `lang1` (`lang1`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

""")
        
        # 写入数据
        f.write("INSERT INTO `jeanchristophe` (`id`, `lang0`, `lang1`) VALUES\n")
        for i, match in enumerate(matches):
            if i < len(matches) - 1:
                f.write(f"({match}),\n")
            else:
                f.write(f"({match});\n")
        
        f.write("\nSET FOREIGN_KEY_CHECKS = 1;\n")

if __name__ == '__main__':
    process_sql_file()
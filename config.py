import os
from dotenv import load_dotenv
from urllib.parse import quote_plus

load_dotenv()

class Config:
    SECRET_KEY = os.environ.get('SECRET_KEY') or 'dev-key'
    
    # 对密码进行 URL 编码
    DB_PASSWORD = quote_plus(os.environ.get('MYSQL_PASSWORD', ''))
    
    # 修改数据库连接配置
    SQLALCHEMY_DATABASE_URI = (
        f"mysql+pymysql://"
        f"{os.environ.get('MYSQL_USER')}:"
        f"{DB_PASSWORD}@"  # 使用编码后的密码
        f"{os.environ.get('MYSQL_HOST')}/"
        f"{os.environ.get('MYSQL_DB')}"
        f"?charset=utf8mb4"
    )
    
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    
    # 会话配置
    SESSION_TYPE = 'filesystem'
    PERMANENT_SESSION_LIFETIME = 365 * 24 * 60 * 60  # 1年
    
    # 应用配置
    LANGUAGES = ['en', 'fr', 'zh']
    DEFAULT_LANGUAGE = 'en'
    DEFAULT_TABLE = 'jeanchristophe'
    DEFAULT_BLOCK_NUMBER = 7058
    DEFAULT_VOLUMES = '460-932-1817-2933-3725-4001-4677-5521-6266'
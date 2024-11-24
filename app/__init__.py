from flask import Flask, request, g
from flask_sqlalchemy import SQLAlchemy
from flask_session import Session
from flask_babel import Babel
from flask_migrate import Migrate
from config import Config
import pymysql

pymysql.install_as_MySQLdb()

db = SQLAlchemy()
migrate = Migrate()
babel = Babel()
sess = Session()

def get_locale():
    """获取语言设置"""
    if not g.get('lang_code', None):
        g.lang_code = request.accept_languages.best_match(['en', 'fr', 'zh'])
    return g.lang_code

def create_app(config_class=Config):
    app = Flask(__name__)
    app.config.from_object(config_class)
    app.config['DEBUG'] = True  # 启用调试模式
    app.config['ENV'] = 'development'  # 设置为开发环境
    
    # 初始化扩展
    db.init_app(app)
    migrate.init_app(app, db)
    
    # 配置 Babel
    app.config['BABEL_DEFAULT_LOCALE'] = 'en'
    babel.init_app(app, locale_selector=get_locale)
    
    sess.init_app(app)
    
    # 注册蓝图
    from app.routes.main import bp as main_bp
    app.register_blueprint(main_bp)
    
    return app
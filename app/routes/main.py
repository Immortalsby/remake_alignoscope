from flask import (
    Blueprint, render_template, request, jsonify, g, 
    current_app, session, redirect, url_for
)
from app.models.text import Text
from app.utils.translations import Trans
from app.utils.session import track_visit
from werkzeug.utils import secure_filename
import os

bp = Blueprint('main', __name__)

@bp.before_request
def before_request():
    track_visit()
    # 获取语言参数
    lang = request.args.get('lang')
    if lang in ['en', 'fr', 'zh']:
        session['lang'] = lang
        session['lang_code'] = lang  # 同时设置 lang_code
    elif 'lang' not in session:
        session['lang'] = 'en'  # 默认语言
        session['lang_code'] = 'en'
    
    g.lang_code = session.get('lang_code', 'en')

@bp.route('/')
def index():
    trans = Trans(session.get('lang', 'en'))  # 使用 session['lang'] 而不是 g.lang_code
    total_blocks = Text.get_total_blocks()
    return render_template('index.html',
                         trans=trans,
                         session=session,  # 确保传递 session 到模板
                         table=current_app.config['DEFAULT_TABLE'],
                         block_number=current_app.config['DEFAULT_BLOCK_NUMBER'],
                         volumes=current_app.config['DEFAULT_VOLUMES'],
                         total_blocks=total_blocks)
VOLUMES = [460, 932, 1817, 2933, 3725, 4001, 4677, 5521, 6266]

@bp.route('/search', methods=['POST'])
def search():
    data = request.get_json()
    table_name = data.get('table_name', 'jeanchristophe')
    
    # 解构搜索结果
    results, highlight_patterns = Text.search(
        table_name=table_name,
        pos0=data.get('pos0', ''),
        neg0=data.get('neg0', ''),
        pos1=data.get('pos1', ''),
        neg1=data.get('neg1', '')
    )
    
    # 统计不同类型的匹配
    stats = {
        'total_matches': 0,
        'left_matches': 0,
        'right_matches': 0,
        'both_matches': 0,
        'negative_matches': 0
    }
    
    items = []
    for result in results:
        # 获取匹配类型
        match_types = result['match_type']
        match_type = []
        
        # 更新统计信息
        if 'both' in match_types:
            stats['both_matches'] += 1
            stats['left_matches'] += 1
            stats['right_matches'] += 1
            match_type.append('both')
        else:
            if 'left' in match_types:
                stats['left_matches'] += 1
                match_type.append('left')
            if 'right' in match_types:
                stats['right_matches'] += 1
                match_type.append('right')
        
        if 'negative' in match_types:
            stats['negative_matches'] += 1
            match_type.append('negative')
        
        stats['total_matches'] += 1
        
        # 处理高亮
        lang0 = result['lang0']
        lang1 = result['lang1']
        
        # 应用正向高亮
        if highlight_patterns['pos']:
            lang0 = highlight_patterns['pos'].sub(r'<span class="alisqp">\1</span>', lang0)
            lang1 = highlight_patterns['pos'].sub(r'<span class="alisqp">\1</span>', lang1)
        
        # 应用负向高亮
        if highlight_patterns['neg']:
            lang0 = highlight_patterns['neg'].sub(r'<span class="alisqn">\1</span>', lang0)
            lang1 = highlight_patterns['neg'].sub(r'<span class="alisqn">\1</span>', lang1)
        
        item = {
            'id': result['id'],
            'match_type': match_type,
            'lang0': lang0,
            'lang1': lang1
        }
        items.append(item)
    
    response = {
        'items': items,
        'total_blocks': Text.get_total_blocks(),
        'stats': stats
    }
    return jsonify(response)

@bp.route('/align/<int:id>')
def get_aligned_text(id):
    text = Text.query.get_or_404(id)
    return jsonify({
        'lang0': text.lang0,
        'lang1': text.lang1
    })

@bp.route('/set-language/<lang_code>')
def set_language(lang_code):
    session['lang_code'] = lang_code
    return redirect(request.referrer or url_for('main.index'))

# 添加配置
ALLOWED_EXTENSIONS = {'txt'}
UPLOAD_FOLDER = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', 'uploads'))

def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

@bp.route('/upload', methods=['POST'])
def upload_files():
    if 'file1' not in request.files or 'file2' not in request.files:
        return jsonify({'error': '请选择两个文件'}), 400
        
    file1 = request.files['file1']
    file2 = request.files['file2']
    table_name = request.form.get('table_name')
    
    if not table_name:
        return jsonify({'error': '请输入表名'}), 400
        
    if file1.filename == '' or file2.filename == '':
        return jsonify({'error': '请选择文件'}), 400
        
    if file1 and file2 and allowed_file(file1.filename) and allowed_file(file2.filename):
        # 确保上传目录存在
        os.makedirs(UPLOAD_FOLDER, exist_ok=True)
        
        # 生成临时文件名
        import uuid
        temp_suffix = str(uuid.uuid4())[:8]
        file1_path = os.path.join(UPLOAD_FOLDER, f'temp1_{temp_suffix}.txt')
        file2_path = os.path.join(UPLOAD_FOLDER, f'temp2_{temp_suffix}.txt')
        
        try:
            # 保存文件
            file1.save(file1_path)
            file2.save(file2_path)
            
            # 写入数据库
            Text.create_table_from_files(
                table_name,
                file1_path,
                file2_path
            )
            
            return jsonify({'success': '文件上传成功'})
            
        except Exception as e:
            return jsonify({'error': str(e)}), 500
            
        finally:
            # 延迟一下再删除文件
            import time
            time.sleep(0.1)  # 等待100ms
            
            # 尝试删除文件
            for filepath in [file1_path, file2_path]:
                try:
                    if os.path.exists(filepath):
                        os.remove(filepath)
                except OSError:
                    # 如果删除失败，记录日志但不影响正常流程
                    print(f"Warning: Could not delete temporary file {filepath}")
    
    return jsonify({'error': '不支持的文件类型'}), 400

@bp.route('/tables', methods=['GET'])
def get_tables():
    tables = Text.get_all_tables()
    return jsonify({'tables': tables})
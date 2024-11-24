from flask import (
    Blueprint, render_template, request, jsonify, g, 
    current_app, session, redirect, url_for
)
from app.models.text import Text
from app.utils.translations import Trans
from app.utils.session import track_visit

bp = Blueprint('main', __name__)

@bp.before_request
def before_request():
    track_visit()
    g.lang_code = session.get('lang_code', request.accept_languages.best_match(
        current_app.config['LANGUAGES']
    ))

@bp.route('/')
def index():
    trans = Trans(g.lang_code)
    total_blocks = Text.get_total_blocks()
    return render_template('index.html',
                         trans=trans,
                         table=current_app.config['DEFAULT_TABLE'],
                         block_number=current_app.config['DEFAULT_BLOCK_NUMBER'],
                         volumes=current_app.config['DEFAULT_VOLUMES'],
                         total_blocks=total_blocks)
VOLUMES = [460, 932, 1817, 2933, 3725, 4001, 4677, 5521, 6266]

@bp.route('/search', methods=['POST'])
def search():
    data = request.get_json()
    print("Search params:", data)
    
    results = Text.search(
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
        'positive_matches': 0,
        'negative_matches': 0
    }
    
    items = []
    for result in results:
        match_type = []
        
        has_pos0 = data.get('pos0') and data.get('pos0').lower() in result.lang0.lower()
        has_pos1 = data.get('pos1') and data.get('pos1').lower() in result.lang1.lower()
        has_neg0 = data.get('neg0') and data.get('neg0').lower() in result.lang0.lower()
        has_neg1 = data.get('neg1') and data.get('neg1').lower() in result.lang1.lower()
        
        # 更新统计信息
        stats['total_matches'] += 1
        if has_pos0 and has_pos1:
            match_type.append('all')
            stats['both_matches'] += 1
        elif has_pos0:
            match_type.append('left')
            stats['left_matches'] += 1
        elif has_pos1:
            match_type.append('right')
            stats['right_matches'] += 1
        
        if has_pos0 or has_pos1:
            match_type.append('positive')
            stats['positive_matches'] += 1
        if has_neg0 or has_neg1:
            match_type.append('negative')
            stats['negative_matches'] += 1
            
        item = {
            'id': result.id,
            'match_type': match_type,
            'lang0': result.lang0,
            'lang1': result.lang1
        }
        items.append(item)
    
    response = {
        'items': items,
        'total_blocks': Text.get_total_blocks(),
        'volumes': VOLUMES,
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
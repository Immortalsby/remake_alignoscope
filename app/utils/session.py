from flask import session
import time

def track_visit():
    """追踪访问信息"""
    if 'first_visit' not in session:
        session['first_visit'] = time.time()
    session['last_visit'] = time.time()

def get_tracking_info():
    """获取访问追踪信息"""
    return {
        'first_visit': session.get('first_visit'),
        'last_visit': session.get('last_visit')
    }
from app import db
from sqlalchemy import text

class Text(db.Model):
    __tablename__ = 'jeanchristophe'
    
    id = db.Column(db.Integer, primary_key=True)
    lang0 = db.Column(db.Text)
    lang1 = db.Column(db.Text)
    
    @classmethod
    def get_total_blocks(cls):
        """获取总块数"""
        return cls.query.count()
    
    @classmethod
    def search(cls, pos0='', neg0='', pos1='', neg1=''):
        query = cls.query
        
        if pos0:
            query = query.filter(cls.lang0.ilike(f'%{pos0}%'))
        if neg0:
            query = query.filter(~cls.lang0.ilike(f'%{neg0}%'))
        if pos1:
            query = query.filter(cls.lang1.ilike(f'%{pos1}%'))
        if neg1:
            query = query.filter(~cls.lang1.ilike(f'%{neg1}%'))
            
        print("Generated SQL:", str(query))
        
        results = query.all()
        print(f"Found {len(results)} results")
        for result in results:
            print(f"ID: {result.id}, contains pos0: {pos0 in result.lang0.lower() if result.lang0 else False}")
            
        return results
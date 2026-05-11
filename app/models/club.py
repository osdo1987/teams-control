from app.extensions import db
from datetime import datetime

class Club(db.Model):
    __tablename__ = 'clubs'
    
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False, unique=True)
    description = db.Column(db.Text)
    sport = db.Column(db.String(100), default='Fútbol') # El deporte se define a nivel club
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    users = db.relationship('User', backref='club', lazy=True)
    groups = db.relationship('Group', backref='club', lazy=True)
    categories = db.relationship('Category', backref='club', lazy=True)

    def __repr__(self):
        return f'<Club {self.name}>'

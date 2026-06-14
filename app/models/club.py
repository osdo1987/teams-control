from app.extensions import db
from datetime import datetime

class Club(db.Model):
    __tablename__ = 'clubs'
    
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False, unique=True)
    slug = db.Column(db.String(100), unique=True, nullable=True)  # URL-friendly identifier
    description = db.Column(db.Text)
    sport = db.Column(db.String(100), default='Fútbol') # El deporte se define a nivel club
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    # Monetization fields
    subscription_status = db.Column(db.String(20), default='TRIAL') # ACTIVE, INACTIVE, TRIAL, EXPIRED
    plan_type = db.Column(db.String(20), default='BASIC') # BASIC, FLEXIBLE
    subscription_end_date = db.Column(db.DateTime, nullable=True)
    
    # Customization fields for branded login
    primary_color = db.Column(db.String(7), default='#6366f1')  # Hex color
    logo_url = db.Column(db.Text, nullable=True)  # URL or base64
    welcome_message = db.Column(db.String(200), nullable=True)  # Custom welcome text
    show_features = db.Column(db.Boolean, default=True)  # Show feature list on login
    
    users = db.relationship('User', backref='club', lazy=True)
    groups = db.relationship('Group', backref='club', lazy=True)
    categories = db.relationship('Category', backref='club', lazy=True)

    def __repr__(self):
        return f'<Club {self.name}>'

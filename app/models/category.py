from app.extensions import db

class Category(db.Model):
    __tablename__ = 'categories'
    
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    club_id = db.Column(db.Integer, db.ForeignKey('clubs.id'), nullable=False)
    is_active = db.Column(db.Boolean, default=True)
    
    groups = db.relationship('Group', backref='category_obj', lazy=True)

    def __repr__(self):
        return f'<Category {self.name}>'
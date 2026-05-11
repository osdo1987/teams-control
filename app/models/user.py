from app.extensions import db, bcrypt
from datetime import datetime

class User(db.Model):
    __tablename__ = 'users'
    
    id = db.Column(db.Integer, primary_key=True)
    identification_number = db.Column(db.String(30), unique=True, nullable=False)  # Numero de identificación (cedula, DNI, etc.)
    email = db.Column(db.String(120), nullable=True)  # Ya no es obligatorio para login
    password_hash = db.Column(db.String(128), nullable=False)
    first_name = db.Column(db.String(50), nullable=False)
    last_name = db.Column(db.String(50), nullable=False)
    role = db.Column(db.String(20), nullable=False) # ADMIN, TRAINER, ATHLETE, SUPER_ADMIN
    club_id = db.Column(db.Integer, db.ForeignKey('clubs.id'), nullable=True)
    phone = db.Column(db.String(20), nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    is_active = db.Column(db.Boolean, default=True)
    
    athlete_profile = db.relationship('Athlete', backref='user', uselist=False)
    trainer_profile = db.relationship('TrainerProfile', backref='user', uselist=False)

    def set_password(self, password):
        self.password_hash = bcrypt.generate_password_hash(password).decode('utf-8')

    def check_password(self, password):
        return bcrypt.check_password_hash(self.password_hash, password)

    def __repr__(self):
        return f'<User {self.identification_number} - {self.first_name} {self.last_name}>'

from app.extensions import db
from datetime import datetime

class Athlete(db.Model):
    __tablename__ = 'athletes'
    
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), unique=True, nullable=False)
    birth_date = db.Column(db.Date)
    phone = db.Column(db.String(20))
    address = db.Column(db.String(200))
    photo_url = db.Column(db.Text, nullable=True)
    
    # Relationships
    guardians = db.relationship('Guardian', backref='athlete', lazy=True)
    medical_info = db.relationship('MedicalInfo', backref='athlete', uselist=False)
    academic_info = db.relationship('AcademicInfo', backref='athlete', uselist=False)
    attendance = db.relationship('Attendance', backref='athlete', lazy=True)
    payments = db.relationship('Payment', backref='athlete', lazy=True)
    group_history = db.relationship('GroupHistory', backref='athlete', lazy=True)

class Guardian(db.Model):
    __tablename__ = 'guardians'
    id = db.Column(db.Integer, primary_key=True)
    athlete_id = db.Column(db.Integer, db.ForeignKey('athletes.id'), nullable=False)
    name = db.Column(db.String(100), nullable=False)
    relationship = db.Column(db.String(50))
    phone = db.Column(db.String(20))
    email = db.Column(db.String(120))

class MedicalInfo(db.Model):
    __tablename__ = 'medical_info'
    id = db.Column(db.Integer, primary_key=True)
    athlete_id = db.Column(db.Integer, db.ForeignKey('athletes.id'), unique=True, nullable=False)
    blood_type = db.Column(db.String(5))
    allergies = db.Column(db.Text)
    conditions = db.Column(db.Text)
    emergency_contact = db.Column(db.String(100))

class AcademicInfo(db.Model):
    __tablename__ = 'academic_info'
    id = db.Column(db.Integer, primary_key=True)
    athlete_id = db.Column(db.Integer, db.ForeignKey('athletes.id'), unique=True, nullable=False)
    school_name = db.Column(db.String(100))
    grade = db.Column(db.String(20))

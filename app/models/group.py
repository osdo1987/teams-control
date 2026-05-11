from app.extensions import db
from datetime import datetime

class Group(db.Model):
    __tablename__ = 'groups'
    
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    club_id = db.Column(db.Integer, db.ForeignKey('clubs.id'), nullable=False)
    
    # --- Información ampliada ---
    category = db.Column(db.String(50), nullable=True)  # Sub-8, Sub-10, Sub-12, Sub-15, Sub-18, Adultos, etc.
    sport = db.Column(db.String(50), nullable=True)  # Fútbol, Baloncesto, Voleibol, etc.
    description = db.Column(db.Text, nullable=True)
    max_capacity = db.Column(db.Integer, nullable=True)
    
    # --- Horario detallado ---
    schedule = db.Column(db.String(200))  # Resumen corto: "Lun-Mie-Vie 5PM"
    schedule_days = db.Column(db.String(100), nullable=True)  # "Lunes,Miércoles,Viernes"
    schedule_start_time = db.Column(db.String(10), nullable=True)  # "17:00"
    schedule_end_time = db.Column(db.String(10), nullable=True)  # "19:00"
    training_location = db.Column(db.String(150), nullable=True)  # Cancha principal, Gimnasio, etc.
    
    # --- Estado y metadata ---
    status = db.Column(db.String(20), default='ACTIVE')  # ACTIVE, INACTIVE, FULL
    level = db.Column(db.String(30), nullable=True)  # Principiante, Intermedio, Avanzado, Competitivo
    season = db.Column(db.String(50), nullable=True)  # "2026 - Primer Semestre"
    monthly_fee = db.Column(db.Numeric(10, 2), nullable=True)  # Cuota mensual del grupo
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Many-to-Many with Trainers (Users)
    trainers = db.relationship('User', secondary='group_trainers', backref='trainer_groups')
    # Current athletes in group
    athletes = db.relationship('Athlete', secondary='group_athletes', backref='current_groups')
    
    attendance = db.relationship('Attendance', backref='group', lazy=True)

class GroupHistory(db.Model):
    __tablename__ = 'group_history'
    id = db.Column(db.Integer, primary_key=True)
    athlete_id = db.Column(db.Integer, db.ForeignKey('athletes.id'), nullable=False)
    group_id = db.Column(db.Integer, db.ForeignKey('groups.id'), nullable=False)
    action = db.Column(db.String(20)) # JOINED, LEFT, CHANGED
    date = db.Column(db.DateTime, default=db.func.now())

from app.extensions import db
from datetime import datetime

class TrainingPlan(db.Model):
    __tablename__ = 'training_plans'

    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(150), nullable=False)
    description = db.Column(db.Text, nullable=True)
    club_id = db.Column(db.Integer, db.ForeignKey('clubs.id'), nullable=False)
    created_by = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    cycles = db.relationship('TrainingCycle', backref='plan', lazy=True, cascade='all, delete-orphan')
    assignments = db.relationship('TrainingPlanAssignment', backref='plan', lazy=True, cascade='all, delete-orphan')

    def __repr__(self):
        return f'<TrainingPlan {self.name}>'


class TrainingCycle(db.Model):
    __tablename__ = 'training_cycles'

    id = db.Column(db.Integer, primary_key=True)
    plan_id = db.Column(db.Integer, db.ForeignKey('training_plans.id'), nullable=False)
    name = db.Column(db.String(150), nullable=False)
    description = db.Column(db.Text, nullable=True)
    order = db.Column(db.Integer, default=1, nullable=False)

    # Relationships
    sessions = db.relationship('TrainingSession', backref='cycle', lazy=True, cascade='all, delete-orphan')

    def __repr__(self):
        return f'<TrainingCycle {self.name}>'


class TrainingSession(db.Model):
    __tablename__ = 'training_sessions'

    id = db.Column(db.Integer, primary_key=True)
    cycle_id = db.Column(db.Integer, db.ForeignKey('training_cycles.id'), nullable=False)
    name = db.Column(db.String(150), nullable=False)
    notes = db.Column(db.Text, nullable=True)
    order = db.Column(db.Integer, default=1, nullable=False)

    # Relationships
    exercises = db.relationship('TrainingExercise', backref='session', lazy=True, cascade='all, delete-orphan')

    def __repr__(self):
        return f'<TrainingSession {self.name}>'


class TrainingExercise(db.Model):
    __tablename__ = 'training_exercises'

    id = db.Column(db.Integer, primary_key=True)
    session_id = db.Column(db.Integer, db.ForeignKey('training_sessions.id'), nullable=False)
    exercise_name = db.Column(db.String(150), nullable=False)
    sets = db.Column(db.Integer, default=1, nullable=False)
    reps = db.Column(db.String(50), nullable=True)
    weight = db.Column(db.String(50), nullable=True)
    duration_seconds = db.Column(db.Integer, nullable=True)
    rest_seconds = db.Column(db.Integer, nullable=True)
    notes = db.Column(db.Text, nullable=True)
    order = db.Column(db.Integer, default=1, nullable=False)

    def __repr__(self):
        return f'<TrainingExercise {self.exercise_name}>'


class TrainingPlanAssignment(db.Model):
    __tablename__ = 'training_plan_assignments'

    id = db.Column(db.Integer, primary_key=True)
    plan_id = db.Column(db.Integer, db.ForeignKey('training_plans.id'), nullable=False)
    group_id = db.Column(db.Integer, db.ForeignKey('groups.id'), nullable=True)
    athlete_id = db.Column(db.Integer, db.ForeignKey('athletes.id'), nullable=True)
    start_date = db.Column(db.Date, nullable=False)
    end_date = db.Column(db.Date, nullable=False)
    status = db.Column(db.String(20), default='ACTIVE', nullable=False)  # ACTIVE, COMPLETED, CANCELLED
    assigned_at = db.Column(db.DateTime, default=datetime.utcnow)

    def __repr__(self):
        return f'<TrainingPlanAssignment plan={self.plan_id} group={self.group_id} athlete={self.athlete_id}>'

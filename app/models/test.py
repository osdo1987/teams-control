from app.extensions import db
from datetime import datetime

class TestTemplate(db.Model):
    __tablename__ = 'test_templates'

    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(150), nullable=False)
    description = db.Column(db.Text, nullable=True)
    category = db.Column(db.String(50), nullable=False)
    unit = db.Column(db.String(50), nullable=False)
    higher_is_better = db.Column(db.Boolean, default=True)
    club_id = db.Column(db.Integer, db.ForeignKey('clubs.id'), nullable=True)
    created_by = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=True)
    is_predefined = db.Column(db.Boolean, default=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    results = db.relationship('TestResult', backref='template', lazy=True, cascade='all, delete-orphan')

    def __repr__(self):
        return f'<TestTemplate {self.name}>'


class TestSession(db.Model):
    __tablename__ = 'test_sessions'

    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(150), nullable=True)
    club_id = db.Column(db.Integer, db.ForeignKey('clubs.id'), nullable=True)
    trainer_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=True)
    session_date = db.Column(db.Date, nullable=False, default=datetime.utcnow)
    notes = db.Column(db.Text, nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    trainer = db.relationship('User', foreign_keys=[trainer_id], backref='test_sessions')
    results = db.relationship('TestResult', backref='session', lazy=True, cascade='all, delete-orphan')

    def __repr__(self):
        return f'<TestSession {self.name}>'


class TestResult(db.Model):
    __tablename__ = 'test_results'

    id = db.Column(db.Integer, primary_key=True)
    template_id = db.Column(db.Integer, db.ForeignKey('test_templates.id'), nullable=False)
    athlete_id = db.Column(db.Integer, db.ForeignKey('athletes.id'), nullable=False)
    trainer_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=True)
    session_id = db.Column(db.Integer, db.ForeignKey('test_sessions.id'), nullable=True)
    value = db.Column(db.Numeric(12, 2), nullable=False)
    notes = db.Column(db.Text, nullable=True)
    test_date = db.Column(db.Date, nullable=False, default=datetime.utcnow)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    athlete = db.relationship('Athlete', backref=db.backref('test_results', lazy=True))
    trainer = db.relationship('User', foreign_keys=[trainer_id], backref='trained_test_results')

    def __repr__(self):
        return f'<TestResult template={self.template_id} athlete={self.athlete_id} value={self.value}>'

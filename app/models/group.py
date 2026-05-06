from app.extensions import db

class Group(db.Model):
    __tablename__ = 'groups'
    
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    club_id = db.Column(db.Integer, db.ForeignKey('clubs.id'), nullable=False)
    schedule = db.Column(db.String(200))
    
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

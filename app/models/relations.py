from app.extensions import db

# Association Table for Group and Trainers (Users)
group_trainers = db.Table('group_trainers',
    db.Column('group_id', db.Integer, db.ForeignKey('groups.id'), primary_key=True),
    db.Column('user_id', db.Integer, db.ForeignKey('users.id'), primary_key=True)
)

# Association Table for Group and Athletes (Current Group)
group_athletes = db.Table('group_athletes',
    db.Column('group_id', db.Integer, db.ForeignKey('groups.id'), primary_key=True),
    db.Column('athlete_id', db.Integer, db.ForeignKey('athletes.id'), primary_key=True)
)

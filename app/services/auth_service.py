from app.extensions import db, bcrypt
from app.models.user import User
from flask_jwt_extended import create_access_token

class AuthService:
    @staticmethod
    def login(email, password):
        user = User.query.filter_by(email=email).first()
        if user and user.check_password(password):
            access_token = create_access_token(identity=str(user.id))
            return {
                "access_token": access_token,
                "user": {
                    "id": user.id,
                    "email": user.email,
                    "role": user.role,
                    "club_id": user.club_id
                }
            }, 200
        return {"error": "Invalid credentials"}, 401

    @staticmethod
    def register_user(data):
        if User.query.filter_by(email=data['email']).first():
            return {"error": "Email already exists"}, 400
        
        user = User(
            email=data['email'],
            first_name=data['first_name'],
            last_name=data['last_name'],
            role=data.get('role', 'ATHLETE'),
            club_id=data['club_id']
        )
        user.set_password(data['password'])
        db.session.add(user)
        db.session.commit()
        return user, 201

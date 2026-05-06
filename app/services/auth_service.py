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
            club_id=data.get('club_id')
        )
        user.set_password(data['password'])
        db.session.add(user)
        db.session.commit()
        return user, 201

    @staticmethod
    def update_user(user_id, data):
        user = User.query.get(user_id)
        if not user: return None
        
        if 'email' in data: user.email = data['email']
        if 'first_name' in data: user.first_name = data['first_name']
        if 'last_name' in data: user.last_name = data['last_name']
        if 'role' in data: user.role = data['role']
        if 'club_id' in data: user.club_id = data['club_id']
        if 'password' in data: user.set_password(data['password'])
        
        db.session.commit()
        return user

    @staticmethod
    def delete_user(user_id):
        user = User.query.get(user_id)
        if not user: return False
        db.session.delete(user)
        db.session.commit()
        return True

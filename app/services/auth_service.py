from app.extensions import db, bcrypt
from app.models.user import User
from app.models.trainer import TrainerProfile
from app.models.athlete import Athlete
from app.models.group import Group, GroupHistory
from flask_jwt_extended import create_access_token

class AuthService:
    @staticmethod
    def login(identification_number, password):
        user = User.query.filter_by(identification_number=identification_number).first()
        if user and user.check_password(password):
            access_token = create_access_token(identity=str(user.id))
            
            # Obtener nombre del club
            club_name = "Global"
            if user.club:
                club_name = user.club.name

            return {
                "access_token": access_token,
                "user": {
                    "id": user.id,
                    "identification_number": user.identification_number,
                    "email": user.email,
                    "first_name": user.first_name,
                    "last_name": user.last_name,
                    "role": user.role,
                    "club_id": user.club_id,
                    "club_name": club_name
                }
            }, 200
        return {"error": "Credenciales inválidas"}, 401

    @staticmethod
    def register_user(data):
        if User.query.filter_by(identification_number=data['identification_number']).first():
            return {"error": "El número de identificación ya existe"}, 400
        
        user = User(
            identification_number=data['identification_number'],
            email=data.get('email', ''),
            first_name=data['first_name'],
            last_name=data['last_name'],
            role=data.get('role', 'ATHLETE'),
            club_id=data.get('club_id'),
            phone=data.get('phone', '')
        )
        user.set_password(data['password'])
        db.session.add(user)
        db.session.flush()

        # --- CASO TRAINER ---
        if data.get('role') == 'TRAINER':
            trainer_profile = TrainerProfile(user_id=user.id)
            db.session.add(trainer_profile)

        # --- CASO ATHLETE ---
        if data.get('role') == 'ATHLETE':
            athlete = Athlete(
                user_id=user.id,
                phone=data.get('phone', '')
            )
            db.session.add(athlete)
            db.session.flush()

            # Asignar a grupo si se proporciona
            if data.get('group_id'):
                group = Group.query.get(data['group_id'])
                if group:
                    group.athletes.append(athlete)
                    # Historial
                    history = GroupHistory(
                        athlete_id=athlete.id,
                        group_id=group.id,
                        action="JOINED"
                    )
                    db.session.add(history)

        db.session.commit()
        return user, 201

    @staticmethod
    def update_user(user_id, data):
        user = User.query.get(user_id)
        if not user: return None
        
        if 'identification_number' in data: user.identification_number = data['identification_number']
        if 'email' in data: user.email = data['email']
        if 'first_name' in data: user.first_name = data['first_name']
        if 'last_name' in data: user.last_name = data['last_name']
        if 'role' in data: user.role = data['role']
        if 'club_id' in data: user.club_id = data['club_id']
        if 'phone' in data: user.phone = data['phone']
        if 'password' in data and data['password']: user.set_password(data['password'])

        # Si el usuario es atleta y se cambia el grupo
        if user.role == 'ATHLETE' and 'group_id' in data:
            athlete = user.athlete_profile
            if athlete and data['group_id']:
                new_group = Group.query.get(data['group_id'])
                if new_group and athlete not in new_group.athletes:
                    # Por ahora solo soportamos un grupo principal en esta lógica simplificada
                    # (Remover de grupos anteriores si los hay, o simplemente añadir)
                    new_group.athletes.append(athlete)
                    history = GroupHistory(athlete_id=athlete.id, group_id=new_group.id, action="JOINED")
                    db.session.add(history)
        
        db.session.commit()
        return user

    @staticmethod
    def delete_user(user_id):
        user = User.query.get(user_id)
        if not user: return False
        
        if user.trainer_profile:
            db.session.delete(user.trainer_profile)
        
        if user.athlete_profile:
            # Limpiar asociaciones de grupos primero
            user.athlete_profile.current_groups = []
            db.session.delete(user.athlete_profile)

        db.session.delete(user)
        db.session.commit()
        return True

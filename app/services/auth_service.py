from app.extensions import db, bcrypt
from app.models.user import User
from app.models.trainer import TrainerProfile
from app.models.athlete import Athlete
from app.models.group import Group, GroupHistory
from flask_jwt_extended import create_access_token

class AuthService:
    @staticmethod
    def login(identification_number, password, club_slug=None):
        user = User.query.filter_by(identification_number=identification_number).first()
        if not user or not user.is_active:
            return {"error": "Credenciales inválidas"}, 401
        if user and user.check_password(password):
            # If club_slug is provided, verify user belongs to that club
            if club_slug:
                from app.models.club import Club
                club = Club.query.filter_by(slug=club_slug).first()
                if not club:
                    return {"error": "Club no encontrado"}, 404
                if user.club_id != club.id:
                    return {"error": "Credenciales inválidas para este club"}, 401
            
            access_token = create_access_token(identity=str(user.id))
            
            # Obtener datos del club
            club_name = "Global"
            subscription_status = "ACTIVE"
            club_slug_val = None
            
            if user.club_id:
                from app.models.club import Club
                club = Club.query.get(user.club_id)
                if club:
                    club_name = club.name
                    subscription_status = club.subscription_status or "TRIAL"
                    club_slug_val = club.slug
                
            # Log para depuración en producción
            print(f"DEBUG LOGIN: User {user.identification_number} - Club: {club_name} - Status: {subscription_status}")

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
                    "club_name": club_name,
                    "club_slug": club_slug_val,
                    "subscription_status": subscription_status
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
    def deactivate_user(user_id):
        user = User.query.get(user_id)
        if not user: return False
        
        user.is_active = False
        # Also deactivate related athlete or trainer profile
        if user.athlete_profile:
            user.athlete_profile.is_active = False
        db.session.commit()
        return True
    
    @staticmethod
    def reactivate_user(user_id):
        user = User.query.get(user_id)
        if not user: return False
        
        user.is_active = True
        if user.athlete_profile:
            user.athlete_profile.is_active = True
        db.session.commit()
        return True

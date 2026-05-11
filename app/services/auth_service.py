from app.extensions import db, bcrypt
from app.models.user import User
from app.models.trainer import TrainerProfile
from flask_jwt_extended import create_access_token

class AuthService:
    @staticmethod
    def login(identification_number, password):
        user = User.query.filter_by(identification_number=identification_number).first()
        if user and user.check_password(password):
            access_token = create_access_token(identity=str(user.id))
            return {
                "access_token": access_token,
                "user": {
                    "id": user.id,
                    "identification_number": user.identification_number,
                    "email": user.email,
                    "first_name": user.first_name,
                    "last_name": user.last_name,
                    "role": user.role,
                    "club_id": user.club_id
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

        # Si el rol es TRAINER, crear su perfil automáticamente
        if data.get('role') == 'TRAINER':
            trainer_profile = TrainerProfile(
                user_id=user.id,
                birth_date=data.get('birth_date'),
                gender=data.get('gender'),
                address=data.get('address'),
                city=data.get('city'),
                state=data.get('state'),
                emergency_contact_name=data.get('emergency_contact_name'),
                emergency_contact_phone=data.get('emergency_contact_phone'),
                bank_name=data.get('bank_name'),
                bank_account_number=data.get('bank_account_number'),
                bank_account_type=data.get('bank_account_type'),
                salary=data.get('salary'),
                payment_frequency=data.get('payment_frequency'),
                tax_id=data.get('tax_id'),
                education_level=data.get('education_level'),
                institution=data.get('institution'),
                degree_title=data.get('degree_title'),
                graduation_year=data.get('graduation_year'),
                certifications=data.get('certifications'),
                specialization=data.get('specialization'),
                years_of_experience=data.get('years_of_experience'),
                previous_clubs=data.get('previous_clubs'),
                bio=data.get('bio'),
                hire_date=data.get('hire_date'),
                contract_type=data.get('contract_type')
            )
            db.session.add(trainer_profile)

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
        if 'is_active' in data: user.is_active = data['is_active']
        if 'password' in data and data['password']: user.set_password(data['password'])

        # Actualizar perfil de entrenador si existe
        if user.role == 'TRAINER':
            profile = user.trainer_profile
            if not profile:
                profile = TrainerProfile(user_id=user.id)
                db.session.add(profile)

            trainer_fields = [
                'birth_date', 'gender', 'address', 'city', 'state',
                'emergency_contact_name', 'emergency_contact_phone',
                'bank_name', 'bank_account_number', 'bank_account_type',
                'salary', 'payment_frequency', 'tax_id',
                'education_level', 'institution', 'degree_title',
                'graduation_year', 'certifications', 'specialization',
                'years_of_experience', 'previous_clubs', 'bio',
                'hire_date', 'contract_type', 'status'
            ]
            for field in trainer_fields:
                if field in data:
                    setattr(profile, field, data[field])
        
        db.session.commit()
        return user

    @staticmethod
    def delete_user(user_id):
        user = User.query.get(user_id)
        if not user: return False
        # Eliminar perfil de entrenador si existe
        if user.trainer_profile:
            db.session.delete(user.trainer_profile)
        db.session.delete(user)
        db.session.commit()
        return True

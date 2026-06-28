from app.extensions import db
from app.models.athlete import Athlete, Guardian, MedicalInfo, AcademicInfo
from app.models.user import User
from app.models.group import GroupHistory

class AthleteService:
    @staticmethod
    def create_athlete(user_data, athlete_data):
        # First ensure the user exists or create it
        user = User(
            email=user_data['email'],
            first_name=user_data['first_name'],
            last_name=user_data['last_name'],
            role='ATHLETE',
            club_id=user_data['club_id']
        )
        user.set_password(user_data.get('password', 'Club123!')) # Default password
        db.session.add(user)
        db.session.flush() # Get user id

        athlete = Athlete(
            user_id=user.id,
            birth_date=athlete_data.get('birth_date'),
            phone=athlete_data.get('phone'),
            address=athlete_data.get('address')
        )
        db.session.add(athlete)
        db.session.commit()
        return athlete

    @staticmethod
    def get_athlete_by_id(athlete_id):
        return Athlete.query.get(athlete_id)

    @staticmethod
    def get_all_athletes():
        return Athlete.query.all()

    @staticmethod
    def update_profile(athlete_id, data):
        athlete = Athlete.query.get(athlete_id)
        if not athlete:
            return None
        
        # Update athlete fields
        if 'phone' in data:
            athlete.phone = data['phone']
        if 'address' in data:
            athlete.address = data['address']
        if 'birth_date' in data:
            athlete.birth_date = data['birth_date']
        # Nuevos campos del CSV
        if 'birth_city' in data:
            athlete.birth_city = data['birth_city']
        if 'birth_country' in data:
            athlete.birth_country = data['birth_country']
        if 'fixed_phone' in data:
            athlete.fixed_phone = data['fixed_phone']
        if 'neighborhood' in data:
            athlete.neighborhood = data['neighborhood']
        if 'insurance' in data:
            athlete.insurance = data['insurance']
        if 'uniforms' in data:
            athlete.uniforms = data['uniforms']
        if 'start_date' in data:
            athlete.start_date = data['start_date']
        if 'eps' in data:
            athlete.eps = data['eps']
        if 'physical_diseases' in data:
            athlete.physical_diseases = data['physical_diseases']
        if 'medical_diseases' in data:
            athlete.medical_diseases = data['medical_diseases']
        if 'allergies' in data:
            athlete.allergies = data['allergies']
        if 'physical_disability' in data:
            athlete.physical_disability = data['physical_disability']
        
        # Update user fields
        if 'user' in data and athlete.user:
            user = athlete.user
            if 'identification_number' in data['user']:
                user.identification_number = data['user']['identification_number']
            if 'email' in data['user']:
                user.email = data['user']['email']
            if 'phone' in data['user']:
                user.phone = data['user']['phone']
            # Nuevos campos del CSV en User
            if 'document_type' in data['user']:
                user.document_type = data['user']['document_type']
            if 'second_last_name' in data['user']:
                user.second_last_name = data['user']['second_last_name']
            if 'gender' in data['user']:
                user.gender = data['user']['gender']
            if 'blood_type' in data['user']:
                user.blood_type = data['user']['blood_type']
            if 'birth_city' in data['user']:
                user.birth_city = data['user']['birth_city']
            if 'birth_country' in data['user']:
                user.birth_country = data['user']['birth_country']
            if 'fixed_phone' in data['user']:
                user.fixed_phone = data['user']['fixed_phone']
            if 'neighborhood' in data['user']:
                user.neighborhood = data['user']['neighborhood']
            if 'insurance' in data['user']:
                user.insurance = data['user']['insurance']
            if 'uniforms' in data['user']:
                user.uniforms = data['user']['uniforms']
            if 'start_date' in data['user']:
                user.start_date = data['user']['start_date']
        
        # Update medical info if provided
        if 'medical_info' in data:
            med = athlete.medical_info or MedicalInfo(athlete_id=athlete_id)
            for k, v in data['medical_info'].items():
                if v is not None and v != '':
                    setattr(med, k, v)
            db.session.add(med)
            
        # Update academic info if provided
        if 'academic_info' in data:
            acad = athlete.academic_info or AcademicInfo(athlete_id=athlete_id)
            for k, v in data['academic_info'].items():
                if v is not None and v != '':
                    setattr(acad, k, v)
            db.session.add(acad)

        # Update guardian info if provided
        if 'guardian' in data:
            guardian = athlete.guardians[0] if athlete.guardians else Guardian(athlete_id=athlete_id)
            for k, v in data['guardian'].items():
                if v is not None and v != '':
                    setattr(guardian, k, v)
            db.session.add(guardian)

        db.session.commit()
        return athlete

    @staticmethod
    def delete_athlete(athlete_id):
        athlete = Athlete.query.get(athlete_id)
        if not athlete:
            return False, "Athlete not found"
        
        # Soft delete: mark athlete and user as inactive
        athlete.is_active = False
        user = User.query.get(athlete.user_id)
        if user:
            user.is_active = False
        db.session.commit()
        return True, "Athlete desactivado correctamente"
    
    @staticmethod
    def reactivate_athlete(athlete_id):
        athlete = Athlete.query.get(athlete_id)
        if not athlete:
            return False, "Athlete not found"
        
        athlete.is_active = True
        user = User.query.get(athlete.user_id)
        if user:
            user.is_active = True
        db.session.commit()
        return True, "Athlete reactivado correctamente"
from app.extensions import db
from app.models.athlete import Athlete, Guardian, MedicalInfo, AcademicInfo
from app.models.user import User
from app.models.group import GroupHistory

class AthleteService:
    @staticmethod
    def create_athlete(user_data, athlete_data):
        # First ensure the user exists or create it
        # (Assuming the trainer is creating the athlete)
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
        
        # Update medical/academic if provided
        if 'medical_info' in data:
            med = athlete.medical_info or MedicalInfo(athlete_id=athlete_id)
            for k, v in data['medical_info'].items():
                setattr(med, k, v)
            db.session.add(med)
            
        if 'academic_info' in data:
            acad = athlete.academic_info or AcademicInfo(athlete_id=athlete_id)
            for k, v in data['academic_info'].items():
                setattr(acad, k, v)
            db.session.add(acad)

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

from app.extensions import db
from app.models.athlete import Athlete, Guardian, MedicalInfo, AcademicInfo
from app.models.user import User
from app.models.group import Group, GroupHistory
from app.exceptions import NotFoundError, ValidationError
from app.services.user_service import UserService


class AthleteService:
    """Service for Athlete-related business logic."""

    @staticmethod
    def create_athlete(user_data, athlete_data, group_id=None):
        """Create a new athlete with user and optional group assignment."""
        # Create the user first
        user = UserService.create_user(user_data)

        # Create the athlete profile
        athlete = Athlete(
            user_id=user.id,
            birth_date=athlete_data.get('birth_date'),
            birth_city=athlete_data.get('birth_city'),
            birth_country=athlete_data.get('birth_country'),
            phone=athlete_data.get('phone'),
            fixed_phone=athlete_data.get('fixed_phone'),
            address=athlete_data.get('address'),
            neighborhood=athlete_data.get('neighborhood'),
            insurance=athlete_data.get('insurance'),
            uniforms=athlete_data.get('uniforms'),
            start_date=athlete_data.get('start_date'),
            eps=athlete_data.get('eps'),
            physical_diseases=athlete_data.get('physical_diseases'),
            medical_diseases=athlete_data.get('medical_diseases'),
            allergies=athlete_data.get('allergies'),
            physical_disability=athlete_data.get('physical_disability')
        )
        db.session.add(athlete)
        db.session.flush()

        # Assign to group if specified
        if group_id:
            group = Group.query.get(group_id)
            if group:
                athlete.current_groups.append(group)
                db.session.add(GroupHistory(
                    athlete_id=athlete.id,
                    group_id=group_id,
                    action="JOINED"
                ))

        db.session.commit()
        return athlete

    @staticmethod
    def get_athlete_by_id(athlete_id):
        """Get an athlete by ID or raise NotFoundError."""
        athlete = Athlete.query.get(athlete_id)
        if not athlete:
            raise NotFoundError(f"Athlete with id {athlete_id} not found")
        return athlete

    @staticmethod
    def get_all_athletes(club_id=None, include_inactive=False, user_role=None):
        """Get athletes filtered by club and active status."""
        query = Athlete.query

        if user_role != 'SUPER_ADMIN' and club_id:
            # Filter by club through the user relationship
            query = query.join(User).filter(User.club_id == club_id)

        if not include_inactive:
            query = query.filter(Athlete.is_active == True)

        return query.all()

    @staticmethod
    def update_profile(athlete_id, data):
        """Update athlete profile including user, medical, academic, and guardian info."""
        athlete = AthleteService.get_athlete_by_id(athlete_id)

        # Update athlete fields
        athlete_fields = [
            'phone', 'address', 'birth_date', 'birth_city', 'birth_country',
            'fixed_phone', 'neighborhood', 'insurance', 'uniforms', 'start_date',
            'eps', 'physical_diseases', 'medical_diseases', 'allergies', 'physical_disability'
        ]
        for field in athlete_fields:
            if field in data:
                setattr(athlete, field, data[field])

        # Update user fields
        if 'user' in data and athlete.user:
            UserService.update_user(athlete.user, data['user'])

        # Update medical info
        if 'medical_info' in data:
            med = athlete.medical_info or MedicalInfo(athlete_id=athlete_id)
            for k, v in data['medical_info'].items():
                if v is not None and v != '':
                    setattr(med, k, v)
            db.session.add(med)

        # Update academic info
        if 'academic_info' in data:
            acad = athlete.academic_info or AcademicInfo(athlete_id=athlete_id)
            for k, v in data['academic_info'].items():
                if v is not None and v != '':
                    setattr(acad, k, v)
            db.session.add(acad)

        # Update guardian info
        if 'guardian' in data:
            guardian = athlete.guardians[0] if athlete.guardians else Guardian(athlete_id=athlete_id)
            for k, v in data['guardian'].items():
                if v is not None and v != '':
                    setattr(guardian, k, v)
            db.session.add(guardian)

        db.session.commit()
        return athlete

    @staticmethod
    def transfer_group(athlete_id, new_group_id):
        """Transfer an athlete to a new group with history tracking."""
        athlete = AthleteService.get_athlete_by_id(athlete_id)
        new_group = Group.query.get(new_group_id)

        if not new_group:
            raise NotFoundError(f"Group with id {new_group_id} not found")

        # Record exit from current groups
        for old_group in list(athlete.current_groups):
            if old_group.id != new_group_id:
                db.session.add(GroupHistory(
                    athlete_id=athlete.id,
                    group_id=old_group.id,
                    action="LEFT"
                ))
                athlete.current_groups.remove(old_group)

        # Record entry to new group if not already there
        if new_group not in athlete.current_groups:
            athlete.current_groups.append(new_group)
            db.session.add(GroupHistory(
                athlete_id=athlete.id,
                group_id=new_group_id,
                action="JOINED"
            ))

        db.session.commit()
        return athlete

    @staticmethod
    def delete_athlete(athlete_id):
        """Soft delete an athlete (mark as inactive)."""
        athlete = AthleteService.get_athlete_by_id(athlete_id)
        athlete.is_active = False
        if athlete.user:
            athlete.user.is_active = False
        db.session.commit()
        return True, "Athlete desactivado correctamente"

    @staticmethod
    def reactivate_athlete(athlete_id):
        """Reactivate a soft-deleted athlete."""
        athlete = AthleteService.get_athlete_by_id(athlete_id)
        athlete.is_active = True
        if athlete.user:
            athlete.user.is_active = True
        db.session.commit()
        return True, "Athlete reactivado correctamente"
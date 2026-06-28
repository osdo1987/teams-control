from app.extensions import db
from app.models.user import User
from app.exceptions import NotFoundError, ConflictError, ValidationError


class UserService:
    """Service for User-related business logic."""

    @staticmethod
    def get_by_id(user_id):
        """Get a user by ID or raise NotFoundError."""
        user = User.query.get(user_id)
        if not user:
            raise NotFoundError(f"User with id {user_id} not found")
        return user

    @staticmethod
    def get_by_club(club_id, role=None, include_inactive=False):
        """Get users filtered by club and optionally by role."""
        query = User.query.filter_by(club_id=club_id)
        if role:
            query = query.filter_by(role=role)
        if not include_inactive:
            query = query.filter_by(is_active=True)
        return query.all()

    @staticmethod
    def create_user(data):
        """Create a new user with validated data."""
        # Check if identification number already exists
        existing = User.query.filter_by(
            identification_number=data['identification_number']
        ).first()
        if existing:
            raise ConflictError(
                f"User with identification '{data['identification_number']}' already exists"
            )

        user = User(
            identification_number=data['identification_number'],
            document_type=data.get('document_type'),
            email=data.get('email'),
            first_name=data['first_name'],
            last_name=data['last_name'],
            second_last_name=data.get('second_last_name'),
            gender=data.get('gender'),
            blood_type=data.get('blood_type'),
            birth_city=data.get('birth_city'),
            birth_country=data.get('birth_country'),
            role=data['role'],
            club_id=data.get('club_id'),
            phone=data.get('phone'),
            fixed_phone=data.get('fixed_phone'),
            address=data.get('address'),
            neighborhood=data.get('neighborhood'),
            insurance=data.get('insurance'),
            uniforms=data.get('uniforms'),
            start_date=data.get('start_date')
        )

        password = data.get('password', 'Club123!')
        user.set_password(password)
        db.session.add(user)
        db.session.commit()
        return user

    @staticmethod
    def update_user(user, data):
        """Update user fields from a data dict (skips password)."""
        allowed_fields = [
            'identification_number', 'document_type', 'email', 'first_name',
            'last_name', 'second_last_name', 'gender', 'blood_type',
            'birth_city', 'birth_country', 'phone', 'fixed_phone',
            'address', 'neighborhood', 'insurance', 'uniforms', 'start_date'
        ]
        for field in allowed_fields:
            if field in data:
                setattr(user, field, data[field])

        db.session.commit()
        return user

    @staticmethod
    def get_current_user():
        """Helper to get the current user from JWT identity (used in routes)."""
        from flask_jwt_extended import get_jwt_identity
        user_id = get_jwt_identity()
        return UserService.get_by_id(user_id)
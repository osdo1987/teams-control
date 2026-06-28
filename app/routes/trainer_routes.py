from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from app.models.trainer import TrainerProfile
from app.models.user import User
from app.extensions import db
from datetime import datetime

trainer_bp = Blueprint('trainer', __name__)


@trainer_bp.route('/profile', methods=['GET'])
@jwt_required()
def get_trainer_profile():
    """Get the current trainer's profile."""
    user_id = get_jwt_identity()
    user = User.query.get(user_id)
    if not user or user.role != 'TRAINER':
        return jsonify({'error': 'No autorizado'}), 403

    profile = TrainerProfile.query.filter_by(user_id=user_id).first()
    if not profile:
        # Create empty profile
        profile = TrainerProfile(user_id=user_id)
        db.session.add(profile)
        db.session.commit()

    return jsonify({
        'user': {
            'id': user.id,
            'first_name': user.first_name,
            'last_name': user.last_name,
            'email': user.email,
            'identification_number': user.identification_number,
            'phone': user.phone,
            'role': user.role,
            'club_id': user.club_id,
            'club_name': user.club.name if user.club else None,
        },
        'profile': {
            'id': profile.id,
            'birth_date': profile.birth_date.isoformat() if profile.birth_date else None,
            'gender': profile.gender,
            'address': profile.address,
            'city': profile.city,
            'state': profile.state,
            'emergency_contact_name': profile.emergency_contact_name,
            'emergency_contact_phone': profile.emergency_contact_phone,
            'profile_photo_url': profile.profile_photo_url,
            'bank_name': profile.bank_name,
            'bank_account_number': profile.bank_account_number,
            'bank_account_type': profile.bank_account_type,
            'salary': float(profile.salary) if profile.salary else None,
            'payment_frequency': profile.payment_frequency,
            'tax_id': profile.tax_id,
            'education_level': profile.education_level,
            'institution': profile.institution,
            'degree_title': profile.degree_title,
            'graduation_year': profile.graduation_year,
            'certifications': profile.certifications,
            'specialization': profile.specialization,
            'years_of_experience': profile.years_of_experience,
            'previous_clubs': profile.previous_clubs,
            'bio': profile.bio,
            'hire_date': profile.hire_date.isoformat() if profile.hire_date else None,
            'contract_type': profile.contract_type,
            'status': profile.status,
            'created_at': profile.created_at.isoformat() if profile.created_at else None,
            'updated_at': profile.updated_at.isoformat() if profile.updated_at else None,
        }
    }), 200


@trainer_bp.route('/profile', methods=['PUT'])
@jwt_required()
def update_trainer_profile():
    """Update the current trainer's profile."""
    user_id = get_jwt_identity()
    user = User.query.get(user_id)
    if not user or user.role != 'TRAINER':
        return jsonify({'error': 'No autorizado'}), 403

    data = request.get_json()
    profile = TrainerProfile.query.filter_by(user_id=user_id).first()
    if not profile:
        profile = TrainerProfile(user_id=user_id)
        db.session.add(profile)

    # Update user fields
    user_data = data.get('user', {})
    if 'first_name' in user_data:
        user.first_name = user_data['first_name']
    if 'last_name' in user_data:
        user.last_name = user_data['last_name']
    if 'email' in user_data:
        user.email = user_data['email']
    if 'phone' in user_data:
        user.phone = user_data['phone']

    # Update profile fields
    profile_data = data.get('profile', {})
    if 'birth_date' in profile_data and profile_data['birth_date']:
        profile.birth_date = datetime.strptime(profile_data['birth_date'], '%Y-%m-%d').date()
    if 'gender' in profile_data:
        profile.gender = profile_data['gender']
    if 'address' in profile_data:
        profile.address = profile_data['address']
    if 'city' in profile_data:
        profile.city = profile_data['city']
    if 'state' in profile_data:
        profile.state = profile_data['state']
    if 'emergency_contact_name' in profile_data:
        profile.emergency_contact_name = profile_data['emergency_contact_name']
    if 'emergency_contact_phone' in profile_data:
        profile.emergency_contact_phone = profile_data['emergency_contact_phone']
    if 'profile_photo_url' in profile_data:
        profile.profile_photo_url = profile_data['profile_photo_url']
    if 'bank_name' in profile_data:
        profile.bank_name = profile_data['bank_name']
    if 'bank_account_number' in profile_data:
        profile.bank_account_number = profile_data['bank_account_number']
    if 'bank_account_type' in profile_data:
        profile.bank_account_type = profile_data['bank_account_type']
    if 'salary' in profile_data:
        profile.salary = profile_data['salary']
    if 'payment_frequency' in profile_data:
        profile.payment_frequency = profile_data['payment_frequency']
    if 'tax_id' in profile_data:
        profile.tax_id = profile_data['tax_id']
    if 'education_level' in profile_data:
        profile.education_level = profile_data['education_level']
    if 'institution' in profile_data:
        profile.institution = profile_data['institution']
    if 'degree_title' in profile_data:
        profile.degree_title = profile_data['degree_title']
    if 'graduation_year' in profile_data:
        profile.graduation_year = profile_data['graduation_year']
    if 'certifications' in profile_data:
        profile.certifications = profile_data['certifications']
    if 'specialization' in profile_data:
        profile.specialization = profile_data['specialization']
    if 'years_of_experience' in profile_data:
        profile.years_of_experience = profile_data['years_of_experience']
    if 'previous_clubs' in profile_data:
        profile.previous_clubs = profile_data['previous_clubs']
    if 'bio' in profile_data:
        profile.bio = profile_data['bio']
    if 'hire_date' in profile_data and profile_data['hire_date']:
        profile.hire_date = datetime.strptime(profile_data['hire_date'], '%Y-%m-%d').date()
    if 'contract_type' in profile_data:
        profile.contract_type = profile_data['contract_type']
    if 'status' in profile_data:
        profile.status = profile_data['status']

    db.session.commit()
    return jsonify({'message': 'Perfil actualizado correctamente'}), 200


# --- Admin endpoints for managing trainer profiles ---

@trainer_bp.route('/admin/<int:user_id>', methods=['GET'])
@jwt_required()
def get_trainer_profile_admin(user_id):
    """Get a specific trainer's profile (admin)."""
    current_user = User.query.get(get_jwt_identity())
    if not current_user or current_user.role not in ('ADMIN', 'SUPER_ADMIN'):
        return jsonify({'error': 'No autorizado'}), 403

    user = User.query.get_or_404(user_id)
    if user.role != 'TRAINER':
        return jsonify({'error': 'El usuario no es un entrenador'}), 400

    # Admin can only see trainers from their own club
    if current_user.role == 'ADMIN' and user.club_id != current_user.club_id:
        return jsonify({'error': 'No autorizado'}), 403

    profile = TrainerProfile.query.filter_by(user_id=user_id).first()
    if not profile:
        profile = TrainerProfile(user_id=user_id)
        db.session.add(profile)
        db.session.commit()

    return jsonify({
        'user': {
            'id': user.id,
            'first_name': user.first_name,
            'last_name': user.last_name,
            'email': user.email,
            'identification_number': user.identification_number,
            'phone': user.phone,
            'role': user.role,
            'club_id': user.club_id,
            'club_name': user.club.name if user.club else None,
        },
        'profile': {
            'id': profile.id,
            'birth_date': profile.birth_date.isoformat() if profile.birth_date else None,
            'gender': profile.gender,
            'address': profile.address,
            'city': profile.city,
            'state': profile.state,
            'emergency_contact_name': profile.emergency_contact_name,
            'emergency_contact_phone': profile.emergency_contact_phone,
            'profile_photo_url': profile.profile_photo_url,
            'bank_name': profile.bank_name,
            'bank_account_number': profile.bank_account_number,
            'bank_account_type': profile.bank_account_type,
            'salary': float(profile.salary) if profile.salary else None,
            'payment_frequency': profile.payment_frequency,
            'tax_id': profile.tax_id,
            'education_level': profile.education_level,
            'institution': profile.institution,
            'degree_title': profile.degree_title,
            'graduation_year': profile.graduation_year,
            'certifications': profile.certifications,
            'specialization': profile.specialization,
            'years_of_experience': profile.years_of_experience,
            'previous_clubs': profile.previous_clubs,
            'bio': profile.bio,
            'hire_date': profile.hire_date.isoformat() if profile.hire_date else None,
            'contract_type': profile.contract_type,
            'status': profile.status,
            'created_at': profile.created_at.isoformat() if profile.created_at else None,
            'updated_at': profile.updated_at.isoformat() if profile.updated_at else None,
        }
    }), 200


@trainer_bp.route('/admin/<int:user_id>', methods=['PUT'])
@jwt_required()
def update_trainer_profile_admin(user_id):
    """Update a specific trainer's profile (admin)."""
    current_user = User.query.get(get_jwt_identity())
    if not current_user or current_user.role not in ('ADMIN', 'SUPER_ADMIN'):
        return jsonify({'error': 'No autorizado'}), 403

    user = User.query.get_or_404(user_id)
    if user.role != 'TRAINER':
        return jsonify({'error': 'El usuario no es un entrenador'}), 400

    # Admin can only update trainers from their own club
    if current_user.role == 'ADMIN' and user.club_id != current_user.club_id:
        return jsonify({'error': 'No autorizado'}), 403

    data = request.get_json()
    profile = TrainerProfile.query.filter_by(user_id=user_id).first()
    if not profile:
        profile = TrainerProfile(user_id=user_id)
        db.session.add(profile)

    # Update user fields
    user_data = data.get('user', {})
    if 'first_name' in user_data:
        user.first_name = user_data['first_name']
    if 'last_name' in user_data:
        user.last_name = user_data['last_name']
    if 'email' in user_data:
        user.email = user_data['email']
    if 'phone' in user_data:
        user.phone = user_data['phone']

    # Update profile fields
    profile_data = data.get('profile', {})
    if 'birth_date' in profile_data and profile_data['birth_date']:
        profile.birth_date = datetime.strptime(profile_data['birth_date'], '%Y-%m-%d').date()
    if 'gender' in profile_data:
        profile.gender = profile_data['gender']
    if 'address' in profile_data:
        profile.address = profile_data['address']
    if 'city' in profile_data:
        profile.city = profile_data['city']
    if 'state' in profile_data:
        profile.state = profile_data['state']
    if 'emergency_contact_name' in profile_data:
        profile.emergency_contact_name = profile_data['emergency_contact_name']
    if 'emergency_contact_phone' in profile_data:
        profile.emergency_contact_phone = profile_data['emergency_contact_phone']
    if 'profile_photo_url' in profile_data:
        profile.profile_photo_url = profile_data['profile_photo_url']
    if 'bank_name' in profile_data:
        profile.bank_name = profile_data['bank_name']
    if 'bank_account_number' in profile_data:
        profile.bank_account_number = profile_data['bank_account_number']
    if 'bank_account_type' in profile_data:
        profile.bank_account_type = profile_data['bank_account_type']
    if 'salary' in profile_data:
        profile.salary = profile_data['salary']
    if 'payment_frequency' in profile_data:
        profile.payment_frequency = profile_data['payment_frequency']
    if 'tax_id' in profile_data:
        profile.tax_id = profile_data['tax_id']
    if 'education_level' in profile_data:
        profile.education_level = profile_data['education_level']
    if 'institution' in profile_data:
        profile.institution = profile_data['institution']
    if 'degree_title' in profile_data:
        profile.degree_title = profile_data['degree_title']
    if 'graduation_year' in profile_data:
        profile.graduation_year = profile_data['graduation_year']
    if 'certifications' in profile_data:
        profile.certifications = profile_data['certifications']
    if 'specialization' in profile_data:
        profile.specialization = profile_data['specialization']
    if 'years_of_experience' in profile_data:
        profile.years_of_experience = profile_data['years_of_experience']
    if 'previous_clubs' in profile_data:
        profile.previous_clubs = profile_data['previous_clubs']
    if 'bio' in profile_data:
        profile.bio = profile_data['bio']
    if 'hire_date' in profile_data and profile_data['hire_date']:
        profile.hire_date = datetime.strptime(profile_data['hire_date'], '%Y-%m-%d').date()
    if 'contract_type' in profile_data:
        profile.contract_type = profile_data['contract_type']
    if 'status' in profile_data:
        profile.status = profile_data['status']

    db.session.commit()
    return jsonify({'message': 'Perfil de entrenador actualizado correctamente'}), 200
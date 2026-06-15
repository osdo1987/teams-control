import os
import uuid
from flask import Blueprint, jsonify, request, current_app
from app.extensions import db
from app.models.club import Club
from app.models.user import User
from app.models.athlete import Athlete, Guardian, MedicalInfo, AcademicInfo
from app.utils.standardize import standardize_data, standardize_name, standardize_upper
from flask_bcrypt import Bcrypt
from datetime import date
import re
from werkzeug.utils import secure_filename

# Allowed extensions for image uploads
ALLOWED_EXTENSIONS = {'png', 'jpg', 'jpeg', 'gif', 'webp'}

def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

bcrypt = Bcrypt()
registration_bp = Blueprint('registration', __name__, url_prefix='/api/registration')

@registration_bp.route('/clubs', methods=['GET'])
def get_available_clubs():
    """Get clubs that accept athlete registrations"""
    clubs = Club.query.filter_by(subscription_status='ACTIVE').all()
    result = []
    for club in clubs:
        result.append({
            'id': club.id,
            'name': club.name,
            'slug': club.slug,
            'logo_url': club.logo_url,
            'primary_color': club.primary_color,
            'sport': club.sport,
        })
    return jsonify(result), 200

@registration_bp.route('/upload-photo', methods=['POST'])
def upload_athlete_photo():
    """
    Upload an athlete profile photo (used during registration)
    Returns the URL of the uploaded image
    """
    if 'file' not in request.files:
        return jsonify({"error": "No se proporcionó archivo"}), 400

    file = request.files['file']
    if file.filename == '' or not allowed_file(file.filename):
        return jsonify({"error": "Tipo de archivo no válido. Permitidos: png, jpg, jpeg, gif, webp"}), 400

    # Save file with unique name
    ext = file.filename.rsplit('.', 1)[1].lower()
    filename = f"athlete_{uuid.uuid4().hex}.{ext}"
    
    upload_dir = os.path.join(current_app.root_path, 'static', 'uploads', 'profiles')
    os.makedirs(upload_dir, exist_ok=True)
    
    filepath = os.path.join(upload_dir, filename)
    file.save(filepath)

    url = f"/static/uploads/profiles/{filename}"
    return jsonify({"url": url, "filename": filename}), 200


@registration_bp.route('/register', methods=['POST'])
def register_athlete():
    """Register a new athlete (self-registration)"""
    data = request.get_json()
    
    if not data:
        return jsonify({"error": "Datos requeridos"}), 400
    
    # Standardize all input data
    data = standardize_data(data, {
        'first_name': 'standardize_name',
        'last_name': 'standardize_name',
        'email': 'lower',
        'phone': 'phone',
        'identification_number': 'upper',
        'address': 'standardize_text',
    })
    
    # Validate required fields
    required = ['club_id', 'first_name', 'last_name', 'identification_number', 'password']
    for field in required:
        if not data.get(field):
            return jsonify({"error": f"El campo {field} es requerido"}), 400
    
    # Validate club exists
    club = Club.query.get(data['club_id'])
    if not club:
        return jsonify({"error": "Club no encontrado"}), 404
    
    # Check if identification number already exists in this club
    existing = User.query.filter_by(
        identification_number=data['identification_number'],
        club_id=club.id
    ).first()
    if existing:
        return jsonify({"error": "Ya existe un usuario con este número de identificación en este club"}), 400
    
    # Validate email uniqueness if provided
    if data.get('email'):
        existing_email = User.query.filter_by(email=data['email']).first()
        if existing_email:
            return jsonify({"error": "Este email ya está registrado"}), 400
    
    # Validate password length
    if len(data['password']) < 6:
        return jsonify({"error": "La contraseña debe tener al menos 6 caracteres"}), 400
    
    # Create user
    hashed_password = bcrypt.generate_password_hash(data['password']).decode('utf-8')
    user = User(
        club_id=club.id,
        first_name=data['first_name'],
        last_name=data['last_name'],
        email=data.get('email', ''),
        phone=data.get('phone', ''),
        identification_number=data['identification_number'],
        password_hash=hashed_password,
        role='ATHLETE',
        is_active=True,
    )
    db.session.add(user)
    db.session.flush()  # Get user ID
    
    # Create athlete profile
    athlete = Athlete(
        user_id=user.id,
        birth_date=None,
        phone=data.get('phone', ''),
        address=data.get('address', ''),
        photo_url=data.get('photo_url', None),
    )
    
    # Parse birth_date if provided
    if data.get('birth_date'):
        try:
            athlete.birth_date = date.fromisoformat(data['birth_date'])
        except:
            pass
    
    db.session.add(athlete)
    db.session.flush()
    
    # Create guardian if provided
    if data.get('guardian_name'):
        guardian = Guardian(
            athlete_id=athlete.id,
            name=standardize_name(data['guardian_name']),
            relationship=data.get('guardian_relationship', ''),
            phone=phone_clean(data.get('guardian_phone', '')),
            email=standardize_lower(data.get('guardian_email', '')),
        )
        db.session.add(guardian)
    
    # Create medical info if provided
    if data.get('blood_type') or data.get('allergies') or data.get('medical_conditions') or data.get('emergency_contact'):
        medical = MedicalInfo(
            athlete_id=athlete.id,
            blood_type=standardize_upper(data.get('blood_type', '')),
            allergies=data.get('allergies', ''),
            conditions=data.get('medical_conditions', ''),
            emergency_contact=data.get('emergency_contact', ''),
        )
        db.session.add(medical)
    
    # Create academic info if provided
    if data.get('school_name') or data.get('grade'):
        academic = AcademicInfo(
            athlete_id=athlete.id,
            school_name=standardize_name(data.get('school_name', '')),
            grade=data.get('grade', ''),
        )
        db.session.add(academic)
    
    db.session.commit()
    
    return jsonify({
        "message": "Registro exitoso. Ahora puedes iniciar sesión.",
        "user_id": user.id,
        "club_slug": club.slug,
    }), 201


def phone_clean(value):
    """Clean phone number helper"""
    if not value or not isinstance(value, str):
        return value
    import re
    return re.sub(r'[^\d+]', '', value.strip())


def standardize_lower(value):
    """Lowercase helper"""
    if not value or not isinstance(value, str):
        return value
    return value.strip().lower()


def standardize_upper(value):
    """Uppercase helper"""
    if not value or not isinstance(value, str):
        return value
    return value.strip().upper()


def standardize_name(value):
    """Name standardization helper"""
    if not value or not isinstance(value, str):
        return value
    value = value.strip()
    if not value:
        return value
    words = value.split()
    result = []
    for word in words:
        lower_word = word.lower()
        if lower_word in ('de', 'del', 'la', 'los', 'las', 'y', 'e', 'el'):
            result.append(lower_word)
        else:
            result.append(word.capitalize())
    if result:
        result[0] = result[0].capitalize()
    return ' '.join(result)
import os
import uuid
import base64
from flask import Blueprint, jsonify, request, current_app
from app.models.club import Club
from app.models.user import User
from app.schemas.club_schema import ClubSchema, ClubPublicSchema
from app.utils.decorators import role_required
from flask_jwt_extended import jwt_required, get_jwt_identity
from app.extensions import db

club_bp = Blueprint('clubs', __name__)
club_schema = ClubSchema()
clubs_schema = ClubSchema(many=True)
club_public_schema = ClubPublicSchema()

@club_bp.route('', methods=['GET'])
@role_required(['SUPER_ADMIN', 'ADMIN'])
def get_all_clubs():
    """
    Get All Clubs (Super Admin Only) - filters active only by default
    """
    include_inactive = request.args.get('include_inactive', 'false').lower() == 'true'
    
    if include_inactive:
        clubs = Club.query.all()
    else:
        clubs = Club.query.filter_by(is_active=True).all()
    
    result = []
    for club in clubs:
        club_data = club_schema.dump(club)
        # Add some stats
        club_data['user_count'] = User.query.filter_by(club_id=club.id).count()
        club_data['group_count'] = len(club.groups)
        # Count athletes across all groups or users
        club_data['athlete_count'] = User.query.filter_by(club_id=club.id, role='ATHLETE').count()
        result.append(club_data)
        
    return jsonify(result), 200

@club_bp.route('/<int:club_id>', methods=['GET'])
@role_required(['SUPER_ADMIN'])
def get_club_details(club_id):
    """
    Get Club Details (Super Admin Only)
    """
    club = Club.query.get_or_404(club_id)
    club_data = club_schema.dump(club)
    club_data['user_count'] = User.query.filter_by(club_id=club.id).count()
    return jsonify(club_data), 200

@club_bp.route('/public/<slug>', methods=['GET'])
def get_club_by_slug(slug):
    """
    Get Club Public Info by Slug (no auth required)
    """
    club = Club.query.filter_by(slug=slug, is_active=True).first()
    if not club:
        return jsonify({"error": "Club not found"}), 404
    return jsonify(club_public_schema.dump(club)), 200


@club_bp.route('', methods=['POST'])
@role_required(['SUPER_ADMIN'])
def create_club():
    """
    Create a New Club (Super Admin Only)
    """
    data = request.get_json()
    if Club.query.filter_by(name=data['name']).first():
        return jsonify({"error": "Club name already exists"}), 400
    
    # Validate slug uniqueness if provided
    if data.get('slug'):
        if Club.query.filter_by(slug=data['slug']).first():
            return jsonify({"error": "Slug already exists"}), 400
        
    new_club = Club(
        name=data['name'],
        slug=data.get('slug', ''),
        description=data.get('description', ''),
        sport=data.get('sport', 'Fútbol'),
        primary_color=data.get('primary_color', '#6366f1'),
        logo_url=data.get('logo_url', ''),
        welcome_message=data.get('welcome_message', ''),
        show_features=data.get('show_features', True)
    )
    db.session.add(new_club)
    db.session.commit()
    return jsonify(club_schema.dump(new_club)), 201

@club_bp.route('/<int:club_id>', methods=['PUT'])
@role_required(['SUPER_ADMIN'])
def update_club(club_id):
    """
    Update Club (Super Admin Only)
    """
    club = Club.query.get_or_404(club_id)
    data = request.get_json()
    
    if 'name' in data:
        club.name = data['name']
    if 'slug' in data:
        # Validate slug uniqueness if changing
        existing = Club.query.filter_by(slug=data['slug']).first()
        if existing and existing.id != club_id:
            return jsonify({"error": "Slug already exists"}), 400
        club.slug = data['slug']
    if 'description' in data:
        club.description = data['description']
    if 'sport' in data:
        club.sport = data['sport']
    if 'subscription_status' in data:
        club.subscription_status = data['subscription_status']
    if 'plan_type' in data:
        club.plan_type = data['plan_type']
    if 'subscription_end_date' in data:
        from datetime import datetime
        try:
            club.subscription_end_date = datetime.fromisoformat(data['subscription_end_date'])
        except:
            pass
    # Customization fields
    if 'primary_color' in data:
        club.primary_color = data['primary_color']
    if 'logo_url' in data:
        club.logo_url = data['logo_url']
    if 'welcome_message' in data:
        club.welcome_message = data['welcome_message']
    if 'show_features' in data:
        club.show_features = data['show_features']
    # Role permissions
    if 'role_permissions' in data:
        club.role_permissions = data['role_permissions']
        
    db.session.commit()
    return jsonify(club_schema.dump(club)), 200

@club_bp.route('/<int:club_id>/permissions', methods=['GET'])
@role_required(['SUPER_ADMIN', 'ADMIN'])
def get_role_permissions(club_id):
    """
    Get role permissions for a club
    """
    from flask_jwt_extended import get_jwt_identity
    current_user_id = get_jwt_identity()
    current_user = User.query.get(current_user_id)
    
    if current_user.role == 'ADMIN' and current_user.club_id != club_id:
        return jsonify({"error": "Access denied"}), 403
    
    club = Club.query.get_or_404(club_id)
    permissions = club.role_permissions or {}
    return jsonify(permissions), 200


@club_bp.route('/<int:club_id>/permissions', methods=['PUT'])
@role_required(['SUPER_ADMIN', 'ADMIN'])
def update_role_permissions(club_id):
    """
    Update role permissions for a club
    """
    from flask_jwt_extended import get_jwt_identity
    current_user_id = get_jwt_identity()
    current_user = User.query.get(current_user_id)
    
    if current_user.role == 'ADMIN' and current_user.club_id != club_id:
        return jsonify({"error": "Access denied"}), 403
    
    club = Club.query.get_or_404(club_id)
    data = request.get_json()
    
    # Merge with existing permissions
    existing = club.role_permissions or {}
    existing.update(data)
    club.role_permissions = existing
    
    db.session.commit()
    return jsonify(club.role_permissions), 200


@club_bp.route('/my-permissions', methods=['GET'])
@jwt_required()
def get_my_permissions():
    """
    Get permissions for the current user's role
    """
    from flask_jwt_extended import get_jwt_identity
    current_user_id = get_jwt_identity()
    current_user = User.query.get(current_user_id)
    
    if not current_user:
        return jsonify({"error": "User not found"}), 404
    
    club = Club.query.get(current_user.club_id)
    if not club:
        return jsonify({"error": "Club not found"}), 404
    
    permissions = club.role_permissions or {}
    user_permissions = permissions.get(current_user.role, {})
    
    return jsonify(user_permissions), 200


@club_bp.route('/<int:club_id>', methods=['DELETE'])
@role_required(['SUPER_ADMIN'])
def deactivate_club(club_id):
    """
    Deactivate Club (Soft Delete) - Super Admin Only
    """
    club = Club.query.get_or_404(club_id)
    club.is_active = False
    db.session.commit()
    return jsonify({"message": "Club desactivado correctamente"}), 200


@club_bp.route('/<int:club_id>/reactivate', methods=['PATCH'])
@role_required(['SUPER_ADMIN'])
def reactivate_club(club_id):
    """
    Reactivate Club - Super Admin Only
    """
    club = Club.query.get_or_404(club_id)
    club.is_active = True
    db.session.commit()
    return jsonify({"message": "Club reactivado correctamente"}), 200


# Allowed extensions for image uploads
ALLOWED_EXTENSIONS = {'png', 'jpg', 'jpeg', 'gif', 'webp', 'svg'}

def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS


@club_bp.route('/upload-logo', methods=['POST'])
@role_required(['SUPER_ADMIN'])
def upload_club_logo():
    """
    Upload a club logo image as Base64 (Super Admin Only)
    Converts the image to base64 and stores it directly in the database.
    No files are saved to disk.
    """
    if 'file' not in request.files:
        return jsonify({"error": "No file provided"}), 400

    file = request.files['file']
    if file.filename == '' or not allowed_file(file.filename):
        return jsonify({"error": "Invalid file type. Allowed: png, jpg, jpeg, gif, webp, svg"}), 400

    # Check file size (5MB max)
    file.seek(0, os.SEEK_END)
    file_size = file.tell()
    file.seek(0)
    if file_size > 5 * 1024 * 1024:
        return jsonify({"error": "File too large. Max 5MB"}), 400

    # Read file and convert to base64
    file_data = file.read()
    ext = file.filename.rsplit('.', 1)[1].lower()

    # Build MIME type
    mime_map = {
        'png': 'image/png',
        'jpg': 'image/jpeg',
        'jpeg': 'image/jpeg',
        'gif': 'image/gif',
        'webp': 'image/webp',
        'svg': 'image/svg+xml',
    }
    mime_type = mime_map.get(ext, 'image/png')

    # Encode to base64 data URI
    b64_string = base64.b64encode(file_data).decode('utf-8')
    data_uri = f"data:{mime_type};base64,{b64_string}"

    return jsonify({"url": data_uri, "filename": file.filename}), 200
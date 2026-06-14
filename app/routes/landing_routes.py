import os
import uuid
from flask import Blueprint, request, jsonify, current_app
from flask_jwt_extended import jwt_required, get_jwt_identity
from werkzeug.utils import secure_filename
from app.services.landing_service import LandingService
from app.models.user import User
from app.extensions import db

landing_bp = Blueprint('landing', __name__)

# Allowed extensions for image uploads
ALLOWED_EXTENSIONS = {'png', 'jpg', 'jpeg', 'gif', 'webp', 'svg'}

def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

@landing_bp.route('/landing/<club_slug>', methods=['GET'])
def get_public_landing(club_slug):
    """
    Get public landing page for a club (no auth required)
    ---
    tags:
      - Landing
    """
    result = LandingService.get_public_by_club_slug(club_slug)
    if not result:
        return jsonify({"error": "Club not found"}), 404
    return jsonify(result), 200

@landing_bp.route('/landing/manage', methods=['GET'])
@jwt_required()
def get_landing():
    """
    Get landing page for admin editing
    ---
    tags:
      - Landing
    """
    current_user_id = get_jwt_identity()
    user = User.query.get(current_user_id)

    if not user:
        return jsonify({"error": "User not found"}), 404

    # SUPER_ADMIN can access any club's landing, ADMIN only their own
    club_id = user.club_id
    if user.role == 'SUPER_ADMIN' and request.args.get('club_id'):
        club_id = int(request.args.get('club_id'))

    if not club_id and user.role != 'SUPER_ADMIN':
        return jsonify({"error": "No club assigned"}), 400

    landing = LandingService.get_by_club_id(club_id)

    # Also get club info
    from app.models.club import Club
    club = Club.query.get(club_id)

    if not landing:
        return jsonify({
            'club': {
                'id': club.id,
                'name': club.name,
                'slug': club.slug,
                'primary_color': club.primary_color,
                'logo_url': club.logo_url,
            },
            'landing': None
        }), 200

    from app.services.landing_service import LandingService as LS
    result = LS.get_public_by_club_slug(club.slug)
    return jsonify(result), 200

@landing_bp.route('/landing/manage', methods=['PUT'])
@jwt_required()
def update_landing():
    """
    Create or update landing page
    ---
    tags:
      - Landing
    """
    current_user_id = get_jwt_identity()
    user = User.query.get(current_user_id)

    if not user:
        return jsonify({"error": "User not found"}), 404

    if user.role not in ['ADMIN', 'SUPER_ADMIN']:
        return jsonify({"error": "Not authorized"}), 403

    club_id = user.club_id
    if user.role == 'SUPER_ADMIN' and request.args.get('club_id'):
        club_id = int(request.args.get('club_id'))

    if not club_id:
        return jsonify({"error": "No club assigned"}), 400

    data = request.get_json()
    landing = LandingService.create_or_update(club_id, data)

    return jsonify({"message": "Landing page updated successfully"}), 200

@landing_bp.route('/landing/upload-image', methods=['POST'])
@jwt_required()
def upload_image():
    """
    Upload an image for the landing page
    ---
    tags:
      - Landing
    """
    current_user_id = get_jwt_identity()
    user = User.query.get(current_user_id)

    if not user:
        return jsonify({"error": "User not found"}), 404

    if user.role not in ['ADMIN', 'SUPER_ADMIN']:
        return jsonify({"error": "Not authorized"}), 403

    if 'file' not in request.files:
        return jsonify({"error": "No file provided"}), 400

    file = request.files['file']
    if file.filename == '' or not allowed_file(file.filename):
        return jsonify({"error": "Invalid file type. Allowed: png, jpg, jpeg, gif, webp, svg"}), 400

    # Create upload directory if it doesn't exist
    club_id = user.club_id or 'common'
    upload_dir = os.path.join(current_app.root_path, 'static', 'uploads', f'club_{club_id}')
    os.makedirs(upload_dir, exist_ok=True)

    # Save file with unique name
    ext = file.filename.rsplit('.', 1)[1].lower()
    filename = f"{uuid.uuid4().hex}.{ext}"
    filepath = os.path.join(upload_dir, filename)
    file.save(filepath)

    # Return the URL path
    url = f"/static/uploads/club_{club_id}/{filename}"

    return jsonify({"url": url, "filename": filename}), 200

@landing_bp.route('/landing/manage', methods=['DELETE'])
@jwt_required()
def delete_landing():
    """
    Delete landing page configuration
    ---
    tags:
      - Landing
    """
    current_user_id = get_jwt_identity()
    user = User.query.get(current_user_id)

    if not user:
        return jsonify({"error": "User not found"}), 404

    if user.role not in ['ADMIN', 'SUPER_ADMIN']:
        return jsonify({"error": "Not authorized"}), 403

    club_id = user.club_id
    if user.role == 'SUPER_ADMIN' and request.args.get('club_id'):
        club_id = int(request.args.get('club_id'))

    if LandingService.delete(club_id):
        return jsonify({"message": "Landing page deleted"}), 200
    return jsonify({"error": "Landing page not found"}), 404
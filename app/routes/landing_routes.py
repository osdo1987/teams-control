import os
import uuid
import base64
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
    Upload an image for the landing page as Base64
    Converts the image to base64 and returns a data URI.
    No files are saved to disk.
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

    # Check file size (5MB max)
    file.seek(0, os.SEEK_END)
    file_size = file.tell()
    file.seek(0)
    if file_size > 5 * 1024 * 1024:
        return jsonify({"error": "File too large. Max 5MB"}), 400

    # Read file and convert to base64
    file_data = file.read()
    ext = file.filename.rsplit('.', 1)[1].lower()

    mime_map = {
        'png': 'image/png',
        'jpg': 'image/jpeg',
        'jpeg': 'image/jpeg',
        'gif': 'image/gif',
        'webp': 'image/webp',
        'svg': 'image/svg+xml',
    }
    mime_type = mime_map.get(ext, 'image/png')

    b64_string = base64.b64encode(file_data).decode('utf-8')
    data_uri = f"data:{mime_type};base64,{b64_string}"

    return jsonify({"url": data_uri, "filename": file.filename}), 200

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
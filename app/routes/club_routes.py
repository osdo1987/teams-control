from flask import Blueprint, jsonify, request
from app.models.club import Club
from app.models.user import User
from app.schemas.club_schema import ClubSchema
from app.utils.decorators import role_required
from flask_jwt_extended import jwt_required
from app.extensions import db

club_bp = Blueprint('clubs', __name__)
club_schema = ClubSchema()
clubs_schema = ClubSchema(many=True)

@club_bp.route('', methods=['GET'])
@role_required(['SUPER_ADMIN', 'ADMIN'])
def get_all_clubs():
    """
    Get All Clubs (Super Admin Only)
    """
    clubs = Club.query.all()
    result = []
    for club in clubs:
        club_data = clubs_schema.dump([club])[0]
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

@club_bp.route('', methods=['POST'])
@role_required(['SUPER_ADMIN'])
def create_club():
    """
    Create a New Club (Super Admin Only)
    """
    data = request.get_json()
    if Club.query.filter_by(name=data['name']).first():
        return jsonify({"error": "Club name already exists"}), 400
        
    new_club = Club(
        name=data['name'],
        description=data.get('description', ''),
        sport=data.get('sport', 'Fútbol')
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
        
    db.session.commit()
    return jsonify(club_schema.dump(club)), 200

@club_bp.route('/<int:club_id>', methods=['DELETE'])
@role_required(['SUPER_ADMIN'])
def delete_club(club_id):
    """
    Delete Club (Super Admin Only)
    """
    club = Club.query.get_or_404(club_id)
    
    # Check if there are users associated
    user_count = User.query.filter_by(club_id=club_id).count()
    if user_count > 0:
        return jsonify({"error": f"Cannot delete club. It has {user_count} associated users."}), 400
        
    db.session.delete(club)
    db.session.commit()
    return jsonify({"message": "Club deleted successfully"}), 200

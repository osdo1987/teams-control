from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from app.services.athlete_service import AthleteService
from app.schemas.athlete_schema import AthleteSchema
from app.utils.decorators import role_required

athlete_bp = Blueprint('athletes', __name__)
athlete_schema = AthleteSchema()
athletes_schema = AthleteSchema(many=True)

@athlete_bp.route('', methods=['GET'])
@jwt_required()
@role_required(['ADMIN', 'TRAINER'])
def get_all_athletes():
    """
    Get All Athletes
    """
    athletes = AthleteService.get_all_athletes()
    return jsonify(athletes_schema.dump(athletes)), 200

@athlete_bp.route('', methods=['POST'])
@jwt_required()
@role_required(['ADMIN', 'TRAINER'])
def create_athlete():
    """
    Create a New Athlete
    ---
    tags:
      - Athletes
    security:
      - JWT: []
    parameters:
      - name: body
        in: body
        required: true
        schema:
          type: object
          properties:
            user:
              type: object
              properties:
                email: {type: string, example: "newathlete@example.com"}
                first_name: {type: string, example: "John"}
                last_name: {type: string, example: "Doe"}
                club_id: {type: integer, example: 1}
            athlete:
              type: object
              properties:
                birth_date: {type: string, example: "2010-01-01"}
                phone: {type: string, example: "555-1212"}
    responses:
      201:
        description: Athlete created successfully
      403:
        description: Role required
    """
    data = request.get_json()
    athlete = AthleteService.create_athlete(data['user'], data['athlete'])
    return jsonify(athlete_schema.dump(athlete)), 201

@athlete_bp.route('/profile', methods=['PUT'])
@jwt_required()
def update_profile():
    """
    Update Athlete Profile (Self)
    ---
    tags:
      - Athletes
    security:
      - JWT: []
    parameters:
      - name: body
        in: body
        required: true
        schema:
          type: object
          properties:
            medical_info:
              type: object
              properties:
                blood_type: {type: string, example: "O+"}
                allergies: {type: string, example: "Peanuts"}
            academic_info:
              type: object
              properties:
                school_name: {type: string, example: "Central High"}
    responses:
      200:
        description: Profile updated successfully
      404:
        description: Athlete not found
    """
    user_id = get_jwt_identity()
    from app.models.athlete import Athlete
    athlete = Athlete.query.filter_by(user_id=user_id).first()
    if not athlete:
        return jsonify({"error": "Athlete not found"}), 404
    
    data = request.get_json()
    updated = AthleteService.update_profile(athlete.id, data)
    return jsonify(athlete_schema.dump(updated)), 200

@athlete_bp.route('/<int:id>', methods=['GET'])
@jwt_required()
def get_athlete(id):
    """
    Get Athlete by ID
    ---
    tags:
      - Athletes
    security:
      - JWT: []
    parameters:
      - name: id
        in: path
        required: true
        type: integer
    responses:
      200:
        description: Athlete details
      404:
        description: Not found
    """
    athlete = AthleteService.get_athlete_by_id(id)
    if not athlete:
        return jsonify({"error": "Not found"}), 404
    return jsonify(athlete_schema.dump(athlete)), 200

@athlete_bp.route('/<int:id>', methods=['PUT'])
@jwt_required()
@role_required(['ADMIN', 'TRAINER'])
def update_athlete(id):
    """
    Update Athlete (Admin/Trainer)
    """
    data = request.get_json()
    from app.models.athlete import Athlete
    from app.models.user import User
    athlete = Athlete.query.get_or_404(id)
    user = User.query.get(athlete.user_id)
    
    if 'user' in data:
        for k, v in data['user'].items():
            if hasattr(user, k) and k != 'password':
                setattr(user, k, v)
    
    if 'athlete' in data:
        for k, v in data['athlete'].items():
            if hasattr(athlete, k):
                setattr(athlete, k, v)
                
    db.session.commit()
    return jsonify(athlete_schema.dump(athlete)), 200

@athlete_bp.route('/<int:id>', methods=['DELETE'])
@jwt_required()
@role_required(['ADMIN'])
def delete_athlete(id):
    """
    Delete Athlete (Admin Only)
    """
    success, message = AthleteService.delete_athlete(id)
    if success:
        return jsonify({"message": message}), 200
    return jsonify({"error": message}), 404

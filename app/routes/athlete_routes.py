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

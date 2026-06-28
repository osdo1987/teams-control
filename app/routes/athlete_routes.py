from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from app.services.athlete_service import AthleteService
from app.services.user_service import UserService
from app.schemas.athlete_schema import AthleteSchema
from app.schemas.create_athlete_schema import CreateAthleteSchema, UpdateAthleteSchema
from app.utils.decorators import role_required
from app.exceptions import NotFoundError
from app.models.athlete import Athlete
from app.models.user import User

athlete_bp = Blueprint('athletes', __name__)
athlete_schema = AthleteSchema()
athletes_schema = AthleteSchema(many=True)


@athlete_bp.route('', methods=['GET'])
@jwt_required()
@role_required(['SUPER_ADMIN', 'ADMIN', 'TRAINER'])
def get_all_athletes():
    """Get all athletes with optional filtering by club and active status."""
    current_user = UserService.get_current_user()
    include_inactive = request.args.get('include_inactive', 'false').lower() == 'true'

    athletes = AthleteService.get_all_athletes(
        club_id=current_user.club_id,
        include_inactive=include_inactive,
        user_role=current_user.role
    )

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
    # Validate request body against schema
    schema = CreateAthleteSchema()
    data = schema.load(request.get_json())

    athlete = AthleteService.create_athlete(
        user_data=data['user'],
        athlete_data=data['athlete'],
        group_id=data.get('group_id')
    )
    return jsonify(athlete_schema.dump(athlete)), 201


@athlete_bp.route('/profile', methods=['GET'])
@jwt_required()
def get_my_profile():
    """Get current athlete's own profile."""
    user_id = get_jwt_identity()
    athlete = Athlete.query.filter_by(user_id=user_id).first()
    if not athlete:
        raise NotFoundError("Athlete profile not found")
    return jsonify(athlete_schema.dump(athlete)), 200


@athlete_bp.route('/profile', methods=['PUT'])
@jwt_required()
def update_profile():
    """Update current athlete's own profile."""
    user_id = get_jwt_identity()
    athlete = Athlete.query.filter_by(user_id=user_id).first()
    if not athlete:
        raise NotFoundError("Athlete profile not found")

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
    return jsonify(athlete_schema.dump(athlete)), 200


@athlete_bp.route('/<int:id>', methods=['PUT'])
@jwt_required()
@role_required(['ADMIN', 'TRAINER'])
def update_athlete(id):
    """
    Update Athlete (Admin/Trainer)
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
      - name: body
        in: body
        required: true
        schema:
          type: object
          properties:
            user: {type: object}
            athlete: {type: object}
            group_id: {type: integer}
    responses:
      200:
        description: Athlete updated successfully
    """
    # Validate request body
    schema = UpdateAthleteSchema()
    data = schema.load(request.get_json())

    # Update profile fields
    athlete_data = data.get('athlete', {})
    if athlete_data:
        AthleteService.update_profile(id, data)

    # Transfer group if specified
    group_id = data.get('group_id')
    if group_id is not None:
        athlete = AthleteService.transfer_group(id, group_id)
    else:
        athlete = AthleteService.get_athlete_by_id(id)

    return jsonify(athlete_schema.dump(athlete)), 200


@athlete_bp.route('/<int:id>', methods=['DELETE'])
@jwt_required()
@role_required(['ADMIN'])
def delete_athlete(id):
    """Deactivate Athlete (Soft Delete)."""
    success, message = AthleteService.delete_athlete(id)
    return jsonify({"message": message}), 200


@athlete_bp.route('/<int:id>/reactivate', methods=['PATCH'])
@jwt_required()
@role_required(['ADMIN'])
def reactivate_athlete(id):
    """Reactivate a soft-deleted athlete."""
    success, message = AthleteService.reactivate_athlete(id)
    return jsonify({"message": message}), 200

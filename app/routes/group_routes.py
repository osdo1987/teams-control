from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required
from app.services.group_service import GroupService
from app.services.user_service import UserService
from app.schemas.group_schema import GroupSchema
from app.schemas.athlete_schema import AthleteSchema
from app.utils.decorators import role_required
from app.models.group import GroupHistory

group_bp = Blueprint('groups', __name__)
group_schema = GroupSchema()
groups_schema = GroupSchema(many=True)


@group_bp.route('', methods=['GET'])
@jwt_required()
def get_groups():
    """Get groups filtered by user role and club."""
    current_user = UserService.get_current_user()
    include_inactive = request.args.get('include_inactive', 'false').lower() == 'true'

    groups = GroupService.get_groups(
        club_id=current_user.club_id,
        user_role=current_user.role,
        user=current_user,
        include_inactive=include_inactive
    )

    return jsonify(groups_schema.dump(groups)), 200


@group_bp.route('', methods=['POST'])
@jwt_required()
@role_required(['ADMIN'])
def create_group():
    """
    Create a New Group (Admin Only) — requires trainer assignment
    ---
    tags:
      - Groups
    parameters:
      - name: body
        in: body
        required: true
        schema:
          type: object
          properties:
            name: {type: string, example: "Soccer U-15"}
            club_id: {type: integer, example: 1}
            category: {type: string, example: "Sub-15"}
            sport: {type: string, example: "Fútbol"}
            schedule: {type: string, example: "Lun-Mie-Vie 5PM"}
            schedule_days: {type: string, example: "Lunes,Miércoles,Viernes"}
            schedule_start_time: {type: string, example: "17:00"}
            schedule_end_time: {type: string, example: "19:00"}
            training_location: {type: string, example: "Cancha Principal"}
            max_capacity: {type: integer, example: 25}
            level: {type: string, example: "Intermedio"}
            monthly_fee: {type: number, example: 120000}
            trainer_ids: {type: array, items: {type: integer}, example: [2]}
    responses:
      201:
        description: Group created
      400:
        description: Trainer assignment required
    """
    data = request.get_json()
    group = GroupService.create_group(data)
    return jsonify(group_schema.dump(group)), 201


@group_bp.route('/<int:group_id>/assign', methods=['POST'])
@jwt_required()
@role_required(['ADMIN', 'TRAINER'])
def assign_athlete(group_id):
    """
    Assign Athlete to Group
    ---
    tags:
      - Groups
    security:
      - JWT: []
    parameters:
      - name: group_id
        in: path
        required: true
        type: integer
      - name: body
        in: body
        required: true
        schema:
          type: object
          properties:
            athlete_id: {type: integer, example: 1}
    responses:
      200:
        description: Athlete assigned successfully
      400:
        description: Error in assignment
    """
    data = request.get_json()
    athlete_id = data.get('athlete_id')
    success, message = GroupService.assign_athlete_to_group(athlete_id, group_id)
    return jsonify({"message": message}), 200


@group_bp.route('/<int:group_id>/athletes', methods=['GET'])
@jwt_required()
def get_group_members(group_id):
    """Get all athletes in a group."""
    athletes = GroupService.get_group_athletes(group_id)
    return jsonify(AthleteSchema(many=True).dump(athletes)), 200


@group_bp.route('/history/athlete/<int:athlete_id>', methods=['GET'])
@jwt_required()
def get_athlete_history(athlete_id):
    """Get group change history for an athlete."""
    from app.schemas.group_schema import GroupHistorySchema
    history = GroupHistory.query.filter_by(
        athlete_id=athlete_id
    ).order_by(GroupHistory.date.desc()).all()
    return jsonify(GroupHistorySchema(many=True).dump(history)), 200


@group_bp.route('/change-athlete', methods=['POST'])
@jwt_required()
@role_required(['ADMIN', 'TRAINER'])
def change_athlete():
    """
    Change Athlete's Group
    ---
    tags:
      - Groups
    security:
      - JWT: []
    parameters:
      - name: body
        in: body
        required: true
        schema:
          type: object
          properties:
            athlete_id: {type: integer, example: 1}
            old_group_id: {type: integer, example: 1}
            new_group_id: {type: integer, example: 2}
    responses:
      200:
        description: Athlete changed group successfully
      400:
        description: Error in changing group
    """
    data = request.get_json()
    athlete_id = data.get('athlete_id')
    old_group_id = data.get('old_group_id')
    new_group_id = data.get('new_group_id')

    success, message = GroupService.change_athlete_group(
        athlete_id, old_group_id, new_group_id
    )
    return jsonify({"message": message}), 200


@group_bp.route('/<int:id>', methods=['PUT'])
@jwt_required()
@role_required(['ADMIN'])
def update_group(id):
    """
    Update Group
    ---
    tags:
      - Groups
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
    responses:
      200:
        description: Group updated
    """
    data = request.get_json()
    group = GroupService.update_group(id, data)
    return jsonify(group_schema.dump(group)), 200


@group_bp.route('/<int:id>', methods=['DELETE'])
@jwt_required()
@role_required(['ADMIN'])
def delete_group(id):
    """Deactivate Group (Soft Delete)."""
    success, message = GroupService.delete_group(id)
    return jsonify({"message": message}), 200


@group_bp.route('/<int:id>/reactivate', methods=['PATCH'])
@jwt_required()
@role_required(['ADMIN'])
def reactivate_group(id):
    """Reactivate a soft-deleted group."""
    success, message = GroupService.reactivate_group(id)
    return jsonify({"message": message}), 200
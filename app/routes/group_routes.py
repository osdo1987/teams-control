from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required
from app.services.group_service import GroupService
from app.schemas.group_schema import GroupSchema
from app.schemas.athlete_schema import AthleteSchema
from app.utils.decorators import role_required

group_bp = Blueprint('groups', __name__)
group_schema = GroupSchema()
groups_schema = GroupSchema(many=True)

@group_bp.route('', methods=['GET'])
@jwt_required()
def get_groups():
    """
    Get All Groups
    ---
    tags:
      - Groups
    responses:
      200:
        description: List of groups
    """
    from app.models.group import Group
    groups = Group.query.all()
    return jsonify(groups_schema.dump(groups)), 200

@group_bp.route('', methods=['POST'])
@jwt_required()
@role_required(['ADMIN'])
def create_group():
    """
    Create a New Group (Admin Only)
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
            schedule: {type: string, example: "MWF 5PM"}
    responses:
      201:
        description: Group created
    """
    from app import db
    from app.models.group import Group
    data = request.get_json()
    group = Group(name=data['name'], club_id=data['club_id'], schedule=data.get('schedule'))
    db.session.add(group)
    db.session.commit()
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
    if success:
        return jsonify({"message": message}), 200
    return jsonify({"error": message}), 400

@group_bp.route('/<int:group_id>/athletes', methods=['GET'])
@jwt_required()
def get_group_members(group_id):
    """
    Get All Athletes in a Group
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
    responses:
      200:
        description: List of athletes in the group
    """
    athletes = GroupService.get_group_athletes(group_id)
    return jsonify(AthleteSchema(many=True).dump(athletes)), 200

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
    
    success, message = GroupService.change_athlete_group(athlete_id, old_group_id, new_group_id)
    if success:
        return jsonify({"message": message}), 200
    return jsonify({"error": message}), 400

@group_bp.route('/<int:id>', methods=['PUT'])
@jwt_required()
@role_required(['ADMIN'])
def update_group(id):
    """
    Update Group
    """
    from app import db
    from app.models.group import Group
    group = Group.query.get_or_404(id)
    data = request.get_json()
    
    if 'name' in data: group.name = data['name']
    if 'schedule' in data: group.schedule = data['schedule']
    if 'club_id' in data: group.club_id = data['club_id']
    
    db.session.commit()
    return jsonify(group_schema.dump(group)), 200

@group_bp.route('/<int:id>', methods=['DELETE'])
@jwt_required()
@role_required(['ADMIN'])
def delete_group(id):
    """
    Delete Group
    """
    success, message = GroupService.delete_group(id)
    if success:
        return jsonify({"message": message}), 200
    return jsonify({"error": message}), 404

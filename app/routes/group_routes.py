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
    from app.models.group import Group
    from app.models.user import User
    from flask_jwt_extended import get_jwt_identity

    current_user_id = get_jwt_identity()
    user = User.query.get(current_user_id)

    if user.role == 'SUPER_ADMIN':
        groups = Group.query.all()
    else:
        groups = Group.query.filter_by(club_id=user.club_id).all()
        
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
    from app import db
    from app.models.group import Group
    from app.models.user import User
    data = request.get_json()

    # Validar que se asigne al menos un entrenador
    trainer_ids = data.get('trainer_ids', [])
    if not trainer_ids:
        return jsonify({"error": "Debe asignar al menos un entrenador al grupo"}), 400

    # Verificar que los trainers existan y sean TRAINER
    trainers = User.query.filter(User.id.in_(trainer_ids), User.role == 'TRAINER').all()
    if len(trainers) != len(trainer_ids):
        return jsonify({"error": "Uno o más entrenadores no fueron encontrados o no tienen rol TRAINER"}), 400

    group = Group(
        name=data['name'],
        club_id=data['club_id'],
        category_id=data.get('category_id'),
        description=data.get('description'),
        max_capacity=data.get('max_capacity'),
        schedule=data.get('schedule'),
        schedule_days=data.get('schedule_days'),
        schedule_start_time=data.get('schedule_start_time'),
        schedule_end_time=data.get('schedule_end_time'),
        training_location=data.get('training_location'),
        level=data.get('level'),
        season=data.get('season'),
        monthly_fee=data.get('monthly_fee')
    )
    
    # Asignar entrenadores
    for trainer in trainers:
        group.trainers.append(trainer)

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
    athletes = GroupService.get_group_athletes(group_id)
    return jsonify(AthleteSchema(many=True).dump(athletes)), 200

@group_bp.route('/history/athlete/<int:athlete_id>', methods=['GET'])
@jwt_required()
def get_athlete_history(athlete_id):
    from app.models.group import GroupHistory
    from app.schemas.group_schema import GroupHistorySchema
    history = GroupHistory.query.filter_by(athlete_id=athlete_id).order_by(GroupHistory.date.desc()).all()
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
    from app.models.user import User
    group = Group.query.get_or_404(id)
    data = request.get_json()
    
    simple_fields = [
        'name', 'schedule', 'club_id', 'category_id', 'description',
        'max_capacity', 'schedule_days', 'schedule_start_time', 'schedule_end_time',
        'training_location', 'status', 'level', 'season', 'monthly_fee'
    ]
    for field in simple_fields:
        if field in data:
            setattr(group, field, data[field])

    # Actualizar entrenadores si se envían
    if 'trainer_ids' in data:
        trainer_ids = data['trainer_ids']
        if not trainer_ids:
            return jsonify({"error": "Debe asignar al menos un entrenador al grupo"}), 400
        trainers = User.query.filter(User.id.in_(trainer_ids), User.role == 'TRAINER').all()
        if len(trainers) != len(trainer_ids):
            return jsonify({"error": "Uno o más entrenadores no fueron encontrados"}), 400
        group.trainers = trainers
    
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

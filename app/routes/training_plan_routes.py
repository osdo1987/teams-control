from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from app.services.training_plan_service import TrainingPlanService
from app.schemas.training_plan_schema import TrainingPlanSchema, TrainingPlanAssignmentSchema
from app.utils.decorators import role_required
from app.models.user import User

training_plan_bp = Blueprint('training_plans', __name__)
plan_schema = TrainingPlanSchema()
plans_schema = TrainingPlanSchema(many=True)
assignment_schema = TrainingPlanAssignmentSchema()
assignments_schema = TrainingPlanAssignmentSchema(many=True)

@training_plan_bp.route('', methods=['GET'])
@jwt_required()
@role_required(['SUPER_ADMIN', 'ADMIN', 'TRAINER'])
def get_plans():
    current_user_id = get_jwt_identity()
    user = User.query.get(current_user_id)
    # Default to user's club_id, or allow super_admin to pass club_id query arg
    club_id = user.club_id if user.role != 'SUPER_ADMIN' else request.args.get('club_id', type=int)
    if not club_id:
        return jsonify({"error": "club_id is required"}), 400
    plans = TrainingPlanService.get_plans(club_id=club_id)
    return jsonify(plans_schema.dump(plans)), 200


@training_plan_bp.route('/<int:plan_id>', methods=['GET'])
@jwt_required()
@role_required(['SUPER_ADMIN', 'ADMIN', 'TRAINER', 'ATHLETE'])
def get_plan(plan_id):
    plan = TrainingPlanService.get_plan(plan_id)
    if not plan:
        return jsonify({"error": "Training plan not found"}), 404
    return jsonify(plan_schema.dump(plan)), 200


@training_plan_bp.route('', methods=['POST'])
@jwt_required()
@role_required(['ADMIN', 'TRAINER'])
def create_plan():
    user_id = get_jwt_identity()
    user = User.query.get(user_id)
    if not user or not user.club_id:
        return jsonify({"error": "User does not belong to a club"}), 400
    data = request.get_json()
    plan = TrainingPlanService.create_plan(data, user_id, user.club_id)
    return jsonify(plan_schema.dump(plan)), 201


@training_plan_bp.route('/<int:plan_id>', methods=['PUT'])
@jwt_required()
@role_required(['ADMIN', 'TRAINER'])
def update_plan(plan_id):
    data = request.get_json()
    plan = TrainingPlanService.update_plan(plan_id, data)
    if not plan:
        return jsonify({"error": "Training plan not found"}), 404
    return jsonify(plan_schema.dump(plan)), 200


@training_plan_bp.route('/<int:plan_id>', methods=['DELETE'])
@jwt_required()
@role_required(['ADMIN', 'TRAINER'])
def delete_plan(plan_id):
    success = TrainingPlanService.delete_plan(plan_id)
    if not success:
        return jsonify({"error": "Training plan not found"}), 404
    return jsonify({"message": "Training plan deleted successfully"}), 200


@training_plan_bp.route('/<int:plan_id>/assign', methods=['POST'])
@jwt_required()
@role_required(['ADMIN', 'TRAINER'])
def assign_plan(plan_id):
    data = request.get_json()
    assignment = TrainingPlanService.assign_plan(plan_id, data)
    return jsonify(assignment_schema.dump(assignment)), 201


@training_plan_bp.route('/assignments/<int:assignment_id>', methods=['DELETE'])
@jwt_required()
@role_required(['ADMIN', 'TRAINER'])
def delete_assignment(assignment_id):
    success = TrainingPlanService.delete_assignment(assignment_id)
    if not success:
        return jsonify({"error": "Assignment not found"}), 404
    return jsonify({"message": "Assignment deleted successfully"}), 200


@training_plan_bp.route('/athlete/<int:athlete_id>', methods=['GET'])
@jwt_required()
@role_required(['SUPER_ADMIN', 'ADMIN', 'TRAINER', 'ATHLETE'])
def get_athlete_plans(athlete_id):
    assignments = TrainingPlanService.get_athlete_assignments(athlete_id)
    return jsonify(assignments_schema.dump(assignments)), 200

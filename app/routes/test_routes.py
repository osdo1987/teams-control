from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from app.services.test_service import TestService
from app.schemas.test_schema import TestTemplateSchema, TestResultSchema, TestSessionSchema
from app.utils.decorators import role_required
from app.models.user import User

test_bp = Blueprint('tests', __name__)
template_schema = TestTemplateSchema()
templates_schema = TestTemplateSchema(many=True)
result_schema = TestResultSchema()
results_schema = TestResultSchema(many=True)
session_schema = TestSessionSchema()
sessions_schema = TestSessionSchema(many=True)

@test_bp.route('/templates', methods=['GET'])
@jwt_required()
@role_required(['SUPER_ADMIN', 'ADMIN', 'TRAINER'])
def get_templates():
    current_user_id = get_jwt_identity()
    user = User.query.get(current_user_id)
    club_id = user.club_id if user.role != 'SUPER_ADMIN' else request.args.get('club_id', type=int)
    templates = TestService.get_templates(club_id=club_id)
    return jsonify(templates_schema.dump(templates)), 200

@test_bp.route('/templates', methods=['POST'])
@jwt_required()
@role_required(['ADMIN', 'TRAINER'])
def create_template():
    user_id = get_jwt_identity()
    user = User.query.get(user_id)
    data = request.get_json()
    data['club_id'] = user.club_id
    template = TestService.create_template(data, user_id)
    return jsonify(template_schema.dump(template)), 201

@test_bp.route('/templates/<int:template_id>', methods=['PUT'])
@jwt_required()
@role_required(['ADMIN', 'TRAINER'])
def update_template(template_id):
    data = request.get_json()
    template = TestService.update_template(template_id, data)
    if not template:
        return jsonify({"error": "Template not found or is predefined"}), 404
    return jsonify(template_schema.dump(template)), 200

@test_bp.route('/templates/<int:template_id>', methods=['DELETE'])
@jwt_required()
@role_required(['ADMIN', 'TRAINER'])
def delete_template(template_id):
    success = TestService.delete_template(template_id)
    if not success:
        return jsonify({"error": "Template not found or is predefined"}), 404
    return jsonify({"message": "Template deleted successfully"}), 200

@test_bp.route('/results', methods=['GET'])
@jwt_required()
@role_required(['SUPER_ADMIN', 'ADMIN', 'TRAINER'])
def get_results():
    template_id = request.args.get('template_id', type=int)
    athlete_id = request.args.get('athlete_id', type=int)
    results = TestService.get_results(template_id=template_id, athlete_id=athlete_id)
    return jsonify(results_schema.dump(results)), 200

@test_bp.route('/results', methods=['POST'])
@jwt_required()
@role_required(['ADMIN', 'TRAINER'])
def create_result():
    user_id = get_jwt_identity()
    data = request.get_json()
    result = TestService.create_result(data, trainer_id=user_id)
    return jsonify(result_schema.dump(result)), 201

@test_bp.route('/results/<int:result_id>', methods=['DELETE'])
@jwt_required()
@role_required(['ADMIN', 'TRAINER'])
def delete_result(result_id):
    success = TestService.delete_result(result_id)
    if not success:
        return jsonify({"error": "Result not found"}), 404
    return jsonify({"message": "Result deleted successfully"}), 200

@test_bp.route('/athletes/<int:athlete_id>/history', methods=['GET'])
@jwt_required()
@role_required(['SUPER_ADMIN', 'ADMIN', 'TRAINER'])
def get_athlete_history(athlete_id):
    template_id = request.args.get('template_id', type=int)
    results = TestService.get_athlete_history(athlete_id, template_id=template_id)
    return jsonify(results_schema.dump(results)), 200


@test_bp.route('/sessions', methods=['GET'])
@jwt_required()
@role_required(['SUPER_ADMIN', 'ADMIN', 'TRAINER'])
def get_sessions():
    current_user_id = get_jwt_identity()
    user = User.query.get(current_user_id)
    club_id = user.club_id if user.role != 'SUPER_ADMIN' else request.args.get('club_id', type=int)
    sessions = TestService.get_sessions(club_id=club_id)
    return jsonify(sessions_schema.dump(sessions)), 200


@test_bp.route('/sessions', methods=['POST'])
@jwt_required()
@role_required(['ADMIN', 'TRAINER'])
def create_session():
    user_id = get_jwt_identity()
    user = User.query.get(user_id)
    data = request.get_json()
    data['club_id'] = user.club_id
    session = TestService.create_session(data, trainer_id=user_id)
    return jsonify(session_schema.dump(session)), 201

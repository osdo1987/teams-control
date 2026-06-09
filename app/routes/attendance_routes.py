from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from app.services.attendance_service import AttendanceService
from app.schemas.attendance_schema import AttendanceSchema
from app.utils.decorators import role_required

attendance_bp = Blueprint('attendance', __name__)
attendance_schema = AttendanceSchema(many=True)

@attendance_bp.route('/group/<int:group_id>/bulk', methods=['POST'])
@jwt_required()
@role_required(['ADMIN', 'TRAINER'])
def register_bulk(group_id):
    """
    Register Bulk Attendance for a Group
    ---
    tags:
      - Attendance
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
          type: array
          items:
            type: object
            properties:
              athlete_id: {type: integer, example: 1}
              date: {type: string, example: "2023-10-01"}
              status: {type: string, example: "PRESENT"}
              notes: {type: string, example: ""}
    responses:
      200:
        description: Bulk attendance registered successfully
    """
    records = request.get_json()
    success, message = AttendanceService.register_bulk_attendance(group_id, records)
    return jsonify({"message": message}), 200

@attendance_bp.route('/athlete/<int:athlete_id>', methods=['GET'])
@jwt_required()
def get_athlete_attendance(athlete_id):
    """
    Get Athlete Attendance
    ---
    tags:
      - Attendance
    security:
      - JWT: []
    parameters:
      - name: athlete_id
        in: path
        required: true
        type: integer
    responses:
      200:
        description: List of attendance records
    """
    records = AttendanceService.get_athlete_attendance(athlete_id)
    return jsonify(attendance_schema.dump(records)), 200

@attendance_bp.route('/group/<int:group_id>', methods=['GET'])
@jwt_required()
def get_group_attendance(group_id):
    from app.models.user import User
    from app.models.group import Group
    
    current_user_id = get_jwt_identity()
    user = User.query.get(current_user_id)
    group = Group.query.get_or_404(group_id)
    
    # Verificar propiedad del club si no es Super Admin
    if user.role != 'SUPER_ADMIN' and group.club_id != user.club_id:
        return jsonify({"error": "No tiene permiso para ver la asistencia de este grupo"}), 403
        
    records = AttendanceService.get_group_attendance(group_id)
    return jsonify(attendance_schema.dump(records)), 200


@attendance_bp.route('/group/<int:group_id>/check/<date>', methods=['GET'])
@jwt_required()
@role_required(['ADMIN', 'TRAINER'])
def check_attendance(group_id, date):
    """Check if attendance has already been taken for a group on a specific date."""
    result = AttendanceService.check_attendance_taken(group_id, date)
    return jsonify(result), 200


@attendance_bp.route('/group/<int:group_id>/stats', methods=['GET'])
@jwt_required()
@role_required(['ADMIN', 'TRAINER'])
def get_group_stats(group_id):
    """Get attendance statistics for a group within a date range."""
    start_date = request.args.get('start_date')
    end_date = request.args.get('end_date')
    stats = AttendanceService.get_group_attendance_stats(group_id, start_date, end_date)
    return jsonify(stats), 200


@attendance_bp.route('/group/<int:group_id>/range', methods=['GET'])
@jwt_required()
@role_required(['ADMIN', 'TRAINER'])
def get_group_attendance_range(group_id):
    """Get attendance records for a group within a date range."""
    start_date = request.args.get('start_date')
    end_date = request.args.get('end_date')
    if not start_date or not end_date:
        return jsonify({"error": "start_date and end_date are required"}), 400
    records = AttendanceService.get_group_attendance_range(group_id, start_date, end_date)
    return jsonify(attendance_schema.dump(records)), 200

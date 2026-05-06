from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required
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
    """
    Get Group Attendance History
    """
    records = AttendanceService.get_group_attendance(group_id)
    return jsonify(attendance_schema.dump(records)), 200

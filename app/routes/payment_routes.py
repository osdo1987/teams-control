from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity, get_jwt
from app.services.payment_service import PaymentService
from app.schemas.payment_schema import PaymentSchema
from app.utils.decorators import role_required
from app.models.user import User
from app.models.athlete import Athlete

payment_bp = Blueprint('payments', __name__)
payment_schema = PaymentSchema()
payments_schema = PaymentSchema(many=True)

@payment_bp.route('', methods=['POST'])
@jwt_required()
@role_required(['ADMIN'])
def create_payment():
    """
    Register a New Payment (Admin Only)
    ---
    tags:
      - Payments
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
            amount: {type: number, example: 50.0}
            status: {type: string, example: "PAID"}
            payment_method: {type: string, example: "Cash"}
            description: {type: string, example: "Monthly Fee"}
    responses:
      201:
        description: Payment registered successfully
    """
    data = request.get_json()
    payment = PaymentService.register_payment(data)
    return jsonify(payment_schema.dump(payment)), 201

@payment_bp.route('/athlete/<int:athlete_id>', methods=['GET'])
@jwt_required()
def get_athlete_payments(athlete_id):
    """
    Get Athlete Payments (Admin or own Athlete only)
    ---
    tags:
      - Payments
    security:
      - JWT: []
    parameters:
      - name: athlete_id
        in: path
        required: true
        type: integer
    responses:
      200:
        description: List of payments
      403:
        description: Unauthorized
    """
    user_id = get_jwt_identity()
    user = User.query.get(user_id)
    
    if user.role != 'ADMIN':
        # If not ADMIN, check if the requesting user is the athlete themselves
        if user.role != 'ATHLETE' or not user.athlete_profile or user.athlete_profile.id != athlete_id:
            return jsonify({"error": "Unauthorized to view these payments"}), 403

    records = PaymentService.get_athlete_payments(athlete_id)
    return jsonify(payments_schema.dump(records)), 200

@payment_bp.route('', methods=['GET'])
@jwt_required()
@role_required(['ADMIN'])
def get_all_payments():
    """
    Get All Payments (Admin Only)
    """
    payments = PaymentService.get_all_payments()
    return jsonify(payments_schema.dump(payments)), 200

@payment_bp.route('/<int:id>', methods=['PUT'])
@jwt_required()
@role_required(['ADMIN'])
def update_payment(id):
    """
    Update Payment
    """
    data = request.get_json()
    payment = PaymentService.update_payment(id, data)
    if payment:
        return jsonify(payment_schema.dump(payment)), 200
    return jsonify({"error": "Payment not found"}), 404

@payment_bp.route('/<int:id>', methods=['DELETE'])
@jwt_required()
@role_required(['ADMIN'])
def delete_payment(id):
    """
    Delete Payment
    """
    if PaymentService.delete_payment(id):
        return jsonify({"message": "Payment deleted"}), 200
    return jsonify({"error": "Payment not found"}), 404

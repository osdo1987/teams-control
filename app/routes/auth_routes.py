from flask import Blueprint, request, jsonify
from app.services.auth_service import AuthService
from app.schemas.user_schema import LoginSchema, UserSchema

auth_bp = Blueprint('auth', __name__)
login_schema = LoginSchema()
user_schema = UserSchema()

@auth_bp.route('/login', methods=['POST'])
def login():
    """
    User Login Endpoint
    ---
    tags:
      - Auth
    parameters:
      - name: body
        in: body
        required: true
        schema:
          type: object
          properties:
            identification_number:
              type: string
              example: "1234567890"
            password:
              type: string
              example: admin123
    responses:
      200:
        description: Successful login
      400:
        description: Validation error
      401:
        description: Invalid credentials
    """
    data = request.get_json()
    errors = login_schema.validate(data)
    if errors:
        return jsonify(errors), 400
    
    result, status = AuthService.login(data['identification_number'], data['password'])
    return jsonify(result), status

@auth_bp.route('/register', methods=['POST'])
def register():
    """
    Register a New User
    ---
    tags:
      - Auth
    parameters:
      - name: body
        in: body
        required: true
        schema:
          type: object
          properties:
            identification_number:
              type: string
              example: "1234567890"
            password:
              type: string
              example: trainer123
            first_name:
              type: string
              example: John
            last_name:
              type: string
              example: Doe
            role:
              type: string
              example: TRAINER
            club_id:
              type: integer
              example: 1
    responses:
      201:
        description: User created successfully
      400:
        description: Identification number already exists
    """
    data = request.get_json()
    # Simple registration logic (usually done by ADMIN in this system)
    user, status = AuthService.register_user(data)
    if status == 201:
        return jsonify(user_schema.dump(user)), 201
    return jsonify(user), status

@auth_bp.route('/users', methods=['GET'])
def get_users():
    """
    Get All Users (Admin Only)
    ---
    tags:
      - Auth
    responses:
      200:
        description: List of users
    """
    from app.models.user import User
    users = User.query.all()
    return jsonify(UserSchema(many=True).dump(users)), 200

@auth_bp.route('/users/<int:id>', methods=['GET'])
def get_user(id):
    """
    Get Single User with full profile
    """
    from app.models.user import User
    user = User.query.get_or_404(id)
    return jsonify(UserSchema().dump(user)), 200

@auth_bp.route('/users/<int:id>', methods=['PUT'])
def update_user(id):
    """
    Update User
    """
    data = request.get_json()
    user = AuthService.update_user(id, data)
    if user:
        return jsonify(UserSchema().dump(user)), 200
    return jsonify({"error": "User not found"}), 404

@auth_bp.route('/users/<int:id>', methods=['DELETE'])
def delete_user(id):
    """
    Delete User
    """
    if AuthService.delete_user(id):
        return jsonify({"message": "User deleted"}), 200
    return jsonify({"error": "User not found"}), 404

@auth_bp.route('/trainers', methods=['GET'])
def get_trainers():
    """
    Get All Trainers - useful for dropdown selects when creating groups
    ---
    tags:
      - Auth
    responses:
      200:
        description: List of trainers
    """
    from app.models.user import User
    trainers = User.query.filter_by(role='TRAINER').all()
    return jsonify(UserSchema(many=True).dump(trainers)), 200

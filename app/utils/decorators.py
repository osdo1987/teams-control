from functools import wraps
from flask_jwt_extended import get_jwt_identity, verify_jwt_in_request, get_jwt
from flask import jsonify
from app.models.user import User

def role_required(roles):
    def decorator(fn):
        @wraps(fn)
        def wrapper(*args, **kwargs):
            verify_jwt_in_request()
            claims = get_jwt()
            user_id = get_jwt_identity()
            user = User.query.get(user_id)
            
            if not user or user.role not in roles:
                return jsonify({"error": "Unauthorized access, role required: " + str(roles)}), 403
            
            return fn(*args, **kwargs)
        return wrapper
    return decorator

def subscription_required(fn):
    @wraps(fn)
    def wrapper(*args, **kwargs):
        verify_jwt_in_request()
        user_id = get_jwt_identity()
        user = User.query.get(user_id)
        
        # Super Admin doesn't need a club subscription
        if user and user.role == 'SUPER_ADMIN':
            return fn(*args, **kwargs)
            
        if not user or not user.club:
            return jsonify({"error": "Club association required"}), 403
            
        if user.club.subscription_status not in ['ACTIVE', 'TRIAL']:
            return jsonify({
                "error": "Subscription required", 
                "status": user.club.subscription_status,
                "message": "Su suscripción ha vencido. Contacte al administrador del sistema."
            }), 402
            
        return fn(*args, **kwargs)
    return wrapper

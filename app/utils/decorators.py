from functools import wraps
from flask_jwt_extended import get_jwt_identity, verify_jwt_in_request, get_jwt
from flask import jsonify
from app.models.user import User
from app.exceptions import ForbiddenError, SubscriptionRequiredError, UnauthorizedError

def role_required(roles):
    def decorator(fn):
        @wraps(fn)
        def wrapper(*args, **kwargs):
            verify_jwt_in_request()
            user_id = get_jwt_identity()
            user = User.query.get(user_id)
            
            if not user:
                raise UnauthorizedError("Authentication required")
            
            if user.role not in roles:
                raise ForbiddenError(
                    f"Access denied. Required role: {', '.join(roles)}. Your role: {user.role}"
                )
            
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
            raise ForbiddenError("Club association required")
            
        if user.club.subscription_status not in ['ACTIVE', 'TRIAL']:
            raise SubscriptionRequiredError(
                message="Su suscripción ha vencido. Contacte al administrador del sistema.",
                payload={"status": user.club.subscription_status}
            )
            
        return fn(*args, **kwargs)
    return wrapper

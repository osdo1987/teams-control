class AppError(Exception):
    """Base exception for application errors."""
    status_code = 500
    message = "An internal error occurred"

    def __init__(self, message=None, status_code=None, payload=None):
        super().__init__(self)
        if message:
            self.message = message
        if status_code:
            self.status_code = status_code
        self.payload = payload

    def to_dict(self):
        rv = {"error": self.message, "type": self.__class__.__name__}
        if self.payload:
            rv["details"] = self.payload
        return rv


class NotFoundError(AppError):
    status_code = 404
    message = "Resource not found"


class ValidationError(AppError):
    status_code = 400
    message = "Validation failed"


class ForbiddenError(AppError):
    status_code = 403
    message = "Access denied"


class UnauthorizedError(AppError):
    status_code = 401
    message = "Authentication required"


class ConflictError(AppError):
    status_code = 409
    message = "Resource already exists"


class SubscriptionRequiredError(AppError):
    status_code = 402
    message = "Subscription required"
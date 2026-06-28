import traceback
from flask import Flask, jsonify
from app.config import Config
from app.extensions import db, migrate, jwt, ma, bcrypt, swagger
from app.exceptions import AppError, NotFoundError, ValidationError, ForbiddenError
from flask_cors import CORS
from marshmallow import ValidationError as MarshmallowValidationError

def create_app(config_class=Config):
    app = Flask(__name__)
    app.config.from_object(config_class)
    
    CORS(app)

    app.config['SWAGGER'] = {
        'title': 'Sports Club Management API',
        'uiversion': 3
    }

    db.init_app(app)
    migrate.init_app(app, db)
    jwt.init_app(app)
    ma.init_app(app)
    bcrypt.init_app(app)
    swagger.init_app(app)

    # --- Register Error Handlers ---
    @app.errorhandler(AppError)
    def handle_app_error(e):
        return jsonify(e.to_dict()), e.status_code

    @app.errorhandler(MarshmallowValidationError)
    def handle_marshmallow_error(e):
        return jsonify({
            "error": "Validation failed",
            "type": "ValidationError",
            "details": e.messages
        }), 400

    @app.errorhandler(404)
    def handle_404(e):
        return jsonify(NotFoundError().to_dict()), 404

    @app.errorhandler(405)
    def handle_405(e):
        return jsonify({
            "error": "Method not allowed",
            "type": "MethodNotAllowed"
        }), 405

    @app.errorhandler(Exception)
    def handle_unhandled_exception(e):
        # Log the full traceback for debugging
        traceback.print_exc()
        return jsonify({
            "error": "An internal error occurred",
            "type": "InternalServerError",
            "message": str(e) if app.debug else "An unexpected error occurred"
        }), 500

    # --- Import and register blueprints ---
    from app.routes.auth_routes import auth_bp
    from app.routes.athlete_routes import athlete_bp
    from app.routes.group_routes import group_bp
    from app.routes.attendance_routes import attendance_bp
    from app.routes.payment_routes import payment_bp
    from app.routes.club_routes import club_bp
    from app.routes.category_routes import category_bp
    from app.routes.stats_routes import stats_bp
    from app.routes.test_routes import test_bp
    from app.routes.landing_routes import landing_bp
    from app.routes.trainer_routes import trainer_bp
    from app.routes.registration_routes import registration_bp
    from app.routes.training_plan_routes import training_plan_bp

    app.register_blueprint(auth_bp, url_prefix='/api/auth')
    app.register_blueprint(athlete_bp, url_prefix='/api/athletes')
    app.register_blueprint(group_bp, url_prefix='/api/groups')
    app.register_blueprint(attendance_bp, url_prefix='/api/attendance')
    app.register_blueprint(payment_bp, url_prefix='/api/payments')
    app.register_blueprint(club_bp, url_prefix='/api/clubs')
    app.register_blueprint(category_bp, url_prefix='/api/categories')
    app.register_blueprint(stats_bp, url_prefix='/api/stats')
    app.register_blueprint(test_bp, url_prefix='/api/tests')
    app.register_blueprint(landing_bp, url_prefix='/api')
    app.register_blueprint(trainer_bp, url_prefix='/api/trainer')
    app.register_blueprint(registration_bp)
    app.register_blueprint(training_plan_bp, url_prefix='/api/training-plans')

    return app

from flask import Flask, jsonify
from app.config import Config
from app.extensions import db, migrate, jwt, ma, bcrypt, swagger
from flask_cors import CORS

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

    from app.routes.auth_routes import auth_bp
    from app.routes.athlete_routes import athlete_bp
    from app.routes.group_routes import group_bp
    from app.routes.attendance_routes import attendance_bp
    from app.routes.payment_routes import payment_bp
    from app.routes.club_routes import club_bp

    app.register_blueprint(auth_bp, url_prefix='/api/auth')
    app.register_blueprint(athlete_bp, url_prefix='/api/athletes')
    app.register_blueprint(group_bp, url_prefix='/api/groups')
    app.register_blueprint(attendance_bp, url_prefix='/api/attendance')
    app.register_blueprint(payment_bp, url_prefix='/api/payments')
    app.register_blueprint(club_bp, url_prefix='/api/clubs')
    from app.routes.category_routes import category_bp
    from app.routes.stats_routes import stats_bp
    app.register_blueprint(category_bp, url_prefix='/api/categories')
    app.register_blueprint(stats_bp, url_prefix='/api/stats')
    from app.routes.test_routes import test_bp
    app.register_blueprint(test_bp, url_prefix='/api/tests')
    from app.routes.landing_routes import landing_bp
    app.register_blueprint(landing_bp, url_prefix='/api')
    from app.routes.trainer_routes import trainer_bp
    app.register_blueprint(trainer_bp, url_prefix='/api/trainer')
    from app.routes.registration_routes import registration_bp
    app.register_blueprint(registration_bp)

    @app.errorhandler(Exception)
    def handle_exception(e):
        response = {
            "error": str(e),
            "message": "An internal error occurred"
        }
        return jsonify(response), 500

    return app
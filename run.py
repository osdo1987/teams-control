import os
from app import create_app

app = create_app()

if __name__ == '__main__':
    # Auto-migrate on local development (without Docker)
    with app.app_context():
        from flask_migrate import upgrade
        upgrade()
    app.run(host='0.0.0.0', port=5000)

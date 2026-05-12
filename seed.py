"""
seed.py - Script de siembra de datos de prueba
Genera datos con suscripciones para probar la monetización.
"""
import random
from datetime import date, timedelta
from app import create_app, db
from app.models.club import Club
from app.models.category import Category
from app.models.user import User
from app.models.athlete import Athlete
from app.models.group import Group, GroupHistory
from app.models.payment import Payment
from app.models.attendance import Attendance

FIRST_NAMES = ["Santiago", "Valentina", "Miguel", "Camila", "Andrés", "Isabella", "Juan", "Sofía", "David", "Daniela"]
LAST_NAMES = ["García", "Rodríguez", "Martínez", "López", "González", "Pérez", "Sánchez", "Ramírez"]

def random_name():
    return random.choice(FIRST_NAMES), random.choice(LAST_NAMES)

def random_phone():
    return f"3{random.randint(0,2)}{random.randint(0,9)}-{random.randint(100,999)}-{random.randint(1000,9999)}"

def seed_database():
    app = create_app()
    with app.app_context():
        print("⚙️  Reiniciando base de datos...")
        db.drop_all()
        db.create_all()

        # SUPER ADMIN
        sadmin = User(email="super@admin.com", identification_number="0000000001", first_name="Super", last_name="Admin", role="SUPER_ADMIN")
        sadmin.set_password("super123")
        db.session.add(sadmin)

        # CLUB 1 - ACTIVO
        club1 = Club(
            name="Águilas del Norte", sport="Fútbol",
            subscription_status="ACTIVE", plan_type="PRO",
            subscription_end_date=date(2026, 12, 31)
        )
        db.session.add(club1)
        db.session.flush()

        # CLUB 2 - TRIAL
        club2 = Club(
            name="Tiburones del Sur", sport="Natación",
            subscription_status="TRIAL", plan_type="BASIC",
            subscription_end_date=date.today() + timedelta(days=15)
        )
        db.session.add(club2)
        db.session.flush()

        # Categorías y Usuarios para Club 1
        cat1 = Category(name="Juvenil", club_id=club1.id)
        db.session.add(cat1)
        db.session.flush()

        admin1 = User(email="admin@aguilas.com", identification_number="1000000001", first_name="Carlos", last_name="Mendoza", role="ADMIN", club_id=club1.id)
        admin1.set_password("admin123")
        db.session.add(admin1)

        # Atletas para Club 1
        for i in range(5):
            fn, ln = random_name()
            u = User(email=f"athlete{i}@aguilas.com", identification_number=f"300000000{i}", first_name=fn, last_name=ln, role="ATHLETE", club_id=club1.id)
            u.set_password("athlete123")
            db.session.add(u)
            db.session.flush()
            a = Athlete(user_id=u.id, phone=random_phone())
            db.session.add(a)

        db.session.commit()
        print("✅ Base de datos recreada con éxito.")

if __name__ == "__main__":
    seed_database()

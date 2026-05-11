from app import create_app
from app.extensions import db
from app.models.club import Club
from app.models.user import User
from app.models.trainer import TrainerProfile
from app.models.athlete import Athlete
from app.models.group import Group, GroupHistory
from app.models.category import Category

def seed_database():
    app = create_app()
    with app.app_context():
        # Clean existing data
        db.drop_all()
        db.create_all()

        print("Creating clubs...")
        club1 = Club(name="Águilas del Norte", description="Club de alto rendimiento", sport="Fútbol")
        club2 = Club(name="Titanes del Sur", description="Academia de formación", sport="Baloncesto")
        db.session.add_all([club1, club2])
        db.session.flush()

        print("Creating categories for club 1...")
        cat1 = Category(name="Sub-15 A", club_id=club1.id)
        cat2 = Category(name="Sub-17 B", club_id=club1.id)
        db.session.add_all([cat1, cat2])
        db.session.flush()

        print("Creating users...")
        # Super Admin
        super_admin = User(identification_number="0000000001", email="super@test.com", first_name="Super", last_name="Admin", role="SUPER_ADMIN", club_id=None)
        super_admin.set_password("super123")
        
        # Admin Club 1
        admin = User(identification_number="1000000001", email="admin@aguilas.com", first_name="Juan", last_name="Administrador", role="ADMIN", club_id=club1.id)
        admin.set_password("admin123")
        
        # Trainer Club 1
        trainer = User(identification_number="2000000001", email="carter@test.com", first_name="Coach", last_name="Carter", role="TRAINER", club_id=club1.id, phone="300-111-2233")
        trainer.set_password("trainer123")
        
        db.session.add_all([super_admin, admin, trainer])
        db.session.flush()

        # Trainer Profile
        tp = TrainerProfile(user_id=trainer.id, bio="Entrenador con 10 años de experiencia.", salary=2500000)
        db.session.add(tp)

        print("Creating athletes...")
        athlete_users = []
        for i in range(1, 11):
            u = User(
                identification_number=f"300000000{i}",
                email=f"atleta{i}@test.com",
                first_name=f"Atleta_{i}",
                last_name="Prueba",
                role="ATHLETE",
                club_id=club1.id
            )
            u.set_password("athlete123")
            athlete_users.append(u)
        
        db.session.add_all(athlete_users)
        db.session.flush()

        athletes = []
        for u in athlete_users:
            a = Athlete(user_id=u.id, phone="555-0000", birth_date="2010-05-10")
            athletes.append(a)
        
        db.session.add_all(athletes)
        db.session.flush()

        print("Creating groups...")
        group1 = Group(
            name="Fútbol Sub-15 A", 
            club_id=club1.id, 
            category_id=cat1.id,
            max_capacity=25,
            schedule="Lun-Mie-Vie 4PM",
            training_location="Cancha Principal",
            monthly_fee=120000
        )
        group1.trainers.append(trainer)
        db.session.add(group1)
        db.session.flush()

        # Assign first 5 athletes to group 1
        for a in athletes[:5]:
            group1.athletes.append(a)
            h = GroupHistory(athlete_id=a.id, group_id=group1.id, action="JOINED")
            db.session.add(h)

        db.session.commit()
        
        print("============================================================")
        print("  Database seeded successfully!")
        print("============================================================")
        print("\n  Credenciales de acceso:")
        print("  ─────────────────────────────────────")
        print("  Super Admin : ID=0000000001  Pass=super123")
        print("  Admin       : ID=1000000001  Pass=admin123")
        print("  Trainer     : ID=2000000001  Pass=trainer123")
        print("  Athlete     : ID=3000000001 a 3000000010  Pass=athlete123")
        print("  ─────────────────────────────────────\n")

if __name__ == "__main__":
    seed_database()

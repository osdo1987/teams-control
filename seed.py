from app import create_app
from app.extensions import db
from app.models.club import Club
from app.models.user import User
from app.models.trainer import TrainerProfile
from app.models.group import Group
from app.models.athlete import Athlete
from datetime import date

def seed_data():
    app = create_app()
    with app.app_context():
        # Clean database
        db.drop_all()
        db.create_all()

        # 1. Create a Club
        club = Club(name="Elite Sports Club", description="Premium training facility")
        db.session.add(club)
        db.session.flush()

        # 1.1 Create Super Admin
        super_admin = User(
            identification_number="0000000001",
            email="superadmin@example.com",
            first_name="Super",
            last_name="Admin",
            role="SUPER_ADMIN",
            club_id=None,
            phone="300-000-0000"
        )
        super_admin.set_password("super123")
        db.session.add(super_admin)

        # 2. Create Admin
        admin = User(
            identification_number="1000000001",
            email="admin@example.com",
            first_name="Admin",
            last_name="User",
            role="ADMIN",
            club_id=club.id,
            phone="300-111-1111"
        )
        admin.set_password("admin123")
        db.session.add(admin)

        # 3. Create Trainer
        trainer = User(
            identification_number="2000000001",
            email="trainer@example.com",
            first_name="Coach",
            last_name="Carter",
            role="TRAINER",
            club_id=club.id,
            phone="300-222-2222"
        )
        trainer.set_password("trainer123")
        db.session.add(trainer)
        db.session.flush()

        # 3.1 Create Trainer Profile
        trainer_profile = TrainerProfile(
            user_id=trainer.id,
            birth_date=date(1985, 3, 20),
            gender="Masculino",
            address="Calle 45 #12-30",
            city="Bogotá",
            state="Cundinamarca",
            emergency_contact_name="María Carter",
            emergency_contact_phone="300-333-3333",
            bank_name="Bancolombia",
            bank_account_number="12345678901",
            bank_account_type="Ahorros",
            salary=3500000,
            payment_frequency="Mensual",
            tax_id="900123456-1",
            education_level="Profesional",
            institution="Universidad Nacional",
            degree_title="Licenciado en Educación Física",
            graduation_year=2010,
            certifications="FIFA Grassroots, Técnico en Primeros Auxilios",
            specialization="Fútbol juvenil",
            years_of_experience=12,
            previous_clubs="Club Deportivo Cali, Atlético Junior",
            bio="Entrenador certificado con más de 12 años de experiencia en formación de jóvenes talentos.",
            hire_date=date(2024, 1, 15),
            contract_type="Tiempo completo"
        )
        db.session.add(trainer_profile)

        # 4. Create Group (with trainer assigned)
        group = Group(
            name="U-18 Soccer",
            club_id=club.id,
            category="Sub-18",
            sport="Fútbol",
            description="Grupo de formación para jugadores sub-18 con enfoque competitivo.",
            max_capacity=25,
            schedule="Lun-Mie-Vie 4PM",
            schedule_days="Lunes,Miércoles,Viernes",
            schedule_start_time="16:00",
            schedule_end_time="18:00",
            training_location="Cancha Principal",
            level="Intermedio",
            season="2026 - Primer Semestre",
            monthly_fee=120000
        )
        group.trainers.append(trainer)
        db.session.add(group)
        db.session.flush()

        # 5. Create Athlete
        athlete_user = User(
            identification_number="3000000001",
            email="athlete@example.com",
            first_name="John",
            last_name="Doe",
            role="ATHLETE",
            club_id=club.id,
            phone="300-444-4444"
        )
        athlete_user.set_password("athlete123")
        db.session.add(athlete_user)
        db.session.flush()

        athlete = Athlete(
            user_id=athlete_user.id,
            birth_date=date(2008, 5, 15),
            phone="555-0101",
            address="123 Sport St"
        )
        db.session.add(athlete)
        db.session.flush()

        # Assign athlete to group
        group.athletes.append(athlete)

        db.session.commit()
        print("=" * 60)
        print("  Database seeded successfully!")
        print("=" * 60)
        print()
        print("  Credenciales de acceso:")
        print("  ─────────────────────────────────────")
        print(f"  Super Admin : ID=0000000001  Pass=super123")
        print(f"  Admin       : ID=1000000001  Pass=admin123")
        print(f"  Trainer     : ID=2000000001  Pass=trainer123")
        print(f"  Athlete     : ID=3000000001  Pass=athlete123")
        print("  ─────────────────────────────────────")
        print()

if __name__ == "__main__":
    seed_data()

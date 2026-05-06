from app import create_app
from app.extensions import db
from app.models.club import Club
from app.models.user import User
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

        # 2. Create Admin
        admin = User(
            email="admin@example.com",
            first_name="Admin",
            last_name="User",
            role="ADMIN",
            club_id=club.id
        )
        admin.set_password("admin123")
        db.session.add(admin)

        # 3. Create Trainer
        trainer = User(
            email="trainer@example.com",
            first_name="Coach",
            last_name="Carter",
            role="TRAINER",
            club_id=club.id
        )
        trainer.set_password("trainer123")
        db.session.add(trainer)
        db.session.flush()

        # 4. Create Group
        group = Group(name="U-18 Soccer", club_id=club.id, schedule="Mon-Wed-Fri 4PM")
        group.trainers.append(trainer)
        db.session.add(group)
        db.session.flush()

        # 5. Create Athlete
        athlete_user = User(
            email="athlete@example.com",
            first_name="John",
            last_name="Doe",
            role="ATHLETE",
            club_id=club.id
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
        print("Database seeded successfully!")

if __name__ == "__main__":
    seed_data()

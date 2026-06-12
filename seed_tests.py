"""
seed_tests.py — Script seguro para sembrar datos de tests sin borrar la base de datos.
Ejecutar con: python seed_tests.py
"""
import random
from datetime import date, timedelta
from app import create_app, db
from app.models.test import TestTemplate, TestResult, TestSession
from app.models.athlete import Athlete
from app.models.user import User

def seed_test_data():
    app = create_app()
    with app.app_context():
        print("⚙️  Sembrando datos de tests...")

        # 1. Sembrar plantillas predefinidas
        from app.services.test_service import TestService
        TestService.seed_predefined_tests()
        print("   ✓ Plantillas predefinidas creadas/actualizadas")

        # 2. Verificar si ya hay resultados de tests
        existing_results = TestResult.query.count()
        if existing_results > 0:
            print(f"   ⚠ Ya existen {existing_results} resultados de tests. Saltando siembra de resultados.")
            print("   Para recrear resultados, ejecuta: python seed.py")
            return

        # 3. Sembrar resultados de tests de prueba
        templates = TestTemplate.query.filter_by(is_predefined=True).all()
        all_athletes = Athlete.query.all()
        trainer_users = User.query.filter_by(role='TRAINER').all()
        admin_users = User.query.filter_by(role='ADMIN').all()
        all_trainers = trainer_users + admin_users

        if not templates or not all_athletes or not all_trainers:
            print("   ⚠ No hay templates, atletas o entrenadores. Ejecuta seed.py primero.")
            return

        test_results_count = 0
        sessions_count = 0
        today = date.today()

        # Crear 3 sesiones de tests
        session_names = [
            "Evaluación Física Inicial - Semestre 1",
            "Control de Resistencia - Mes 2",
            "Evaluación de Fuerza - Mes 3"
        ]

        for s_idx, session_name in enumerate(session_names):
            session_date = today - timedelta(days=30 * (2 - s_idx))
            trainer = random.choice(all_trainers)
            
            session = TestSession(
                name=session_name,
                club_id=1,
                trainer_id=trainer.id,
                session_date=session_date,
                notes=f"Sesión de evaluación {session_name.lower()}"
            )
            db.session.add(session)
            db.session.flush()

            session_athletes = random.sample(all_athletes, min(random.randint(5, 8), len(all_athletes)))
            session_templates = random.sample(templates, min(random.randint(3, 5), len(templates)))

            for athlete in session_athletes:
                for template in session_templates:
                    if template.unit == "metros":
                        value = round(random.uniform(1800, 3200), 0)
                    elif template.unit == "segundos":
                        value = round(random.uniform(5.5, 18.0), 2)
                    elif template.unit == "repeticiones":
                        value = round(random.uniform(10, 60), 0)
                    elif template.unit == "kg":
                        value = round(random.uniform(40, 120), 1)
                    elif template.unit == "centimetros":
                        value = round(random.uniform(150, 280), 0)
                    elif template.unit == "nivel":
                        value = round(random.uniform(5, 14), 1)
                    else:
                        value = round(random.uniform(10, 100), 1)

                    result = TestResult(
                        template_id=template.id,
                        athlete_id=athlete.id,
                        trainer_id=trainer.id,
                        session_id=session.id,
                        value=value,
                        notes=random.choice([None, "Buen rendimiento", "Mejorar technique", "Condiciones normales"]),
                        test_date=session_date
                    )
                    db.session.add(result)
                    test_results_count += 1

            sessions_count += 1

        db.session.commit()
        print(f"   ✓ {sessions_count} sesiones de tests creadas")
        print(f"   ✓ {test_results_count} resultados de tests creados")
        print("✅  Datos de tests sembrados exitosamente")

if __name__ == "__main__":
    seed_test_data()
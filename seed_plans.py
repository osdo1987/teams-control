"""
seed_plans.py — Script para sembrar datos de prueba para los planes de entrenamiento en todos los clubes.
Ejecutar con: docker compose exec api python seed_plans.py
"""
from datetime import date, timedelta
from app import create_app, db
from app.models.training_plan import TrainingPlan, TrainingCycle, TrainingSession, TrainingExercise, TrainingPlanAssignment
from app.models.club import Club
from app.models.user import User
from app.models.group import Group
from app.models.athlete import Athlete

def seed_training_plans():
    app = create_app()
    with app.app_context():
        print("⚙️  Sembrando datos de planes de entrenamiento para todos los clubes...")

        clubs = Club.query.all()
        if not clubs:
            print("   ⚠ No hay clubes en la base de datos. Ejecuta seed.py primero.")
            return

        # Limpiar todos los planes y asignaciones previas
        TrainingPlanAssignment.query.delete()
        TrainingExercise.query.delete()
        TrainingSession.query.delete()
        TrainingCycle.query.delete()
        TrainingPlan.query.delete()
        db.session.flush()
        print("   ✓ Limpieza de planes de entrenamiento antiguos completada.")

        # Estructura genérica de plan de fuerza
        strength_plan_data = {
            "name": "Rutina de Fuerza y Potencia - Nivel Medio",
            "description": "Plan de 3 semanas enfocado en el desarrollo de la fuerza explosiva y acondicionamiento muscular general.",
            "cycles": [
                {
                    "name": "Semana 1: Adaptación Estructural",
                    "description": "Enfoque en volumen medio y acondicionamiento de tendones.",
                    "sessions": [
                        {
                            "name": "Día 1: Tren Superior (Empuje)",
                            "notes": "Calentar manguito rotador antes de empezar.",
                            "exercises": [
                                {"exercise_name": "Press de Banca", "sets": 4, "reps": "10-12", "weight": "60%", "rest_seconds": 90},
                                {"exercise_name": "Press Militar con Mancuernas", "sets": 3, "reps": "10", "weight": "15kg", "rest_seconds": 60},
                                {"exercise_name": "Fondos en Paralelas", "sets": 3, "reps": "Fallo", "weight": "Peso corporal", "rest_seconds": 60}
                            ]
                        },
                        {
                            "name": "Día 2: Tren Inferior (Fuerza)",
                            "notes": "Mantener buena técnica en sentadilla profunda.",
                            "exercises": [
                                {"exercise_name": "Sentadilla Trasera con Barra", "sets": 4, "reps": "8", "weight": "70%", "rest_seconds": 120},
                                {"exercise_name": "Prensa de Piernas", "sets": 3, "reps": "12", "weight": "120kg", "rest_seconds": 90},
                                {"exercise_name": "Elevación de Talones (Pantorrilla)", "sets": 4, "reps": "15", "weight": "40kg", "rest_seconds": 45}
                            ]
                        }
                    ]
                },
                {
                    "name": "Semana 2: Intensificación",
                    "description": "Subimos la carga y reducimos repeticiones ligeramente.",
                    "sessions": [
                        {
                            "name": "Día 1: Fuerza Máxima Empuje",
                            "notes": "Cargas pesadas.",
                            "exercises": [
                                {"exercise_name": "Press de Banca Pesado", "sets": 5, "reps": "5", "weight": "80%", "rest_seconds": 180},
                                {"exercise_name": "Fondos Lastrados", "sets": 3, "reps": "6", "weight": "10kg", "rest_seconds": 90}
                            ]
                        }
                    ]
                }
            ]
        }

        # Estructura genérica de plan de cardio/resistencia
        cardio_plan_data = {
            "name": "Plan de Acondicionamiento Aeróbico",
            "description": "Plan orientado a mejorar el VO2 Máx y la resistencia general en pretemporada.",
            "cycles": [
                {
                    "name": "Semana 1: Resistencia Base",
                    "description": "Carreras continuas a ritmo moderado.",
                    "sessions": [
                        {
                            "name": "Día 1: Intervalos de Alta Intensidad (HIIT)",
                            "notes": "Asegurar hidratación previa.",
                            "exercises": [
                                {"exercise_name": "Carreras de Velocidad (Sprints)", "sets": 6, "reps": "30s sprint / 60s trote", "weight": "Máximo", "rest_seconds": 60},
                                {"exercise_name": "Burpees continuos", "sets": 4, "reps": "1 min", "weight": "Propio peso", "rest_seconds": 60}
                            ]
                        }
                    ]
                }
            ]
        }

        today = date.today()

        for club in clubs:
            print(f"👉 Procesando club: {club.name}")
            # Buscar entrenador o administrador del club
            trainer = User.query.filter_by(role='TRAINER', club_id=club.id).first()
            if not trainer:
                trainer = User.query.filter_by(role='ADMIN', club_id=club.id).first()
            
            if not trainer:
                print(f"   ⚠ No se encontró entrenador o admin para el club {club.name}. Saltando.")
                continue

            # Crear plan 1 (Fuerza) para el club
            plan1 = TrainingPlan(
                name=f"Fuerza y Potencia - {club.name}",
                description=strength_plan_data["description"],
                club_id=club.id,
                created_by=trainer.id
            )
            db.session.add(plan1)
            db.session.flush()

            for c_idx, cycle_data in enumerate(strength_plan_data["cycles"]):
                c = TrainingCycle(plan_id=plan1.id, name=cycle_data["name"], description=cycle_data["description"], order=c_idx + 1)
                db.session.add(c)
                db.session.flush()

                for s_idx, session_data in enumerate(cycle_data["sessions"]):
                    s = TrainingSession(cycle_id=c.id, name=session_data["name"], notes=session_data["notes"], order=s_idx + 1)
                    db.session.add(s)
                    db.session.flush()

                    for e_idx, ex in enumerate(session_data["exercises"]):
                        e = TrainingExercise(
                            session_id=s.id, exercise_name=ex["exercise_name"],
                            sets=ex["sets"], reps=ex["reps"], weight=ex["weight"],
                            rest_seconds=ex["rest_seconds"], order=e_idx + 1
                        )
                        db.session.add(e)

            # Crear plan 2 (Resistencia) para el club
            plan2 = TrainingPlan(
                name=f"Cardio y Acondicionamiento - {club.name}",
                description=cardio_plan_data["description"],
                club_id=club.id,
                created_by=trainer.id
            )
            db.session.add(plan2)
            db.session.flush()

            for c_idx, cycle_data in enumerate(cardio_plan_data["cycles"]):
                c = TrainingCycle(plan_id=plan2.id, name=cycle_data["name"], description=cycle_data["description"], order=c_idx + 1)
                db.session.add(c)
                db.session.flush()

                for s_idx, session_data in enumerate(cycle_data["sessions"]):
                    s = TrainingSession(cycle_id=c.id, name=session_data["name"], notes=session_data["notes"], order=s_idx + 1)
                    db.session.add(s)
                    db.session.flush()

                    for e_idx, ex in enumerate(session_data["exercises"]):
                        e = TrainingExercise(
                            session_id=s.id, exercise_name=ex["exercise_name"],
                            sets=ex["sets"], reps=ex["reps"], weight=ex["weight"],
                            rest_seconds=ex["rest_seconds"], order=e_idx + 1
                        )
                        db.session.add(e)

            # Asignaciones del club
            groups = Group.query.filter_by(club_id=club.id).all()
            athletes = Athlete.query.filter(Athlete.user.has(club_id=club.id)).all()

            for g in groups:
                assign_g = TrainingPlanAssignment(
                    plan_id=plan1.id, group_id=g.id,
                    start_date=today, end_date=today + timedelta(days=30),
                    status="ACTIVE"
                )
                db.session.add(assign_g)
                print(f"   ✓ Asignado Plan de Fuerza al grupo: {g.name}")

            # Asignar Plan 2 (Cardio) al primer atleta individualmente
            if athletes:
                first_ath = athletes[0]
                if first_ath.user:
                    assign_a = TrainingPlanAssignment(
                        plan_id=plan2.id, athlete_id=first_ath.id,
                        start_date=today, end_date=today + timedelta(days=30),
                        status="ACTIVE"
                    )
                    db.session.add(assign_a)
                    print(f"   ✓ Asignado Plan de Cardio al atleta: {first_ath.user.first_name} {first_ath.user.last_name}")

        db.session.commit()
        print("✅  Datos de planes de entrenamiento sembrados exitosamente para todos los clubes.")

if __name__ == "__main__":
    seed_training_plans()

"""
seed_training_plans.py — Datos de prueba VARIADOS para el módulo de planes de entrenamiento

Estructura:
  TrainingPlan
    └── TrainingCycle (ciclo: mes, semana, fase)
          └── TrainingSession (sesión: día de entrenamiento)
                └── TrainingExercise (ejercicio individual)

  TrainingPlanAssignment (asignación del plan a un grupo o atleta)

Casos cubiertos:
  1. Plan completo de fútbol (pretemporada) — 4 ciclos, múltiples sesiones y ejercicios
  2. Plan de técnica individual — 2 ciclos
  3. Plan de preparación física — ejercicios basados en duración (sin reps/peso)
  4. Plan táctico — enfoque en estrategia
  5. Plan INACTIVO (archivado)
  6. Plan de recuperación de lesiones — cargas ligeras
  7. Plan mínimo (1 ciclo, 1 sesión, 1 ejercicio)
  8. Plan vacío (sin ciclos)
  9. Plan con ejercicios de tiempo (duration_seconds)
  10. Plan avanzado de fuerza y acondicionamiento
  Asignaciones: a grupo, a atleta individual, completadas, canceladas
"""

import random
from datetime import date, timedelta, datetime
from app import create_app, db
from app.models.club import Club
from app.models.user import User
from app.models.group import Group
from app.models.athlete import Athlete
from app.models.training_plan import TrainingPlan, TrainingCycle, TrainingSession, TrainingExercise, TrainingPlanAssignment


def seed_training_plans():
    app = create_app()
    with app.app_context():
        today = date.today()
        print("=" * 65)
        print("🏋️  SEMILLA DE PLANES DE ENTRENAMIENTO — CASOS VARIADOS")
        print("=" * 65)

        # ── Buscar club, entrenadores y grupos existentes ──────────────────
        club = Club.query.filter_by(slug="futbol-elite").first()
        if not club:
            club = Club.query.first()
        if not club:
            print("❌ No hay clubes en la BD. Ejecuta primero seed_demo.py")
            return
        print(f"\n📌 Club: {club.name} (ID={club.id})")

        trainers = User.query.filter_by(role='TRAINER', club_id=club.id).all()
        if not trainers:
            trainers = User.query.filter_by(club_id=club.id).filter(User.role.in_(['ADMIN', 'TRAINER'])).all()
        if not trainers:
            print("❌ No hay entrenadores disponibles")
            return
        trainer = trainers[0]
        print(f"   Entrenador principal: {trainer.first_name} {trainer.last_name} (ID={trainer.id})")

        groups = Group.query.filter_by(club_id=club.id).all()
        print(f"   Grupos disponibles: {len(groups)}")

        athletes = Athlete.query.all()
        print(f"   Atletas disponibles: {len(athletes)}")

        # ── Helper para crear estructura jerárquica ────────────────────────
        def build_plan(name, description, cycles_data, is_active=True):
            """Construye un plan completo con ciclos, sesiones y ejercicios."""
            plan = TrainingPlan(
                name=name,
                description=description,
                club_id=club.id,
                created_by=trainer.id,
                is_active=is_active
            )
            db.session.add(plan)
            db.session.flush()

            for c_idx, cycle in enumerate(cycles_data):
                c = TrainingCycle(
                    plan_id=plan.id,
                    name=cycle["name"],
                    description=cycle.get("description", ""),
                    order=c_idx + 1
                )
                db.session.add(c)
                db.session.flush()

                for s_idx, session in enumerate(cycle.get("sessions", [])):
                    s = TrainingSession(
                        cycle_id=c.id,
                        name=session["name"],
                        notes=session.get("notes", ""),
                        order=s_idx + 1
                    )
                    db.session.add(s)
                    db.session.flush()

                    for e_idx, ex in enumerate(session.get("exercises", [])):
                        db.session.add(TrainingExercise(
                            session_id=s.id,
                            exercise_name=ex["exercise_name"],
                            sets=ex.get("sets", 1),
                            reps=ex.get("reps", ""),
                            weight=ex.get("weight", ""),
                            duration_seconds=ex.get("duration_seconds"),
                            rest_seconds=ex.get("rest_seconds"),
                            notes=ex.get("notes", ""),
                            order=e_idx + 1
                        ))
            return plan

        def assign_plan(plan, group=None, athlete=None, start_date=None, end_date=None, status="ACTIVE"):
            """Asigna un plan a un grupo o atleta."""
            if start_date is None:
                start_date = today
            if end_date is None:
                end_date = today + timedelta(days=30)
            assig = TrainingPlanAssignment(
                plan_id=plan.id,
                group_id=group.id if group else None,
                athlete_id=athlete.id if athlete else None,
                start_date=start_date,
                end_date=end_date,
                status=status
            )
            db.session.add(assig)
            return assig

        # ═══════════════════════════════════════════════════════════════════
        # CASO 1: PLAN COMPLETO DE PRETEMPORADA (FÚTBOL)
        # ═══════════════════════════════════════════════════════════════════
        print("\n" + "-" * 65)
        print("📋 CASO 1: Plan de Pretemporada — 4 semanas, completo")
        print("-" * 65)

        plan1 = build_plan(
            name="Pretemporada Fútbol Elite — Enero 2026",
            description="Plan de pretemporada de 4 semanas para preparación física, técnica y táctica de cara a la temporada 2026. Incluye pruebas de capacidad aeróbica, trabajo de fuerza, técnica individual y sesiones tácticas.",
            cycles_data=[
                {
                    "name": "Semana 1: Adaptación y Evaluación",
                    "description": "Evaluación física inicial, pruebas de capacidad aeróbica y adaptación a cargas de trabajo.",
                    "sessions": [
                        {
                            "name": "Día 1: Evaluación Física",
                            "notes": "Realizar pruebas de Cooper, velocidad 30m y salto vertical.",
                            "exercises": [
                                {"exercise_name": "Test de Cooper (12 min)", "sets": 1, "reps": "12 min", "duration_seconds": 720, "rest_seconds": 300, "notes": "Registrar distancia recorrida"},
                                {"exercise_name": "Salto Vertical (Countermovement)", "sets": 3, "reps": "3 rep", "rest_seconds": 60, "notes": "Registrar altura en cm"},
                                {"exercise_name": "Velocidad 30 metros", "sets": 3, "reps": "1 rep", "rest_seconds": 120, "notes": "Registrar tiempo"},
                                {"exercise_name": "Flexibilidad (Sit & Reach)", "sets": 2, "reps": "5 rep", "rest_seconds": 30}
                            ]
                        },
                        {
                            "name": "Día 2: Resistencia Aeróbica",
                            "notes": "Trabajo de base aeróbica. Mantener frecuencia cardíaca entre 140-160 lpm.",
                            "exercises": [
                                {"exercise_name": "Carrera Continua", "sets": 1, "reps": "20 min", "duration_seconds": 1200, "rest_seconds": 0, "notes": "Ritmo suave, 70% esfuerzo"},
                                {"exercise_name": "Fartlek (cambios de ritmo)", "sets": 1, "reps": "15 min", "duration_seconds": 900, "rest_seconds": 120},
                                {"exercise_name": "Circuit Training", "sets": 3, "reps": "45 seg", "duration_seconds": 45, "rest_seconds": 15, "notes": "10 estaciones, 45s trabajo / 15s descanso"}
                            ]
                        },
                        {
                            "name": "Día 3: Técnica Individual",
                            "notes": "Enfocar en control de balón, conducción y pase.",
                            "exercises": [
                                {"exercise_name": "Conducción con cambios de dirección", "sets": 4, "reps": "30 seg", "duration_seconds": 30, "rest_seconds": 30, "weight": "Balón", "notes": "Usar ambos pies"},
                                {"exercise_name": "Pase en movimiento", "sets": 4, "reps": "10 rep", "rest_seconds": 45, "weight": "Balón"},
                                {"exercise_name": "Control orientado", "sets": 3, "reps": "12 rep", "rest_seconds": 45, "weight": "Balón"}
                            ]
                        }
                    ]
                },
                {
                    "name": "Semana 2: Fuerza y Potencia",
                    "description": "Introducción al trabajo de fuerza con peso corporal y elementos ligeros.",
                    "sessions": [
                        {
                            "name": "Día 1: Fuerza Corporal",
                            "notes": "Ejercicios de peso corporal. Enfocar en técnica antes que carga.",
                            "exercises": [
                                {"exercise_name": "Sentadillas", "sets": 4, "reps": "12 rep", "weight": "Peso corporal", "rest_seconds": 60},
                                {"exercise_name": "Flexiones de brazos", "sets": 3, "reps": "10 rep", "weight": "Peso corporal", "rest_seconds": 45},
                                {"exercise_name": "Plancha abdominal", "sets": 3, "reps": "45 seg", "duration_seconds": 45, "rest_seconds": 30},
                                {"exercise_name": "Zancadas alternas", "sets": 3, "reps": "10 rep", "weight": "Peso corporal", "rest_seconds": 45}
                            ]
                        },
                        {
                            "name": "Día 2: Potencia y Pliometría",
                            "notes": "Ejercicios explosivos. Superficie blanda recomendada.",
                            "exercises": [
                                {"exercise_name": "Saltos al cajón (box jumps)", "sets": 4, "reps": "8 rep", "weight": "Cajón 30cm", "rest_seconds": 90},
                                {"exercise_name": "Saltos en longitud", "sets": 3, "reps": "6 rep", "rest_seconds": 60},
                                {"exercise_name": "Sprints 20 metros", "sets": 5, "reps": "1 rep", "rest_seconds": 90}
                            ]
                        }
                    ]
                },
                {
                    "name": "Semana 3: Técnica y Táctica",
                    "description": "Trabajo específico de fútbol: rondos, posesión y sistemas tácticos.",
                    "sessions": [
                        {
                            "name": "Día 1: Rondos y Posesión",
                            "notes": "Rondos 5x2, 7x3, 10x5. Toques limitados según nivel.",
                            "exercises": [
                                {"exercise_name": "Rondo 5x2 (toque libre)", "sets": 4, "reps": "3 min", "duration_seconds": 180, "rest_seconds": 60, "notes": "5 atacantes vs 2 defensores"},
                                {"exercise_name": "Rondo 7x3 (2 toques)", "sets": 4, "reps": "2 min", "duration_seconds": 120, "rest_seconds": 60},
                                {"exercise_name": "Posesión 10x5 (1 toque)", "sets": 3, "reps": "3 min", "duration_seconds": 180, "rest_seconds": 90}
                            ]
                        },
                        {
                            "name": "Día 2: Sistema Táctico",
                            "notes": "Trabajo posicional 4-4-2 y 4-3-3.",
                            "exercises": [
                                {"exercise_name": "Movimiento ofensivo 4-4-2", "sets": 4, "reps": "5 min", "duration_seconds": 300, "rest_seconds": 60, "notes": "Transiciones ofensivas"},
                                {"exercise_name": "Presión tras pérdida", "sets": 4, "reps": "3 min", "duration_seconds": 180, "rest_seconds": 60},
                                {"exercise_name": "Partido condicionado 8x8", "sets": 2, "reps": "10 min", "duration_seconds": 600, "rest_seconds": 120, "notes": "3 toques máximo"}
                            ]
                        },
                        {
                            "name": "Día 3: Finalización",
                            "notes": "Remates a portería desde distintas posiciones.",
                            "exercises": [
                                {"exercise_name": "Remate frontal", "sets": 5, "reps": "6 rep", "weight": "Balón", "rest_seconds": 30},
                                {"exercise_name": "Remate diagonal", "sets": 4, "reps": "6 rep", "weight": "Balón", "rest_seconds": 30},
                                {"exercise_name": "Cabezazo ofensivo", "sets": 3, "reps": "8 rep", "weight": "Balón", "rest_seconds": 45},
                                {"exercise_name": "Penaltis", "sets": 2, "reps": "5 rep", "rest_seconds": 30}
                            ]
                        }
                    ]
                },
                {
                    "name": "Semana 4: Carga y Competencia",
                    "description": "Semana de máxima carga seguida de descarga. Partido amistoso al final.",
                    "sessions": [
                        {
                            "name": "Día 1: Fuerza Máxima",
                            "notes": "Trabajo con bandas elásticas y peso corporal avanzado.",
                            "exercises": [
                                {"exercise_name": "Sentadilla búlgara", "sets": 4, "reps": "8 rep", "weight": "Peso corporal", "rest_seconds": 60},
                                {"exercise_name": "Dominadas (asistidas)", "sets": 3, "reps": "6 rep", "weight": "Peso corporal", "rest_seconds": 60},
                                {"exercise_name": "Peso muerto a una pierna", "sets": 3, "reps": "8 rep", "weight": "Peso corporal", "rest_seconds": 45}
                            ]
                        },
                        {
                            "name": "Día 2: Trabajo Interválico Alta Intensidad (HIIT)",
                            "notes": "Intervalos 30:30 segundos. Máxima intensidad.",
                            "exercises": [
                                {"exercise_name": "Sprints 30s / 30s descanso", "sets": 8, "reps": "30 seg", "duration_seconds": 30, "rest_seconds": 30, "notes": "Repetir 8 veces"},
                                {"exercise_name": "Ejercicios pliométricos", "sets": 3, "reps": "45 seg", "duration_seconds": 45, "rest_seconds": 15},
                                {"exercise_name": "Agilidad (escalera)", "sets": 5, "reps": "1 rep", "rest_seconds": 30}
                            ]
                        },
                        {
                            "name": "Día 3: Partido Amistoso",
                            "notes": "Partido 11x11. 3 tiempos de 20 minutos. Rotar posiciones.",
                            "exercises": [
                                {"exercise_name": "Calentamiento pre-partido", "sets": 1, "reps": "15 min", "duration_seconds": 900, "rest_seconds": 0},
                                {"exercise_name": "Partido 11x11", "sets": 3, "reps": "20 min", "duration_seconds": 1200, "rest_seconds": 300, "notes": "3 tiempos de 20 min"},
                                {"exercise_name": "Estiramientos finales", "sets": 1, "reps": "10 min", "duration_seconds": 600, "rest_seconds": 0}
                            ]
                        }
                    ]
                }
            ]
        )
        db.session.flush()
        print(f"   ✅ Plan creado: '{plan1.name}' (ID={plan1.id})")
        print(f"      → 4 ciclos, ~12 sesiones, ~42 ejercicios")

        # Asignar a grupos Sub-15 y Sub-18
        if len(groups) >= 5:
            assign_plan(plan1, group=groups[3], start_date=today, end_date=today + timedelta(days=28))  # Sub-15
            assign_plan(plan1, group=groups[4], start_date=today, end_date=today + timedelta(days=28))  # Sub-18
            print(f"      → Asignado a grupos: {groups[3].name}, {groups[4].name}")

        # ═══════════════════════════════════════════════════════════════════
        # CASO 2: PLAN DE TÉCNICA INDIVIDUAL (más corto, 2 ciclos)
        # ═══════════════════════════════════════════════════════════════════
        print("\n" + "-" * 65)
        print("📋 CASO 2: Plan de Técnica Individual — 2 semanas")
        print("-" * 65)

        plan2 = build_plan(
            name="Técnica Individual — Control y Pase",
            description="Plan de 2 semanas enfocado en mejorar el control de balón, precisión de pase y primer toque. Ideal para categorías formativas Sub-10 y Sub-12.",
            cycles_data=[
                {
                    "name": "Semana 1: Control y Conducción",
                    "description": "Dominio del balón, control orientado y conducción en espacios reducidos.",
                    "sessions": [
                        {
                            "name": "Sesión 1: Control Estático",
                            "notes": "Ejercicios de control sin presión defensiva.",
                            "exercises": [
                                {"exercise_name": "Toques con el pie interno", "sets": 3, "reps": "30 rep", "weight": "Balón #4", "rest_seconds": 30},
                                {"exercise_name": "Control de pecho y muslo", "sets": 3, "reps": "10 rep", "weight": "Balón #4", "rest_seconds": 45},
                                {"exercise_name": "Auto-pases y control", "sets": 4, "reps": "10 rep", "rest_seconds": 30}
                            ]
                        },
                        {
                            "name": "Sesión 2: Conducción con Cambios",
                            "notes": "Slaloms y cambios de dirección. Usar conos.",
                            "exercises": [
                                {"exercise_name": "Slalom básico (conos cada 1m)", "sets": 5, "reps": "1 rep", "weight": "Conos", "rest_seconds": 30},
                                {"exercise_name": "Conducción en 8", "sets": 4, "reps": "1 rep", "weight": "Conos", "rest_seconds": 45},
                                {"exercise_name": "Cambios de dirección con señal", "sets": 3, "reps": "8 rep", "rest_seconds": 30}
                            ]
                        }
                    ]
                },
                {
                    "name": "Semana 2: Pase y Recepción",
                    "description": "Precisión en pase corto, medio y largo. Recepción orientada.",
                    "sessions": [
                        {
                            "name": "Sesión 1: Pase Corto",
                            "notes": "Pases a 5-10 metros. Precisión y velocidad.",
                            "exercises": [
                                {"exercise_name": "Pase contra muro", "sets": 3, "reps": "20 rep", "weight": "Balón #4", "rest_seconds": 30},
                                {"exercise_name": "Pase en parejas (2 toques)", "sets": 4, "reps": "15 rep", "rest_seconds": 30},
                                {"exercise_name": "Pase al compañero en movimiento", "sets": 3, "reps": "10 rep", "rest_seconds": 45}
                            ]
                        },
                        {
                            "name": "Sesión 2: Pase Largo",
                            "notes": "Pases a 20-30 metros. Enfocar en técnica de empeine.",
                            "exercises": [
                                {"exercise_name": "Pase largo a objetivo", "sets": 5, "reps": "6 rep", "rest_seconds": 45, "notes": "Apuntar a conos a 25m"},
                                {"exercise_name": "Cambio de frente", "sets": 4, "reps": "8 rep", "rest_seconds": 45},
                                {"exercise_name": "Centro desde banda", "sets": 4, "reps": "10 rep", "rest_seconds": 30}
                            ]
                        }
                    ]
                }
            ]
        )
        db.session.flush()
        print(f"   ✅ Plan creado: '{plan2.name}' (ID={plan2.id})")

        # Asignar a grupos Sub-10
        if len(groups) >= 2:
            assign_plan(plan2, group=groups[0], start_date=today, end_date=today + timedelta(days=14))  # Sub-10 A
            assign_plan(plan2, group=groups[1], start_date=today, end_date=today + timedelta(days=14))  # Sub-10 B
            print(f"      → Asignado a grupos: {groups[0].name}, {groups[1].name}")

        # ═══════════════════════════════════════════════════════════════════
        # CASO 3: PLAN DE PREPARACIÓN FÍSICA (basado en duración)
        # ═══════════════════════════════════════════════════════════════════
        print("\n" + "-" * 65)
        print("📋 CASO 3: Plan de Preparación Física — solo duración (sin reps/peso)")
        print("-" * 65)

        plan3 = build_plan(
            name="Preparación Física General — Resistencia y Movilidad",
            description="Plan de acondicionamiento físico general. Todos los ejercicios se miden por tiempo (duration_seconds). Sin reps ni peso. Ideal para entender cómo funciona el campo de duración.",
            cycles_data=[
                {
                    "name": "Fase 1: Resistencia Aeróbica",
                    "description": "Trabajo cardiovascular de base.",
                    "sessions": [
                        {
                            "name": "Cardio 1: Trote Continuo",
                            "notes": "Mantener ritmo constante durante toda la sesión.",
                            "exercises": [
                                {"exercise_name": "Trote suave", "sets": 1, "duration_seconds": 600, "rest_seconds": 0, "notes": "10 min continuos"},
                                {"exercise_name": "Carrera media intensidad", "sets": 1, "duration_seconds": 300, "rest_seconds": 60},
                                {"exercise_name": "Trote recuperación", "sets": 1, "duration_seconds": 300, "rest_seconds": 0}
                            ]
                        },
                        {
                            "name": "Cardio 2: Circuito Aeróbico",
                            "notes": "Estaciones de 1 minuto cada una.",
                            "exercises": [
                                {"exercise_name": "Jumping Jacks", "sets": 1, "duration_seconds": 60, "rest_seconds": 15},
                                {"exercise_name": "High Knees", "sets": 1, "duration_seconds": 60, "rest_seconds": 15},
                                {"exercise_name": "Burpees", "sets": 1, "duration_seconds": 60, "rest_seconds": 15},
                                {"exercise_name": "Mountain Climbers", "sets": 1, "duration_seconds": 60, "rest_seconds": 15},
                                {"exercise_name": "Saltos de tijera", "sets": 1, "duration_seconds": 60, "rest_seconds": 15}
                            ]
                        }
                    ]
                },
                {
                    "name": "Fase 2: Movilidad y Flexibilidad",
                    "description": "Trabajo de rango de movimiento y prevención de lesiones.",
                    "sessions": [
                        {
                            "name": "Movilidad Articular",
                            "notes": "Realizar todos los ejercicios de forma controlada.",
                            "exercises": [
                                {"exercise_name": "Movilidad de cadera", "sets": 2, "duration_seconds": 60, "rest_seconds": 20},
                                {"exercise_name": "Rotación de hombros", "sets": 2, "duration_seconds": 60, "rest_seconds": 20},
                                {"exercise_name": "Estiramiento isquiotibiales", "sets": 2, "duration_seconds": 45, "rest_seconds": 15},
                                {"exercise_name": "Apertura de pecho", "sets": 2, "duration_seconds": 45, "rest_seconds": 15}
                            ]
                        }
                    ]
                }
            ]
        )
        db.session.flush()
        print(f"   ✅ Plan creado: '{plan3.name}' (ID={plan3.id})")

        # Asignar a grupos Sub-12
        if len(groups) >= 3:
            assign_plan(plan3, group=groups[2], start_date=today, end_date=today + timedelta(days=21))
            print(f"      → Asignado a grupo: {groups[2].name}")

        # ═══════════════════════════════════════════════════════════════════
        # CASO 4: PLAN TÁCTICO
        # ═══════════════════════════════════════════════════════════════════
        print("\n" + "-" * 65)
        print("📋 CASO 4: Plan Táctico — Sistemas de Juego")
        print("-" * 65)

        plan4 = build_plan(
            name="Táctica: Sistemas 4-4-2 y 4-3-3",
            description="Plan avanzado de táctica colectiva. Transiciones ofensivas y defensivas, repliegues, ataques organizados. Para categorías competitivas.",
            cycles_data=[
                {
                    "name": "Módulo 1: Sistema 4-4-2",
                    "description": "Fundamentos del 4-4-2 clásico.",
                    "sessions": [
                        {
                            "name": "Sesión Teórico-Práctica 4-4-2",
                            "notes": "Primero explicación en pizarra, luego práctica en campo.",
                            "exercises": [
                                {"exercise_name": "Posicionamiento base 4-4-2", "sets": 3, "reps": "5 min", "duration_seconds": 300, "rest_seconds": 60},
                                {"exercise_name": "Transición ofensiva 4-4-2", "sets": 4, "reps": "3 min", "duration_seconds": 180, "rest_seconds": 60},
                                {"exercise_name": "Repliegue defensivo", "sets": 4, "reps": "3 min", "duration_seconds": 180, "rest_seconds": 60},
                                {"exercise_name": "Juego 11x11 con sistema", "sets": 2, "reps": "10 min", "duration_seconds": 600, "rest_seconds": 120}
                            ]
                        }
                    ]
                },
                {
                    "name": "Módulo 2: Sistema 4-3-3",
                    "description": "Variante ofensiva con extremos.",
                    "sessions": [
                        {
                            "name": "Sesión Práctica 4-3-3",
                            "notes": "Enfatizar profundidad de extremos y coberturas del mediocampo.",
                            "exercises": [
                                {"exercise_name": "Ataque por bandas 4-3-3", "sets": 4, "reps": "4 min", "duration_seconds": 240, "rest_seconds": 60},
                                {"exercise_name": "Cobertura mediocampo", "sets": 4, "reps": "3 min", "duration_seconds": 180, "rest_seconds": 45},
                                {"exercise_name": "Transición defensa-ataque", "sets": 4, "reps": "3 min", "duration_seconds": 180, "rest_seconds": 60},
                                {"exercise_name": "Partido condicionado 9x9", "sets": 2, "reps": "12 min", "duration_seconds": 720, "rest_seconds": 180}
                            ]
                        }
                    ]
                },
                {
                    "name": "Módulo 3: Estrategia y Balón Parado",
                    "description": "Córners, faltas laterales, tiros libres.",
                    "sessions": [
                        {
                            "name": "Sesión de Balón Parado",
                            "notes": "Ensayar 5 jugadas de córner y 3 de tiro libre.",
                            "exercises": [
                                {"exercise_name": "Córner ofensivo (cerrado)", "sets": 5, "reps": "3 rep", "rest_seconds": 30, "notes": "Jugada ensayada #1"},
                                {"exercise_name": "Córner ofensivo (abierto)", "sets": 5, "reps": "3 rep", "rest_seconds": 30, "notes": "Jugada ensayada #2"},
                                {"exercise_name": "Tiro libre directo", "sets": 5, "reps": "5 rep", "rest_seconds": 30},
                                {"exercise_name": "Tiro libre indirecto (barrera)", "sets": 4, "reps": "3 rep", "rest_seconds": 45}
                            ]
                        }
                    ]
                }
            ]
        )
        db.session.flush()
        print(f"   ✅ Plan creado: '{plan4.name}' (ID={plan4.id})")

        if len(groups) >= 5:
            assign_plan(plan4, group=groups[4], start_date=today, end_date=today + timedelta(days=21))
            print(f"      → Asignado a grupo: {groups[4].name}")

        # ═══════════════════════════════════════════════════════════════════
        # CASO 5: PLAN INACTIVO (archivado / desactivado)
        # ═══════════════════════════════════════════════════════════════════
        print("\n" + "-" * 65)
        print("📋 CASO 5: Plan INACTIVO (archivado, is_active=False)")
        print("-" * 65)

        plan5 = build_plan(
            name="Plan Temporada 2025 (Archivado)",
            description="Plan de la temporada anterior. Ya no está activo. Sirve para probar filtros include_inactive=false.",
            cycles_data=[
                {
                    "name": "Ciclo Único: Pretemporada 2025",
                    "description": "Plan antiguo inactivo.",
                    "sessions": [
                        {
                            "name": "Entrenamiento General",
                            "notes": "Plan histórico, solo referencia.",
                            "exercises": [
                                {"exercise_name": "Ejercicio genérico 1", "sets": 3, "reps": "10 rep", "rest_seconds": 60},
                                {"exercise_name": "Ejercicio genérico 2", "sets": 3, "reps": "10 rep", "rest_seconds": 60}
                            ]
                        }
                    ]
                }
            ],
            is_active=False  # ← CLAVE: plan desactivado
        )
        db.session.flush()
        print(f"   ✅ Plan creado (INACTIVO): '{plan5.name}' (ID={plan5.id}, is_active=False)")

        # Asignaciones completadas (ya finalizaron)
        assign_plan(plan5, group=groups[0], start_date=today - timedelta(days=120), end_date=today - timedelta(days=90), status="COMPLETED")
        assign_plan(plan5, group=groups[1], start_date=today - timedelta(days=120), end_date=today - timedelta(days=90), status="COMPLETED")
        print(f"      → Asignaciones COMPLETED (históricas)")

        # ═══════════════════════════════════════════════════════════════════
        # CASO 6: PLAN DE RECUPERACIÓN DE LESIONES
        # ═══════════════════════════════════════════════════════════════════
        print("\n" + "-" * 65)
        print("📋 CASO 6: Plan de Recuperación de Lesiones — cargas ligeras")
        print("-" * 65)

        plan6 = build_plan(
            name="Recuperación de Lesiones — Fase 1",
            description="Plan post-lesión para tobillo. Ejercicios de bajo impacto, movilidad articular y fortalecimiento progresivo. Duración: 2 semanas.",
            cycles_data=[
                {
                    "name": "Semana 1: Movilidad y Propiocepción",
                    "description": "Recuperar rango de movimiento y equilibrio.",
                    "sessions": [
                        {
                            "name": "Sesión 1: Movilidad de Tobillo",
                            "notes": "REALIZAR SIN DOLOR. Detenerse si hay molestias.",
                            "exercises": [
                                {"exercise_name": "Movilidad de tobillo (círculos)", "sets": 3, "reps": "10 rep", "rest_seconds": 30},
                                {"exercise_name": "Estiramiento de pantorrilla", "sets": 3, "duration_seconds": 30, "rest_seconds": 30},
                                {"exercise_name": "Alfabeto con el pie", "sets": 2, "reps": "1 rep", "rest_seconds": 30},
                                {"exercise_name": "Propiocepción (un pie, ojos abiertos)", "sets": 3, "duration_seconds": 30, "rest_seconds": 30}
                            ]
                        },
                        {
                            "name": "Sesión 2: Equilibrio",
                            "notes": "Usar superficie estable. Progresar a inestable solo si hay confianza.",
                            "exercises": [
                                {"exercise_name": "Parada en un pie (30s)", "sets": 3, "reps": "30 seg", "duration_seconds": 30, "rest_seconds": 30},
                                {"exercise_name": "Parada en un pie (ojos cerrados)", "sets": 2, "duration_seconds": 15, "rest_seconds": 30},
                                {"exercise_name": "Ejercicio de TheraBand (inversión)", "sets": 3, "reps": "10 rep", "weight": "TheraBand ligera", "rest_seconds": 30},
                                {"exercise_name": "Ejercicio de TheraBand (eversión)", "sets": 3, "reps": "10 rep", "weight": "TheraBand ligera", "rest_seconds": 30}
                            ]
                        }
                    ]
                },
                {
                    "name": "Semana 2: Fortalecimiento Progresivo",
                    "description": "Introducir cargas ligeras. Progresar según tolerancia.",
                    "sessions": [
                        {
                            "name": "Sesión 1: Fortalecimiento",
                            "notes": "Incrementar intensidad gradualmente.",
                            "exercises": [
                                {"exercise_name": "Elevación de talones (bipedestación)", "sets": 3, "reps": "12 rep", "rest_seconds": 30},
                                {"exercise_name": "Sentadilla asistida (silla)", "sets": 3, "reps": "10 rep", "rest_seconds": 45},
                                {"exercise_name": "Bicicleta estática (sin resistencia)", "sets": 1, "duration_seconds": 300, "rest_seconds": 0, "notes": "5 min suave"},
                                {"exercise_name": "Propiocepción avanzada (cojín)", "sets": 3, "duration_seconds": 30, "rest_seconds": 30}
                            ]
                        },
                        {
                            "name": "Sesión 2: Reintroducción a la Marcha",
                            "notes": "Caminata suave. Evaluar respuesta.",
                            "exercises": [
                                {"exercise_name": "Caminata suave (trote progresivo)", "sets": 1, "duration_seconds": 600, "rest_seconds": 0},
                                {"exercise_name": "Talones - puntas", "sets": 3, "reps": "10 rep", "rest_seconds": 30},
                                {"exercise_name": "Estiramiento global", "sets": 1, "duration_seconds": 300, "rest_seconds": 0}
                            ]
                        }
                    ]
                }
            ]
        )
        db.session.flush()
        print(f"   ✅ Plan creado: '{plan6.name}' (ID={plan6.id})")

        # Asignar a un atleta individual
        if athletes:
            individual_athlete = random.choice(athletes)
            assign_plan(plan6, athlete=individual_athlete, start_date=today, end_date=today + timedelta(days=14))
            athlete_user = User.query.get(individual_athlete.user_id)
            name = f"{athlete_user.first_name} {athlete_user.last_name}" if athlete_user else f"ID={individual_athlete.id}"
            print(f"      → Asignado a atleta INDIVIDUAL: {name}")

        # ═══════════════════════════════════════════════════════════════════
        # CASO 7: PLAN MÍNIMO (1 ciclo, 1 sesión, 1 ejercicio)
        # ═══════════════════════════════════════════════════════════════════
        print("\n" + "-" * 65)
        print("📋 CASO 7: Plan MÍNIMO — 1 ciclo, 1 sesión, 1 ejercicio")
        print("-" * 65)

        plan7 = build_plan(
            name="Mini-Plan: Activación Rápida",
            description="Plan ultra simple con un solo ciclo que contiene una sola sesión con un único ejercicio. Útil para probar renderizado de estructuras mínimas.",
            cycles_data=[
                {
                    "name": "Ciclo Único",
                    "description": "Ciclo simple de prueba.",
                    "sessions": [
                        {
                            "name": "Entrenamiento Rápido",
                            "notes": "Sesión exprés de 15 minutos.",
                            "exercises": [
                                {"exercise_name": "Saltos de tijera (Jumping Jacks)", "sets": 5, "reps": "30 seg", "duration_seconds": 30, "rest_seconds": 15, "notes": "Calentamiento rápido"}
                            ]
                        }
                    ]
                }
            ]
        )
        db.session.flush()
        print(f"   ✅ Plan creado (MÍNIMO): '{plan7.name}' (ID={plan7.id})")

        # Asignación cancelada
        if athletes:
            cancel_athlete = random.choice(athletes)
            assign_plan(plan7, athlete=cancel_athlete, start_date=today - timedelta(days=5), end_date=today + timedelta(days=2), status="CANCELLED")
            print(f"      → Asignación CANCELLED para atleta (para probar filtro por status)")

        # ═══════════════════════════════════════════════════════════════════
        # CASO 8: PLAN VACÍO (sin ciclos)
        # ═══════════════════════════════════════════════════════════════════
        print("\n" + "-" * 65)
        print("📋 CASO 8: Plan VACÍO — 0 ciclos (solo existe el plan)")
        print("-" * 65)

        plan8 = build_plan(
            name="Plan Vacío (Estructura Base)",
            description="Plan recién creado sin ciclos, sesiones ni ejercicios. Simula el estado inicial antes de que el entrenador agregue contenido. Útil para probar edge cases en el frontend.",
            cycles_data=[]  # ← Sin ciclos
        )
        db.session.flush()
        print(f"   ✅ Plan creado (VACÍO): '{plan8.name}' (ID={plan8.id}, cycles=0)")

        # ═══════════════════════════════════════════════════════════════════
        # CASO 9: PLAN CON EJERCICIOS DE TIEMPO (duration_seconds variado)
        # ═══════════════════════════════════════════════════════════════════
        print("\n" + "-" * 65)
        print("📋 CASO 9: Plan de Ejercicios por Tiempo — durations variados")
        print("-" * 65)

        plan9 = build_plan(
            name="Entrenamiento por Intervalos (Tabata / HIIT)",
            description="Plan de alta intensidad con todos los ejercicios basados en duración. No usa reps ni weight. Demuestra cómo funciona duration_seconds vs sets/reps.",
            cycles_data=[
                {
                    "name": "Protocolo Tabata 20/10",
                    "description": "20 segundos de trabajo, 10 segundos de descanso. 8 rondas = 4 minutos por ejercicio.",
                    "sessions": [
                        {
                            "name": "Sesión Tabata Full Body",
                            "notes": "Cada ejercicio: 8 rondas de 20s trabajo / 10s descanso. Máxima intensidad.",
                            "exercises": [
                                {"exercise_name": "Burpees", "sets": 8, "duration_seconds": 20, "rest_seconds": 10},
                                {"exercise_name": "Sentadillas con salto", "sets": 8, "duration_seconds": 20, "rest_seconds": 10},
                                {"exercise_name": "Flexiones explosivas", "sets": 8, "duration_seconds": 20, "rest_seconds": 10},
                                {"exercise_name": "Mountain Climbers", "sets": 8, "duration_seconds": 20, "rest_seconds": 10},
                                {"exercise_name": "Descanso activo (trote suave)", "sets": 1, "duration_seconds": 120, "rest_seconds": 0},
                                {"exercise_name": "Plancha con toque de hombro", "sets": 8, "duration_seconds": 20, "rest_seconds": 10}
                            ]
                        }
                    ]
                },
                {
                    "name": "Circuitos 45/15",
                    "description": "45 segundos trabajo, 15 segundos descanso. 3 rondas completas.",
                    "sessions": [
                        {
                            "name": "Circuito de Fuerza",
                            "notes": "3 rondas. 10 seg entre estaciones, 90 seg entre rondas.",
                            "exercises": [
                                {"exercise_name": "Sentadilla copa", "sets": 3, "duration_seconds": 45, "rest_seconds": 15, "weight": "Mancuerna 8kg"},
                                {"exercise_name": "Remo con banda", "sets": 3, "duration_seconds": 45, "rest_seconds": 15, "weight": "Banda elástica"},
                                {"exercise_name": "Press militar", "sets": 3, "duration_seconds": 45, "rest_seconds": 15, "weight": "Mancuernas 6kg"},
                                {"exercise_name": "Peso muerto rumano", "sets": 3, "duration_seconds": 45, "rest_seconds": 15, "weight": "Mancuernas 10kg"},
                                {"exercise_name": "Descanso entre rondas", "sets": 1, "duration_seconds": 90, "rest_seconds": 0}
                            ]
                        }
                    ]
                }
            ]
        )
        db.session.flush()
        print(f"   ✅ Plan creado: '{plan9.name}' (ID={plan9.id})")

        assign_plan(plan9, group=groups[0], start_date=today, end_date=today + timedelta(days=14))
        print(f"      → Asignado a grupo: {groups[0].name}")

        # ═══════════════════════════════════════════════════════════════════
        # CASO 10: PLAN AVANZADO DE FUERZA Y ACONDICIONAMIENTO
        # ═══════════════════════════════════════════════════════════════════
        print("\n" + "-" * 65)
        print("📋 CASO 10: Plan Avanzado — Fuerza y Potencia (con pesos reales)")
        print("-" * 65)

        plan10 = build_plan(
            name="Fuerza y Potencia — Nivel Avanzado",
            description="Plan de 3 semanas para desarrollo de fuerza máxima y potencia explosiva. Incluye progresión de cargas (weight variable) y periodización ondulante. Para atletas Sub-18 y selectivo.",
            cycles_data=[
                {
                    "name": "Semana 1: Fuerza Base",
                    "description": "Adaptación neuromuscular. Pesos moderados (60-70% 1RM estimado).",
                    "sessions": [
                        {
                            "name": "Día A: Tren Inferior",
                            "notes": "Enfocar en técnica de sentadilla y peso muerto. Control excéntrico.",
                            "exercises": [
                                {"exercise_name": "Sentadilla con barra", "sets": 4, "reps": "8 rep", "weight": "40 kg", "rest_seconds": 90},
                                {"exercise_name": "Peso muerto convencional", "sets": 4, "reps": "6 rep", "weight": "50 kg", "rest_seconds": 120},
                                {"exercise_name": "Prensa de piernas", "sets": 3, "reps": "10 rep", "weight": "70 kg", "rest_seconds": 60},
                                {"exercise_name": "Zancadas con mancuernas", "sets": 3, "reps": "8 rep", "weight": "12 kg", "rest_seconds": 60}
                            ]
                        },
                        {
                            "name": "Día B: Tren Superior",
                            "notes": "Ejercicios de empuje y tracción. Escapular activo.",
                            "exercises": [
                                {"exercise_name": "Press banca con barra", "sets": 4, "reps": "8 rep", "weight": "30 kg", "rest_seconds": 90},
                                {"exercise_name": "Remo con barra (Pendlay)", "sets": 4, "reps": "8 rep", "weight": "35 kg", "rest_seconds": 90},
                                {"exercise_name": "Press militar con mancuernas", "sets": 3, "reps": "10 rep", "weight": "10 kg", "rest_seconds": 60},
                                {"exercise_name": "Dominadas (lastre)", "sets": 3, "reps": "6 rep", "weight": "Peso corporal + 5kg", "rest_seconds": 60}
                            ]
                        }
                    ]
                },
                {
                    "name": "Semana 2: Fuerza Máxima",
                    "description": "Incremento de carga (75-85% 1RM). Bajas repeticiones.",
                    "sessions": [
                        {
                            "name": "Día A: Sentadilla y Accesorios",
                            "notes": "Cargas pesadas. Spotter obligatorio.",
                            "exercises": [
                                {"exercise_name": "Sentadilla con barra (pesada)", "sets": 5, "reps": "5 rep", "weight": "55 kg", "rest_seconds": 120},
                                {"exercise_name": "Peso muerto rumano", "sets": 4, "reps": "6 rep", "weight": "45 kg", "rest_seconds": 90},
                                {"exercise_name": "Elevación de cadera (glute bridge)", "sets": 3, "reps": "10 rep", "weight": "30 kg", "rest_seconds": 60},
                                {"exercise_name": "Curl femoral tumbado", "sets": 3, "reps": "10 rep", "weight": "Máquina 25 kg", "rest_seconds": 60}
                            ]
                        },
                        {
                            "name": "Día B: Press Banca y Accesorios",
                            "notes": "Press pesado. Cuidado con hombros.",
                            "exercises": [
                                {"exercise_name": "Press banca (pesado)", "sets": 5, "reps": "5 rep", "weight": "40 kg", "rest_seconds": 120},
                                {"exercise_name": "Remo con mancuerna (unilateral)", "sets": 4, "reps": "8 rep", "weight": "18 kg", "rest_seconds": 60},
                                {"exercise_name": "Fondos en paralelas", "sets": 3, "reps": "8 rep", "weight": "Peso corporal", "rest_seconds": 60},
                                {"exercise_name": "Face pull con banda", "sets": 3, "reps": "15 rep", "weight": "Banda ligera", "rest_seconds": 45}
                            ]
                        }
                    ]
                },
                {
                    "name": "Semana 3: Potencia Explosiva",
                    "description": "Movimientos olímpicos y pliometría. Velocidad sobre fuerza.",
                    "sessions": [
                        {
                            "name": "Día Único: Potencia",
                            "notes": "Realizar al inicio de la sesión, antes de fatiga. Calentamiento completo.",
                            "exercises": [
                                {"exercise_name": "Clean + Press (técnica)", "sets": 5, "reps": "3 rep", "weight": "30 kg", "rest_seconds": 120},
                                {"exercise_name": "Snatch (técnica, desde bloque)", "sets": 5, "reps": "3 rep", "weight": "25 kg", "rest_seconds": 120},
                                {"exercise_name": "Saltos con contramovimiento", "sets": 4, "reps": "5 rep", "weight": "Peso corporal", "rest_seconds": 60},
                                {"exercise_name": "Lanzamiento de balón medicinal", "sets": 3, "reps": "6 rep", "weight": "Balón 5 kg", "rest_seconds": 60}
                            ]
                        }
                    ]
                }
            ]
        )
        db.session.flush()
        print(f"   ✅ Plan creado: '{plan10.name}' (ID={plan10.id})")

        if len(groups) >= 5:
            assign_plan(plan10, group=groups[4], start_date=today + timedelta(days=7), end_date=today + timedelta(days=28))
            print(f"      → Asignado a grupo: {groups[4].name} (inicia en 7 días)")

        # ── Asignaciones adicionales variadas ──────────────────────────────
        print("\n" + "-" * 65)
        print("📎 ASIGNACIONES ADICIONALES VARIADAS")
        print("-" * 65)

        # Asignación a atleta individual en plan 1
        if athletes:
            extra_athlete = random.choice(athletes)
            assign_plan(plan1, athlete=extra_athlete, start_date=today, end_date=today + timedelta(days=28))
            print(f"   ✅ Plan 1 también asignado a atleta individual")

        # Asignación completada en plan 2 (histórica)
        assign_plan(plan2, group=groups[0], start_date=today - timedelta(days=30), end_date=today - timedelta(days=16), status="COMPLETED")
        print(f"   ✅ Asignación COMPLETED en Plan 2 (ya finalizó)")

        # ═══════════════════════════════════════════════════════════════════
        # COMMIT FINAL
        # ═══════════════════════════════════════════════════════════════════
        db.session.commit()

        # ── RESUMEN ────────────────────────────────────────────────────────
        total_plans = TrainingPlan.query.filter_by(club_id=club.id).count()
        total_cycles = TrainingCycle.query.join(TrainingPlan).filter(TrainingPlan.club_id == club.id).count()
        total_sessions = TrainingSession.query.join(TrainingCycle).join(TrainingPlan).filter(TrainingPlan.club_id == club.id).count()
        total_exercises = TrainingExercise.query.join(TrainingSession).join(TrainingCycle).join(TrainingPlan).filter(TrainingPlan.club_id == club.id).count()
        total_assignments = TrainingPlanAssignment.query.join(TrainingPlan).filter(TrainingPlan.club_id == club.id).count()

        print("\n" + "=" * 65)
        print("✅  DATOS DE PLANES DE ENTRENAMIENTO CREADOS EXITOSAMENTE")
        print("=" * 65)
        print(f"\n📊 RESUMEN:")
        print(f"   📋 Planes de entrenamiento: {total_plans}")
        print(f"   🔄 Ciclos:                 {total_cycles}")
        print(f"   📅 Sesiones:               {total_sessions}")
        print(f"   🏋️  Ejercicios:             {total_exercises}")
        print(f"   📎 Asignaciones:           {total_assignments}")
        print()
        print(f"📋 CASOS CREADOS:")
        print(f"   1.  Pretemporada Completa (4 ciclos, 12 sesiones, ~42 ejercicios)")
        print(f"   2.  Técnica Individual (2 ciclos, 4 sesiones)")
        print(f"   3.  Preparación Física (solo duration_seconds, sin reps)")
        print(f"   4.  Táctica (3 ciclos, sistemas de juego)")
        print(f"   5.  🔴 INACTIVO / Archivado (is_active=False)")
        print(f"   6.  Recuperación de Lesiones (asignado a atleta INDIVIDUAL)")
        print(f"   7.  🟢 MÍNIMO (1 ciclo, 1 sesión, 1 ejercicio)")
        print(f"   8.  ⚪ VACÍO (0 ciclos, solo plan)")
        print(f"   9.  HIIT / Tabata (todos con duration_seconds variado)")
        print(f"   10. Fuerza Avanzada (con pesos reales y progresión)")
        print()
        print(f"📎 ASIGNACIONES VARIADAS:")
        print(f"   - A grupos (Sub-10, Sub-12, Sub-15, Sub-18)")
        print(f"   - A atleta individual")
        print(f"   - Estado ACTIVE")
        print(f"   - Estado COMPLETED")
        print(f"   - Estado CANCELLED")
        print(f"   - Con fechas futuras (inician en 7 días)")
        print(f"   - Con fechas pasadas (históricas)")
        print()
        print(f"🔑 ENDPOINTS PRINCIPALES:")
        print(f"   GET    /api/training-plans                    → Listar planes")
        print(f"   GET    /api/training-plans/<id>               → Ver plan completo")
        print(f"   POST   /api/training-plans                    → Crear plan")
        print(f"   PUT    /api/training-plans/<id>               → Actualizar plan")
        print(f"   DELETE /api/training-plans/<id>               → Desactivar plan")
        print(f"   PATCH  /api/training-plans/<id>/reactivate    → Reactivar plan")
        print(f"   POST   /api/training-plans/<id>/assign        → Asignar plan")
        print(f"   DELETE /api/training-plans/assignments/<id>   → Eliminar asignación")
        print(f"   GET    /api/training-plans/athlete/<id>       → Planes de atleta")
        print(f"\n🔍 Para probar filtro de inactivos:")
        print(f"   GET /api/training-plans?include_inactive=true")


if __name__ == "__main__":
    seed_training_plans()
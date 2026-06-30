"""
seed_demo.py — Datos de prueba para DEMO de venta
Club: Fútbol Elite Academy (club premium de fútbol juvenil)
"""
import random
from datetime import date, timedelta, datetime
from app import create_app, db
from app.models.club import Club
from app.models.category import Category
from app.models.user import User
from app.models.athlete import Athlete, Guardian, MedicalInfo, AcademicInfo
from app.models.group import Group, GroupHistory
from app.models.payment import Payment
from app.models.attendance import Attendance
from app.models.trainer import TrainerProfile
from app.services.test_service import TestService
from app.models.training_plan import TrainingPlan, TrainingCycle, TrainingSession, TrainingExercise, TrainingPlanAssignment
from app.models.landing import ClubLandingPage


# ─── Constantes ──────────────────────────────────────────────────────────────
BLOOD_TYPES = ["A+", "A-", "B+", "O+", "O-", "AB+"]
PAYMENT_METHODS = ["Nequi", "Daviplata", "Transferencia Bancaria", "Efectivo", "PSE"]
SCHOOLS = [
    "Colegio San José", "Instituto Técnico Industrial", "Liceo de Cervantes",
    "Colegio Montessori", "Instituto La Salle", "Colegio Champagnat",
    "Liceo Femenino", "Colegio Bolívar", "Instituto de Oriente"
]


def rphone():
    return f"3{random.randint(0,2)}{random.randint(0,9)}{random.randint(1000000,9999999)}"


def rbirth(min_age=8, max_age=18):
    return date.today() - timedelta(days=random.randint(min_age*365, max_age*365))


def safe_email(text):
    return (text.lower()
            .replace('á','a').replace('é','e').replace('í','i')
            .replace('ó','o').replace('ú','u').replace('ñ','n')
            .replace(' ','_'))


def seed_demo():
    app = create_app()
    with app.app_context():
        print("⚙️  Creando datos de DEMO para Fútbol Elite Academy...")
        print("=" * 60)

        today = date.today()
        start_date = today - timedelta(days=90)
        pay_months = [
            (date(2026, 3, 1), "Mensualidad Marzo 2026"),
            (date(2026, 4, 1), "Mensualidad Abril 2026"),
            (date(2026, 5, 1), "Mensualidad Mayo 2026"),
            (date(2026, 6, 1), "Mensualidad Junio 2026"),
        ]

        # ── SUPER ADMIN ───────────────────────────────────────────────────────
        sa = User.query.filter_by(email="super@admin.com").first()
        if not sa:
            sa = User(email="super@admin.com", identification_number="0000000001",
                      first_name="Super", last_name="Admin", role="SUPER_ADMIN")
            sa.set_password("super123")
            db.session.add(sa)
            db.session.flush()
            print("   ✓ Super Admin creado")
        else:
            print("   ✓ Super Admin ya existe")

        # ══════════════════════════════════════════════════════════════════════
        # CLUB PRINCIPAL — FÚTBOL ELITE ACADEMY
        # ══════════════════════════════════════════════════════════════════════
        print("\n📌 Club: Fútbol Elite Academy")
        club = Club(
            name="Fútbol Elite Academy",
            slug="futbol-elite",
            sport="Fútbol",
            description="Academia de fútbol juvenil de alto rendimiento. Formamos campeones dentro y fuera de la cancha con metodología profesional y valores sólidos.",
            subscription_status="ACTIVE",
            plan_type="PRO",
            subscription_end_date=datetime(2027, 12, 31, 23, 59, 59),
            primary_color="#10b981",
            welcome_message="Bienvenido a la academia de fútbol más exclusiva. Donde los sueños se convierten en realidad."
        )
        db.session.add(club)
        db.session.flush()

        # Categorías
        cat_u10 = Category(name="Sub-10", club_id=club.id)
        cat_u12 = Category(name="Sub-12", club_id=club.id)
        cat_u15 = Category(name="Sub-15", club_id=club.id)
        cat_u18 = Category(name="Sub-18", club_id=club.id)
        db.session.add_all([cat_u10, cat_u12, cat_u15, cat_u18])
        db.session.flush()

        # ── ADMINISTRADOR ────────────────────────────────────────────────────
        admin = User(
            email="admin@futbolelite.com",
            identification_number="1234567890",
            first_name="Carlos",
            last_name="Mendoza",
            role="ADMIN",
            club_id=club.id,
            phone="3101234567"
        )
        admin.set_password("admin123")
        db.session.add(admin)
        db.session.flush()
        print("   ✓ Admin creado")

        # ── ENTRENADORES ─────────────────────────────────────────────────────
        trainers_data = [
            {
                "email": "entrenador1@futbolelite.com",
                "id_number": "9876543210",
                "first_name": "Roberto",
                "last_name": "García",
                "phone": "3112345678",
                "birth_date": date(1985, 3, 15),
                "gender": "Masculino",
                "city": "Bogotá",
                "state": "Cundinamarca",
                "specialization": "Fútbol",
                "education_level": "Profesional",
                "institution": "Universidad Nacional",
                "degree_title": "Licenciatura en Educación Física",
                "graduation_year": 2008,
                "years_of_experience": 15,
                "certifications": "Licencia CONMEBOL B, Primeros Auxilios, Preparación Física",
                "bio": "Entrenador con 15 años de experiencia en formación juvenil. Ex-jugador profesional.",
                "hire_date": date(2022, 1, 15),
                "contract_type": "Tiempo completo",
                "salary": 4500000,
                "payment_frequency": "Mensual",
                "bank_name": "Bancolombia",
                "status": "ACTIVE"
            },
            {
                "email": "entrenador2@futbolelite.com",
                "id_number": "9876543211",
                "first_name": "Andrés",
                "last_name": "López",
                "phone": "3123456789",
                "birth_date": date(1990, 7, 22),
                "gender": "Masculino",
                "city": "Bogotá",
                "state": "Cundinamarca",
                "specialization": "Fútbol",
                "education_level": "Técnico",
                "institution": "SENA",
                "degree_title": "Técnico Deportivo",
                "graduation_year": 2012,
                "years_of_experience": 10,
                "certifications": "Entrenador de Arqueros, Metodología de la Enseñanza",
                "bio": "Especialista en formación de arqueros y táctica defensiva.",
                "hire_date": date(2023, 3, 1),
                "contract_type": "Medio tiempo",
                "salary": 2800000,
                "payment_frequency": "Mensual",
                "bank_name": "Davivienda",
                "status": "ACTIVE"
            },
            {
                "email": "entrenador3@futbolelite.com",
                "id_number": "9876543212",
                "first_name": "María",
                "last_name": "Rodríguez",
                "phone": "3134567890",
                "birth_date": date(1988, 11, 8),
                "gender": "Femenino",
                "city": "Bogotá",
                "state": "Cundinamarca",
                "specialization": "Fútbol",
                "education_level": "Profesional",
                "institution": "Universidad de los Andes",
                "degree_title": "Licenciatura en Educación Física",
                "graduation_year": 2011,
                "years_of_experience": 12,
                "certifications": "Preparación Física, Nutrición Deportiva",
                "bio": "Especialista en preparación física y rendimiento deportivo juvenil.",
                "hire_date": date(2022, 6, 1),
                "contract_type": "Tiempo completo",
                "salary": 4000000,
                "payment_frequency": "Mensual",
                "bank_name": "Banco de Bogotá",
                "status": "ACTIVE"
            }
        ]

        trainers = []
        for t_data in trainers_data:
            t_user = User(
                email=t_data["email"],
                identification_number=t_data["id_number"],
                first_name=t_data["first_name"],
                last_name=t_data["last_name"],
                role="TRAINER",
                club_id=club.id,
                phone=t_data["phone"]
            )
            t_user.set_password("trainer123")
            db.session.add(t_user)
            db.session.flush()

            profile = TrainerProfile(
                user_id=t_user.id,
                birth_date=t_data["birth_date"],
                gender=t_data["gender"],
                city=t_data["city"],
                state=t_data["state"],
                specialization=t_data["specialization"],
                education_level=t_data["education_level"],
                institution=t_data["institution"],
                degree_title=t_data["degree_title"],
                graduation_year=t_data["graduation_year"],
                years_of_experience=t_data["years_of_experience"],
                certifications=t_data["certifications"],
                bio=t_data["bio"],
                hire_date=t_data["hire_date"],
                contract_type=t_data["contract_type"],
                salary=t_data["salary"],
                payment_frequency=t_data["payment_frequency"],
                bank_name=t_data["bank_name"],
                status=t_data["status"]
            )
            db.session.add(profile)
            trainers.append(t_user)
        db.session.flush()
        print(f"   ✓ {len(trainers)} entrenadores creados")

        # ── GRUPOS ───────────────────────────────────────────────────────────
        groups_data = [
            {
                "name": "Sub-10 A - Formación",
                "category": cat_u10,
                "description": "Grupo de iniciación para niños de 8-10 años. Enfoque en diversión y desarrollo motor.",
                "max_capacity": 15,
                "schedule": "Lun-Mie-Vie 4PM",
                "schedule_days": "Lunes,Miércoles,Viernes",
                "schedule_start_time": "16:00",
                "schedule_end_time": "17:30",
                "training_location": "Cancha Sintética El Campín",
                "level": "Principiante",
                "season": "2026 - Primer Semestre",
                "monthly_fee": 180000,
                "status": "ACTIVE",
                "trainer": trainers[0],
                "days": {0, 2, 4}
            },
            {
                "name": "Sub-10 B - Intermedio",
                "category": cat_u10,
                "description": "Grupo intermedio con conocimientos básicos de fútbol.",
                "max_capacity": 15,
                "schedule": "Mar-Jue 4PM",
                "schedule_days": "Martes,Jueves",
                "schedule_start_time": "16:00",
                "schedule_end_time": "17:30",
                "training_location": "Cancha Sintética El Campín",
                "level": "Intermedio",
                "season": "2026 - Primer Semestre",
                "monthly_fee": 180000,
                "status": "ACTIVE",
                "trainer": trainers[0],
                "days": {1, 3}
            },
            {
                "name": "Sub-12 - Desarrollo",
                "category": cat_u12,
                "description": "Desarrollo de habilidades técnicas y tácticas básicas.",
                "max_capacity": 18,
                "schedule": "Lun-Mie-Vie 5PM",
                "schedule_days": "Lunes,Miércoles,Viernes",
                "schedule_start_time": "17:00",
                "schedule_end_time": "18:30",
                "training_location": "Cancha Principal",
                "level": "Intermedio",
                "season": "2026 - Primer Semestre",
                "monthly_fee": 200000,
                "status": "ACTIVE",
                "trainer": trainers[1],
                "days": {0, 2, 4}
            },
            {
                "name": "Sub-15 - Competitivo",
                "category": cat_u15,
                "description": "Equipo competitivo para torneos locales y regionales.",
                "max_capacity": 20,
                "schedule": "Lun-Mie-Vie-Sáb 6PM",
                "schedule_days": "Lunes,Miércoles,Viernes,Sábado",
                "schedule_start_time": "18:00",
                "schedule_end_time": "19:30",
                "training_location": "Cancha Principal",
                "level": "Avanzado",
                "season": "2026 - Primer Semestre",
                "monthly_fee": 250000,
                "status": "ACTIVE",
                "trainer": trainers[0],
                "days": {0, 2, 4, 5}
            },
            {
                "name": "Sub-18 - Selectivo",
                "category": cat_u18,
                "description": "Equipo selectivo para jugadores de alto rendimiento. Preparación para torneos nacionales.",
                "max_capacity": 22,
                "schedule": "Mar-Jue-Sáb 6PM",
                "schedule_days": "Martes,Jueves,Sábado",
                "schedule_start_time": "18:00",
                "schedule_end_time": "20:00",
                "training_location": "Cancha Principal",
                "level": "Avanzado",
                "season": "2026 - Primer Semestre",
                "monthly_fee": 280000,
                "status": "ACTIVE",
                "trainer": trainers[2],
                "days": {1, 3, 5}
            }
        ]

        groups = []
        for g_data in groups_data:
            g = Group(
                name=g_data["name"],
                club_id=club.id,
                category_id=g_data["category"].id,
                description=g_data["description"],
                max_capacity=g_data["max_capacity"],
                schedule=g_data["schedule"],
                schedule_days=g_data["schedule_days"],
                schedule_start_time=g_data["schedule_start_time"],
                schedule_end_time=g_data["schedule_end_time"],
                training_location=g_data["training_location"],
                level=g_data["level"],
                season=g_data["season"],
                monthly_fee=g_data["monthly_fee"],
                status=g_data["status"]
            )
            db.session.add(g)
            db.session.flush()
            g.trainers.append(g_data["trainer"])
            groups.append((g, g_data["days"]))
        print(f"   ✓ {len(groups)} grupos creados")

        # ── ATLETAS ──────────────────────────────────────────────────────────
        athletes_data = [
            # Sub-10
            ("Santiago", "Gómez", 0), ("Mateo", "Rodríguez", 0),
            ("Sebastián", "Martínez", 0), ("Nicolás", "López", 0),
            ("Daniel", "Hernández", 0), ("Samuel", "García", 0),
            ("Emiliano", "Fernández", 0), ("Alejandro", "Díaz", 0),
            ("Lucas", "Moreno", 0), ("Martín", "Jiménez", 0),
            ("Valentino", "Ruiz", 1), ("Joaquín", "Álvarez", 1),
            ("Diego", "Romero", 1), ("Adrián", "Gutiérrez", 1),
            ("Pablo", "Navarro", 1),
            # Sub-12
            ("Andrés", "Rojas", 2), ("Cristian", "Vargas", 2),
            ("Felipe", "Castillo", 2), ("Juan Pablo", "Mendoza", 2),
            ("Carlos", "Ortega", 2), ("Tomás", "Silva", 2),
            ("Julián", "Ramos", 2), ("Santiago", "Castro", 2),
            # Sub-15
            ("David", "Ortiz", 3), ("Brian", "Delgado", 3),
            ("Kevin", "Morales", 3), ("Brandon", "Reyes", 3),
            ("Jhon", "Cruz", 3), ("Dylan", "Medina", 3),
            ("Thomas", "Aguilar", 3), ("Mathías", "Herrera", 3),
            ("Facundo", "Vega", 3), ("Rafael", "Soto", 3),
            # Sub-18
            ("Esteban", "Molina", 4), ("Camilo", "Rincón", 4),
            ("Sergio", "Pérez", 4), ("Iván", "Luna", 4),
            ("Mauricio", "Cárdenas", 4), ("Fabián", "Ríos", 4),
            ("César", "Mejía", 4), ("Óscar", "Barrera", 4),
        ]

        athlete_objects = []
        for idx, (fn, ln, gidx) in enumerate(athletes_data):
            cedula = f"10{idx+1:08d}"
            email = f"{safe_email(fn)}.{safe_email(ln)}@futbolelite.com"
            
            # Generar segundo apellido aleatorio
            second_ln = random.choice(["García", "López", "Martínez", "Rodríguez", "Hernández", "González", "Díaz", "Moreno"])
            
            u = User(
                email=email,
                identification_number=cedula,
                document_type=random.choice(["CC", "TI", "CE"]),
                first_name=fn,
                last_name=ln,
                second_last_name=second_ln,
                gender=random.choice(["Masculino", "Femenino"]),
                blood_type=random.choice(BLOOD_TYPES),
                birth_city=random.choice(["Bogotá", "Medellín", "Cali", "Barranquilla", "Cartagena"]),
                birth_country="Colombia",
                role="ATHLETE",
                club_id=club.id,
                phone=rphone(),
                fixed_phone=f"601{random.randint(1000000, 9999999)}",
                address=f"Calle {random.randint(10,80)} #{random.randint(10,80)}-{random.randint(10,80)}",
                neighborhood=random.choice(["Centro", "Norte", "Sur", "Occidente", "Oriente"]),
                insurance=random.choice(["Sura", "Nueva EPS", "Sanitas", "Coomeva"]),
                uniforms=random.choice(["Completo", "Parcial", "Pendiente"]),
                start_date=date.today() - timedelta(days=random.randint(30, 180))
            )
            u.set_password("athlete123")
            db.session.add(u)
            db.session.flush()

            a = Athlete(
                user_id=u.id,
                birth_date=rbirth(8, 18),
                birth_city=u.birth_city,
                birth_country=u.birth_country,
                phone=u.phone,
                fixed_phone=u.fixed_phone,
                address=u.address,
                neighborhood=u.neighborhood,
                insurance=u.insurance,
                uniforms=u.uniforms,
                start_date=u.start_date,
                eps=u.insurance,
                physical_diseases=random.choice([None, "Ninguna", "Asma leve"]),
                medical_diseases=random.choice([None, "Ninguna", "Dermatitis"]),
                allergies=random.choice([None, "Ninguna", "Polen", "Lactosa"]),
                physical_disability=random.choice([None, "Ninguna"])
            )
            db.session.add(a)
            db.session.flush()

            # Información médica
            emergency_name = f"{random.choice(['María','Carlos','Jorge','Ana','Luis'])} {ln}"
            db.session.add(MedicalInfo(
                athlete_id=a.id,
                blood_type=u.blood_type,
                allergies=a.allergies,
                conditions=f"Enfermedades físicas: {a.physical_diseases or 'Ninguna'}\nEnfermedades médicas: {a.medical_diseases or 'Ninguna'}",
                physical_diseases=a.physical_diseases,
                medical_diseases=a.medical_diseases,
                physical_disability=a.physical_disability,
                emergency_contact=emergency_name,
                emergency_phone=rphone(),
                emergency_relationship=random.choice(["Padre", "Madre", "Tío/a", "Abuelo/a"]),
                emergency_alternate=rphone()
            ))

            # Acudiente (padre/madre)
            father_name = f"{random.choice(['Carlos','Jorge','Luis','Miguel','Andrés'])} {ln} {second_ln}"
            mother_name = f"{random.choice(['María','Ana','Patricia','Laura','Carmen'])} {ln} {second_ln}"
            
            db.session.add(Guardian(
                athlete_id=a.id,
                father_first_last_name=ln,
                father_second_last_name=second_ln,
                father_first_name=random.choice(["Carlos", "Jorge", "Luis", "Miguel", "Andrés"]),
                father_home_address=u.address,
                father_work_address=f"Centro Empresarial, Bogotá",
                father_phone=rphone(),
                mother_first_last_name=ln,
                mother_second_last_name=second_ln,
                mother_first_name=random.choice(["María", "Ana", "Patricia", "Laura", "Carmen"]),
                mother_home_address=u.address,
                mother_work_address=f"Industrial Park, Bogotá",
                mother_phone=rphone(),
                name=random.choice([father_name, mother_name]),
                relationship=random.choice(["Padre", "Madre"]),
                phone=rphone(),
                email=f"acudiente.{safe_email(ln)}@gmail.com"
            ))

            # Información académica
            db.session.add(AcademicInfo(
                athlete_id=a.id,
                school_name=random.choice(SCHOOLS),
                grade=random.choice(["5°", "6°", "7°", "8°", "9°", "10°", "11°"]),
                academic_level=random.choice(["Primaria", "Secundaria", "Bachillerato"])
            ))

            # Asignar a grupo
            grp, _ = groups[gidx]
            grp.athletes.append(a)
            db.session.add(GroupHistory(
                athlete_id=a.id,
                group_id=grp.id,
                action="JOINED",
                date=datetime.now() - timedelta(days=random.randint(30, 90))
            ))
            athlete_objects.append((a, gidx))

        db.session.flush()
        print(f"   ✓ {len(athlete_objects)} atletas creados")

        # ── PAGOS ────────────────────────────────────────────────────────────
        payments_count = 0
        for a, gidx in athlete_objects:
            grp, _ = groups[gidx]
            fee = int(grp.monthly_fee)
            
            for due_dt, desc in pay_months:
                roll = random.random()
                if due_dt.month < date.today().month or (due_dt.month == date.today().month and roll < 0.75):
                    status = "PAID"
                    paid_date = datetime(due_dt.year, due_dt.month, random.randint(1, 15))
                elif roll < 0.85:
                    status = "PENDING"
                    paid_date = None
                else:
                    status = "OVERDUE"
                    paid_date = None
                
                db.session.add(Payment(
                    athlete_id=a.id,
                    amount=fee,
                    payment_date=paid_date or datetime(due_dt.year, due_dt.month, 1),
                    due_date=due_dt,
                    status=status,
                    payment_method=random.choice(PAYMENT_METHODS) if status == "PAID" else None,
                    description=desc
                ))
                payments_count += 1

        print(f"   ✓ {payments_count} pagos creados")

        # ── ASISTENCIAS (90 días) ────────────────────────────────────────────
        attendance_count = 0
        cur = start_date
        while cur <= today:
            wd = cur.weekday()
            for a, gidx in athlete_objects:
                grp, days_set = groups[gidx]
                if wd in days_set:
                    roll = random.random()
                    st = "PRESENT" if roll < 0.80 else ("ABSENT" if roll < 0.93 else "EXCUSED")
                    db.session.add(Attendance(
                        athlete_id=a.id,
                        group_id=grp.id,
                        date=cur,
                        status=st,
                        notes="Entrenamiento regular" if st == "PRESENT" else None
                    ))
                    attendance_count += 1
            cur += timedelta(days=1)

        print(f"   ✓ {attendance_count} asistencias registradas")

        # ── TESTS FÍSICOS ────────────────────────────────────────────────────
        TestService.seed_predefined_tests()
        print("   ✓ 18 tests predefinidos creados")

        from app.models.test import TestTemplate, TestResult, TestSession
        
        templates = TestTemplate.query.filter_by(is_predefined=True).all()
        all_athletes = Athlete.query.all()
        all_trainers = User.query.filter_by(role='TRAINER').all() + User.query.filter_by(role='ADMIN').all()

        if templates and all_athletes and all_trainers:
            test_results_count = 0
            sessions_count = 0
            
            session_names = [
                "Evaluación Física Inicial - Temporada 2026",
                "Control de Rendimiento - Mes 2",
                "Evaluación de Progreso - Mes 4"
            ]

            for s_idx, session_name in enumerate(session_names):
                session_date = today - timedelta(days=60 - (s_idx * 20))
                trainer = random.choice(all_trainers)
                
                session = TestSession(
                    name=session_name,
                    club_id=club.id,
                    trainer_id=trainer.id,
                    session_date=session_date,
                    notes=f"Sesión de evaluación {session_name.lower()}"
                )
                db.session.add(session)
                db.session.flush()

                session_athletes = random.sample(all_athletes, min(random.randint(8, 12), len(all_athletes)))
                session_templates = random.sample(templates, min(random.randint(4, 6), len(templates)))

                for athlete in session_athletes:
                    for template in session_templates:
                        if template.unit == "metros":
                            value = round(random.uniform(1200, 2800), 0)
                        elif template.unit == "segundos":
                            value = round(random.uniform(6.0, 16.0), 2)
                        elif template.unit == "repeticiones":
                            value = round(random.uniform(15, 55), 0)
                        elif template.unit == "kg":
                            value = round(random.uniform(35, 100), 1)
                        elif template.unit == "centimetros":
                            value = round(random.uniform(160, 270), 0)
                        elif template.unit == "nivel":
                            value = round(random.uniform(6, 13), 1)
                        else:
                            value = round(random.uniform(15, 95), 1)

                        result = TestResult(
                            template_id=template.id,
                            athlete_id=athlete.id,
                            trainer_id=trainer.id,
                            session_id=session.id,
                            value=value,
                            notes=random.choice([None, "Buen rendimiento", "Mejorar técnica", "Condiciones óptimas", "Progreso notable"]),
                            test_date=session_date
                        )
                        db.session.add(result)
                        test_results_count += 1

                sessions_count += 1

            db.session.commit()
            print(f"   ✓ {sessions_count} sesiones de tests")
            print(f"   ✓ {test_results_count} resultados de tests")

        # ── PLANES DE ENTRENAMIENTO ──────────────────────────────────────────
        for pc in [club]:
            trainer = User.query.filter_by(role='TRAINER', club_id=pc.id).first()
            if not trainer:
                trainer = User.query.filter_by(role='ADMIN', club_id=pc.id).first()
            if not trainer:
                continue

            # Plan 1: Desarrollo Técnico
            plan1 = TrainingPlan(
                name=f"Desarrollo Técnico - {pc.name}",
                description="Plan de 4 semanas enfocado en mejora de habilidades técnicas: control de balón, pase, dribbling y finalización.",
                club_id=pc.id,
                created_by=trainer.id
            )
            db.session.add(plan1)
            db.session.flush()

            cycles_data = [
                {
                    "name": "Semana 1-2: Control y Conducción",
                    "description": "Desarrollo de control de balón y conducción en espacios reducidos.",
                    "sessions": [
                        {
                            "name": "Día 1: Control de Balón",
                            "notes": "Usar ambos pies. Enfocarse en la parte interna y externa.",
                            "exercises": [
                                {"exercise_name": "Conducción en Cuadrícula", "sets": 4, "reps": "3 min", "weight": "Cono", "rest_seconds": 60},
                                {"exercise_name": "Control con Pie Interior", "sets": 3, "reps": "20 rep", "weight": "Balón", "rest_seconds": 45},
                                {"exercise_name": "Cambios de Dirección", "sets": 4, "reps": "10 rep", "weight": "Conos", "rest_seconds": 60}
                            ]
                        },
                        {
                            "name": "Día 2: Pase y Recepción",
                            "notes": "Pase corto y largo. Comunicación constante.",
                            "exercises": [
                                {"exercise_name": "Pase en Parejas", "sets": 5, "reps": "10 rep", "weight": "Balón", "rest_seconds": 30},
                                {"exercise_name": "Pase Largo", "sets": 4, "reps": "8 rep", "weight": "Balón", "rest_seconds": 45},
                                {"exercise_name": "Primer Control y Pase", "sets": 3, "reps": "15 rep", "weight": "Balón", "rest_seconds": 60}
                            ]
                        }
                    ]
                },
                {
                    "name": "Semana 3-4: Finalización",
                    "description": "Mejora de la capacidad de finalización y definición.",
                    "sessions": [
                        {
                            "name": "Día 1: Finalización",
                            "notes": "Enfocarse en la precisión del remate.",
                            "exercises": [
                                {"exercise_name": "Remate a Puerta", "sets": 5, "reps": "10 rep", "weight": "Balón", "rest_seconds": 60},
                                {"exercise_name": "Remate con Definición", "sets": 4, "reps": "8 rep", "weight": "Balón", "rest_seconds": 90},
                                {"exercise_name": "Cabezazo", "sets": 3, "reps": "10 rep", "weight": "Balón", "rest_seconds": 60}
                            ]
                        }
                    ]
                }
            ]

            for c_idx, cycle_data in enumerate(cycles_data):
                c = TrainingCycle(
                    plan_id=plan1.id,
                    name=cycle_data["name"],
                    description=cycle_data["description"],
                    order=c_idx + 1
                )
                db.session.add(c)
                db.session.flush()
                for s_idx, session_data in enumerate(cycle_data["sessions"]):
                    s = TrainingSession(
                        cycle_id=c.id,
                        name=session_data["name"],
                        notes=session_data["notes"],
                        order=s_idx + 1
                    )
                    db.session.add(s)
                    db.session.flush()
                    for e_idx, ex in enumerate(session_data["exercises"]):
                        db.session.add(TrainingExercise(
                            session_id=s.id,
                            exercise_name=ex["exercise_name"],
                            sets=ex["sets"],
                            reps=ex["reps"],
                            weight=ex["weight"],
                            rest_seconds=ex["rest_seconds"],
                            order=e_idx + 1
                        ))

            # Asignar plan a grupos Sub-10 y Sub-12
            for g, _ in groups[:2]:
                db.session.add(TrainingPlanAssignment(
                    plan_id=plan1.id,
                    group_id=g.id,
                    start_date=date.today(),
                    end_date=date.today() + timedelta(days=30),
                    status="ACTIVE"
                ))

            db.session.commit()
            print("   ✓ Plan de entrenamiento técnico creado")

        # ── LANDING PAGE ─────────────────────────────────────────────────────
        landing = ClubLandingPage(club_id=club.id)
        landing.hero_title = "Fútbol Elite Academy - Formando Campeones"
        landing.hero_subtitle = "La academia de fútbol juvenil más exclusiva de Bogotá. Metodología profesional, instalaciones de primera y formación integral."
        landing.banner_url = "https://images.unsplash.com/photo-1574629810360-7efbbe195018?w=1200&q=80"
        landing.cta_text = "Comienza tu prueba gratuita"
        landing.about_title = "Nuestra Academia"
        landing.about_text = "Fútbol Elite Academy es una institución dedicada a la formación integral de jóvenes futbolistas.\n\nNuestra metodología combina:\n\n• Desarrollo técnico individualizado\n• Preparación física profesional\n• Formación en valores y disciplina\n• Acompañamiento académico\n\nContamos con instalaciones de primera categoría y un equipo de entrenadores certificados por la CONMEBOL.\n\nNuestro objetivo es formar no solo grandes jugadores, sino grandes personas."
        landing.about_image_url = "https://images.unsplash.com/photo-1517466787929-bc90951d0974?w=600&q=80"
        landing.features_title = "¿Por qué elegirnos?"
        landing.features = [
            {"icon": "award", "title": "Entrenadores Certificados", "description": "Licencias CONMEBOL y experiencia profesional."},
            {"icon": "zap", "title": "Metodología Moderna", "description": "Enfoque en desarrollo individual y trabajo en equipo."},
            {"icon": "users", "title": "Categorías Formativas", "description": "De Sub-10 a Sub-18 con programas específicos."},
            {"icon": "shield", "title": "Valores y Disciplina", "description": "Formación integral dentro y fuera de la cancha."},
            {"icon": "trophy", "title": "Torneos Competitivos", "description": "Participación en ligas locales y nacionales."},
            {"icon": "heart", "title": "Seguimiento Médico", "description": "Control nutricional y físico constante."}
        ]
        landing.contact_email = "info@futbolelite.com"
        landing.contact_phone = "+57 310 123 4567"
        landing.address = "Cra 30 # 57-45, Bogotá, Colombia"
        landing.social_facebook = "https://facebook.com/futboleliteacademy"
        landing.social_instagram = "https://instagram.com/futbolelite"
        landing.social_whatsapp = "https://wa.me/573101234567"
        landing.footer_text = "© 2026 Fútbol Elite Academy. Todos los derechos reservados."
        
        db.session.add(landing)
        db.session.commit()
        print("   ✓ Landing page personalizada creada")

        # ── COMMIT FINAL ─────────────────────────────────────────────────────
        db.session.commit()

        print("\n" + "=" * 60)
        print("✅  DATOS DE DEMO CREADOS EXITOSAMENTE")
        print("=" * 60)
        print(f"  Club: {club.name}")
        print(f"  Categorías: 4 (Sub-10, Sub-12, Sub-15, Sub-18)")
        print(f"  Entrenadores: {len(trainers)}")
        print(f"  Grupos: {len(groups)}")
        print(f"  Atletas: {len(athlete_objects)}")
        print(f"  Pagos: {payments_count}")
        print(f"  Asistencias: {attendance_count}")
        print(f"  Tests físicos: {test_results_count if 'test_results_count' in locals() else 0}")
        print(f"  Planes de entrenamiento: 1")
        print("\n📋 CREDENCIALES DE ACCESO:")
        print("  ⚠️  IMPORTANTE: El login es con NUMERO DE IDENTIFICACION, no con correo")
        print()
        print("  Super Admin:")
        print("    - Identificación: 0000000001")
        print("    - Contraseña: super123")
        print()
        print("  Admin (Fútbol Elite Academy):")
        print("    - Identificación: 1234567890")
        print("    - Contraseña: admin123")
        print()
        print("  Entrenadores:")
        print("    - Identificación: 9876543210 (Roberto García) / trainer123")
        print("    - Identificación: 9876543211 (Andrés López) / trainer123")
        print("    - Identificación: 9876543212 (María Rodríguez) / trainer123")
        print()
        print("  Atletas de prueba:")
        print("    - Formato identificación: 10XXXXXXXX (10 + 8 dígitos)")
        print("    - Contraseña: athlete123")
        print("    - Ejemplo: 1000000001 / athlete123")
        print()
        print("  ✅ Datos de prueba actualizados con todos los campos del CSV")

if __name__ == "__main__":
    seed_demo()

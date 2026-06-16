"""
seed.py — Datos de prueba con 4 clubes colombianos
──────────────────────────────────────────────────
  SUPER ADMIN   super@admin.com          / super123
  ── Troya Voley (PRO / ACTIVE) ────────────────────
  Paul Varga    admin@troyavoley.com     / admin123  [ADMIN]
  Daniela Agudelo daniela@troyavoley.com / admin123  [ADMIN + TRAINER]
  ── Águilas FC (PRO / ACTIVE) ─────────────────────
  Ricardo Lozano  admin@aguilasfc.com    / admin123  [ADMIN]
  ── Academia Náutica Caribe (BASIC / TRIAL) ────────
  Mónica Palomino admin@nautica.com      / admin123  [ADMIN]
  ── Tigres de Ibagué FC (BASIC / EXPIRED) ──────────
  Hernán Rondón   admin@tigresibage.com  / admin123  [ADMIN]
"""
import random
from datetime import date, timedelta, datetime
from app import create_app, db
from app.models.club import Club
from app.models.category import Category
from app.models.user import User
from app.models.athlete import Athlete, Guardian, MedicalInfo
from app.models.group import Group, GroupHistory
from app.models.payment import Payment
from app.models.attendance import Attendance
from app.models.trainer import TrainerProfile
from app.services.test_service import TestService

# ─── Constantes ──────────────────────────────────────────────────────────────
BLOOD_TYPES     = ["A+", "A-", "B+", "O+", "O-", "AB+"]
PAYMENT_METHODS = ["Nequi", "Daviplata", "Transferencia Bancaria", "Efectivo", "PSE"]

def rphone():
    return f"3{random.randint(0,2)}{random.randint(0,9)}{random.randint(1000000,9999999)}"

def rbirth(min_age=14, max_age=30):
    return date.today() - timedelta(days=random.randint(min_age*365, max_age*365))

def safe_email(text):
    return (text.lower()
            .replace('á','a').replace('é','e').replace('í','i')
            .replace('ó','o').replace('ú','u').replace('ñ','n')
            .replace(' ','_'))

# ─── Función genérica para sembrar atletas con pagos y asistencia ─────────────
def seed_athletes(athletes_data, club, groups_map, payment_months,
                  start_date, cedula_offset, email_domain):
    """
    athletes_data : list of (first_name, last_name, group_key)
    groups_map    : dict {group_key: (Group, {weekdays_set})}
    """
    athlete_objects = []
    for idx, (fn, ln, gkey) in enumerate(athletes_data):
        cedula = str(cedula_offset + idx)
        email  = f"{safe_email(fn)}.{safe_email(ln)}@{email_domain}"
        u = User(
            email=email,
            identification_number=cedula,
            first_name=fn, last_name=ln,
            role="ATHLETE", club_id=club.id,
            phone=rphone()
        )
        u.set_password("athlete123")
        db.session.add(u)
        db.session.flush()

        a = Athlete(
            user_id=u.id,
            birth_date=rbirth(),
            phone=rphone(),
            address=f"Carrera {random.randint(10,80)} #{random.randint(10,80)}-{random.randint(10,80)}"
        )
        db.session.add(a)
        db.session.flush()

        db.session.add(MedicalInfo(
            athlete_id=a.id,
            blood_type=random.choice(BLOOD_TYPES),
            allergies=random.choice(["Ninguna","Polen","Lactosa","Ninguna"]),
            conditions=random.choice(["Ninguna","Asma leve","Ninguna"]),
            emergency_contact=f"{random.choice(['María','Carlos','Jorge','Ana'])} {ln}"
        ))
        db.session.add(Guardian(
            athlete_id=a.id,
            name=f"Acudiente {ln}",
            relationship="Padre/Madre",
            phone=rphone(),
            email=f"acudiente.{safe_email(ln)}@gmail.com"
        ))

        grp, _ = groups_map[gkey]
        grp.athletes.append(a)
        db.session.add(GroupHistory(
            athlete_id=a.id, group_id=grp.id, action="JOINED",
            date=datetime.now() - timedelta(days=65)
        ))
        athlete_objects.append((a, gkey))

    db.session.flush()

    # Pagos
    total_payments = 0
    for a, gkey in athlete_objects:
        grp, _ = groups_map[gkey]
        fee = int(grp.monthly_fee)
        for due_dt, desc in payment_months:
            roll = random.random()
            if due_dt.month < date.today().month or (due_dt.month == date.today().month and roll < 0.68):
                status    = "PAID"
                paid_date = datetime(due_dt.year, due_dt.month, random.randint(1,10))
            elif roll < 0.84:
                status    = "PENDING"
                paid_date = None
            else:
                status    = "OVERDUE"
                paid_date = None
            db.session.add(Payment(
                athlete_id=a.id, amount=fee,
                payment_date=paid_date or datetime(due_dt.year, due_dt.month, 1),
                due_date=due_dt, status=status,
                payment_method=random.choice(PAYMENT_METHODS) if status=="PAID" else None,
                description=desc
            ))
            total_payments += 1

    # Asistencias (65 días)
    total_att = 0
    today = date.today()
    cur   = start_date
    while cur <= today:
        wd = cur.weekday()
        for a, gkey in athlete_objects:
            grp, days_set = groups_map[gkey]
            if wd in days_set:
                roll = random.random()
                st = "PRESENT" if roll < 0.78 else ("ABSENT" if roll < 0.92 else "EXCUSED")
                db.session.add(Attendance(
                    athlete_id=a.id, group_id=grp.id,
                    date=cur, status=st,
                    notes="Entrenamiento regular" if st=="PRESENT" else None
                ))
                total_att += 1
        cur += timedelta(days=1)

    return len(athlete_objects), total_payments, total_att


# ═══════════════════════════════════════════════════════════════════════════════
def seed_database():
    app = create_app()
    with app.app_context():
        print("⚙️  Reiniciando base de datos...")
        db.drop_all()
        db.create_all()

        today      = date.today()
        start_date = today - timedelta(days=65)
        pay_months = [
            (date(2026, 3, 1), "Mensualidad Marzo 2026"),
            (date(2026, 4, 1), "Mensualidad Abril 2026"),
            (date(2026, 5, 1), "Mensualidad Mayo 2026"),
        ]

        totals = {"clubs": 0, "athletes": 0, "payments": 0, "attendance": 0}

        # ── SUPER ADMIN ───────────────────────────────────────────────────────
        sa = User(email="super@admin.com", identification_number="0000000001",
                  first_name="Super", last_name="Admin", role="SUPER_ADMIN")
        sa.set_password("super123")
        db.session.add(sa)
        db.session.flush()
        print("   ✓ Super Admin")

        # ══════════════════════════════════════════════════════════════════════
        today_dt = datetime.combine(date.today(), datetime.min.time())
        end_dt = datetime(2026, 12, 31, 23, 59, 59)

        c1 = Club(name="Troya Voley", slug="troya-voley", sport="Voleibol",
                  description="Club de voleibol femenino formativo y competitivo de Medellín.",
                  subscription_status="ACTIVE", plan_type="BASIC",
                  subscription_end_date=end_dt,
                  primary_color="#7c3aed", welcome_message="Gestión deportiva sin fricción.")
        db.session.add(c1); db.session.flush()

        cat_jv  = Category(name="Juvenil",    club_id=c1.id)
        cat_inf = Category(name="Infantil",   club_id=c1.id)
        cat_adu = Category(name="Adulto",     club_id=c1.id)
        db.session.add_all([cat_jv, cat_inf, cat_adu]); db.session.flush()

        # Paul Varga — Admin
        paul = User(email="admin@troyavoley.com", identification_number="1140892301",
                    first_name="Paul", last_name="Varga", role="ADMIN",
                    club_id=c1.id, phone="3012345678")
        paul.set_password("admin123"); db.session.add(paul); db.session.flush()

        # Daniela Agudelo — Admin + Entrenadora
        daniela = User(email="daniela@troyavoley.com", identification_number="1037654321",
                       first_name="Daniela", last_name="Agudelo", role="ADMIN",
                       club_id=c1.id, phone="3156789012")
        daniela.set_password("admin123"); db.session.add(daniela); db.session.flush()
        db.session.add(TrainerProfile(
            user_id=daniela.id, birth_date=date(1992,6,15), gender="Femenino",
            city="Medellín", state="Antioquia", specialization="Voleibol",
            education_level="Profesional", institution="Universidad de Antioquia",
            degree_title="Licenciatura en Educación Física", graduation_year=2015,
            years_of_experience=9,
            certifications="Certificación FIVB Nivel 2, Primeros Auxilios Cruz Roja",
            bio="Entrenadora con 9 años de experiencia en voleibol femenino.",
            hire_date=date(2023,1,10), contract_type="Tiempo completo",
            salary=3500000, payment_frequency="Mensual", bank_name="Bancolombia",
            status="ACTIVE"
        ))
        db.session.flush()

        # Entrenador adicional para Troya Voley
        trainer1_u = User(email="coach@troyavoley.com", identification_number="1134567890",
                          first_name="Carlos", last_name="Mendoza", role="TRAINER",
                          club_id=c1.id, phone="3105678901")
        trainer1_u.set_password("trainer123"); db.session.add(trainer1_u); db.session.flush()
        db.session.add(TrainerProfile(
            user_id=trainer1_u.id, birth_date=date(1988,11,3), gender="Masculino",
            city="Medellín", state="Antioquia", specialization="Voleibol",
            education_level="Profesional", institution="Universidad de Antioquia",
            degree_title="Licenciatura en Educación Física", graduation_year=2012,
            years_of_experience=12,
            certifications="Certificación FIVB Nivel 1, Primeros Auxilios",
            bio="Entrenador de voleibol con experiencia en categorías formativas.",
            hire_date=date(2024,2,15), contract_type="Tiempo completo",
            salary=3200000, payment_frequency="Mensual", bank_name="Bancolombia",
            status="ACTIVE"
        ))
        db.session.flush()

        ga = Group(name="Grupo A – Juvenil", club_id=c1.id, category_id=cat_jv.id,
                   description="Competencia juvenil.", max_capacity=12,
                   schedule="Lun-Mie-Vie 5PM", schedule_days="Lunes,Miércoles,Viernes",
                   schedule_start_time="17:00", schedule_end_time="19:00",
                   training_location="Polideportivo El Poblado",
                   level="Intermedio", season="2026 - Primer Semestre",
                   monthly_fee=120000, status="ACTIVE")
        gb = Group(name="Grupo B – Iniciación", club_id=c1.id, category_id=cat_inf.id,
                   description="Iniciación deportiva.", max_capacity=10,
                   schedule="Mar-Jue 4PM", schedule_days="Martes,Jueves",
                   schedule_start_time="16:00", schedule_end_time="18:00",
                   training_location="Colegio San Ignacio – Cancha Auxiliar",
                   level="Principiante", season="2026 - Primer Semestre",
                   monthly_fee=90000, status="ACTIVE")
        db.session.add_all([ga, gb]); db.session.flush()
        ga.trainers.append(daniela); gb.trainers.append(daniela)
        ga.trainers.append(trainer1_u)

        c1_athletes = [
            ("Laura",     "Ospina",    "A"),("Valentina","Restrepo",  "A"),
            ("Sara",      "Arango",    "A"),("Camila",   "Giraldo",   "A"),
            ("Mariana",   "Castaño",   "A"),("Isabella", "Vargas",    "A"),
            ("Luisa",     "Montoya",   "A"),("Sofía",    "Ríos",      "A"),
            ("Manuela",   "Zuluaga",   "A"),("Juliana",  "Cardona",   "A"),
            ("Natalia",   "Herrera",   "B"),("Andrea",   "Morales",   "B"),
            ("Daniela",   "Patiño",    "B"),("Carolina", "Bermúdez",  "B"),
            ("Ana María", "Salazar",   "B"),("Alejandra","Acevedo",   "B"),
        ]
        c1_groups = {"A": (ga, {0,2,4}), "B": (gb, {1,3})}
        n, p, att = seed_athletes(c1_athletes, c1, c1_groups, pay_months,
                                  start_date, 1020801234, "troyavoley.com")
        totals["athletes"] += n; totals["payments"] += p; totals["attendance"] += att
        print(f"   ✓ {n} atletas, {p} pagos, {att} asistencias")
        totals["clubs"] += 1

        # ══════════════════════════════════════════════════════════════════════
        # CLUB 2 — ÁGUILAS FC BOGOTÁ  (PRO / ACTIVE)
        # ══════════════════════════════════════════════════════════════════════
        print("\n📌 Club 2: Águilas FC Bogotá")
        c2 = Club(name="Águilas FC Bogotá", slug="aguilas-fc", sport="Fútbol",
                  description="Academia de fútbol masculino en la ciudad de Bogotá.",
                  subscription_status="ACTIVE", plan_type="BASIC",
                  subscription_end_date=datetime(2026,11,30,23,59,59),
                  primary_color="#dc2626", welcome_message="Gestión deportiva sin fricción.")
        db.session.add(c2); db.session.flush()

        cat2_sub  = Category(name="Sub-17",  club_id=c2.id)
        cat2_sub20 = Category(name="Sub-20", club_id=c2.id)
        db.session.add_all([cat2_sub, cat2_sub20]); db.session.flush()

        ric = User(email="admin@aguilasfc.com", identification_number="79854321",
                   first_name="Ricardo", last_name="Lozano", role="ADMIN",
                   club_id=c2.id, phone="3204567890")
        ric.set_password("admin123"); db.session.add(ric); db.session.flush()

        # Entrenador del club
        trainer2_u = User(email="entrenador@aguilasfc.com", identification_number="79654321",
                          first_name="Germán", last_name="Acosta", role="TRAINER",
                          club_id=c2.id, phone="3114567890")
        trainer2_u.set_password("trainer123"); db.session.add(trainer2_u); db.session.flush()
        db.session.add(TrainerProfile(
            user_id=trainer2_u.id, birth_date=date(1985,3,20), gender="Masculino",
            city="Bogotá", state="Cundinamarca", specialization="Fútbol",
            education_level="Técnico", institution="IDER Bogotá",
            degree_title="Técnico Deportivo", graduation_year=2008,
            years_of_experience=14, hire_date=date(2022,6,1),
            contract_type="Medio tiempo", salary=2800000,
            payment_frequency="Mensual", bank_name="Davivienda", status="ACTIVE"
        ))
        db.session.flush()

        gc1 = Group(name="Sub-17 Principal", club_id=c2.id, category_id=cat2_sub.id,
                    description="Selección Sub-17 competitiva.", max_capacity=20,
                    schedule="Lun-Mie-Vie 6AM", schedule_days="Lunes,Miércoles,Viernes",
                    schedule_start_time="06:00", schedule_end_time="08:00",
                    training_location="Estadio El Campín – Cancha B",
                    level="Avanzado", season="2026 - Primer Semestre",
                    monthly_fee=150000, status="ACTIVE")
        gc2 = Group(name="Sub-20 Reserva", club_id=c2.id, category_id=cat2_sub20.id,
                    description="Equipo de reserva Sub-20.", max_capacity=18,
                    schedule="Mar-Jue-Sáb 7AM", schedule_days="Martes,Jueves,Sábado",
                    schedule_start_time="07:00", schedule_end_time="09:00",
                    training_location="Centro Deportivo Salitre",
                    level="Intermedio", season="2026 - Primer Semestre",
                    monthly_fee=130000, status="ACTIVE")
        db.session.add_all([gc1, gc2]); db.session.flush()
        gc1.trainers.append(trainer2_u); gc2.trainers.append(trainer2_u)

        c2_athletes = [
            ("Sebastián", "Cárdenas",  "X"),("Felipe",    "Gutiérrez","X"),
            ("Andrés",    "Rincón",    "X"),("Juan Pablo","Cifuentes", "X"),
            ("Diego",     "Contreras", "X"),("Mateo",     "Bohórquez", "X"),
            ("Tomás",     "Nieto",     "X"),("Nicolás",   "Páez",     "X"),
            ("Samuel",    "Bernal",    "X"),("David",     "Forero",   "X"),
            ("Camilo",    "Escobar",   "Y"),("Esteban",   "Mora",     "Y"),
            ("Alejandro", "Becerra",   "Y"),("Miguel",    "Varón",    "Y"),
            ("Santiago",  "Pedraza",   "Y"),("Julián",    "Gómez",    "Y"),
            ("Cristian",  "Torres",    "Y"),("Jonathan",  "Vásquez",  "Y"),
        ]
        c2_groups = {"X": (gc1, {0,2,4}), "Y": (gc2, {1,3,5})}
        n, p, att = seed_athletes(c2_athletes, c2, c2_groups, pay_months,
                                  start_date, 1030500100, "aguilasfc.com")
        totals["athletes"] += n; totals["payments"] += p; totals["attendance"] += att
        print(f"   ✓ {n} atletas, {p} pagos, {att} asistencias")
        totals["clubs"] += 1

        # ══════════════════════════════════════════════════════════════════════
        # CLUB 3 — ACADEMIA NÁUTICA CARIBE  (BASIC / TRIAL)
        # ══════════════════════════════════════════════════════════════════════
        print("\n📌 Club 3: Academia Náutica Caribe")
        c3 = Club(name="Academia Náutica Caribe", slug="nautica-caribe", sport="Natación",
                  description="Escuela de natación y deportes acuáticos en Barranquilla.",
                  subscription_status="TRIAL", plan_type="BASIC",
                  subscription_end_date=datetime.now() + timedelta(days=15),
                  primary_color="#0891b2", welcome_message="Gestión deportiva sin fricción.")
        db.session.add(c3); db.session.flush()

        cat3_n = Category(name="Novatos",     club_id=c3.id)
        cat3_a = Category(name="Avanzados",   club_id=c3.id)
        db.session.add_all([cat3_n, cat3_a]); db.session.flush()

        mon = User(email="admin@nautica.com", identification_number="32876543",
                   first_name="Mónica", last_name="Palomino", role="ADMIN",
                   club_id=c3.id, phone="3016789012")
        mon.set_password("admin123"); db.session.add(mon); db.session.flush()

        trainer3_u = User(email="coach@nautica.com", identification_number="32765432",
                          first_name="Luis Carlos", last_name="Ariza", role="TRAINER",
                          club_id=c3.id, phone="3116789012")
        trainer3_u.set_password("trainer123"); db.session.add(trainer3_u); db.session.flush()
        db.session.add(TrainerProfile(
            user_id=trainer3_u.id, birth_date=date(1990,8,5), gender="Masculino",
            city="Barranquilla", state="Atlántico", specialization="Natación",
            education_level="Profesional", institution="Universidad del Norte",
            years_of_experience=7, hire_date=date(2024,3,1),
            contract_type="Tiempo completo", salary=2600000,
            payment_frequency="Mensual", bank_name="Nequi", status="ACTIVE"
        ))
        db.session.flush()

        gd1 = Group(name="Novatos Mañana", club_id=c3.id, category_id=cat3_n.id,
                    description="Grupo de iniciación en natación.", max_capacity=15,
                    schedule="Lun-Mie-Vie 7AM", schedule_days="Lunes,Miércoles,Viernes",
                    schedule_start_time="07:00", schedule_end_time="08:30",
                    training_location="Piscina Olímpica El Prado",
                    level="Principiante", season="2026 - Primer Semestre",
                    monthly_fee=100000, status="ACTIVE")
        db.session.add(gd1); db.session.flush()
        gd1.trainers.append(trainer3_u)

        c3_athletes = [
            ("Valeria",   "Díaz",      "N"),("Keyla",     "Pacheco",  "N"),
            ("Karen",     "Insignares","N"),("Daniela",   "Sánchez",  "N"),
            ("Sofía",     "Manotas",   "N"),("Paola",     "Muñoz",    "N"),
            ("Isabela",   "Causado",   "N"),("Gabriela",  "Orozco",   "N"),
        ]
        c3_groups = {"N": (gd1, {0,2,4})}
        n, p, att = seed_athletes(c3_athletes, c3, c3_groups, pay_months,
                                  start_date, 1045300200, "nautica.com")
        totals["athletes"] += n; totals["payments"] += p; totals["attendance"] += att
        print(f"   ✓ {n} atletas, {p} pagos, {att} asistencias")
        totals["clubs"] += 1

        # ══════════════════════════════════════════════════════════════════════
        # CLUB 4 — TIGRES DE IBAGUÉ FC  (BASIC / EXPIRED)
        # ══════════════════════════════════════════════════════════════════════
        print("\n📌 Club 4: Tigres de Ibagué FC")
        c4 = Club(name="Tigres de Ibagué FC", slug="tigres-ibague", sport="Fútbol",
                  description="Club de fútbol con larga trayectoria en Ibagué, Tolima.",
                  subscription_status="EXPIRED", plan_type="BASIC",
                  subscription_end_date=datetime.now() - timedelta(days=10),
                  primary_color="#ea580c", welcome_message="Gestión deportiva sin fricción.")
        db.session.add(c4); db.session.flush()

        cat4_j = Category(name="Juvenil", club_id=c4.id)
        db.session.add(cat4_j); db.session.flush()

        her = User(email="admin@tigresibage.com", identification_number="73214567",
                   first_name="Hernán", last_name="Rondón", role="ADMIN",
                   club_id=c4.id, phone="3123456789")
        her.set_password("admin123"); db.session.add(her); db.session.flush()

        # Entrenador para Tigres de Ibagué
        trainer4_u = User(email="coach@tigresibage.com", identification_number="1122334455",
                          first_name="Jorge", last_name="Ramírez", role="TRAINER",
                          club_id=c4.id, phone="3135678901")
        trainer4_u.set_password("trainer123"); db.session.add(trainer4_u); db.session.flush()
        db.session.add(TrainerProfile(
            user_id=trainer4_u.id, birth_date=date(1987,9,12), gender="Masculino",
            city="Ibagué", state="Tolima", specialization="Fútbol",
            education_level="Técnico", institution="SENA",
            years_of_experience=10, hire_date=date(2023,8,1),
            contract_type="Tiempo completo", salary=2500000,
            payment_frequency="Mensual", bank_name="Bancolombia", status="ACTIVE"
        ))
        db.session.flush()

        ge1 = Group(name="Categoría Juvenil", club_id=c4.id, category_id=cat4_j.id,
                    description="Equipo principal juvenil.", max_capacity=18,
                    schedule="Mar-Jue 5PM", schedule_days="Martes,Jueves",
                    schedule_start_time="17:00", schedule_end_time="19:00",
                    training_location="Estadio Manuel Murillo Toro – Campo 2",
                    level="Intermedio", season="2026 - Primer Semestre",
                    monthly_fee=80000, status="ACTIVE")
        db.session.add(ge1); db.session.flush()
        ge1.trainers.append(trainer4_u)

        c4_athletes = [
            ("Yeison",    "Mosquera",  "J"),("Brayan",    "Ríos",     "J"),
            ("Cristian",  "Lozada",    "J"),("Kevin",     "Vargas",   "J"),
            ("Jefferson", "Molina",    "J"),("Jhon",      "Trujillo", "J"),
            ("Anderson",  "Cifuentes", "J"),("Dairo",     "Montoya",  "J"),
            ("Fabián",    "Perdomo",   "J"),("Wilmer",    "Cuellar",  "J"),
        ]
        c4_groups = {"J": (ge1, {1,3})}
        n, p, att = seed_athletes(c4_athletes, c4, c4_groups, pay_months,
                                  start_date, 1110400300, "tigresibage.com")
        totals["athletes"] += n; totals["payments"] += p; totals["attendance"] += att
        print(f"   ✓ {n} atletas, {p} pagos, {att} asistencias")
        totals["clubs"] += 1

        # ── COMMIT FINAL ──────────────────────────────────────────────────────
        db.session.commit()

        print("\n" + "="*60)
        print("✅  BASE DE DATOS RECREADA EXITOSAMENTE")
        print("="*60)
        # Sembrar tests predefinidos
        TestService.seed_predefined_tests()
        print("   ✓ 18 tests predefinidos")

        # ── Sembrar resultados de tests de prueba ──────────────────────────────
        from app.models.test import TestTemplate, TestResult, TestSession

        # Obtener templates y atletas para crear resultados
        templates = TestTemplate.query.filter_by(is_predefined=True).all()
        all_athletes = Athlete.query.all()
        trainer_users = User.query.filter_by(role='TRAINER').all()
        admin_users = User.query.filter_by(role='ADMIN').all()
        all_trainers = trainer_users + admin_users

        if templates and all_athletes and all_trainers:
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
                    club_id=1,  # Troya Voley
                    trainer_id=trainer.id,
                    session_date=session_date,
                    notes=f"Sesión de evaluación {session_name.lower()}"
                )
                db.session.add(session)
                db.session.flush()

                # Seleccionar 5-8 atletas aleatorios para esta sesión
                session_athletes = random.sample(all_athletes, min(random.randint(5, 8), len(all_athletes)))
                
                # Seleccionar 3-5 tests para esta sesión
                session_templates = random.sample(templates, min(random.randint(3, 5), len(templates)))

                for athlete in session_athletes:
                    for template in session_templates:
                        # Generar valor realista según el test
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
            print(f"   ✓ {sessions_count} sesiones de tests")
            print(f"   ✓ {test_results_count} resultados de tests")
        else:
            print("   ⚠ No hay templates o atletas para sembrar resultados de tests")

        print(f"  Clubes      : {totals['clubs']}")
        print(f"  Atletas     : {totals['athletes']}")
        print(f"  Pagos       : {totals['payments']}")
        print(f"  Asistencias : {totals['attendance']}")
        print("-"*60)
        print("  CREDENCIALES:")
        print("  super@admin.com           super123   [SUPER ADMIN]")
        print("  admin@troyavoley.com      admin123   [ADMIN – Troya Voley]")
        print("  daniela@troyavoley.com    admin123   [ADMIN+TRAINER – Troya]")
        print("  admin@aguilasfc.com       admin123   [ADMIN – Águilas FC]")
        print("  admin@nautica.com         admin123   [ADMIN – Náutica Caribe]")
        print("  admin@tigresibage.com     admin123   [ADMIN – Tigres Ibagué]")
        print("="*60)

        # ── Sembrar Landing Pages ─────────────────────────────────────────────
        from app.models.landing import ClubLandingPage
        landing_data = [
            {
                "club_name": "Troya Voley",
                "hero_title": "Club Deportivo Troya Buga — Formación de Voleibol en Buga",
                "hero_subtitle": "Enfocados en el desarrollo de niñas, niños y jóvenes. Enseñamos desde cero sin importar tu nivel de experiencia.",
                "banner_url": "https://images.unsplash.com/photo-1612872087720-bb876e2e67d1?w=1200&q=80",
                "cta_text": "Ingresar al sistema",
                "about_title": "Nuestro Club",
                "about_text": "El Club Deportivo Troya Buga es un destacado club de formación de voleibol en Guadalajara de Buga (Valle del Cauca).\n\nEnfocados en el desarrollo de niñas, niños y jóvenes, enseñamos desde cero sin importar tu nivel de experiencia. Ofrecemos voleibol de piso en modalidad formativa y competitiva.\n\nNuestra metodología de trabajo en equipo y formación integral hace la diferencia en cada uno de nuestros atletas.",
                "about_image_url": "https://images.unsplash.com/photo-1599058917212-d750089bc07e?w=600&q=80",
                "features_title": "Nuestros programas",
                "features": [
                    {"icon": "zap", "title": "Voleibol de Piso", "description": "Modalidad formativa y competitiva para todas las edades y niveles."},
                    {"icon": "heart", "title": "Formación desde Cero", "description": "Enseñamos voleibol desde cero, sin importar tu nivel de experiencia."},
                    {"icon": "users", "title": "Niños y Jóvenes", "description": "Programas especializados para el desarrollo de niñas, niños y jóvenes."},
                    {"icon": "award", "title": "Trabajo en Equipo", "description": "Metodología enfocada en valores, disciplina y trabajo en equipo."}
                ],
                "contact_email": "contacto@troyavoley.com", "contact_phone": "+57 301 234 5678",
                "address": "Guadalajara de Buga, Valle del Cauca",
                "social_facebook": "https://facebook.com/ClubDeportivoTroyaBuga",
                "social_instagram": "https://instagram.com/clubdeportivotroya",
                "social_whatsapp": "https://wa.me/573012345678",
                "footer_text": "Formando talentos en Buga, Valle del Cauca.",
            },
            {
                "club_name": "Águilas FC Bogotá",
                "hero_title": "Águilas FC — El Futuro del Fútbol Bogotano",
                "hero_subtitle": "Academia de fútbol masculino con más de 10 años formando talentos en Bogotá.",
                "banner_url": "https://images.unsplash.com/photo-1431324155629-1a6deb1dec8d?w=1200&q=80",
                "cta_text": "Iniciar sesión",
                "about_title": "Quiénes somos",
                "about_text": "Águilas FC Bogotá es una academia de fútbol masculino fundada en 2014.\n\nNos dedicamos a la formación integral de jóvenes futbolistas en las categorías Sub-17 y Sub-20. Nuestro equipo de entrenadores cuenta con amplia experiencia en el fútbol profesional colombiano.\n\nCreemos en el deporte como herramienta de transformación social y formamos no solo grandes jugadores, sino grandes personas.",
                "about_image_url": "https://images.unsplash.com/photo-1574629810360-7efbbe195018?w=600&q=80",
                "features_title": "Lo que ofrecemos",
                "features": [
                    {"icon": "award", "title": "Alto Rendimiento", "description": "Preparación competitiva para torneos locales y nacionales."},
                    {"icon": "trending", "title": "Scouting Profesional", "description": "Visibilidad ante clubes profesionales y universitarios."},
                    {"icon": "shield", "title": "Formación Integral", "description": "Acompañamiento académico y psicológico para nuestros atletas."},
                    {"icon": "clock", "title": "Entrenamientos Matutinos", "description": "Horarios flexibles en la mañana para compatibilizar estudio y deporte."}
                ],
                "contact_email": "info@aguilasfc.com", "contact_phone": "+57 320 456 7890",
                "address": "Estadio El Campín, Cancha B, Cra 30 # 57-45, Bogotá",
                "social_facebook": "https://facebook.com/aguilasfcbogota",
                "social_instagram": "https://instagram.com/aguilasfc_",
                "social_whatsapp": "https://wa.me/573204567890",
                "footer_text": "Orgullosamente bogotanos.",
            },
            {
                "club_name": "Academia Náutica Caribe",
                "hero_title": "Academia Náutica Caribe",
                "hero_subtitle": "Escuela de natación y deportes acuáticos en Barranquilla. Aprende, nada y compite con nosotros.",
                "banner_url": "https://images.unsplash.com/photo-1530549387789-4c1017266634?w=1200&q=80",
                "cta_text": "Ingresar",
                "about_title": "Sobre la academia",
                "about_text": "La Academia Náutica Caribe es una escuela de natación ubicada en Barranquilla, Atlántico.\n\nOfrecemos programas de iniciación y perfeccionamiento en natación para todas las edades. Nuestras instalaciones cuentan con piscina olímpica y equipo especializado.\n\nDesde nuestra fundación, hemos formado a cientos de nadadores, desde principiantes hasta competidores regionales.",
                "features": [
                    {"icon": "heart", "title": "Natación para Todos", "description": "Clases desde nivel principiante hasta avanzado, para niños y adultos."},
                    {"icon": "zap", "title": "Entrenamiento Competitivo", "description": "Preparación para competencias de natación a nivel departamental."},
                    {"icon": "users", "title": "Clases Grupales", "description": "Grupos reducidos con instrucción personalizada y seguimiento continuo."},
                    {"icon": "star", "title": "Natación Terapéutica", "description": "Programas especiales de natación para rehabilitación y bienestar."}
                ],
                "features_title": "Nuestros servicios",
                "contact_email": "info@nauticacaribe.com", "contact_phone": "+57 301 678 9012",
                "address": "Piscina Olímpica El Prado, Cra 54 # 70-10, Barranquilla",
                "social_facebook": "https://facebook.com/nauticacaribe",
                "social_instagram": "https://instagram.com/nauticacaribe",
                "social_whatsapp": "https://wa.me/573016789012",
                "footer_text": "Sumérgete en la excelencia.",
            },
            {
                "club_name": "Tigres de Ibagué FC",
                "hero_title": "Tigres de Ibagué FC",
                "hero_subtitle": "Club de fútbol con tradición y garra tolimense. Formando talentos desde 1998.",
                "banner_url": "https://images.unsplash.com/photo-1459865264687-595d652de67e?w=1200&q=80",
                "cta_text": "Iniciar sesión",
                "about_title": "Nuestra trayectoria",
                "about_text": "Tigres de Ibagué FC es un club de fútbol con más de 25 años de historia en Ibagué, Tolima.\n\nNacimos como un sueño de barrio y hoy somos una institución reconocida en el fútbol juvenil tolimense. Hemos formado a decenas de jugadores que han llegado al fútbol profesional colombiano.\n\nNuestro lema: disciplina, respeto y pasión por el fútbol.",
                "about_image_url": "https://images.unsplash.com/photo-1517466787929-bc90951d0974?w=600&q=80",
                "features": [
                    {"icon": "award", "title": "Formación Juvenil", "description": "Programa de desarrollo para jóvenes futbolistas de 14 a 20 años."},
                    {"icon": "trending", "title": "Proyección Profesional", "description": "Conexiones con clubes profesionales para visibilizar talentos."},
                    {"icon": "shield", "title": "Escuela de Valores", "description": "Formación en disciplina, trabajo en equipo y respeto."},
                    {"icon": "clock", "title": "Entrenamientos Flexibles", "description": "Horarios adaptados para estudiantes y trabajadores."}
                ],
                "features_title": "Nuestros programas",
                "contact_email": "contacto@tigresibague.com", "contact_phone": "+57 312 345 6789",
                "address": "Estadio Manuel Murillo Toro, Campo 2, Cra 5 # 19-50, Ibagué",
                "social_facebook": "https://facebook.com/tigresibaguefc",
                "social_instagram": "https://instagram.com/tigresibaguefc",
                "social_whatsapp": "https://wa.me/573123456789",
                "footer_text": "La garra del Tolima.",
            }
        ]
        landing_count = 0
        for ld in landing_data:
            club = Club.query.filter_by(name=ld["club_name"]).first()
            if not club:
                continue
            landing = ClubLandingPage(club_id=club.id)
            for k, v in ld.items():
                if k == "club_name":
                    continue
                setattr(landing, k, v)
            db.session.add(landing)
            landing_count += 1
        db.session.commit()
        print(f"   ✓ {landing_count} landing pages creadas")

        # ── Sembrar Training Plans de prueba ──────────────────────────────────
        from app.models.training_plan import TrainingPlan, TrainingCycle
        plan_clubs = Club.query.all()
        plan_count = 0
        for pc in plan_clubs:
            plan = TrainingPlan(
                name=f"Plan {pc.name} 2026",
                description="Plan de entrenamiento semestral para el club.",
                club_id=pc.id, created_by=1,
                start_date=date(2026, 1, 15), end_date=date(2026, 7, 15),
                status="ACTIVE"
            )
            db.session.add(plan); db.session.flush()
            for cname in ["Físico", "Técnico", "Táctico"]:
                db.session.add(TrainingCycle(
                    training_plan_id=plan.id, name=cname,
                    description=f"Ciclo {cname.lower()} del semestre",
                    order=["Físico","Técnico","Táctico"].index(cname)
                ))
            plan_count += 1
        db.session.commit()
        print(f"   ✓ {plan_count} planes de entrenamiento")

        # Marcar todas las migraciones como aplicadas en alembic
        try:
            from flask_migrate import stamp
            stamp()
            print("   ✓ Migraciones marcadas en alembic_version")
        except Exception as e:
            print(f"   ⚠ No se pudo stamp migraciones: {e}")

if __name__ == "__main__":
    seed_database()

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
        # CLUB 1 — TROYA VOLEY  (PRO / ACTIVE)
        # ══════════════════════════════════════════════════════════════════════
        print("\n📌 Club 1: Troya Voley")
        c1 = Club(name="Troya Voley", sport="Voleibol",
                  description="Club de voleibol femenino formativo y competitivo de Medellín.",
                  subscription_status="ACTIVE", plan_type="PRO",
                  subscription_end_date=date(2026,12,31))
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
        c2 = Club(name="Águilas FC Bogotá", sport="Fútbol",
                  description="Academia de fútbol masculino en la ciudad de Bogotá.",
                  subscription_status="ACTIVE", plan_type="PRO",
                  subscription_end_date=date(2026,11,30))
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
        c3 = Club(name="Academia Náutica Caribe", sport="Natación",
                  description="Escuela de natación y deportes acuáticos en Barranquilla.",
                  subscription_status="TRIAL", plan_type="BASIC",
                  subscription_end_date=today + timedelta(days=20))
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
        c4 = Club(name="Tigres de Ibagué FC", sport="Fútbol",
                  description="Club de fútbol con larga trayectoria en Ibagué, Tolima.",
                  subscription_status="EXPIRED", plan_type="BASIC",
                  subscription_end_date=today - timedelta(days=10))
        db.session.add(c4); db.session.flush()

        cat4_j = Category(name="Juvenil", club_id=c4.id)
        db.session.add(cat4_j); db.session.flush()

        her = User(email="admin@tigresibage.com", identification_number="73214567",
                   first_name="Hernán", last_name="Rondón", role="ADMIN",
                   club_id=c4.id, phone="3123456789")
        her.set_password("admin123"); db.session.add(her); db.session.flush()

        ge1 = Group(name="Categoría Juvenil", club_id=c4.id, category_id=cat4_j.id,
                    description="Equipo principal juvenil.", max_capacity=18,
                    schedule="Mar-Jue 5PM", schedule_days="Martes,Jueves",
                    schedule_start_time="17:00", schedule_end_time="19:00",
                    training_location="Estadio Manuel Murillo Toro – Campo 2",
                    level="Intermedio", season="2026 - Primer Semestre",
                    monthly_fee=80000, status="ACTIVE")
        db.session.add(ge1); db.session.flush()

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

if __name__ == "__main__":
    seed_database()

"""
seed.py - Script de siembra de datos de prueba
Genera datos consistentes y realistas para dos clubes con:
- Múltiples grupos y categorías
- 20 atletas por club (40 total)
- Pagos de Marzo, Abril y Mayo (con variedad de estados)
- Asistencias de los últimos 30 días
- Historial de movimientos de grupo
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

# ─── Datos de nombres para mayor realismo ────────────────────────────────────
FIRST_NAMES = [
    "Santiago", "Valentina", "Miguel", "Camila", "Andrés", "Isabella", 
    "Juan", "Sofía", "David", "Daniela", "Luis", "María", "Carlos",
    "Gabriela", "Diego", "Natalia", "Felipe", "Laura", "Sebastián", "Juliana"
]
LAST_NAMES = [
    "García", "Rodríguez", "Martínez", "López", "González", "Pérez",
    "Sánchez", "Ramírez", "Torres", "Flores", "Rivera", "Gómez",
    "Díaz", "Cruz", "Morales", "Reyes", "Herrera", "Jiménez", "Vargas", "Castillo"
]

MONTHS = [
    (3, "Marzo", date(2026, 3, 10)),
    (4, "Abril", date(2026, 4, 10)),
    (5, "Mayo",  date(2026, 5, 10)),
]

def random_name():
    return random.choice(FIRST_NAMES), random.choice(LAST_NAMES)

def random_phone():
    return f"3{random.randint(0,2)}{random.randint(0,9)}-{random.randint(100,999)}-{random.randint(1000,9999)}"

def seed_database():
    app = create_app()
    with app.app_context():
        # ── Reset completo ────────────────────────────────────────────────────
        print("⚙️  Eliminando datos existentes...")
        db.drop_all()
        db.create_all()

        # ══════════════════════════════════════════════════════════════════════
        # SUPER ADMIN (sin club)
        # ══════════════════════════════════════════════════════════════════════
        sadmin = User(
            email="super@admin.com", identification_number="0000000001",
            first_name="Super", last_name="Admin", role="SUPER_ADMIN"
        )
        sadmin.set_password("super123")
        db.session.add(sadmin)
        db.session.flush()

        # ══════════════════════════════════════════════════════════════════════
        # CLUB 1 — ÁGUILAS DEL NORTE (FÚTBOL)
        # ══════════════════════════════════════════════════════════════════════
        print("\n🦅  Creando Club 1: Águilas del Norte (Fútbol)...")
        club1 = Club(
            name="Águilas del Norte", sport="Fútbol",
            description="Academia de fútbol juvenil de alto rendimiento"
        )
        db.session.add(club1)
        db.session.flush()

        # Categorías
        cats1 = []
        for name in ["Semillero", "Sub-15", "Sub-17"]:
            c = Category(name=name, club_id=club1.id)
            db.session.add(c)
            cats1.append(c)
        db.session.flush()

        # Admin y Trainers Club 1
        admin1 = User(
            email="admin@aguilas.com", identification_number="1000000001",
            first_name="Carlos", last_name="Mendoza", role="ADMIN", club_id=club1.id
        )
        admin1.set_password("admin123")
        db.session.add(admin1)

        trainers1 = []
        trainer_data1 = [
            ("2000000001", "Ricardo", "Torres"),
            ("2000000002", "Paola", "Vargas"),
        ]
        for id_num, fname, lname in trainer_data1:
            t = User(
                email=f"{fname.lower()}@aguilas.com", identification_number=id_num,
                first_name=fname, last_name=lname, role="TRAINER", club_id=club1.id
            )
            t.set_password("trainer123")
            db.session.add(t)
            trainers1.append(t)
        db.session.flush()

        # Grupos Club 1
        groups1 = []
        group_defs1 = [
            ("Semillero Mañana",  cats1[0].id, 80000,  "Lun-Mar-Jue 8AM",  trainers1[0], 8),
            ("Sub-15 Élite",     cats1[1].id, 150000, "Lun-Mie-Vie 4PM",   trainers1[0], 8),
            ("Sub-17 Competencia", cats1[2].id, 180000, "Mar-Jue-Sáb 5PM", trainers1[1], 4),
        ]
        for gname, cat_id, fee, sched, trainer, n_athletes in group_defs1:
            g = Group(
                name=gname, club_id=club1.id, category_id=cat_id,
                monthly_fee=fee, schedule=sched,
                training_location="Cancha Principal Norte",
                max_capacity=25, level="Intermedio"
            )
            g.trainers.append(trainer)
            db.session.add(g)
            db.session.flush()
            groups1.append((g, n_athletes, fee))

        # Atletas Club 1
        athletes_c1 = []
        id_counter = 3000000001
        for grp, n_athletes, fee in groups1:
            for _ in range(n_athletes):
                fname, lname = random_name()
                u = User(
                    email=f"{fname.lower()}.{lname.lower()}{id_counter}@aguilas.com",
                    identification_number=str(id_counter),
                    first_name=fname, last_name=lname,
                    role="ATHLETE", club_id=club1.id
                )
                u.set_password("athlete123")
                db.session.add(u)
                db.session.flush()
                a = Athlete(user_id=u.id, phone=random_phone(), address="Bogotá, Colombia")
                a.current_groups.append(grp)
                db.session.add(a)
                db.session.flush()
                athletes_c1.append((a, fee, grp.id))
                id_counter += 1

        # ══════════════════════════════════════════════════════════════════════
        # CLUB 2 — TIBURONES DEL SUR (NATACIÓN)
        # ══════════════════════════════════════════════════════════════════════
        print("🦈  Creando Club 2: Tiburones del Sur (Natación)...")
        club2 = Club(
            name="Tiburones del Sur", sport="Natación",
            description="Escuela de natación competitiva y recreativa"
        )
        db.session.add(club2)
        db.session.flush()

        # Categorías
        cats2 = []
        for name in ["Principiantes", "Intermedios", "Avanzados"]:
            c = Category(name=name, club_id=club2.id)
            db.session.add(c)
            cats2.append(c)
        db.session.flush()

        # Admin y Trainer Club 2
        admin2 = User(
            email="admin@tiburones.com", identification_number="1100000001",
            first_name="Marta", last_name="Ospina", role="ADMIN", club_id=club2.id
        )
        admin2.set_password("admin123")
        db.session.add(admin2)

        trainer2 = User(
            email="entrenador@tiburones.com", identification_number="2200000001",
            first_name="Andrés", last_name="Patiño", role="TRAINER", club_id=club2.id
        )
        trainer2.set_password("trainer123")
        db.session.add(trainer2)
        db.session.flush()

        # Grupos Club 2
        groups2 = []
        group_defs2 = [
            ("Nivel 1 - Mañana",  cats2[0].id, 120000, "Lun-Mie-Vie 7AM",  5),
            ("Nivel 2 - Tarde",   cats2[1].id, 160000, "Mar-Jue 5PM",       5),
            ("Competencia Élite", cats2[2].id, 220000, "Lun-Mar-Mie-Jue 6AM", 5),
        ]
        for gname, cat_id, fee, sched, n_athletes in group_defs2:
            g = Group(
                name=gname, club_id=club2.id, category_id=cat_id,
                monthly_fee=fee, schedule=sched,
                training_location="Piscina Olímpica Sur",
                max_capacity=20, level="Básico"
            )
            g.trainers.append(trainer2)
            db.session.add(g)
            db.session.flush()
            groups2.append((g, n_athletes, fee))

        # Atletas Club 2
        athletes_c2 = []
        id_counter = 4000000001
        for grp, n_athletes, fee in groups2:
            for _ in range(n_athletes):
                fname, lname = random_name()
                u = User(
                    email=f"{fname.lower()}.{lname.lower()}{id_counter}@tiburones.com",
                    identification_number=str(id_counter),
                    first_name=fname, last_name=lname,
                    role="ATHLETE", club_id=club2.id
                )
                u.set_password("athlete123")
                db.session.add(u)
                db.session.flush()
                a = Athlete(user_id=u.id, phone=random_phone(), address="Medellín, Colombia")
                a.current_groups.append(grp)
                db.session.add(a)
                db.session.flush()
                athletes_c2.append((a, fee, grp.id))
                id_counter += 1

        # ══════════════════════════════════════════════════════════════════════
        # PAGOS — Marzo, Abril y Mayo (con variedad realista)
        # ══════════════════════════════════════════════════════════════════════
        print("💰  Generando pagos de Marzo, Abril y Mayo...")

        # Estrategia: 
        # - Marzo: 90% pagado (mes viejo)
        # - Abril: 75% pagado 
        # - Mayo: 55% pagado (mes actual, varios pendientes)
        payment_rates = {3: 0.90, 4: 0.75, 5: 0.55}

        for month_num, month_name, month_date in MONTHS:
            rate = payment_rates[month_num]
            for athlete, fee, grp_id in (athletes_c1 + athletes_c2):
                if random.random() < rate:
                    p = Payment(
                        athlete_id=athlete.id,
                        amount=fee,
                        status="PAID",
                        payment_method=random.choice(["Efectivo", "Efectivo", "Transferencia"]),
                        payment_date=month_date + timedelta(days=random.randint(0, 5)),
                        description=f"Mensualidad {month_name} 2026"
                    )
                    db.session.add(p)

        # ══════════════════════════════════════════════════════════════════════
        # ASISTENCIA — Últimos 30 días para Club 1 (con días de entrenamiento)
        # ══════════════════════════════════════════════════════════════════════
        print("📋  Generando registros de asistencia (últimos 30 días)...")
        today = date.today()

        for days_ago in range(30, 0, -1):
            att_date = today - timedelta(days=days_ago)
            # Solo días de semana (lun=0 ... vie=4)
            if att_date.weekday() >= 5:
                continue

            for grp, _, fee in groups1:
                for athlete, _, grp_id in athletes_c1:
                    if grp_id != grp.id:
                        continue
                    status = random.choices(
                        ["PRESENT", "ABSENT", "JUSTIFIED"],
                        weights=[72, 20, 8]
                    )[0]
                    db.session.add(Attendance(
                        athlete_id=athlete.id, group_id=grp.id,
                        date=att_date, status=status
                    ))

        # ══════════════════════════════════════════════════════════════════════
        # HISTORIAL DE MOVIMIENTOS — Algunos atletas que cambiaron de grupo
        # ══════════════════════════════════════════════════════════════════════
        print("🔁  Generando historial de movimientos de grupo...")

        # Los primeros 3 atletas del Club 1 hicieron un ascenso de Semillero -> Sub-15
        for i in range(min(3, len(athletes_c1))):
            athlete, _, grp_id = athletes_c1[i]
            old_group = groups1[0][0]  # Semillero
            new_group = groups1[1][0]  # Sub-15

            db.session.add(GroupHistory(
                athlete_id=athlete.id, group_id=old_group.id,
                action="LEFT", date=date(2026, 3, 15)
            ))
            db.session.add(GroupHistory(
                athlete_id=athlete.id, group_id=new_group.id,
                action="JOINED", date=date(2026, 3, 15)
            ))

        db.session.commit()

        # ── Resumen ───────────────────────────────────────────────────────────
        total_athletes = len(athletes_c1) + len(athletes_c2)
        print("\n" + "="*55)
        print("  ✅  Base de datos creada exitosamente")
        print("="*55)
        print(f"\n  Clubes     : 2")
        print(f"  Atletas    : {total_athletes} ({len(athletes_c1)} fútbol, {len(athletes_c2)} natación)")
        print(f"  Grupos     : {len(groups1) + len(groups2)} (3 por club)")
        print(f"  Meses      : Marzo, Abril, Mayo 2026")
        print(f"  Asistencias: ~{30 * 5 * len(athletes_c1)} registros (30 días)")
        print("\n  Credenciales:")
        print("  ─────────────────────────────────────────────")
        print("  Super Admin  : ID=0000000001       Pass=super123")
        print("  Admin Fútbol : admin@aguilas.com   Pass=admin123")
        print("  Admin Natac. : admin@tiburones.com Pass=admin123")
        print("  Trainer Fút. : ID=2000000001       Pass=trainer123")
        print("  Atletas Fút. : ID=3000000001...    Pass=athlete123")
        print("  Atletas Nat. : ID=4000000001...    Pass=athlete123")
        print("  ─────────────────────────────────────────────\n")


if __name__ == "__main__":
    seed_database()

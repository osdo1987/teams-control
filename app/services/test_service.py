from app.extensions import db
from app.models.test import TestTemplate, TestResult, TestSession
from app.models.user import User
from app.models.athlete import Athlete
from datetime import date

PREDEFINED_TESTS = [
    {"name": "Test de Cooper (12 min)", "description": "Correr la mayor distancia posible en 12 minutos", "category": "RESISTENCIA", "unit": "metros", "higher_is_better": True},
    {"name": "Test de Velocidad 40m", "description": "Tiempo en recorrer 40 metros lanzados", "category": "VELOCIDAD", "unit": "segundos", "higher_is_better": False},
    {"name": "Test de Velocidad 100m", "description": "Tiempo en recorrer 100 metros lanzados", "category": "VELOCIDAD", "unit": "segundos", "higher_is_better": False},
    {"name": "Flexiones de Pecho (1 min)", "description": "Maximo numero de flexiones en 1 minuto", "category": "FUERZA", "unit": "repeticiones", "higher_is_better": True},
    {"name": "Sentadillas (1 min)", "description": "Maximo numero de sentadillas en 1 minuto", "category": "FUERZA", "unit": "repeticiones", "higher_is_better": True},
    {"name": "Salto Largo sin Impulso", "description": "Distancia maxima saltando desde parado", "category": "POTENCIA", "unit": "centimetros", "higher_is_better": True},
    {"name": "Salto Vertical (CMJ)", "description": "Altura maxima de salto vertical con contramovimiento", "category": "POTENCIA", "unit": "centimetros", "higher_is_better": True},
    {"name": "Test de Abdominales (1 min)", "description": "Maximo numero de abdominales en 1 minuto", "category": "FUERZA_CORE", "unit": "repeticiones", "higher_is_better": True},
    {"name": "Dominadas", "description": "Maximo numero de dominadas completas", "category": "FUERZA", "unit": "repeticiones", "higher_is_better": True},
    {"name": "Test de Burpees (1 min)", "description": "Maximo numero de burpees en 1 minuto", "category": "RESISTENCIA", "unit": "repeticiones", "higher_is_better": True},
    {"name": "Plancha (Plank)", "description": "Tiempo maximo manteniendo la posicion de plancha", "category": "FUERZA_CORE", "unit": "segundos", "higher_is_better": True},
    {"name": "Test de Resistencia 1000m", "description": "Tiempo en recorrer 1000 metros", "category": "RESISTENCIA", "unit": "segundos", "higher_is_better": False},
    {"name": "Carrera de Ida y Vuelta (Beep Test)", "description": "Nivel maximo alcanzado en el test de course navette", "category": "RESISTENCIA", "unit": "nivel", "higher_is_better": True},
    {"name": "Peso Muerto (1RM)", "description": "Maximo peso levantado en una repeticion", "category": "FUERZA", "unit": "kg", "higher_is_better": True},
    {"name": "Press de Banca (1RM)", "description": "Maximo peso levantado en press de banca una repeticion", "category": "FUERZA", "unit": "kg", "higher_is_better": True},
    {"name": "Test de Flexibilidad (Sit & Reach)", "description": "Alcance maximo sentado con piernas extendidas", "category": "FLEXIBILIDAD", "unit": "centimetros", "higher_is_better": True},
    {"name": "Test de Agilidad (Illinois)", "description": "Tiempo en completar el recorrido de agilidad de Illinois", "category": "AGILIDAD", "unit": "segundos", "higher_is_better": False},
    {"name": "Test de Velocidad 20m (Yo-Yo)", "description": "Test intermitente de recuperacion nivel 1", "category": "RESISTENCIA", "unit": "nivel", "higher_is_better": True},
]

class TestService:

    @staticmethod
    def seed_predefined_tests():
        for t in PREDEFINED_TESTS:
            existing = TestTemplate.query.filter_by(name=t["name"], is_predefined=True).first()
            if not existing:
                template = TestTemplate(
                    name=t["name"], description=t["description"], category=t["category"],
                    unit=t["unit"], higher_is_better=t["higher_is_better"],
                    is_predefined=True, club_id=None
                )
                db.session.add(template)
        db.session.commit()

    @staticmethod
    def get_templates(club_id=None):
        if club_id:
            return TestTemplate.query.filter(
                db.or_(TestTemplate.club_id == club_id, TestTemplate.is_predefined == True)
            ).order_by(TestTemplate.is_predefined.desc(), TestTemplate.name).all()
        return TestTemplate.query.filter_by(is_predefined=True).all()

    @staticmethod
    def create_template(data, user_id):
        template = TestTemplate(
            name=data["name"], description=data.get("description", ""),
            category=data.get("category", "PERSONALIZADO"), unit=data.get("unit", ""),
            higher_is_better=data.get("higher_is_better", True),
            club_id=data.get("club_id"), created_by=user_id, is_predefined=False
        )
        db.session.add(template)
        db.session.commit()
        return template

    @staticmethod
    def update_template(template_id, data):
        template = TestTemplate.query.get(template_id)
        if not template or template.is_predefined:
            return None
        for field in ["name", "description", "category", "unit", "higher_is_better"]:
            if field in data:
                setattr(template, field, data[field])
        db.session.commit()
        return template

    @staticmethod
    def delete_template(template_id):
        template = TestTemplate.query.get(template_id)
        if not template or template.is_predefined:
            return False
        db.session.delete(template)
        db.session.commit()
        return True

    @staticmethod
    def get_results(template_id=None, athlete_id=None, trainer_id=None, limit=100):
        query = TestResult.query
        if template_id:
            query = query.filter_by(template_id=template_id)
        if athlete_id:
            query = query.filter_by(athlete_id=athlete_id)
        if trainer_id:
            query = query.filter_by(trainer_id=trainer_id)
        return query.order_by(TestResult.test_date.desc()).limit(limit).all()

    @staticmethod
    def get_athlete_history(athlete_id, template_id=None):
        query = TestResult.query.filter_by(athlete_id=athlete_id)
        if template_id:
            query = query.filter_by(template_id=template_id)
        return query.order_by(TestResult.test_date.asc()).all()

    @staticmethod
    def create_result(data, trainer_id=None):
        result = TestResult(
            template_id=data["template_id"], athlete_id=data["athlete_id"],
            trainer_id=trainer_id, value=data["value"],
            notes=data.get("notes", ""), test_date=data.get("test_date", date.today())
        )
        db.session.add(result)
        db.session.commit()
        return result

    @staticmethod
    def delete_result(result_id):
        result = TestResult.query.get(result_id)
        if not result:
            return False
        db.session.delete(result)
        db.session.commit()
        return True

    @staticmethod
    def create_session(data, trainer_id=None):
        session = TestSession(
            name=data.get("name", ""),
            club_id=data.get("club_id"),
            trainer_id=trainer_id,
            session_date=data.get("session_date", date.today()),
            notes=data.get("notes", "")
        )
        db.session.add(session)
        db.session.flush()

        for r in data.get("results", []):
            result = TestResult(
                template_id=r["template_id"],
                athlete_id=r["athlete_id"],
                trainer_id=trainer_id,
                session_id=session.id,
                value=r["value"],
                notes=r.get("notes", ""),
                test_date=data.get("session_date", date.today())
            )
            db.session.add(result)

        db.session.commit()
        return session

    @staticmethod
    def get_sessions(club_id=None, limit=50):
        query = TestSession.query
        if club_id:
            query = query.filter_by(club_id=club_id)
        return query.order_by(TestSession.session_date.desc()).limit(limit).all()

    @staticmethod
    def get_stats(club_id=None):
        """Returns aggregate stats for the tests section."""
        query = TestResult.query
        if club_id:
            query = query.join(TestResult.athlete).filter(
                Athlete.user.has(club_id=club_id)
            )
        total_results = query.count()
        total_athletes = db.session.query(TestResult.athlete_id).filter(
            TestResult.athlete_id.isnot(None)
        ).distinct().count()
        if club_id:
            total_athletes = query.with_entities(TestResult.athlete_id).distinct().count()

        last_session = None
        session_query = TestSession.query
        if club_id:
            session_query = session_query.filter_by(club_id=club_id)
        last_session_obj = session_query.order_by(TestSession.session_date.desc()).first()
        if last_session_obj:
            last_session = {
                "id": last_session_obj.id,
                "name": last_session_obj.name,
                "session_date": last_session_obj.session_date.isoformat(),
                "results_count": len(last_session_obj.results or [])
            }

        # Results per template
        template_query = TestTemplate.query
        if club_id:
            template_query = template_query.filter(
                db.or_(TestTemplate.club_id == club_id, TestTemplate.is_predefined == True)
            )
        templates_count = template_query.count()

        return {
            "total_results": total_results,
            "total_athletes": total_athletes,
            "total_templates": templates_count,
            "last_session": last_session
        }

    @staticmethod
    def get_progress(club_id=None, group_id=None, template_id=None, from_date=None, to_date=None):
        """Returns progress data with deltas for chart comparisons."""
        query = TestResult.query

        if club_id:
            query = query.join(TestResult.athlete).filter(
                Athlete.user.has(club_id=club_id)
            )
        if template_id:
            query = query.filter_by(template_id=template_id)

        # Date range filter
        if from_date:
            query = query.filter(TestResult.test_date >= from_date)
        if to_date:
            query = query.filter(TestResult.test_date <= to_date)

        # Group filter: filter results by athlete group
        if group_id:
            from app.models.group import Group, group_athletes
            query = query.join(
                group_athletes,
                TestResult.athlete_id == group_athletes.c.athlete_id
            ).filter(group_athletes.c.group_id == group_id)

        results = query.order_by(TestResult.test_date.asc()).all()

        # Build athlete progress data
        athlete_progress = {}
        for r in results:
            key = r.athlete_id
            if key not in athlete_progress:
                athlete_progress[key] = {
                    "athlete_id": r.athlete_id,
                    "athlete_name": f"{r.athlete.user.first_name} {r.athlete.user.last_name}" if r.athlete and r.athlete.user else f"Atleta {r.athlete_id}",
                    "template_name": r.template.name if r.template else "",
                    "template_id": r.template_id,
                    "category": r.template.category if r.template else "",
                    "unit": r.template.unit if r.template else "",
                    "higher_is_better": r.template.higher_is_better if r.template else True,
                    "values": [],
                    "first_value": None,
                    "last_value": None,
                    "previous_value": None,
                    "delta": 0,
                    "delta_pct": 0,
                    "trend": "→"
                }
            athlete_progress[key]["values"].append({
                "date": r.test_date.isoformat(),
                "value": float(r.value)
            })

        # Calculate deltas for each athlete
        for key, data in athlete_progress.items():
            vals = data["values"]
            if len(vals) >= 1:
                data["first_value"] = vals[0]["value"]
                data["last_value"] = vals[-1]["value"]
            if len(vals) >= 2:
                data["previous_value"] = vals[-2]["value"]
                diff = data["last_value"] - data["previous_value"]
                data["delta"] = round(diff, 2)
                if data["previous_value"] != 0:
                    data["delta_pct"] = round((diff / data["previous_value"]) * 100, 1)
                # Determine trend
                if data["higher_is_better"]:
                    data["trend"] = "↑" if diff > 0 else ("↓" if diff < 0 else "→")
                else:
                    data["trend"] = "↓" if diff > 0 else ("↑" if diff < 0 else "→")

        return list(athlete_progress.values())

    @staticmethod
    def get_athlete_stats(athlete_id):
        """Returns athlete test stats including averages by category, trends, and group comparison."""
        results = TestResult.query.filter_by(athlete_id=athlete_id).order_by(TestResult.test_date.desc()).all()
        if not results:
            return None

        # Results by category
        categories = {}
        for r in results:
            cat = r.template.category if r.template else "OTRO"
            if cat not in categories:
                categories[cat] = []
            categories[cat].append({
                "id": r.id,
                "template_id": r.template_id,
                "template_name": r.template.name if r.template else "",
                "value": float(r.value),
                "test_date": r.test_date.isoformat(),
                "higher_is_better": r.template.higher_is_better if r.template else True,
                "unit": r.template.unit if r.template else ""
            })

        # Build category averages and latest values
        category_stats = []
        for cat, vals in categories.items():
            latest_by_template = {}
            for v in vals:
                tid = v["template_id"]
                if tid not in latest_by_template or v["test_date"] > latest_by_template[tid]["test_date"]:
                    latest_by_template[tid] = v

            # Get previous values for delta
            previous_by_template = {}
            sorted_vals = sorted(categories[cat], key=lambda x: x["test_date"], reverse=True)
            for v in sorted_vals:
                tid = v["template_id"]
                if tid not in previous_by_template:
                    previous_by_template[tid] = v

            template_stats = []
            for tid, latest in latest_by_template.items():
                prev = previous_by_template.get(tid)
                delta = 0
                delta_pct = 0
                if prev and latest["id"] != prev["id"]:
                    diff = latest["value"] - prev["value"]
                    delta = round(diff, 2)
                    if prev["value"] != 0:
                        delta_pct = round((diff / prev["value"]) * 100, 1)

                template_stats.append({
                    "template_name": latest["template_name"],
                    "latest_value": latest["value"],
                    "previous_value": prev["value"] if prev and latest["id"] != prev["id"] else None,
                    "delta": delta,
                    "delta_pct": delta_pct,
                    "unit": latest["unit"],
                    "higher_is_better": latest["higher_is_better"],
                    "test_date": latest["test_date"]
                })

            avg_value = round(sum(v["value"] for v in vals) / len(vals), 2)
            category_stats.append({
                "category": cat,
                "avg_value": avg_value,
                "count": len(vals),
                "templates": template_stats
            })

        # Overall trend indicator
        total_improving = sum(1 for cs in category_stats for t in cs["templates"] if (t["higher_is_better"] and t["delta"] > 0) or (not t["higher_is_better"] and t["delta"] < 0))
        total_declining = sum(1 for cs in category_stats for t in cs["templates"] if (t["higher_is_better"] and t["delta"] < 0) or (not t["higher_is_better"] and t["delta"] > 0))
        overall_trend = "↑" if total_improving > total_declining else ("↓" if total_declining > total_improving else "→")

        # Get group averages for comparison
        athlete = None
        from app.models.athlete import Athlete
        athlete_obj = Athlete.query.get(athlete_id)
        group_comparison = None
        if athlete_obj and athlete_obj.current_groups:
            athlete = athlete_obj
            group_ids = [g.id for g in athlete.current_groups]
            from app.models.group import group_athletes
            group_athlete_ids = db.session.query(group_athletes.c.athlete_id).filter(
                group_athletes.c.group_id.in_(group_ids)
            ).all()
            group_athlete_ids = [a[0] for a in group_athlete_ids]

            if group_athlete_ids:
                group_results = TestResult.query.filter(
                    TestResult.athlete_id.in_(group_athlete_ids)
                ).all()
                group_categories = {}
                for r in group_results:
                    cat = r.template.category if r.template else "OTRO"
                    if cat not in group_categories:
                        group_categories[cat] = []
                    group_categories[cat].append(float(r.value))

                group_comparison = {}
                for cat, vals in group_categories.items():
                    if vals:
                        group_comparison[cat] = round(sum(vals) / len(vals), 2)

        return {
            "athlete_id": athlete_id,
            "total_tests": len(results),
            "categories": category_stats,
            "overall_trend": overall_trend,
            "group_comparison": group_comparison
        }

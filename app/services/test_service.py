from app.extensions import db
from app.models.test import TestTemplate, TestResult, TestSession
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

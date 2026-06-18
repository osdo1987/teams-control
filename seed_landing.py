"""
seed_landing.py — Sembrar landing pages de prueba para TODOS los clubes existentes.
Ejecutar con: python seed_landing.py
"""
from datetime import datetime
from app import create_app, db
from app.models.club import Club
from app.models.landing import ClubLandingPage


# ─── Datos específicos para clubes conocidos ──────────────────────────────────
KNOWN_CLUBS = {
    "Troya Voley": {
        "hero_title": "Troya Voley — Formación de Voleibol",
        "hero_subtitle": "Enfocados en el desarrollo de niñas, niños y jóvenes. Enseñamos desde cero sin importar tu nivel de experiencia.",
        "banner_url": "https://images.unsplash.com/photo-1612872087720-bb876e2e67d1?w=1200&q=80",
        "cta_text": "Ingresar al sistema",
        "about_title": "Nuestro Club",
        "about_text": "Troya Voley es un destacado club de formación de voleibol.\n\nEnfocados en el desarrollo de niñas, niños y jóvenes, enseñamos desde cero sin importar tu nivel de experiencia. Ofrecemos voleibol de piso en modalidad formativa y competitiva.\n\nNuestra metodología de trabajo en equipo y formación integral hace la diferencia en cada uno de nuestros atletas.",
        "about_image_url": "https://images.unsplash.com/photo-1599058917212-d750089bc07e?w=600&q=80",
        "features_title": "Nuestros programas",
        "features": [
            {"icon": "zap", "title": "Voleibol de Piso", "description": "Modalidad formativa y competitiva para todas las edades y niveles."},
            {"icon": "heart", "title": "Formación desde Cero", "description": "Enseñamos voleibol desde cero, sin importar tu nivel de experiencia."},
            {"icon": "users", "title": "Niños y Jóvenes", "description": "Programas especializados para el desarrollo de niñas, niños y jóvenes."},
            {"icon": "award", "title": "Trabajo en Equipo", "description": "Metodología enfocada en valores, disciplina y trabajo en equipo."}
        ],
        "contact_email": "contacto@troyavoley.com",
        "contact_phone": "+57 301 234 5678",
        "address": "Guadalajara de Buga, Valle del Cauca",
        "social_facebook": "https://facebook.com/ClubDeportivoTroyaBuga",
        "social_instagram": "https://instagram.com/clubdeportivotroya",
        "social_whatsapp": "https://wa.me/573012345678",
        "footer_text": "Formando talentos en voleibol.",
    },
    "Club Deportivo Troya Buga": {
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
        "contact_email": "contacto@troyavoley.com",
        "contact_phone": "+57 301 234 5678",
        "address": "Guadalajara de Buga, Valle del Cauca",
        "social_facebook": "https://facebook.com/ClubDeportivoTroyaBuga",
        "social_instagram": "https://instagram.com/clubdeportivotroya",
        "social_whatsapp": "https://wa.me/573012345678",
        "footer_text": "Formando talentos en Buga, Valle del Cauca.",
    },
    "Águilas FC Bogotá": {
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
        "contact_email": "info@aguilasfc.com",
        "contact_phone": "+57 320 456 7890",
        "address": "Estadio El Campín, Cancha B, Cra 30 # 57-45, Bogotá",
        "social_facebook": "https://facebook.com/aguilasfcbogota",
        "social_instagram": "https://instagram.com/aguilasfc_",
        "social_whatsapp": "https://wa.me/573204567890",
        "footer_text": "Orgullosamente bogotanos.",
    },
    "Academia Náutica Caribe": {
        "hero_title": "Academia Náutica Caribe",
        "hero_subtitle": "Escuela de natación y deportes acuáticos en Barranquilla. Aprende, nada y compite con nosotros.",
        "banner_url": "https://images.unsplash.com/photo-1530549387789-4c1017266634?w=1200&q=80",
        "cta_text": "Ingresar",
        "about_title": "Sobre la academia",
        "about_text": "La Academia Náutica Caribe es una escuela de natación ubicada en Barranquilla, Atlántico.\n\nOfrecemos programas de iniciación y perfeccionamiento en natación para todas las edades. Nuestras instalaciones cuentan con piscina olímpica y equipo especializado.\n\nDesde nuestra fundación, hemos formado a cientos de nadadores, desde principiantes hasta competidores regionales.",
        "about_image_url": "https://images.unsplash.com/photo-1519315901367-f34ff9154487?w=600&q=80",
        "features_title": "Nuestros servicios",
        "features": [
            {"icon": "heart", "title": "Natación para Todos", "description": "Clases desde nivel principiante hasta avanzado, para niños y adultos."},
            {"icon": "zap", "title": "Entrenamiento Competitivo", "description": "Preparación para competencias de natación a nivel departamental."},
            {"icon": "users", "title": "Clases Grupales", "description": "Grupos reducidos con instrucción personalizada y seguimiento continuo."},
            {"icon": "star", "title": "Natación Terapéutica", "description": "Programas especiales de natación para rehabilitación y bienestar."}
        ],
        "contact_email": "info@nauticacaribe.com",
        "contact_phone": "+57 301 678 9012",
        "address": "Piscina Olímpica El Prado, Cra 54 # 70-10, Barranquilla",
        "social_facebook": "https://facebook.com/nauticacaribe",
        "social_instagram": "https://instagram.com/nauticacaribe",
        "social_whatsapp": "https://wa.me/573016789012",
        "footer_text": "Sumérgete en la excelencia.",
    },
    "Tigres de Ibagué FC": {
        "hero_title": "Tigres de Ibagué FC",
        "hero_subtitle": "Club de fútbol con tradición y garra tolimense. Formando talentos desde 1998.",
        "banner_url": "https://images.unsplash.com/photo-1459865264687-595d652de67e?w=1200&q=80",
        "cta_text": "Iniciar sesión",
        "about_title": "Nuestra trayectoria",
        "about_text": "Tigres de Ibagué FC es un club de fútbol con más de 25 años de historia en Ibagué, Tolima.\n\nNacimos como un sueño de barrio y hoy somos una institución reconocida en el fútbol juvenil tolimense. Hemos formado a decenas de jugadores que han llegado al fútbol profesional colombiano.\n\nNuestro lema: disciplina, respeto y pasión por el fútbol.",
        "about_image_url": "https://images.unsplash.com/photo-1517466787929-bc90951d0974?w=600&q=80",
        "features_title": "Nuestros programas",
        "features": [
            {"icon": "award", "title": "Formación Juvenil", "description": "Programa de desarrollo para jóvenes futbolistas de 14 a 20 años."},
            {"icon": "trending", "title": "Proyección Profesional", "description": "Conexiones con clubes profesionales para visibilizar talentos."},
            {"icon": "shield", "title": "Escuela de Valores", "description": "Formación en disciplina, trabajo en equipo y respeto."},
            {"icon": "clock", "title": "Entrenamientos Flexibles", "description": "Horarios adaptados para estudiantes y trabajadores."}
        ],
        "contact_email": "contacto@tigresibague.com",
        "contact_phone": "+57 312 345 6789",
        "address": "Estadio Manuel Murillo Toro, Campo 2, Cra 5 # 19-50, Ibagué",
        "social_facebook": "https://facebook.com/tigresibaguefc",
        "social_instagram": "https://instagram.com/tigresibaguefc",
        "social_whatsapp": "https://wa.me/573123456789",
        "footer_text": "La garra del Tolima.",
    },
}

# ─── Templates genéricos por deporte ──────────────────────────────────────────
SPORT_TEMPLATES = {
    "Fútbol": {
        "hero_subtitle": "Academia de fútbol formando talentos con disciplina y pasión.",
        "banner_url": "https://images.unsplash.com/photo-1431324155629-1a6deb1dec8d?w=1200&q=80",
        "about_title": "Sobre nuestro club",
        "about_text": "Somos un club de fútbol comprometido con la formación integral de jóvenes atletas.\n\nNuestro programa combina entrenamiento de alto nivel con valores como disciplina, trabajo en equipo y respeto. Contamos con entrenadores certificados y instalaciones de primera.\n\nÚnete y forma parte de nuestra familia deportiva.",
        "about_image_url": "https://images.unsplash.com/photo-1574629810360-7efbbe195018?w=600&q=80",
        "features_title": "Nuestros programas",
        "features": [
            {"icon": "award", "title": "Alto Rendimiento", "description": "Preparación competitiva para torneos locales y regionales."},
            {"icon": "users", "title": "Formación Juvenil", "description": "Programas para niños y jóvenes de todas las edades."},
            {"icon": "shield", "title": "Valores y Disciplina", "description": "Formación integral más allá del deporte."},
            {"icon": "clock", "title": "Horarios Flexibles", "description": "Entrenamientos adaptados a tu disponibilidad."}
        ],
        "gallery_images": [
            {"url": "https://images.unsplash.com/photo-1431324155629-1a6deb1dec8d?w=400&q=80", "caption": "Entrenamiento en equipo"},
            {"url": "https://images.unsplash.com/photo-1574629810360-7efbbe195018?w=400&q=80", "caption": "Partido oficial"},
            {"url": "https://images.unsplash.com/photo-1551958219-acbc608c6377?w=400&q=80", "caption": "Preparación física"},
            {"url": "https://images.unsplash.com/photo-1461896836934-bd45ba8fcf9b?w=400&q=80", "caption": "Celebración deportiva"},
        ],
    },
    "Natación": {
        "hero_subtitle": "Escuela de natación y deportes acuáticos para todas las edades.",
        "banner_url": "https://images.unsplash.com/photo-1530549387789-4c1017266634?w=1200&q=80",
        "about_title": "Sobre la academia",
        "about_text": "Somos una escuela de natación dedicada a enseñar y perfeccionar la natación para todas las edades.\n\nContamos con instalaciones de primer nivel, piscinas climatizadas y un equipo de entrenadores certificados.\n\nDesde la iniciación hasta el alto rendimiento, te acompañamos en cada paso de tu desarrollo acuático.",
        "about_image_url": "https://images.unsplash.com/photo-1519315901367-f34ff9154487?w=600&q=80",
        "features_title": "Nuestros servicios",
        "features": [
            {"icon": "heart", "title": "Natación para Todos", "description": "Clases desde principiante hasta avanzado, para niños y adultos."},
            {"icon": "zap", "title": "Alto Rendimiento", "description": "Preparación para competencias de natación."},
            {"icon": "users", "title": "Clases Grupales", "description": "Grupos reducidos con atención personalizada."},
            {"icon": "star", "title": "Natación Terapéutica", "description": "Programas de rehabilitación y bienestar acuático."}
        ],
        "gallery_images": [
            {"url": "https://images.unsplash.com/photo-1530549387789-4c1017266634?w=400&q=80", "caption": "Entrenamiento acuático"},
            {"url": "https://images.unsplash.com/photo-1519315901367-f34ff9154487?w=400&q=80", "caption": "Clase grupal"},
            {"url": "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=400&q=80", "caption": "Competencia"},
            {"url": "https://images.unsplash.com/photo-1575429198097-0414ec08e8cd?w=400&q=80", "caption": "Nado libre"},
        ],
    },
    "Baloncesto": {
        "hero_subtitle": "Academia de baloncesto formando jugadores completos.",
        "banner_url": "https://images.unsplash.com/photo-1546519638-68e109498ffc?w=1200&q=80",
        "about_title": "Sobre nuestro club",
        "about_text": "Somos un club de baloncesto dedicado a la formación de jugadores con técnica, visión de juego y valores deportivos.\n\nNuestro programa abarca desde iniciación hasta competencia de alto nivel, con entrenadores experimentados.\n\nDesarrollamos habilidades técnicas, tácticas y físicas para formar atletas completos.",
        "about_image_url": "https://images.unsplash.com/photo-1546519638-68e109498ffc?w=600&q=80",
        "features_title": "Lo que ofrecemos",
        "features": [
            {"icon": "award", "title": "Técnica Individual", "description": "Perfeccionamiento de fundamentos y habilidades individuales."},
            {"icon": "users", "title": "Categorías Formativas", "description": "Programas para todas las edades y niveles."},
            {"icon": "shield", "title": "Formación Integral", "description": "Valores, disciplina y trabajo en equipo."},
            {"icon": "trending", "title": "Competencia", "description": "Participación en torneos locales y regionales."}
        ],
        "gallery_images": [
            {"url": "https://images.unsplash.com/photo-1546519638-68e109498ffc?w=400&q=80", "caption": "Entrenamiento en cancha"},
            {"url": "https://images.unsplash.com/photo-1574629810360-7efbbe195018?w=400&q=80", "caption": "Partido oficial"},
            {"url": "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=400&q=80", "caption": "Preparación física"},
            {"url": "https://images.unsplash.com/photo-1461896836934-bd45ba8fcf9b?w=400&q=80", "caption": "Celebración"},
        ],
    },
    "Voleibol": {
        "hero_subtitle": "Club de voleibol formando campeones con pasión y dedicación.",
        "banner_url": "https://images.unsplash.com/photo-1612872087720-bb876e2e67d1?w=1200&q=80",
        "about_title": "Sobre nuestro club",
        "about_text": "Somos un club de voleibol dedicado a la formación integral de atletas en esta emocionante disciplina.\n\nOfrecemos programas para todas las edades, desde iniciación hasta competencia de alto nivel.\n\nNuestra metodología enfoca el desarrollo técnico, físico y mental de cada jugador.",
        "about_image_url": "https://images.unsplash.com/photo-1599058917212-d750089bc07e?w=600&q=80",
        "features_title": "Nuestros programas",
        "features": [
            {"icon": "zap", "title": "Voleibol Formativo", "description": "Desarrollo técnico progresivo para todas las edades."},
            {"icon": "heart", "title": "Formación desde Cero", "description": "Aprendizaje desde los fundamentos básicos."},
            {"icon": "users", "title": "Categorías Juveniles", "description": "Programas especializados por edades."},
            {"icon": "award", "title": "Competencia", "description": "Participación en torneos y ligas regionales."}
        ],
        "gallery_images": [
            {"url": "https://images.unsplash.com/photo-1612872087720-bb876e2e67d1?w=400&q=80", "caption": "Entrenamiento de voleibol"},
            {"url": "https://images.unsplash.com/photo-1599058917212-d750089bc07e?w=400&q=80", "caption": "Partido en cancha"},
            {"url": "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=400&q=80", "caption": "Preparación física"},
            {"url": "https://images.unsplash.com/photo-1461896836934-bd45ba8fcf9b?w=400&q=80", "caption": "Celebración"},
        ],
    },
    "default": {
        "hero_subtitle": "Club deportivo comprometido con la formación y el bienestar de nuestros atletas.",
        "banner_url": "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=1200&q=80",
        "about_title": "Sobre nuestro club",
        "about_text": "Somos un club deportivo dedicado a la formación integral de atletas.\n\nNuestro equipo de entrenadores está comprometido con el desarrollo físico y personal de cada deportista.\n\nÚnete a nuestra comunidad deportiva y descubre tu potencial.",
        "about_image_url": "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=600&q=80",
        "features_title": "Lo que ofrecemos",
        "features": [
            {"icon": "award", "title": "Entrenamiento de Calidad", "description": "Metodologías modernas y profesionales."},
            {"icon": "users", "title": "Todas las Edades", "description": "Programas para niños, jóvenes y adultos."},
            {"icon": "shield", "title": "Valores Deportivos", "description": "Formación en disciplina y respeto."},
            {"icon": "heart", "title": "Bienestar Integral", "description": "Cuidamos la salud física y mental."}
        ],
        "gallery_images": [
            {"url": "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=400&q=80", "caption": "Entrenamiento"},
            {"url": "https://images.unsplash.com/photo-1431324155629-1a6deb1dec8d?w=400&q=80", "caption": "Competencia"},
            {"url": "https://images.unsplash.com/photo-1574629810360-7efbbe195018?w=400&q=80", "caption": "Preparación"},
            {"url": "https://images.unsplash.com/photo-1461896836934-bd45ba8fcf9b?w=400&q=80", "caption": "Celebración"},
        ],
    },
}


def generate_generic_landing(club):
    """Generate landing data for any club based on its name and sport."""
    sport = club.sport or "Fútbol"
    template = SPORT_TEMPLATES.get(sport, SPORT_TEMPLATES["default"])

    slug = club.slug or club.name.lower().replace(" ", "-")

    return {
        "hero_title": f"{club.name}",
        "hero_subtitle": template["hero_subtitle"],
        "banner_url": template["banner_url"],
        "cta_text": "Ingresar",
        "about_title": template["about_title"],
        "about_text": template["about_text"],
        "about_image_url": template["about_image_url"],
        "features_title": template["features_title"],
        "features": template["features"],
        "gallery_images": template["gallery_images"],
        "contact_email": f"info@{slug}.com",
        "contact_phone": "+57 300 000 0000",
        "address": f"{club.sport} Club — Colombia",
        "social_facebook": "",
        "social_instagram": "",
        "social_whatsapp": "",
        "footer_text": f"{club.name} — Formando campeones.",
    }


def seed_landing_pages():
    app = create_app()
    with app.app_context():
        print("⚙️  Sembrando landing pages para TODOS los clubes...\n")

        clubs = Club.query.all()
        if not clubs:
            print("⚠️  No hay clubes en la base de datos. Ejecuta seed.py primero.")
            return

        count = 0
        for club in clubs:
            # Use known data if available, otherwise generate generic
            club_data = KNOWN_CLUBS.get(club.name)
            if not club_data:
                club_data = generate_generic_landing(club)
                print(f"   📋 {club.name}: datos genéricos generados (deporte: {club.sport})")
            else:
                print(f"   ⭐ {club.name}: datos específicos encontrados")

            existing = ClubLandingPage.query.filter_by(club_id=club.id).first()

            landing = existing or ClubLandingPage(club_id=club.id)

            landing.hero_title = club_data["hero_title"]
            landing.hero_subtitle = club_data.get("hero_subtitle")
            landing.banner_url = club_data.get("banner_url")
            landing.cta_text = club_data.get("cta_text", "Ingresar")
            landing.cta_link = "#login"
            landing.about_title = club_data.get("about_title", "Sobre nosotros")
            landing.about_text = club_data.get("about_text")
            landing.about_image_url = club_data.get("about_image_url")
            landing.features_title = club_data.get("features_title", "Nuestros servicios")
            landing.features = club_data.get("features", [])
            landing.gallery_title = "Galería"
            landing.gallery_images = club_data.get("gallery_images", [
                {"url": "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=400&q=80", "caption": "Entrenamiento"},
                {"url": "https://images.unsplash.com/photo-1431324155629-1a6deb1dec8d?w=400&q=80", "caption": "Competencia"},
                {"url": "https://images.unsplash.com/photo-1574629810360-7efbbe195018?w=400&q=80", "caption": "Preparación"},
                {"url": "https://images.unsplash.com/photo-1461896836934-bd45ba8fcf9b?w=400&q=80", "caption": "Celebración"},
            ])
            landing.contact_email = club_data.get("contact_email")
            landing.contact_phone = club_data.get("contact_phone")
            landing.address = club_data.get("address")
            landing.social_facebook = club_data.get("social_facebook", "")
            landing.social_instagram = club_data.get("social_instagram", "")
            landing.social_whatsapp = club_data.get("social_whatsapp", "")
            landing.show_login_in_hero = True
            landing.show_about = True
            landing.show_features = True
            landing.show_gallery = True
            landing.show_contact = True
            landing.show_footer_social = True
            landing.footer_text = club_data.get("footer_text")

            if not existing:
                db.session.add(landing)
            count += 1
            print(f"   ✓ {club.name}: landing page {'creada' if not existing else 'actualizada'}")

        db.session.commit()
        print(f"\n✅  {count} landing pages procesadas exitosamente.")
        print("\n📌  Para verlas, visita en tu navegador:")
        for club in clubs:
            slug = club.slug or club.name.lower().replace(" ", "-")
            print(f"     /{slug}")
        print("\n📌  Para editarlas desde el panel ADMIN:")
        print("     Ir a /admin/landing")


if __name__ == "__main__":
    seed_landing_pages()
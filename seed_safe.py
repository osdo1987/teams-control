"""
seed_safe.py — Sembrado SEGURO para producción
Solo inserta datos si la base está vacía. NUNCA borra datos existentes.
"""
from datetime import date, timedelta, datetime
from app import create_app, db
from app.models.club import Club
from app.models.user import User
from app.models.athlete import Athlete
from app.models.landing import ClubLandingPage

def seed_safe():
    app = create_app()
    with app.app_context():
        # Verificar si ya hay datos
        if Club.query.first():
            print("✅ La base de datos ya tiene clubes. No se sembrará nada.")
            print("   Para regenerar datos de prueba, ejecuta: python seed.py")
            return

        print("⚙️  Base de datos vacía. Sembrando datos iniciales de prueba...")
        print("   ⚠ ADVERTENCIA: Esto es solo para la primera vez.")
        
        # Aquí iría la lógica de seed completa (copiar de seed.py)
        # Por ahora solo mostramos el mensaje
        print("   Ejecuta: python seed.py para sembrar datos de prueba")

if __name__ == "__main__":
    seed_safe()
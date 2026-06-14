"""
migrate_club_customization.py — Adds new columns to the clubs table
for slug-based login and visual customization.

Run: python migrate_club_customization.py
"""
from app import create_app, db
from sqlalchemy import text

def migrate():
    app = create_app()
    with app.app_context():
        print("🔄 Migrando tabla clubs — añadiendo campos de personalización...")
        
        migrations = [
            ("slug", "VARCHAR(100) UNIQUE"),
            ("primary_color", "VARCHAR(7) DEFAULT '#6366f1'"),
            ("logo_url", "TEXT"),
            ("welcome_message", "VARCHAR(200)"),
            ("show_features", "BOOLEAN DEFAULT TRUE"),
        ]
        
        for col_name, col_def in migrations:
            try:
                db.session.execute(text(f"ALTER TABLE clubs ADD COLUMN {col_name} {col_def}"))
                db.session.commit()
                print(f"   ✓ Columna '{col_name}' agregada")
            except Exception as e:
                db.session.rollback()
                if "duplicate column" in str(e).lower() or "already exists" in str(e).lower():
                    print(f"   ⏭ Columna '{col_name}' ya existe, saltando...")
                else:
                    print(f"   ✗ Error agregando '{col_name}': {e}")
        
        print("\n✅ Migración completada.")

if __name__ == "__main__":
    migrate()
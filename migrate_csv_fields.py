"""
Script de migración para agregar campos del CSV a las tablas existentes
Ejecutar con: docker-compose exec api python migrate_csv_fields.py
"""
from app import create_app, db
from sqlalchemy import text

def migrate():
    app = create_app()
    with app.app_context():
        print("🔄 Iniciando migración de campos CSV...")
        print("=" * 80)
        
        try:
            # ── TABLA USERS ─────────────────────────────────────────────────
            print("\n📋 Migrando tabla: users")
            print("-" * 80)
            
            users_columns = [
                ("document_type", "VARCHAR(20)"),
                ("second_last_name", "VARCHAR(50)"),
                ("gender", "VARCHAR(20)"),
                ("blood_type", "VARCHAR(5)"),
                ("birth_city", "VARCHAR(100)"),
                ("birth_country", "VARCHAR(100)"),
                ("fixed_phone", "VARCHAR(20)"),
                ("neighborhood", "VARCHAR(100)"),
                ("insurance", "VARCHAR(100)"),
                ("uniforms", "VARCHAR(200)"),
                ("start_date", "DATE"),
                ("address", "VARCHAR(200)"),
            ]
            
            for col_name, col_type in users_columns:
                try:
                    sql = f"ALTER TABLE users ADD COLUMN IF NOT EXISTS {col_name} {col_type};"
                    db.session.execute(text(sql))
                    print(f"   ✅ Columna '{col_name}' agregada")
                except Exception as e:
                    print(f"   ⚠️  Columna '{col_name}': {str(e)[:100]}")
            
            db.session.commit()
            
            # ── TABLA ATHLETES ──────────────────────────────────────────────
            print("\n📋 Migrando tabla: athletes")
            print("-" * 80)
            
            athletes_columns = [
                ("birth_city", "VARCHAR(100)"),
                ("birth_country", "VARCHAR(100)"),
                ("fixed_phone", "VARCHAR(20)"),
                ("neighborhood", "VARCHAR(100)"),
                ("insurance", "VARCHAR(100)"),
                ("uniforms", "VARCHAR(200)"),
                ("start_date", "DATE"),
                ("eps", "VARCHAR(100)"),
                ("physical_diseases", "TEXT"),
                ("medical_diseases", "TEXT"),
                ("allergies", "TEXT"),
                ("physical_disability", "TEXT"),
            ]
            
            for col_name, col_type in athletes_columns:
                try:
                    sql = f"ALTER TABLE athletes ADD COLUMN IF NOT EXISTS {col_name} {col_type};"
                    db.session.execute(text(sql))
                    print(f"   ✅ Columna '{col_name}' agregada")
                except Exception as e:
                    print(f"   ⚠️  Columna '{col_name}': {str(e)[:100]}")
            
            db.session.commit()
            
            # ── TABLA GUARDIANS ─────────────────────────────────────────────
            print("\n📋 Migrando tabla: guardians")
            print("-" * 80)
            
            guardians_columns = [
                ("father_first_last_name", "VARCHAR(50)"),
                ("father_second_last_name", "VARCHAR(50)"),
                ("father_first_name", "VARCHAR(50)"),
                ("father_home_address", "VARCHAR(200)"),
                ("father_work_address", "VARCHAR(200)"),
                ("father_phone", "VARCHAR(20)"),
                ("mother_first_last_name", "VARCHAR(50)"),
                ("mother_second_last_name", "VARCHAR(50)"),
                ("mother_first_name", "VARCHAR(50)"),
                ("mother_home_address", "VARCHAR(200)"),
                ("mother_work_address", "VARCHAR(200)"),
                ("mother_phone", "VARCHAR(20)"),
            ]
            
            for col_name, col_type in guardians_columns:
                try:
                    sql = f"ALTER TABLE guardians ADD COLUMN IF NOT EXISTS {col_name} {col_type};"
                    db.session.execute(text(sql))
                    print(f"   ✅ Columna '{col_name}' agregada")
                except Exception as e:
                    print(f"   ⚠️  Columna '{col_name}': {str(e)[:100]}")
            
            db.session.commit()
            
            # ── TABLA MEDICAL_INFO ──────────────────────────────────────────
            print("\n📋 Migrando tabla: medical_info")
            print("-" * 80)
            
            medical_columns = [
                ("physical_diseases", "TEXT"),
                ("medical_diseases", "TEXT"),
                ("physical_disability", "TEXT"),
                ("emergency_phone", "VARCHAR(20)"),
                ("emergency_relationship", "VARCHAR(50)"),
                ("emergency_alternate", "VARCHAR(100)"),
            ]
            
            for col_name, col_type in medical_columns:
                try:
                    sql = f"ALTER TABLE medical_info ADD COLUMN IF NOT EXISTS {col_name} {col_type};"
                    db.session.execute(text(sql))
                    print(f"   ✅ Columna '{col_name}' agregada")
                except Exception as e:
                    print(f"   ⚠️  Columna '{col_name}': {str(e)[:100]}")
            
            db.session.commit()
            
            # ── TABLA ACADEMIC_INFO ─────────────────────────────────────────
            print("\n📋 Migrando tabla: academic_info")
            print("-" * 80)
            
            academic_columns = [
                ("academic_level", "VARCHAR(50)"),
            ]
            
            for col_name, col_type in academic_columns:
                try:
                    sql = f"ALTER TABLE academic_info ADD COLUMN IF NOT EXISTS {col_name} {col_type};"
                    db.session.execute(text(sql))
                    print(f"   ✅ Columna '{col_name}' agregada")
                except Exception as e:
                    print(f"   ⚠️  Columna '{col_name}': {str(e)[:100]}")
            
            db.session.commit()
            
            print("\n" + "=" * 80)
            print("✅ Migración completada exitosamente")
            print("=" * 80)
            print("\n📊 Resumen de cambios:")
            print(f"   - users: {len(users_columns)} columnas agregadas")
            print(f"   - athletes: {len(athletes_columns)} columnas agregadas")
            print(f"   - guardians: {len(guardians_columns)} columnas agregadas")
            print(f"   - medical_info: {len(medical_columns)} columnas agregadas")
            print(f"   - academic_info: {len(academic_columns)} columnas agregadas")
            print(f"\n   Total: {len(users_columns) + len(athletes_columns) + len(guardians_columns) + len(medical_columns) + len(academic_columns)} columnas nuevas")
            
        except Exception as e:
            print(f"\n❌ Error durante la migración: {str(e)}")
            db.session.rollback()
            raise

if __name__ == "__main__":
    migrate()
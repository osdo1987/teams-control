"""
Script para importar atletas desde archivo CSV
Ejecutar con: docker-compose exec api python import_csv_athletes.py <ruta_al_archivo.csv>
"""
import sys
import csv
from datetime import datetime
from app import create_app, db
from app.models.user import User
from app.models.athlete import Athlete, Guardian, MedicalInfo, AcademicInfo
from app.models.club import Club

def parse_date(date_str):
    """Parsear fecha desde formato DD/MM/YYYY o YYYY-MM-DD"""
    if not date_str or date_str.strip() == '':
        return None
    
    date_str = date_str.strip()
    
    # Intentar formato DD/MM/YYYY
    try:
        return datetime.strptime(date_str, '%d/%m/%Y').date()
    except ValueError:
        pass
    
    # Intentar formato YYYY-MM-DD
    try:
        return datetime.strptime(date_str, '%Y-%m-%d').date()
    except ValueError:
        pass
    
    return None

def get_or_create_club(club_name):
    """Obtener o crear club por nombre"""
    if not club_name:
        return None
    
    club = Club.query.filter_by(name=club_name).first()
    if not club:
        club = Club(
            name=club_name,
            slug=club_name.lower().replace(' ', '-'),
            sport='General',
            description=f'Club deportivo: {club_name}',
            subscription_status='ACTIVE',
            plan_type='BASIC'
        )
        db.session.add(club)
        db.session.flush()
    
    return club

def import_csv(csv_file_path):
    app = create_app()
    with app.app_context():
        print(f"📂 Leyendo archivo: {csv_file_path}")
        print("=" * 80)
        
        try:
            with open(csv_file_path, 'r', encoding='utf-8') as file:
                # Detectar delimitador
                sample = file.read(1024)
                file.seek(0)
                
                delimiter = ';' if sample.count(';') > sample.count(',') else ','
                
                reader = csv.DictReader(file, delimiter=delimiter)
                
                # Validar columnas requeridas
                required_fields = ['NUMERO_DOCUMENTO', 'NOMBRES', 'PRIMER_APELLIDO']
                missing_fields = [f for f in required_fields if f not in reader.fieldnames]
                
                if missing_fields:
                    print(f"❌ Error: Faltan columnas requeridas en el CSV: {', '.join(missing_fields)}")
                    print(f"   Columnas encontradas: {', '.join(reader.fieldnames)}")
                    return
                
                print(f"✅ CSV válido. Columnas detectadas: {len(reader.fieldnames)}")
                print(f"   Delimitador: '{delimiter}'")
                print()
                
                # Contadores
                imported = 0
                skipped = 0
                errors = 0
                
                # Procesar cada fila
                for row_num, row in enumerate(reader, start=2):  # start=2 porque la fila 1 es el header
                    try:
                        # Validar campos mínimos
                        doc_number = row.get('NUMERO_DOCUMENTO', '').strip()
                        first_name = row.get('NOMBRES', '').strip()
                        first_last_name = row.get('PRIMER_APELLIDO', '').strip()
                        
                        if not doc_number or not first_name or not first_last_name:
                            print(f"⚠️  Fila {row_num}: Campos requeridos vacíos, saltando...")
                            skipped += 1
                            continue
                        
                        # Verificar si ya existe
                        existing_user = User.query.filter_by(identification_number=doc_number).first()
                        if existing_user:
                            print(f"⚠️  Fila {row_num}: Usuario con documento {doc_number} ya existe, saltando...")
                            skipped += 1
                            continue
                        
                        # Obtener o crear club
                        club_name = row.get('CLUB', '').strip()
                        club = get_or_create_club(club_name) if club_name else None
                        
                        # ── CREAR USER ─────────────────────────────────────────
                        user = User(
                            identification_number=doc_number,
                            document_type=row.get('TIPO_DOCUMENTO_IDENTIDAD', '').strip() or None,
                            first_name=first_name,
                            last_name=first_last_name,
                            second_last_name=row.get('SEGUNDO_APELLIDO', '').strip() or None,
                            gender=row.get('GENERO', '').strip() or None,
                            blood_type=row.get('RH', '').strip() or None,
                            birth_city=row.get('CIUDAD_NACIMIENTO', '').strip() or None,
                            birth_country=row.get('PAIS_NACIMIENTO', '').strip() or None,
                            role='ATHLETE',
                            club_id=club.id if club else None,
                            phone=row.get('WHATSAPP', '').strip() or None,
                            fixed_phone=row.get('NUMERO_TELEFONO_FIJO', '').strip() or None,
                            address=row.get('DIRECCION_RESIDENCIA', '').strip() or None,
                            neighborhood=row.get('BARRIO', '').strip() or None,
                            insurance=row.get('SEGURO', '').strip() or None,
                            uniforms=row.get('UNIFORMES', '').strip() or None,
                            start_date=parse_date(row.get('FECHA_INICIO', '')),
                        )
                        user.set_password('atleta123')  # Contraseña por defecto
                        db.session.add(user)
                        db.session.flush()
                        
                        # ── CREAR ATHLETE ─────────────────────────────────────
                        athlete = Athlete(
                            user_id=user.id,
                            birth_date=parse_date(row.get('FECHA_NACIMIENTO', '')),
                            birth_city=row.get('CIUDAD_NACIMIENTO', '').strip() or None,
                            birth_country=row.get('PAIS_NACIMIENTO', '').strip() or None,
                            phone=row.get('WHATSAPP', '').strip() or None,
                            fixed_phone=row.get('NUMERO_TELEFONO_FIJO', '').strip() or None,
                            address=row.get('DIRECCION_RESIDENCIA', '').strip() or None,
                            neighborhood=row.get('BARRIO', '').strip() or None,
                            insurance=row.get('SEGURO', '').strip() or None,
                            uniforms=row.get('UNIFORMES', '').strip() or None,
                            start_date=parse_date(row.get('FECHA_INICIO', '')),
                            eps=row.get('EPS_NOMBRE', '').strip() or None,
                            physical_diseases=row.get('ENFERMEDADES_FISICAS', '').strip() or None,
                            medical_diseases=row.get('ENFERMEDADES_MEDICAS', '').strip() or None,
                            allergies=row.get('ALERGIAS', '').strip() or None,
                            physical_disability=row.get('INCAPACIDAD_FISICA', '').strip() or None,
                        )
                        db.session.add(athlete)
                        db.session.flush()
                        
                        # ── CREAR GUARDIAN (Padre/Madre) ────────────────────
                        guardian = Guardian(
                            athlete_id=athlete.id,
                            # Datos del padre
                            father_first_last_name=row.get('DATOS_PADRE_PRIMER_APELLIDO', '').strip() or None,
                            father_second_last_name=row.get('DATOS_PADRE_SEGUNDO_APELLIDO', '').strip() or None,
                            father_first_name=row.get('DATOS_PADRE_NOMBRES', '').strip() or None,
                            father_home_address=row.get('DIRECCION_RESIDENCIA_PADRE', '').strip() or None,
                            father_work_address=row.get('DIRECCION_TRABAJO_PADRE', '').strip() or None,
                            father_phone=row.get('WHATSAPP_PADRE', '').strip() or None,
                            # Datos de la madre
                            mother_first_last_name=row.get('DATOS_MADRE_PRIMER_APELLIDO', '').strip() or None,
                            mother_second_last_name=row.get('DATOS_MADRE_SEGUNDO_APELLIDO', '').strip() or None,
                            mother_first_name=row.get('DATOS_MADRE_NOMBRES', '').strip() or None,
                            mother_home_address=row.get('DIRECCION_RESIDENCIA_MADRE', '').strip() or None,
                            mother_work_address=row.get('DIRECCION_TRABAJO_MADRE', '').strip() or None,
                            mother_phone=row.get('WHATSAPP_MADRE', '').strip() or None,
                            # Acudiente
                            name=row.get('ACUDIENTE_NOMBRE', '').strip() or 'Sin acudiente',
                            relationship=row.get('ACUDIENTE_PARENTESCO', '').strip() or None,
                            phone=row.get('ACUDIENTE_WHATSAPP', '').strip() or None,
                        )
                        db.session.add(guardian)
                        
                        # ── CREAR MEDICAL_INFO ───────────────────────────────
                        medical_info = MedicalInfo(
                            athlete_id=athlete.id,
                            blood_type=row.get('RH', '').strip() or None,
                            allergies=row.get('ALERGIAS', '').strip() or None,
                            conditions=f"Enfermedades físicas: {row.get('ENFERMEDADES_FISICAS', '').strip() or 'Ninguna'}\n"
                                      f"Enfermedades médicas: {row.get('ENFERMEDADES_MEDICAS', '').strip() or 'Ninguna'}",
                            physical_diseases=row.get('ENFERMEDADES_FISICAS', '').strip() or None,
                            medical_diseases=row.get('ENFERMEDADES_MEDICAS', '').strip() or None,
                            physical_disability=row.get('INCAPACIDAD_FISICA', '').strip() or None,
                            emergency_contact=row.get('EMERGENCIA_NOMBRE', '').strip() or None,
                            emergency_phone=row.get('EMERGENCIA_WHATSAPP', '').strip() or None,
                            emergency_relationship=row.get('EMERGENCIA_PARENTESCO', '').strip() or None,
                            emergency_alternate=row.get('EMERGENCIA_CONTACTO_ALTERNATIVO', '').strip() or None,
                        )
                        db.session.add(medical_info)
                        
                        # ── CREAR ACADEMIC_INFO ──────────────────────────────
                        academic_info = AcademicInfo(
                            athlete_id=athlete.id,
                            school_name=row.get('NOMBRE_INSTITUCION_EDUCATIVA', '').strip() or None,
                            grade=row.get('GRADO_SEMESTRE', '').strip() or None,
                            academic_level=row.get('INSTITUCION_NIVEL_ACADEMICO_ACTUAL', '').strip() or None,
                        )
                        db.session.add(academic_info)
                        
                        imported += 1
                        
                        if imported % 10 == 0:
                            print(f"   📥 Procesados: {imported} registros...")
                            db.session.commit()
                        
                    except Exception as e:
                        errors += 1
                        print(f"❌ Fila {row_num}: Error al procesar - {str(e)[:100]}")
                        db.session.rollback()
                        continue
                
                # Commit final
                db.session.commit()
                
                # ── RESUMEN ─────────────────────────────────────────────
                print("\n" + "=" * 80)
                print("📊 RESUMEN DE IMPORTACIÓN")
                print("=" * 80)
                print(f"   Total filas procesadas: {imported + skipped + errors}")
                print(f"   ✅ Importados exitosamente: {imported}")
                print(f"   ⚠️  Saltados (duplicados/incompletos): {skipped}")
                print(f"   ❌ Errores: {errors}")
                print("=" * 80)
                
                if imported > 0:
                    print(f"\n🎉 Se importaron {imported} atletas exitosamente")
                    print(f"   Contraseña por defecto: atleta123")
                else:
                    print("\n⚠️  No se importaron registros")
                    
        except FileNotFoundError:
            print(f"❌ Error: No se encontró el archivo '{csv_file_path}'")
        except Exception as e:
            print(f"❌ Error al leer el CSV: {str(e)}")
            db.session.rollback()

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("❌ Uso: python import_csv_athletes.py <ruta_al_archivo.csv>")
        print("   Ejemplo: python import_csv_athletes.py datos_atletas.csv")
        sys.exit(1)
    
    csv_path = sys.argv[1]
    import_csv(csv_path)
"""
Script para buscar registros específicos en la base de datos
"""
from app import create_app, db
from app.models.user import User
from app.models.athlete import Athlete, Guardian, MedicalInfo, AcademicInfo

def search_records():
    app = create_app()
    with app.app_context():
        print("🔍 Buscando registros en la base de datos...")
        print("=" * 80)
        
        # ── PRIMER REGISTRO ─────────────────────────────────────────────────
        print("\n📋 REGISTRO 1: Gómez Pérez, Juan Carlos")
        print("-" * 80)
        
        # Buscar por nombre completo (first_name + last_name)
        # Nota: El modelo solo tiene un campo last_name, no dos apellidos separados
        record1 = User.query.filter(
            User.first_name == "Juan Carlos",
            User.last_name == "Gómez",
            User.role == "ATHLETE"
        ).first()
        
        if not record1:
            # Intentar buscar con "Pérez" como parte del last_name
            record1 = User.query.filter(
                User.first_name == "Juan Carlos",
                User.last_name.like("%Gómez%"),
                User.role == "ATHLETE"
            ).first()
        
        if record1:
            print(f"✅ Usuario encontrado:")
            print(f"   - ID: {record1.id}")
            print(f"   - Nombre: {record1.first_name} {record1.last_name}")
            print(f"   - Identificación: {record1.identification_number}")
            print(f"   - Email: {record1.email}")
            print(f"   - Teléfono: {record1.phone}")
            print(f"   - Rol: {record1.role}")
            print(f"   - Club ID: {record1.club_id}")
            
            # Obtener perfil de atleta
            athlete = Athlete.query.filter_by(user_id=record1.id).first()
            if athlete:
                print(f"\n   📊 Perfil de Atleta:")
                print(f"   - Fecha nacimiento: {athlete.birth_date}")
                print(f"   - Dirección: {athlete.address}")
                
                # Información académica
                academic = AcademicInfo.query.filter_by(athlete_id=athlete.id).first()
                if academic:
                    print(f"\n   🎓 Información Académica:")
                    print(f"   - Institución: {academic.school_name}")
                    print(f"   - Nivel/Grado: {academic.grade}")
                else:
                    print(f"\n   ⚠️  Información académica: NO ENCONTRADA")
                
                # Información médica
                medical = MedicalInfo.query.filter_by(athlete_id=athlete.id).first()
                if medical:
                    print(f"\n   🏥 Información Médica:")
                    print(f"   - Contacto emergencia: {medical.emergency_contact}")
                    print(f"   - Tipo sangre: {medical.blood_type}")
                    print(f"   - Alergias: {medical.allergies}")
                else:
                    print(f"\n   ⚠️  Información médica: NO ENCONTRADA")
                
                # Acudiente (padre/madre)
                guardian = Guardian.query.filter_by(athlete_id=athlete.id).first()
                if guardian:
                    print(f"\n   👨‍👩‍👧 Acudiente:")
                    print(f"   - Nombre: {guardian.name}")
                    print(f"   - Parentesco: {guardian.relationship}")
                    print(f"   - Teléfono: {guardian.phone}")
                    print(f"   - Email: {guardian.email}")
                else:
                    print(f"\n   ⚠️  Acudiente: NO ENCONTRADO")
            else:
                print(f"\n   ⚠️  Perfil de atleta: NO ENCONTRADO")
        else:
            print(f"❌ Usuario NO encontrado en la base de datos")
            print(f"   Buscando: Juan Carlos Gómez (ATHLETE)")
        
        # ── SEGUNDO REGISTRO ────────────────────────────────────────────────
        print("\n" + "=" * 80)
        print("\n📋 REGISTRO 2: Martínez, Laura")
        print("-" * 80)
        
        record2 = User.query.filter(
            User.first_name == "Laura",
            User.last_name == "Martínez",
            User.role == "ATHLETE"
        ).first()
        
        if not record2:
            record2 = User.query.filter(
                User.first_name == "Laura",
                User.last_name.like("%Martínez%"),
                User.role == "ATHLETE"
            ).first()
        
        if record2:
            print(f"✅ Usuario encontrado:")
            print(f"   - ID: {record2.id}")
            print(f"   - Nombre: {record2.first_name} {record2.last_name}")
            print(f"   - Identificación: {record2.identification_number}")
            print(f"   - Email: {record2.email}")
            print(f"   - Teléfono: {record2.phone}")
            print(f"   - Rol: {record2.role}")
            print(f"   - Club ID: {record2.club_id}")
            
            # Obtener perfil de atleta
            athlete2 = Athlete.query.filter_by(user_id=record2.id).first()
            if athlete2:
                print(f"\n   📊 Perfil de Atleta:")
                print(f"   - Fecha nacimiento: {athlete2.birth_date}")
                print(f"   - Dirección: {athlete2.address}")
                
                # Información académica
                academic2 = AcademicInfo.query.filter_by(athlete_id=athlete2.id).first()
                if academic2:
                    print(f"\n   🎓 Información Académica:")
                    print(f"   - Institución: {academic2.school_name}")
                    print(f"   - Nivel/Grado: {academic2.grade}")
                else:
                    print(f"\n   ⚠️  Información académica: NO ENCONTRADA")
                
                # Información médica
                medical2 = MedicalInfo.query.filter_by(athlete_id=athlete2.id).first()
                if medical2:
                    print(f"\n   🏥 Información Médica:")
                    print(f"   - Contacto emergencia: {medical2.emergency_contact}")
                    print(f"   - Tipo sangre: {medical2.blood_type}")
                    print(f"   - Alergias: {medical2.allergies}")
                else:
                    print(f"\n   ⚠️  Información médica: NO ENCONTRADA")
                
                # Acudiente (padre/madre)
                guardian2 = Guardian.query.filter_by(athlete_id=athlete2.id).first()
                if guardian2:
                    print(f"\n   👨‍👩‍👧 Acudiente:")
                    print(f"   - Nombre: {guardian2.name}")
                    print(f"   - Parentesco: {guardian2.relationship}")
                    print(f"   - Teléfono: {guardian2.phone}")
                    print(f"   - Email: {guardian2.email}")
                else:
                    print(f"\n   ⚠️  Acudiente: NO ENCONTRADO")
            else:
                print(f"\n   ⚠️  Perfil de atleta: NO ENCONTRADO")
        else:
            print(f"❌ Usuario NO encontrado en la base de datos")
            print(f"   Buscando: Laura Martínez (ATHLETE)")
        
        # ── RESUMEN ─────────────────────────────────────────────────────────
        print("\n" + "=" * 80)
        print("\n📊 RESUMEN:")
        print("-" * 80)
        
        found_1 = record1 is not None
        found_2 = record2 is not None
        
        print(f"Registro 1 (Juan Carlos Gómez): {'✅ ENCONTRADO' if found_1 else '❌ NO ENCONTRADO'}")
        print(f"Registro 2 (Laura Martínez): {'✅ ENCONTRADO' if found_2 else '❌ NO ENCONTRADO'}")
        
        if found_1 and found_2:
            print("\n✅ Ambos registros existen en la base de datos")
        elif found_1 or found_2:
            print("\n⚠️  Solo uno de los registros existe en la base de datos")
        else:
            print("\n❌ Ninguno de los registros existe en la base de datos")
        
        print("=" * 80)

if __name__ == "__main__":
    search_records()
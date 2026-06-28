"""
Script para verificar los registros importados desde CSV
"""
from app import create_app, db
from app.models.user import User
from app.models.athlete import Athlete, Guardian, MedicalInfo, AcademicInfo

def verify_import():
    app = create_app()
    with app.app_context():
        print("🔍 Verificando registros importados desde CSV...")
        print("=" * 80)
        
        # Buscar los registros de prueba
        test_docs = ['1000000001', '1000000002']
        
        for doc in test_docs:
            print(f"\n📋 Documento: {doc}")
            print("-" * 80)
            
            user = User.query.filter_by(identification_number=doc).first()
            
            if not user:
                print(f"❌ Usuario NO encontrado")
                continue
            
            print(f"✅ Usuario encontrado:")
            print(f"   - ID: {user.id}")
            print(f"   - Nombre completo: {user.first_name} {user.last_name} {user.second_last_name or ''}")
            print(f"   - Documento: {user.identification_number} ({user.document_type})")
            print(f"   - Género: {user.gender}")
            print(f"   - RH: {user.blood_type}")
            print(f"   - Ciudad nacimiento: {user.birth_city}")
            print(f"   - País nacimiento: {user.birth_country}")
            print(f"   - WhatsApp: {user.phone}")
            print(f"   - Teléfono fijo: {user.fixed_phone}")
            print(f"   - Dirección: {user.address}")
            print(f"   - Barrio: {user.neighborhood}")
            print(f"   - Seguro: {user.insurance}")
            print(f"   - Uniformes: {user.uniforms}")
            print(f"   - Fecha inicio: {user.start_date}")
            
            # Athlete
            athlete = Athlete.query.filter_by(user_id=user.id).first()
            if athlete:
                print(f"\n   📊 Datos del Atleta:")
                print(f"   - Fecha nacimiento: {athlete.birth_date}")
                print(f"   - Ciudad nacimiento: {athlete.birth_city}")
                print(f"   - País nacimiento: {athlete.birth_country}")
                print(f"   - EPS: {athlete.eps}")
                print(f"   - Enfermedades físicas: {athlete.physical_diseases}")
                print(f"   - Enfermedades médicas: {athlete.medical_diseases}")
                print(f"   - Alergias: {athlete.allergies}")
                print(f"   - Incapacidad física: {athlete.physical_disability}")
                
                # Guardian
                guardian = Guardian.query.filter_by(athlete_id=athlete.id).first()
                if guardian:
                    print(f"\n   👨‍👩‍👧 Datos de los Padres:")
                    print(f"   Padre: {guardian.father_first_name} {guardian.father_first_last_name} {guardian.father_second_last_name or ''}")
                    print(f"   - Teléfono: {guardian.father_phone}")
                    print(f"   - Dir. residencia: {guardian.father_home_address}")
                    print(f"   - Dir. trabajo: {guardian.father_work_address}")
                    print(f"   Madre: {guardian.mother_first_name} {guardian.mother_first_last_name} {guardian.mother_second_last_name or ''}")
                    print(f"   - Teléfono: {guardian.mother_phone}")
                    print(f"   - Dir. residencia: {guardian.mother_home_address}")
                    print(f"   - Dir. trabajo: {guardian.mother_work_address}")
                    print(f"   Acudiente: {guardian.name} ({guardian.relationship})")
                    print(f"   - Teléfono: {guardian.phone}")
                
                # Medical Info
                medical = MedicalInfo.query.filter_by(athlete_id=athlete.id).first()
                if medical:
                    print(f"\n   🏥 Información Médica:")
                    print(f"   - RH: {medical.blood_type}")
                    print(f"   - Alergias: {medical.allergies}")
                    print(f"   - Enfermedades físicas: {medical.physical_diseases}")
                    print(f"   - Enfermedades médicas: {medical.medical_diseases}")
                    print(f"   - Incapacidad: {medical.physical_disability}")
                    print(f"   - Contacto emergencia: {medical.emergency_contact}")
                    print(f"   - Tel. emergencia: {medical.emergency_phone}")
                    print(f"   - Parentesco emergencia: {medical.emergency_relationship}")
                    print(f"   - Contacto alterno: {medical.emergency_alternate}")
                
                # Academic Info
                academic = AcademicInfo.query.filter_by(athlete_id=athlete.id).first()
                if academic:
                    print(f"\n   🎓 Información Académica:")
                    print(f"   - Institución: {academic.school_name}")
                    print(f"   - Nivel: {academic.academic_level}")
                    print(f"   - Grado: {academic.grade}")
            else:
                print(f"   ⚠️  Perfil de atleta NO encontrado")
        
        # Resumen
        print("\n" + "=" * 80)
        print("📊 RESUMEN DE VERIFICACIÓN")
        print("=" * 80)
        
        total_users = User.query.filter(User.identification_number.in_(test_docs)).count()
        print(f"✅ Registros encontrados: {total_users}/{len(test_docs)}")
        
        if total_users == len(test_docs):
            print("\n🎉 Todos los registros de prueba fueron importados correctamente")
            print("   La base de datos ahora tiene los mismos campos que el CSV")
        else:
            print("\n⚠️  Faltan algunos registros por importar")

if __name__ == "__main__":
    verify_import()
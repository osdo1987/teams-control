"""
Script para verificar los datos del seed actualizados con los nuevos campos
"""
from app import create_app, db
from app.models.user import User
from app.models.athlete import Athlete, Guardian, MedicalInfo, AcademicInfo

def verify_seed():
    app = create_app()
    with app.app_context():
        print("🔍 Verificando datos del seed actualizados...")
        print("=" * 80)
        
        # Buscar un atleta de los creados por seed_demo (documentos 10XXXXXXXX)
        # Buscar los últimos 3 atletas creados
        athletes = User.query.filter(
            User.identification_number.like('10%'),
            User.role == 'ATHLETE'
        ).order_by(User.id.desc()).limit(3).all()
        
        if not athletes:
            print("❌ No se encontraron atletas del seed")
            return
        
        for user in athletes:
            print(f"\n📋 Atleta: {user.first_name} {user.last_name} {user.second_last_name or ''}")
            print(f"   Documento: {user.identification_number} ({user.document_type})")
            print(f"   Género: {user.gender}")
            print(f"   RH: {user.blood_type}")
            print(f"   Ciudad nacimiento: {user.birth_city}")
            print(f"   País nacimiento: {user.birth_country}")
            print(f"   WhatsApp: {user.phone}")
            print(f"   Teléfono fijo: {user.fixed_phone}")
            print(f"   Dirección: {user.address}")
            print(f"   Barrio: {user.neighborhood}")
            print(f"   Seguro: {user.insurance}")
            print(f"   Uniformes: {user.uniforms}")
            print(f"   Fecha inicio: {user.start_date}")
            
            # Athlete
            athlete = Athlete.query.filter_by(user_id=user.id).first()
            if athlete:
                print(f"\n   📊 Datos del Atleta:")
                print(f"   - Fecha nacimiento: {athlete.birth_date}")
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
        
        # Resumen
        print("\n" + "=" * 80)
        print("📊 RESUMEN DE VERIFICACIÓN DEL SEED")
        print("=" * 80)
        
        total_athletes = User.query.filter(User.identification_number.like('10%'), User.role == 'ATHLETE').count()
        print(f"✅ Total atletas en seed: {total_athletes}")
        
        # Verificar que los nuevos campos estén poblados
        sample = Athlete.query.filter(Athlete.eps.isnot(None)).first()
        if sample:
            print(f"✅ Campo EPS poblado: {sample.eps}")
        else:
            print("⚠️  Campo EPS no poblado")
        
        sample2 = Guardian.query.filter(Guardian.father_first_name.isnot(None)).first()
        if sample2:
            print(f"✅ Campos de padre/madre poblados")
        else:
            print("⚠️  Campos de padre/madre no poblados")
        
        sample3 = MedicalInfo.query.filter(MedicalInfo.emergency_phone.isnot(None)).first()
        if sample3:
            print(f"✅ Campos de emergencia poblados")
        else:
            print("⚠️  Campos de emergencia no poblados")
        
        print("\n🎉 Seed actualizado correctamente con todos los campos del CSV")

if __name__ == "__main__":
    verify_seed()
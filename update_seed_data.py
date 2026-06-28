"""
Script para actualizar los datos del seed existente con los nuevos campos del CSV
"""
from app import create_app, db
from app.models.user import User
from app.models.athlete import Athlete, Guardian, MedicalInfo, AcademicInfo
from datetime import date, timedelta
import random

def update_seed_data():
    app = create_app()
    with app.app_context():
        print("🔄 Actualizando datos del seed con nuevos campos CSV...")
        print("=" * 80)
        
        # Constantes
        BLOOD_TYPES = ["A+", "A-", "B+", "O+", "O-", "AB+"]
        SCHOOLS = [
            "Colegio San José", "Instituto Técnico Industrial", "Liceo de Cervantes",
            "Colegio Montessori", "Instituto La Salle", "Colegio Champagnat",
            "Liceo Femenino", "Colegio Bolívar", "Instituto de Oriente"
        ]
        
        def rphone():
            return f"3{random.randint(0,2)}{random.randint(0,9)}{random.randint(1000000,9999999)}"
        
        # Buscar todos los atletas del seed
        athletes_users = User.query.filter(
            User.identification_number.like('10%'),
            User.role == 'ATHLETE'
        ).all()
        
        print(f"\n📊 Encontrados {len(athletes_users)} atletas para actualizar")
        
        updated_count = 0
        
        for user in athletes_users:
            try:
                # Actualizar datos del usuario con campos nuevos
                if not user.document_type:
                    user.document_type = random.choice(["CC", "TI", "CE"])
                if not user.second_last_name:
                    user.second_last_name = random.choice(["García", "López", "Martínez", "Rodríguez", "Hernández", "González", "Díaz", "Moreno"])
                if not user.gender:
                    user.gender = random.choice(["Masculino", "Femenino"])
                if not user.blood_type:
                    user.blood_type = random.choice(BLOOD_TYPES)
                if not user.birth_city:
                    user.birth_city = random.choice(["Bogotá", "Medellín", "Cali", "Barranquilla", "Cartagena"])
                if not user.birth_country:
                    user.birth_country = "Colombia"
                if not user.fixed_phone:
                    user.fixed_phone = f"601{random.randint(1000000, 9999999)}"
                if not user.neighborhood:
                    user.neighborhood = random.choice(["Centro", "Norte", "Sur", "Occidente", "Oriente"])
                if not user.insurance:
                    user.insurance = random.choice(["Sura", "Nueva EPS", "Sanitas", "Coomeva"])
                if not user.uniforms:
                    user.uniforms = random.choice(["Completo", "Parcial", "Pendiente"])
                if not user.start_date:
                    user.start_date = date.today() - timedelta(days=random.randint(30, 180))
                
                # Actualizar datos del atleta
                athlete = Athlete.query.filter_by(user_id=user.id).first()
                if athlete:
                    if not athlete.birth_city:
                        athlete.birth_city = user.birth_city
                    if not athlete.birth_country:
                        athlete.birth_country = user.birth_country
                    if not athlete.fixed_phone:
                        athlete.fixed_phone = user.fixed_phone
                    if not athlete.neighborhood:
                        athlete.neighborhood = user.neighborhood
                    if not athlete.insurance:
                        athlete.insurance = user.insurance
                    if not athlete.uniforms:
                        athlete.uniforms = user.uniforms
                    if not athlete.start_date:
                        athlete.start_date = user.start_date
                    if not athlete.eps:
                        athlete.eps = user.insurance
                    if not athlete.physical_diseases:
                        athlete.physical_diseases = random.choice([None, "Ninguna", "Asma leve"])
                    if not athlete.medical_diseases:
                        athlete.medical_diseases = random.choice([None, "Ninguna", "Dermatitis"])
                    if not athlete.allergies:
                        athlete.allergies = random.choice([None, "Ninguna", "Polen", "Lactosa"])
                    if not athlete.physical_disability:
                        athlete.physical_disability = random.choice([None, "Ninguna"])
                    
                    # Actualizar información médica
                    medical = MedicalInfo.query.filter_by(athlete_id=athlete.id).first()
                    if medical:
                        if not medical.physical_diseases:
                            medical.physical_diseases = athlete.physical_diseases
                        if not medical.medical_diseases:
                            medical.medical_diseases = athlete.medical_diseases
                        if not medical.physical_disability:
                            medical.physical_disability = athlete.physical_disability
                        if not medical.emergency_phone:
                            medical.emergency_phone = rphone()
                        if not medical.emergency_relationship:
                            medical.emergency_relationship = random.choice(["Padre", "Madre", "Tío/a", "Abuelo/a"])
                        if not medical.emergency_alternate:
                            medical.emergency_alternate = rphone()
                    
                    # Actualizar datos de guardian (padre/madre)
                    guardian = Guardian.query.filter_by(athlete_id=athlete.id).first()
                    if guardian:
                        if not guardian.father_first_last_name:
                            guardian.father_first_last_name = user.last_name
                        if not guardian.father_second_last_name:
                            guardian.father_second_last_name = user.second_last_name
                        if not guardian.father_first_name:
                            guardian.father_first_name = random.choice(["Carlos", "Jorge", "Luis", "Miguel", "Andrés"])
                        if not guardian.father_home_address:
                            guardian.father_home_address = user.address
                        if not guardian.father_work_address:
                            guardian.father_work_address = "Centro Empresarial, Bogotá"
                        if not guardian.father_phone:
                            guardian.father_phone = rphone()
                        
                        if not guardian.mother_first_last_name:
                            guardian.mother_first_last_name = user.last_name
                        if not guardian.mother_second_last_name:
                            guardian.mother_second_last_name = user.second_last_name
                        if not guardian.mother_first_name:
                            guardian.mother_first_name = random.choice(["María", "Ana", "Patricia", "Laura", "Carmen"])
                        if not guardian.mother_home_address:
                            guardian.mother_home_address = user.address
                        if not guardian.mother_work_address:
                            guardian.mother_work_address = "Industrial Park, Bogotá"
                        if not guardian.mother_phone:
                            guardian.mother_phone = rphone()
                    
                    # Actualizar información académica
                    academic = AcademicInfo.query.filter_by(athlete_id=athlete.id).first()
                    if academic and not academic.academic_level:
                        academic.academic_level = random.choice(["Primaria", "Secundaria", "Bachillerato"])
                    
                    updated_count += 1
                    
                    if updated_count % 10 == 0:
                        print(f"   📝 Actualizados: {updated_count} registros...")
                        db.session.commit()
                
            except Exception as e:
                print(f"   ❌ Error actualizando {user.first_name} {user.last_name}: {str(e)[:100]}")
                db.session.rollback()
                continue
        
        # Commit final
        db.session.commit()
        
        print("\n" + "=" * 80)
        print("📊 RESUMEN DE ACTUALIZACIÓN")
        print("=" * 80)
        print(f"   ✅ Registros actualizados: {updated_count}/{len(athletes_users)}")
        print("=" * 80)
        
        if updated_count == len(athletes_users):
            print("\n🎉 Todos los registros del seed fueron actualizados correctamente")
            print("   La base de datos ahora tiene datos completos en todos los campos del CSV")
        else:
            print(f"\n⚠️  Se actualizaron {updated_count} de {len(athletes_users)} registros")

if __name__ == "__main__":
    update_seed_data()
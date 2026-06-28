"""
clean_prod_keep_demo.py — Limpia la base de datos de producción
manteniendo solo el club de DEMO (Fútbol Elite Academy)
"""
from app import create_app, db
from app.models.club import Club
from app.models.category import Category
from app.models.user import User
from app.models.athlete import Athlete, Guardian, MedicalInfo, AcademicInfo
from app.models.group import Group, GroupHistory
from app.models.relations import group_trainers, group_athletes
from app.models.attendance import Attendance
from app.models.payment import Payment
from app.models.trainer import TrainerProfile
from app.models.test import TestTemplate, TestResult, TestSession
from app.models.landing import ClubLandingPage
from app.models.training_plan import TrainingPlan, TrainingCycle, TrainingSession, TrainingExercise, TrainingPlanAssignment


def clean_prod_keep_demo():
    app = create_app()
    with app.app_context():
        print("🧹 Limpiando base de datos de producción...")
        print("=" * 60)
        print("⚠️  Se mantendrá el club: Fútbol Elite Academy")
        print("=" * 60)

        # Buscar el club de demo
        demo_club = Club.query.filter_by(name="Fútbol Elite Academy").first()
        
        if not demo_club:
            print("❌ No se encontró el club de demo. Abortando...")
            return

        print(f"\n✓ Club de demo encontrado: {demo_club.name} (ID: {demo_club.id})")
        
        # Obtener IDs de usuarios del club demo para preservar
        demo_user_ids = [u.id for u in User.query.filter_by(club_id=demo_club.id).all()]
        demo_user_ids.append(demo_club.id)  # Incluir el ID del club
        
        print(f"✓ Usuarios a preservar: {len(demo_user_ids)}")
        
        # ── Eliminar datos de OTROS clubes ─────────────────────────────────
        
        # 1. Resultados de tests de otros clubes (antes de eliminar templates)
        deleted = TestResult.query.filter(TestResult.session.has(TestSession.club_id != demo_club.id)).delete(synchronize_session=False)
        print(f"   ✓ {deleted} resultados de tests eliminados (otros clubes)")
        
        # 2. Sesiones de tests de otros clubes
        deleted = TestSession.query.filter(TestSession.club_id != demo_club.id).delete()
        print(f"   ✓ {deleted} sesiones de tests eliminadas (otros clubes)")
        
        # 3. Templates de tests que NO están en el club demo
        demo_template_ids = [r.template_id for r in TestResult.query.filter(
            TestResult.session.has(TestSession.club_id == demo_club.id)
        ).distinct()]
        
        deleted = TestTemplate.query.filter(~TestTemplate.id.in_(demo_template_ids)).delete(synchronize_session=False)
        print(f"   ✓ {deleted} templates de tests eliminados (otros clubes)")
        
        # 3. Planes de entrenamiento de otros clubes
        deleted = TrainingPlan.query.filter(TrainingPlan.club_id != demo_club.id).delete()
        print(f"   ✓ {deleted} planes de entrenamiento eliminados (otros clubes)")
        
        # Eliminar ciclos, sesiones y ejercicios de planes eliminados
        deleted = TrainingCycle.query.filter(~TrainingCycle.plan_id.in_(
            db.session.query(TrainingPlan.id).filter(TrainingPlan.club_id == demo_club.id)
        )).delete(synchronize_session=False)
        print(f"   ✓ {deleted} ciclos eliminados")
        
        deleted = TrainingSession.query.filter(~TrainingSession.cycle_id.in_(
            db.session.query(TrainingCycle.id)
        )).delete(synchronize_session=False)
        print(f"   ✓ {deleted} sesiones de entrenamiento eliminadas")
        
        deleted = TrainingExercise.query.filter(~TrainingExercise.session_id.in_(
            db.session.query(TrainingSession.id)
        )).delete(synchronize_session=False)
        print(f"   ✓ {deleted} ejercicios eliminados")
        
        deleted = TrainingPlanAssignment.query.filter(~TrainingPlanAssignment.plan_id.in_(
            db.session.query(TrainingPlan.id).filter(TrainingPlan.club_id == demo_club.id)
        )).delete(synchronize_session=False)
        print(f"   ✓ {deleted} asignaciones de planes eliminadas")
        
        # 4. Asistencias y pagos de otros clubes
        deleted = Attendance.query.filter(Attendance.athlete.has(Athlete.user.has(User.club_id != demo_club.id))).delete(synchronize_session=False)
        print(f"   ✓ {deleted} asistencias eliminadas (otros clubes)")
        
        deleted = Payment.query.filter(Payment.athlete.has(Athlete.user.has(User.club_id != demo_club.id))).delete(synchronize_session=False)
        print(f"   ✓ {deleted} pagos eliminados (otros clubes)")
        
        # 5. Historial de grupos y relaciones de otros clubes
        deleted = GroupHistory.query.filter(GroupHistory.athlete.has(Athlete.user.has(User.club_id != demo_club.id))).delete(synchronize_session=False)
        print(f"   ✓ {deleted} historiales eliminados (otros clubes)")
        
        # Limpiar tablas de asociación de otros clubes
        db.session.execute(group_trainers.delete().where(
            group_trainers.c.group_id.in_(
                db.session.query(Group.id).filter(Group.club_id != demo_club.id)
            )
        ))
        print("   ✓ Relaciones grupo-entrenador eliminadas (otros clubes)")
        
        db.session.execute(group_athletes.delete().where(
            group_athletes.c.group_id.in_(
                db.session.query(Group.id).filter(Group.club_id != demo_club.id)
            )
        ))
        print("   ✓ Relaciones grupo-atleta eliminadas (otros clubes)")
        
        # 6. Grupos y categorías de otros clubes
        deleted = Group.query.filter(Group.club_id != demo_club.id).delete()
        print(f"   ✓ {deleted} grupos eliminados (otros clubes)")
        
        deleted = Category.query.filter(Category.club_id != demo_club.id).delete()
        print(f"   ✓ {deleted} categorías eliminadas (otros clubes)")
        
        # 7. Atletas y perfiles de otros clubes
        deleted = Guardian.query.filter(Guardian.athlete.has(Athlete.user.has(User.club_id != demo_club.id))).delete(synchronize_session=False)
        print(f"   ✓ {deleted} acudientes eliminados (otros clubes)")
        
        deleted = MedicalInfo.query.filter(MedicalInfo.athlete.has(Athlete.user.has(User.club_id != demo_club.id))).delete(synchronize_session=False)
        print(f"   ✓ {deleted} registros médicos eliminados (otros clubes)")
        
        deleted = AcademicInfo.query.filter(AcademicInfo.athlete.has(Athlete.user.has(User.club_id != demo_club.id))).delete(synchronize_session=False)
        print(f"   ✓ {deleted} registros académicos eliminados (otros clubes)")
        
        deleted = Athlete.query.filter(Athlete.user.has(User.club_id != demo_club.id)).delete(synchronize_session=False)
        print(f"   ✓ {deleted} atletas eliminados (otros clubes)")
        
        deleted = TrainerProfile.query.filter(TrainerProfile.user.has(User.club_id != demo_club.id)).delete(synchronize_session=False)
        print(f"   ✓ {deleted} perfiles de entrenador eliminados (otros clubes)")
        
        # 8. Usuarios de otros clubes (excepto super admin)
        deleted = User.query.filter(User.club_id != demo_club.id, User.role != 'SUPER_ADMIN').delete(synchronize_session=False)
        print(f"   ✓ {deleted} usuarios eliminados (otros clubes)")
        
        # 9. Landing pages de otros clubes
        deleted = ClubLandingPage.query.filter(ClubLandingPage.club_id != demo_club.id).delete()
        print(f"   ✓ {deleted} landing pages eliminadas (otros clubes)")
        
        # 10. Clubes (excepto el de demo)
        deleted = Club.query.filter(Club.id != demo_club.id).delete()
        print(f"   ✓ {deleted} clubes eliminados")
        
        # Commit de todos los cambios
        db.session.commit()

        print("\n" + "=" * 60)
        print("✅ LIMPIEZA COMPLETADA")
        print("=" * 60)
        
        # Mostrar estadísticas finales
        print("\n📊 Estado actual de la base de datos:")
        print(f"   Clubes: {Club.query.count()}")
        print(f"   Usuarios: {User.query.count()}")
        print(f"   Atletas: {Athlete.query.count()}")
        print(f"   Grupos: {Group.query.count()}")
        print(f"   Categorías: {Category.query.count()}")
        print(f"   Pagos: {Payment.query.count()}")
        print(f"   Asistencias: {Attendance.query.count()}")
        print(f"   Planes de entrenamiento: {TrainingPlan.query.count()}")
        print(f"   Tests: {TestTemplate.query.count()}")
        
        print("\n✅ Solo se mantiene el club de DEMO:")
        demo_club = Club.query.filter_by(name="Fútbol Elite Academy").first()
        if demo_club:
            print(f"   - {demo_club.name}")
            print(f"   - {User.query.filter_by(club_id=demo_club.id).count()} usuarios")
            print(f"   - {Athlete.query.filter(Athlete.user.has(club_id=demo_club.id)).count()} atletas")


if __name__ == "__main__":
    clean_prod_keep_demo()
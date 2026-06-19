from app.extensions import db
from app.models.training_plan import TrainingPlan, TrainingCycle, TrainingSession, TrainingExercise, TrainingPlanAssignment
from app.models.athlete import Athlete
from datetime import date

class TrainingPlanService:

    @staticmethod
    def get_plans(club_id, include_inactive=False):
        query = TrainingPlan.query.filter_by(club_id=club_id)
        if not include_inactive:
            query = query.filter_by(is_active=True)
        return query.order_by(TrainingPlan.created_at.desc()).all()

    @staticmethod
    def get_plan(plan_id):
        return TrainingPlan.query.get(plan_id)

    @staticmethod
    def create_plan(data, user_id, club_id):
        plan = TrainingPlan(
            name=data["name"],
            description=data.get("description", ""),
            club_id=club_id,
            created_by=user_id
        )
        db.session.add(plan)
        db.session.flush()

        for c_idx, cycle_data in enumerate(data.get("cycles", [])):
            cycle = TrainingCycle(
                plan_id=plan.id,
                name=cycle_data["name"],
                description=cycle_data.get("description", ""),
                order=cycle_data.get("order", c_idx + 1)
            )
            db.session.add(cycle)
            db.session.flush()

            for s_idx, session_data in enumerate(cycle_data.get("sessions", [])):
                session = TrainingSession(
                    cycle_id=cycle.id,
                    name=session_data["name"],
                    notes=session_data.get("notes", ""),
                    order=session_data.get("order", s_idx + 1)
                )
                db.session.add(session)
                db.session.flush()

                for e_idx, exercise_data in enumerate(session_data.get("exercises", [])):
                    exercise = TrainingExercise(
                        session_id=session.id,
                        exercise_name=exercise_data["exercise_name"],
                        sets=exercise_data.get("sets", 1),
                        reps=exercise_data.get("reps", ""),
                        weight=exercise_data.get("weight", ""),
                        duration_seconds=exercise_data.get("duration_seconds"),
                        rest_seconds=exercise_data.get("rest_seconds"),
                        notes=exercise_data.get("notes", ""),
                        order=exercise_data.get("order", e_idx + 1)
                    )
                    db.session.add(exercise)

        db.session.commit()
        return plan

    @staticmethod
    def update_plan(plan_id, data):
        plan = TrainingPlan.query.get(plan_id)
        if not plan:
            return None

        plan.name = data.get("name", plan.name)
        plan.description = data.get("description", plan.description)

        if "cycles" in data:
            # Delete old cycles and recreate them
            # (Simplifies hierarchical updates)
            for cycle in plan.cycles:
                db.session.delete(cycle)
            db.session.flush()

            for c_idx, cycle_data in enumerate(data["cycles"]):
                cycle = TrainingCycle(
                    plan_id=plan.id,
                    name=cycle_data["name"],
                    description=cycle_data.get("description", ""),
                    order=cycle_data.get("order", c_idx + 1)
                )
                db.session.add(cycle)
                db.session.flush()

                for s_idx, session_data in enumerate(cycle_data.get("sessions", [])):
                    session = TrainingSession(
                        cycle_id=cycle.id,
                        name=session_data["name"],
                        notes=session_data.get("notes", ""),
                        order=session_data.get("order", s_idx + 1)
                    )
                    db.session.add(session)
                    db.session.flush()

                    for e_idx, exercise_data in enumerate(session_data.get("exercises", [])):
                        exercise = TrainingExercise(
                            session_id=session.id,
                            exercise_name=exercise_data["exercise_name"],
                            sets=exercise_data.get("sets", 1),
                            reps=exercise_data.get("reps", ""),
                            weight=exercise_data.get("weight", ""),
                            duration_seconds=exercise_data.get("duration_seconds"),
                            rest_seconds=exercise_data.get("rest_seconds"),
                            notes=exercise_data.get("notes", ""),
                            order=exercise_data.get("order", e_idx + 1)
                        )
                        db.session.add(exercise)

        db.session.commit()
        return plan

    @staticmethod
    def deactivate_plan(plan_id):
        plan = TrainingPlan.query.get(plan_id)
        if not plan:
            return False
        plan.is_active = False
        db.session.commit()
        return True
    
    @staticmethod
    def reactivate_plan(plan_id):
        plan = TrainingPlan.query.get(plan_id)
        if not plan:
            return False
        plan.is_active = True
        db.session.commit()
        return True

    @staticmethod
    def assign_plan(plan_id, data):
        assignment = TrainingPlanAssignment(
            plan_id=plan_id,
            group_id=data.get("group_id"),
            athlete_id=data.get("athlete_id"),
            start_date=data["start_date"],
            end_date=data["end_date"],
            status=data.get("status", "ACTIVE")
        )
        db.session.add(assignment)
        db.session.commit()
        return assignment

    @staticmethod
    def get_athlete_assignments(athlete_id):
        athlete = Athlete.query.get(athlete_id)
        if not athlete:
            return []
        
        group_ids = [group.id for group in athlete.current_groups] if athlete.current_groups else []

        query = TrainingPlanAssignment.query.filter(
            db.or_(
                TrainingPlanAssignment.athlete_id == athlete_id,
                TrainingPlanAssignment.group_id.in_(group_ids) if group_ids else False
            )
        )
        return query.order_by(TrainingPlanAssignment.start_date.desc()).all()

    @staticmethod
    def delete_assignment(assignment_id):
        assignment = TrainingPlanAssignment.query.get(assignment_id)
        if not assignment:
            return False
        db.session.delete(assignment)
        db.session.commit()
        return True

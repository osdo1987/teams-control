from app.extensions import ma
from app.models.training_plan import TrainingPlan, TrainingCycle, TrainingSession, TrainingExercise, TrainingPlanAssignment

class TrainingExerciseSchema(ma.SQLAlchemyAutoSchema):
    class Meta:
        model = TrainingExercise
        load_instance = True
        include_relationships = True
        fields = ('id', 'session_id', 'exercise_name', 'sets', 'reps', 'weight',
                  'duration_seconds', 'rest_seconds', 'notes', 'order')


class TrainingSessionSchema(ma.SQLAlchemyAutoSchema):
    class Meta:
        model = TrainingSession
        load_instance = True
        include_relationships = True
        fields = ('id', 'cycle_id', 'name', 'notes', 'order', 'exercises')

    exercises = ma.Nested(TrainingExerciseSchema, many=True)


class TrainingCycleSchema(ma.SQLAlchemyAutoSchema):
    class Meta:
        model = TrainingCycle
        load_instance = True
        include_relationships = True
        fields = ('id', 'plan_id', 'name', 'description', 'order', 'sessions')

    sessions = ma.Nested(TrainingSessionSchema, many=True)


class TrainingPlanSchema(ma.SQLAlchemyAutoSchema):
    class Meta:
        model = TrainingPlan
        load_instance = True
        include_relationships = True
        fields = ('id', 'name', 'description', 'club_id', 'created_by', 'created_at', 'updated_at', 'cycles', 'trainer_name')

    cycles = ma.Nested(TrainingCycleSchema, many=True)
    trainer_name = ma.Method("get_trainer_name")

    def get_trainer_name(self, obj):
        from app.models.user import User
        trainer = User.query.get(obj.created_by)
        if trainer:
            return f"{trainer.first_name} {trainer.last_name}"
        return None


class TrainingPlanAssignmentSchema(ma.SQLAlchemyAutoSchema):
    class Meta:
        model = TrainingPlanAssignment
        load_instance = True
        include_relationships = True
        fields = ('id', 'plan_id', 'group_id', 'athlete_id', 'start_date', 'end_date',
                  'status', 'assigned_at', 'plan_name', 'group_name', 'athlete_name')

    plan_name = ma.Method("get_plan_name")
    group_name = ma.Method("get_group_name")
    athlete_name = ma.Method("get_athlete_name")

    def get_plan_name(self, obj):
        return obj.plan.name if obj.plan else None

    def get_group_name(self, obj):
        from app.models.group import Group
        if obj.group_id:
            group = Group.query.get(obj.group_id)
            return group.name if group else None
        return None

    def get_athlete_name(self, obj):
        from app.models.athlete import Athlete
        if obj.athlete_id:
            athlete = Athlete.query.get(obj.athlete_id)
            if athlete and athlete.user:
                return f"{athlete.user.first_name} {athlete.user.last_name}"
        return None

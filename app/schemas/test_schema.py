from app.extensions import ma
from app.models.test import TestTemplate, TestResult, TestSession

class TestTemplateSchema(ma.SQLAlchemyAutoSchema):
    class Meta:
        model = TestTemplate
        load_instance = True
        include_relationships = True
        fields = ('id', 'name', 'description', 'category', 'unit', 'higher_is_better',
                  'club_id', 'created_by', 'is_predefined', 'created_at', 'updated_at')

class TestResultSchema(ma.SQLAlchemyAutoSchema):
    class Meta:
        model = TestResult
        load_instance = True
        include_relationships = True
        fields = ('id', 'template_id', 'athlete_id', 'trainer_id', 'value',
                  'notes', 'test_date', 'created_at', 'template_name', 'athlete_name', 'trainer_name')

    template_name = ma.Method("get_template_name")
    athlete_name = ma.Method("get_athlete_name")
    trainer_name = ma.Method("get_trainer_name")

    def get_template_name(self, obj):
        return obj.template.name if obj.template else None

    def get_athlete_name(self, obj):
        if obj.athlete and obj.athlete.user:
            return f"{obj.athlete.user.first_name} {obj.athlete.user.last_name}"
        return None

    def get_trainer_name(self, obj):
        if obj.trainer:
            return f"{obj.trainer.first_name} {obj.trainer.last_name}"
        return None


class TestSessionSchema(ma.SQLAlchemyAutoSchema):
    class Meta:
        model = TestSession
        load_instance = True
        include_relationships = True
        fields = ('id', 'name', 'club_id', 'trainer_id', 'session_date', 'notes', 'created_at', 'trainer_name', 'results')

    trainer_name = ma.Method("get_trainer_name")
    results = ma.Nested(TestResultSchema, many=True)

    def get_trainer_name(self, obj):
        if obj.trainer:
            return f"{obj.trainer.first_name} {obj.trainer.last_name}"
        return None

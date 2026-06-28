from app.extensions import ma
from app.models.athlete import Athlete, Guardian, MedicalInfo, AcademicInfo
from app.models.user import User
from marshmallow import fields
from app.schemas.user_schema import UserSchema as BaseUserSchema

class UserSchema(BaseUserSchema):
    """Schema simplificado de usuario para atletas (sin trainer_profile)"""
    class Meta(BaseUserSchema.Meta):
        exclude = ('password_hash', 'trainer_profile')
        load_instance = True

class GuardianSchema(ma.SQLAlchemyAutoSchema):
    class Meta:
        model = Guardian
        load_instance = True

class MedicalInfoSchema(ma.SQLAlchemyAutoSchema):
    class Meta:
        model = MedicalInfo
        load_instance = True

class AcademicInfoSchema(ma.SQLAlchemyAutoSchema):
    class Meta:
        model = AcademicInfo
        load_instance = True

class AthleteSchema(ma.SQLAlchemyAutoSchema):
    class Meta:
        model = Athlete
        load_instance = True
        include_fk = True

    guardians = fields.List(fields.Nested(GuardianSchema))
    medical_info = fields.Nested(MedicalInfoSchema)
    academic_info = fields.Nested(AcademicInfoSchema)
    
    # Incluir información completa del usuario
    user = fields.Nested(UserSchema)
    current_groups = fields.List(fields.Nested("GroupSchema", only=("id", "name", "monthly_fee", "schedule", "training_location")))
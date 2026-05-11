from app.extensions import ma
from app.models.athlete import Athlete, Guardian, MedicalInfo, AcademicInfo
from marshmallow import fields

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
    
    # We might want to include basic user info
    user = fields.Nested("UserSchema")
    current_groups = fields.List(fields.Nested("GroupSchema", only=("id", "name", "monthly_fee")))

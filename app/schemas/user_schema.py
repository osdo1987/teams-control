from app.extensions import ma
from app.models.user import User
from app.models.trainer import TrainerProfile
from marshmallow import fields

class TrainerProfileSchema(ma.SQLAlchemyAutoSchema):
    class Meta:
        model = TrainerProfile
        load_instance = True
        include_fk = True

class UserSchema(ma.SQLAlchemyAutoSchema):
    class Meta:
        model = User
        load_instance = True
        include_fk = True
        exclude = ("password_hash",)

    # Custom fields if needed
    password = fields.String(load_only=True)
    trainer_profile = fields.Nested(TrainerProfileSchema, dump_only=True)

class LoginSchema(ma.Schema):
    identification_number = fields.String(required=True)
    password = fields.String(required=True)

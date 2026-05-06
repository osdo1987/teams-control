from app.extensions import ma
from app.models.user import User
from marshmallow import fields

class UserSchema(ma.SQLAlchemyAutoSchema):
    class Meta:
        model = User
        load_instance = True
        include_fk = True
        exclude = ("password_hash",)

    # Custom fields if needed
    password = fields.String(load_only=True)

class LoginSchema(ma.Schema):
    email = fields.Email(required=True)
    password = fields.String(required=True)

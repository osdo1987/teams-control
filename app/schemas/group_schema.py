from app.extensions import ma
from app.models.group import Group
from marshmallow import fields

class GroupSchema(ma.SQLAlchemyAutoSchema):
    class Meta:
        model = Group
        load_instance = True
        include_fk = True

    trainers = fields.List(fields.Nested("UserSchema", only=("id", "identification_number", "first_name", "last_name", "phone")))
    athletes_count = fields.Method("get_athletes_count")

    def get_athletes_count(self, obj):
        return len(obj.athletes)

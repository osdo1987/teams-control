from app.extensions import ma
from app.models.group import Group, GroupHistory
from marshmallow import fields

class GroupHistorySchema(ma.SQLAlchemyAutoSchema):
    class Meta:
        model = GroupHistory
        load_instance = True
        include_fk = True
    
    group_name = fields.Method("get_group_name")

    def get_group_name(self, obj):
        return obj.group.name if obj.group else "Desconocido"

class GroupSchema(ma.SQLAlchemyAutoSchema):
    class Meta:
        model = Group
        load_instance = True
        include_fk = True

    trainers = fields.List(fields.Nested("UserSchema", only=("id", "identification_number", "first_name", "last_name", "phone")))
    category_obj = fields.Nested("CategorySchema", only=("id", "name"))
    athletes_count = fields.Method("get_athletes_count")

    def get_athletes_count(self, obj):
        return len(obj.athletes)

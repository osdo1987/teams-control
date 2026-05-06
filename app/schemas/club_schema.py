from app.extensions import ma
from app.models.club import Club

class ClubSchema(ma.SQLAlchemyAutoSchema):
    class Meta:
        model = Club
        include_fk = True
        load_instance = True

from app.extensions import ma
from app.models.club import Club

class ClubSchema(ma.SQLAlchemyAutoSchema):
    class Meta:
        model = Club
        include_fk = True
        load_instance = True

class ClubPublicSchema(ma.SQLAlchemyAutoSchema):
    """Schema for public club info (no sensitive data)"""
    class Meta:
        model = Club
        include_fk = True
        load_instance = True
        fields = ('id', 'name', 'slug', 'description', 'sport', 'primary_color', 'logo_url', 'welcome_message', 'show_features')

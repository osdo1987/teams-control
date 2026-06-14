from app.extensions import db
from datetime import datetime

class ClubLandingPage(db.Model):
    __tablename__ = 'club_landing_pages'

    id = db.Column(db.Integer, primary_key=True)
    club_id = db.Column(db.Integer, db.ForeignKey('clubs.id'), unique=True, nullable=False)

    # Hero / Banner section
    hero_title = db.Column(db.String(200), nullable=True, default='Bienvenido a nuestro club')
    hero_subtitle = db.Column(db.String(300), nullable=True)
    banner_url = db.Column(db.Text, nullable=True)
    cta_text = db.Column(db.String(100), nullable=True, default='Ingresar')
    cta_link = db.Column(db.String(200), nullable=True, default='#login')

    # About section
    about_title = db.Column(db.String(200), nullable=True, default='Sobre nosotros')
    about_text = db.Column(db.Text, nullable=True)
    about_image_url = db.Column(db.Text, nullable=True)

    # Features / Services
    features_title = db.Column(db.String(200), nullable=True, default='Nuestros servicios')
    features = db.Column(db.JSON, nullable=True)  # Array of {icon, title, description}

    # Gallery
    gallery_title = db.Column(db.String(200), nullable=True, default='Galería')
    gallery_images = db.Column(db.JSON, nullable=True)  # Array of {url, caption}

    # Contact info
    contact_email = db.Column(db.String(120), nullable=True)
    contact_phone = db.Column(db.String(30), nullable=True)
    address = db.Column(db.String(300), nullable=True)

    # Social media
    social_facebook = db.Column(db.String(300), nullable=True)
    social_instagram = db.Column(db.String(300), nullable=True)
    social_whatsapp = db.Column(db.String(300), nullable=True)
    social_twitter = db.Column(db.String(300), nullable=True)
    social_youtube = db.Column(db.String(300), nullable=True)

    # Layout / visibility settings
    show_login_in_hero = db.Column(db.Boolean, default=True)
    show_about = db.Column(db.Boolean, default=True)
    show_features = db.Column(db.Boolean, default=True)
    show_gallery = db.Column(db.Boolean, default=True)
    show_contact = db.Column(db.Boolean, default=True)
    show_footer_social = db.Column(db.Boolean, default=True)

    # Custom footer
    footer_text = db.Column(db.String(500), nullable=True)

    # Timestamps
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationship
    club = db.relationship('Club', backref=db.backref('landing_page', uselist=False))

    def __repr__(self):
        return f'<ClubLandingPage for Club {self.club_id}>'
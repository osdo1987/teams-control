from app.models.landing import ClubLandingPage
from app.models.club import Club
from app.extensions import db

class LandingService:

    @staticmethod
    def get_public_by_club_slug(club_slug):
        """Get public landing page data for a club by its slug."""
        club = Club.query.filter_by(slug=club_slug).first()
        if not club:
            return None

        landing = ClubLandingPage.query.filter_by(club_id=club.id).first()
        if not landing:
            # Return default club info if no landing page configured
            return {
                'club': {
                    'id': club.id,
                    'name': club.name,
                    'slug': club.slug,
                    'description': club.description,
                    'sport': club.sport,
                    'primary_color': club.primary_color,
                    'logo_url': club.logo_url,
                    'welcome_message': club.welcome_message,
                },
                'landing': None
            }

        return {
            'club': {
                'id': club.id,
                'name': club.name,
                'slug': club.slug,
                'description': club.description,
                'sport': club.sport,
                'primary_color': club.primary_color,
                'logo_url': club.logo_url,
                'welcome_message': club.welcome_message,
            },
            'landing': {
                'hero_title': landing.hero_title,
                'hero_subtitle': landing.hero_subtitle,
                'banner_url': landing.banner_url,
                'cta_text': landing.cta_text,
                'cta_link': landing.cta_link,
                'about_title': landing.about_title,
                'about_text': landing.about_text,
                'about_image_url': landing.about_image_url,
                'features_title': landing.features_title,
                'features': landing.features,
                'gallery_title': landing.gallery_title,
                'gallery_images': landing.gallery_images,
                'contact_email': landing.contact_email,
                'contact_phone': landing.contact_phone,
                'address': landing.address,
                'social_facebook': landing.social_facebook,
                'social_instagram': landing.social_instagram,
                'social_whatsapp': landing.social_whatsapp,
                'social_twitter': landing.social_twitter,
                'social_youtube': landing.social_youtube,
                'show_login_in_hero': landing.show_login_in_hero,
                'show_about': landing.show_about,
                'show_features': landing.show_features,
                'show_gallery': landing.show_gallery,
                'show_contact': landing.show_contact,
                'show_footer_social': landing.show_footer_social,
                'show_registration': landing.show_registration,
                'footer_text': landing.footer_text,
            }
        }

    @staticmethod
    def get_by_club_id(club_id):
        """Get landing page for a specific club (for admin editing)."""
        landing = ClubLandingPage.query.filter_by(club_id=club_id).first()
        if not landing:
            return None
        return landing

    @staticmethod
    def create_or_update(club_id, data):
        """Create or update landing page for a club."""
        landing = ClubLandingPage.query.filter_by(club_id=club_id).first()

        if not landing:
            landing = ClubLandingPage(club_id=club_id)
            db.session.add(landing)

        # Hero
        if 'hero_title' in data:
            landing.hero_title = data['hero_title']
        if 'hero_subtitle' in data:
            landing.hero_subtitle = data['hero_subtitle']
        if 'banner_url' in data:
            landing.banner_url = data['banner_url']
        if 'cta_text' in data:
            landing.cta_text = data['cta_text']
        if 'cta_link' in data:
            landing.cta_link = data['cta_link']

        # About
        if 'about_title' in data:
            landing.about_title = data['about_title']
        if 'about_text' in data:
            landing.about_text = data['about_text']
        if 'about_image_url' in data:
            landing.about_image_url = data['about_image_url']

        # Features
        if 'features_title' in data:
            landing.features_title = data['features_title']
        if 'features' in data:
            landing.features = data['features']

        # Gallery
        if 'gallery_title' in data:
            landing.gallery_title = data['gallery_title']
        if 'gallery_images' in data:
            landing.gallery_images = data['gallery_images']

        # Contact
        if 'contact_email' in data:
            landing.contact_email = data['contact_email']
        if 'contact_phone' in data:
            landing.contact_phone = data['contact_phone']
        if 'address' in data:
            landing.address = data['address']

        # Social
        if 'social_facebook' in data:
            landing.social_facebook = data['social_facebook']
        if 'social_instagram' in data:
            landing.social_instagram = data['social_instagram']
        if 'social_whatsapp' in data:
            landing.social_whatsapp = data['social_whatsapp']
        if 'social_twitter' in data:
            landing.social_twitter = data['social_twitter']
        if 'social_youtube' in data:
            landing.social_youtube = data['social_youtube']

        # Visibility toggles
        if 'show_login_in_hero' in data:
            landing.show_login_in_hero = data['show_login_in_hero']
        if 'show_about' in data:
            landing.show_about = data['show_about']
        if 'show_features' in data:
            landing.show_features = data['show_features']
        if 'show_gallery' in data:
            landing.show_gallery = data['show_gallery']
        if 'show_contact' in data:
            landing.show_contact = data['show_contact']
        if 'show_footer_social' in data:
            landing.show_footer_social = data['show_footer_social']
        if 'show_registration' in data:
            landing.show_registration = data['show_registration']

        # Footer
        if 'footer_text' in data:
            landing.footer_text = data['footer_text']

        db.session.commit()
        return landing

    @staticmethod
    def delete(club_id):
        """Delete landing page for a club."""
        landing = ClubLandingPage.query.filter_by(club_id=club_id).first()
        if landing:
            db.session.delete(landing)
            db.session.commit()
            return True
        return False
"""Add club_landing_pages table

Revision ID: c1c000000002
Revises: b1c000000001
Create Date: 2026-06-14 12:00:00.000000

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = 'c1c000000002'
down_revision = 'b1c000000001'
branch_labels = None
depends_on = None


def upgrade():
    op.create_table('club_landing_pages',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('club_id', sa.Integer(), nullable=False),
        sa.Column('hero_title', sa.String(length=200), nullable=True),
        sa.Column('hero_subtitle', sa.String(length=300), nullable=True),
        sa.Column('banner_url', sa.Text(), nullable=True),
        sa.Column('cta_text', sa.String(length=100), nullable=True),
        sa.Column('cta_link', sa.String(length=200), nullable=True),
        sa.Column('about_title', sa.String(length=200), nullable=True),
        sa.Column('about_text', sa.Text(), nullable=True),
        sa.Column('about_image_url', sa.Text(), nullable=True),
        sa.Column('features_title', sa.String(length=200), nullable=True),
        sa.Column('features', sa.JSON(), nullable=True),
        sa.Column('gallery_title', sa.String(length=200), nullable=True),
        sa.Column('gallery_images', sa.JSON(), nullable=True),
        sa.Column('contact_email', sa.String(length=120), nullable=True),
        sa.Column('contact_phone', sa.String(length=30), nullable=True),
        sa.Column('address', sa.String(length=300), nullable=True),
        sa.Column('social_facebook', sa.String(length=300), nullable=True),
        sa.Column('social_instagram', sa.String(length=300), nullable=True),
        sa.Column('social_whatsapp', sa.String(length=300), nullable=True),
        sa.Column('social_twitter', sa.String(length=300), nullable=True),
        sa.Column('social_youtube', sa.String(length=300), nullable=True),
        sa.Column('show_login_in_hero', sa.Boolean(), nullable=True, default=True),
        sa.Column('show_about', sa.Boolean(), nullable=True, default=True),
        sa.Column('show_features', sa.Boolean(), nullable=True, default=True),
        sa.Column('show_gallery', sa.Boolean(), nullable=True, default=True),
        sa.Column('show_contact', sa.Boolean(), nullable=True, default=True),
        sa.Column('show_footer_social', sa.Boolean(), nullable=True, default=True),
        sa.Column('footer_text', sa.String(length=500), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=True),
        sa.Column('updated_at', sa.DateTime(), nullable=True),
        sa.ForeignKeyConstraint(['club_id'], ['clubs.id'], ),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('club_id')
    )


def downgrade():
    op.drop_table('club_landing_pages')
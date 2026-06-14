"""Add slug and customization fields to clubs

Revision ID: b1c000000001
Revises: a1b000000000
Create Date: 2026-06-13 22:05:00.000000

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = 'b1c000000001'
down_revision = 'a1b000000000'
branch_labels = None
depends_on = None


def upgrade():
    op.add_column('clubs', sa.Column('slug', sa.String(100), nullable=True, unique=True))
    op.add_column('clubs', sa.Column('primary_color', sa.String(7), server_default='#6366f1'))
    op.add_column('clubs', sa.Column('logo_url', sa.Text(), nullable=True))
    op.add_column('clubs', sa.Column('welcome_message', sa.String(200), nullable=True))
    op.add_column('clubs', sa.Column('show_features', sa.Boolean(), server_default='true'))


def downgrade():
    op.drop_column('clubs', 'show_features')
    op.drop_column('clubs', 'welcome_message')
    op.drop_column('clubs', 'logo_url')
    op.drop_column('clubs', 'primary_color')
    op.drop_column('clubs', 'slug')
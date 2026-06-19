"""Add is_active columns for soft delete

Revision ID: f1c000000005
Revises: e1c000000004
Create Date: 2026-06-18 16:40:00.000000

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = 'f1c000000005'
down_revision = 'e1c000000004'
branch_labels = None
depends_on = None


def upgrade():
    # Add is_active to clubs
    op.add_column('clubs', sa.Column('is_active', sa.Boolean(), nullable=True))
    op.execute("UPDATE clubs SET is_active = TRUE")
    op.alter_column('clubs', 'is_active', nullable=False)

    # Add is_active to categories
    op.add_column('categories', sa.Column('is_active', sa.Boolean(), nullable=True))
    op.execute("UPDATE categories SET is_active = TRUE")
    op.alter_column('categories', 'is_active', nullable=False)

    # Add is_active to athletes
    op.add_column('athletes', sa.Column('is_active', sa.Boolean(), nullable=True))
    op.execute("UPDATE athletes SET is_active = TRUE")
    op.alter_column('athletes', 'is_active', nullable=False)

    # Add is_active to training_plans
    op.add_column('training_plans', sa.Column('is_active', sa.Boolean(), nullable=True))
    op.execute("UPDATE training_plans SET is_active = TRUE")
    op.alter_column('training_plans', 'is_active', nullable=False)

    # Add is_active to club_landing_pages
    op.add_column('club_landing_pages', sa.Column('is_active', sa.Boolean(), nullable=True))
    op.execute("UPDATE club_landing_pages SET is_active = TRUE")
    op.alter_column('club_landing_pages', 'is_active', nullable=False)


def downgrade():
    op.drop_column('club_landing_pages', 'is_active')
    op.drop_column('training_plans', 'is_active')
    op.drop_column('athletes', 'is_active')
    op.drop_column('categories', 'is_active')
    op.drop_column('clubs', 'is_active')
"""Add photo_url column to athletes table

Revision ID: d1c000000003
Revises: c1c000000002
Create Date: 2026-06-15 15:36:00.000000

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = 'd1c000000003'
down_revision = 'c1c000000002'
branch_labels = None
depends_on = None


def upgrade():
    op.add_column('athletes', sa.Column('photo_url', sa.Text(), nullable=True))


def downgrade():
    op.drop_column('athletes', 'photo_url')
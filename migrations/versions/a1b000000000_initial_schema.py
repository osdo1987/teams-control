"""Initial schema - create all tables

Revision ID: a1b000000000
Revises: 
Create Date: 2026-06-13 22:00:00.000000

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = 'a1b000000000'
down_revision = None
branch_labels = None
depends_on = None


def upgrade():
    # This migration represents the initial state of the database.
    # Tables are created via seed.py with db.create_all().
    # This file serves as the base revision for future migrations.
    pass


def downgrade():
    pass
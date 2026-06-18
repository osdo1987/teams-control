"""add schedule_blocks to groups

Revision ID: e1c000000004
Revises: d1c000000003_add_athlete_photo_url
Create Date: 2026-06-17 23:50:00.000000
"""
from alembic import op
import sqlalchemy as sa

revision = 'e1c000000004'
down_revision = 'be524718d0a8'
branch_labels = None
depends_on = None

def upgrade():
    op.add_column('groups', sa.Column('schedule_blocks', sa.Text(), nullable=True))

def downgrade():
    op.drop_column('groups', 'schedule_blocks')
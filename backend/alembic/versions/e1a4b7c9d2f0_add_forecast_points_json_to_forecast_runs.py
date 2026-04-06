"""add forecast_points_json to forecast_runs

Revision ID: e1a4b7c9d2f0
Revises: d9b2f8a1c3e4
Create Date: 2026-04-06 14:05:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = "e1a4b7c9d2f0"
down_revision: Union[str, None] = "d9b2f8a1c3e4"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    with op.batch_alter_table("forecast_runs", schema=None) as batch_op:
        batch_op.add_column(sa.Column("forecast_points_json", sa.Text(), nullable=True))


def downgrade() -> None:
    with op.batch_alter_table("forecast_runs", schema=None) as batch_op:
        batch_op.drop_column("forecast_points_json")

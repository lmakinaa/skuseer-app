"""add product_import_jobs table

Revision ID: d9b2f8a1c3e4
Revises: b4e1a2c3d5f6
Create Date: 2026-04-06 13:40:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = "d9b2f8a1c3e4"
down_revision: Union[str, None] = "b4e1a2c3d5f6"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "product_import_jobs",
        sa.Column("id", sa.Integer(), autoincrement=True, nullable=False),
        sa.Column("tenant_id", sa.String(), nullable=False),
        sa.Column("filename", sa.String(), nullable=False),
        sa.Column("items_count", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("status", sa.String(), nullable=False, server_default="completed"),
        sa.Column("created_at", sa.DateTime(), nullable=False, server_default=sa.text("(CURRENT_TIMESTAMP)")),
        sa.ForeignKeyConstraint(["tenant_id"], ["tenants.id"]),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(op.f("ix_product_import_jobs_tenant_id"), "product_import_jobs", ["tenant_id"])


def downgrade() -> None:
    op.drop_index(op.f("ix_product_import_jobs_tenant_id"), table_name="product_import_jobs")
    op.drop_table("product_import_jobs")

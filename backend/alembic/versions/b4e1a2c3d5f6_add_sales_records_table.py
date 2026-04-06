"""add sales_records table

Revision ID: b4e1a2c3d5f6
Revises: 7fa83e36b417
Create Date: 2026-04-06 12:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = "b4e1a2c3d5f6"
down_revision: Union[str, None] = "7fa83e36b417"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "sales_records",
        sa.Column("id", sa.Integer(), autoincrement=True, nullable=False),
        sa.Column("tenant_id", sa.String(), nullable=False),
        sa.Column("product_id", sa.String(), nullable=False),
        sa.Column("date", sa.Date(), nullable=False),
        sa.Column("quantity", sa.Integer(), nullable=False),
        sa.ForeignKeyConstraint(["tenant_id"], ["tenants.id"]),
        sa.ForeignKeyConstraint(["product_id"], ["products.id"]),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint(
            "tenant_id", "product_id", "date",
            name="uq_sales_tenant_product_date",
        ),
    )
    op.create_index(op.f("ix_sales_records_tenant_id"), "sales_records", ["tenant_id"])
    op.create_index(op.f("ix_sales_records_product_id"), "sales_records", ["product_id"])


def downgrade() -> None:
    op.drop_index(op.f("ix_sales_records_product_id"), table_name="sales_records")
    op.drop_index(op.f("ix_sales_records_tenant_id"), table_name="sales_records")
    op.drop_table("sales_records")

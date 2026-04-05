"""add category id pk and subcategories table

Revision ID: 7fa83e36b417
Revises: cfe6f70003f2
Create Date: 2026-04-04 19:25:12.963586

"""
from typing import Sequence, Union
import uuid

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '7fa83e36b417'
down_revision: Union[str, None] = 'cfe6f70003f2'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # SQLite doesn't support ALTER PK. Use batch mode to recreate the table.
    # First, read existing data
    conn = op.get_bind()
    existing = conn.execute(sa.text("SELECT name, tenant_id, products, accuracy, trend FROM categories")).fetchall()

    # Drop old table and recreate with new schema
    op.drop_table("categories")
    op.create_table(
        "categories",
        sa.Column("id", sa.String(), nullable=False),
        sa.Column("tenant_id", sa.String(), sa.ForeignKey("tenants.id"), nullable=True),
        sa.Column("name", sa.String(), nullable=False),
        sa.Column("products", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("accuracy", sa.Float(), nullable=False, server_default="0"),
        sa.Column("trend", sa.String(), nullable=False, server_default="stable"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_categories_tenant_id", "categories", ["tenant_id"])

    # Re-insert existing data with generated UUIDs
    for row in existing:
        conn.execute(
            sa.text("INSERT INTO categories (id, tenant_id, name, products, accuracy, trend) VALUES (:id, :tid, :name, :products, :accuracy, :trend)"),
            {"id": str(uuid.uuid4()), "tid": row[1], "name": row[0], "products": row[2], "accuracy": row[3], "trend": row[4]},
        )

    # Create subcategories table
    op.create_table(
        "subcategories",
        sa.Column("id", sa.String(), nullable=False),
        sa.Column("category_id", sa.String(), nullable=False),
        sa.Column("name", sa.String(), nullable=False),
        sa.ForeignKeyConstraint(["category_id"], ["categories.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_subcategories_category_id", "subcategories", ["category_id"])


def downgrade() -> None:
    op.drop_index("ix_subcategories_category_id", table_name="subcategories")
    op.drop_table("subcategories")

    # Revert categories to name-as-PK
    conn = op.get_bind()
    existing = conn.execute(sa.text("SELECT name, tenant_id, products, accuracy, trend FROM categories")).fetchall()

    op.drop_table("categories")
    op.create_table(
        "categories",
        sa.Column("name", sa.String(), nullable=False),
        sa.Column("tenant_id", sa.String(), sa.ForeignKey("tenants.id"), nullable=True),
        sa.Column("products", sa.Integer(), nullable=False),
        sa.Column("accuracy", sa.Float(), nullable=False),
        sa.Column("trend", sa.String(), nullable=False),
        sa.PrimaryKeyConstraint("name"),
    )
    for row in existing:
        conn.execute(
            sa.text("INSERT INTO categories (name, tenant_id, products, accuracy, trend) VALUES (:name, :tid, :products, :accuracy, :trend)"),
            {"name": row[0], "tid": row[1], "products": row[2], "accuracy": row[3], "trend": row[4]},
        )

"""add faq section

Revision ID: 20260416_03
Revises: 20260416_02
Create Date: 2026-04-16 22:45:00
"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = "20260416_03"
down_revision: Union[str, None] = "20260416_02"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "faq_sections",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("name", sa.String(length=120), nullable=False),
        sa.Column("sort_order", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
    )
    op.create_index("ix_faq_sections_id", "faq_sections", ["id"], unique=False)
    op.create_index("ix_faq_sections_name", "faq_sections", ["name"], unique=True)
    op.create_index("ix_faq_sections_sort_order", "faq_sections", ["sort_order"], unique=False)

    op.add_column("faq_items", sa.Column("faq_section_id", sa.Integer(), nullable=False))
    op.create_index("ix_faq_items_faq_section_id", "faq_items", ["faq_section_id"], unique=False)
    op.create_foreign_key(
        "fk_faq_items_faq_section_id",
        "faq_items",
        "faq_sections",
        ["faq_section_id"],
        ["id"],
        ondelete="RESTRICT",
    )


def downgrade() -> None:
    op.drop_constraint("fk_faq_items_faq_section_id", "faq_items", type_="foreignkey")
    op.drop_index("ix_faq_items_faq_section_id", table_name="faq_items")
    op.drop_column("faq_items", "faq_section_id")

    op.drop_index("ix_faq_sections_sort_order", table_name="faq_sections")
    op.drop_index("ix_faq_sections_name", table_name="faq_sections")
    op.drop_index("ix_faq_sections_id", table_name="faq_sections")
    op.drop_table("faq_sections")

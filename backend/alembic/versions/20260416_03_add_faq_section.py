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
    op.add_column(
        "faq_items",
        sa.Column(
            "section",
            sa.String(length=120),
            nullable=False,
            server_default="",
        ),
    )
    op.alter_column("faq_items", "section", existing_type=sa.String(length=120), server_default=None)


def downgrade() -> None:
    op.drop_column("faq_items", "section")

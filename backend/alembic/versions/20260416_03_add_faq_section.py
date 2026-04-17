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
            server_default="Parking and Transportation",
        ),
    )

    op.execute(
        """
        UPDATE faq_items
        SET section = CASE
            WHEN sort_order BETWEEN 0 AND 5 THEN 'Parking and Transportation'
            WHEN sort_order BETWEEN 6 AND 8 THEN 'Check-In and Check-Out'
            WHEN sort_order = 9 THEN 'Luggage Storage'
            WHEN sort_order = 10 THEN 'Extending Your Stay'
            WHEN sort_order BETWEEN 11 AND 14 THEN 'Condo Policies'
            ELSE 'Amenities & Services'
        END
        """
    )


def downgrade() -> None:
    op.drop_column("faq_items", "section")

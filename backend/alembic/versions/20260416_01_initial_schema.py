"""initial schema

Revision ID: 20260416_01
Revises:
Create Date: 2026-04-16 21:20:00
"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = "20260416_01"
down_revision: Union[str, None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "blog_posts",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("slug", sa.String(length=180), nullable=False),
        sa.Column("title", sa.String(length=255), nullable=False),
        sa.Column("summary", sa.String(length=400), nullable=False, server_default=""),
        sa.Column("body_markdown", sa.Text(), nullable=False),
        sa.Column("published", sa.Boolean(), nullable=False, server_default=sa.true()),
        sa.Column("published_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
    )
    op.create_index("ix_blog_posts_id", "blog_posts", ["id"], unique=False)
    op.create_index("ix_blog_posts_published", "blog_posts", ["published"], unique=False)
    op.create_index("ix_blog_posts_slug", "blog_posts", ["slug"], unique=True)

    op.create_table(
        "faq_items",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("question", sa.String(length=255), nullable=False),
        sa.Column("answer_markdown", sa.Text(), nullable=False),
        sa.Column("sort_order", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("published", sa.Boolean(), nullable=False, server_default=sa.true()),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
    )
    op.create_index("ix_faq_items_id", "faq_items", ["id"], unique=False)
    op.create_index("ix_faq_items_published", "faq_items", ["published"], unique=False)
    op.create_index("ix_faq_items_sort_order", "faq_items", ["sort_order"], unique=False)


def downgrade() -> None:
    op.drop_index("ix_faq_items_sort_order", table_name="faq_items")
    op.drop_index("ix_faq_items_published", table_name="faq_items")
    op.drop_index("ix_faq_items_id", table_name="faq_items")
    op.drop_table("faq_items")

    op.drop_index("ix_blog_posts_slug", table_name="blog_posts")
    op.drop_index("ix_blog_posts_published", table_name="blog_posts")
    op.drop_index("ix_blog_posts_id", table_name="blog_posts")
    op.drop_table("blog_posts")

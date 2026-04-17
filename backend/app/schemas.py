from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field


class BlogPostBase(BaseModel):
    title: str = Field(min_length=1, max_length=255)
    summary: str = Field(default="", max_length=400)
    slug: str | None = Field(default=None, max_length=180)
    body_markdown: str = Field(min_length=1)
    published: bool = True


class BlogPostCreate(BlogPostBase):
    pass


class BlogPostUpdate(BlogPostBase):
    pass


class BlogPostRead(BlogPostBase):
    id: int
    published_at: datetime | None
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


class FAQItemBase(BaseModel):
    question: str = Field(min_length=1, max_length=255)
    answer_markdown: str = Field(min_length=1)
    sort_order: int = 0
    published: bool = True


class FAQItemCreate(FAQItemBase):
    pass


class FAQItemUpdate(FAQItemBase):
    pass


class FAQItemRead(FAQItemBase):
    id: int
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


from datetime import datetime
from typing import Literal

from pydantic import BaseModel, ConfigDict, Field


FAQSection = Literal[
    "Parking and Transportation",
    "Check-In and Check-Out",
    "Luggage Storage",
    "Extending Your Stay",
    "Condo Policies",
    "Amenities & Services",
]


class BlogPostBase(BaseModel):
    title: str = Field(min_length=1, max_length=255)
    author: str = Field(default="", max_length=160)
    summary: str = Field(default="", max_length=400)
    slug: str | None = Field(default=None, max_length=180)
    body_markdown: str = Field(min_length=1)
    published: bool = True
    published_at: datetime


class BlogPostCreate(BlogPostBase):
    pass


class BlogPostUpdate(BlogPostBase):
    pass


class BlogPostRead(BlogPostBase):
    id: int
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


class FAQItemBase(BaseModel):
    section: FAQSection
    question: str = Field(min_length=1, max_length=255)
    answer_markdown: str = Field(min_length=1)
    published: bool = True


class FAQItemCreate(FAQItemBase):
    pass


class FAQItemUpdate(FAQItemBase):
    pass


class FAQOrderEntry(BaseModel):
    id: int
    section: FAQSection


class FAQOrderUpdate(BaseModel):
    items: list[FAQOrderEntry] = Field(default_factory=list)


class FAQItemRead(FAQItemBase):
    id: int
    sort_order: int
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)

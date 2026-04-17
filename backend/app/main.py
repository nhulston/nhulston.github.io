from datetime import datetime, timezone

from fastapi import Depends, FastAPI, HTTPException, Response, status
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.auth import require_admin
from app.config import settings
from app.db import get_db
from app.models import BlogPost, FAQItem
from app.schemas import (
    BlogPostCreate,
    BlogPostRead,
    BlogPostUpdate,
    FAQItemCreate,
    FAQOrderUpdate,
    FAQItemRead,
    FAQItemUpdate,
)
from app.utils import slugify_text

app = FastAPI(title=settings.app_name)


def unique_blog_slug(
    db: Session, title: str, requested_slug: str | None, current_id: int | None = None
) -> str:
    base_slug = slugify_text(requested_slug or title)
    slug = base_slug
    suffix = 2

    while True:
        query = select(BlogPost).where(BlogPost.slug == slug)
        if current_id is not None:
            query = query.where(BlogPost.id != current_id)
        existing = db.scalar(query)
        if existing is None:
            return slug
        slug = f"{base_slug}-{suffix}"
        suffix += 1


def set_blog_fields(post: BlogPost, payload: BlogPostCreate | BlogPostUpdate, db: Session) -> None:
    post.slug = unique_blog_slug(db, payload.title, payload.slug, getattr(post, "id", None))
    post.title = payload.title
    post.author = payload.author.strip()
    post.summary = payload.summary
    post.body_markdown = payload.body_markdown
    post.published = payload.published

    if payload.published and post.published_at is None:
        post.published_at = datetime.now(timezone.utc)
    if not payload.published:
        post.published_at = None


@app.get("/api/health")
def healthcheck() -> dict[str, str]:
    return {"status": "ok"}


@app.get("/api/public/faqs", response_model=list[FAQItemRead])
def list_public_faqs(db: Session = Depends(get_db)) -> list[FAQItem]:
    statement = (
        select(FAQItem)
        .where(FAQItem.published.is_(True))
        .order_by(FAQItem.sort_order.asc(), FAQItem.updated_at.desc())
    )
    return list(db.scalars(statement))


@app.get("/api/public/blog-posts", response_model=list[BlogPostRead])
def list_public_blog_posts(db: Session = Depends(get_db)) -> list[BlogPost]:
    statement = (
        select(BlogPost)
        .where(BlogPost.published.is_(True))
        .order_by(func.coalesce(BlogPost.published_at, BlogPost.created_at).desc())
    )
    return list(db.scalars(statement))


@app.get("/api/public/blog-posts/{slug}", response_model=BlogPostRead)
def get_public_blog_post(slug: str, db: Session = Depends(get_db)) -> BlogPost:
    statement = select(BlogPost).where(BlogPost.slug == slug, BlogPost.published.is_(True))
    post = db.scalar(statement)
    if post is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Post not found.")
    return post


@app.get(
    "/api/admin/blog-posts",
    response_model=list[BlogPostRead],
    dependencies=[Depends(require_admin)],
)
def list_admin_blog_posts(db: Session = Depends(get_db)) -> list[BlogPost]:
    statement = select(BlogPost).order_by(BlogPost.updated_at.desc())
    return list(db.scalars(statement))


@app.post(
    "/api/admin/blog-posts",
    response_model=BlogPostRead,
    status_code=status.HTTP_201_CREATED,
    dependencies=[Depends(require_admin)],
)
def create_blog_post(payload: BlogPostCreate, db: Session = Depends(get_db)) -> BlogPost:
    post = BlogPost()
    set_blog_fields(post, payload, db)
    db.add(post)
    db.commit()
    db.refresh(post)
    return post


@app.put(
    "/api/admin/blog-posts/{post_id}",
    response_model=BlogPostRead,
    dependencies=[Depends(require_admin)],
)
def update_blog_post(post_id: int, payload: BlogPostUpdate, db: Session = Depends(get_db)) -> BlogPost:
    post = db.get(BlogPost, post_id)
    if post is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Post not found.")
    set_blog_fields(post, payload, db)
    db.commit()
    db.refresh(post)
    return post


@app.delete(
    "/api/admin/blog-posts/{post_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    dependencies=[Depends(require_admin)],
)
def delete_blog_post(post_id: int, db: Session = Depends(get_db)) -> Response:
    post = db.get(BlogPost, post_id)
    if post is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Post not found.")
    db.delete(post)
    db.commit()
    return Response(status_code=status.HTTP_204_NO_CONTENT)


@app.get(
    "/api/admin/faqs",
    response_model=list[FAQItemRead],
    dependencies=[Depends(require_admin)],
)
def list_admin_faqs(db: Session = Depends(get_db)) -> list[FAQItem]:
    statement = select(FAQItem).order_by(FAQItem.sort_order.asc(), FAQItem.updated_at.desc())
    return list(db.scalars(statement))


@app.post(
    "/api/admin/faqs",
    response_model=FAQItemRead,
    status_code=status.HTTP_201_CREATED,
    dependencies=[Depends(require_admin)],
)
def create_faq_item(payload: FAQItemCreate, db: Session = Depends(get_db)) -> FAQItem:
    highest_sort_order = db.scalar(select(func.max(FAQItem.sort_order)))
    faq = FAQItem(
        question=payload.question,
        answer_markdown=payload.answer_markdown,
        sort_order=0 if highest_sort_order is None else highest_sort_order + 1,
        published=payload.published,
    )
    db.add(faq)
    db.commit()
    db.refresh(faq)
    return faq


@app.put(
    "/api/admin/faqs/{faq_id}",
    response_model=FAQItemRead,
    dependencies=[Depends(require_admin)],
)
def update_faq_item(faq_id: int, payload: FAQItemUpdate, db: Session = Depends(get_db)) -> FAQItem:
    faq = db.get(FAQItem, faq_id)
    if faq is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="FAQ not found.")
    faq.question = payload.question
    faq.answer_markdown = payload.answer_markdown
    faq.published = payload.published
    db.commit()
    db.refresh(faq)
    return faq


@app.post(
    "/api/admin/faqs/reorder",
    response_model=list[FAQItemRead],
    dependencies=[Depends(require_admin)],
)
def reorder_faq_items(payload: FAQOrderUpdate, db: Session = Depends(get_db)) -> list[FAQItem]:
    current_ids = list(db.scalars(select(FAQItem.id)))
    requested_ids = payload.faq_ids

    if (
        len(requested_ids) != len(current_ids)
        or len(set(requested_ids)) != len(requested_ids)
        or set(requested_ids) != set(current_ids)
    ):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="FAQ reorder payload must include every FAQ exactly once.",
        )

    faq_map = {faq.id: faq for faq in db.scalars(select(FAQItem).where(FAQItem.id.in_(requested_ids)))}
    for sort_order, faq_id in enumerate(requested_ids):
        faq_map[faq_id].sort_order = sort_order

    db.commit()

    statement = select(FAQItem).order_by(FAQItem.sort_order.asc(), FAQItem.updated_at.desc())
    return list(db.scalars(statement))


@app.delete(
    "/api/admin/faqs/{faq_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    dependencies=[Depends(require_admin)],
)
def delete_faq_item(faq_id: int, db: Session = Depends(get_db)) -> Response:
    faq = db.get(FAQItem, faq_id)
    if faq is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="FAQ not found.")
    db.delete(faq)
    db.commit()
    return Response(status_code=status.HTTP_204_NO_CONTENT)

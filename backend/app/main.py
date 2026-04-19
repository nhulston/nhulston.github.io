from datetime import datetime, timezone
from xml.sax.saxutils import escape

from fastapi import Depends, FastAPI, HTTPException, Response, status
from sqlalchemy import func, select
from sqlalchemy.orm import Session, selectinload

from app.auth import require_admin
from app.config import settings
from app.db import get_db
from app.models import BlogPost, FAQItem, FAQSection
from app.schemas import (
    BlogPostCreate,
    BlogPostRead,
    BlogPostUpdate,
    FAQItemCreate,
    FAQOrderUpdate,
    FAQItemRead,
    FAQItemUpdate,
    FAQItemPublicRead,
    FAQSectionCreate,
    FAQSectionOrderUpdate,
    FAQSectionPublicRead,
    FAQSectionRead,
    FAQSectionUpdate,
)
from app.utils import slugify_text

app = FastAPI(title=settings.app_name)
PUBLIC_SITE_URL = "https://parkcityskiout.com"


def absolute_site_url(path: str) -> str:
    base_url = PUBLIC_SITE_URL
    if not path or path == "/":
        return f"{base_url}/"
    return f"{base_url}{path if path.startswith('/') else f'/{path}'}"


def format_sitemap_lastmod(value: datetime | None) -> str | None:
    if value is None:
        return None
    return value.astimezone(timezone.utc).date().isoformat()


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

    if payload.published_at.tzinfo is None:
        post.published_at = payload.published_at.replace(tzinfo=timezone.utc)
    else:
        post.published_at = payload.published_at.astimezone(timezone.utc)


def normalize_section_name(value: str) -> str:
    return value.strip().casefold()


def ensure_unique_section_name(
    db: Session, requested_name: str, current_id: int | None = None
) -> None:
    statement = select(FAQSection)
    for section in db.scalars(statement):
        if current_id is not None and section.id == current_id:
            continue
        if normalize_section_name(section.name) == normalize_section_name(requested_name):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="A FAQ section with that name already exists.",
            )


def require_faq_section(db: Session, faq_section_id: int) -> FAQSection:
    section = db.get(FAQSection, faq_section_id)
    if section is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="FAQ section not found.")
    return section


@app.get("/api/health")
def healthcheck() -> dict[str, str]:
    return {"status": "ok"}


@app.get("/sitemap.xml", include_in_schema=False)
def sitemap(db: Session = Depends(get_db)) -> Response:
    published_posts = list(
        db.scalars(
            select(BlogPost)
            .where(BlogPost.published.is_(True))
            .order_by(BlogPost.published_at.desc(), BlogPost.created_at.desc())
        )
    )
    latest_blog_update = db.scalar(
        select(func.max(BlogPost.updated_at)).where(BlogPost.published.is_(True))
    )
    latest_faq_update = db.scalar(select(func.max(FAQItem.updated_at)).where(FAQItem.published.is_(True)))
    latest_public_update = max(
        [value for value in [latest_blog_update, latest_faq_update] if value is not None],
        default=None,
    )

    urls: list[tuple[str, datetime | None]] = [
        (absolute_site_url("/"), latest_public_update),
        (absolute_site_url("/faq"), latest_faq_update),
        (absolute_site_url("/blog"), latest_blog_update),
    ]
    urls.extend(
        (
            absolute_site_url(f"/blog/{post.slug}"),
            post.updated_at or post.published_at,
        )
        for post in published_posts
    )

    xml_lines = [
        '<?xml version="1.0" encoding="UTF-8"?>',
        '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
    ]

    for url, lastmod in urls:
        xml_lines.append("  <url>")
        xml_lines.append(f"    <loc>{escape(url)}</loc>")
        formatted_lastmod = format_sitemap_lastmod(lastmod)
        if formatted_lastmod is not None:
            xml_lines.append(f"    <lastmod>{formatted_lastmod}</lastmod>")
        xml_lines.append("  </url>")

    xml_lines.append("</urlset>")

    return Response("\n".join(xml_lines), media_type="application/xml")


@app.get("/api/public/faqs", response_model=list[FAQSectionPublicRead])
def list_public_faqs(db: Session = Depends(get_db)) -> list[FAQSectionPublicRead]:
    sections = list(
        db.scalars(select(FAQSection).order_by(FAQSection.sort_order.asc(), FAQSection.updated_at.desc()))
    )
    faqs = list(
        db.scalars(
            select(FAQItem)
            .where(FAQItem.published.is_(True))
            .order_by(FAQItem.sort_order.asc(), FAQItem.updated_at.desc())
        )
    )

    faqs_by_section: dict[int, list[FAQItemPublicRead]] = {}
    for faq in faqs:
        faqs_by_section.setdefault(faq.faq_section_id, []).append(FAQItemPublicRead.model_validate(faq))

    response: list[FAQSectionPublicRead] = []
    for section in sections:
        items = faqs_by_section.get(section.id, [])
        if items:
            response.append(
                FAQSectionPublicRead(
                    id=section.id,
                    name=section.name,
                    sort_order=section.sort_order,
                    created_at=section.created_at,
                    updated_at=section.updated_at,
                    items=items,
                )
            )
    return response


@app.get("/api/public/blog-posts", response_model=list[BlogPostRead])
def list_public_blog_posts(db: Session = Depends(get_db)) -> list[BlogPost]:
    statement = (
        select(BlogPost)
        .where(BlogPost.published.is_(True))
        .order_by(BlogPost.published_at.desc(), BlogPost.created_at.desc())
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
    "/api/admin/faq-sections",
    response_model=list[FAQSectionRead],
    dependencies=[Depends(require_admin)],
)
def list_admin_faq_sections(db: Session = Depends(get_db)) -> list[FAQSection]:
    statement = select(FAQSection).order_by(FAQSection.sort_order.asc(), FAQSection.updated_at.desc())
    return list(db.scalars(statement))


@app.post(
    "/api/admin/faq-sections",
    response_model=FAQSectionRead,
    status_code=status.HTTP_201_CREATED,
    dependencies=[Depends(require_admin)],
)
def create_faq_section(payload: FAQSectionCreate, db: Session = Depends(get_db)) -> FAQSection:
    ensure_unique_section_name(db, payload.name)
    highest_sort_order = db.scalar(select(func.max(FAQSection.sort_order)))
    section = FAQSection(
        name=payload.name,
        sort_order=0 if highest_sort_order is None else highest_sort_order + 1,
    )
    db.add(section)
    db.commit()
    db.refresh(section)
    return section


@app.put(
    "/api/admin/faq-sections/{section_id}",
    response_model=FAQSectionRead,
    dependencies=[Depends(require_admin)],
)
def update_faq_section(
    section_id: int, payload: FAQSectionUpdate, db: Session = Depends(get_db)
) -> FAQSection:
    section = require_faq_section(db, section_id)
    ensure_unique_section_name(db, payload.name, current_id=section_id)
    section.name = payload.name
    db.commit()
    db.refresh(section)
    return section


@app.post(
    "/api/admin/faq-sections/reorder",
    response_model=list[FAQSectionRead],
    dependencies=[Depends(require_admin)],
)
def reorder_faq_sections(
    payload: FAQSectionOrderUpdate, db: Session = Depends(get_db)
) -> list[FAQSection]:
    current_ids = list(db.scalars(select(FAQSection.id)))
    requested_ids = payload.section_ids

    if (
        len(requested_ids) != len(current_ids)
        or len(set(requested_ids)) != len(requested_ids)
        or set(requested_ids) != set(current_ids)
    ):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="FAQ section reorder payload must include every section exactly once.",
        )

    section_map = {
        section.id: section for section in db.scalars(select(FAQSection).where(FAQSection.id.in_(requested_ids)))
    }
    for sort_order, section_id in enumerate(requested_ids):
        section_map[section_id].sort_order = sort_order

    db.commit()
    statement = select(FAQSection).order_by(FAQSection.sort_order.asc(), FAQSection.updated_at.desc())
    return list(db.scalars(statement))


@app.delete(
    "/api/admin/faq-sections/{section_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    dependencies=[Depends(require_admin)],
)
def delete_faq_section(section_id: int, db: Session = Depends(get_db)) -> Response:
    section = require_faq_section(db, section_id)
    has_faqs = db.scalar(select(func.count(FAQItem.id)).where(FAQItem.faq_section_id == section_id)) or 0
    if has_faqs:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Move or delete FAQs in this section before deleting it.",
        )
    db.delete(section)
    db.commit()
    return Response(status_code=status.HTTP_204_NO_CONTENT)


@app.get(
    "/api/admin/faqs",
    response_model=list[FAQItemRead],
    dependencies=[Depends(require_admin)],
)
def list_admin_faqs(db: Session = Depends(get_db)) -> list[FAQItem]:
    statement = (
        select(FAQItem)
        .options(selectinload(FAQItem.section))
        .join(FAQSection, FAQItem.faq_section_id == FAQSection.id)
        .order_by(FAQSection.sort_order.asc(), FAQItem.sort_order.asc(), FAQItem.updated_at.desc())
    )
    return list(db.scalars(statement))


@app.post(
    "/api/admin/faqs",
    response_model=FAQItemRead,
    status_code=status.HTTP_201_CREATED,
    dependencies=[Depends(require_admin)],
)
def create_faq_item(payload: FAQItemCreate, db: Session = Depends(get_db)) -> FAQItem:
    section = require_faq_section(db, payload.faq_section_id)
    highest_sort_order = db.scalar(
        select(func.max(FAQItem.sort_order)).where(FAQItem.faq_section_id == payload.faq_section_id)
    )
    faq = FAQItem(
        faq_section_id=section.id,
        question=payload.question,
        answer_markdown=payload.answer_markdown,
        sort_order=0 if highest_sort_order is None else highest_sort_order + 1,
        published=payload.published,
    )
    db.add(faq)
    db.commit()
    db.refresh(faq)
    faq = db.scalar(select(FAQItem).options(selectinload(FAQItem.section)).where(FAQItem.id == faq.id))
    assert faq is not None
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
    require_faq_section(db, payload.faq_section_id)
    if faq.faq_section_id != payload.faq_section_id:
        highest_sort_order = db.scalar(
            select(func.max(FAQItem.sort_order)).where(FAQItem.faq_section_id == payload.faq_section_id)
        )
        faq.faq_section_id = payload.faq_section_id
        faq.sort_order = 0 if highest_sort_order is None else highest_sort_order + 1
    faq.question = payload.question
    faq.answer_markdown = payload.answer_markdown
    faq.published = payload.published
    db.commit()
    faq = db.scalar(select(FAQItem).options(selectinload(FAQItem.section)).where(FAQItem.id == faq_id))
    assert faq is not None
    return faq


@app.post(
    "/api/admin/faq-sections/{section_id}/faqs/reorder",
    response_model=list[FAQItemRead],
    dependencies=[Depends(require_admin)],
)
def reorder_faq_items(
    section_id: int, payload: FAQOrderUpdate, db: Session = Depends(get_db)
) -> list[FAQItem]:
    require_faq_section(db, section_id)
    current_ids = list(
        db.scalars(select(FAQItem.id).where(FAQItem.faq_section_id == section_id))
    )
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

    faq_map = {
        faq.id: faq
        for faq in db.scalars(
            select(FAQItem).where(FAQItem.id.in_(requested_ids), FAQItem.faq_section_id == section_id)
        )
    }
    for sort_order, faq_id in enumerate(requested_ids):
        faq_map[faq_id].sort_order = sort_order

    db.commit()

    statement = (
        select(FAQItem)
        .options(selectinload(FAQItem.section))
        .join(FAQSection, FAQItem.faq_section_id == FAQSection.id)
        .order_by(FAQSection.sort_order.asc(), FAQItem.sort_order.asc(), FAQItem.updated_at.desc())
    )
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

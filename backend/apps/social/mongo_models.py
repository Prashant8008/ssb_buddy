"""
MongoDB document models for Posts, Comments and Likes.
All CRUD operations for the social feed live here.
"""
from datetime import datetime, timezone
from bson import ObjectId
from bson.errors import InvalidId

from .mongo_db import get_posts_col, get_comments_col


# ─────────────────────────────────────────────
#  Helpers
# ─────────────────────────────────────────────

def _str_id(doc: dict) -> dict:
    """Convert ObjectId _id to string so it's JSON-serialisable."""
    if doc and "_id" in doc:
        doc["id"] = str(doc.pop("_id"))
    return doc


def _oid(post_id: str) -> ObjectId:
    try:
        return ObjectId(post_id)
    except (InvalidId, TypeError):
        raise ValueError(f"Invalid post id: {post_id}")


def _now() -> datetime:
    return datetime.now(timezone.utc)


# ─────────────────────────────────────────────
#  POST operations
# ─────────────────────────────────────────────

def create_post(author_id: int, author_username: str, author_avatar: str,
                body: str, title: str = "", post_type: str = "TEXT",
                image_url: str = "", video_url: str = "",
                document_url: str = "", group_id=None) -> dict:
    doc = {
        "author_id": author_id,
        "author_username": author_username,
        "author_avatar": author_avatar,
        "title": title,
        "body": body,
        "post_type": post_type,
        "image_url": image_url,
        "video_url": video_url,
        "document_url": document_url,
        "group_id": group_id,
        "likes": [],            # list of user IDs (ints)
        "likes_count": 0,
        "comments_count": 0,
        "saved_by": [],         # list of user IDs (ints)
        "created_at": _now(),
        "updated_at": _now(),
    }
    result = get_posts_col().insert_one(doc)
    doc["id"] = str(result.inserted_id)
    doc.pop("_id", None)
    return doc


def _build_filter(
    post_type: str = None,
    author_id: int = None,
    group_id=None,
    author_ids: list[int] | None = None,
) -> dict:
    filt: dict = {}
    if post_type:
        filt["post_type"] = post_type
    if author_id is not None:
        # Match int or legacy string author_id values in MongoDB
        aid = int(author_id)
        filt["author_id"] = {"$in": [aid, str(aid)]}
    elif author_ids is not None:
        expanded = []
        for aid in author_ids:
            expanded.extend([int(aid), str(aid)])
        filt["author_id"] = {"$in": expanded}
    if group_id is not None:
        filt["group_id"] = group_id
    return filt


def get_feed(
    page: int = 1,
    page_size: int = 20,
    post_type: str = None,
    author_id: int = None,
    group_id=None,
    author_ids: list[int] | None = None,
) -> list[dict]:
    filt = _build_filter(
        post_type=post_type,
        author_id=author_id,
        group_id=group_id,
        author_ids=author_ids,
    )
    skip = (page - 1) * page_size
    cursor = (
        get_posts_col()
        .find(filt)
        .sort("created_at", -1)
        .skip(skip)
        .limit(page_size)
    )
    return [_str_id(doc) for doc in cursor]


def get_post(post_id: str) -> dict | None:
    doc = get_posts_col().find_one({"_id": _oid(post_id)})
    return _str_id(doc) if doc else None


def update_post(post_id: str, author_id: int, data: dict) -> dict | None:
    allowed = {"title", "body", "post_type", "image_url", "video_url", "document_url"}
    update_data = {k: v for k, v in data.items() if k in allowed}
    update_data["updated_at"] = _now()
    result = get_posts_col().find_one_and_update(
        {"_id": _oid(post_id), "author_id": author_id},
        {"$set": update_data},
        return_document=True,
    )
    return _str_id(result) if result else None


def delete_post(post_id: str, author_id: int) -> bool:
    result = get_posts_col().delete_one(
        {"_id": _oid(post_id), "author_id": author_id}
    )
    if result.deleted_count:
        get_comments_col().delete_many({"post_id": post_id})
    return result.deleted_count > 0


# ─────────────────────────────────────────────
#  LIKE operations
# ─────────────────────────────────────────────

def toggle_like(post_id: str, user_id: int) -> dict:
    """Toggle like — returns {liked: bool, likes_count: int}."""
    col = get_posts_col()
    post = col.find_one({"_id": _oid(post_id)}, {"likes": 1})
    if post is None:
        raise ValueError("Post not found")

    already_liked = user_id in post.get("likes", [])
    if already_liked:
        col.update_one(
            {"_id": _oid(post_id)},
            {"$pull": {"likes": user_id}, "$inc": {"likes_count": -1}}
        )
    else:
        col.update_one(
            {"_id": _oid(post_id)},
            {"$addToSet": {"likes": user_id}, "$inc": {"likes_count": 1}}
        )

    updated = col.find_one({"_id": _oid(post_id)}, {"likes_count": 1})
    return {"liked": not already_liked, "likes_count": updated["likes_count"]}


# ─────────────────────────────────────────────
#  SAVE / BOOKMARK operations
# ─────────────────────────────────────────────

def toggle_save(post_id: str, user_id: int) -> dict:
    col = get_posts_col()
    post = col.find_one({"_id": _oid(post_id)}, {"saved_by": 1})
    if post is None:
        raise ValueError("Post not found")

    already_saved = user_id in post.get("saved_by", [])
    if already_saved:
        col.update_one({"_id": _oid(post_id)}, {"$pull": {"saved_by": user_id}})
    else:
        col.update_one({"_id": _oid(post_id)}, {"$addToSet": {"saved_by": user_id}})
    return {"saved": not already_saved}


# ─────────────────────────────────────────────
#  COMMENT operations
# ─────────────────────────────────────────────

def add_comment(post_id: str, author_id: int, author_username: str,
                body: str, parent_id: str = None) -> dict:
    doc = {
        "post_id": post_id,
        "author_id": author_id,
        "author_username": author_username,
        "parent_id": parent_id,
        "body": body,
        "created_at": _now(),
    }
    result = get_comments_col().insert_one(doc)
    # Increment comments_count on the post
    get_posts_col().update_one(
        {"_id": _oid(post_id)},
        {"$inc": {"comments_count": 1}}
    )
    doc["id"] = str(result.inserted_id)
    doc.pop("_id", None)
    return doc


def get_comments(post_id: str) -> list[dict]:
    cursor = (get_comments_col()
              .find({"post_id": post_id})
              .sort("created_at", 1))
    return [_str_id(doc) for doc in cursor]


def delete_comment(comment_id: str, author_id: int, post_id: str) -> bool:
    from bson import ObjectId as OID
    result = get_comments_col().delete_one(
        {"_id": OID(comment_id), "author_id": author_id}
    )
    if result.deleted_count:
        get_posts_col().update_one(
            {"_id": _oid(post_id)},
            {"$inc": {"comments_count": -1}}
        )
    return result.deleted_count > 0


def count_posts(
    post_type: str = None,
    author_id: int = None,
    group_id=None,
    author_ids: list[int] | None = None,
) -> int:
    filt = _build_filter(
        post_type=post_type,
        author_id=author_id,
        group_id=group_id,
        author_ids=author_ids,
    )
    return get_posts_col().count_documents(filt)

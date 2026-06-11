"""
MongoDB Connection Singleton
Provides a shared MongoClient and database handle for the social feed app.
"""
from pymongo import MongoClient, DESCENDING
from pymongo.collection import Collection
from django.conf import settings

_client: MongoClient | None = None


def get_client() -> MongoClient:
    """Return the shared MongoClient, creating it once."""
    global _client
    if _client is None:
        _client = MongoClient(settings.MONGO_URI, serverSelectionTimeoutMS=5000)
    return _client


def get_db():
    """Return the ssb_connect_feed database handle."""
    return get_client()[settings.MONGO_DB_NAME]


def get_posts_col() -> Collection:
    return get_db()["posts"]


def get_comments_col() -> Collection:
    return get_db()["comments"]


def ensure_indexes():
    """Create indexes for fast queries — call once at startup."""
    posts = get_posts_col()
    posts.create_index([("created_at", DESCENDING)])
    posts.create_index("author_id")
    posts.create_index("post_type")
    posts.create_index("group_id")

    comments = get_comments_col()
    comments.create_index("post_id")
    comments.create_index("author_id")

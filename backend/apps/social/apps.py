from django.apps import AppConfig


class SocialConfig(AppConfig):
    default_auto_field = "django.db.models.BigAutoField"
    name = "apps.social"

    def ready(self):
        """Create MongoDB indexes once when Django starts."""
        try:
            from .mongo_db import ensure_indexes
            ensure_indexes()
        except Exception as e:
            # Don't crash Django startup if MongoDB is temporarily unavailable
            import warnings
            warnings.warn(f"MongoDB index setup failed: {e}", RuntimeWarning)

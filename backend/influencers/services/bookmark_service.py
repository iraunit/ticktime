"""
Bookmark Service

Business logic for bookmarking influencers.
"""

import logging

from brands.models import BookmarkedInfluencer

logger = logging.getLogger(__name__)


class BookmarkService:
    """Service for handling influencer bookmark operations."""

    @staticmethod
    def toggle_bookmark(brand, influencer, bookmarked_by):
        """
        Toggle bookmark status for an influencer.
        
        Returns:
            tuple: (is_bookmarked: bool, created: bool)
        """
        existing_bookmark = BookmarkedInfluencer.objects.filter(
            brand=brand,
            influencer=influencer
        ).first()

        if existing_bookmark:
            # Unbookmark
            existing_bookmark.delete()
            return False, False
        else:
            # Bookmark
            BookmarkedInfluencer.objects.create(
                brand=brand,
                influencer=influencer,
                bookmarked_by=bookmarked_by
            )
            return True, True

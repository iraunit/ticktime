from dataclasses import dataclass
from typing import Dict, Iterable, List

from influencers.models import SocialMediaAccount, SocialMediaPost

VIDEO_TYPES = {'video', 'reel', 'igtv', 'story', 'short'}


@dataclass
class EngagementGroupMetrics:
    posts_considered: int
    weighted_total: float
    average_likes: float
    average_comments: float
    average_views: float
    expected_comments: float
    expected_views: float
    engagement_rate: float


def _trim_extremes(posts: List[SocialMediaPost]) -> List[SocialMediaPost]:
    """
    Remove the best and worst performing posts when we have a sufficiently large dataset.
    """
    if len(posts) <= 20:
        return posts

    trim_count = min(3, len(posts) // 10)  # safety to avoid trimming too aggressively on small samples
    sorted_posts = sorted(posts, key=lambda post: post.likes_count)
    if len(sorted_posts) <= trim_count * 2:
        return sorted_posts

    return sorted_posts[trim_count:-trim_count]


def _calculate_group_metrics(posts: Iterable[SocialMediaPost], followers: int) -> EngagementGroupMetrics:
    posts = _trim_extremes(list(posts))
    count = len(posts)
    if count == 0:
        return EngagementGroupMetrics(0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0)

    total_likes = sum(post.likes_count for post in posts)
    total_comments = sum(post.comments_count for post in posts)
    total_views = sum(post.views_count for post in posts)

    weighted_total = total_likes + (2 * total_comments)
    average_likes = total_likes / count if count else 0.0
    average_comments = total_comments / count if count else 0.0
    average_views = total_views / count if count else 0.0

    weighted_average = weighted_total / count if count else 0.0
    engagement_rate = 0.0
    if followers:
        engagement_rate = (weighted_average / followers) * 100

    return EngagementGroupMetrics(
        posts_considered=count,
        weighted_total=weighted_total,
        average_likes=average_likes,
        average_comments=average_comments,
        average_views=average_views,
        expected_comments=average_comments,
        expected_views=average_views,
        engagement_rate=engagement_rate,
    )


def calculate_engagement_metrics(account: SocialMediaAccount) -> Dict[str, float]:
    """
    Calculate engagement metrics for a social media account using its posts.
    """
    posts = list(account.posts.all())
    if not posts:
        return {
            'post_engagement_rate': 0.0,
            'video_engagement_rate': 0.0,
            'overall_engagement_rate': 0.0,
            'average_post_likes': 0.0,
            'average_post_comments': 0.0,
            'average_video_likes': 0.0,
            'average_video_comments': 0.0,
            'average_video_views': 0.0,
            'post_expected_comments': 0.0,
            'video_expected_comments': 0.0,
            'video_expected_views': 0.0,
            'posts_considered': 0,
            'videos_considered': 0,
        }

    video_posts = [post for post in posts if post.post_type and post.post_type.lower() in VIDEO_TYPES]
    image_posts = [post for post in posts if post not in video_posts]

    followers = account.followers_count or 0
    post_metrics = _calculate_group_metrics(image_posts, followers)
    video_metrics = _calculate_group_metrics(video_posts, followers)

    total_weighted = post_metrics.weighted_total + video_metrics.weighted_total
    total_posts = post_metrics.posts_considered + video_metrics.posts_considered
    overall_engagement_rate = 0.0
    if total_posts and followers:
        overall_average = total_weighted / total_posts
        overall_engagement_rate = (overall_average / followers) * 100

    return {
        'post_engagement_rate': post_metrics.engagement_rate,
        'video_engagement_rate': video_metrics.engagement_rate,
        'overall_engagement_rate': overall_engagement_rate,
        'average_post_likes': post_metrics.average_likes,
        'average_post_comments': post_metrics.average_comments,
        'average_video_likes': video_metrics.average_likes,
        'average_video_comments': video_metrics.average_comments,
        'average_video_views': video_metrics.average_views,
        'post_expected_comments': post_metrics.expected_comments,
        'video_expected_comments': video_metrics.expected_comments,
        'video_expected_views': video_metrics.expected_views,
        'posts_considered': post_metrics.posts_considered,
        'videos_considered': video_metrics.posts_considered,
    }

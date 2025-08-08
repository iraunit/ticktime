# API URL Structure

This document outlines the complete URL structure for the backend API after the app restructuring.

## Base URL Structure

All API endpoints are prefixed with `/api/` except for admin and OAuth endpoints.

## Authentication & User Management

### Authentication App (`/api/auth/`)
- `POST /api/auth/signup/` - User registration
- `POST /api/auth/login/` - User login
- `POST /api/auth/logout/` - User logout
- `POST /api/auth/token/` - JWT token obtain
- `POST /api/auth/token/refresh/` - JWT token refresh
- `GET /api/auth/verify-email/<token>/` - Email verification
- `POST /api/auth/forgot-password/` - Password reset request
- `POST /api/auth/reset-password/<uid>/<token>/` - Password reset
- `POST /api/auth/google/` - Google OAuth
- `GET /api/auth/profile/` - User profile

### Users App (`/api/users/`)
- `GET/PUT /api/users/profile/` - User profile management
- `GET /api/users/info/` - User information
- `POST /api/users/change-password/` - Change password
- `POST /api/users/deactivate/` - Deactivate account

## Core Business Logic

### Influencers App (`/api/influencers/`)
- `GET/PUT /api/influencers/profile/` - Influencer profile
- `POST /api/influencers/profile/upload-image/` - Upload profile image
- `POST /api/influencers/profile/upload-document/` - Upload verification document
- `GET/PUT /api/influencers/profile/bank-details/` - Bank details
- `GET /api/influencers/profile/completion-status/` - Profile completion status
- `GET/POST /api/influencers/profile/social-accounts/` - Social media accounts
- `GET/PUT/DELETE /api/influencers/profile/social-accounts/<id>/` - Social account detail
- `POST /api/influencers/profile/social-accounts/<id>/toggle-status/` - Toggle account status

### Brands App (`/api/brands/`)
- `POST /api/brands/deals/<deal_id>/rate-brand/` - Rate brand
- `GET /api/brands/brand-ratings/` - Brand ratings

### Campaigns App (`/api/campaigns/`)
- `GET /api/campaigns/` - List campaigns
- `GET /api/campaigns/<campaign_id>/` - Campaign detail
- `GET /api/campaigns/brands/<brand_id>/` - Brand campaigns
- `GET /api/campaigns/filters/` - Campaign filters

### Deals App (`/api/deals/`)
- `GET /api/deals/` - List deals
- `GET /api/deals/<deal_id>/` - Deal detail
- `POST /api/deals/<deal_id>/action/` - Deal actions (accept/reject)
- `GET /api/deals/<deal_id>/timeline/` - Deal timeline
- `GET /api/dashboard/recent-deals/` - Recent deals
- `GET /api/dashboard/collaboration-history/` - Collaboration history
- `GET /api/dashboard/earnings/` - Earnings tracking

### Content App (`/api/content/`)
- `GET/POST /api/deals/<deal_id>/content-submissions/` - Content submissions
- `GET/PUT/DELETE /api/deals/<deal_id>/content-submissions/<submission_id>/` - Content submission detail

## Communication & Analytics

### Messaging App (`/api/messaging/`)
- `GET /api/conversations/` - List conversations
- `GET/POST /api/deals/<deal_id>/messages/` - Deal messages
- `GET/PATCH/DELETE /api/deals/<deal_id>/messages/<message_id>/` - Message detail

### Dashboard App (`/api/dashboard/`)
- `GET /api/dashboard/stats/` - Dashboard statistics
- `GET /api/dashboard/notifications/` - Notifications
- `GET /api/dashboard/performance-metrics/` - Performance metrics

## WebSocket Endpoints

### Messaging WebSocket
- `ws://localhost:8000/ws/deals/<deal_id>/messages/` - Real-time messaging

#### WebSocket Configuration
- **Consumer**: `MessagingConsumer` in `messaging.consumers`
- **Authentication**: JWT token via query parameter (`?token=<jwt_token>`)
- **Features**:
  - Real-time message sending and receiving
  - Typing indicators
  - Message read status updates
  - User authentication and deal access verification
  - Room-based messaging (one room per deal)

#### WebSocket Message Types
- `message` - Send/receive chat messages
- `typing` - Typing indicator status
- `read_status` - Mark messages as read

#### Example WebSocket Usage
```javascript
// Connect to WebSocket
const ws = new WebSocket('ws://localhost:8000/ws/deals/123/messages/?token=<jwt_token>');

// Send a message
ws.send(JSON.stringify({
    'type': 'message',
    'content': 'Hello, this is a test message!'
}));

// Send typing indicator
ws.send(JSON.stringify({
    'type': 'typing',
    'is_typing': true
}));

// Mark message as read
ws.send(JSON.stringify({
    'type': 'read_status',
    'message_id': 456
}));
```

## Admin & OAuth

### Django Admin
- `/admin/` - Django admin interface

### OAuth2 Provider
- `/o/` - OAuth2 provider endpoints

## URL Namespaces

Each app has its own namespace for reverse URL lookups:

- `authentication:` - Authentication app URLs
- `users:` - Users app URLs
- `influencers:` - Influencers app URLs
- `brands:` - Brands app URLs
- `campaigns:` - Campaigns app URLs
- `deals:` - Deals app URLs
- `content:` - Content app URLs
- `messaging:` - Messaging app URLs
- `dashboard:` - Dashboard app URLs
- `core:` - Core app URLs (legacy, empty)

## Example Usage

```python
from django.urls import reverse

# Using namespaces for reverse URL lookups
signup_url = reverse('authentication:signup')
profile_url = reverse('influencers:influencer_profile')
deals_url = reverse('deals:deals_list')
```

## Notes

- All API endpoints require authentication unless otherwise specified
- The core app is kept for compatibility but contains no active endpoints
- WebSocket connections require JWT token authentication via query parameter
- Media files are served at `/media/` during development
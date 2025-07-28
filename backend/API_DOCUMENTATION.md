# InfluencerConnect API Documentation

## Overview

The InfluencerConnect API is a RESTful API built with Django REST Framework that provides endpoints for influencer marketing platform functionality. This documentation covers all available endpoints, request/response formats, and authentication requirements.

## Base URL

```
http://localhost:8000/api
```

## Authentication

The API uses JWT (JSON Web Token) authentication. Include the access token in the Authorization header:

```
Authorization: Bearer <access_token>
```

## Response Format

All API responses follow a consistent format:

### Success Response
```json
{
  "status": "success",
  "data": { ... },
  "message": "Optional success message"
}
```

### Error Response
```json
{
  "status": "error",
  "message": "Error description",
  "code": "ERROR_CODE",
  "details": {
    "field_errors": {
      "field_name": ["Error message"]
    }
  }
}
```

## Authentication Endpoints

### POST /auth/signup/

Create a new user account.

**Request Body:**
```json
{
  "first_name": "John",
  "last_name": "Doe",
  "email": "john@example.com",
  "password": "SecurePassword123!",
  "password_confirm": "SecurePassword123!",
  "phone_number": "+1234567890",
  "username": "johndoe",
  "industry": "tech_gaming"
}
```

**Response (201 Created):**
```json
{
  "status": "success",
  "message": "User created successfully. Please verify your email.",
  "data": {
    "user": {
      "id": 1,
      "email": "john@example.com",
      "first_name": "John",
      "last_name": "Doe",
      "profile": {
        "username": "johndoe",
        "industry": "tech_gaming",
        "is_verified": false
      }
    }
  }
}
```

### POST /auth/login/

Authenticate user and receive access tokens.

**Request Body:**
```json
{
  "email": "john@example.com",
  "password": "SecurePassword123!",
  "remember_me": false
}
```

**Response (200 OK):**
```json
{
  "status": "success",
  "data": {
    "access_token": "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9...",
    "refresh_token": "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9...",
    "user": {
      "id": 1,
      "email": "john@example.com",
      "first_name": "John",
      "last_name": "Doe",
      "profile": {
        "username": "johndoe",
        "industry": "tech_gaming",
        "is_verified": true
      }
    }
  }
}
```

### POST /auth/logout/

Logout user and invalidate tokens.

**Headers:**
```
Authorization: Bearer <access_token>
```

**Response (200 OK):**
```json
{
  "status": "success",
  "message": "Logged out successfully"
}
```

### GET /auth/profile/

Get current user profile information.

**Headers:**
```
Authorization: Bearer <access_token>
```

**Response (200 OK):**
```json
{
  "status": "success",
  "data": {
    "id": 1,
    "email": "john@example.com",
    "first_name": "John",
    "last_name": "Doe",
    "profile": {
      "id": 1,
      "username": "johndoe",
      "industry": "tech_gaming",
      "bio": "Tech enthusiast and content creator",
      "profile_image": "https://example.com/profile.jpg",
      "address": "123 Main St, City, State",
      "is_verified": true,
      "created_at": "2024-01-01T00:00:00Z",
      "updated_at": "2024-01-15T10:30:00Z"
    }
  }
}
```

### PUT /auth/profile/

Update user profile information.

**Headers:**
```
Authorization: Bearer <access_token>
```

**Request Body:**
```json
{
  "first_name": "John",
  "last_name": "Smith",
  "profile": {
    "bio": "Updated bio",
    "industry": "fashion_beauty",
    "address": "456 New St, City, State"
  }
}
```

**Response (200 OK):**
```json
{
  "status": "success",
  "data": {
    "id": 1,
    "email": "john@example.com",
    "first_name": "John",
    "last_name": "Smith",
    "profile": {
      "username": "johndoe",
      "bio": "Updated bio",
      "industry": "fashion_beauty",
      "address": "456 New St, City, State"
    }
  }
}
```

## Dashboard Endpoints

### GET /dashboard/stats/

Get dashboard statistics for the authenticated user.

**Headers:**
```
Authorization: Bearer <access_token>
```

**Response (200 OK):**
```json
{
  "status": "success",
  "data": {
    "total_invitations": 25,
    "active_deals": 3,
    "completed_deals": 12,
    "total_earnings": 5600.00,
    "pending_payments": 800.00,
    "this_month_earnings": 1200.00,
    "average_deal_value": 466.67,
    "completion_rate": 85.7
  }
}
```

### GET /dashboard/recent-deals/

Get recent deal invitations for the dashboard.

**Headers:**
```
Authorization: Bearer <access_token>
```

**Query Parameters:**
- `limit` (optional): Number of deals to return (default: 5)

**Response (200 OK):**
```json
{
  "status": "success",
  "data": {
    "results": [
      {
        "id": 1,
        "campaign": {
          "title": "Summer Tech Campaign",
          "brand": {
            "name": "TechBrand",
            "logo": "https://example.com/logo.png",
            "rating": 4.5
          },
          "deal_type": "paid",
          "cash_amount": 500.00,
          "product_value": 0.00,
          "application_deadline": "2024-02-15T23:59:59Z"
        },
        "status": "invited",
        "invited_at": "2024-01-15T10:00:00Z"
      }
    ],
    "count": 1
  }
}
```

## Deal Management Endpoints

### GET /deals/

Get list of deals for the authenticated user.

**Headers:**
```
Authorization: Bearer <access_token>
```

**Query Parameters:**
- `status` (optional): Filter by deal status (invited, accepted, rejected, etc.)
- `deal_type` (optional): Filter by deal type (paid, barter, hybrid)
- `page` (optional): Page number for pagination
- `page_size` (optional): Number of items per page

**Response (200 OK):**
```json
{
  "status": "success",
  "data": {
    "results": [
      {
        "id": 1,
        "campaign": {
          "id": 1,
          "title": "Summer Tech Campaign",
          "description": "Promote our latest tech products",
          "brand": {
            "id": 1,
            "name": "TechBrand",
            "logo": "https://example.com/logo.png",
            "rating": 4.5,
            "total_collaborations": 150
          },
          "deal_type": "paid",
          "cash_amount": 500.00,
          "product_value": 0.00,
          "content_requirements": {
            "platforms": ["instagram", "youtube"],
            "content_types": ["post", "story"],
            "deliverables": 2
          },
          "application_deadline": "2024-02-15T23:59:59Z",
          "campaign_start_date": "2024-02-20T00:00:00Z",
          "campaign_end_date": "2024-03-20T23:59:59Z"
        },
        "status": "invited",
        "invited_at": "2024-01-15T10:00:00Z",
        "responded_at": null,
        "completed_at": null
      }
    ],
    "count": 1,
    "next": null,
    "previous": null
  }
}
```

### GET /deals/{id}/

Get detailed information about a specific deal.

**Headers:**
```
Authorization: Bearer <access_token>
```

**Response (200 OK):**
```json
{
  "status": "success",
  "data": {
    "id": 1,
    "campaign": {
      "id": 1,
      "title": "Summer Tech Campaign",
      "description": "Promote our latest tech products for the summer season",
      "brand": {
        "id": 1,
        "name": "TechBrand",
        "logo": "https://example.com/logo.png",
        "rating": 4.5,
        "total_collaborations": 150,
        "description": "Leading technology brand"
      },
      "deal_type": "paid",
      "cash_amount": 500.00,
      "product_value": 0.00,
      "content_requirements": {
        "platforms": ["instagram", "youtube"],
        "content_types": ["post", "story"],
        "deliverables": 2,
        "special_instructions": "Use hashtag #TechSummer"
      },
      "application_deadline": "2024-02-15T23:59:59Z",
      "campaign_start_date": "2024-02-20T00:00:00Z",
      "campaign_end_date": "2024-03-20T23:59:59Z"
    },
    "status": "invited",
    "invited_at": "2024-01-15T10:00:00Z",
    "responded_at": null,
    "completed_at": null
  }
}
```

### POST /deals/{id}/accept/

Accept a deal invitation.

**Headers:**
```
Authorization: Bearer <access_token>
```

**Response (200 OK):**
```json
{
  "status": "success",
  "message": "Deal accepted successfully",
  "data": {
    "deal_id": 1,
    "status": "accepted",
    "responded_at": "2024-01-16T14:30:00Z"
  }
}
```

### POST /deals/{id}/reject/

Reject a deal invitation.

**Headers:**
```
Authorization: Bearer <access_token>
```

**Request Body (optional):**
```json
{
  "reason": "Not interested in this campaign type"
}
```

**Response (200 OK):**
```json
{
  "status": "success",
  "message": "Deal rejected successfully",
  "data": {
    "deal_id": 1,
    "status": "rejected",
    "responded_at": "2024-01-16T14:30:00Z"
  }
}
```

### POST /deals/{id}/submit-content/

Submit content for an accepted deal.

**Headers:**
```
Authorization: Bearer <access_token>
Content-Type: multipart/form-data
```

**Request Body:**
```json
{
  "platform": "instagram",
  "content_type": "post",
  "caption": "Check out this amazing product! #TechSummer",
  "file_url": "https://example.com/content.jpg"
}
```

**Response (201 Created):**
```json
{
  "status": "success",
  "message": "Content submitted successfully",
  "data": {
    "submission_id": 1,
    "deal_id": 1,
    "platform": "instagram",
    "content_type": "post",
    "submitted_at": "2024-02-25T16:45:00Z",
    "status": "pending_review"
  }
}
```

## Profile Management Endpoints

### GET /profile/social-accounts/

Get list of social media accounts for the authenticated user.

**Headers:**
```
Authorization: Bearer <access_token>
```

**Response (200 OK):**
```json
{
  "status": "success",
  "data": {
    "results": [
      {
        "id": 1,
        "platform": "instagram",
        "handle": "johndoe",
        "profile_url": "https://instagram.com/johndoe",
        "followers_count": 10000,
        "following_count": 500,
        "posts_count": 100,
        "engagement_rate": 4.5,
        "average_likes": 450,
        "average_comments": 25,
        "average_shares": 10,
        "verified": true,
        "is_active": true
      }
    ],
    "count": 1
  }
}
```

### POST /profile/social-accounts/

Add a new social media account.

**Headers:**
```
Authorization: Bearer <access_token>
```

**Request Body:**
```json
{
  "platform": "youtube",
  "handle": "johndoe",
  "profile_url": "https://youtube.com/@johndoe",
  "followers_count": 5000,
  "engagement_rate": 6.2,
  "verified": false
}
```

**Response (201 Created):**
```json
{
  "status": "success",
  "message": "Social media account added successfully",
  "data": {
    "id": 2,
    "platform": "youtube",
    "handle": "johndoe",
    "profile_url": "https://youtube.com/@johndoe",
    "followers_count": 5000,
    "engagement_rate": 6.2,
    "verified": false,
    "is_active": true
  }
}
```

## Error Codes

| Code | Description |
|------|-------------|
| `VALIDATION_ERROR` | Request data validation failed |
| `AUTHENTICATION_REQUIRED` | Authentication token required |
| `INVALID_CREDENTIALS` | Invalid login credentials |
| `EMAIL_NOT_VERIFIED` | Email verification required |
| `PERMISSION_DENIED` | Insufficient permissions |
| `RESOURCE_NOT_FOUND` | Requested resource not found |
| `DUPLICATE_ENTRY` | Resource already exists |
| `RATE_LIMIT_EXCEEDED` | Too many requests |
| `SERVER_ERROR` | Internal server error |

## Rate Limiting

API endpoints are rate limited to prevent abuse:

- Authentication endpoints: 5 requests per minute
- General endpoints: 100 requests per minute
- File upload endpoints: 10 requests per minute

Rate limit headers are included in responses:
```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1640995200
```

## Pagination

List endpoints support pagination with the following parameters:

- `page`: Page number (default: 1)
- `page_size`: Items per page (default: 20, max: 100)

Pagination information is included in the response:
```json
{
  "count": 150,
  "next": "http://localhost:8000/api/deals/?page=2",
  "previous": null,
  "results": [...]
}
```

## File Upload

File uploads use multipart/form-data encoding. Supported file types:

- Images: JPEG, PNG, GIF (max 10MB)
- Videos: MP4, MOV, AVI (max 100MB)
- Documents: PDF, DOC, DOCX (max 5MB)

Upload progress can be tracked using the `X-Upload-Progress` header.

## Webhooks

The API supports webhooks for real-time notifications:

- Deal status changes
- New deal invitations
- Payment updates
- Message notifications

Configure webhooks in your profile settings with a valid HTTPS endpoint.
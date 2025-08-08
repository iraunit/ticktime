# Design Document

## Overview

This design outlines the refactoring of the Django backend from a monolithic `core` app structure to a modular multi-app architecture. The refactoring will organize functionality into domain-specific Django apps while maintaining all existing functionality, API endpoints, and database relationships.

The current monolithic structure has all models, views, serializers, and URLs consolidated in a single `core` app, making it difficult to maintain and scale. The new structure will separate concerns into logical apps that align with business domains.

## Architecture

### Current Structure
```
backend/
├── core/
│   ├── models.py (all models)
│   ├── views.py (all views)
│   ├── serializers.py (all serializers)
│   ├── urls.py (all URLs)
│   ├── admin.py (all admin configs)
│   └── ... (other files)
└── backend/
    ├── settings.py
    └── urls.py
```

### Target Structure
```
backend/
├── authentication/
│   ├── models.py (User extensions, tokens)
│   ├── views.py (auth views)
│   ├── serializers.py (auth serializers)
│   ├── urls.py (auth URLs)
│   └── admin.py
├── users/
│   ├── models.py (User profile base)
│   ├── views.py (user management)
│   ├── serializers.py (user serializers)
│   ├── urls.py (user URLs)
│   └── admin.py
├── influencers/
│   ├── models.py (InfluencerProfile, SocialMediaAccount)
│   ├── views.py (influencer views)
│   ├── serializers.py (influencer serializers)
│   ├── urls.py (influencer URLs)
│   └── admin.py
├── brands/
│   ├── models.py (Brand model)
│   ├── views.py (brand views)
│   ├── serializers.py (brand serializers)
│   ├── urls.py (brand URLs)
│   └── admin.py
├── campaigns/
│   ├── models.py (Campaign model)
│   ├── views.py (campaign views)
│   ├── serializers.py (campaign serializers)
│   ├── urls.py (campaign URLs)
│   └── admin.py
├── deals/
│   ├── models.py (Deal model)
│   ├── views.py (deal views)
│   ├── serializers.py (deal serializers)
│   ├── urls.py (deal URLs)
│   └── admin.py
├── content/
│   ├── models.py (ContentSubmission model)
│   ├── views.py (content views)
│   ├── serializers.py (content serializers)
│   ├── urls.py (content URLs)
│   └── admin.py
├── messaging/
│   ├── models.py (Conversation, Message models)
│   ├── views.py (messaging views)
│   ├── serializers.py (messaging serializers)
│   ├── urls.py (messaging URLs)
│   └── admin.py
├── dashboard/
│   ├── views.py (dashboard views)
│   ├── serializers.py (dashboard serializers)
│   ├── urls.py (dashboard URLs)
│   └── admin.py
├── common/
│   ├── models.py (shared models/choices)
│   ├── utils.py (shared utilities)
│   ├── decorators.py (shared decorators)
│   ├── middleware.py (shared middleware)
│   └── cache_utils.py
└── backend/
    ├── settings.py (updated INSTALLED_APPS)
    └── urls.py (updated includes)
```

## Components and Interfaces

### 1. Authentication App
**Purpose:** Handle user authentication, registration, password management, and OAuth
**Models:** None (uses Django's User model)
**Key Views:** signup, login, logout, password reset, email verification, Google OAuth
**Dependencies:** users app for profile creation

### 2. Users App
**Purpose:** Base user management and profile operations
**Models:** None (extends Django's User model)
**Key Views:** user profile management, profile completion status
**Dependencies:** None (base app)

### 3. Influencers App
**Purpose:** Influencer-specific functionality and social media management
**Models:** InfluencerProfile, SocialMediaAccount
**Key Views:** influencer profile CRUD, social media account management, profile image/document uploads
**Dependencies:** users app (User model), brands app (for relationships)

### 4. Brands App
**Purpose:** Brand management and brand-related operations
**Models:** Brand
**Key Views:** brand CRUD operations, brand verification
**Dependencies:** users app (User model)

### 5. Campaigns App
**Purpose:** Campaign creation and management
**Models:** Campaign
**Key Views:** campaign CRUD, campaign listing, campaign filtering
**Dependencies:** brands app (Brand model)

### 6. Deals App
**Purpose:** Deal/collaboration management between influencers and campaigns
**Models:** Deal
**Key Views:** deal CRUD, deal actions (accept/reject), deal timeline, earnings tracking
**Dependencies:** influencers app (InfluencerProfile), campaigns app (Campaign)

### 7. Content App
**Purpose:** Content submission and management
**Models:** ContentSubmission
**Key Views:** content submission CRUD, content approval workflow
**Dependencies:** deals app (Deal model)

### 8. Messaging App
**Purpose:** Communication between brands and influencers
**Models:** Conversation, Message
**Key Views:** conversation management, message CRUD, WebSocket consumers
**Dependencies:** deals app (Deal model), users app (User model)

### 9. Dashboard App
**Purpose:** Analytics and dashboard functionality
**Models:** None (aggregates data from other apps)
**Key Views:** dashboard stats, performance metrics, notifications
**Dependencies:** All other apps for data aggregation

### 10. Common App
**Purpose:** Shared utilities, constants, and middleware
**Models:** Shared choices and constants
**Key Components:** decorators, middleware, cache utilities, file security
**Dependencies:** None (provides services to other apps)

## Data Models

### Model Distribution

#### Authentication App
- No models (uses Django's built-in User model)
- Handles token management through JWT

#### Users App
- Extends Django's User model functionality
- No additional models

#### Influencers App
```python
class InfluencerProfile(models.Model):
    user = models.OneToOneField('auth.User', ...)
    # ... existing fields

class SocialMediaAccount(models.Model):
    influencer = models.ForeignKey('influencers.InfluencerProfile', ...)
    # ... existing fields
```

#### Brands App
```python
class Brand(models.Model):
    # ... existing fields
```

#### Campaigns App
```python
class Campaign(models.Model):
    brand = models.ForeignKey('brands.Brand', ...)
    # ... existing fields
```

#### Deals App
```python
class Deal(models.Model):
    campaign = models.ForeignKey('campaigns.Campaign', ...)
    influencer = models.ForeignKey('influencers.InfluencerProfile', ...)
    # ... existing fields
```

#### Content App
```python
class ContentSubmission(models.Model):
    deal = models.ForeignKey('deals.Deal', ...)
    # ... existing fields
```

#### Messaging App
```python
class Conversation(models.Model):
    deal = models.OneToOneField('deals.Deal', ...)
    # ... existing fields

class Message(models.Model):
    conversation = models.ForeignKey('messaging.Conversation', ...)
    sender_user = models.ForeignKey('auth.User', ...)
    # ... existing fields
```

#### Common App
```python
# Shared constants and choices
INDUSTRY_CHOICES = [...]
PLATFORM_CHOICES = [...]
DEAL_STATUS_CHOICES = [...]
# ... other shared constants
```

## Error Handling

### Migration Strategy
1. **Create new apps** with proper structure
2. **Move models incrementally** using Django's migration system
3. **Use string references** for foreign keys to avoid circular imports
4. **Generate migrations** for each app in dependency order
5. **Test migrations** on a copy of production data

### Import Management
- Use string references for foreign keys: `models.ForeignKey('app.Model')`
- Import models using `from django.apps import apps` when needed in views
- Avoid circular imports by organizing dependencies properly

### URL Routing
- Maintain existing URL patterns by including app URLs with proper prefixes
- Use namespacing to avoid URL name conflicts
- Ensure all existing endpoints remain accessible

## Testing Strategy

### Migration Testing
1. **Create database backup** before migration
2. **Test migrations** on development environment
3. **Verify data integrity** after migration
4. **Test rollback procedures** if needed

### Functionality Testing
1. **Run existing test suite** to ensure no regressions
2. **Test API endpoints** to verify they still work
3. **Test inter-app relationships** and foreign key constraints
4. **Test import statements** and circular dependency resolution

### Integration Testing
1. **Test complete user workflows** (registration, profile creation, deal flow)
2. **Test WebSocket functionality** for messaging
3. **Test file uploads** and media handling
4. **Test authentication flows** across all apps

### Performance Testing
1. **Benchmark API response times** before and after refactoring
2. **Test database query performance** with new model structure
3. **Verify caching** still works correctly
4. **Test rate limiting** and middleware functionality

## Implementation Phases

### Phase 1: Create App Structure
- Create all new Django apps
- Set up basic app structure (models.py, views.py, etc.)
- Update INSTALLED_APPS in settings

### Phase 2: Move Shared Components
- Move common utilities to common app
- Move middleware and decorators
- Update imports across the codebase

### Phase 3: Move Models
- Move models to appropriate apps using string references
- Generate and apply migrations
- Test model relationships

### Phase 4: Move Views and Serializers
- Move views to appropriate apps
- Move serializers to appropriate apps
- Update import statements

### Phase 5: Update URL Configuration
- Create URL patterns for each app
- Update main urls.py to include app URLs
- Test all endpoints

### Phase 6: Update Admin and Tests
- Move admin configurations
- Update test imports and references
- Run comprehensive test suite

### Phase 7: Final Cleanup
- Remove old core app
- Clean up unused imports
- Update documentation
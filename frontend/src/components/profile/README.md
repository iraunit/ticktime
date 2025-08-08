# Profile Management Components

This directory contains all the components related to profile management functionality for the InfluencerConnect platform.

## Components

### ProfileForm
**File:** `profile-form.tsx`

A comprehensive form component for editing personal information including:
- First name and last name
- Phone number
- Industry selection
- Bio (with character count)
- Address for product delivery
- Profile image upload

**Features:**
- Real-time form validation using Zod schema
- Image upload with drag-and-drop support
- Form state management with React Hook Form
- Success/error message handling
- Dirty state tracking to prevent unnecessary saves

### SocialAccountsManager
**File:** `social-accounts-manager.tsx`

Manages social media accounts with full CRUD operations:
- Add new social media accounts
- Edit existing accounts
- Delete accounts with confirmation
- Support for all major platforms (Instagram, YouTube, TikTok, etc.)

**Features:**
- Platform-specific validation
- Engagement metrics tracking
- Follower statistics
- Verification status
- Prevents duplicate platform entries
- Responsive design for mobile and desktop

### DocumentUpload
**File:** `document-upload.tsx`

Handles identity verification document uploads:
- Aadhar number input with formatting
- Document file upload (PDF, DOC, images)
- Verification status tracking
- File validation and security checks

**Features:**
- Drag-and-drop file upload
- File type and size validation
- Aadhar number formatting and validation
- Upload progress and status tracking
- Security guidelines and instructions

### ProfileCompletion
**File:** `profile-completion.tsx`

Visual progress indicator showing profile completion status:
- Weighted completion percentage
- Individual section status
- Interactive navigation to incomplete sections
- Completion recommendations

**Features:**
- Dynamic progress calculation
- Color-coded completion status
- Click-to-navigate functionality
- Completion tips and guidance

### ImageUpload
**File:** `image-upload.tsx`

Reusable image upload component with:
- Drag-and-drop support
- Image preview
- File validation
- Error handling

**Features:**
- Multiple file format support
- Size validation
- Preview functionality
- Remove/replace functionality

## Usage

```tsx
import { 
  ProfileForm, 
  SocialAccountsManager, 
  DocumentUpload, 
  ProfileCompletion 
} from '@/components/profile';

// Use in your profile page
<ProfileForm profile={profileData} />
<SocialAccountsManager />
<DocumentUpload profile={profileData} />
<ProfileCompletion 
  profile={profileData} 
  socialAccounts={socialAccountsData}
  onSectionClick={handleSectionClick}
/>
```

## Dependencies

- `react-hook-form` - Form state management
- `@hookform/resolvers` - Form validation resolvers
- `zod` - Schema validation
- `@tanstack/react-query` - Data fetching and caching
- ShadCN UI components for consistent styling

## API Integration

All components integrate with the backend API through:
- `useProfile()` hook for profile data
- `useSocialAccounts()` hook for social media data
- Automatic data refetching after mutations
- Error handling and loading states

## Validation

### Profile Form Validation
- First/last name: Required, max 50 characters
- Phone: 10-15 digits
- Bio: Max 500 characters
- Address: Min 10 characters, max 200
- Industry: Required selection

### Social Account Validation
- Platform: Required, no duplicates
- Handle: Required, max 100 characters
- Profile URL: Valid URL format
- Followers: Non-negative number
- Engagement rate: 0-100%

### Document Validation
- Aadhar number: Exactly 12 digits
- File types: PDF, DOC, DOCX, images
- File size: Max 50MB
- Security checks for file content

## Responsive Design

All components are fully responsive with:
- Mobile-first design approach
- Tablet and desktop optimizations
- Touch-friendly interactions
- Accessible form controls

## Accessibility

Components follow accessibility best practices:
- Proper ARIA labels
- Keyboard navigation support
- Screen reader compatibility
- Color contrast compliance
- Focus management

## Error Handling

Comprehensive error handling includes:
- Form validation errors
- API error responses
- Network error handling
- File upload errors
- User-friendly error messages

## Performance

Optimizations include:
- Lazy loading of components
- Efficient re-rendering with React.memo
- Debounced form validation
- Optimistic updates for better UX
- Image optimization for uploads
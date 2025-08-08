# Dashboard Components

This directory contains all the components for the influencer dashboard interface.

## Components

### `DashboardStatsGrid`
Displays key statistics in a responsive grid layout:
- Total invitations
- Active deals
- Completed deals
- Total earnings
- This month earnings
- Collaboration rate

**Features:**
- Responsive grid (1 column on mobile, 2 on tablet, 3 on desktop)
- Loading states with skeleton animations
- Color-coded cards for different metrics
- Trend indicators for earnings

### `StatsCard`
Individual statistic card component with:
- Icon and title
- Main value display
- Optional description
- Optional trend indicator
- Customizable styling

### `RecentDeals`
Shows recent deal invitations with:
- Deal invitation cards
- Accept/reject functionality
- Status indicators
- Responsive layout
- Empty state for no deals

### `DealInvitationCard`
Individual deal card displaying:
- Brand logo and information
- Deal title and description
- Deal value and type
- Application deadline with urgency indicators
- Action buttons (View Details, Accept, Decline)
- Status badges

**Features:**
- Responsive design for mobile and desktop
- Urgency indicators for approaching deadlines
- Expired deal handling
- Loading states for actions

### `NotificationCenter`
Real-time notification display with:
- Unread count badge
- Different notification types (deal, message, payment, system)
- Mark as read functionality
- Expandable list (show more/less)
- Dismiss notifications
- Action links for relevant notifications

**Notification Types:**
- `deal_invitation`: New collaboration invitations
- `deal_update`: Status changes in existing deals
- `message`: New messages from brands
- `payment`: Payment-related notifications
- `system`: Platform notifications

### `QuickActions`
Quick access buttons for common actions:
- Complete Profile
- Browse Deals
- Messages
- Analytics

## Usage

```tsx
import { 
  DashboardStatsGrid,
  RecentDeals,
  NotificationCenter,
  QuickActions 
} from "@/components/dashboard";

// In your dashboard page
<DashboardStatsGrid stats={stats} isLoading={isLoading} />
<RecentDeals 
  deals={deals} 
  onAcceptDeal={handleAccept}
  onRejectDeal={handleReject}
/>
<NotificationCenter 
  notifications={notifications}
  onMarkAsRead={handleMarkAsRead}
/>
<QuickActions />
```

## Features

### Responsive Design
- Mobile-first approach
- Adaptive layouts for different screen sizes
- Touch-friendly interactions on mobile

### Loading States
- Skeleton animations for loading content
- Disabled states for interactive elements
- Loading indicators for async actions

### Error Handling
- Graceful error states
- Retry mechanisms
- User-friendly error messages

### Real-time Updates
- Auto-refresh functionality (30-second intervals)
- Manual refresh option
- Optimistic updates for user actions

### Accessibility
- Proper ARIA labels
- Keyboard navigation support
- Screen reader friendly
- High contrast support

## Demo

A demo version is available at `/dashboard/demo` with mock data to showcase all components and interactions.

## Dependencies

- Next.js 15.4.4
- React 19.1.0
- Tailwind CSS 4
- Lucide React (icons)
- React Query (data fetching)
- ShadCN UI components
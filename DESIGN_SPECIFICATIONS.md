# ElectWatch Admin Console - Design Specifications

## Project Overview
ElectWatch is an Elections Intelligence Platform providing real-time monitoring and observation of electoral processes. The Admin Console serves as the central command center for managing observers, reports, incidents, and real-time polling data.

## Design System

### Color Palette

#### Background Colors
- **Primary Background**: `#030712` (Dark Navy/Gray-950)
- **Secondary Background**: `#111827` (Gray-900)
- **Tertiary Background**: `#1F2937` (Gray-800)
- **Hover State**: `#374151` (Gray-700)

#### Status Colors
- **Active/Live**: `#10B981` (Green-500)
- **Critical/Warning**: `#EF4444` (Red-500)
- **Alert**: `#F59E0B` (Amber-500)
- **Info**: `#3B82F6` (Blue-600)

#### Text Colors
- **Primary Text**: `#FFFFFF` (White)
- **Secondary Text**: `#D1D5DB` (Gray-300)
- **Tertiary Text**: `#9CA3AF` (Gray-400)
- **Disabled Text**: `#6B7280` (Gray-500)

### Typography

- **Font Family**: System default (sans-serif)
- **Headings**: Font weight 700 (Bold)
  - H1: 48px (3rem)
  - H2: 36px (2.25rem)
  - H3: 24px (1.5rem)
  - H4: 20px (1.25rem)
- **Body Text**: Font weight 400 (Regular)
  - Large: 18px (1.125rem)
  - Standard: 16px (1rem)
  - Small: 14px (0.875rem)
  - Extra Small: 12px (0.75rem)

### Spacing System
- Base unit: 4px
- Common values: 4, 8, 12, 16, 24, 32, 48, 64, 96px

### Border & Shadows
- **Border Radius**: 8px (standard)
- **Border Color**: Gray-700 with 30% opacity
- **Shadow**: `0 4px 6px rgba(0, 0, 0, 0.3)`

## Layout Structure

### Sidebar Navigation
- **Width**: 384px (96 units)
- **Position**: Fixed left
- **Content**:
  1. Logo Section (96px height)
  2. Status Box (Polls Open/Closed)
  3. Navigation Menu (scrollable)
  4. User Profile Section (56px height)

### Main Content Area
- **Header**: 120px height with live status indicator
- **Body**: Full width minus sidebar, scrollable
- **Padding**: 32px (8 units)

## Component Specifications

### 1. Sidebar Component
**Purpose**: Primary navigation and system status display

**Elements**:
- Logo with branding
- Live poll status indicator
- Menu items with icons and labels
- Submenu for "User Management"
- Badge support for notifications/LIVE status
- User profile card at bottom

**States**:
- Normal
- Hover (background color change)
- Active (highlighted menu item)
- Expanded submenu

### 2. Header Component
**Purpose**: Main heading with live status and date/time

**Elements**:
- Live monitoring status indicator
- Main title: "Election Command Center"
- Subtitle with election context
- Real-time date display (formatted: "Saturday, Aug 30, 2025")
- Real-time clock (format: "HH:MM:SS WAT")
- Polling status indicator

### 3. Metric Cards
**Purpose**: Display key performance indicators

**Layout**: 4-column grid (responsive to 2-column on tablet, 1-column on mobile)

**Card Structure**:
- Icon (emoji or SVG)
- Main value (large, bold number)
- Label (medium text)
- Optional subtitle (small text)
- Optional trend indicator (+/- with direction color)

**Variants**:
- Default (Gray)
- Warning (Yellow/Amber tint)
- Success (Green tint)
- Info (Blue tint)

**Metrics Displayed**:
1. Total Reports: 312 (+23 this hour)
2. Active Observers: 213 (of 274 deployed)
3. Open Incidents: 41 (8 critical)
4. Polling Units: 847 (94.2% covered)

### 4. Activity Chart
**Purpose**: Visualize hourly breakdown of incidents and reports

**Chart Type**: Line or bar chart
**Data Points**: Hourly from 07:00 to current hour
**Metrics**:
- Red line: Incidents
- Blue line: Reports
**Y-axis**: Count (0-320)
**X-axis**: Time (hourly)

### 5. Recent Activity Lists
**Purpose**: Display recent incidents and reports

**Layout**: Two-column grid

**List Items**:
- Status indicator (colored dot)
- Title/description
- Timestamp (relative: "5 minutes ago")
- Optional severity badge

**Incident Variants**:
- Red dot: Critical
- Orange dot: High
- Yellow dot: Medium
- Gray dot: Low

**Report Status**:
- Green dot: Submitted/OK
- Blue dot: In review
- Gray dot: Archived

## Responsive Design

### Breakpoints
- **Mobile**: < 768px
  - Sidebar: Hidden or drawer-based
  - Metrics: 1 column
  - Activity Lists: Stacked vertically
  
- **Tablet**: 768px - 1024px
  - Sidebar: Collapsed or side drawer
  - Metrics: 2 columns
  - Activity Lists: 1 column

- **Desktop**: 1024px+
  - Sidebar: Full width (384px)
  - Metrics: 4 columns
  - Activity Lists: 2 columns

## Animation & Interactions

### Transitions
- Default transition duration: 150ms
- Easing: cubic-bezier(0.4, 0, 0.2, 1)

### Animations
- Pulse animation for live indicators (continuous)
- Smooth color transitions on hover
- Slide-in for submenus
- Fade for modal overlays

### Loading States
- Skeleton screens for content blocks
- Spinner icon with "Loading..." text
- Disabled state for buttons during API calls

### Error States
- Red bordered containers
- Error icon and message
- Retry button option

## API Integration Points

### Dashboard Endpoints
- `GET /api/dashboard/metrics` - Get all KPI metrics
- `GET /api/dashboard/incidents` - Get recent incidents
- `GET /api/dashboard/reports` - Get recent reports
- `GET /api/dashboard/activity-chart` - Get hourly activity data
- `GET /api/dashboard/status` - Get polling status

### User Management Endpoints
- `GET /api/users` - List users with pagination
- `GET /api/observers` - List observers with filters
- `GET /api/roles` - List roles
- `GET /api/permissions` - List permissions

### Real-time Updates
- WebSocket connection for live data updates
- Server-sent events for notifications
- Auto-refresh interval: 30 seconds

## Accessibility

### ARIA Labels
- Navigation buttons: `aria-label="Dashboard"`
- Status indicators: `aria-label="Live Monitoring"`
- Badge counts: `aria-label="4 new messages"`

### Keyboard Navigation
- Tab order follows visual flow
- Enter to activate buttons
- Arrow keys for menu navigation
- Escape to close modals/submenus

### Color Contrast
- Minimum WCAG AA (4.5:1) for text
- Status indicators supplemented with icons

## Implementation Stack

- **Framework**: React 18+ with TypeScript
- **Styling**: Tailwind CSS 3+
- **HTTP Client**: Axios
- **State Management**: React Hooks
- **Charts**: Recharts or Chart.js
- **Icons**: Emoji or custom SVG

## File Structure
```
src/
├── api/
│   ├── client.ts          # Axios client configuration
│   ├── dashboard.ts       # Dashboard endpoints
│   └── admin.ts           # User/Role/Permission endpoints
├── components/
│   ├── Layout/
│   │   ├── AdminLayout.tsx    # Main layout wrapper
│   │   ├── Sidebar.tsx        # Navigation sidebar
│   │   └── Header.tsx         # Top header
│   └── Dashboard/
│       └── MetricCard.tsx     # Metric card component
├── hooks/
│   └── useDashboardData.ts    # Dashboard data fetching hook
├── pages/
│   └── Dashboard.tsx          # Dashboard page
└── types/
    └── dashboard.ts           # TypeScript type definitions
```

## Performance Considerations

- Lazy load images and charts
- Implement virtual scrolling for long lists
- Cache API responses (30-second TTL)
- Use React.memo for metric cards
- Optimize chart rendering with proper key props
- Debounce real-time updates (500ms)

## Security Considerations

- Bearer token authentication for all API calls
- CSRF protection via headers
- XSS prevention through React's built-in escaping
- Secure session storage (httpOnly cookies)
- Role-based access control (RBAC) enforcement

# ElectWatch Admin Console - UI/UX Implementation

> A modern, responsive admin dashboard for real-time election monitoring and observation

## 📋 Overview

ElectWatch Admin Console is a React-based Progressive Web App (PWA) providing a comprehensive interface for managing election observation, reports, incidents, and personnel. Built with TypeScript and styled with Tailwind CSS, it delivers a professional dark-themed dashboard with real-time data visualization.

## ✨ Features

- **📊 Real-time Dashboard**: Live metrics for reports, observers, incidents, and polling units
- **🎨 Modern Design**: Dark theme with intuitive Tailwind CSS styling
- **📱 Responsive Layout**: Adaptive design for mobile, tablet, and desktop
- **🔄 Live Updates**: Auto-refresh metrics every 30 seconds
- **🎯 Modular Components**: Reusable, well-typed React components
- **🔐 Secure API Integration**: Token-based authentication and error handling
- **⚡ Performance Optimized**: Code splitting, memoization, and efficient rendering

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- npm or yarn

### Installation

```bash
cd "EIP PWA"
npm install
```

### Configuration

Create `.env.local`:

```env
VITE_API_URL=http://localhost:8000
VITE_APP_NAME=ElectWatch
```

### Running

```bash
# Development
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

Visit `http://localhost:5173` to see the dashboard.

## 📁 Project Structure

### `/src/api/`
API integration layer with typed endpoints:
- `client.ts` - Axios configuration with interceptors
- `dashboard.ts` - Dashboard metrics and activity endpoints
- `admin.ts` - User, observer, role, and permission management

### `/src/components/`
Reusable React components:
- `Layout/` - Main layout, sidebar, header
- `Dashboard/` - Metric cards and dashboard-specific components
- `UI/` - Generic UI components (buttons, badges, alerts)

### `/src/hooks/`
Custom React hooks:
- `useDashboardData.ts` - Dashboard data fetching with auto-refresh
- `useAPI.ts` - Generic API hook for any endpoint
- (TODO) `useAuth.ts` - Authentication state management

### `/src/pages/`
Page-level components:
- `Dashboard.tsx` - Main dashboard page
- (TODO) Additional pages for observers, users, roles

### `/src/utils/`
Utility functions:
- `formatting.ts` - Date, time, and number formatting
- `validation.ts` - Form and input validation

## 🎨 Design System

### Color Palette

```
Primary Background:    #030712 (Gray-950)
Secondary Background:  #111827 (Gray-900)
Tertiary Background:   #1F2937 (Gray-800)

Active/Live:          #10B981 (Green-500)
Warning/Critical:     #EF4444 (Red-500)
Alert:               #F59E0B (Amber-500)
Info:                #3B82F6 (Blue-600)

Text Primary:        #FFFFFF (White)
Text Secondary:      #D1D5DB (Gray-300)
Text Tertiary:       #9CA3AF (Gray-400)
```

### Components

#### Sidebar Navigation
- Fixed left sidebar with logo and menu
- Expandable submenu for User Management
- Status indicators and notification badges
- User profile section at bottom

#### Header
- Live monitoring status indicator
- Main title and subtitle
- Real-time date/time display
- Polling status

#### Metrics Grid
- 4-column responsive grid
- Icon, value, label, and optional trend
- Multiple color variants (default, warning, success, info)

#### Activity Chart
- Hourly breakdown of incidents and reports
- Tabbed interface for switching metrics
- Placeholder for chart library integration

#### UI Components
- **Button**: Multiple variants and sizes
- **Badge**: Status indicators
- **StatusIndicator**: Animated live status
- **Alert**: Info, success, warning, error states
- **Tabs**: Tabbed navigation

## 🔌 API Integration

### Endpoints

#### Dashboard
```
GET /api/dashboard/metrics       → Metrics data
GET /api/dashboard/incidents     → Recent incidents
GET /api/dashboard/reports       → Recent reports
GET /api/dashboard/activity-chart → Hourly activity
GET /api/dashboard/status        → System status
```

#### Admin
```
GET /api/users                   → List users (paginated)
POST /api/users                  → Create user
PUT /api/users/{id}              → Update user
DELETE /api/users/{id}           → Delete user

GET /api/observers               → List observers (paginated)
GET /api/observers/{id}          → Observer details
POST /api/observers/{id}/assign  → Assign to polling unit

GET /api/roles                   → List roles
GET /api/permissions             → List permissions
```

### Usage Example

```typescript
import { dashboardAPI } from '@/api/dashboard';

// Single fetch
const metrics = await dashboardAPI.getMetrics();

// With hook
const { data, loading, error, refetch } = useDashboardData();

// Generic API hook
const { data, execute } = useAPI(
  () => observersAPI.getObservers(1, 20)
);
```

## 🧩 Component Examples

### Using Dashboard Layout

```tsx
import { AdminLayout } from '@/components/Layout';
import { MetricsGrid } from '@/components/Dashboard/MetricCard';

export default function MyPage() {
  return (
    <AdminLayout>
      <MetricsGrid metrics={[...]} />
    </AdminLayout>
  );
}
```

### Using Custom Hooks

```tsx
import { useDashboardData } from '@/hooks/useDashboardData';

export default function Dashboard() {
  const { data, loading, error } = useDashboardData();
  
  if (loading) return <div>Loading...</div>;
  return <div>{data?.totalReports}</div>;
}
```

### Using UI Components

```tsx
import { Button, Badge, Alert, StatusIndicator } from '@/components/UI';

export default function Example() {
  return (
    <>
      <Button variant="primary" onClick={() => {}}>
        Click me
      </Button>
      
      <Badge variant="success">Active</Badge>
      
      <StatusIndicator status="active" label="Live" />
      
      <Alert variant="info" title="Information">
        This is an info alert
      </Alert>
    </>
  );
}
```

## 🎨 Styling with Tailwind CSS

### Color Classes

```tsx
// Background
<div className="bg-gray-950">        {/* Dark background */}
<div className="bg-green-500 bg-opacity-20">  {/* Transparent green */}

// Text
<span className="text-white text-xl font-bold">
<span className="text-gray-400 text-sm">

// Borders and Shadows
<div className="border border-gray-700 rounded-lg shadow-lg">
```

### Responsive Classes

```tsx
// 4 columns on desktop, 2 on tablet, 1 on mobile
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">

// Hide on mobile, show on desktop
<div className="hidden md:block">Desktop only</div>
```

## 🔐 Authentication

Token-based authentication is automatically handled:

```typescript
// Token stored in localStorage
localStorage.setItem('auth_token', token);

// Automatically included in all API requests
Authorization: Bearer {token}

// Auto-redirects to login on 401 errors
```

## 📊 Data Flow

```
Component
  ↓
Hook (useDashboardData)
  ↓
API (dashboardAPI.getMetrics)
  ↓
HTTP Client (apiClient.get)
  ↓
Axios Interceptors
  ↓
Backend API
```

## 🧪 Testing

### Component Testing

```typescript
import { render, screen } from '@testing-library/react';
import Dashboard from '@/pages/Dashboard';

test('displays metrics', () => {
  render(<Dashboard />);
  expect(screen.getByText('Total Reports')).toBeInTheDocument();
});
```

### API Testing

```typescript
jest.mock('@/api/dashboard');

test('fetches metrics', async () => {
  dashboardAPI.getMetrics.mockResolvedValue({ totalReports: 312 });
  const data = await dashboardAPI.getMetrics();
  expect(data.totalReports).toBe(312);
});
```

## ⚡ Performance

### Optimizations
- Code splitting with React.lazy
- Component memoization with React.memo
- useCallback for event handlers
- Efficient state management with hooks
- Image lazy loading
- CSS optimization via Tailwind

### Metrics
- First Contentful Paint (FCP): < 2s
- Time to Interactive (TTI): < 3s
- Lighthouse Performance Score: > 85

## 🚀 Deployment

### Build for Production

```bash
npm run build
```

### Environment Variables (Production)

```env
VITE_API_URL=https://api.electwatch.ng
VITE_APP_NAME=ElectWatch
VITE_SENTRY_DSN=...
```

### Hosting Options
- Vercel
- Netlify
- AWS S3 + CloudFront
- Docker + Kubernetes

## 📚 Documentation

- [Design Specifications](../DESIGN_SPECIFICATIONS.md) - Complete design system
- [Implementation Guide](../IMPLEMENTATION_GUIDE.md) - Developer guide
- [API Endpoints](../DESIGN_SPECIFICATIONS.md#api-integration-points) - Backend requirements

## 🛠️ Development

### Available Scripts

```bash
npm run dev      # Start dev server
npm run build    # Build for production
npm run preview  # Preview production build
npm run lint     # Run ESLint
npm run test     # Run tests
npm run format   # Format code with Prettier
```

### Git Workflow

```bash
# Create feature branch
git checkout -b feature/component-name

# Make changes
git add .
git commit -m "feat: add component"

# Push and create PR
git push origin feature/component-name
```

## 🐛 Troubleshooting

| Issue | Solution |
|-------|----------|
| API requests failing | Check VITE_API_URL and backend server |
| Styles not applying | Verify Tailwind config and CSS imports |
| Components not rendering | Check console for errors and prop types |
| 401 Unauthorized | Verify auth token in localStorage |
| Build errors | Delete node_modules and reinstall dependencies |

## 📝 License

This project is part of the Elections Intelligence Platform. See LICENSE file for details.

## 👥 Contributing

1. Follow the design system
2. Write TypeScript with proper types
3. Create reusable components
4. Add unit tests for new features
5. Update documentation

## 🤝 Support

For issues and questions:
1. Check existing documentation
2. Search GitHub issues
3. Create new issue with details
4. Contact development team

---

**Built with ❤️ for transparent elections**

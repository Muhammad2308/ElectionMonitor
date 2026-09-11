# ElectWatch Admin Console - Implementation Guide

## Quick Start

### 1. Project Setup

#### Prerequisites
- Node.js 18+ 
- npm or yarn
- React 18+
- TypeScript 5+

#### Installation

```bash
cd "EIP PWA"
npm install
```

#### Environment Configuration

Create a `.env.local` file in the `EIP PWA` root:

```env
VITE_API_URL=http://localhost:8000
VITE_APP_NAME=ElectWatch
VITE_APP_VERSION=1.0.0
```

### 2. Running the Application

```bash
# Development server
npm run dev

# Production build
npm run build

# Preview production build
npm run preview
```

### 3. Directory Structure

```
EIP PWA/src/
├── api/                           # API integration layer
│   ├── client.ts                  # Axios configuration
│   ├── dashboard.ts               # Dashboard endpoints
│   └── admin.ts                   # User/Role/Permission endpoints
│
├── components/                    # Reusable React components
│   ├── Layout/
│   │   ├── AdminLayout.tsx        # Main layout wrapper
│   │   ├── Sidebar.tsx            # Navigation sidebar
│   │   └── Header.tsx             # Header with status
│   │
│   ├── Dashboard/
│   │   └── MetricCard.tsx         # Metric display cards
│   │
│   └── UI/
│       └── index.tsx              # Reusable UI components (Button, Badge, etc.)
│
├── hooks/                         # Custom React hooks
│   ├── useDashboardData.ts        # Dashboard data fetching
│   ├── useAPI.ts                  # Generic API hook
│   └── useAuth.ts                 # Authentication hook (TODO)
│
├── pages/                         # Page components
│   ├── Dashboard.tsx              # Main dashboard page
│   ├── Observers.tsx              # Observer management (TODO)
│   ├── Users.tsx                  # User management (TODO)
│   ├── Roles.tsx                  # Role management (TODO)
│   └── Map.tsx                    # Map view (TODO)
│
├── types/                         # TypeScript type definitions
│   └── index.ts                   # Global types
│
├── utils/                         # Utility functions
│   ├── formatting.ts              # Date/time formatting
│   └── validation.ts              # Input validation
│
├── store/                         # State management (if using Redux/Zustand)
│   └── index.ts
│
└── App.tsx                        # Root component
```

## Component Usage Examples

### 1. Using the Dashboard Layout

```tsx
import AdminLayout from '../components/Layout/AdminLayout';
import { MetricsGrid } from '../components/Dashboard/MetricCard';

export const MyPage = () => {
  const metrics = [
    {
      icon: '📋',
      value: 312,
      label: 'Total Reports',
      variant: 'default' as const,
    },
    // ... more metrics
  ];

  return (
    <AdminLayout>
      <MetricsGrid metrics={metrics} />
      {/* Your content here */}
    </AdminLayout>
  );
};
```

### 2. Using the Dashboard Hook

```tsx
import { useDashboardData } from '../hooks/useDashboardData';

export const Dashboard = () => {
  const { data, loading, error, refetch } = useDashboardData();

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;

  return <div>{data?.totalReports}</div>;
};
```

### 3. Using API Helpers

```tsx
import { observersAPI } from '../api/admin';
import { useAPI } from '../hooks/useAPI';

export const ObserversList = () => {
  const { data: observers, loading, error } = useAPI(
    () => observersAPI.getObservers(1, 20)
  );

  return (
    <div>
      {observers?.map(observer => (
        <div key={observer.id}>{observer.name}</div>
      ))}
    </div>
  );
};
```

### 4. Using UI Components

```tsx
import { Button, Badge, Alert, StatusIndicator } from '../components/UI';

export const Example = () => {
  return (
    <div>
      <Button variant="primary">Click me</Button>
      <Badge variant="success">Active</Badge>
      <StatusIndicator status="active" label="Live" />
      <Alert variant="info" title="Info">
        This is an informational alert
      </Alert>
    </div>
  );
};
```

## API Integration

### Base URL Configuration

The API base URL is configured via environment variable `VITE_API_URL`. 

### Authentication

The API client automatically includes the Bearer token from localStorage:

```typescript
const token = localStorage.getItem('auth_token');
// Token is automatically added to all requests as:
// Authorization: Bearer {token}
```

### Error Handling

Errors are automatically handled by the interceptor:
- 401 errors: Clears auth token and redirects to login
- Other errors: Passed to the caller for handling

### Example API Call

```typescript
import { dashboardAPI } from '../api/dashboard';

const metrics = await dashboardAPI.getMetrics();
// Returns: { totalReports: 312, activeObservers: 213, ... }
```

## Styling with Tailwind CSS

### Color Utilities

```tsx
// Background colors
<div className="bg-gray-950">Dark background</div>
<div className="bg-green-500 bg-opacity-20">Green with opacity</div>

// Text colors
<span className="text-white text-xl font-bold">Title</span>
<span className="text-gray-400 text-sm">Subtitle</span>

// Border and shadow
<div className="border border-gray-700 rounded-lg shadow-lg">Card</div>
```

### Responsive Classes

```tsx
// Grid that changes based on screen size
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
  {/* 1 column on mobile, 2 on tablet, 4 on desktop */}
</div>

// Hide on mobile
<div className="hidden md:block">Desktop only</div>

// Show only on mobile
<div className="md:hidden">Mobile only</div>
```

### Common Patterns

```tsx
// Card style
<div className="bg-gray-800 border border-gray-700 rounded-lg p-6">
  <h3 className="text-lg font-bold text-white mb-4">Card Title</h3>
  <p className="text-gray-400">Card content</p>
</div>

// Button style
<button className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold transition-colors">
  Click me
</button>

// Badge style
<span className="inline-block px-3 py-1 bg-green-700 text-green-100 text-xs font-semibold rounded-full">
  Active
</span>
```

## State Management

### Using React Hooks (Current Approach)

For simple state, use React hooks:

```typescript
const [isOpen, setIsOpen] = useState(false);
const [data, setData] = useState<Data | null>(null);
```

### For Complex State (Future)

Consider implementing Redux or Zustand for complex state:

```typescript
// Example with Zustand
import create from 'zustand';

const useStore = create((set) => ({
  data: null,
  setData: (newData) => set({ data: newData }),
}));
```

## Testing

### Component Testing

```typescript
import { render, screen } from '@testing-library/react';
import Dashboard from '../pages/Dashboard';

describe('Dashboard', () => {
  it('should display metrics', () => {
    render(<Dashboard />);
    expect(screen.getByText('Total Reports')).toBeInTheDocument();
  });
});
```

### API Testing

```typescript
import { dashboardAPI } from '../api/dashboard';

jest.mock('../api/dashboard');

describe('Dashboard API', () => {
  it('should fetch metrics', async () => {
    dashboardAPI.getMetrics.mockResolvedValue({ totalReports: 312 });
    const metrics = await dashboardAPI.getMetrics();
    expect(metrics.totalReports).toBe(312);
  });
});
```

## Performance Optimization

### 1. Code Splitting

```typescript
import { lazy, Suspense } from 'react';

const Dashboard = lazy(() => import('../pages/Dashboard'));

function App() {
  return (
    <Suspense fallback={<Loading />}>
      <Dashboard />
    </Suspense>
  );
}
```

### 2. Memoization

```typescript
import { memo } from 'react';

const MetricCard = memo(({ icon, value, label }) => {
  return <div>...</div>;
});
```

### 3. useCallback for Event Handlers

```typescript
const handleRefresh = useCallback(() => {
  refetch();
}, [refetch]);
```

## Security Best Practices

1. **Keep tokens secure**
   - Store in localStorage or secure cookies (httpOnly)
   - Include in Authorization header

2. **Input validation**
   - Validate all user inputs before API calls
   - Use TypeScript for type safety

3. **CORS Configuration**
   - Ensure backend has proper CORS headers set
   - Only allow requests from trusted origins

4. **Sensitive data**
   - Don't log credentials
   - Use HTTPS in production
   - Clear tokens on logout

## Troubleshooting

### Issue: API requests failing with 401
**Solution**: Check if auth token is properly stored in localStorage and included in headers

### Issue: Styles not applying
**Solution**: Ensure Tailwind CSS is configured in `tailwind.config.js` and imported in your CSS

### Issue: Components not rendering
**Solution**: Check React DevTools for prop errors and console for JavaScript errors

## Backend API Requirements

The backend should implement the following endpoints:

### Dashboard Endpoints
- `GET /api/dashboard/metrics` - Returns dashboard metrics
- `GET /api/dashboard/incidents` - Returns list of incidents
- `GET /api/dashboard/reports` - Returns list of reports
- `GET /api/dashboard/activity-chart` - Returns hourly activity data
- `GET /api/dashboard/status` - Returns system status

### Admin Endpoints
- `GET /api/users` - List users (paginated)
- `GET /api/observers` - List observers (paginated)
- `GET /api/roles` - List roles
- `GET /api/permissions` - List permissions
- `POST /api/users` - Create user
- `PUT /api/users/{id}` - Update user
- `DELETE /api/users/{id}` - Delete user

See [DESIGN_SPECIFICATIONS.md](../DESIGN_SPECIFICATIONS.md) for complete API documentation.

## Next Steps

1. Implement remaining pages (Observers, Users, Roles, Map)
2. Add real-time WebSocket support for live updates
3. Implement charts using Recharts or Chart.js
4. Add unit and integration tests
5. Set up CI/CD pipeline
6. Deploy to production environment

## Support & Documentation

- [Design Specifications](../DESIGN_SPECIFICATIONS.md)
- [Tailwind CSS Documentation](https://tailwindcss.com)
- [React Documentation](https://react.dev)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)

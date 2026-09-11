# ElectWatch Admin Console - Laravel Backend Implementation

> Complete Laravel-based admin console matching the Figma design exactly

## 📋 Overview

This document covers the PHP/Laravel backend implementation of the ElectWatch Admin Console. The admin interface provides real-time election monitoring, observer management, incident tracking, and comprehensive reporting capabilities.

## ✨ Features Implemented

- **🎨 Tailwind CSS Styling**: Dark theme with exact Figma design implementation
- **📊 Real-time Dashboard**: Live metrics and activity displays
- **👥 Observer Management**: Full CRUD for observer deployment and tracking
- **📋 Report Management**: Review and approve observer reports
- **⚠ Incident Tracking**: Categorize and manage incidents by severity
- **🔐 Role-Based Access Control**: Admin, Observer, Moderator roles
- **📱 Responsive Layout**: Works on desktop, tablet, and mobile
- **🔄 Blade Templates**: Server-side rendering with Alpine.js for interactivity

## 🗂️ Project Structure

```
app/Http/Controllers/Admin/
├── DashboardController.php       # Dashboard metrics and overview
├── ObserverController.php        # Observer CRUD operations
├── RoleController.php            # Role management
├── PermissionController.php      # Permission management
├── IncidentController.php        # Incident tracking
└── ReportController.php          # Report management

resources/views/
├── layouts/
│   └── admin.blade.php          # Main layout template
├── admin/
│   ├── components/
│   │   ├── sidebar.blade.php        # Navigation sidebar
│   │   ├── header.blade.php         # Header with status
│   │   └── metric-card.blade.php    # Metric card component
│   ├── dashboard/
│   │   └── index.blade.php          # Dashboard page
│   ├── observers/
│   │   ├── index.blade.php          # Observers list
│   │   ├── create.blade.php         # Create observer
│   │   └── edit.blade.php           # Edit observer
│   ├── roles/
│   │   └── index.blade.php          # Roles management
│   ├── permissions/
│   │   └── index.blade.php          # Permissions list
│   ├── incidents/
│   │   ├── index.blade.php          # Incidents list
│   │   └── show.blade.php           # Incident details
│   ├── reports/
│   │   ├── index.blade.php          # Reports list
│   │   └── show.blade.php           # Report details
│   ├── map/
│   │   └── index.blade.php          # Map view (LIVE)
│   └── messages/
│       └── index.blade.php          # Messages page

routes/
├── web.php                       # Web routes
└── admin.php                     # Admin-specific routes
```

## 🚀 Getting Started

### Prerequisites
- Laravel 11+
- PHP 8.2+
- Tailwind CSS configured
- Node.js and npm

### Installation

1. **Copy files to your Laravel project**:
   - Controllers to `app/Http/Controllers/Admin/`
   - Blade templates to `resources/views/admin/` and `resources/views/layouts/`
   - Routes to `routes/`

2. **Install Tailwind CSS** (if not already installed):
   ```bash
   npm install -D tailwindcss postcss autoprefixer
   npx tailwindcss init -p
   ```

3. **Configure Tailwind** in `tailwind.config.js`:
   ```javascript
   export default {
     content: [
       "./resources/**/*.blade.php",
       "./resources/**/*.js",
     ],
     theme: {
       extend: {},
     },
     plugins: [],
   }
   ```

4. **Install Alpine.js** for interactivity:
   ```bash
   npm install alpinejs
   ```

5. **Add to `resources/css/app.css`**:
   ```css
   @tailwind base;
   @tailwind components;
   @tailwind utilities;
   ```

6. **Run Vite dev server**:
   ```bash
   npm run dev
   ```

7. **Start Laravel server**:
   ```bash
   php artisan serve
   ```

Visit `http://localhost:8000/admin` to access the admin console.

## 📄 Key Components

### 1. Admin Layout (`resources/views/layouts/admin.blade.php`)

Main wrapper that includes:
- Sidebar navigation
- Header with live status
- Main content area
- Tailwind CSS classes for dark theme

```blade
@extends('layouts.admin')

@section('content')
    <!-- Your page content -->
@endsection
```

### 2. Sidebar Component (`resources/views/admin/components/sidebar.blade.php`)

Features:
- Logo and branding
- Navigation menu with dropdowns
- Live polling status indicator
- User profile section
- Uses Alpine.js for menu toggling

### 3. Header Component (`resources/views/admin/components/header.blade.php`)

Displays:
- Live monitoring status indicator
- Real-time date and time (updates every second)
- Election title and overview
- Polling status

### 4. Metric Card Component (`resources/views/admin/components/metric-card.blade.php`)

Reusable component for displaying KPIs:

```blade
<x-metric-card
    icon="📋"
    :value="$metrics['totalReports']"
    label="Total Reports"
    subtitle="+23 this hour"
    variant="default"
    :trend="['value' => 23, 'direction' => 'up']"
/>
```

### 5. Dashboard Controller

```php
public function index(): View
{
    $metrics = [
        'totalReports' => 312,
        'activeObservers' => 213,
        'openIncidents' => 41,
        'pollingUnits' => 847,
    ];

    return view('admin.dashboard.index', [
        'metrics' => $metrics,
        'incidents' => $incidents,
        'reports' => $reports,
    ]);
}
```

## 🎨 Design System Implementation

### Color Classes (Tailwind CSS)

```
Primary Background:    bg-gray-950
Secondary Background:  bg-gray-900
Tertiary Background:   bg-gray-800
Borders:              border-gray-700

Active/Live:          bg-green-500, text-green-400
Warning:              bg-yellow-500, text-yellow-400
Critical:             bg-red-500, text-red-400
Info:                 bg-blue-500, text-blue-400
```

### Typography

```blade
<!-- Headings -->
<h1 class="text-5xl font-bold">Main Title</h1>
<h2 class="text-3xl font-bold">Section Title</h2>
<h3 class="text-xl font-bold">Card Title</h3>

<!-- Body Text -->
<p class="text-white">Primary text</p>
<p class="text-gray-400">Secondary text</p>
<p class="text-gray-500 text-sm">Tertiary text</p>
```

### Card Patterns

```blade
<div class="bg-gray-800 border border-gray-700 rounded-lg p-6">
    <h3 class="text-lg font-bold text-white mb-4">Card Title</h3>
    <p class="text-gray-400">Card content</p>
</div>
```

## 🔌 API Integration

### Dashboard API Endpoints

The backend provides API endpoints for the React frontend:

```
GET  /api/dashboard/metrics      → Dashboard KPI data
GET  /api/dashboard/incidents    → Recent incidents
GET  /api/dashboard/reports      → Recent reports
GET  /api/dashboard/activity-chart → Hourly activity
GET  /api/dashboard/status       → System status

GET  /api/observers              → List observers
GET  /api/observers/{id}         → Observer details
POST /api/observers              → Create observer
PUT  /api/observers/{id}         → Update observer
DELETE /api/observers/{id}       → Delete observer

GET  /api/users                  → List users
GET  /api/roles                  → List roles
GET  /api/permissions            → List permissions
```

### Example API Response

```json
{
    "totalReports": 312,
    "activeObservers": 213,
    "openIncidents": 41,
    "pollingUnits": 847,
    "status": "polling_in_progress",
    "pollingOpen": true
}
```

## 🔐 Authentication & Authorization

### Middleware Setup

Add auth middleware to admin routes:

```php
Route::middleware(['auth'])->prefix('admin')->group(function () {
    // Admin routes here
});
```

### Role-Based Access Control

```php
// Check user role
if (Auth::user()->hasRole('admin')) {
    // Admin actions
}

// Check permission
if (Auth::user()->can('manage_observers')) {
    // Perform action
}
```

## 📊 Data Models (To be created)

### User Model
```php
namespace App\Models;

class User extends Model
{
    protected $fillable = ['name', 'email', 'password', 'status'];
    
    public function role() { /* ... */ }
    public function permissions() { /* ... */ }
}
```

### Observer Model
```php
class Observer extends Model
{
    protected $fillable = ['user_id', 'polling_unit_id', 'state', 'lga', 'ward'];
    
    public function user() { /* ... */ }
    public function pollingUnit() { /* ... */ }
}
```

### Incident Model
```php
class Incident extends Model
{
    protected $fillable = ['title', 'description', 'severity', 'status', 'observer_id'];
    
    public function observer() { /* ... */ }
}
```

### Report Model
```php
class Report extends Model
{
    protected $fillable = ['title', 'content', 'observer_id', 'status'];
    
    public function observer() { /* ... */ }
}
```

## 🧪 Testing

### Blade Template Testing

```php
public function test_dashboard_displays_metrics()
{
    $response = $this->get('/admin');
    
    $response->assertSee('Total Reports');
    $response->assertSee('312');
}
```

### API Testing

```php
public function test_dashboard_api_returns_metrics()
{
    $response = $this->getJson('/api/dashboard/metrics');
    
    $response->assertStatus(200)
        ->assertJsonStructure(['totalReports', 'activeObservers']);
}
```

## 🎯 Routing Overview

```
GET  /                           → Redirect to /admin
GET  /admin                      → Dashboard
GET  /admin/observers            → Observers list
POST /admin/observers            → Create observer
GET  /admin/observers/{id}/edit  → Edit observer
DELETE /admin/observers/{id}     → Delete observer

GET  /admin/roles                → Roles list
GET  /admin/permissions          → Permissions list

GET  /admin/incidents            → Incidents list
GET  /admin/incidents/{id}       → Incident details

GET  /admin/reports              → Reports list
GET  /admin/reports/{id}         → Report details

GET  /admin/map                  → Map view (LIVE)
GET  /admin/messages             → Messages
```

## 📱 Responsive Design

The layout is fully responsive using Tailwind CSS breakpoints:

```blade
<!-- Mobile-first approach -->
<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
    <!-- 1 column on mobile, 2 on tablet, 4 on desktop -->
</div>

<!-- Hide on mobile -->
<div class="hidden md:block">Desktop only</div>

<!-- Show only on mobile -->
<div class="md:hidden">Mobile only</div>
```

## 🔧 Customization

### Adding New Pages

1. Create controller: `app/Http/Controllers/Admin/YourPageController.php`
2. Create view: `resources/views/admin/yourpage/index.blade.php`
3. Add route: `Route::resource('yourpage', YourPageController::class);`
4. Add menu item in `sidebar.blade.php`

### Changing Colors

Update Tailwind classes throughout the templates:
- Background: Change `bg-gray-950` to your color
- Text: Change `text-white` to your color
- Accents: Change `bg-blue-600` to your color

### Adding Features

The structure is modular and easy to extend. Each section (dashboard, observers, incidents) can be extended independently.

## ⚙️ Configuration

### Environment Variables

```env
APP_NAME=ElectWatch
APP_ENV=production
APP_DEBUG=false
APP_URL=http://localhost:8000

DB_CONNECTION=mysql
DB_HOST=127.0.0.1
DB_PORT=3306
DB_DATABASE=electwatch
DB_USERNAME=root
DB_PASSWORD=
```

### Tailwind Configuration

Customize in `tailwind.config.js`:

```javascript
export default {
  theme: {
    extend: {
      colors: {
        // Add custom colors
      },
    },
  },
}
```

## 📚 Additional Resources

- [Laravel Documentation](https://laravel.com/docs)
- [Tailwind CSS Documentation](https://tailwindcss.com)
- [Alpine.js Documentation](https://alpinejs.dev)
- [Blade Template Engine](https://laravel.com/docs/blade)

## 🐛 Common Issues

| Issue | Solution |
|-------|----------|
| Tailwind styles not loading | Run `npm run dev` and verify CSS import in layout |
| Routes not working | Clear route cache: `php artisan route:cache` |
| Layout not centered | Check sidebar width (384px = w-96) |
| Auth not working | Ensure auth middleware is applied to routes |
| Alpine.js not working | Verify CDN or import is in layout |

## 🤝 Contributing

When adding new features:
1. Follow Tailwind CSS conventions
2. Use the existing component structure
3. Maintain dark theme consistency
4. Test on multiple screen sizes
5. Update documentation

## 📝 License

Part of the Elections Intelligence Platform project.

---

**Built with ❤️ for transparent elections**

**Last Updated**: August 30, 2026

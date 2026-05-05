# AI-JLSP Frontend

AI-Enhanced Judicial & Legal Services Platform - Frontend Application

## Overview

Modern Next.js 14 frontend for the AI-JLSP platform with TypeScript, Tailwind CSS, and role-based access control.

## Tech Stack

- **Framework**: Next.js 14 with App Router
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **State Management**: Zustand
- **Forms**: React Hook Form
- **HTTP Client**: Axios
- **UI Components**: shadcn/ui (configurable)
- **Authentication**: JWT with localStorage
- **Accessibility**: WCAG 2.1 AA

## Project Structure

```
frontend/
├── app/
│   ├── (auth)/
│   │   ├── login/
│   │   ├── register/
│   │   └── forgot-password/
│   ├── dashboard/
│   │   ├── layout.tsx
│   │   ├── page.tsx (main dashboard)
│   │   ├── cases/
│   │   ├── research/
│   │   ├── tdr/
│   │   ├── conveyancing/
│   │   ├── board/
│   │   ├── compliance/
│   │   └── admin/
│   ├── layout.tsx
│   ├── providers.tsx
│   └── globals.css
├── components/
│   ├── Button.tsx
│   ├── Input.tsx
│   ├── Card.tsx
│   ├── Modal.tsx
│   ├── Toast.tsx
│   └── LoadingSkeleton.tsx
├── lib/
│   ├── auth-store.ts
│   ├── api-client.ts
│   ├── constants.ts
│   ├── permissions.ts
│   └── formatters.ts
├── middleware.ts
├── next.config.js
├── tailwind.config.ts
└── tsconfig.json
```

## Features

### Authentication
- JWT-based login/register
- Password reset functionality
- MFA support (configurable)
- Automatic token refresh
- Protected routes with middleware

### Role-Based Access Control (RBAC)
- 7 user roles with specific permissions
- Role-based dashboards
- Permission checking utilities
- Module-level access control

### Modules
1. **Case Management** - File and track cases
2. **Legal Research** - Semantic search and knowledge management
3. **Tax Dispute Resolution** - Manage TDR objections
4. **Conveyancing** - Property transaction management
5. **Board Services** - Meeting and agenda management
6. **Compliance** - DPA and audit monitoring
7. **Administration** - User and system management

### UI/UX
- Modern gradient design
- Responsive layouts
- Dark mode ready
- Accessibility compliant (WCAG 2.1 AA)
- Loading states and error handling
- Toast notifications
- Modal dialogs

## Getting Started

### Installation

```bash
cd packages/frontend
npm install
```

### Development

```bash
npm run dev
```

The app will be available at `http://localhost:3000`

### Building

```bash
npm run build
npm start
```

### Linting

```bash
npm run lint
```

## Environment Variables

Create a `.env.local` file:

```
NEXT_PUBLIC_API_URL=http://localhost:3001
JWT_SECRET=your-secret-key
```

## Usage Examples

### Using Authentication Store

```typescript
import { useAuth } from '@/lib/auth-store';

export function MyComponent() {
  const { user, isAuthenticated, logout } = useAuth();

  if (!isAuthenticated) {
    return <div>Please log in</div>;
  }

  return <div>Welcome, {user?.firstName}</div>;
}
```

### Using Permissions

```typescript
import { usePermission } from '@/lib/permissions';

export function AdminPanel() {
  const { can, canAccess } = usePermission();

  if (!can('manage_users')) {
    return <div>Access denied</div>;
  }

  return <div>Admin Panel</div>;
}
```

### Using API Client

```typescript
import apiClient from '@/lib/api-client';

async function fetchCases() {
  try {
    const response = await apiClient.get('/cases');
    return response.data;
  } catch (error) {
    console.error('Failed to fetch cases', error);
  }
}
```

## Components

### Button
```typescript
<Button variant="primary" size="md">
  Click me
</Button>
```

### Input
```typescript
<Input
  label="Email"
  placeholder="Enter email"
  error={error}
  helperText="We'll never share your email"
/>
```

### Card
```typescript
<Card title="Statistics" description="Overview">
  <p>Content here</p>
</Card>
```

### Modal
```typescript
const [isOpen, setIsOpen] = useState(false);

<Modal
  isOpen={isOpen}
  onClose={() => setIsOpen(false)}
  title="Confirm Action"
  actions={<button>Confirm</button>}
>
  Are you sure?
</Modal>
```

## Styling

Tailwind CSS is configured with custom colors:

```typescript
primary: '#4F46E5'    // Indigo
secondary: '#10B981'  // Emerald
```

## Performance Optimization

- Image optimization with Next.js Image
- Code splitting per route
- CSS in JS with Tailwind
- Lazy loading of components
- Caching strategies for API calls

## Security

- HTTPS enforcement in production
- XSS protection with React
- CSRF token handling
- Secure cookie storage
- Content Security Policy headers

## Accessibility

- WCAG 2.1 AA compliant
- Keyboard navigation
- Screen reader support
- Color contrast compliance
- Reduced motion support

## Contributing

1. Follow TypeScript best practices
2. Use functional components with hooks
3. Implement error boundaries
4. Add loading and error states
5. Test responsiveness on mobile

## License

MIT

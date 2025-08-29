# Permission System Documentation

This document outlines the permission system used in the application, including role-based access control (RBAC) and permission checks.

## Table of Contents
- [Roles](#roles)
- [Permissions](#permissions)
- [Client-Side Usage](#client-side-usage)
- [Server-Side Usage](#server-side-usage)
- [Best Practices](#best-practices)

## Roles

The application defines the following roles:

- **ADMIN**: Full access to all features and settings
- **EDITOR**: Can manage and verify incidents, view statistics
- **USER**: Can view and create incidents, view statistics
- **DEFAULT**: Basic read-only access (unauthenticated users)

## Permissions

Permissions are defined in `src/lib/config/roles.ts` and follow the format `resource:action`.

### Available Permissions

- **Incident Management**
  - `incident:view`: View incident details
  - `incident:create`: Create new incidents
  - `incident:update`: Update existing incidents
  - `incident:delete`: Delete incidents
  - `incident:verify`: Verify incident reports

- **User Management**
  - `user:view`: View user profiles
  - `user:manage`: Create/update/delete users

- **Statistics**
  - `stats:view`: View statistics and reports

- **System Settings**
  - `settings:manage`: Modify system settings

## Client-Side Usage

### usePermissions Hook

Use the `usePermissions` hook in React components to check permissions:

```typescript
import { usePermissions } from '@/lib/hooks/usePermissions';

function MyComponent() {
  const { can, hasRole, isAdmin } = usePermissions();

  if (!can('incident:create')) {
    return <div>You don't have permission to create incidents</div>;
  }

  return (
    <button disabled={!can('incident:create')}>
      Create Incident
    </button>
  );
}
```

### ProtectedRoute Component

Protect routes based on roles or permissions:

```typescript
import ProtectedRoute from '@/app/components/ProtectedRoute';

function AdminPage() {
  return (
    <ProtectedRoute allowedRoles={['admin']}>
      <div>Admin Dashboard</div>
    </ProtectedRoute>
  );
}

// Or with permissions
function EditorTools() {
  return (
    <ProtectedRoute requiredPermissions={['incident:verify']}>
      <div>Editor Tools</div>
    </ProtectedRoute>
  );
}
```

## Server-Side Usage

### API Route Protection

Protect API routes using the `withPermissions` middleware:

```typescript
import { withPermissions } from '@/lib/utils/permissions';

export default withPermissions(
  async function handler(req, res) {
    // Your protected route logic
  },
  {
    allowedRoles: ['admin', 'editor'],
    requiredPermissions: ['incident:manage']
  }
);
```

### Server Components

Use server-side permission checks in server components:

```typescript
import { userCan, userHasRole } from '@/lib/utils/permissions';

export default async function AdminPage() {
  const canManageUsers = await userCan(['user:manage']);
  const isAdmin = await userHasRole(['admin']);
  
  if (!isAdmin) {
    return <div>Access Denied</div>;
  }
  
  return (
    <div>
      <h1>Admin Dashboard</h1>
      {canManageUsers && <UserManagement />}
    </div>
  );
}
```

## Best Practices

1. **Fail Fast**: Check permissions as early as possible in your component hierarchy
2. **Be Specific**: Use the most specific permission required for the action
3. **Defensive Programming**: Always handle unauthorized states gracefully
4. **Server-Side Validation**: Never rely solely on client-side permission checks
5. **Audit Logging**: Consider adding audit logs for sensitive operations

## Testing Permissions

When testing components that use permissions, you can mock the `usePermissions` hook:

```typescript
// __mocks__/usePermissions.ts
import { vi } from 'vitest';

export const usePermissions = vi.fn().mockReturnValue({
  can: vi.fn().mockReturnValue(true),
  hasRole: vi.fn().mockReturnValue(true),
  isAdmin: true,
  isEditor: true,
  isUser: true,
  isLoading: false,
  isAuthenticated: true,
});
```

## Updating Permissions

To add a new permission:

1. Add the permission constant to `PERMISSIONS` in `src/lib/config/roles.ts`
2. Update the role-permission mappings in `ROLE_PERMISSIONS`
3. Update the documentation in this file
4. Add tests for the new permission checks

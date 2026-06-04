/**
 * RBAC Permission Registry
 * Defines all granular access keys available in the Governance Admin Console.
 */

export const PERMISSIONS = {
  // Dashboard Metrics
  DASHBOARD_READ: "admin.dashboard.read",
  
  // User Management
  USERS_READ: "users.read",
  USERS_UPDATE: "users.update",
  USERS_SUSPEND: "users.suspend",
  USERS_IMPERSONATE: "users.impersonate",
  
  // Subscription & Billing
  SUBSCRIPTIONS_READ: "subscriptions.read",
  SUBSCRIPTIONS_UPDATE: "subscriptions.update",
  PRICING_READ: "pricing.read",
  PRICING_UPDATE: "pricing.update",
  
  // Content & Templates
  CONTENT_READ: "content.read",
  CONTENT_UPDATE: "content.update",
  TEMPLATES_READ: "templates.read",
  TEMPLATES_UPDATE: "templates.update",
  
  // Operations
  FEATURE_FLAGS_READ: "feature_flags.read",
  FEATURE_FLAGS_UPDATE: "feature_flags.update",
  SYSTEM_SETTINGS_READ: "system_settings.read",
  SYSTEM_SETTINGS_UPDATE: "system_settings.update",
  
  // Auditing & Analytics
  AUDIT_LOGS_READ: "audit_logs.read",
  ANALYTICS_READ: "analytics.read",
} as const;

export type PermissionKey = typeof PERMISSIONS[keyof typeof PERMISSIONS];

/**
 * System Role Definitions
 * Mapped groups of permissions assigned to specific administrative roles.
 */
export const SYSTEM_ROLES = {
  SUPER_ADMIN: {
    id: "super-admin",
    name: "Super Admin",
    permissions: Object.values(PERMISSIONS),
  },
  ADMIN: {
    id: "admin",
    name: "Admin",
    permissions: Object.values(PERMISSIONS).filter(p => p !== PERMISSIONS.USERS_IMPERSONATE),
  },
  SUPPORT_MANAGER: {
    id: "support-manager",
    name: "Support Manager",
    permissions: [
      PERMISSIONS.DASHBOARD_READ,
      PERMISSIONS.USERS_READ,
      PERMISSIONS.USERS_UPDATE,
      PERMISSIONS.USERS_SUSPEND,
      PERMISSIONS.AUDIT_LOGS_READ,
    ],
  },
  CONTENT_MANAGER: {
    id: "content-manager",
    name: "Content Manager",
    permissions: [
      PERMISSIONS.DASHBOARD_READ,
      PERMISSIONS.CONTENT_READ,
      PERMISSIONS.CONTENT_UPDATE,
      PERMISSIONS.TEMPLATES_READ,
      PERMISSIONS.TEMPLATES_UPDATE,
    ],
  },
} as const;

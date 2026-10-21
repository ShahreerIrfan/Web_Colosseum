import type { RbacItem, UserPayload } from '@/types/api/authTypes';

export const ALL_SYSTEM_MODULES = [
  'Monuments & Landmarks',
  'Vector Floor Maps',
  'Viewpoint Hotspots',
  'Audio Guides & Narration',
  'Languages & Localization',
  'Walking Tour Itineraries',
  'Pedestrian Street Routes',
  'GPS Geofencing & Tracking',
  'Sync Bundles & Manifests',
  'Mobile Client Offline Cache',
  'Access & Tickets',
  'Park Configuration',
  'Staff & User Accounts',
  'Role-Based Access Control',
  'Analytics & Visitor Telemetry',
] as const;

export type SystemModuleName = (typeof ALL_SYSTEM_MODULES)[number];

export const DEFAULT_ROLE_RBAC: Record<
  string,
  Record<
    SystemModuleName,
    {
      Create: 'true' | 'false';
      Read: 'true' | 'false';
      Update: 'true' | 'false';
      Delete: 'true' | 'false';
    }
  >
> = {
  super_admin: {
    'Monuments & Landmarks': { Create: 'true', Read: 'true', Update: 'true', Delete: 'true' },
    'Vector Floor Maps': { Create: 'true', Read: 'true', Update: 'true', Delete: 'true' },
    'Viewpoint Hotspots': { Create: 'true', Read: 'true', Update: 'true', Delete: 'true' },
    'Audio Guides & Narration': { Create: 'true', Read: 'true', Update: 'true', Delete: 'true' },
    'Languages & Localization': { Create: 'true', Read: 'true', Update: 'true', Delete: 'true' },
    'Walking Tour Itineraries': { Create: 'true', Read: 'true', Update: 'true', Delete: 'true' },
    'Pedestrian Street Routes': { Create: 'true', Read: 'true', Update: 'true', Delete: 'true' },
    'GPS Geofencing & Tracking': { Create: 'true', Read: 'true', Update: 'true', Delete: 'true' },
    'Sync Bundles & Manifests': { Create: 'true', Read: 'true', Update: 'true', Delete: 'true' },
    'Mobile Client Offline Cache': { Create: 'true', Read: 'true', Update: 'true', Delete: 'true' },
    'Access & Tickets': { Create: 'true', Read: 'true', Update: 'true', Delete: 'true' },
    'Park Configuration': { Create: 'true', Read: 'true', Update: 'true', Delete: 'true' },
    'Staff & User Accounts': { Create: 'true', Read: 'true', Update: 'true', Delete: 'true' },
    'Role-Based Access Control': { Create: 'true', Read: 'true', Update: 'true', Delete: 'true' },
    'Analytics & Visitor Telemetry': {
      Create: 'true',
      Read: 'true',
      Update: 'true',
      Delete: 'true',
    },
  },
  admin: {
    'Monuments & Landmarks': { Create: 'true', Read: 'true', Update: 'true', Delete: 'false' },
    'Vector Floor Maps': { Create: 'true', Read: 'true', Update: 'true', Delete: 'false' },
    'Viewpoint Hotspots': { Create: 'true', Read: 'true', Update: 'true', Delete: 'true' },
    'Audio Guides & Narration': { Create: 'true', Read: 'true', Update: 'true', Delete: 'true' },
    'Languages & Localization': { Create: 'true', Read: 'true', Update: 'true', Delete: 'false' },
    'Walking Tour Itineraries': { Create: 'true', Read: 'true', Update: 'true', Delete: 'true' },
    'Pedestrian Street Routes': { Create: 'true', Read: 'true', Update: 'true', Delete: 'true' },
    'GPS Geofencing & Tracking': { Create: 'false', Read: 'true', Update: 'true', Delete: 'false' },
    'Sync Bundles & Manifests': { Create: 'true', Read: 'true', Update: 'true', Delete: 'false' },
    'Mobile Client Offline Cache': {
      Create: 'false',
      Read: 'true',
      Update: 'true',
      Delete: 'false',
    },
    'Access & Tickets': { Create: 'true', Read: 'true', Update: 'true', Delete: 'false' },
    'Park Configuration': { Create: 'false', Read: 'true', Update: 'true', Delete: 'false' },
    'Staff & User Accounts': { Create: 'false', Read: 'true', Update: 'false', Delete: 'false' },
    'Role-Based Access Control': {
      Create: 'false',
      Read: 'true',
      Update: 'false',
      Delete: 'false',
    },
    'Analytics & Visitor Telemetry': {
      Create: 'false',
      Read: 'true',
      Update: 'false',
      Delete: 'false',
    },
  },
  moderator: {
    'Monuments & Landmarks': { Create: 'false', Read: 'true', Update: 'true', Delete: 'false' },
    'Vector Floor Maps': { Create: 'false', Read: 'false', Update: 'false', Delete: 'false' },
    'Viewpoint Hotspots': { Create: 'true', Read: 'true', Update: 'true', Delete: 'false' },
    'Audio Guides & Narration': { Create: 'true', Read: 'true', Update: 'true', Delete: 'false' },
    'Languages & Localization': { Create: 'false', Read: 'true', Update: 'true', Delete: 'false' },
    'Walking Tour Itineraries': { Create: 'true', Read: 'true', Update: 'true', Delete: 'false' },
    'Pedestrian Street Routes': { Create: 'false', Read: 'true', Update: 'false', Delete: 'false' },
    'GPS Geofencing & Tracking': {
      Create: 'false',
      Read: 'true',
      Update: 'false',
      Delete: 'false',
    },
    'Sync Bundles & Manifests': { Create: 'false', Read: 'true', Update: 'false', Delete: 'false' },
    'Mobile Client Offline Cache': {
      Create: 'false',
      Read: 'true',
      Update: 'false',
      Delete: 'false',
    },
    'Access & Tickets': { Create: 'false', Read: 'true', Update: 'false', Delete: 'false' },
    'Park Configuration': { Create: 'false', Read: 'true', Update: 'false', Delete: 'false' },
    'Staff & User Accounts': { Create: 'false', Read: 'false', Update: 'false', Delete: 'false' },
    'Role-Based Access Control': {
      Create: 'false',
      Read: 'false',
      Update: 'false',
      Delete: 'false',
    },
    'Analytics & Visitor Telemetry': {
      Create: 'false',
      Read: 'true',
      Update: 'false',
      Delete: 'false',
    },
  },
  user: {
    'Monuments & Landmarks': { Create: 'false', Read: 'true', Update: 'false', Delete: 'false' },
    'Vector Floor Maps': { Create: 'false', Read: 'true', Update: 'false', Delete: 'false' },
    'Viewpoint Hotspots': { Create: 'false', Read: 'true', Update: 'false', Delete: 'false' },
    'Audio Guides & Narration': { Create: 'false', Read: 'true', Update: 'false', Delete: 'false' },
    'Languages & Localization': { Create: 'false', Read: 'true', Update: 'false', Delete: 'false' },
    'Walking Tour Itineraries': { Create: 'false', Read: 'true', Update: 'false', Delete: 'false' },
    'Pedestrian Street Routes': { Create: 'false', Read: 'true', Update: 'false', Delete: 'false' },
    'GPS Geofencing & Tracking': {
      Create: 'false',
      Read: 'true',
      Update: 'false',
      Delete: 'false',
    },
    'Sync Bundles & Manifests': {
      Create: 'false',
      Read: 'false',
      Update: 'false',
      Delete: 'false',
    },
    'Mobile Client Offline Cache': {
      Create: 'false',
      Read: 'false',
      Update: 'false',
      Delete: 'false',
    },
    'Access & Tickets': { Create: 'false', Read: 'false', Update: 'false', Delete: 'false' },
    'Park Configuration': { Create: 'false', Read: 'false', Update: 'false', Delete: 'false' },
    'Staff & User Accounts': { Create: 'false', Read: 'false', Update: 'false', Delete: 'false' },
    'Role-Based Access Control': {
      Create: 'false',
      Read: 'false',
      Update: 'false',
      Delete: 'false',
    },
    'Analytics & Visitor Telemetry': {
      Create: 'false',
      Read: 'false',
      Update: 'false',
      Delete: 'false',
    },
  },
};

/**
 * Checks whether an RBAC rule allows modification (Create, Update, or Delete).
 * If the user only has Read permissions (or no permissions), returns false.
 */
export const canModifyModule = (rbacItem?: RbacItem): boolean => {
  if (!rbacItem) return false;
  return rbacItem.Create === 'true' || rbacItem.Update === 'true' || rbacItem.Delete === 'true';
};

/**
 * Returns default RBAC array for a given role.
 */
export const getFallbackRbacForRole = (role: string): RbacItem[] => {
  const normalized = role.toLowerCase().replace('-', '_');
  const matrix = DEFAULT_ROLE_RBAC[normalized] || DEFAULT_ROLE_RBAC.user;

  return ALL_SYSTEM_MODULES.map((moduleName) => {
    const perm = matrix[moduleName] || {
      Create: 'false',
      Read: 'false',
      Update: 'false',
      Delete: 'false',
    };
    return {
      'module name': moduleName,
      Create: perm.Create,
      Read: perm.Read,
      Update: perm.Update,
      Delete: perm.Delete,
    };
  });
};

/**
 * Resolves the effective RBAC list for the currently logged in user.
 */
export const getEffectiveRbac = (user?: UserPayload | null): RbacItem[] => {
  if (!user) return [];

  // 1. Direct rback array attached to the user payload or token
  if (Array.isArray(user.rback) && user.rback.length > 0) {
    return user.rback;
  }

  // 2. Fallback to default matrix based on user.userRole or user.role
  const role = user.userRole || user.role || 'user';
  return getFallbackRbacForRole(role);
};

/**
 * Determines if a specific module should appear in the navigation sidebar.
 * Requirement:
 * "if a user has don't have on a module ( except read ) : that module won't be appear in the sidebar.
 * ( if he can't do any modification ( create, edit, delete ) except read )"
 */
export const isModuleVisibleInSidebar = (
  moduleName: string,
  user?: UserPayload | null
): boolean => {
  if (!user) return false;

  const rbacList = getEffectiveRbac(user);
  const target = rbacList.find(
    (item) => item['module name'].toLowerCase() === moduleName.toLowerCase()
  );

  return canModifyModule(target);
};

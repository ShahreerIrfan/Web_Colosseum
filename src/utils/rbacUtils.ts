import type { RbacItem, UserPayload } from '@/types/api/authTypes';

export type CrudAction = 'Create' | 'Read' | 'Update' | 'Delete';
export type RoleId = 'super_admin' | 'admin' | 'moderator' | 'user';

const crud = ['Create', 'Read', 'Update', 'Delete'] as const;

export const ADMIN_MODULES = [
  {
    id: 'analytics',
    name: 'Dashboard',
    key: 'Analytics & Visitor Telemetry',
    description: 'Visitor activity and tour reports',
    actions: ['Read'],
  },
  {
    id: 'landmarks',
    name: 'Monuments & Landmarks',
    key: 'Monuments & Landmarks',
    description: 'Monument details, map positions and published sites',
    actions: crud,
  },
  {
    id: 'floors',
    name: 'Floor Maps',
    key: 'Vector Floor Maps',
    description: 'Floor details and map settings for each landmark',
    actions: crud,
  },
  {
    id: 'viewpoints',
    name: 'Viewpoint',
    key: 'Viewpoint Hotspots',
    description: 'Tour stops, GPS coordinates and narration text',
    actions: crud,
  },
  {
    id: 'floorItinerary',
    name: 'Floor Itinerary',
    key: 'Floor Itinerary',
    description: 'Walking connections between Viewpoints on a Floor',
    actions: crud,
  },
  {
    id: 'pedestrianRoutes',
    name: 'Pedestrian Routes',
    key: 'Pedestrian Street Routes',
    description: 'Published walking routes between landmarks',
    actions: crud,
  },
  {
    id: 'rbac',
    name: 'Role Management',
    key: 'Role-Based Access Control',
    description: 'Create, edit and delete custom roles',
    actions: crud,
  },
  {
    id: 'users',
    name: 'Users',
    key: 'Staff & User Accounts',
    description: 'Create, edit and remove user accounts',
    actions: crud,
  },
  {
    id: 'languages',
    name: 'Languages',
    key: 'Languages & Localization',
    description: 'Language catalog and tour content translations',
    actions: crud,
  },
] as const satisfies readonly {
  id: string;
  name: string;
  key: string;
  description: string;
  actions: readonly CrudAction[];
}[];

export type SystemModuleName = (typeof ADMIN_MODULES)[number]['key'];
type ModuleId = (typeof ADMIN_MODULES)[number]['id'];

const ROLE_ACTIONS: Record<
  Exclude<RoleId, 'super_admin'>,
  Partial<Record<ModuleId, readonly CrudAction[]>>
> = {
  admin: {
    analytics: ['Read'],
    landmarks: ['Create', 'Read', 'Update'],
    floors: ['Create', 'Read', 'Update'],
    viewpoints: crud,
    floorItinerary: crud,
    pedestrianRoutes: crud,
    rbac: ['Read'],
    users: crud,
    languages: ['Create', 'Read', 'Update'],
  },
  moderator: {
    landmarks: ['Read', 'Update'],
    viewpoints: ['Create', 'Read', 'Update'],
    pedestrianRoutes: ['Read'],
    languages: ['Read', 'Update'],
  },
  user: {
    landmarks: ['Read'],
    floors: ['Read'],
    viewpoints: ['Read'],
    pedestrianRoutes: ['Read'],
    languages: ['Read'],
  },
};

export const normalizeRole = (role: string): RoleId => {
  const normalized = role.toLowerCase().replace('-', '_');
  return normalized === 'super_admin' || normalized === 'admin' || normalized === 'moderator'
    ? normalized
    : 'user';
};

export const getFallbackRbacForRole = (role: string): RbacItem[] => {
  const normalized = normalizeRole(role);
  return ADMIN_MODULES.map((module) => {
    const allowed: readonly CrudAction[] =
      normalized === 'super_admin' ? module.actions : (ROLE_ACTIONS[normalized][module.id] ?? []);
    const flag = (action: CrudAction) => (allowed.includes(action) ? 'true' : 'false');
    return {
      'module name': module.key,
      Create: flag('Create'),
      Read: flag('Read'),
      Update: flag('Update'),
      Delete: flag('Delete'),
    };
  });
};

export const getEffectiveRbac = (user?: UserPayload | null): RbacItem[] => {
  if (!user) return [];
  const role = normalizeRole(user.userRole || user.role || 'user');
  const defaults = getFallbackRbacForRole(role);
  const saved = Array.isArray(user.rback) ? user.rback : [];
  if (user.role.startsWith('CUSTOM_')) return saved;
  const legacyPayload = saved.some((entry) => entry['module name'] === 'Audio Guides & Narration');
  return ADMIN_MODULES.map((module, index) => {
    const fallback = defaults[index];
    const item = saved.find(
      (entry) => entry['module name'].toLowerCase() === module.key.toLowerCase()
    );
    if (module.id === 'floorItinerary' && role === 'admin' && saved.length && !item) {
      return {
        'module name': module.key,
        Create: 'false',
        Read: 'false',
        Update: 'false',
        Delete: 'false',
      };
    }
    const actions: readonly CrudAction[] = module.actions;
    // Older server payloads mislabeled Admin account actions and Moderator analytics access.
    const useDefault =
      legacyPayload &&
      ((module.id === 'users' && role === 'admin') ||
        (module.id === 'analytics' && role === 'moderator'));
    const flag = (action: CrudAction) =>
      actions.includes(action)
        ? (useDefault ? fallback : (item ?? fallback))[action] === 'true'
          ? 'true'
          : 'false'
        : 'false';
    return {
      'module name': module.key,
      Create: flag('Create'),
      Read: flag('Read'),
      Update: flag('Update'),
      Delete: flag('Delete'),
    };
  });
};

export const isModuleVisibleInSidebar = (
  moduleName: string,
  user?: UserPayload | null
): boolean => {
  const target = getEffectiveRbac(user).find(
    (item) => item['module name'].toLowerCase() === moduleName.toLowerCase()
  );
  if (!target) return false;
  if (['Analytics & Visitor Telemetry', 'Floor Itinerary'].includes(target['module name']))
    return target.Read === 'true';
  if (
    ['Role-Based Access Control', 'Staff & User Accounts'].includes(target['module name']) &&
    target.Read === 'true'
  )
    return true;
  return target.Create === 'true' || target.Update === 'true' || target.Delete === 'true';
};

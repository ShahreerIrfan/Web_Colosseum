import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import useToast from '@/hooks/component/useToast';
import {
  Ban,
  Check,
  CheckCheck,
  ChevronDown,
  RotateCcw,
  Save,
  Search,
  Shield,
  ShieldAlert,
  ShieldCheck,
  User,
  X,
} from 'lucide-react';
import React, { useMemo, useState } from 'react';

type RoleId = 'super_admin' | 'admin' | 'moderator' | 'user';
type CrudAction = 'create' | 'read' | 'update' | 'delete';
type ProjectScope = 'Backend' | 'Client' | 'Web';

interface RoleInfo {
  id: RoleId;
  name: string;
  badge: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
}

interface ModuleDefinition {
  id: string;
  name: string;
  description: string;
  category: string;
  scope: ProjectScope[];
}

const ROLES: RoleInfo[] = [
  {
    id: 'super_admin',
    name: 'Super Admin',
    badge: 'Full Root Access',
    description: 'Unrestricted full access across all modules and destructive actions',
    icon: ShieldAlert,
  },
  {
    id: 'admin',
    name: 'Admin',
    badge: 'Administrative',
    description: 'Can create, view, and update park assets, vector maps, and sync bundles',
    icon: ShieldCheck,
  },
  {
    id: 'moderator',
    name: 'Moderator',
    badge: 'Content Staff',
    description: 'Can manage audio tracks, narration guides, and viewpoints',
    icon: Shield,
  },
  {
    id: 'user',
    name: 'User',
    badge: 'Standard Visitor',
    description: 'Read-only access for tourist navigation and audio playback',
    icon: User,
  },
];

const MODULES: ModuleDefinition[] = [
  // 1. Core Archaeological Heritage
  {
    id: 'landmarks',
    name: 'Monuments & Landmarks',
    description:
      'Archaeological monuments, boundary polygon geometry, GPS anchors, and pin calibrations',
    category: 'Core Heritage',
    scope: ['Backend', 'Client', 'Web'],
  },
  {
    id: 'floors',
    name: 'Vector Floor Maps',
    description:
      'Multi-level architectural vector floor plans, SVG ground overlays, and indoor wayfinding',
    category: 'Core Heritage',
    scope: ['Backend', 'Client', 'Web'],
  },
  {
    id: 'viewpoints',
    name: 'Viewpoint Hotspots',
    description:
      'Interactive 360-degree panorama hotspots, camera perspective angles, and compass gaze calibrations',
    category: 'Core Heritage',
    scope: ['Backend', 'Client', 'Web'],
  },

  // 2. Media & Localization
  {
    id: 'audio',
    name: 'Audio Guides & Narration',
    description:
      'Studio narration audio tracks, multi-language acoustic guides, duration metadata, and streaming assets',
    category: 'Media & Localization',
    scope: ['Backend', 'Client', 'Web'],
  },
  {
    id: 'languages',
    name: 'Languages & Localization',
    description:
      'Multi-language translation catalogs (EN, IT, ES, FR, DE), locale preferences, and audio mappings',
    category: 'Media & Localization',
    scope: ['Backend', 'Client', 'Web'],
  },

  // 3. Navigation & Wayfinding
  {
    id: 'itineraries',
    name: 'Walking Tour Itineraries',
    description:
      'Curated visitor pathways, sequential POI waypoint segments, walking distance, and pacing times',
    category: 'Navigation & Wayfinding',
    scope: ['Backend', 'Client'],
  },
  {
    id: 'pedestrianRoutes',
    name: 'Pedestrian Street Routes',
    description:
      'Turn-by-turn outdoor street routing between monuments, road graph geometry, and connectivity',
    category: 'Navigation & Wayfinding',
    scope: ['Backend', 'Client'],
  },
  {
    id: 'gpsTracking',
    name: 'GPS Geofencing & Tracking',
    description:
      'Real-time visitor GPS positioning, magnetometer compass alignment, and proximity boundary triggers',
    category: 'Navigation & Wayfinding',
    scope: ['Backend', 'Client'],
  },

  // 4. Distribution & Offline
  {
    id: 'sync',
    name: 'Sync Bundles & Manifests',
    description:
      'Offline package distribution, SHA-256 integrity hashes, delta sync manifests, and bundle releases',
    category: 'Distribution & Offline',
    scope: ['Backend', 'Client', 'Web'],
  },
  {
    id: 'offlineStorage',
    name: 'Mobile Client Offline Cache',
    description:
      'Local client SQLite/JSON storage, media assets caching, and offline tour validation for zero-connectivity visits',
    category: 'Distribution & Offline',
    scope: ['Client'],
  },

  // Security & Administration
  {
    id: 'rbac',
    name: 'Role-Based Access Control',
    description:
      'System roles (Super Admin, Admin, Moderator, User), privilege matrix, and granular CRUD enforcement',
    category: 'Security & Access',
    scope: ['Backend', 'Web'],
  },

  // 8. Telemetry & Analytics
  {
    id: 'analytics',
    name: 'Analytics & Visitor Telemetry',
    description:
      'Tourist check-in volume, audio playback telemetry, visited viewpoint counts, and engagement stats',
    category: 'Telemetry & Analytics',
    scope: ['Web', 'Client'],
  },
];

const CRUD_ACTIONS: { id: CrudAction; label: string }[] = [
  { id: 'create', label: 'Create' },
  { id: 'read', label: 'Read' },
  { id: 'update', label: 'Update' },
  { id: 'delete', label: 'Delete' },
];

type RolePermissions = Record<RoleId, Record<string, Record<CrudAction, boolean>>>;

const DEFAULT_PERMISSIONS: RolePermissions = {
  super_admin: {
    landmarks: { create: true, read: true, update: true, delete: true },
    floors: { create: true, read: true, update: true, delete: true },
    viewpoints: { create: true, read: true, update: true, delete: true },
    audio: { create: true, read: true, update: true, delete: true },
    languages: { create: true, read: true, update: true, delete: true },
    itineraries: { create: true, read: true, update: true, delete: true },
    pedestrianRoutes: { create: true, read: true, update: true, delete: true },
    gpsTracking: { create: true, read: true, update: true, delete: true },
    sync: { create: true, read: true, update: true, delete: true },
    offlineStorage: { create: true, read: true, update: true, delete: true },
    tickets: { create: true, read: true, update: true, delete: true },
    parkConfig: { create: true, read: true, update: true, delete: true },
    users: { create: true, read: true, update: true, delete: true },
    rbac: { create: true, read: true, update: true, delete: true },
    analytics: { create: true, read: true, update: true, delete: true },
  },
  admin: {
    landmarks: { create: true, read: true, update: true, delete: false },
    floors: { create: true, read: true, update: true, delete: false },
    viewpoints: { create: true, read: true, update: true, delete: true },
    audio: { create: true, read: true, update: true, delete: true },
    languages: { create: true, read: true, update: true, delete: false },
    itineraries: { create: true, read: true, update: true, delete: true },
    pedestrianRoutes: { create: true, read: true, update: true, delete: true },
    gpsTracking: { create: false, read: true, update: true, delete: false },
    sync: { create: true, read: true, update: true, delete: false },
    offlineStorage: { create: false, read: true, update: true, delete: false },
    tickets: { create: true, read: true, update: true, delete: false },
    parkConfig: { create: false, read: true, update: true, delete: false },
    users: { create: false, read: true, update: false, delete: false },
    rbac: { create: false, read: true, update: false, delete: false },
    analytics: { create: false, read: true, update: false, delete: false },
  },
  moderator: {
    landmarks: { create: false, read: true, update: true, delete: false },
    floors: { create: false, read: true, update: false, delete: false },
    viewpoints: { create: true, read: true, update: true, delete: false },
    audio: { create: true, read: true, update: true, delete: false },
    languages: { create: false, read: true, update: true, delete: false },
    itineraries: { create: true, read: true, update: true, delete: false },
    pedestrianRoutes: { create: false, read: true, update: false, delete: false },
    gpsTracking: { create: false, read: true, update: false, delete: false },
    sync: { create: false, read: true, update: false, delete: false },
    offlineStorage: { create: false, read: true, update: false, delete: false },
    tickets: { create: false, read: true, update: false, delete: false },
    parkConfig: { create: false, read: true, update: false, delete: false },
    users: { create: false, read: false, update: false, delete: false },
    rbac: { create: false, read: false, update: false, delete: false },
    analytics: { create: false, read: true, update: false, delete: false },
  },
  user: {
    landmarks: { create: false, read: true, update: false, delete: false },
    floors: { create: false, read: true, update: false, delete: false },
    viewpoints: { create: false, read: true, update: false, delete: false },
    audio: { create: false, read: true, update: false, delete: false },
    languages: { create: false, read: true, update: false, delete: false },
    itineraries: { create: false, read: true, update: false, delete: false },
    pedestrianRoutes: { create: false, read: true, update: false, delete: false },
    gpsTracking: { create: false, read: true, update: false, delete: false },
    sync: { create: false, read: false, update: false, delete: false },
    offlineStorage: { create: false, read: false, update: false, delete: false },
    tickets: { create: false, read: false, update: false, delete: false },
    parkConfig: { create: false, read: false, update: false, delete: false },
    users: { create: false, read: false, update: false, delete: false },
    rbac: { create: false, read: false, update: false, delete: false },
    analytics: { create: false, read: false, update: false, delete: false },
  },
};

const STORAGE_KEY = 'colosseum_rbac_permissions_v2';

export const RoleManagement: React.FC = () => {
  const [selectedRole, setSelectedRole] = useState<RoleId>('super_admin');
  const [searchQuery, setSearchQuery] = useState<string>('');

  const [permissions, setPermissions] = useState<RolePermissions>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        // Merge saved with defaults in case new modules were added
        const merged: RolePermissions = { ...DEFAULT_PERMISSIONS };
        (Object.keys(DEFAULT_PERMISSIONS) as RoleId[]).forEach((role) => {
          merged[role] = {
            ...DEFAULT_PERMISSIONS[role],
            ...(parsed[role] || {}),
          };
        });
        return merged;
      }
    } catch {
      // ignore JSON parse error
    }
    return DEFAULT_PERMISSIONS;
  });

  const { showSuccess, showInfo } = useToast();

  const currentRoleData = ROLES.find((r) => r.id === selectedRole) || ROLES[0];
  const CurrentRoleIcon = currentRoleData.icon;

  // Filter modules by search
  const filteredModules = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) return MODULES;

    return MODULES.filter(
      (m) =>
        m.name.toLowerCase().includes(query) ||
        m.description.toLowerCase().includes(query) ||
        m.category.toLowerCase().includes(query) ||
        m.scope.some((s) => s.toLowerCase().includes(query))
    );
  }, [searchQuery]);

  const handleToggle = (role: RoleId, moduleId: string, action: CrudAction, checked: boolean) => {
    setPermissions((prev) => ({
      ...prev,
      [role]: {
        ...prev[role],
        [moduleId]: {
          ...(prev[role]?.[moduleId] || {
            create: false,
            read: false,
            update: false,
            delete: false,
          }),
          [action]: checked,
        },
      },
    }));
  };

  const handleToggleRow = (moduleId: string) => {
    const current = permissions[selectedRole]?.[moduleId] || {
      create: false,
      read: false,
      update: false,
      delete: false,
    };
    const allActive = current.create && current.read && current.update && current.delete;
    const targetState = !allActive;

    setPermissions((prev) => ({
      ...prev,
      [selectedRole]: {
        ...prev[selectedRole],
        [moduleId]: {
          create: targetState,
          read: targetState,
          update: targetState,
          delete: targetState,
        },
      },
    }));
  };

  const handleSave = () => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(permissions));

      // Build the rback payload according to requested format:
      // { userRole: "user", rback: [ { "module name": "...", Create: "true", Read: "false", ... } ] }
      const formattedRback = MODULES.map((mod) => {
        const perm = permissions[selectedRole]?.[mod.id] || {
          create: false,
          read: false,
          update: false,
          delete: false,
        };
        return {
          'module name': mod.name,
          Create: perm.create ? ('true' as const) : ('false' as const),
          Read: perm.read ? ('true' as const) : ('false' as const),
          Update: perm.update ? ('true' as const) : ('false' as const),
          Delete: perm.delete ? ('true' as const) : ('false' as const),
        };
      });

      // Update current user session rback only if the logged in user's actual role matches selectedRole
      const userRaw = localStorage.getItem('colosseum_user_payload');
      if (userRaw) {
        const currentUser = JSON.parse(userRaw);
        const actualRole = (currentUser.userRole || currentUser.role || '').toLowerCase();
        if (actualRole === selectedRole.toLowerCase()) {
          currentUser.rback = formattedRback;
          localStorage.setItem('colosseum_user_payload', JSON.stringify(currentUser));
          window.dispatchEvent(new Event('rbac-updated'));
        }
      }
    } catch {
      // ignore
    }
    showSuccess(
      'Permissions Saved',
      `Role permissions for "${currentRoleData.name}" have been updated and cached successfully.`
    );
  };

  const handleSelectRole = (roleId: RoleId) => {
    setSelectedRole(roleId);
  };

  const handleReset = () => {
    setPermissions((prev) => ({
      ...prev,
      [selectedRole]: { ...DEFAULT_PERMISSIONS[selectedRole] },
    }));
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        parsed[selectedRole] = DEFAULT_PERMISSIONS[selectedRole];
        localStorage.setItem(STORAGE_KEY, JSON.stringify(parsed));
      }
    } catch {
      // ignore
    }
    showInfo(
      'Permissions Reset',
      `Restored default permissions configuration for "${currentRoleData.name}".`
    );
  };

  const handleGrantAll = () => {
    setPermissions((prev) => {
      const updatedModuleMap: Record<string, Record<CrudAction, boolean>> = {};
      MODULES.forEach((mod) => {
        updatedModuleMap[mod.id] = { create: true, read: true, update: true, delete: true };
      });
      return {
        ...prev,
        [selectedRole]: updatedModuleMap,
      };
    });
    showSuccess(
      'All Granted',
      `Granted unrestricted full permissions on all ${MODULES.length} modules to ${currentRoleData.name}.`
    );
  };

  const handleRevokeAll = () => {
    setPermissions((prev) => {
      const updatedModuleMap: Record<string, Record<CrudAction, boolean>> = {};
      MODULES.forEach((mod) => {
        updatedModuleMap[mod.id] = { create: false, read: false, update: false, delete: false };
      });
      return {
        ...prev,
        [selectedRole]: updatedModuleMap,
      };
    });
    showInfo('All Revoked', `Revoked all permissions across modules for ${currentRoleData.name}.`);
  };

  return (
    <div className="flex-1 bg-background text-foreground space-y-8 max-w-6xl mx-auto w-full pb-12">
      {/* Page Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-border">
        <div className="space-y-1">
          <h1 className="text-2xl font-black text-foreground tracking-tight">
            Role & Permission Management
          </h1>
        </div>

        {/* Global Action Buttons */}
        <div className="flex items-center gap-2.5">
          <Button
            variant="outline"
            size="sm"
            onClick={handleReset}
            className="gap-2 cursor-pointer border-border hover:bg-muted"
          >
            <RotateCcw className="w-3.5 h-3.5 text-muted-foreground" />
            <span>Reset Defaults</span>
          </Button>

          <Button
            size="sm"
            onClick={handleSave}
            className="gap-2 bg-primary text-primary-foreground font-semibold cursor-pointer shadow-xs hover:opacity-90 transition"
          >
            <Save className="w-3.5 h-3.5" />
            <span>Save Permissions</span>
          </Button>
        </div>
      </div>

      {/* Role Selection Dropdown Section */}
      <div className="bg-card border border-border rounded-2xl p-6 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground block">
              Active Role Selection
            </label>
            <p className="text-xs text-muted-foreground">
              Choose the user role below to review and configure permissions in the matrix.
            </p>
          </div>

          {/* Shadcn Dropdown Menu for Roles & Batch Controls */}
          <div className="flex flex-wrap items-center gap-2.5">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="outline"
                  className="h-11 px-4 gap-3 bg-secondary/50 hover:bg-secondary border-border font-medium min-w-[240px] justify-between shadow-xs cursor-pointer"
                >
                  <div className="flex items-center gap-2.5">
                    <div className="flex size-6 items-center justify-center rounded-md bg-primary text-primary-foreground">
                      <CurrentRoleIcon className="size-3.5" />
                    </div>
                    <span className="font-bold text-foreground text-sm">
                      {currentRoleData.name}
                    </span>
                  </div>
                  <ChevronDown className="size-4 text-muted-foreground opacity-70" />
                </Button>
              </DropdownMenuTrigger>

              <DropdownMenuContent
                className="w-72 bg-card border-border shadow-xl p-1.5"
                align="end"
              >
                <DropdownMenuLabel className="text-xs text-muted-foreground font-semibold px-2 py-1.5">
                  Select System Role
                </DropdownMenuLabel>
                <DropdownMenuSeparator className="bg-border" />
                {ROLES.map((role) => {
                  const RoleIcon = role.icon;
                  const isSelected = selectedRole === role.id;
                  return (
                    <DropdownMenuItem
                      key={role.id}
                      onClick={() => handleSelectRole(role.id)}
                      className={`flex items-start gap-2.5 px-3 py-2.5 rounded-lg cursor-pointer transition-colors ${
                        isSelected
                          ? 'bg-secondary text-secondary-foreground font-semibold'
                          : 'text-foreground hover:bg-muted'
                      }`}
                    >
                      <div className="flex size-7 items-center justify-center rounded-md bg-primary/10 text-primary shrink-0 mt-0.5">
                        <RoleIcon className="size-4" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold">{role.name}</span>
                          {isSelected && <Check className="size-3.5 text-primary shrink-0" />}
                        </div>
                        <p className="text-[11px] text-muted-foreground line-clamp-1 font-normal">
                          {role.description}
                        </p>
                      </div>
                    </DropdownMenuItem>
                  );
                })}
              </DropdownMenuContent>
            </DropdownMenu>

            <Button
              variant="outline"
              size="sm"
              onClick={handleGrantAll}
              className="h-11 px-3 text-xs border-border hover:bg-muted text-muted-foreground hover:text-foreground cursor-pointer gap-1.5"
              title="Grant full permissions for all modules"
            >
              <CheckCheck className="size-3.5 text-emerald-600 dark:text-emerald-400" />
              <span>Grant All</span>
            </Button>

            <Button
              variant="outline"
              size="sm"
              onClick={handleRevokeAll}
              className="h-11 px-3 text-xs border-border hover:bg-muted text-muted-foreground hover:text-foreground cursor-pointer gap-1.5"
              title="Revoke all permissions for all modules"
            >
              <Ban className="size-3.5 text-destructive" />
              <span>Revoke All</span>
            </Button>
          </div>
        </div>

        {/* Search Toolbar */}
        <div className="pt-2 border-t border-border flex items-center justify-between gap-3">
          {/* Search Box */}
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Filter modules by name..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 pr-8 h-9 text-xs bg-muted/30 border-border"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground cursor-pointer"
              >
                <X className="size-3.5" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Permissions Matrix Grid */}
      <div className="bg-card border border-border rounded-2xl shadow-xs overflow-hidden">
        <div className="p-4 sm:p-5 border-b border-border bg-secondary/30 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-bold text-foreground">
                Permission Matrix for {currentRoleData.name}
              </h2>
              <span className="text-[11px] px-2 py-0.5 rounded-full bg-muted font-medium text-muted-foreground">
                Showing {filteredModules.length} of {MODULES.length} modules
              </span>
            </div>
            <p className="text-xs text-muted-foreground mt-0.5">
              Toggle specific CRUD capabilities for each functional module across the Colosseum
              ecosystem.
            </p>
          </div>
          <span className="text-xs px-2.5 py-1 rounded-full bg-primary/10 text-primary font-bold self-start sm:self-auto">
            {currentRoleData.badge}
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-border bg-muted/40 text-xs font-bold text-foreground uppercase tracking-wider">
                <th scope="col" className="py-4 px-6 min-w-[320px]">
                  Resource / Module
                </th>
                {CRUD_ACTIONS.map((action) => (
                  <th
                    key={action.id}
                    scope="col"
                    className="py-4 px-6 text-center w-32 min-w-[100px]"
                  >
                    {action.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-border text-sm">
              {filteredModules.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-muted-foreground">
                    <p className="text-sm">No modules matched your search filter.</p>
                    <button
                      type="button"
                      onClick={() => setSearchQuery('')}
                      className="mt-2 text-xs text-primary font-semibold underline cursor-pointer"
                    >
                      Clear search
                    </button>
                  </td>
                </tr>
              ) : (
                filteredModules.map((module) => {
                  const roleModulePermissions = permissions[selectedRole]?.[module.id] || {
                    create: false,
                    read: false,
                    update: false,
                    delete: false,
                  };

                  return (
                    <tr key={module.id} className="hover:bg-muted/30 transition-colors group">
                      {/* Module Name */}
                      <td className="py-4 px-6">
                        <span
                          role="button"
                          tabIndex={0}
                          onClick={() => handleToggleRow(module.id)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter' || e.key === ' ') {
                              e.preventDefault();
                              handleToggleRow(module.id);
                            }
                          }}
                          className="font-bold text-foreground text-sm hover:text-primary transition-colors cursor-pointer"
                          title="Click to toggle all permissions for this module"
                        >
                          {module.name}
                        </span>
                      </td>

                      {/* CRUD Toggle Switches */}
                      {CRUD_ACTIONS.map((action) => {
                        const isChecked = roleModulePermissions[action.id] || false;
                        return (
                          <td key={action.id} className="py-4 px-6 text-center">
                            <div className="flex items-center justify-center">
                              <Switch
                                checked={isChecked}
                                onCheckedChange={(val) =>
                                  handleToggle(selectedRole, module.id, action.id, val)
                                }
                                aria-label={`${module.name} ${action.label}`}
                              />
                            </div>
                          </td>
                        );
                      })}
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default RoleManagement;

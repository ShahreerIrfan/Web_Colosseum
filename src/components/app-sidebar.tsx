import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
} from '@/components/ui/sidebar';
import { useSignOut } from '@/hooks/auth/useSignOut';
import type { UserPayload } from '@/types/api/authTypes';
import { getUserPayload } from '@/utils/localStorageUtils';
import { isModuleVisibleInSidebar } from '@/utils/rbacUtils';
import {
  Database,
  Eye,
  Footprints,
  Globe,
  Headphones,
  Landmark,
  Layers,
  LayoutDashboard,
  LogOut,
  Navigation,
  RefreshCw,
  Route,
  Settings,
  ShieldCheck,
  Ticket,
  Users,
  Lock,
} from 'lucide-react';
import React, { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';

interface NavModuleItem {
  title: string;
  moduleName: string;
  url: string;
  icon: React.ComponentType<{ className?: string }>;
}

const ALL_NAV_MODULES: NavModuleItem[] = [
  {
    title: 'Dashboard',
    moduleName: 'Analytics & Visitor Telemetry',
    url: '/admin/dashboard',
    icon: LayoutDashboard,
  },
  {
    title: 'Role Management',
    moduleName: 'Role-Based Access Control',
    url: '/admin/dashboard/rbac',
    icon: ShieldCheck,
  },
  {
    title: 'Monuments & Sites',
    moduleName: 'Monuments & Landmarks',
    url: '/admin/dashboard/landmarks',
    icon: Landmark,
  },
  {
    title: 'Floor Maps',
    moduleName: 'Vector Floor Maps',
    url: '/admin/dashboard/floors',
    icon: Layers,
  },
  {
    title: 'Viewpoints',
    moduleName: 'Viewpoint Hotspots',
    url: '/admin/dashboard/viewpoints',
    icon: Eye,
  },
  {
    title: 'Audio Guides',
    moduleName: 'Audio Guides & Narration',
    url: '/admin/dashboard/audio',
    icon: Headphones,
  },
  {
    title: 'Languages',
    moduleName: 'Languages & Localization',
    url: '/admin/dashboard/languages',
    icon: Globe,
  },
  {
    title: 'Walking Itineraries',
    moduleName: 'Walking Tour Itineraries',
    url: '/admin/dashboard/itineraries',
    icon: Footprints,
  },
  {
    title: 'Pedestrian Routes',
    moduleName: 'Pedestrian Street Routes',
    url: '/admin/dashboard/pedestrian-routes',
    icon: Route,
  },
  {
    title: 'GPS Geofencing',
    moduleName: 'GPS Geofencing & Tracking',
    url: '/admin/dashboard/gps',
    icon: Navigation,
  },
  {
    title: 'Sync Manifests',
    moduleName: 'Sync Bundles & Manifests',
    url: '/admin/dashboard/sync',
    icon: RefreshCw,
  },
  {
    title: 'Mobile Cache',
    moduleName: 'Mobile Client Offline Cache',
    url: '/admin/dashboard/offline-storage',
    icon: Database,
  },
  {
    title: 'Tickets & Entry',
    moduleName: 'Access & Tickets',
    url: '/admin/dashboard/tickets',
    icon: Ticket,
  },
  {
    title: 'Park Config',
    moduleName: 'Park Configuration',
    url: '/admin/dashboard/park-config',
    icon: Settings,
  },
  {
    title: 'Staff Accounts',
    moduleName: 'Staff & User Accounts',
    url: '/admin/dashboard/users',
    icon: Users,
  },
];

export const AppSidebar: React.FC = () => {
  const location = useLocation();
  const { signOut, loading: signingOut } = useSignOut();

  const [user, setUser] = useState<UserPayload | null>(() => {
    try {
      return getUserPayload();
    } catch {
      return null;
    }
  });

  // Re-sync user payload if updated in localStorage
  useEffect(() => {
    const handleStorageChange = () => {
      try {
        setUser(getUserPayload());
      } catch {
        setUser(null);
      }
    };

    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('rbac-updated', handleStorageChange);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('rbac-updated', handleStorageChange);
    };
  }, []);

  // Filter modules: ONLY appear if user has modification permissions (Create, Update, or Delete).
  // If the user has don't have on a module (except read), that module won't appear in the sidebar.
  const visibleNavItems = ALL_NAV_MODULES.filter((item) =>
    isModuleVisibleInSidebar(item.moduleName, user)
  );

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              size="lg"
              className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
            >
              <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground font-bold">
                <Landmark className="size-4" />
              </div>
              <div className="grid flex-1 text-left text-sm leading-tight">
                <span className="truncate font-semibold text-sidebar-foreground">
                  Colosseum Admin
                </span>
                <span className="truncate text-xs text-sidebar-foreground/70">Control Center</span>
              </div>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <div className="flex items-center justify-between px-2 pb-1">
            <SidebarGroupLabel className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
              Management Modules
            </SidebarGroupLabel>
            <span className="text-[10px] font-mono text-muted-foreground opacity-70">
              {visibleNavItems.length} Active
            </span>
          </div>

          <SidebarGroupContent>
            <SidebarMenu>
              {visibleNavItems.length === 0 ? (
                <div className="px-3 py-6 text-center text-xs text-muted-foreground flex flex-col items-center gap-2 group-data-[collapsible=icon]:hidden">
                  <Lock className="size-4 text-muted-foreground opacity-50" />
                  <p className="font-medium">No Modifiable Modules</p>
                  <p className="text-[11px] opacity-70">
                    Read-only account. You do not have create, edit, or delete access to management
                    modules.
                  </p>
                </div>
              ) : (
                visibleNavItems.map((item) => {
                  const isActive = location.pathname === item.url;

                  return (
                    <SidebarMenuItem key={item.moduleName}>
                      <SidebarMenuButton asChild isActive={isActive} tooltip={item.title}>
                        <Link to={item.url}>
                          <item.icon className="size-4 shrink-0" />
                          <span className="truncate">{item.title}</span>
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  );
                })
              )}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter>
        <SidebarMenu className="gap-2">
          {/* Avatar Profile Block */}
          <SidebarMenuItem>
            <div className="flex items-center gap-3 p-2 rounded-lg bg-sidebar-accent/50 group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:p-0">
              <div className="flex size-8 items-center justify-center rounded-full bg-primary text-primary-foreground text-xs font-bold shrink-0 shadow-xs">
                {user?.name?.charAt(0) || 'A'}
              </div>
              <div className="flex flex-col text-left min-w-0 group-data-[collapsible=icon]:hidden">
                <span className="text-xs font-bold text-sidebar-foreground truncate leading-tight">
                  {user?.name || 'Administrator'}
                </span>
                <span className="text-[10px] text-muted-foreground truncate uppercase font-semibold">
                  {user?.userRole || user?.role || 'SUPER_ADMIN'}
                </span>
              </div>
            </div>
          </SidebarMenuItem>

          {/* Sign Out Button */}
          <SidebarMenuItem>
            <SidebarMenuButton
              onClick={signOut}
              disabled={signingOut}
              tooltip="Sign Out"
              className="w-full hover:bg-destructive/10 hover:text-destructive text-destructive cursor-pointer group-data-[collapsible=icon]:justify-center gap-2.5 h-9"
            >
              <LogOut className="size-4 shrink-0" />
              <span className="text-xs font-semibold group-data-[collapsible=icon]:hidden">
                Sign Out
              </span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>

      <SidebarRail />
    </Sidebar>
  );
};

export default AppSidebar;

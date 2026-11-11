import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  SidebarRail,
  useSidebar,
} from '@/components/ui/sidebar';
import { useSignOut } from '@/hooks/auth/useSignOut';
import type { UserPayload } from '@/types/api/authTypes';
import { getUserPayload } from '@/utils/localStorageUtils';
import { ADMIN_MODULES, isModuleVisibleInSidebar } from '@/utils/rbacUtils';
import {
  ChevronDown,
  Eye,
  Globe,
  Landmark,
  Layers,
  LayoutDashboard,
  LogOut,
  Route,
  ShieldCheck,
  UserCog,
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

type ModuleId = (typeof ADMIN_MODULES)[number]['id'];

const navTargets: Record<ModuleId, Pick<NavModuleItem, 'url' | 'icon'>> = {
  analytics: { url: '/admin/dashboard', icon: LayoutDashboard },
  landmarks: { url: '/admin/dashboard/landmarks', icon: Landmark },
  floors: { url: '/admin/dashboard/floors', icon: Layers },
  viewpoints: { url: '/admin/dashboard/viewpoints', icon: Eye },
  floorItinerary: { url: '/admin/dashboard/viewpoints/itinerary', icon: Route },
  pedestrianRoutes: { url: '/admin/dashboard/pedestrian-routes', icon: Route },
  rbac: { url: '/admin/dashboard/rbac', icon: ShieldCheck },
  users: { url: '/admin/dashboard/users', icon: UserCog },
  languages: { url: '/admin/dashboard/languages', icon: Globe },
};

const navigation = ADMIN_MODULES.map(({ id, name, key }) => ({
  id,
  title: name,
  moduleName: key,
  ...navTargets[id],
}));
const touristSpotIds: readonly ModuleId[] = [
  'landmarks',
  'floors',
  'viewpoints',
  'floorItinerary',
  'pedestrianRoutes',
];

export const AppSidebar: React.FC = () => {
  const location = useLocation();
  const { signOut, loading: signingOut } = useSignOut();
  const { isMobile, open, setOpen } = useSidebar();
  const [touristSpotsOpen, setTouristSpotsOpen] = useState(true);
  const [viewpointOpen, setViewpointOpen] = useState(true);

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

  const canSee = (item: NavModuleItem) => isModuleVisibleInSidebar(item.moduleName, user);
  const visible = navigation.filter(canSee);
  const dashboard = visible.find(({ id }) => id === 'analytics');
  const touristSpots = visible.filter(({ id }) => touristSpotIds.includes(id));
  const viewpointItems = touristSpots.filter(
    ({ id }) => id === 'viewpoints' || id === 'floorItinerary'
  );
  const managementItems = visible.filter(
    ({ id }) => id !== 'analytics' && !touristSpotIds.includes(id)
  );
  const sidebarExpanded = isMobile || open;
  const roleCode = user?.role || user?.userRole || 'SUPER_ADMIN';
  const roleName =
    user?.roleName ||
    (roleCode.toUpperCase().startsWith('CUSTOM_')
      ? 'Custom role'
      : roleCode
          .toLowerCase()
          .split('_')
          .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
          .join(' '));
  const touristSpotsExpanded = sidebarExpanded && touristSpotsOpen;
  const touristSpotActive = touristSpots.some((item) => location.pathname === item.url);

  const renderLink = (item: NavModuleItem) => {
    const isActive = location.pathname === item.url;
    return (
      <SidebarMenuItem key={item.url}>
        <SidebarMenuButton asChild isActive={isActive} tooltip={item.title}>
          <Link to={item.url} aria-current={isActive ? 'page' : undefined}>
            <item.icon className="size-4 shrink-0" />
            <span className="truncate">{item.title}</span>
          </Link>
        </SidebarMenuButton>
      </SidebarMenuItem>
    );
  };

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
        <SidebarMenu>
          {visible.length === 0 && (
            <SidebarMenuItem className="px-3 py-6 text-center text-xs text-muted-foreground flex flex-col items-center gap-2 group-data-[collapsible=icon]:hidden">
              <Lock className="size-4 text-muted-foreground opacity-50" />
              <p className="font-medium">No management pages</p>
              <p className="text-[11px] opacity-70">
                Read-only account. You do not have create, edit, or delete access to the management
                pages.
              </p>
            </SidebarMenuItem>
          )}
          {dashboard && renderLink(dashboard)}
          {touristSpots.length > 0 && (
            <SidebarMenuItem>
              <SidebarMenuButton
                type="button"
                tooltip="Tourist Spots"
                isActive={touristSpotActive}
                aria-expanded={touristSpotsExpanded}
                aria-controls="tourist-spots-menu"
                onClick={() => {
                  if (!sidebarExpanded) {
                    setOpen(true);
                    setTouristSpotsOpen(true);
                  } else {
                    setTouristSpotsOpen((expanded) => !expanded);
                  }
                }}
              >
                <Landmark className="size-4 shrink-0" />
                <span>Tourist Spots</span>
                <ChevronDown
                  className={`ml-auto size-4 transition-transform ${touristSpotsExpanded ? 'rotate-180' : ''}`}
                />
              </SidebarMenuButton>
              <SidebarMenuSub id="tourist-spots-menu" hidden={!touristSpotsExpanded}>
                {touristSpots.map((item) => {
                  if (viewpointItems.includes(item)) {
                    if (item !== viewpointItems[0]) return null;
                    return (
                      <SidebarMenuSubItem key="viewpoint-group">
                        <SidebarMenuSubButton
                          asChild
                          isActive={viewpointItems.some(({ url }) => location.pathname === url)}
                        >
                          <button
                            type="button"
                            className="w-full"
                            aria-expanded={viewpointOpen}
                            aria-controls="viewpoint-menu"
                            onClick={() => setViewpointOpen((value) => !value)}
                          >
                            <Eye />
                            <span>Viewpoint</span>
                            <ChevronDown
                              className={`ml-auto ${viewpointOpen ? 'rotate-180' : ''}`}
                            />
                          </button>
                        </SidebarMenuSubButton>
                        <SidebarMenuSub
                          id="viewpoint-menu"
                          className={viewpointOpen ? undefined : 'hidden'}
                        >
                          {viewpointItems.map((child) => (
                            <SidebarMenuSubItem key={child.url}>
                              <SidebarMenuSubButton
                                asChild
                                isActive={location.pathname === child.url}
                              >
                                <Link
                                  to={child.url}
                                  aria-current={
                                    location.pathname === child.url ? 'page' : undefined
                                  }
                                >
                                  <child.icon />
                                  <span>
                                    {child.id === 'viewpoints' ? 'Manage Viewpoints' : child.title}
                                  </span>
                                </Link>
                              </SidebarMenuSubButton>
                            </SidebarMenuSubItem>
                          ))}
                        </SidebarMenuSub>
                      </SidebarMenuSubItem>
                    );
                  }
                  const isActive = location.pathname === item.url;
                  return (
                    <SidebarMenuSubItem key={item.url}>
                      <SidebarMenuSubButton asChild isActive={isActive}>
                        <Link to={item.url} aria-current={isActive ? 'page' : undefined}>
                          <item.icon />
                          <span>{item.title}</span>
                        </Link>
                      </SidebarMenuSubButton>
                    </SidebarMenuSubItem>
                  );
                })}
              </SidebarMenuSub>
            </SidebarMenuItem>
          )}
          {managementItems.map(renderLink)}
        </SidebarMenu>
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
                <span
                  className="text-[10px] text-muted-foreground truncate font-semibold"
                  title={roleName}
                >
                  {roleName}
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

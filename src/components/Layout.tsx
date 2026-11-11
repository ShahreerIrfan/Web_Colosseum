import AppSidebar from '@/components/app-sidebar';
import authApi from '@/apis/auth/authApi';
import Spinner from '@/components/common/Spinner';
import { Separator } from '@/components/ui/separator';
import { SidebarInset, SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar';
import { getUserPayload, isAuthenticated, setUserPayload } from '@/utils/localStorageUtils';
import React, { useEffect, useState } from 'react';
import { Navigate, Outlet } from 'react-router-dom';

export const ProtectedLayout: React.FC = () => {
  const authenticated = isAuthenticated();
  const [ready, setReady] = useState(false);
  useEffect(() => {
    if (!authenticated) return;
    let active = true;
    const refresh = () => {
      const session = getUserPayload();
      authApi
        .getMe()
        .then((profile) => {
          if (!active || getUserPayload().id !== session.id) return;
          setUserPayload({ ...session, ...profile });
          window.dispatchEvent(new Event('rbac-updated'));
        })
        .catch(() => {})
        .finally(() => {
          if (active) setReady(true);
        });
    };
    refresh();
    window.addEventListener('focus', refresh);
    return () => {
      active = false;
      window.removeEventListener('focus', refresh);
    };
  }, [authenticated]);

  if (!authenticated) {
    return <Navigate to="/admin" replace />;
  }
  if (!ready) {
    return (
      <div className="grid min-h-dvh place-items-center bg-background p-6">
        <Spinner size="lg" label="Loading…" />
      </div>
    );
  }

  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <header className="flex h-14 shrink-0 items-center gap-2 border-b border-border bg-card/60 backdrop-blur-md px-4 transition-[width,height] ease-linear">
          <SidebarTrigger className="-ml-1" />
          <Separator orientation="vertical" className="mr-2 h-4" />
          <div className="flex items-center gap-2 text-xs font-semibold text-muted-foreground">
            <span>Admin Console</span>
          </div>
        </header>
        <main className="flex flex-1 flex-col p-6 bg-background text-foreground">
          <Outlet />
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
};

export const PublicLayout: React.FC = () => {
  if (isAuthenticated()) {
    return <Navigate to="/admin/dashboard" replace />;
  }

  return (
    <div className="flex flex-col min-h-screen bg-background text-foreground antialiased selection:bg-primary/20 selection:text-foreground">
      <main className="flex-1 flex flex-col">
        <Outlet />
      </main>
    </div>
  );
};

export default ProtectedLayout;

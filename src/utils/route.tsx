import { ProtectedLayout, PublicLayout } from '@/components/Layout';
import AdminLogin from '@/pages/AdminLogin';
import Dashboard from '@/pages/admin/Dashboard';
import ErrorPage from '@/pages/admin/ErrorPage';
import ModuleManagementView from '@/pages/admin/ModuleManagementView';
import RoleManagement from '@/pages/admin/RoleManagement';
import UserManagement from '@/pages/admin/UserManagement';
import RbacGuard from '@/components/auth/RbacGuard';
import Auth from '@/pages/Auth';
import Landing from '@/pages/Landing';
import LandmarkDetails from '@/pages/LandmarkDetails';
import NotFound from '@/pages/NotFound';
import Profile from '@/pages/Profile';
import Settings from '@/pages/Settings';
import { createBrowserRouter, Navigate } from 'react-router-dom';

export const router = createBrowserRouter([
  {
    path: '/',
    element: <Landing />,
  },
  {
    element: <PublicLayout />,
    children: [
      {
        path: '/admin',
        element: <AdminLogin />,
      },
      {
        path: '/auth',
        element: <Auth />,
      },
    ],
  },
  {
    path: '/admin/dashboard',
    element: <ProtectedLayout />,
    children: [
      {
        index: true,
        element: <Dashboard />,
      },
      {
        path: 'error',
        element: <ErrorPage />,
      },
      {
        path: 'rbac',
        element: (
          <RbacGuard moduleName="Role-Based Access Control">
            <RoleManagement />
          </RbacGuard>
        ),
      },
      {
        path: 'users',
        element: (
          <RbacGuard moduleName="Role-Based Access Control">
            <UserManagement />
          </RbacGuard>
        ),
      },
      {
        path: ':moduleKey',
        element: <ModuleManagementView />,
      },
    ],
  },
  {
    element: <ProtectedLayout />,
    children: [
      {
        path: '/home',
        element: <Navigate to="/admin/dashboard" replace />,
      },
      {
        path: '/landmark/:id',
        element: <LandmarkDetails />,
      },
      {
        path: '/profile/:username',
        element: <Profile />,
      },
      {
        path: '/settings',
        element: <Settings />,
      },
    ],
  },
  {
    path: '*',
    element: <NotFound />,
  },
]);

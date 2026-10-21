import { getUserPayload } from '@/utils/localStorageUtils';
import { isModuleVisibleInSidebar } from '@/utils/rbacUtils';
import React from 'react';
import { Navigate } from 'react-router-dom';

interface RbacGuardProps {
  moduleName: string;
  children: React.ReactNode;
}

/**
 * Guards administrative routes by checking whether the logged in user possesses
 * active modification access for the target module.
 * If user lacks access, redirects to /admin/dashboard/error.
 */
export const RbacGuard: React.FC<RbacGuardProps> = ({ moduleName, children }) => {
  const user = (() => {
    try {
      return getUserPayload();
    } catch {
      return null;
    }
  })();

  const isAllowed = isModuleVisibleInSidebar(moduleName, user);
  if (!isAllowed) {
    return <Navigate to="/admin/dashboard/error" replace />;
  }

  return <>{children}</>;
};

export default RbacGuard;

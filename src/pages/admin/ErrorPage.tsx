import { Button } from '@/components/ui/button';
import { getUserPayload } from '@/utils/localStorageUtils';
import { AlertTriangle, ArrowLeft, Lock, ShieldAlert } from 'lucide-react';
import React from 'react';
import { Link, useNavigate } from 'react-router-dom';

export const ErrorPage: React.FC = () => {
  const navigate = useNavigate();

  const userRole = (() => {
    try {
      const user = getUserPayload();
      return user?.userRole || user?.role || 'USER';
    } catch {
      return 'USER';
    }
  })();

  return (
    <div className="flex-1 flex items-center justify-center min-h-[70vh] p-4 text-foreground">
      <div className="max-w-md w-full bg-card border border-border rounded-2xl p-8 shadow-lg text-center space-y-6">
        {/* Warning Icon Badge */}
        <div className="mx-auto flex size-16 items-center justify-center rounded-2xl bg-destructive/10 text-destructive border border-destructive/20 shadow-xs">
          <ShieldAlert className="size-8" />
        </div>

        {/* Primary Error Heading (Matches exact request) */}
        <div className="space-y-2">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-destructive/10 text-destructive text-xs font-semibold">
            <AlertTriangle className="size-3" />
            <span>Access Denied (403)</span>
          </div>
          <h1 className="text-2xl font-black tracking-tight text-foreground capitalize">
            something got wrong
          </h1>
          <p className="text-xs text-muted-foreground leading-relaxed">
            You do not have sufficient permissions to view or manage this functional module. Your
            current assigned role ({userRole}) only possesses restricted or read-only access.
          </p>
        </div>

        {/* Role & Rule Clarification Box */}
        <div className="bg-muted/40 border border-border rounded-xl p-3.5 text-left text-xs space-y-1.5">
          <div className="flex items-center gap-2 font-semibold text-foreground">
            <Lock className="size-3.5 text-muted-foreground" />
            <span>RBAC Security Policy:</span>
          </div>
          <p className="text-[11px] text-muted-foreground leading-normal">
            Modules require active modification rights (Create, Edit/Update, or Delete) to access.
            Accounts with only Read privileges are restricted from administrative module views.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate(-1)}
            className="w-full sm:w-auto gap-2 cursor-pointer border-border hover:bg-muted"
          >
            <ArrowLeft className="size-3.5" />
            <span>Go Back</span>
          </Button>

          <Button
            asChild
            size="sm"
            className="w-full sm:w-auto gap-2 bg-primary text-primary-foreground font-semibold cursor-pointer shadow-xs hover:opacity-90"
          >
            <Link to="/admin/dashboard">Return to Dashboard</Link>
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ErrorPage;

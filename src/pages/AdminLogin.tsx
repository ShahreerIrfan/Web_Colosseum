import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useSignIn } from '@/hooks/auth/useSignIn';
import { Eye, EyeOff, Landmark, Loader2, Lock, Mail, ShieldCheck } from 'lucide-react';
import React, { useState } from 'react';
import { Link } from 'react-router-dom';

export const AdminLogin: React.FC = () => {
  const { form, loading, handleChange, handleSubmit } = useSignIn();
  const [showPassword, setShowPassword] = useState(false);

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col items-center justify-center px-4 py-12 relative overflow-hidden">
      {/* Background radial glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-primary/10 rounded-full blur-3xl pointer-events-none" />

      {/* Return to Public Site Link */}
      <Link
        to="/"
        className="absolute top-6 left-6 text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors"
      >
        ← Back to Public Site
      </Link>

      <div className="w-full max-w-md relative z-10 space-y-6">
        {/* Admin Card */}
        <div className="bg-card border border-border rounded-3xl shadow-2xl p-8 space-y-6">
          {/* Header */}
          <div className="text-center space-y-2">
            <div className="w-14 h-14 rounded-2xl bg-primary/10 text-primary flex items-center justify-center mx-auto mb-3 shadow-xs">
              <Landmark className="w-7 h-7" />
            </div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-secondary text-secondary-foreground text-[11px] font-bold uppercase tracking-wider">
              <ShieldCheck className="w-3.5 h-3.5 text-primary" />
              <span>Restricted Administration</span>
            </div>
            <h1 className="text-2xl font-black tracking-tight text-foreground">
              Colosseum Control Center
            </h1>
            <p className="text-xs text-muted-foreground max-w-xs mx-auto leading-relaxed">
              Enter your authorized staff credentials to manage monuments, audio trails, vector
              maps, and visitor sync manifests.
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <label
                htmlFor="admin-email"
                className="text-xs font-semibold text-foreground uppercase tracking-wider"
              >
                Administrator Email
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-2.5 w-4 h-4 text-muted-foreground pointer-events-none" />
                <Input
                  id="admin-email"
                  name="email"
                  type="email"
                  required
                  placeholder="email"
                  value={form.email}
                  onChange={handleChange}
                  className="pl-9 bg-input"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label
                  htmlFor="admin-password"
                  className="text-xs font-semibold text-foreground uppercase tracking-wider"
                >
                  Password
                </label>
              </div>
              <div className="relative">
                <Lock className="absolute left-3 top-2.5 w-4 h-4 text-muted-foreground pointer-events-none" />
                <Input
                  id="admin-password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  required
                  placeholder="••••••••••••"
                  value={form.password}
                  onChange={handleChange}
                  className="pl-9 pr-10 bg-input"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((p) => !p)}
                  className="absolute right-3 top-2.5 text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <Button
              type="submit"
              disabled={loading}
              className="w-full mt-2 font-semibold bg-primary text-primary-foreground shadow-sm hover:opacity-90 py-2.5"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                  Authenticating Staff...
                </>
              ) : (
                'Sign In to Admin Console'
              )}
            </Button>
          </form>

          {/* Security Notice */}
          <div className="pt-4 border-t border-border text-center space-y-1">
            <p className="text-[11px] text-muted-foreground font-mono">
              Authorized personnel only • S•P•Q•R IT Systems
            </p>
            <p className="text-[10px] text-muted-foreground/80">
              All administrative access requests and authentication sessions are cryptographically
              logged.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminLogin;

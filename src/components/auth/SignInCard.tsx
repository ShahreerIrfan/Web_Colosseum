import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useSignIn } from '@/hooks/auth/useSignIn';
import { Eye, EyeOff, Headphones, Loader2, Lock, Mail } from 'lucide-react';
import React, { useState } from 'react';

interface SignInCardProps {
  onToggle: () => void;
}

export const SignInCard: React.FC<SignInCardProps> = ({ onToggle }) => {
  const { form, loading, handleChange, handleSubmit } = useSignIn();
  const [showPassword, setShowPassword] = useState(false);

  return (
    <div className="w-full max-w-md bg-card border border-border rounded-2xl shadow-xl p-8 space-y-6">
      {/* Header */}
      <div className="text-center space-y-2">
        <div className="w-12 h-12 rounded-xl bg-primary/10 text-primary flex items-center justify-center mx-auto mb-2">
          <Headphones className="w-6 h-6" />
        </div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">Welcome Back</h1>
        <p className="text-sm text-muted-foreground">
          Sign in to your Colosseum Audio Tour account
        </p>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-1.5">
          <label
            htmlFor="email"
            className="text-xs font-semibold text-foreground uppercase tracking-wider"
          >
            Email Address
          </label>
          <div className="relative">
            <Mail className="absolute left-3 top-2.5 w-4 h-4 text-muted-foreground pointer-events-none" />
            <Input
              id="email"
              name="email"
              type="email"
              required
              placeholder="visitor@colosseum.it"
              value={form.email}
              onChange={handleChange}
              className="pl-9 bg-input"
            />
          </div>
        </div>

        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <label
              htmlFor="password"
              className="text-xs font-semibold text-foreground uppercase tracking-wider"
            >
              Password
            </label>
          </div>
          <div className="relative">
            <Lock className="absolute left-3 top-2.5 w-4 h-4 text-muted-foreground pointer-events-none" />
            <Input
              id="password"
              name="password"
              type={showPassword ? 'text' : 'password'}
              required
              placeholder="••••••••"
              value={form.password}
              onChange={handleChange}
              className="pl-9 pr-10 bg-input"
            />
            <button
              type="button"
              onClick={() => setShowPassword((p) => !p)}
              className="absolute right-3 top-2.5 text-muted-foreground hover:text-foreground transition-colors"
              aria-label={showPassword ? 'Hide password' : 'Show password'}
            >
              {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
        </div>

        <Button type="submit" disabled={loading} className="w-full mt-2 font-semibold">
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin mr-2" />
              Signing In...
            </>
          ) : (
            'Sign In'
          )}
        </Button>
      </form>

      {/* Footer Toggle */}
      <div className="text-center pt-2 border-t border-border">
        <p className="text-xs text-muted-foreground">
          Don't have an account?{' '}
          <button
            type="button"
            onClick={onToggle}
            className="text-primary font-semibold hover:underline cursor-pointer"
          >
            Create an Account
          </button>
        </p>
      </div>
    </div>
  );
};

export default SignInCard;

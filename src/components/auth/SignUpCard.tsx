import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useSignUp } from '@/hooks/auth/useSignUp';
import { Headphones, Loader2, Lock, Mail, User } from 'lucide-react';
import React from 'react';

interface SignUpCardProps {
  onToggle: () => void;
}

export const SignUpCard: React.FC<SignUpCardProps> = ({ onToggle }) => {
  const { form, loading, handleChange, handleSubmit } = useSignUp();

  return (
    <div className="w-full max-w-md bg-card border border-border rounded-2xl shadow-xl p-8 space-y-6">
      {/* Header */}
      <div className="text-center space-y-2">
        <div className="w-12 h-12 rounded-xl bg-primary/10 text-primary flex items-center justify-center mx-auto mb-2">
          <Headphones className="w-6 h-6" />
        </div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">Create Account</h1>
        <p className="text-sm text-muted-foreground">
          Join the exclusive Colosseum Audio Tour Guide
        </p>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-1.5">
          <label
            htmlFor="name"
            className="text-xs font-semibold text-foreground uppercase tracking-wider"
          >
            Full Name
          </label>
          <div className="relative">
            <User className="absolute left-3 top-2.5 w-4 h-4 text-muted-foreground pointer-events-none" />
            <Input
              id="name"
              name="name"
              type="text"
              required
              placeholder="Marcus Aurelius"
              value={form.name}
              onChange={handleChange}
              className="pl-9 bg-input"
            />
          </div>
        </div>

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
          <label
            htmlFor="password"
            className="text-xs font-semibold text-foreground uppercase tracking-wider"
          >
            Password
          </label>
          <div className="relative">
            <Lock className="absolute left-3 top-2.5 w-4 h-4 text-muted-foreground pointer-events-none" />
            <Input
              id="password"
              name="password"
              type="password"
              required
              placeholder="Minimum 6 characters"
              value={form.password}
              onChange={handleChange}
              className="pl-9 bg-input"
            />
          </div>
        </div>

        <Button type="submit" disabled={loading} className="w-full mt-2 font-semibold">
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin mr-2" />
              Creating Account...
            </>
          ) : (
            'Sign Up'
          )}
        </Button>
      </form>

      {/* Footer Toggle */}
      <div className="text-center pt-2 border-t border-border">
        <p className="text-xs text-muted-foreground">
          Already have an account?{' '}
          <button
            type="button"
            onClick={onToggle}
            className="text-primary font-semibold hover:underline cursor-pointer"
          >
            Sign In
          </button>
        </p>
      </div>
    </div>
  );
};

export default SignUpCard;

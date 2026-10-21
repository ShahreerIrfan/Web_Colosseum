import SignInCard from '@/components/auth/SignInCard';
import SignUpCard from '@/components/auth/SignUpCard';
import React, { useState } from 'react';
import { Link } from 'react-router-dom';

type AuthState = 'signIn' | 'signUp';

export const Auth: React.FC = () => {
  const [authState, setAuthState] = useState<AuthState>('signIn');

  const handleToggle = () => {
    setAuthState((prev) => (prev === 'signIn' ? 'signUp' : 'signIn'));
  };

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center px-4 py-12 relative overflow-hidden">
      {/* Background radial glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-primary/10 rounded-full blur-3xl pointer-events-none" />

      {/* Return Home Link */}
      <Link
        to="/"
        className="absolute top-6 left-6 text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors"
      >
        ← Back to Home
      </Link>

      <div className="w-full max-w-md relative z-10">
        {authState === 'signIn' ? (
          <SignInCard onToggle={handleToggle} />
        ) : (
          <SignUpCard onToggle={handleToggle} />
        )}
      </div>
    </div>
  );
};

export default Auth;

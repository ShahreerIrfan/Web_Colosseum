import { Button } from '@/components/ui/button';
import { Compass, Home } from 'lucide-react';
import React from 'react';
import { Link } from 'react-router-dom';

export const NotFound: React.FC = () => {
  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6 text-center space-y-6">
      <div className="w-16 h-16 rounded-3xl bg-secondary text-primary flex items-center justify-center shadow-lg">
        <Compass className="w-8 h-8" />
      </div>

      <div className="space-y-2">
        <h1 className="text-4xl font-black text-foreground">404 - Page Not Found</h1>
        <p className="text-sm text-muted-foreground max-w-sm mx-auto">
          The path you are trying to reach does not exist on the map of Ancient Rome.
        </p>
      </div>

      <Link to="/">
        <Button className="gap-2">
          <Home className="w-4 h-4" />
          Back to Home
        </Button>
      </Link>
    </div>
  );
};

export default NotFound;

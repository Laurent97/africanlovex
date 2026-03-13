import { ReactNode } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Heart } from 'lucide-react';
import { Link } from 'react-router-dom';

interface AuthGuardProps {
  children: ReactNode;
  fallback?: ReactNode;
  requiredRole?: 'user' | 'premium' | 'admin';
}

export const AuthGuard = ({ children, fallback, requiredRole }: AuthGuardProps) => {
  const { isAuthenticated, isLoading, userRole } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            <div className="text-center">
              <Heart className="w-8 h-8 animate-spin mx-auto mb-4 text-love-red" />
              <p>Checking authentication...</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Check role requirements
  if (requiredRole) {
    const hasRequiredRole = 
      requiredRole === 'user' ||
      (requiredRole === 'premium' && (userRole === 'premium' || userRole === 'admin')) ||
      (requiredRole === 'admin' && userRole === 'admin');
    
    if (!hasRequiredRole) {
      return (
        <div className="min-h-screen bg-background flex items-center justify-center">
          <Card className="w-full max-w-md">
            <CardContent className="pt-6">
              <div className="text-center">
                <Heart className="w-12 h-12 text-love-red mx-auto mb-4" />
                <h2 className="text-xl font-semibold mb-2">
                  {requiredRole === 'premium' ? 'Premium Required' : 'Access Denied'}
                </h2>
                <p className="text-muted-foreground mb-6">
                  {requiredRole === 'premium' 
                    ? 'This feature requires a premium subscription!'
                    : 'You don\'t have permission to access this feature!'
                  }
                </p>
                <div className="space-y-3">
                  {requiredRole === 'premium' && (
                    <Link to="/vip" className="block">
                      <Button className="w-full gradient-sunset-bg">
                        Upgrade to Premium
                      </Button>
                    </Link>
                  )}
                  <Link to="/dashboard" className="block">
                    <Button variant="outline" className="w-full">
                      Back to Dashboard
                    </Button>
                  </Link>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      );
    }
  }

  if (!isAuthenticated) {
    if (fallback) {
      return <>{fallback}</>;
    }

    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            <div className="text-center">
              <Heart className="w-12 h-12 text-love-red mx-auto mb-4" />
              <h2 className="text-xl font-semibold mb-2">Sign In Required</h2>
              <p className="text-muted-foreground mb-6">
                Please sign in to access this feature!
              </p>
              <div className="space-y-3">
                <Link to="/auth" className="block">
                  <Button className="w-full gradient-sunset-bg">
                    Sign In / Sign Up
                  </Button>
                </Link>
                <Link to="/" className="block">
                  <Button variant="outline" className="w-full">
                    Back to Home
                  </Button>
                </Link>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return <>{children}</>;
};

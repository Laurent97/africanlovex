import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/hooks/use-auth';
import { debugAuth, testAuthFlow } from '@/lib/debug-auth';
import { Link } from 'react-router-dom';

export const AuthTest = () => {
  const { user, isAuthenticated, loading } = useAuth();

  const handleDebug = async () => {
    await debugAuth();
  };

  const handleTestFlow = async () => {
    await testAuthFlow();
  };

  if (loading) {
    return <div>Loading auth test...</div>;
  }

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <Card>
        <CardHeader>
          <CardTitle>Authentication Test Panel</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <strong>Loading:</strong> {loading ? 'Yes' : 'No'}
            </div>
            <div>
              <strong>Authenticated:</strong> {isAuthenticated ? 'Yes' : 'No'}
            </div>
            <div className="col-span-2">
              <strong>User ID:</strong> {user?.id || 'Not logged in'}
            </div>
            <div className="col-span-2">
              <strong>User Email:</strong> {user?.email || 'Not available'}
            </div>
          </div>

          <div className="flex gap-2 flex-wrap">
            <Button onClick={handleDebug} variant="outline">
              Debug Auth
            </Button>
            <Button onClick={handleTestFlow} variant="outline">
              Test Auth Flow
            </Button>
            <Link to="/matching">
              <Button>Go to Matching</Button>
            </Link>
            <Link to="/auth">
              <Button variant="outline">Go to Auth</Button>
            </Link>
          </div>

          <div className="text-xs text-muted-foreground">
            <p>Open browser console to see debug output when clicking debug buttons.</p>
            <p>Check localStorage for auth tokens.</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

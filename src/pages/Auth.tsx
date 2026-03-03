import React, { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Heart, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { PhoneAuth } from '@/components/auth/PhoneAuth';
import { EmailAuth } from '@/components/auth/EmailAuth';
import { useAuth } from '@/hooks/use-auth';

const Auth = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const redirectTo = searchParams.get('redirect') || '/dashboard';
  const { isAuthenticated } = useAuth();

  // Redirect if already authenticated
  React.useEffect(() => {
    if (isAuthenticated) {
      navigate(redirectTo, { replace: true });
    }
  }, [isAuthenticated, navigate, redirectTo]);

  const handleAuthSuccess = (user: any) => {
    console.log('Auth successful:', user);
    navigate(redirectTo, { replace: true });
  };

  const handleAuthError = (error: string) => {
    console.error('Auth error:', error);
  };

  if (isAuthenticated) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <Heart className="w-8 h-8 animate-spin mx-auto mb-4 text-love-red" />
          <p>Redirecting...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-love-red/10 via-love-purple/10 to-love-gold/10">
      {/* Header */}
      <div className="container mx-auto px-4 py-6">
        <div className="flex items-center justify-between">
          <Button 
            variant="ghost" 
            onClick={() => navigate('/')}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Home
          </Button>
          
          <div className="flex items-center gap-2">
            <Heart className="w-6 h-6 text-love-red" />
            <span className="font-bold text-xl">LoveX</span>
          </div>
          
          <div className="w-20" /> {/* Spacer for centering */}
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          {/* Welcome Section */}
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold mb-4">
              Welcome to <span className="text-love-red">LoveX</span> 💕
            </h1>
            <p className="text-xl text-muted-foreground mb-2">
              Where East African Hearts Connect
            </p>
            <p className="text-sm text-muted-foreground">
              Join thousands of singles across Rwanda, Kenya, Uganda, Tanzania, Burundi & Congo
            </p>
          </div>

          {/* Auth Forms */}
          <div className="flex justify-center">
            <Tabs defaultValue="phone" className="w-full max-w-md">
              <TabsList className="grid w-full grid-cols-2 mb-6">
                <TabsTrigger value="phone">Phone</TabsTrigger>
                <TabsTrigger value="email">Email</TabsTrigger>
              </TabsList>

              <TabsContent value="phone" className="mt-0">
                <PhoneAuth 
                  onSuccess={handleAuthSuccess}
                  onError={handleAuthError}
                />
              </TabsContent>

              <TabsContent value="email" className="mt-0">
                <EmailAuth 
                  onSuccess={handleAuthSuccess}
                  onError={handleAuthError}
                />
              </TabsContent>
            </Tabs>
          </div>

          {/* Features */}
          <div className="mt-12 text-center">
            <h3 className="text-lg font-semibold mb-6">Why Choose LoveX?</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-2xl mx-auto">
              <div className="text-center">
                <div className="w-12 h-12 bg-love-red/10 rounded-full flex items-center justify-center mx-auto mb-3">
                  <span className="text-2xl">📱</span>
                </div>
                <h4 className="font-medium mb-1">Phone Verified</h4>
                <p className="text-sm text-muted-foreground">Real profiles with phone verification</p>
              </div>
              
              <div className="text-center">
                <div className="w-12 h-12 bg-love-purple/10 rounded-full flex items-center justify-center mx-auto mb-3">
                  <span className="text-2xl">🌍</span>
                </div>
                <h4 className="font-medium mb-1">East African Focus</h4>
                <p className="text-sm text-muted-foreground">Connect with local singles</p>
              </div>
              
              <div className="text-center">
                <div className="w-12 h-12 bg-love-gold/10 rounded-full flex items-center justify-center mx-auto mb-3">
                  <span className="text-2xl">🔒</span>
                </div>
                <h4 className="font-medium mb-1">Safe & Secure</h4>
                <p className="text-sm text-muted-foreground">Your privacy is our priority</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Auth;

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
            <Tabs defaultValue="login" className="w-full max-w-md">
              <TabsList className="grid w-full grid-cols-3 mb-6">
                <TabsTrigger value="login">Login</TabsTrigger>
                <TabsTrigger value="signup">Sign Up</TabsTrigger>
                <TabsTrigger value="phone">Phone</TabsTrigger>
              </TabsList>

              <TabsContent value="login" className="mt-0">
                <div className="space-y-4">
                  <div className="text-center mb-6">
                    <h3 className="text-lg font-semibold">Welcome Back!</h3>
                    <p className="text-sm text-muted-foreground">Sign in to continue your journey</p>
                  </div>
                  
                  <div className="space-y-3">
                    <Button 
                      onClick={() => navigate('/auth/login')}
                      className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
                    >
                      Email Login
                    </Button>
                    
                    <div className="relative">
                      <div className="absolute inset-0 flex items-center">
                        <span className="w-full border-t" />
                      </div>
                      <div className="relative flex justify-center text-xs uppercase">
                        <span className="bg-background px-2 text-muted-foreground">Or</span>
                      </div>
                    </div>
                    
                    <Button 
                      variant="outline"
                      onClick={() => navigate('/auth/register')}
                      className="w-full"
                    >
                      Create New Account
                    </Button>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="signup" className="mt-0">
                <div className="space-y-4">
                  <div className="text-center mb-6">
                    <h3 className="text-lg font-semibold">Join LoveX</h3>
                    <p className="text-sm text-muted-foreground">Start your journey to find love</p>
                  </div>
                  
                  <div className="space-y-3">
                    <Button 
                      onClick={() => navigate('/auth/register')}
                      className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
                    >
                      🎉 Modern Sign Up
                      <span className="text-xs ml-2">6-step guided process</span>
                    </Button>
                    
                    <div className="relative">
                      <div className="absolute inset-0 flex items-center">
                        <span className="w-full border-t" />
                      </div>
                      <div className="relative flex justify-center text-xs uppercase">
                        <span className="bg-background px-2 text-muted-foreground">Or</span>
                      </div>
                    </div>
                    
                    <Button 
                      variant="outline"
                      onClick={() => window.location.href = '/auth/login'}
                      className="w-full"
                    >
                      Already have an account? Sign In
                    </Button>
                  </div>
                  
                  <div className="bg-purple-50 border border-purple-200 rounded-lg p-4 mt-4">
                    <div className="flex items-start gap-3">
                      <span className="text-2xl">✨</span>
                      <div>
                        <h4 className="font-semibold text-purple-900 mb-1">Modern Sign Up Features</h4>
                        <ul className="text-sm text-purple-800 space-y-1">
                          <li>• Progressive 6-step onboarding</li>
                          <li>• Photo upload with preview</li>
                          <li>• Interest matching system</li>
                          <li>• East African focused options</li>
                          <li>• Progress saved automatically</li>
                        </ul>
                      </div>
                    </div>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="phone" className="mt-0">
                <PhoneAuth 
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

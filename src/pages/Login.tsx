import React, { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Heart, ArrowLeft, Eye, EyeOff, Mail, Lock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { signInWithEmail } from '@/lib/auth';
import { useAuth } from '@/hooks/use-auth';

const Login = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const redirectTo = searchParams.get('redirect') || '/dashboard';
  const { isAuthenticated } = useAuth();
  const { toast } = useToast();
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [emailError, setEmailError] = useState('');
  const [passwordError, setPasswordError] = useState('');

  // Redirect if already authenticated
  React.useEffect(() => {
    if (isAuthenticated) {
      navigate(redirectTo, { replace: true });
    }
  }, [isAuthenticated, navigate, redirectTo]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Reset errors
    setEmailError('');
    setPasswordError('');
    
    // Validate email
    if (!email) {
      setEmailError('Email is required');
      return;
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setEmailError('Please enter a valid email address');
      return;
    }
    
    // Validate password
    if (!password) {
      setPasswordError('Password is required');
      return;
    } else if (password.length < 1) {
      setPasswordError('Password cannot be empty');
      return;
    }

    setIsLoading(true);
    
    try {
      const result = await signInWithEmail(email, password);
      
      if (result.success) {
        toast({
          title: "Welcome back! 🎉",
          description: "You've been successfully signed in.",
        });
        navigate(redirectTo, { replace: true });
      }
    } catch (error: any) {
      console.error('Login error:', error);
      let errorMessage = "Invalid credentials. Please try again.";
      
      // Handle specific Supabase errors
      if (error.message?.includes('Invalid login credentials')) {
        errorMessage = "Invalid email or password. Please check your credentials and try again.";
      } else if (error.message?.includes('Email not confirmed')) {
        errorMessage = "Please confirm your email address before signing in.";
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      toast({
        title: "Sign in failed",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
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
            onClick={() => navigate('/auth')}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Auth
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
        <div className="max-w-md mx-auto">
          <Card className="shadow-xl">
            <CardHeader className="text-center pb-6">
              <CardTitle className="text-2xl font-bold text-gray-900">
                Welcome Back! 💕
              </CardTitle>
              <p className="text-gray-600">
                Sign in to continue your journey
              </p>
            </CardHeader>
            
            <CardContent className="space-y-6">
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email Address</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <Input
                      id="email"
                      type="email"
                      placeholder="your.email@example.com"
                      value={email}
                      onChange={(e) => {
                        setEmail(e.target.value);
                        setEmailError(''); // Clear error on input
                      }}
                      className={`pl-10 ${emailError ? 'border-red-500' : ''}`}
                      required
                    />
                  </div>
                  {emailError && <p className="text-red-500 text-sm">{emailError}</p>}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password">Password</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <Input
                      id="password"
                      type={showPassword ? 'text' : 'password'}
                      placeholder="Enter your password"
                      value={password}
                      onChange={(e) => {
                        setPassword(e.target.value);
                        setPasswordError(''); // Clear error on input
                      }}
                      className={`pl-10 pr-10 ${passwordError ? 'border-red-500' : ''}`}
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  {passwordError && <p className="text-red-500 text-sm">{passwordError}</p>}
                </div>

                <Button
                  type="submit"
                  disabled={isLoading}
                  className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
                >
                  {isLoading ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                      Signing in...
                    </>
                  ) : (
                    'Sign In'
                  )}
                </Button>
              </form>

              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-background px-2 text-muted-foreground">Or</span>
                </div>
              </div>

              <div className="space-y-3">
                <Button 
                  variant="outline"
                  onClick={() => navigate('/auth/register')}
                  className="w-full"
                >
                  Create New Account
                </Button>
                
                <Button 
                  variant="ghost"
                  onClick={() => navigate('/auth')}
                  className="w-full"
                >
                  Back to All Options
                </Button>
              </div>

              <div className="text-center">
                <p className="text-sm text-gray-600">
                  Don't have an account?{' '}
                  <button
                    onClick={() => navigate('/auth/register')}
                    className="text-purple-600 hover:text-purple-700 font-medium underline"
                  >
                    Sign up here
                  </button>
                </p>
                <p className="text-sm text-gray-600 mt-2">
                  <button
                    onClick={() => {
                      // TODO: Implement forgot password functionality
                      toast({
                        title: "Password Reset",
                        description: "Password reset feature coming soon!",
                      });
                    }}
                    className="text-purple-600 hover:text-purple-700 font-medium underline"
                  >
                    Forgot your password?
                  </button>
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Login;

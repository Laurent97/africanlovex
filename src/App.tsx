import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Suspense, lazy } from 'react';
import { Loader2 } from 'lucide-react';

// Layout Components
import { AuthLayout } from './components/layout/AuthLayout';
import { PublicLayout } from './components/layout/PublicLayout';
import { ProtectedRoute } from './components/auth/ProtectedRoute';

// Lazy load pages for better performance
const Index = lazy(() => import('./pages/Index'));
const ShareableLanding = lazy(() => import('./pages/ShareableLanding'));
const Matching = lazy(() => import('./pages/Matching'));
const About = lazy(() => import('./pages/About'));
const Auth = lazy(() => import('./pages/Auth'));
const Profile = lazy(() => import('./pages/Profile'));
const Chat = lazy(() => import('./pages/Chat'));
const Notifications = lazy(() => import('./pages/Notifications'));
const Settings = lazy(() => import('./pages/Settings'));
const Gifts = lazy(() => import('./pages/Gifts'));
const GiftInventory = lazy(() => import('./components/gifts/GiftInventory'));
const VIP = lazy(() => import('./pages/VIP'));
const Search = lazy(() => import('./pages/Search'));
const Dashboard = lazy(() => import('./pages/Dashboard'));
const ViewProfile = lazy(() => import('./pages/ViewProfile'));
const Live = lazy(() => import('./pages/Live'));
const Wallet = lazy(() => import('./pages/Wallet'));
const PaymentCallback = lazy(() => import('./pages/PaymentCallback'));
const SuccessStories = lazy(() => import('./pages/SuccessStories'));
const Verification = lazy(() => import('./pages/verification'));
const VerificationCapture = lazy(() => import('./pages/verification/capture'));
const VerificationProcessing = lazy(() => import('./pages/verification/processing'));
const VerificationResult = lazy(() => import('./pages/verification/result'));
const AuthTest = lazy(() => import('@/components/auth/AuthTest'));
const NotFound = lazy(() => import('./pages/NotFound'));

// Loading component for lazy loading
const LoadingSpinner = () => (
  <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-purple-50 to-pink-50">
    <div className="text-center">
      <Loader2 className="w-8 h-8 animate-spin text-purple-600 mx-auto mb-4" />
      <p className="text-gray-600">Loading...</p>
    </div>
  </div>
);

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          {/* Public Routes */}
          <Route element={<PublicLayout />}>
            <Route 
              path="/" 
              element={
                <Suspense fallback={<LoadingSpinner />}>
                  <Index />
                </Suspense>
              } 
            />
            <Route 
              path="/share" 
              element={
                <Suspense fallback={<LoadingSpinner />}>
                  <ShareableLanding />
                </Suspense>
              } 
            />
            <Route 
              path="/about" 
              element={
                <Suspense fallback={<LoadingSpinner />}>
                  <About />
                </Suspense>
              } 
            />
            <Route 
              path="/success-stories" 
              element={
                <Suspense fallback={<LoadingSpinner />}>
                  <SuccessStories />
                </Suspense>
              } 
            />
            <Route 
              path="/auth" 
              element={
                <Suspense fallback={<LoadingSpinner />}>
                  <Auth />
                </Suspense>
              } 
            />
            <Route 
              path="/privacy" 
              element={
                <Suspense fallback={<LoadingSpinner />}>
                  <div>Privacy Policy</div>
                </Suspense>
              } 
            />
            <Route 
              path="/terms" 
              element={
                <Suspense fallback={<LoadingSpinner />}>
                  <div>Terms of Service</div>
                </Suspense>
              } 
            />
          </Route>

          {/* Protected Routes */}
          <Route element={<AuthLayout />}>
            <Route 
              path="/matching" 
              element={
                <ProtectedRoute>
                  <Suspense fallback={<LoadingSpinner />}>
                    <Matching />
                  </Suspense>
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/discover" 
              element={
                <ProtectedRoute>
                  <Suspense fallback={<LoadingSpinner />}>
                    <Search />
                  </Suspense>
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/profile" 
              element={
                <ProtectedRoute>
                  <Suspense fallback={<LoadingSpinner />}>
                    <Profile />
                  </Suspense>
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/profile/:id" 
              element={
                <ProtectedRoute>
                  <Suspense fallback={<LoadingSpinner />}>
                    <ViewProfile />
                  </Suspense>
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/chat" 
              element={
                <ProtectedRoute>
                  <Suspense fallback={<LoadingSpinner />}>
                    <Chat />
                  </Suspense>
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/notifications" 
              element={
                <ProtectedRoute>
                  <Suspense fallback={<LoadingSpinner />}>
                    <Notifications />
                  </Suspense>
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/settings" 
              element={
                <ProtectedRoute>
                  <Suspense fallback={<LoadingSpinner />}>
                    <Settings />
                  </Suspense>
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/gifts" 
              element={
                <ProtectedRoute>
                  <Suspense fallback={<LoadingSpinner />}>
                    <Gifts />
                  </Suspense>
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/gift-inventory" 
              element={
                <ProtectedRoute>
                  <Suspense fallback={<LoadingSpinner />}>
                    <GiftInventory />
                  </Suspense>
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/vip" 
              element={
                <ProtectedRoute>
                  <Suspense fallback={<LoadingSpinner />}>
                    <VIP />
                  </Suspense>
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/wallet" 
              element={
                <ProtectedRoute>
                  <Suspense fallback={<LoadingSpinner />}>
                    <Wallet />
                  </Suspense>
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/live" 
              element={
                <ProtectedRoute>
                  <Suspense fallback={<LoadingSpinner />}>
                    <Live />
                  </Suspense>
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/dashboard" 
              element={
                <ProtectedRoute>
                  <Suspense fallback={<LoadingSpinner />}>
                    <Dashboard />
                  </Suspense>
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/verification" 
              element={
                <ProtectedRoute>
                  <Suspense fallback={<LoadingSpinner />}>
                    <Verification />
                  </Suspense>
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/verification/capture/:id" 
              element={
                <ProtectedRoute>
                  <Suspense fallback={<LoadingSpinner />}>
                    <VerificationCapture />
                  </Suspense>
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/verification/processing/:id" 
              element={
                <ProtectedRoute>
                  <Suspense fallback={<LoadingSpinner />}>
                    <VerificationProcessing />
                  </Suspense>
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/verification/result/:id" 
              element={
                <ProtectedRoute>
                  <Suspense fallback={<LoadingSpinner />}>
                    <VerificationResult />
                  </Suspense>
                </ProtectedRoute>
              } 
            />
          </Route>

          {/* Premium-only Routes */}
          <Route element={<AuthLayout />}>
            <Route 
              path="/live/private/:id" 
              element={
                <ProtectedRoute requiredRole="premium">
                  <Suspense fallback={<LoadingSpinner />}>
                    <Live />
                  </Suspense>
                </ProtectedRoute>
              } 
            />
          </Route>

          {/* Admin Routes */}
          <Route element={<AuthLayout />}>
            <Route 
              path="/admin" 
              element={
                <ProtectedRoute requiredRole="admin">
                  <Suspense fallback={<LoadingSpinner />}>
                    <div>Admin Dashboard</div>
                  </Suspense>
                </ProtectedRoute>
              } 
            />
          </Route>

          {/* Payment Callback (Public but needs special handling) */}
          <Route 
            path="/payment/callback" 
            element={
              <Suspense fallback={<LoadingSpinner />}>
                <PaymentCallback />
              </Suspense>
            } 
          />

          {/* Test Route */}
          <Route 
            path="/test-auth" 
            element={
              <Suspense fallback={<LoadingSpinner />}>
                <AuthTest />
              </Suspense>
            } 
          />

          {/* 404 */}
          <Route 
            path="*" 
            element={
              <Suspense fallback={<LoadingSpinner />}>
                <NotFound />
              </Suspense>
            } 
          />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;

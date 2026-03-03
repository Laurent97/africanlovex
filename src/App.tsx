import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import Matching from "./pages/Matching";
import About from "./pages/About";
import Auth from "./pages/Auth";
import Profile from "./pages/Profile";
import Chat from "./pages/Chat";
import Notifications from "./pages/Notifications";
import Settings from "./pages/Settings";
import Gifts from "./pages/Gifts";
import GiftInventory from "./components/gifts/GiftInventory";
import VIP from "./pages/VIP";
import Search from "./pages/Search";
import Dashboard from "./pages/Dashboard";
import ViewProfile from "./pages/ViewProfile";
import Live from "./pages/Live";
import Wallet from "./pages/Wallet";
import PaymentCallback from "./pages/PaymentCallback";
import SuccessStories from "./pages/SuccessStories";
import Verification from "./pages/verification";
import VerificationCapture from "./pages/verification/capture";
import VerificationProcessing from "./pages/verification/processing";
import VerificationResult from "./pages/verification/result";
import Navbar from "./components/ui/Navbar";
import { AuthTest } from "@/components/auth/AuthTest";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Navbar />
        <div className="min-h-screen" style={{ backgroundColor: '#F9F7F4' }}>
          <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/matching" element={<Matching />} />
          <Route path="/about" element={<About />} />
          <Route path="/auth" element={<Auth />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/chat" element={<Chat />} />
          <Route path="/chat/:id" element={<Chat />} />
          <Route path="/notifications" element={<Notifications />} />
          <Route path="/settings" element={<Settings />} />
          <Route path="/gifts" element={<Gifts />} />
          <Route path="/gift-inventory" element={<GiftInventory />} />
          <Route path="/vip" element={<VIP />} />
          <Route path="/search" element={<Search />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/profile/:id" element={<ViewProfile />} />
          <Route path="/live" element={<Live />} />
          <Route path="/wallet" element={<Wallet />} />
          <Route path="/payment/callback" element={<PaymentCallback />} />
          <Route path="/success-stories" element={<SuccessStories />} />
          <Route path="/verification" element={<Verification />} />
          <Route path="/verification/capture/:id" element={<VerificationCapture />} />
          <Route path="/verification/processing/:id" element={<VerificationProcessing />} />
          <Route path="/verification/result/:id" element={<VerificationResult />} />
          <Route path="/test-auth" element={<AuthTest />} />
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
          </Routes>
        </div>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;

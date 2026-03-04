import { Outlet, Navigate } from 'react-router-dom';
import { useAuth } from '@/hooks/use-auth';
import { Loader2 } from 'lucide-react';
import { Sidebar } from './Sidebar';
import { Navbar } from './Navbar';

export const AuthLayout: React.FC = () => {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-purple-50 to-pink-50">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-purple-600 mx-auto mb-4" />
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/auth/login" replace />;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Desktop Sidebar */}
      <div className="hidden lg:block">
        <Sidebar />
      </div>

      {/* Tablet/Desktop/Mobile Navbar */}
      <div className="block lg:hidden">
        <Navbar />
      </div>

      {/* Main Content */}
      <main className={`
        lg:ml-64 /* Sidebar width */
        pt-16 /* Navbar height for all screen sizes */
        pb-6 /* Standard bottom padding */
        min-h-screen
      `}>
        <div className="container mx-auto px-4 py-6">
          <Outlet />
        </div>
      </main>
    </div>
  );
};

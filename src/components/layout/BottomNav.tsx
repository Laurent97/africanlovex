import { useLocation, useNavigate } from 'react-router-dom';
import { 
  Home, 
  Compass, 
  Video, 
  MessageCircle, 
  User,
  Settings,
  LogOut
} from 'lucide-react';

export const BottomNav = () => {
  const location = useLocation();
  const navigate = useNavigate();

  const handleSettingsPress = () => {
    navigate('/settings');
  };

  const handleSettingsLongPress = () => {
    // Quick logout functionality
    if (confirm('Do you want to sign out?')) {
      // Use the same logout logic as Settings page
      import('@supabase/supabase-js').then(({ createClient }) => {
        const supabase = createClient(
          import.meta.env.VITE_SUPABASE_URL,
          import.meta.env.VITE_SUPABASE_ANON_KEY
        );
        supabase.auth.signOut();
        navigate('/auth/login');
      });
    }
  };

  let pressTimer: NodeJS.Timeout;

  const handleMouseDown = (e: React.MouseEvent) => {
    pressTimer = setTimeout(() => {
      handleSettingsLongPress();
    }, 800); // 800ms for long press
  };

  const handleMouseUp = () => {
    clearTimeout(pressTimer);
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    pressTimer = setTimeout(() => {
      handleSettingsLongPress();
    }, 800);
  };

  const handleTouchEnd = () => {
    clearTimeout(pressTimer);
  };

  const navItems = [
    { path: '/dashboard', icon: Home, label: 'Home' },
    { path: '/search', icon: Compass, label: 'Discover' },
    { path: '/live', icon: Video, label: 'Live' },
    { path: '/chat', icon: MessageCircle, label: 'Chat' },
    { path: '/settings', icon: Settings, label: 'Settings' },
  ];

  // Hide on auth pages
  if (location.pathname.startsWith('/auth')) {
    return null;
  }

  return (
    <>
      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 
                    pb-safe md:hidden z-50">
        <div className="flex justify-around items-center h-16">
          {navItems.map(({ path, icon: Icon, label }) => {
            const isActive = location.pathname === path;
            const isSettings = path === '/settings';
            
            return (
              <button
                key={path}
                onClick={isSettings ? handleSettingsPress : () => navigate(path)}
                onMouseDown={isSettings ? handleMouseDown : undefined}
                onMouseUp={isSettings ? handleMouseUp : undefined}
                onMouseLeave={isSettings ? handleMouseUp : undefined}
                onTouchStart={isSettings ? handleTouchStart : undefined}
                onTouchEnd={isSettings ? handleTouchEnd : undefined}
                className="flex flex-col items-center justify-center flex-1 h-full transition-colors relative"
                title={isSettings ? "Tap for Settings, Long Press to Sign Out" : label}
              >
                <Icon 
                  className={`w-5 h-5 ${
                    isActive ? 'text-purple-600' : 'text-gray-500'
                  }`} 
                />
                <span 
                  className={`text-xs mt-1 ${
                    isActive ? 'text-purple-600 font-medium' : 'text-gray-500'
                  }`}
                >
                  {label}
                </span>
                {isSettings && (
                  <div className="w-1 h-1 bg-red-500 rounded-full mt-1" title="Long press to sign out" />
                )}
              </button>
            );
          })}
        </div>
        {/* Help text for logout functionality */}
        <div className="text-center text-xs text-gray-500 pb-1">
          Long press Settings to sign out
        </div>
      </nav>
    </>
  );
};

import { useLocation, useNavigate } from 'react-router-dom';
import { 
  Home, 
  Compass, 
  Video, 
  MessageCircle, 
  User 
} from 'lucide-react';

export const BottomNav = () => {
  const location = useLocation();
  const navigate = useNavigate();

  const navItems = [
    { path: '/', icon: Home, label: 'Home' },
    { path: '/discover', icon: Compass, label: 'Discover' },
    { path: '/live', icon: Video, label: 'Live' },
    { path: '/chat', icon: MessageCircle, label: 'Chat' },
    { path: '/profile', icon: User, label: 'Profile' },
  ];

  // Hide on auth pages
  if (location.pathname.startsWith('/auth')) {
    return null;
  }

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 
                  pb-safe md:hidden z-50">
      <div className="flex justify-around items-center h-16">
        {navItems.map(({ path, icon: Icon, label }) => {
          const isActive = location.pathname === path;
          return (
            <button
              key={path}
              onClick={() => navigate(path)}
              className="flex flex-col items-center justify-center flex-1 h-full transition-colors"
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
            </button>
          );
        })}
      </div>
    </nav>
  );
};

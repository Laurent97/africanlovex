import { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/use-auth';
import { 
  Home,
  Compass,
  Video,
  MessageCircle,
  Gift,
  Crown,
  Wallet,
  Settings,
  LogOut,
  ChevronLeft,
  ChevronRight,
  User,
  Heart
} from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

export const Sidebar = () => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const { user, userProfile, signOut } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const navigation = [
    { path: '/dashboard', icon: Home, label: 'Home' },
    { path: '/discover', icon: Compass, label: 'Discover' },
    { path: '/live', icon: Video, label: 'Live' },
    { path: '/chat', icon: MessageCircle, label: 'Messages' },
    { path: '/gifts', icon: Gift, label: 'Gifts' },
    { path: '/vip', icon: Crown, label: 'VIP' },
    { path: '/wallet', icon: Wallet, label: 'Wallet' },
    { path: '/settings', icon: Settings, label: 'Settings' },
  ];

  const handleSignOut = async () => {
    await signOut();
    navigate('/auth/login');
  };

  return (
    <div className={`
      fixed left-0 top-0 h-full bg-white border-r border-gray-200 z-40 transition-all duration-300
      ${isCollapsed ? 'w-16' : 'w-64'}
    `}>
      {/* Header */}
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          {!isCollapsed && (
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-gradient-to-r from-purple-600 to-pink-600 rounded-lg flex items-center justify-center">
                <Heart className="w-5 h-5 text-white" />
              </div>
              <span className="font-bold text-lg">LoveX</span>
            </div>
          )}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="ml-auto"
          >
            {isCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
          </Button>
        </div>
      </div>

      {/* User Profile */}
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center gap-3">
          <Avatar className="w-10 h-10">
            <AvatarImage src={userProfile?.avatar_url} />
            <AvatarFallback>
              {userProfile?.full_name?.[0] || user?.email?.[0] || 'U'}
            </AvatarFallback>
          </Avatar>
          {!isCollapsed && (
            <div className="flex-1 min-w-0">
              <p className="font-medium truncate">
                {userProfile?.full_name || 'User'}
              </p>
              {userProfile?.vip_tier && userProfile.vip_tier !== 'free' && (
                <Badge variant="secondary" className="text-xs">
                  {userProfile.vip_tier}
                </Badge>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4">
        <ul className="space-y-2">
          {navigation.map(({ path, icon: Icon, label }) => {
            const isActive = location.pathname === path;
            return (
              <li key={path}>
                <Button
                  variant={isActive ? 'default' : 'ghost'}
                  className={`
                    w-full justify-start gap-3
                    ${isCollapsed ? 'px-2' : 'px-3'}
                    ${isActive ? 'bg-purple-100 text-purple-700' : 'text-gray-700 hover:bg-gray-100'}
                  `}
                  onClick={() => navigate(path)}
                >
                  <Icon className="w-5 h-5" />
                  {!isCollapsed && <span>{label}</span>}
                </Button>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* Logout */}
      <div className="p-4 border-t border-gray-200">
        <Button
          variant="ghost"
          className={`
            w-full justify-start gap-3 text-red-600 hover:text-red-700 hover:bg-red-50
            ${isCollapsed ? 'px-2' : 'px-3'}
          `}
          onClick={handleSignOut}
        >
          <LogOut className="w-5 h-5" />
          {!isCollapsed && <span>Logout</span>}
        </Button>
      </div>
    </div>
  );
};

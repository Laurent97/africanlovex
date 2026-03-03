import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  Heart, 
  Search, 
  Users, 
  MessageCircle, 
  User,
  Home,
  Zap
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface BottomNavigationProps {
  className?: string;
}

const BottomNavigation: React.FC<BottomNavigationProps> = ({ className }) => {
  const location = useLocation();
  
  const navigationItems = [
    {
      name: 'Home',
      path: '/dashboard',
      icon: Home,
      label: 'Home'
    },
    {
      name: 'Discover',
      path: '/search',
      icon: Search,
      label: 'Discover'
    },
    {
      name: 'Matching',
      path: '/matching',
      icon: Heart,
      label: 'Matching'
    },
    {
      name: 'Messages',
      path: '/chat',
      icon: MessageCircle,
      label: 'Messages'
    },
    {
      name: 'Profile',
      path: '/profile',
      icon: User,
      label: 'Profile'
    }
  ];

  return (
    <div className={cn("fixed bottom-0 left-0 right-0 z-50 md:hidden", className)}>
      {/* Mobile Bottom Navigation */}
      <motion.div
        initial={{ y: 100 }}
        animate={{ y: 0 }}
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
        className="bg-white border-t shadow-lg"
        style={{ 
          backgroundColor: '#FFFFFF',
          borderColor: '#E5E0D8'
        }}
      >
        <div className="grid grid-cols-5 gap-1 px-2 py-2">
          {navigationItems.map((item) => {
            const isActive = location.pathname === item.path;
            const Icon = item.icon;
            
            return (
              <Link
                key={item.path}
                to={item.path}
                className={cn(
                  "flex flex-col items-center justify-center py-2 px-3 rounded-lg transition-all duration-200",
                  isActive
                    ? "text-white"
                    : "text-gray-600 hover:text-gray-900"
                )}
                style={{
                  ...(isActive && {
                    background: 'linear-gradient(90deg, #B11D2D, #5E2A6B)'
                  })
                }}
              >
                <Icon 
                  className={cn(
                    "w-5 h-5 mb-1",
                    isActive ? "text-white" : "text-current"
                  )} 
                />
                <span className={cn(
                  "text-xs font-medium",
                  isActive ? "text-white" : "text-current"
                )}>
                  {item.label}
                </span>
              </Link>
            );
          })}
        </div>
      </motion.div>
    </div>
  );
};

export default BottomNavigation;

import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Menu, 
  X, 
  Home, 
  Search, 
  Heart, 
  MessageCircle, 
  User, 
  Settings, 
  Crown,
  Wallet,
  Radio,
  ChevronDown,
  LogOut
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useAuth } from '@/hooks/use-auth';

const Navbar = () => {
  const { user, signOut } = useAuth();
  const location = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const handleLogout = async () => {
    try {
      await signOut();
      // Navigation will be handled by the auth state change
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  const navigationItems = [
    { name: 'Home', href: '/dashboard', icon: Home },
    { name: 'Discover', href: '/search', icon: Search },
    { name: 'Matching', href: '/matching', icon: Heart },
    { name: 'Chat', href: '/chat', icon: MessageCircle },
    { name: 'Profile', href: '/profile', icon: User },
    { name: 'Live', href: '/live', icon: Radio },
    { name: 'Gifts', href: '/gifts', icon: Crown },
    { name: 'Wallet', href: '/wallet', icon: Wallet },
    { name: 'Settings', href: '/settings', icon: Settings },
  ];

  const isActive = (path: string) => {
    return location.pathname === path || location.pathname.startsWith(path + '/');
  };

  return (
    <nav className="sticky top-0 z-50 border-b" style={{ 
      backgroundColor: '#FFFFFF',
      borderColor: '#E5E0D8'
    }}>
      {/* Cultural Background Pattern */}
      <div className="absolute inset-0 opacity-5 pointer-events-none">
        <div className="w-full h-full" style={{
          backgroundImage: `repeating-linear-gradient(45deg, #B11D2D 0px, #B11D2D 1px, transparent 1px, transparent 16px)`,
        }} />
      </div>

      <div className="relative z-10">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <Link 
              to="/" 
              className="flex items-center gap-2 text-xl font-bold transition-colors hover:opacity-80"
              style={{ 
                fontFamily: "'Playfair Display', serif",
                color: '#B11D2D'
              }}
            >
              <div className="w-8 h-8 rounded-full bg-gradient-to-r from-red-500 to-pink-500 flex items-center justify-center">
                <Heart className="w-4 h-4 text-white fill-current" />
              </div>
              LoveX
            </Link>

            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center gap-6">
              {navigationItems.map((item) => (
                <Link
                  key={item.name}
                  to={item.href}
                  className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-all duration-200 ${
                    isActive(item.href)
                      ? 'text-white shadow-lg'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                  }`}
                  style={{
                    ...(isActive(item.href) && {
                      background: 'linear-gradient(90deg, #B11D2D, #5E2A6B)',
                      borderRadius: '8px'
                    })
                  }}
                >
                  <item.icon className="w-4 h-4" />
                  <span className="font-medium">{item.name}</span>
                  {item.name === 'Chat' && user?.unreadCount > 0 && (
                    <Badge className="ml-1 px-2 py-0.5 text-xs" style={{ 
                      backgroundColor: '#B11D2D',
                      color: 'white'
                    }}>
                      {user.unreadCount}
                    </Badge>
                  )}
                </Link>
              ))}
            </div>

            {/* User Menu */}
            <div className="flex items-center gap-4">
              {/* Notifications */}
              <Link
                to="/notifications"
                className="relative p-2 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <div className="w-5 h-5" style={{ color: '#7E786E' }}>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M18 8A6 6 0 0 0 6 0c0 7-3 9-10 9-10h.01z"/>
                    <path d="M22 17a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2v-2a2 2 0 0 1 2-2h5l-1.586-1.586a2 2 0 0 1 0-2.828 0L12 5.586V4a2 2 0 0 1 2-2z"/>
                  </svg>
                </div>
                {user?.notifications > 0 && (
                  <Badge className="absolute -top-1 -right-1 w-5 h-5 rounded-full flex items-center justify-center text-xs" style={{ 
                    backgroundColor: '#B11D2D',
                    color: 'white'
                  }}>
                    {user.notifications}
                  </Badge>
                )}
              </Link>

              {/* User Avatar */}
              <div className="relative">
                <button
                  onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                  className="flex items-center gap-2 p-2 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <Avatar className="w-8 h-8">
                    <AvatarImage src={user?.avatar} alt={user?.name} />
                    <AvatarFallback style={{ backgroundColor: '#CFAF4E', color: '#26231F' }}>
                      {user?.name?.charAt(0) || 'U'}
                    </AvatarFallback>
                  </Avatar>
                  <ChevronDown className="w-4 h-4" style={{ color: '#7E786E' }} />
                </button>

                {/* Dropdown Menu */}
                <AnimatePresence>
                  {isMobileMenuOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className="absolute right-0 top-full mt-2 w-48 bg-white rounded-lg shadow-xl border"
                      style={{ 
                        backgroundColor: '#FFFFFF',
                        borderColor: '#E5E0D8',
                        borderRadius: '16px 16px 8px 16px'
                      }}
                    >
                      <div className="p-2">
                        <Link
                          to="/profile"
                          className="flex items-center gap-3 w-full p-3 rounded-lg hover:bg-gray-50 transition-colors"
                          onClick={() => setIsMobileMenuOpen(false)}
                        >
                          <User className="w-4 h-4" style={{ color: '#7E786E' }} />
                          <div>
                            <div className="font-medium text-sm" style={{ color: '#26231F' }}>
                              {user?.name || 'Guest User'}
                            </div>
                            <div className="text-xs" style={{ color: '#7E786E' }}>
                              {user?.email || 'Sign in'}
                            </div>
                          </div>
                        </Link>
                        
                        <div className="border-t my-2" style={{ borderColor: '#E5E0D8' }} />
                        
                        <Link
                          to="/settings"
                          className="flex items-center gap-3 w-full p-3 rounded-lg hover:bg-gray-50 transition-colors"
                          onClick={() => setIsMobileMenuOpen(false)}
                        >
                          <Settings className="w-4 h-4" style={{ color: '#7E786E' }} />
                          <span className="font-medium text-sm" style={{ color: '#26231F' }}>Settings</span>
                        </Link>
                        
                        <Link
                          to="/vip"
                          className="flex items-center gap-3 w-full p-3 rounded-lg hover:bg-gray-50 transition-colors"
                          onClick={() => setIsMobileMenuOpen(false)}
                        >
                          <Crown className="w-4 h-4" style={{ color: '#CFAF4E' }} />
                          <span className="font-medium text-sm" style={{ color: '#26231F' }}>Upgrade to VIP</span>
                        </Link>
                        
                        <div className="border-t my-2" style={{ borderColor: '#E5E0D8' }} />
                        
                        <Button
                          variant="outline"
                          className="w-full justify-start"
                          onClick={() => {
                            handleLogout();
                            setIsMobileMenuOpen(false);
                          }}
                        >
                          <LogOut className="w-4 h-4 mr-3" />
                          <span>Sign Out</span>
                        </Button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>

            {/* Mobile Menu Button */}
            <button
              className="md:hidden p-2 rounded-lg hover:bg-gray-50 transition-colors"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            >
              {isMobileMenuOpen ? (
                <X className="w-6 h-6" style={{ color: '#7E786E' }} />
              ) : (
                <Menu className="w-6 h-6" style={{ color: '#7E786E' }} />
              )}
            </button>
          </div>
        </div>

        {/* Mobile Navigation Menu */}
        <AnimatePresence>
          {isMobileMenuOpen && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="md:hidden border-t"
              style={{ 
                backgroundColor: '#FFFFFF',
                borderColor: '#E5E0D8'
              }}
            >
              <div className="container mx-auto px-4 py-4">
                <div className="grid grid-cols-2 gap-3">
                  {navigationItems.map((item) => (
                    <Link
                      key={item.name}
                      to={item.href}
                      className={`flex flex-col items-center gap-2 p-3 rounded-lg transition-all duration-200 ${
                        isActive(item.href)
                          ? 'text-white shadow-lg'
                          : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                      }`}
                      style={{
                        ...(isActive(item.href) && {
                          background: 'linear-gradient(90deg, #B11D2D, #5E2A6B)',
                          borderRadius: '12px'
                        })
                      }}
                      onClick={() => setIsMobileMenuOpen(false)}
                    >
                      <item.icon className="w-5 h-5" />
                      <span className="text-sm font-medium">{item.name}</span>
                      {item.name === 'Chat' && user?.unreadCount > 0 && (
                        <Badge className="mt-1 px-2 py-0.5 text-xs" style={{ 
                          backgroundColor: '#B11D2D',
                          color: 'white'
                        }}>
                          {user.unreadCount}
                        </Badge>
                      )}
                    </Link>
                  ))}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </nav>
  );
};

export default Navbar;

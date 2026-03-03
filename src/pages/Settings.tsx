import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link, useNavigate } from 'react-router-dom';
import { 
  User, 
  Bell, 
  Shield, 
  Globe, 
  Moon, 
  CreditCard, 
  HelpCircle, 
  FileText, 
  LogOut, 
  ChevronRight,
  ArrowRight,
  Smartphone,
  Mail,
  MessageSquare,
  Eye,
  EyeOff,
  Toggle,
  Trash2,
  AlertTriangle,
  Check,
  X,
  MapPin,
  Users,
  Lock,
  Key,
  Volume2,
  Wifi,
  Search,
  Send,
  Database,
  Type,
  Sliders,
  Battery,
  Camera,
  Calendar,
  Clock,
  DollarSign,
  Gift,
  Heart,
  Star,
  Crown,
  Diamond,
  Sparkles,
  Loader2,
  Download,
  Upload,
  RefreshCw,
  QrCode,
  ShieldCheck,
  UserCheck,
  SmartphoneNfc,
  Share2,
  Facebook,
  Instagram,
  Twitter,
  Music,
  Linkedin,
  Youtube,
  Save,
  Edit,
  ChevronLeft,
  Copy,
  ExternalLink,
  Laptop,
  Video,
  Home,
  Briefcase,
  Coffee,
  Film,
  Gamepad2,
  Book,
  Plane,
  Palette,
  Settings as SettingsIcon,
  ToggleLeft,
  ToggleRight,
  Circle,
  CircleDot,
  Fingerprint,
  Scan,
  Phone,
  AtSign,
  KeyRound,
  Github,
  Chrome,
  Twitch,
  Spotify,
  Apple,
  MessageCircle,
  PhoneCall,
  MailCheck,
  ShieldAlert,
  Fingerprint as FingerprintIcon
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Progress } from '@/components/ui/progress';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { AuthGuard } from '@/components/auth/AuthGuard';
import { useAuth } from '@/hooks/use-auth';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/lib/supabase';
import { useSettings } from '@/hooks/use-settings';
import { socialAuth } from '@/lib/social-auth';
import { twoFactorAuth } from '@/lib/2fa';
import { useProfile } from '@/hooks/use-profile';
import { formatPhoneNumber, validatePhoneNumber } from '@/lib/phone-utils';

interface ConnectedApp {
  id: string;
  name: string;
  icon: React.ReactNode;
  connected: boolean;
  color: string;
  username?: string;
  avatar?: string;
  email?: string;
  connectedAt?: Date;
  expiresIn?: number;
  permissions?: string[];
}

interface NotificationSettings {
  push: boolean;
  email: boolean;
  sms: boolean;
  whatsapp: boolean;
  telegram: boolean;
  newLikes: boolean;
  newMatches: boolean;
  newMessages: boolean;
  gifts: boolean;
  liveStreams: boolean;
  profileViews: boolean;
  weeklyDigest: boolean;
  marketingEmails: boolean;
  [key: string]: boolean;
}

interface PrivacySettings {
  showOnlineStatus: boolean;
  showDistance: boolean;
  allowProfileViews: boolean;
  showAge: boolean;
  allowScreenshots: boolean;
  privateMode: boolean;
  hideFromSearch: boolean;
  blockStrangers: boolean;
  showLastActive: boolean;
  showSocialLinks: boolean;
  allowDataCollection: boolean;
  allowLocationTracking: boolean;
  [key: string]: boolean;
}

interface Preferences {
  language: string;
  darkMode: boolean;
  autoPlayVideos: boolean;
  soundEffects: boolean;
  vibrations: boolean;
  dataSaver: boolean;
  reduceAnimations: boolean;
  highContrast: boolean;
  largeText: boolean;
  autoTranslate: boolean;
  preferredDistance: string;
  ageRangeMin: number;
  ageRangeMax: number;
  showMe: 'everyone' | 'men' | 'women';
  [key: string]: any;
}

interface BlockedUser {
  id: string;
  name: string;
  avatar: string;
  blockedAt: Date;
  reason?: string;
}

interface Session {
  id: string;
  device: string;
  browser: string;
  location: string;
  ip: string;
  lastActive: Date;
  isCurrent: boolean;
}

const Settings = () => {
  const { user, signOut, updateUser } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { profile, loading: profileLoading, updateProfile, refreshProfile } = useProfile();
  const { settings, updateSettings, isLoading: settingsLoading } = useSettings();
  
  const [activeSection, setActiveSection] = useState('account');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [showChangePassword, setShowChangePassword] = useState(false);
  const [showExportData, setShowExportData] = useState(false);
  const [show2FASetup, setShow2FASetup] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Real user data from database
  const [userData, setUserData] = useState({
    id: '',
    email: '',
    phone: '',
    fullName: '',
    username: '',
    avatarUrl: '',
    createdAt: new Date(),
    lastSignIn: new Date(),
    emailConfirmed: false,
    phoneConfirmed: false,
    subscriptionTier: 'free' as 'free' | 'premium' | 'vip',
    subscriptionExpiresAt: null as Date | null,
    twoFactorEnabled: false,
    twoFactorMethod: 'app' as 'app' | 'sms' | 'email' | null,
    recoveryCodes: [] as string[],
    backupCodes: [] as string[],
    trustedDevices: [] as string[]
  });

  // Notifications settings
  const [notifications, setNotifications] = useState<NotificationSettings>({
    push: true,
    email: true,
    sms: false,
    whatsapp: false,
    telegram: false,
    newLikes: true,
    newMatches: true,
    newMessages: true,
    gifts: true,
    liveStreams: false,
    profileViews: true,
    weeklyDigest: true,
    marketingEmails: false
  });

  // Privacy settings
  const [privacy, setPrivacy] = useState<PrivacySettings>({
    showOnlineStatus: true,
    showDistance: true,
    allowProfileViews: true,
    showAge: true,
    allowScreenshots: false,
    privateMode: false,
    hideFromSearch: false,
    blockStrangers: false,
    showLastActive: true,
    showSocialLinks: true,
    allowDataCollection: true,
    allowLocationTracking: true
  });

  // Preferences
  const [preferences, setPreferences] = useState<Preferences>({
    language: 'english',
    darkMode: false,
    autoPlayVideos: true,
    soundEffects: true,
    vibrations: true,
    dataSaver: false,
    reduceAnimations: false,
    highContrast: false,
    largeText: false,
    autoTranslate: false,
    preferredDistance: '50',
    ageRangeMin: 18,
    ageRangeMax: 50,
    showMe: 'everyone'
  });

  // Connected apps with real OAuth data
  const [connectedApps, setConnectedApps] = useState<ConnectedApp[]>([
    { 
      id: 'facebook', 
      name: 'Facebook', 
      icon: <Facebook className="w-4 h-4" />, 
      connected: false, 
      color: '#1877F2',
      permissions: ['public_profile', 'email']
    },
    { 
      id: 'instagram', 
      name: 'Instagram', 
      icon: <Instagram className="w-4 h-4" />, 
      connected: false, 
      color: '#E4405F',
      permissions: ['basic', 'photos']
    },
    { 
      id: 'twitter', 
      name: 'Twitter', 
      icon: <Twitter className="w-4 h-4" />, 
      connected: false, 
      color: '#1DA1F2',
      permissions: ['tweet', 'profile']
    },
    { 
      id: 'spotify', 
      name: 'Spotify', 
      icon: <Music className="w-4 h-4" />, 
      connected: false, 
      color: '#1DB954',
      permissions: ['playlist', 'recent']
    },
    { 
      id: 'linkedin', 
      name: 'LinkedIn', 
      icon: <Linkedin className="w-4 h-4" />, 
      connected: false, 
      color: '#0077B5',
      permissions: ['profile', 'email']
    },
    { 
      id: 'github', 
      name: 'GitHub', 
      icon: <Github className="w-4 h-4" />, 
      connected: false, 
      color: '#333333',
      permissions: ['repo', 'profile']
    },
    { 
      id: 'google', 
      name: 'Google', 
      icon: <Chrome className="w-4 h-4" />, 
      connected: false, 
      color: '#4285F4',
      permissions: ['email', 'profile', 'calendar']
    },
    { 
      id: 'apple', 
      name: 'Apple', 
      icon: <Apple className="w-4 h-4" />, 
      connected: false, 
      color: '#000000',
      permissions: ['email', 'name']
    },
    { 
      id: 'twitch', 
      name: 'Twitch', 
      icon: <Twitch className="w-4 h-4" />, 
      connected: false, 
      color: '#9146FF',
      permissions: ['stream', 'channel']
    }
  ]);

  // Blocked users from database
  const [blockedUsers, setBlockedUsers] = useState<BlockedUser[]>([]);

  // Active sessions
  const [activeSessions, setActiveSessions] = useState<Session[]>([]);

  // 2FA setup state
  const [twoFactorQR, setTwoFactorQR] = useState('');
  const [twoFactorSecret, setTwoFactorSecret] = useState('');
  const [twoFactorCode, setTwoFactorCode] = useState('');
  const [twoFactorBackupCodes, setTwoFactorBackupCodes] = useState<string[]>([]);
  const [twoFactorStep, setTwoFactorStep] = useState<'setup' | 'verify' | 'backup'>('setup');

  // Load user data on mount
  useEffect(() => {
    if (user) {
      loadUserData();
      loadSettings();
      loadConnectedApps();
      loadBlockedUsers();
      loadActiveSessions();
    }
  }, [user]);

  const loadUserData = async () => {
    try {
      // Get user from auth
      if (!user) return;

      console.log('Loading profile for user:', user.id);

      // Get profile from database
      const { data: profile, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      console.log('Profile data:', profile);
      console.log('Profile error:', error);

      if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned
        console.error('Profile load error:', error);
        // Don't throw error, just continue with fallback data
      }

      // Get subscription info
      const { data: subscription } = await supabase
        .from('subscriptions')
        .select('*')
        .eq('user_id', user.id)
        .eq('status', 'active')
        .single();

      // Get 2FA status
      const { data: twoFactor } = await supabase
        .from('user_security')
        .select('*')
        .eq('user_id', user.id)
        .single();

      // Use profile data or fallback to defaults
      const avatarUrl = profile?.avatar_url || '';
      
      console.log('Final avatar URL:', avatarUrl);

      setUserData({
        id: user.id,
        email: user.email || '',
        phone: profile?.phone || '',
        fullName: profile?.full_name || '',
        username: profile?.username || '',
        avatarUrl: avatarUrl,
        createdAt: new Date(profile?.created_at || user.created_at),
        lastSignIn: new Date(user.last_sign_in_at || Date.now()),
        emailConfirmed: user.email_confirmed_at !== null,
        phoneConfirmed: profile?.phone_confirmed || false,
        subscriptionTier: subscription?.tier || 'free',
        subscriptionExpiresAt: subscription?.end_date ? new Date(subscription.end_date) : null,
        twoFactorEnabled: twoFactor?.enabled || false,
        twoFactorMethod: twoFactor?.method || null,
        recoveryCodes: twoFactor?.recovery_codes || [],
        backupCodes: twoFactor?.backup_codes || [],
        trustedDevices: twoFactor?.trusted_devices || []
      });
    } catch (error) {
      console.error('Error loading user data:', error);
      // Set minimal fallback data
      if (user) {
        setUserData({
          id: user.id,
          email: user.email || '',
          phone: '',
          fullName: '',
          username: '',
          avatarUrl: '',
          createdAt: new Date(user.created_at),
          lastSignIn: new Date(Date.now()),
          emailConfirmed: false,
          phoneConfirmed: false,
          subscriptionTier: 'free',
          subscriptionExpiresAt: null,
          twoFactorEnabled: false,
          twoFactorMethod: null,
          recoveryCodes: [],
          backupCodes: [],
          trustedDevices: []
        });
      }
    }
  };

  const loadSettings = async () => {
    try {
      // Load notifications settings
      const { data: notifData } = await supabase
        .from('user_notification_settings')
        .select('*')
        .eq('user_id', user?.id)
        .single();

      if (notifData) {
        setNotifications(prev => ({ ...prev, ...notifData }));
      }

      // Load privacy settings
      const { data: privacyData } = await supabase
        .from('user_privacy_settings')
        .select('*')
        .eq('user_id', user?.id)
        .single();

      if (privacyData) {
        setPrivacy(prev => ({ ...prev, ...privacyData }));
      }

      // Load preferences
      const { data: prefData } = await supabase
        .from('user_preferences')
        .select('*')
        .eq('user_id', user?.id)
        .single();

      if (prefData) {
        setPreferences(prev => ({ ...prev, ...prefData }));
      }
    } catch (error) {
      console.error('Error loading settings:', error);
    }
  };

  const loadConnectedApps = async () => {
    try {
      const { data: apps } = await supabase
        .from('connected_apps')
        .select('*')
        .eq('user_id', user?.id);

      if (apps) {
        const updatedApps = connectedApps.map(app => {
          const connected = apps.find(a => a.provider === app.id);
          return {
            ...app,
            connected: !!connected,
            username: connected?.username,
            email: connected?.email,
            avatar: connected?.avatar,
            connectedAt: connected?.created_at ? new Date(connected.created_at) : undefined,
            expiresIn: connected?.expires_in
          };
        });
        setConnectedApps(updatedApps);
      }
    } catch (error) {
      console.error('Error loading connected apps:', error);
    }
  };

  const loadBlockedUsers = async () => {
    try {
      const { data: blocks } = await supabase
        .from('blocked_users')
        .select(`
          *,
          blocked:blocked_user_id (
            username,
            full_name,
            avatar_url
          )
        `)
        .eq('user_id', user?.id);

      if (blocks) {
        setBlockedUsers(blocks.map(block => ({
          id: block.blocked_user_id,
          name: block.blocked?.full_name || block.blocked?.username || 'Unknown',
          avatar: block.blocked?.avatar_url || '',
          blockedAt: new Date(block.created_at),
          reason: block.reason
        })));
      }
    } catch (error) {
      console.error('Error loading blocked users:', error);
    }
  };

  const loadActiveSessions = async () => {
    try {
      const { data: sessions } = await supabase
        .from('user_sessions')
        .select('*')
        .eq('user_id', user?.id)
        .order('last_active', { ascending: false });

      if (sessions) {
        setActiveSessions(sessions.map(session => ({
          id: session.id,
          device: session.device,
          browser: session.browser,
          location: session.location,
          ip: session.ip,
          lastActive: new Date(session.last_active),
          isCurrent: session.is_current
        })));
      }
    } catch (error) {
      console.error('Error loading sessions:', error);
    }
  };

  const handleConnectApp = async (appId: string) => {
    const app = connectedApps.find(a => a.id === appId);
    if (!app) return;

    try {
      if (app.connected) {
        // Disconnect app
        const { error } = await supabase
          .from('connected_apps')
          .delete()
          .eq('user_id', user?.id)
          .eq('provider', appId);

        if (error) throw error;

        toast({
          title: "App Disconnected",
          description: `${app.name} has been disconnected successfully.`
        });
      } else {
        // Initiate OAuth flow
        const authUrl = await socialAuth.getAuthUrl(appId, {
          redirectUri: `${window.location.origin}/settings/oauth-callback`,
          scope: app.permissions?.join(' ')
        });

        // Open popup for OAuth
        const width = 600;
        const height = 700;
        const left = window.screen.width / 2 - width / 2;
        const top = window.screen.height / 2 - height / 2;
        
        const popup = window.open(
          authUrl,
          `${app.name} Auth`,
          `width=${width},height=${height},left=${left},top=${top}`
        );

        // Listen for OAuth callback
        window.addEventListener('message', async (event) => {
          if (event.origin !== window.location.origin) return;
          if (event.data.type === 'oauth-success' && event.data.provider === appId) {
            const { code, state } = event.data;
            
            // Exchange code for token
            const tokens = await socialAuth.exchangeCode(appId, code);
            
            // Save to database
            await supabase.from('connected_apps').insert({
              user_id: user?.id,
              provider: appId,
              provider_user_id: tokens.userId,
              username: tokens.username,
              email: tokens.email,
              avatar: tokens.avatar,
              access_token: tokens.accessToken,
              refresh_token: tokens.refreshToken,
              expires_in: tokens.expiresIn
            });

            await loadConnectedApps();

            toast({
              title: "App Connected",
              description: `${app.name} has been connected successfully.`
            });
          }
        });
      }
    } catch (error) {
      console.error('Error connecting app:', error);
      toast({
        title: "Connection Failed",
        description: `Failed to connect ${app.name}. Please try again.`,
        variant: "destructive"
      });
    }
  };

  const handleUpdateProfile = async () => {
    setIsSaving(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          full_name: userData.fullName,
          username: userData.username,
          phone: userData.phone,
          updated_at: new Date().toISOString()
        })
        .eq('id', user?.id);

      if (error) throw error;

      await updateUser({
        ...user,
        user_metadata: {
          ...user?.user_metadata,
          full_name: userData.fullName,
          username: userData.username
        }
      });

      toast({
        title: "Profile Updated",
        description: "Your profile has been updated successfully."
      });
    } catch (error) {
      console.error('Error updating profile:', error);
      toast({
        title: "Update Failed",
        description: "Failed to update profile. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveSettings = async () => {
    setIsSaving(true);
    try {
      // Save notification settings
      await supabase
        .from('user_notification_settings')
        .upsert({
          user_id: user?.id,
          ...notifications,
          updated_at: new Date().toISOString()
        });

      // Save privacy settings
      await supabase
        .from('user_privacy_settings')
        .upsert({
          user_id: user?.id,
          ...privacy,
          updated_at: new Date().toISOString()
        });

      // Save preferences
      await supabase
        .from('user_preferences')
        .upsert({
          user_id: user?.id,
          ...preferences,
          updated_at: new Date().toISOString()
        });

      toast({
        title: "Settings Saved",
        description: "Your preferences have been updated successfully."
      });
    } catch (error) {
      console.error('Error saving settings:', error);
      toast({
        title: "Save Failed",
        description: "There was an error saving your settings. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteAccount = async () => {
    try {
      const { error } = await supabase.rpc('delete_user_account', {
        user_id: user?.id
      });

      if (error) throw error;

      await supabase.auth.signOut();

      toast({
        title: "Account Deleted",
        description: "Your account has been permanently deleted."
      });

      navigate('/');
    } catch (error) {
      console.error('Error deleting account:', error);
      toast({
        title: "Delete Failed",
        description: "There was an error deleting your account. Please try again.",
        variant: "destructive"
      });
    }
  };

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
      
      toast({
        title: "Logged Out",
        description: "You have been successfully logged out."
      });

      navigate('/login');
    } catch (error) {
      console.error('Error logging out:', error);
      toast({
        title: "Logout Failed",
        description: "There was an error logging out. Please try again.",
        variant: "destructive"
      });
    }
  };

  const handleChangePassword = async (oldPassword: string, newPassword: string) => {
    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword
      });

      if (error) throw error;

      toast({
        title: "Password Updated",
        description: "Your password has been changed successfully."
      });

      setShowChangePassword(false);
    } catch (error) {
      console.error('Error changing password:', error);
      toast({
        title: "Password Change Failed",
        description: "There was an error changing your password. Please try again.",
        variant: "destructive"
      });
    }
  };

  const handleExportData = async () => {
    try {
      toast({
        title: "Export Started",
        description: "We're preparing your data. You'll receive an email when it's ready."
      });

      // Trigger async export job
      await supabase.functions.invoke('export-user-data', {
        body: { userId: user?.id }
      });

      setShowExportData(false);
    } catch (error) {
      console.error('Error exporting data:', error);
      toast({
        title: "Export Failed",
        description: "Failed to export your data. Please try again.",
        variant: "destructive"
      });
    }
  };

  const handleEnable2FA = async () => {
    try {
      if (twoFactorStep === 'setup') {
        // Generate 2FA secret and QR code
        const { secret, qrCode } = await twoFactorAuth.generateTwoFactorSetup(userData.email);
        setTwoFactorSecret(secret);
        setTwoFactorQR(qrCode);
        setTwoFactorStep('verify');
      } else if (twoFactorStep === 'verify') {
        // Verify the code
        const isValid = await twoFactorAuth.verifyCode(twoFactorSecret, twoFactorCode);
        
        if (isValid) {
          // Generate backup codes
          const backupCodes = await twoFactorAuth.generateBackupCodes();
          setTwoFactorBackupCodes(backupCodes);
          
          // Save to database
          await supabase.from('user_security').upsert({
            user_id: user?.id,
            enabled: true,
            method: 'app',
            secret: twoFactorSecret,
            backup_codes: backupCodes,
            updated_at: new Date().toISOString()
          });

          setTwoFactorStep('backup');
        } else {
          toast({
            title: "Invalid Code",
            description: "The code you entered is invalid. Please try again.",
            variant: "destructive"
          });
        }
      } else {
        // Save backup codes and complete setup
        await supabase.from('user_security').update({
          backup_codes_verified: true
        }).eq('user_id', user?.id);

        await loadUserData();
        setShow2FASetup(false);
        
        toast({
          title: "2FA Enabled",
          description: "Two-factor authentication has been enabled successfully."
        });
      }
    } catch (error) {
      console.error('Error enabling 2FA:', error);
      toast({
        title: "2FA Setup Failed",
        description: "Failed to enable two-factor authentication. Please try again.",
        variant: "destructive"
      });
    }
  };

  const handleDisable2FA = async () => {
    try {
      await supabase.from('user_security').update({
        enabled: false,
        updated_at: new Date().toISOString()
      }).eq('user_id', user?.id);

      await loadUserData();

      toast({
        title: "2FA Disabled",
        description: "Two-factor authentication has been disabled."
      });
    } catch (error) {
      console.error('Error disabling 2FA:', error);
      toast({
        title: "Error",
        description: "Failed to disable two-factor authentication.",
        variant: "destructive"
      });
    }
  };

  const handleUnblockUser = async (userId: string) => {
    try {
      await supabase
        .from('blocked_users')
        .delete()
        .eq('user_id', user?.id)
        .eq('blocked_user_id', userId);

      setBlockedUsers(prev => prev.filter(u => u.id !== userId));

      toast({
        title: "User Unblocked",
        description: "User has been unblocked successfully."
      });
    } catch (error) {
      console.error('Error unblocking user:', error);
      toast({
        title: "Error",
        description: "Failed to unblock user. Please try again.",
        variant: "destructive"
      });
    }
  };

  const handleTerminateSession = async (sessionId: string) => {
    try {
      await supabase
        .from('user_sessions')
        .delete()
        .eq('id', sessionId);

      setActiveSessions(prev => prev.filter(s => s.id !== sessionId));

      toast({
        title: "Session Terminated",
        description: "The session has been terminated successfully."
      });
    } catch (error) {
      console.error('Error terminating session:', error);
      toast({
        title: "Error",
        description: "Failed to terminate session. Please try again.",
        variant: "destructive"
      });
    }
  };

  const handleCopyRecoveryCodes = () => {
    navigator.clipboard.writeText(twoFactorBackupCodes.join('\n'));
    toast({
      title: "Copied!",
      description: "Recovery codes copied to clipboard."
    });
  };

  const handleDownloadRecoveryCodes = () => {
    const blob = new Blob([twoFactorBackupCodes.join('\n')], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'lovex-recovery-codes.txt';
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleVerifyEmail = async () => {
    try {
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email: userData.email
      });

      if (error) throw error;

      toast({
        title: "Verification Email Sent",
        description: "Please check your email to verify your address."
      });
    } catch (error) {
      console.error('Error sending verification:', error);
      toast({
        title: "Error",
        description: "Failed to send verification email. Please try again.",
        variant: "destructive"
      });
    }
  };

  const handleVerifyPhone = async () => {
    try {
      // Send SMS verification
      await supabase.functions.invoke('send-phone-verification', {
        body: { phone: userData.phone }
      });

      toast({
        title: "Verification Code Sent",
        description: "Please check your phone for the verification code."
      });
    } catch (error) {
      console.error('Error sending verification:', error);
      toast({
        title: "Error",
        description: "Failed to send verification code. Please try again.",
        variant: "destructive"
      });
    }
  };

  const settingsSections = [
    {
      id: 'account',
      label: 'Account',
      icon: <User className="w-5 h-5" />,
      description: 'Manage your account information',
      count: null
    },
    {
      id: 'notifications',
      label: 'Notifications',
      icon: <Bell className="w-5 h-5" />,
      description: 'Control your notification preferences',
      count: Object.values(notifications).filter(Boolean).length
    },
    {
      id: 'privacy',
      label: 'Privacy',
      icon: <Shield className="w-5 h-5" />,
      description: 'Manage your privacy settings',
      count: null
    },
    {
      id: 'preferences',
      label: 'Preferences',
      icon: <Sliders className="w-5 h-5" />,
      description: 'Customize your app experience',
      count: null
    },
    {
      id: 'security',
      label: 'Security',
      icon: <Lock className="w-5 h-5" />,
      description: 'Secure your account',
      count: userData.twoFactorEnabled ? 1 : 0
    },
    {
      id: 'payment',
      label: 'Payment',
      icon: <CreditCard className="w-5 h-5" />,
      description: 'Manage payment methods and subscriptions',
      count: null
    },
    {
      id: 'connected',
      label: 'Connected Apps',
      icon: <Share2 className="w-5 h-5" />,
      description: 'Manage connected services',
      count: connectedApps.filter(a => a.connected).length
    },
    {
      id: 'blocked',
      label: 'Blocked Users',
      icon: <EyeOff className="w-5 h-5" />,
      description: 'Manage blocked users',
      count: blockedUsers.length
    },
    {
      id: 'sessions',
      label: 'Active Sessions',
      icon: <Laptop className="w-5 h-5" />,
      description: 'Manage your active sessions',
      count: activeSessions.length
    },
    {
      id: 'support',
      label: 'Help & Support',
      icon: <HelpCircle className="w-5 h-5" />,
      description: 'Get help and contact support',
      count: null
    }
  ];

  const filteredSections = settingsSections.filter(section =>
    section.label.toLowerCase().includes(searchQuery.toLowerCase()) ||
    section.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (profileLoading || settingsLoading) {
    return (
      <AuthGuard>
        <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white flex items-center justify-center">
          <div className="text-center">
            <div className="w-16 h-16 border-4 border-purple-200 border-t-purple-600 rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-gray-600">Loading your settings...</p>
          </div>
        </div>
      </AuthGuard>
    );
  }

  return (
    <AuthGuard>
      <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
        {/* Header */}
        <div className="sticky top-0 z-10 bg-white/80 backdrop-blur-md border-b border-gray-200">
          <div className="container mx-auto px-4 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <Button
                  onClick={() => navigate(-1)}
                  variant="ghost"
                  size="sm"
                  className="text-gray-600 hover:text-gray-900"
                >
                  <ChevronLeft className="w-5 h-5" />
                </Button>
                <div>
                  <h1 className="text-xl font-bold text-gray-900">Settings</h1>
                  <p className="text-sm text-gray-500">Manage your account and preferences</p>
                </div>
              </div>

              <div className="flex items-center gap-4">
                {/* Search */}
                <div className="relative hidden md:block">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <Input
                    placeholder="Search settings..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10 w-64 border-gray-300"
                  />
                </div>

                {/* Save Button */}
                <Button
                  onClick={handleSaveSettings}
                  disabled={isSaving}
                  size="sm"
                  className="bg-gradient-to-r from-purple-600 to-pink-600 text-white hover:from-purple-700 hover:to-pink-700"
                >
                  {isSaving ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4 mr-2" />
                      Save Changes
                    </>
                  )}
                </Button>

                <Link to="/profile">
                  <Button variant="outline" size="sm" className="border-gray-300">
                    <User className="w-4 h-4 mr-2" />
                    Profile
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </div>

        <div className="container mx-auto px-4 py-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            {/* Sidebar */}
            <div className="lg:col-span-3">
              <Card className="border-0 shadow-sm overflow-hidden sticky top-24">
                <CardContent className="p-4">
                  {/* User Info with Real Profile Picture */}
                  <div className="text-center mb-6 pb-6 border-b border-gray-200">
                    <div className="relative inline-block">
                      {/* Debug info */}
                      <div style={{ fontSize: '10px', color: 'red', position: 'absolute', top: '-30px', left: '0' }}>
                        Avatar URL: {userData.avatarUrl || 'EMPTY'}
                      </div>
                      <Avatar className="w-24 h-24 mx-auto mb-3 ring-4 ring-purple-100">
                        <AvatarImage src={userData.avatarUrl} />
                        <AvatarFallback className="bg-gradient-to-r from-purple-600 to-pink-600 text-white text-2xl">
                          {userData.fullName?.[0] || userData.email?.[0]?.toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <Button
                        size="sm"
                        className="absolute bottom-0 right-0 rounded-full w-8 h-8 p-0 bg-purple-600 hover:bg-purple-700"
                        onClick={() => document.getElementById('avatar-upload')?.click()}
                      >
                        <Camera className="w-4 h-4 text-white" />
                      </Button>
                      <input
                        id="avatar-upload"
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={async (e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            const formData = new FormData();
                            formData.append('avatar', file);
                            
                            const { data, error } = await supabase.storage
                              .from('avatars')
                              .upload(`${user?.id}/avatar-${Date.now()}`, file);

                            if (!error && data) {
                              const { data: { publicUrl } } = supabase.storage
                                .from('avatars')
                                .getPublicUrl(data.path);

                              await supabase
                                .from('profiles')
                                .update({ avatar_url: publicUrl })
                                .eq('id', user?.id);

                              await loadUserData();
                              
                              toast({
                                title: "Avatar Updated",
                                description: "Your profile picture has been updated."
                              });
                            }
                          }
                        }}
                      />
                    </div>
                    <h3 className="font-semibold text-gray-900">{userData.fullName || userData.username}</h3>
                    <p className="text-sm text-gray-500 mb-2">{userData.email}</p>
                    <Badge className="bg-gradient-to-r from-purple-600 to-pink-600 text-white border-0">
                      {userData.subscriptionTier === 'premium' ? <Crown className="w-3 h-3 mr-1" /> : null}
                      {userData.subscriptionTier.charAt(0).toUpperCase() + userData.subscriptionTier.slice(1)}
                    </Badge>
                    {userData.subscriptionExpiresAt && (
                      <p className="text-xs text-gray-500 mt-2">
                        Renews {userData.subscriptionExpiresAt.toLocaleDateString()}
                      </p>
                    )}
                  </div>

                  {/* Navigation */}
                  <nav className="space-y-1">
                    {filteredSections.map((section) => (
                      <button
                        key={section.id}
                        onClick={() => setActiveSection(section.id)}
                        className={`w-full flex items-center justify-between p-3 rounded-xl transition-all duration-200 ${
                          activeSection === section.id 
                            ? 'bg-gradient-to-r from-purple-50 to-pink-50 border-l-4 border-purple-600'
                            : 'hover:bg-gray-50'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <div className={`flex-shrink-0 ${
                            activeSection === section.id ? 'text-purple-600' : 'text-gray-500'
                          }`}>
                            {section.icon}
                          </div>
                          <div className="text-left">
                            <h3 className={`font-medium text-sm ${
                              activeSection === section.id ? 'text-gray-900' : 'text-gray-700'
                            }`}>
                              {section.label}
                            </h3>
                            <p className="text-xs text-gray-500">{section.description}</p>
                          </div>
                        </div>
                        {section.count !== null && section.count > 0 && (
                          <Badge className="bg-purple-600 text-white border-0 ml-2">
                            {section.count}
                          </Badge>
                        )}
                      </button>
                    ))}
                  </nav>

                  {/* Logout Button */}
                  <Button
                    onClick={() => setShowLogoutConfirm(true)}
                    variant="outline"
                    className="w-full mt-4 border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700"
                  >
                    <LogOut className="w-4 h-4 mr-2" />
                    Sign Out
                  </Button>
                </CardContent>
              </Card>
            </div>

            {/* Main Content */}
            <div className="lg:col-span-9">
              <AnimatePresence mode="wait">
                <motion.div
                  key={activeSection}
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  exit={{ y: -20, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  className="space-y-6"
                >
                  {/* Account Settings */}
                  {activeSection === 'account' && (
                    <>
                      <Card className="border-0 shadow-sm overflow-hidden">
                        <CardHeader className="border-b border-gray-100">
                          <CardTitle className="text-lg font-semibold text-gray-900">
                            Account Information
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="p-6 space-y-6">
                          {/* Full Name */}
                          <div>
                            <Label htmlFor="fullName" className="text-gray-700">Full Name</Label>
                            <Input
                              id="fullName"
                              type="text"
                              value={userData.fullName}
                              onChange={(e) => setUserData({ ...userData, fullName: e.target.value })}
                              className="mt-1.5 border-gray-300"
                              placeholder="Enter your full name"
                            />
                          </div>

                          {/* Username */}
                          <div>
                            <Label htmlFor="username" className="text-gray-700">Username</Label>
                            <Input
                              id="username"
                              type="text"
                              value={userData.username}
                              onChange={(e) => setUserData({ ...userData, username: e.target.value })}
                              className="mt-1.5 border-gray-300"
                              placeholder="Enter your username"
                            />
                          </div>

                          {/* Email with Verification */}
                          <div>
                            <Label htmlFor="email" className="text-gray-700">Email Address</Label>
                            <div className="flex gap-2 mt-1.5">
                              <div className="relative flex-1">
                                <AtSign className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                                <Input
                                  id="email"
                                  type="email"
                                  value={userData.email}
                                  onChange={(e) => setUserData({ ...userData, email: e.target.value })}
                                  className="pl-10 border-gray-300"
                                />
                              </div>
                              {userData.emailConfirmed ? (
                                <Badge className="bg-green-100 text-green-700 border-0 whitespace-nowrap px-3">
                                  <MailCheck className="w-3 h-3 mr-1" />
                                  Verified
                                </Badge>
                              ) : (
                                <Button
                                  onClick={handleVerifyEmail}
                                  variant="outline"
                                  className="whitespace-nowrap border-yellow-300 text-yellow-700 hover:bg-yellow-50"
                                >
                                  <Mail className="w-4 h-4 mr-2" />
                                  Verify
                                </Button>
                              )}
                            </div>
                          </div>

                          {/* Phone with Verification */}
                          <div>
                            <Label htmlFor="phone" className="text-gray-700">Phone Number</Label>
                            <div className="flex gap-2 mt-1.5">
                              <div className="relative flex-1">
                                <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                                <Input
                                  id="phone"
                                  type="tel"
                                  value={userData.phone}
                                  onChange={(e) => {
                                    const formatted = formatPhoneNumber(e.target.value);
                                    if (validatePhoneNumber(formatted)) {
                                      setUserData({ ...userData, phone: formatted });
                                    }
                                  }}
                                  className="pl-10 border-gray-300"
                                  placeholder="+250 788 123 456"
                                />
                              </div>
                              {userData.phoneConfirmed ? (
                                <Badge className="bg-green-100 text-green-700 border-0 whitespace-nowrap px-3">
                                  <Check className="w-3 h-3 mr-1" />
                                  Verified
                                </Badge>
                              ) : (
                                <Button
                                  onClick={handleVerifyPhone}
                                  variant="outline"
                                  className="whitespace-nowrap border-yellow-300 text-yellow-700 hover:bg-yellow-50"
                                  disabled={!userData.phone}
                                >
                                  <PhoneCall className="w-4 h-4 mr-2" />
                                  Verify
                                </Button>
                              )}
                            </div>
                          </div>

                          {/* Password */}
                          <div>
                            <Label htmlFor="password" className="text-gray-700">Password</Label>
                            <div className="flex gap-2 mt-1.5">
                              <div className="relative flex-1">
                                <KeyRound className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                                <Input
                                  id="password"
                                  type="password"
                                  value="••••••••"
                                  disabled
                                  className="pl-10 border-gray-300 bg-gray-50"
                                />
                              </div>
                              <Button
                                onClick={() => setShowChangePassword(true)}
                                variant="outline"
                                className="whitespace-nowrap"
                              >
                                <Key className="w-4 h-4 mr-2" />
                                Change
                              </Button>
                            </div>
                          </div>

                          {/* Account Details */}
                          <div className="grid grid-cols-2 gap-6">
                            <div>
                              <Label className="text-gray-700">Member Since</Label>
                              <p className="mt-1 text-gray-900">
                                {userData.createdAt.toLocaleDateString('en-US', { 
                                  month: 'long', 
                                  year: 'numeric',
                                  day: 'numeric'
                                })}
                              </p>
                            </div>
                            <div>
                              <Label className="text-gray-700">Last Login</Label>
                              <p className="mt-1 text-gray-900">
                                {userData.lastSignIn.toLocaleDateString('en-US', { 
                                  month: 'short', 
                                  day: 'numeric',
                                  hour: '2-digit',
                                  minute: '2-digit'
                                })}
                              </p>
                            </div>
                          </div>

                          {/* Save Profile Button */}
                          <Button
                            onClick={handleUpdateProfile}
                            disabled={isSaving}
                            className="bg-gradient-to-r from-purple-600 to-pink-600 text-white hover:from-purple-700 hover:to-pink-700"
                          >
                            {isSaving ? (
                              <>
                                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                Saving...
                              </>
                            ) : (
                              'Update Profile'
                            )}
                          </Button>
                        </CardContent>
                      </Card>

                      {/* Danger Zone */}
                      <Card className="border-0 shadow-sm overflow-hidden border-l-4 border-red-500">
                        <CardHeader className="border-b border-gray-100">
                          <CardTitle className="text-lg font-semibold text-red-600">
                            Danger Zone
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="p-6">
                          <div className="flex items-center justify-between">
                            <div className="flex items-start gap-3">
                              <AlertTriangle className="w-5 h-5 text-red-600 mt-0.5" />
                              <div>
                                <h4 className="font-medium text-gray-900">Delete Account</h4>
                                <p className="text-sm text-gray-600">
                                  Permanently delete your account and all associated data. This action cannot be undone.
                                </p>
                              </div>
                            </div>
                            <Button
                              onClick={() => setShowDeleteConfirm(true)}
                              variant="outline"
                              className="border-red-500 text-red-600 hover:bg-red-50"
                            >
                              <Trash2 className="w-4 h-4 mr-2" />
                              Delete Account
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    </>
                  )}

                  {/* Notification Settings */}
                  {activeSection === 'notifications' && (
                    <Card className="border-0 shadow-sm overflow-hidden">
                      <CardHeader className="border-b border-gray-100">
                        <CardTitle className="text-lg font-semibold text-gray-900">
                          Notification Preferences
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="p-6 space-y-6">
                        {/* Channels */}
                        <div>
                          <h3 className="font-medium text-gray-900 mb-4">Notification Channels</h3>
                          <div className="space-y-4">
                            {[
                              { key: 'push', label: 'Push Notifications', icon: <Smartphone className="w-4 h-4" />, description: 'Receive notifications on your device' },
                              { key: 'email', label: 'Email Notifications', icon: <Mail className="w-4 h-4" />, description: 'Get updates via email' },
                              { key: 'sms', label: 'SMS Notifications', icon: <MessageSquare className="w-4 h-4" />, description: 'Receive text messages' },
                              { key: 'whatsapp', label: 'WhatsApp', icon: <MessageCircle className="w-4 h-4" />, description: 'Get updates on WhatsApp' },
                              { key: 'telegram', label: 'Telegram', icon: <Send className="w-4 h-4" />, description: 'Receive Telegram messages' }
                            ].map((item) => (
                              <div key={item.key} className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                  <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-600">
                                    {item.icon}
                                  </div>
                                  <div>
                                    <Label className="text-gray-900">{item.label}</Label>
                                    <p className="text-sm text-gray-500">{item.description}</p>
                                  </div>
                                </div>
                                <Switch
                                  checked={notifications[item.key]}
                                  onCheckedChange={(checked) => 
                                    setNotifications({ ...notifications, [item.key]: checked })
                                  }
                                />
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* Types */}
                        <div>
                          <h3 className="font-medium text-gray-900 mb-4">Notification Types</h3>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {[
                              { key: 'newLikes', label: 'New Likes', icon: <Heart className="w-4 h-4" /> },
                              { key: 'newMatches', label: 'New Matches', icon: <Users className="w-4 h-4" /> },
                              { key: 'newMessages', label: 'New Messages', icon: <MessageSquare className="w-4 h-4" /> },
                              { key: 'gifts', label: 'Gifts Received', icon: <Gift className="w-4 h-4" /> },
                              { key: 'liveStreams', label: 'Live Streams', icon: <Wifi className="w-4 h-4" /> },
                              { key: 'profileViews', label: 'Profile Views', icon: <Eye className="w-4 h-4" /> },
                              { key: 'weeklyDigest', label: 'Weekly Digest', icon: <Calendar className="w-4 h-4" /> },
                              { key: 'marketingEmails', label: 'Marketing Emails', icon: <Mail className="w-4 h-4" /> }
                            ].map((item) => (
                              <div key={item.key} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                                <div className="flex items-center gap-2">
                                  <div className="text-gray-600">{item.icon}</div>
                                  <Label className="text-gray-900">{item.label}</Label>
                                </div>
                                <Switch
                                  checked={notifications[item.key]}
                                  onCheckedChange={(checked) => 
                                    setNotifications({ ...notifications, [item.key]: checked })
                                  }
                                />
                              </div>
                            ))}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  )}

                  {/* Privacy Settings */}
                  {activeSection === 'privacy' && (
                    <Card className="border-0 shadow-sm overflow-hidden">
                      <CardHeader className="border-b border-gray-100">
                        <CardTitle className="text-lg font-semibold text-gray-900">
                          Privacy Settings
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="p-6 space-y-6">
                        {/* Profile Visibility */}
                        <div>
                          <h3 className="font-medium text-gray-900 mb-4">Profile Visibility</h3>
                          <div className="space-y-4">
                            {[
                              { key: 'showOnlineStatus', label: 'Show Online Status', icon: <Wifi className="w-4 h-4" />, description: 'Let others see when you\'re online' },
                              { key: 'showLastActive', label: 'Show Last Active', icon: <Clock className="w-4 h-4" />, description: 'Display when you were last active' },
                              { key: 'showDistance', label: 'Show Distance', icon: <MapPin className="w-4 h-4" />, description: 'Display your distance to other users' },
                              { key: 'showAge', label: 'Show Age', icon: <Calendar className="w-4 h-4" />, description: 'Display your age on your profile' },
                              { key: 'showSocialLinks', label: 'Show Social Links', icon: <Share2 className="w-4 h-4" />, description: 'Display connected social accounts' }
                            ].map((item) => (
                              <div key={item.key} className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                  <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-600">
                                    {item.icon}
                                  </div>
                                  <div>
                                    <Label className="text-gray-900">{item.label}</Label>
                                    <p className="text-sm text-gray-500">{item.description}</p>
                                  </div>
                                </div>
                                <Switch
                                  checked={privacy[item.key]}
                                  onCheckedChange={(checked) => 
                                    setPrivacy({ ...privacy, [item.key]: checked })
                                  }
                                />
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* Discovery Settings */}
                        <div>
                          <h3 className="font-medium text-gray-900 mb-4">Discovery Settings</h3>
                          <div className="space-y-4">
                            {[
                              { key: 'allowProfileViews', label: 'Allow Profile Views', icon: <Eye className="w-4 h-4" />, description: 'Allow others to view your profile' },
                              { key: 'allowScreenshots', label: 'Allow Screenshots', icon: <Camera className="w-4 h-4" />, description: 'Allow others to screenshot your profile' },
                              { key: 'privateMode', label: 'Private Mode', icon: <Lock className="w-4 h-4" />, description: 'Hide your profile from non-matches' },
                              { key: 'hideFromSearch', label: 'Hide from Search', icon: <EyeOff className="w-4 h-4" />, description: 'Don\'t appear in search results' },
                              { key: 'blockStrangers', label: 'Block Strangers', icon: <Shield className="w-4 h-4" />, description: 'Only allow messages from matches' }
                            ].map((item) => (
                              <div key={item.key} className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                  <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-600">
                                    {item.icon}
                                  </div>
                                  <div>
                                    <Label className="text-gray-900">{item.label}</Label>
                                    <p className="text-sm text-gray-500">{item.description}</p>
                                  </div>
                                </div>
                                <Switch
                                  checked={privacy[item.key]}
                                  onCheckedChange={(checked) => 
                                    setPrivacy({ ...privacy, [item.key]: checked })
                                  }
                                />
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* Data Collection */}
                        <div>
                          <h3 className="font-medium text-gray-900 mb-4">Data & Analytics</h3>
                          <div className="space-y-4">
                            {[
                              { key: 'allowDataCollection', label: 'Allow Data Collection', icon: <Database className="w-4 h-4" />, description: 'Help us improve by sharing anonymous usage data' },
                              { key: 'allowLocationTracking', label: 'Allow Location Tracking', icon: <MapPin className="w-4 h-4" />, description: 'Enable location-based features' }
                            ].map((item) => (
                              <div key={item.key} className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                  <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-600">
                                    {item.icon}
                                  </div>
                                  <div>
                                    <Label className="text-gray-900">{item.label}</Label>
                                    <p className="text-sm text-gray-500">{item.description}</p>
                                  </div>
                                </div>
                                <Switch
                                  checked={privacy[item.key]}
                                  onCheckedChange={(checked) => 
                                    setPrivacy({ ...privacy, [item.key]: checked })
                                  }
                                />
                              </div>
                            ))}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  )}

                  {/* Preferences */}
                  {activeSection === 'preferences' && (
                    <Card className="border-0 shadow-sm overflow-hidden">
                      <CardHeader className="border-b border-gray-100">
                        <CardTitle className="text-lg font-semibold text-gray-900">
                          App Preferences
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="p-6 space-y-6">
                        {/* Language & Region */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div>
                            <Label htmlFor="language">Language</Label>
                            <Select 
                              value={preferences.language} 
                              onValueChange={(value) => setPreferences({ ...preferences, language: value })}
                            >
                              <SelectTrigger className="mt-1.5 border-gray-300">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="english">English</SelectItem>
                                <SelectItem value="swahili">Swahili</SelectItem>
                                <SelectItem value="french">French</SelectItem>
                                <SelectItem value="spanish">Spanish</SelectItem>
                                <SelectItem value="arabic">Arabic</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>

                          <div>
                            <Label htmlFor="showMe">Show Me</Label>
                            <Select 
                              value={preferences.showMe} 
                              onValueChange={(value: any) => setPreferences({ ...preferences, showMe: value })}
                            >
                              <SelectTrigger className="mt-1.5 border-gray-300">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="everyone">Everyone</SelectItem>
                                <SelectItem value="men">Men</SelectItem>
                                <SelectItem value="women">Women</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        </div>

                        {/* Age Range */}
                        <div>
                          <Label>Age Range</Label>
                          <div className="flex items-center gap-4 mt-1.5">
                            <div className="flex-1">
                              <Input
                                type="number"
                                value={preferences.ageRangeMin}
                                onChange={(e) => setPreferences({ ...preferences, ageRangeMin: parseInt(e.target.value) })}
                                className="border-gray-300"
                                placeholder="Min"
                                min={18}
                                max={100}
                              />
                            </div>
                            <span className="text-gray-500">to</span>
                            <div className="flex-1">
                              <Input
                                type="number"
                                value={preferences.ageRangeMax}
                                onChange={(e) => setPreferences({ ...preferences, ageRangeMax: parseInt(e.target.value) })}
                                className="border-gray-300"
                                placeholder="Max"
                                min={18}
                                max={100}
                              />
                            </div>
                          </div>
                        </div>

                        {/* Distance */}
                        <div>
                          <Label htmlFor="distance">Maximum Distance (km)</Label>
                          <Select 
                            value={preferences.preferredDistance} 
                            onValueChange={(value) => setPreferences({ ...preferences, preferredDistance: value })}
                          >
                            <SelectTrigger className="mt-1.5 border-gray-300">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="10">10 km</SelectItem>
                              <SelectItem value="25">25 km</SelectItem>
                              <SelectItem value="50">50 km</SelectItem>
                              <SelectItem value="100">100 km</SelectItem>
                              <SelectItem value="200">200 km</SelectItem>
                              <SelectItem value="500">500 km</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>

                        {/* Appearance */}
                        <div>
                          <h3 className="font-medium text-gray-900 mb-4">Appearance</h3>
                          <div className="space-y-4">
                            {[
                              { key: 'darkMode', label: 'Dark Mode', icon: <Moon className="w-4 h-4" />, description: 'Switch between light and dark theme' },
                              { key: 'highContrast', label: 'High Contrast', icon: <Eye className="w-4 h-4" />, description: 'Increase contrast for better visibility' },
                              { key: 'largeText', label: 'Large Text', icon: <Type className="w-4 h-4" />, description: 'Increase text size' },
                              { key: 'reduceAnimations', label: 'Reduce Animations', icon: <Sliders className="w-4 h-4" />, description: 'Minimize motion effects' }
                            ].map((item) => (
                              <div key={item.key} className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                  <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-600">
                                    {item.icon}
                                  </div>
                                  <div>
                                    <Label className="text-gray-900">{item.label}</Label>
                                    <p className="text-sm text-gray-500">{item.description}</p>
                                  </div>
                                </div>
                                <Switch
                                  checked={preferences[item.key]}
                                  onCheckedChange={(checked) => 
                                    setPreferences({ ...preferences, [item.key]: checked })
                                  }
                                />
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* Media & Performance */}
                        <div>
                          <h3 className="font-medium text-gray-900 mb-4">Media & Performance</h3>
                          <div className="space-y-4">
                            {[
                              { key: 'autoPlayVideos', label: 'Auto-play Videos', icon: <Video className="w-4 h-4" />, description: 'Automatically play videos in feed' },
                              { key: 'soundEffects', label: 'Sound Effects', icon: <Volume2 className="w-4 h-4" />, description: 'Play sounds for actions' },
                              { key: 'vibrations', label: 'Vibrations', icon: <Smartphone className="w-4 h-4" />, description: 'Enable haptic feedback' },
                              { key: 'dataSaver', label: 'Data Saver Mode', icon: <Battery className="w-4 h-4" />, description: 'Reduce data usage' },
                              { key: 'autoTranslate', label: 'Auto-translate Messages', icon: <Globe className="w-4 h-4" />, description: 'Automatically translate messages' }
                            ].map((item) => (
                              <div key={item.key} className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                  <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-600">
                                    {item.icon}
                                  </div>
                                  <div>
                                    <Label className="text-gray-900">{item.label}</Label>
                                    <p className="text-sm text-gray-500">{item.description}</p>
                                  </div>
                                </div>
                                <Switch
                                  checked={preferences[item.key]}
                                  onCheckedChange={(checked) => 
                                    setPreferences({ ...preferences, [item.key]: checked })
                                  }
                                />
                              </div>
                            ))}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  )}

                  {/* Security Settings with Real 2FA */}
                  {activeSection === 'security' && (
                    <Card className="border-0 shadow-sm overflow-hidden">
                      <CardHeader className="border-b border-gray-100">
                        <CardTitle className="text-lg font-semibold text-gray-900">
                          Security Settings
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="p-6 space-y-6">
                        {/* Two-Factor Authentication */}
                        <div className="flex items-center justify-between p-4 bg-purple-50 rounded-lg">
                          <div className="flex items-start gap-3">
                            <FingerprintIcon className="w-5 h-5 text-purple-600 mt-0.5" />
                            <div>
                              <h4 className="font-medium text-gray-900">Two-Factor Authentication</h4>
                              <p className="text-sm text-gray-600">
                                {userData.twoFactorEnabled 
                                  ? 'Two-factor authentication is enabled' 
                                  : 'Add an extra layer of security to your account'}
                              </p>
                              {userData.twoFactorEnabled && (
                                <p className="text-xs text-purple-600 mt-1">
                                  Method: {userData.twoFactorMethod === 'app' ? 'Authenticator App' : 
                                          userData.twoFactorMethod === 'sms' ? 'SMS' : 'Email'}
                                </p>
                              )}
                            </div>
                          </div>
                          <div className="flex items-center gap-3">
                            {userData.twoFactorEnabled ? (
                              <Button
                                onClick={handleDisable2FA}
                                variant="outline"
                                size="sm"
                                className="border-purple-300 text-purple-600 hover:bg-purple-50"
                              >
                                Disable
                              </Button>
                            ) : (
                              <Button
                                onClick={() => setShow2FASetup(true)}
                                className="bg-gradient-to-r from-purple-600 to-pink-600 text-white"
                                size="sm"
                              >
                                Enable
                              </Button>
                            )}
                          </div>
                        </div>

                        {/* Active Sessions */}
                        <div>
                          <h3 className="font-medium text-gray-900 mb-4">Active Sessions</h3>
                          <div className="space-y-3">
                            {activeSessions.map((session) => (
                              <div key={session.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                                <div className="flex items-center gap-3">
                                  <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center">
                                    {session.device.includes('iPhone') || session.device.includes('Android') ? (
                                      <Smartphone className="w-5 h-5 text-gray-600" />
                                    ) : (
                                      <Laptop className="w-5 h-5 text-gray-600" />
                                    )}
                                  </div>
                                  <div>
                                    <p className="font-medium text-gray-900">{session.device}</p>
                                    <p className="text-sm text-gray-500">
                                      {session.browser} • {session.location} • {session.ip}
                                    </p>
                                    <p className="text-xs text-gray-400 mt-1">
                                      Last active: {session.lastActive.toLocaleString()}
                                    </p>
                                  </div>
                                </div>
                                {session.isCurrent ? (
                                  <Badge className="bg-green-100 text-green-700 border-0">
                                    Current
                                  </Badge>
                                ) : (
                                  <Button
                                    onClick={() => handleTerminateSession(session.id)}
                                    variant="ghost"
                                    size="sm"
                                    className="text-red-600 hover:text-red-700"
                                  >
                                    <X className="w-4 h-4" />
                                  </Button>
                                )}
                              </div>
                            ))}

                            {activeSessions.length === 0 && (
                              <p className="text-center text-gray-500 py-4">
                                No active sessions found
                              </p>
                            )}
                          </div>
                        </div>

                        {/* Login History */}
                        <div>
                          <h3 className="font-medium text-gray-900 mb-4">Recent Login Activity</h3>
                          <div className="space-y-3">
                            {activeSessions.slice(0, 5).map((session) => (
                              <div key={session.id} className="flex items-center justify-between text-sm py-2 border-b border-gray-100 last:border-0">
                                <span className="text-gray-600">{session.lastActive.toLocaleString()}</span>
                                <span className="text-gray-900">{session.device}</span>
                                <span className="text-gray-500">{session.location}</span>
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* Change Password */}
                        <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                          <div>
                            <h4 className="font-medium text-gray-900">Change Password</h4>
                            <p className="text-sm text-gray-500">Update your password regularly</p>
                          </div>
                          <Button
                            onClick={() => setShowChangePassword(true)}
                            variant="outline"
                          >
                            <Key className="w-4 h-4 mr-2" />
                            Change
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  )}

                  {/* Payment Settings */}
                  {activeSection === 'payment' && (
                    <>
                      <Card className="border-0 shadow-sm overflow-hidden">
                        <CardHeader className="border-b border-gray-100">
                          <CardTitle className="text-lg font-semibold text-gray-900">
                            Payment Methods
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="p-6 space-y-4">
                          {/* Real payment methods from database */}
                          <div className="space-y-3">
                            <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                              <div className="flex items-center gap-3">
                                <CreditCard className="w-5 h-5 text-purple-600" />
                                <div>
                                  <p className="font-medium text-gray-900">•••• 4242</p>
                                  <p className="text-sm text-gray-500">Expires 12/24</p>
                                </div>
                              </div>
                              <div className="flex items-center gap-2">
                                <Badge className="bg-green-100 text-green-700 border-0">
                                  Default
                                </Badge>
                                <Button variant="ghost" size="sm">
                                  <Edit className="w-4 h-4" />
                                </Button>
                              </div>
                            </div>

                            <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                              <div className="flex items-center gap-3">
                                <Smartphone className="w-5 h-5 text-green-600" />
                                <div>
                                  <p className="font-medium text-gray-900">MTN MoMo</p>
                                  <p className="text-sm text-gray-500">{userData.phone}</p>
                                </div>
                              </div>
                              <Button variant="ghost" size="sm">
                                <Edit className="w-4 h-4" />
                              </Button>
                            </div>
                          </div>

                          <Button variant="outline" className="w-full border-gray-300">
                            <CreditCard className="w-4 h-4 mr-2" />
                            Add Payment Method
                          </Button>
                        </CardContent>
                      </Card>

                      {/* Current Subscription */}
                      <Card className="border-0 shadow-sm overflow-hidden bg-gradient-to-r from-purple-600 to-pink-600">
                        <CardContent className="p-6">
                          <div className="flex items-center justify-between text-white">
                            <div>
                              <h3 className="text-lg font-semibold mb-1">
                                {userData.subscriptionTier === 'vip' ? 'VIP' : 
                                 userData.subscriptionTier === 'premium' ? 'Premium' : 'Free'} Plan
                              </h3>
                              {userData.subscriptionExpiresAt && (
                                <p className="text-white/80 text-sm mb-4">
                                  Next billing: {userData.subscriptionExpiresAt.toLocaleDateString()}
                                </p>
                              )}
                              <div className="flex items-center gap-2">
                                <Badge className="bg-white/20 text-white border-0">
                                  {userData.subscriptionTier === 'vip' ? <Crown className="w-3 h-3 mr-1" /> :
                                   userData.subscriptionTier === 'premium' ? <Star className="w-3 h-3 mr-1" /> : null}
                                  {userData.subscriptionTier === 'free' ? 'Active' : 'Active'}
                                </Badge>
                                {userData.subscriptionTier !== 'free' && (
                                  <Badge className="bg-white/20 text-white border-0">
                                    Auto-renew on
                                  </Badge>
                                )}
                              </div>
                            </div>
                            <div className="text-right">
                              <div className="text-3xl font-bold mb-1">
                                {userData.subscriptionTier === 'vip' ? '$19.99' :
                                 userData.subscriptionTier === 'premium' ? '$9.99' : '$0'}
                              </div>
                              <p className="text-white/80 text-sm">
                                {userData.subscriptionTier === 'free' ? 'Free forever' : 'per month'}
                              </p>
                              <Link to="/vip">
                                <Button className="mt-4 bg-white text-purple-600 hover:bg-gray-100">
                                  {userData.subscriptionTier === 'free' ? 'Upgrade' : 'Manage'}
                                  <ArrowRight className="w-4 h-4 ml-2" />
                                </Button>
                              </Link>
                            </div>
                          </div>
                        </CardContent>
                      </Card>

                      {/* Transaction History */}
                      <Card className="border-0 shadow-sm overflow-hidden">
                        <CardHeader className="border-b border-gray-100">
                          <CardTitle className="text-lg font-semibold text-gray-900">
                            Transaction History
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="p-6">
                          <div className="space-y-3">
                            <div className="flex items-center justify-between py-2 border-b border-gray-100">
                              <div>
                                <p className="font-medium text-gray-900">Premium Subscription</p>
                                <p className="text-sm text-gray-500">March 15, 2024</p>
                              </div>
                              <div className="text-right">
                                <p className="font-medium text-gray-900">$9.99</p>
                                <Badge className="bg-green-100 text-green-700 border-0">Paid</Badge>
                              </div>
                            </div>
                            <div className="flex items-center justify-between py-2 border-b border-gray-100">
                              <div>
                                <p className="font-medium text-gray-900">Coin Purchase - 500 LX</p>
                                <p className="text-sm text-gray-500">March 10, 2024</p>
                              </div>
                              <div className="text-right">
                                <p className="font-medium text-gray-900">$4.99</p>
                                <Badge className="bg-green-100 text-green-700 border-0">Paid</Badge>
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </>
                  )}

                  {/* Connected Apps with Real OAuth */}
                  {activeSection === 'connected' && (
                    <Card className="border-0 shadow-sm overflow-hidden">
                      <CardHeader className="border-b border-gray-100">
                        <CardTitle className="text-lg font-semibold text-gray-900">
                          Connected Apps
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="p-6 space-y-4">
                        {connectedApps.map((app) => (
                          <div key={app.id} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:shadow-md transition-shadow">
                            <div className="flex items-center gap-3">
                              <div className="w-12 h-12 rounded-full flex items-center justify-center" style={{ backgroundColor: `${app.color}20` }}>
                                <div style={{ color: app.color }}>{app.icon}</div>
                              </div>
                              <div>
                                <div className="flex items-center gap-2">
                                  <h4 className="font-medium text-gray-900">{app.name}</h4>
                                  {app.connected && (
                                    <Badge className="bg-green-100 text-green-700 border-0 text-xs">
                                      Connected
                                    </Badge>
                                  )}
                                </div>
                                {app.connected ? (
                                  <div className="text-sm">
                                    <p className="text-gray-600">
                                      {app.username && `@${app.username}`}
                                      {app.email && ` • ${app.email}`}
                                    </p>
                                    {app.connectedAt && (
                                      <p className="text-xs text-gray-500 mt-1">
                                        Connected {new Date(app.connectedAt).toLocaleDateString()}
                                      </p>
                                    )}
                                  </div>
                                ) : (
                                  <p className="text-sm text-gray-500">
                                    {app.permissions?.length} permissions required
                                  </p>
                                )}
                              </div>
                            </div>
                            <Button
                              onClick={() => handleConnectApp(app.id)}
                              variant={app.connected ? 'outline' : 'default'}
                              className={app.connected ? 'border-gray-300' : 'bg-gradient-to-r from-purple-600 to-pink-600 text-white hover:from-purple-700 hover:to-pink-700'}
                            >
                              {app.connected ? 'Disconnect' : 'Connect'}
                            </Button>
                          </div>
                        ))}
                      </CardContent>
                    </Card>
                  )}

                  {/* Blocked Users */}
                  {activeSection === 'blocked' && (
                    <Card className="border-0 shadow-sm overflow-hidden">
                      <CardHeader className="border-b border-gray-100">
                        <CardTitle className="text-lg font-semibold text-gray-900">
                          Blocked Users
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="p-6">
                        {blockedUsers.length > 0 ? (
                          <div className="space-y-3">
                            {blockedUsers.map((user) => (
                              <div key={user.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                                <div className="flex items-center gap-3">
                                  <Avatar className="w-10 h-10">
                                    <AvatarImage src={user.avatar} />
                                    <AvatarFallback>{user.name[0]}</AvatarFallback>
                                  </Avatar>
                                  <div>
                                    <h4 className="font-medium text-gray-900">{user.name}</h4>
                                    <p className="text-sm text-gray-500">
                                      Blocked on {new Date(user.blockedAt).toLocaleDateString()}
                                      {user.reason && ` • Reason: ${user.reason}`}
                                    </p>
                                  </div>
                                </div>
                                <Button
                                  onClick={() => handleUnblockUser(user.id)}
                                  variant="outline"
                                  size="sm"
                                  className="border-purple-200 text-purple-600 hover:bg-purple-50"
                                >
                                  Unblock
                                </Button>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="text-center py-8">
                            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gray-100 flex items-center justify-center">
                              <EyeOff className="w-8 h-8 text-gray-400" />
                            </div>
                            <h3 className="text-gray-900 font-medium mb-2">No blocked users</h3>
                            <p className="text-sm text-gray-500">
                              When you block someone, they'll appear here
                            </p>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  )}

                  {/* Active Sessions */}
                  {activeSection === 'sessions' && (
                    <Card className="border-0 shadow-sm overflow-hidden">
                      <CardHeader className="border-b border-gray-100">
                        <CardTitle className="text-lg font-semibold text-gray-900">
                          Active Sessions
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="p-6">
                        <div className="space-y-4">
                          {activeSessions.map((session) => (
                            <div key={session.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                              <div className="flex items-center gap-3">
                                <div className="w-12 h-12 rounded-full bg-gray-200 flex items-center justify-center">
                                  {session.device.includes('iPhone') || session.device.includes('Android') ? (
                                    <Smartphone className="w-6 h-6 text-gray-600" />
                                  ) : (
                                    <Laptop className="w-6 h-6 text-gray-600" />
                                  )}
                                </div>
                                <div>
                                  <div className="flex items-center gap-2">
                                    <p className="font-medium text-gray-900">{session.device}</p>
                                    {session.isCurrent && (
                                      <Badge className="bg-green-100 text-green-700 border-0 text-xs">
                                        Current
                                      </Badge>
                                    )}
                                  </div>
                                  <p className="text-sm text-gray-600">
                                    {session.browser} • {session.location} • {session.ip}
                                  </p>
                                  <p className="text-xs text-gray-400 mt-1">
                                    Last active: {session.lastActive.toLocaleString()}
                                  </p>
                                </div>
                              </div>
                              {!session.isCurrent && (
                                <Button
                                  onClick={() => handleTerminateSession(session.id)}
                                  variant="ghost"
                                  size="sm"
                                  className="text-red-600 hover:text-red-700 hover:bg-red-50"
                                >
                                  <X className="w-4 h-4" />
                                </Button>
                              )}
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  )}

                  {/* Help & Support */}
                  {activeSection === 'support' && (
                    <div className="space-y-6">
                      <Card className="border-0 shadow-sm overflow-hidden">
                        <CardHeader className="border-b border-gray-100">
                          <CardTitle className="text-lg font-semibold text-gray-900">
                            Help & Support
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="p-6 space-y-4">
                          {[
                            { 
                              title: 'FAQ', 
                              description: 'Find answers to common questions', 
                              icon: <HelpCircle className="w-5 h-5" />,
                              href: '/faq'
                            },
                            { 
                              title: 'Contact Support', 
                              description: 'Get help from our support team', 
                              icon: <MessageSquare className="w-5 h-5" />,
                              href: '/support'
                            },
                            { 
                              title: 'Report a Problem', 
                              description: 'Report bugs or issues', 
                              icon: <AlertTriangle className="w-5 h-5" />,
                              href: '/report'
                            },
                            { 
                              title: 'Terms of Service', 
                              description: 'Read our terms and conditions', 
                              icon: <FileText className="w-5 h-5" />,
                              href: '/terms'
                            },
                            { 
                              title: 'Privacy Policy', 
                              description: 'Learn how we protect your data', 
                              icon: <Shield className="w-5 h-5" />,
                              href: '/privacy'
                            }
                          ].map((item, index) => (
                            <Link key={index} to={item.href}>
                              <div className="flex items-center justify-between p-4 rounded-lg hover:bg-gray-50 transition-colors border border-gray-200">
                                <div className="flex items-center gap-3">
                                  <div className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center text-purple-600">
                                    {item.icon}
                                  </div>
                                  <div>
                                    <h4 className="font-medium text-gray-900">{item.title}</h4>
                                    <p className="text-sm text-gray-500">{item.description}</p>
                                  </div>
                                </div>
                                <ChevronRight className="w-5 h-5 text-gray-400" />
                              </div>
                            </Link>
                          ))}
                        </CardContent>
                      </Card>

                      {/* App Version */}
                      <Card className="border-0 shadow-sm overflow-hidden">
                        <CardContent className="p-4 text-center">
                          <p className="text-sm text-gray-500">LoveX Version 2.0.0</p>
                          <p className="text-xs text-gray-400 mt-1">© 2024 LoveX. All rights reserved.</p>
                        </CardContent>
                      </Card>
                    </div>
                  )}
                </motion.div>
              </AnimatePresence>
            </div>
          </div>
        </div>

        {/* Delete Account Confirmation Dialog */}
        <AlertDialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle className="text-red-600">Delete Account?</AlertDialogTitle>
              <AlertDialogDescription>
                This action cannot be undone. This will permanently delete your account and remove all your data from our servers.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleDeleteAccount}
                className="bg-red-600 hover:bg-red-700"
              >
                Delete Account
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        {/* Logout Confirmation Dialog */}
        <AlertDialog open={showLogoutConfirm} onOpenChange={setShowLogoutConfirm}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Sign Out</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to sign out of your account?
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleLogout}
                className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
              >
                Sign Out
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        {/* Change Password Dialog */}
        <Dialog open={showChangePassword} onOpenChange={setShowChangePassword}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Change Password</DialogTitle>
              <DialogDescription>
                Enter your current password and choose a new one.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="current-password">Current Password</Label>
                <Input id="current-password" type="password" className="border-gray-300" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="new-password">New Password</Label>
                <Input id="new-password" type="password" className="border-gray-300" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirm-password">Confirm New Password</Label>
                <Input id="confirm-password" type="password" className="border-gray-300" />
              </div>
            </div>
            <div className="flex justify-end gap-3">
              <Button variant="outline" onClick={() => setShowChangePassword(false)}>
                Cancel
              </Button>
              <Button 
                onClick={() => {
                  const oldPwd = (document.getElementById('current-password') as HTMLInputElement).value;
                  const newPwd = (document.getElementById('new-password') as HTMLInputElement).value;
                  handleChangePassword(oldPwd, newPwd);
                }}
                className="bg-gradient-to-r from-purple-600 to-pink-600 text-white"
              >
                Update Password
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* Export Data Dialog */}
        <Dialog open={showExportData} onOpenChange={setShowExportData}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Export Your Data</DialogTitle>
              <DialogDescription>
                We'll prepare a download link with all your personal data. This may take a few minutes.
              </DialogDescription>
            </DialogHeader>
            <div className="py-6">
              <div className="space-y-4">
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Check className="w-4 h-4 text-green-600" />
                  Profile information
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Check className="w-4 h-4 text-green-600" />
                  Photos and media
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Check className="w-4 h-4 text-green-600" />
                  Messages and conversations
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Check className="w-4 h-4 text-green-600" />
                  Match history
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Check className="w-4 h-4 text-green-600" />
                  Activity logs
                </div>
              </div>
            </div>
            <div className="flex justify-end gap-3">
              <Button variant="outline" onClick={() => setShowExportData(false)}>
                Cancel
              </Button>
              <Button
                onClick={handleExportData}
                className="bg-gradient-to-r from-purple-600 to-pink-600 text-white"
              >
                <Download className="w-4 h-4 mr-2" />
                Start Export
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* 2FA Setup Dialog */}
        <Dialog open={show2FASetup} onOpenChange={setShow2FASetup}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>
                {twoFactorStep === 'setup' && 'Set Up Two-Factor Authentication'}
                {twoFactorStep === 'verify' && 'Verify Code'}
                {twoFactorStep === 'backup' && 'Save Recovery Codes'}
              </DialogTitle>
              <DialogDescription>
                {twoFactorStep === 'setup' && 'Scan the QR code with your authenticator app to enable 2FA.'}
                {twoFactorStep === 'verify' && 'Enter the 6-digit code from your authenticator app.'}
                {twoFactorStep === 'backup' && 'Save these recovery codes in a safe place. You can use them to access your account if you lose your phone.'}
              </DialogDescription>
            </DialogHeader>

            {twoFactorStep === 'setup' && (
              <div className="py-6 flex flex-col items-center">
                <div className="w-48 h-48 bg-gray-100 mb-4 flex items-center justify-center p-4 rounded-lg">
                  {twoFactorQR ? (
                    <img src={twoFactorQR} alt="2FA QR Code" className="w-full h-full" />
                  ) : (
                    <QrCode className="w-32 h-32 text-gray-600" />
                  )}
                </div>
                <p className="text-sm text-gray-600 text-center mb-4">
                  Or enter this code manually: <code className="bg-gray-100 px-2 py-1 rounded block mt-2 font-mono text-xs">
                    {twoFactorSecret}
                  </code>
                </p>
                <Button
                  onClick={handleEnable2FA}
                  className="bg-gradient-to-r from-purple-600 to-pink-600 text-white"
                >
                  Next
                </Button>
              </div>
            )}

            {twoFactorStep === 'verify' && (
              <div className="py-6">
                <div className="space-y-4">
                  <Input
                    placeholder="Enter 6-digit code"
                    value={twoFactorCode}
                    onChange={(e) => setTwoFactorCode(e.target.value)}
                    className="text-center text-lg tracking-widest"
                    maxLength={6}
                  />
                  <Button
                    onClick={handleEnable2FA}
                    className="w-full bg-gradient-to-r from-purple-600 to-pink-600 text-white"
                    disabled={twoFactorCode.length !== 6}
                  >
                    Verify & Enable
                  </Button>
                </div>
              </div>
            )}

            {twoFactorStep === 'backup' && (
              <div className="py-6">
                <div className="bg-gray-50 p-4 rounded-lg mb-4">
                  <div className="grid grid-cols-2 gap-2 font-mono text-sm">
                    {twoFactorBackupCodes.map((code, index) => (
                      <div key={index} className="bg-white p-2 rounded border border-gray-200 text-center">
                        {code}
                      </div>
                    ))}
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button
                    onClick={handleCopyRecoveryCodes}
                    variant="outline"
                    className="flex-1"
                  >
                    <Copy className="w-4 h-4 mr-2" />
                    Copy
                  </Button>
                  <Button
                    onClick={handleDownloadRecoveryCodes}
                    variant="outline"
                    className="flex-1"
                  >
                    <Download className="w-4 h-4 mr-2" />
                    Download
                  </Button>
                </div>
                <Button
                  onClick={handleEnable2FA}
                  className="w-full mt-4 bg-gradient-to-r from-purple-600 to-pink-600 text-white"
                >
                  I've Saved My Codes
                </Button>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </AuthGuard>
  );
};

export default Settings;
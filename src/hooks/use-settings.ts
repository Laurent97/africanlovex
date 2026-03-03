import { useState, useEffect } from 'react';
import { useAuth } from './use-auth';
import { useToast } from './use-toast';

interface Settings {
  notifications: {
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
  };
  privacy: {
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
  };
  preferences: {
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
  };
  account: {
    email: string;
    phone: string;
    twoFactor: boolean;
    emailVerified: boolean;
    phoneVerified: boolean;
    accountType: 'basic' | 'premium' | 'vip';
    memberSince: Date;
    lastLogin: Date;
  };
}

export const useSettings = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(true);
  const [settings, setSettings] = useState<Settings | null>(null);

  useEffect(() => {
    if (user) {
      loadSettings();
    }
  }, [user]);

  const loadSettings = async () => {
    try {
      setIsLoading(true);
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Mock data
      const mockSettings: Settings = {
        notifications: {
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
        },
        privacy: {
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
        },
        preferences: {
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
        },
        account: {
          email: user?.email || '',
          phone: '+250 788 123 456',
          twoFactor: false,
          emailVerified: true,
          phoneVerified: true,
          accountType: 'premium',
          memberSince: new Date('2024-01-15'),
          lastLogin: new Date()
        }
      };
      
      setSettings(mockSettings);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to load settings",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const updateSettings = async (updates: Partial<Settings>) => {
    if (!settings) return false;
    
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      setSettings({ ...settings, ...updates });
      
      toast({
        title: "Settings Updated",
        description: "Your preferences have been saved.",
        variant: "default",
      });
      
      return true;
    } catch (error) {
      toast({
        title: "Update Failed",
        description: "Failed to update settings. Please try again.",
        variant: "destructive",
      });
      return false;
    }
  };

  return {
    settings,
    isLoading,
    updateSettings,
    refresh: loadSettings
  };
};
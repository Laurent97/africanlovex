import { useState, useEffect } from 'react';
import { useAuth } from './use-auth';
import { useToast } from './use-toast';

interface Subscription {
  planId: string;
  planName: string;
  tier: string;
  status: 'active' | 'cancelled' | 'expired';
  startDate: Date;
  endDate: Date;
  autoRenew: boolean;
  paymentMethod: string;
  price: number;
  currency: string;
}

export const useSubscription = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [currentPlan, setCurrentPlan] = useState<string>('basic');
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [history, setHistory] = useState<Subscription[]>([]);

  useEffect(() => {
    if (user) {
      loadSubscription();
    }
  }, [user]);

  const loadSubscription = async () => {
    try {
      setIsLoading(true);
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Mock data - in real app, fetch from backend
      const mockSubscription: Subscription = {
        planId: 'basic',
        planName: 'Basic',
        tier: 'basic',
        status: 'active',
        startDate: new Date('2024-01-01'),
        endDate: new Date('2024-12-31'),
        autoRenew: true,
        paymentMethod: 'card',
        price: 0,
        currency: 'USD'
      };
      
      setSubscription(mockSubscription);
      setCurrentPlan(mockSubscription.planId);
    } catch (error) {
      console.error('Failed to load subscription:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const updateSubscription = async (updates: any) => {
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      const newSubscription: Subscription = {
        planId: updates.planId,
        planName: getPlanName(updates.planId),
        tier: updates.planId,
        status: 'active',
        startDate: new Date(),
        endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        autoRenew: true,
        paymentMethod: updates.paymentMethod,
        price: updates.price,
        currency: 'USD'
      };
      
      setSubscription(newSubscription);
      setCurrentPlan(updates.planId);
      
      // Add to history
      setHistory(prev => [newSubscription, ...prev]);
      
      toast({
        title: "Subscription Updated",
        description: `You are now on the ${getPlanName(updates.planId)} plan.`,
        variant: "default",
      });
      
      return true;
    } catch (error) {
      toast({
        title: "Update Failed",
        description: "Failed to update subscription. Please try again.",
        variant: "destructive",
      });
      return false;
    }
  };

  const cancelSubscription = async () => {
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      if (subscription) {
        setSubscription({
          ...subscription,
          status: 'cancelled',
          autoRenew: false
        });
      }
      
      toast({
        title: "Subscription Cancelled",
        description: "Your subscription will end at the current billing period.",
        variant: "default",
      });
      
      return true;
    } catch (error) {
      toast({
        title: "Cancellation Failed",
        description: "Failed to cancel subscription. Please try again.",
        variant: "destructive",
      });
      return false;
    }
  };

  const getPlanName = (planId: string) => {
    const plans: Record<string, string> = {
      basic: 'Basic',
      love: 'Love',
      premium: 'Premium',
      platinum: 'Platinum',
      diamond: 'Diamond'
    };
    return plans[planId] || planId;
  };

  return {
    currentPlan,
    subscription,
    isLoading,
    history,
    updateSubscription,
    cancelSubscription,
    refresh: loadSubscription
  };
};
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link, useNavigate } from 'react-router-dom';
import { 
  Check, 
  Crown, 
  Star, 
  Diamond, 
  Heart, 
  Shield, 
  Zap, 
  Gift, 
  MessageCircle, 
  Users, 
  Eye, 
  Sparkles,
  ArrowRight,
  CreditCard,
  Smartphone,
  Globe,
  ChevronLeft,
  ChevronRight,
  X,
  AlertCircle,
  Loader2,
  Info,
  Tag,
  Clock,
  TrendingUp,
  Award,
  Rocket,
  Sun,
  Moon,
  Cloud,
  Feather,
  Droplet,
  Leaf,
  Smile,
  Coffee,
  Wine,
  ShoppingBag,
  Wallet,
  TrendingUp as TrendingUpIcon,
  Plus,
  Minus,
  HeartHandshake,
  Sparkle,
  PartyPopper,
  Bot,
  Brain,
  ZapIcon,
  Infinity,
  MapPin,
  Calendar,
  Briefcase,
  Music,
  Camera,
  Gamepad2,
  Book,
  Plane,
  Home,
  Gem,
  Award as AwardIcon
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
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
import { AuthGuard } from '@/components/auth/AuthGuard';
import { useAuth } from '@/hooks/use-auth';
import { useToast } from '@/hooks/use-toast';
import { useSubscription } from '@/hooks/use-subscription';

interface Plan {
  id: string;
  name: string;
  tier: 'basic' | 'love' | 'premium' | 'platinum' | 'diamond';
  price: number;
  yearlyPrice: number;
  period: string;
  currency: string;
  features: {
    name: string;
    included: boolean;
    limit?: number;
    tooltip?: string;
  }[];
  popular?: boolean;
  icon: React.ReactNode;
  color: string;
  gradient: string;
  badge?: string;
  savings?: number;
  recommended?: boolean;
}

interface FeatureComparison {
  category: string;
  features: {
    name: string;
    description: string;
    values: Record<string, string | number | boolean>;
  }[];
}

const VIP = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { currentPlan, updateSubscription, isLoading } = useSubscription();
  
  const [selectedPlan, setSelectedPlan] = useState<string>('premium');
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('monthly');
  const [showComparison, setShowComparison] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<string>('card');
  const [isProcessing, setIsProcessing] = useState(false);
  const [promoCode, setPromoCode] = useState('');
  const [promoApplied, setPromoApplied] = useState(false);
  const [promoDiscount, setPromoDiscount] = useState(0);
  const [activeTab, setActiveTab] = useState('plans');

  const plans: Plan[] = [
    {
      id: 'basic',
      name: 'Basic',
      tier: 'basic',
      price: 0,
      yearlyPrice: 0,
      period: 'month',
      currency: 'USD',
      features: [
        { name: 'Create profile', included: true },
        { name: 'Upload up to 3 photos', included: true, limit: 3 },
        { name: 'Basic matching', included: true },
        { name: 'Send 10 likes per day', included: true, limit: 10 },
        { name: 'Standard support', included: true },
        { name: 'See who liked you', included: false },
        { name: 'Super Likes', included: false, limit: 0 },
        { name: 'Profile boost', included: false },
        { name: 'Read receipts', included: false },
        { name: 'Ad-free experience', included: false }
      ],
      icon: <Heart className="w-6 h-6" />,
      color: '#6B7280',
      gradient: 'linear-gradient(135deg, #9CA3AF 0%, #6B7280 100%)'
    },
    {
      id: 'love',
      name: 'Love',
      tier: 'love',
      price: 4.99,
      yearlyPrice: 47.99,
      period: 'month',
      currency: 'USD',
      popular: true,
      features: [
        { name: 'Create profile', included: true },
        { name: 'Upload up to 6 photos', included: true, limit: 6 },
        { name: 'Advanced matching', included: true },
        { name: 'Unlimited likes', included: true },
        { name: 'See who liked you', included: true },
        { name: '5 Super Likes per month', included: true, limit: 5 },
        { name: 'Priority support', included: true },
        { name: 'Profile boost', included: false },
        { name: 'Read receipts', included: false },
        { name: 'Ad-free experience', included: false },
        { name: 'Love badge on profile', included: true, tooltip: 'Special badge showing your Love tier status' }
      ],
      icon: <Star className="w-6 h-6" />,
      color: '#EC4899',
      gradient: 'linear-gradient(135deg, #EC4899 0%, #8B5CF6 100%)',
      savings: 20,
      badge: 'Most Popular'
    },
    {
      id: 'premium',
      name: 'Premium',
      tier: 'premium',
      price: 9.99,
      yearlyPrice: 95.99,
      period: 'month',
      currency: 'USD',
      features: [
        { name: 'Create profile', included: true },
        { name: 'Upload up to 6 photos', included: true, limit: 6 },
        { name: 'Advanced matching', included: true },
        { name: 'Unlimited likes', included: true },
        { name: 'See who liked you', included: true },
        { name: '10 Super Likes per month', included: true, limit: 10 },
        { name: 'Priority support', included: true },
        { name: 'Profile visibility boost', included: true, tooltip: 'Your profile gets shown to more people' },
        { name: 'Read receipts', included: true },
        { name: 'Unlimited rewinds', included: true },
        { name: 'Travel mode', included: true, tooltip: 'Match with people in different cities' },
        { name: 'Ad-free experience', included: true },
        { name: 'Premium badge on profile', included: true }
      ],
      icon: <Crown className="w-6 h-6" />,
      color: '#8B5CF6',
      gradient: 'linear-gradient(135deg, #8B5CF6 0%, #EC4899 100%)',
      savings: 20,
      recommended: true
    },
    {
      id: 'platinum',
      name: 'Platinum',
      tier: 'platinum',
      price: 19.99,
      yearlyPrice: 191.99,
      period: 'month',
      currency: 'USD',
      features: [
        { name: 'Create profile', included: true },
        { name: 'Upload up to 6 photos', included: true, limit: 6 },
        { name: 'Advanced matching', included: true },
        { name: 'Unlimited likes', included: true },
        { name: 'See who liked you', included: true },
        { name: '20 Super Likes per month', included: true, limit: 20 },
        { name: 'Priority support', included: true },
        { name: 'Profile highlighted weekly', included: true, tooltip: 'Your profile gets highlighted in search results' },
        { name: 'Read receipts', included: true },
        { name: 'Unlimited rewinds', included: true },
        { name: 'Travel mode', included: true },
        { name: 'Message before match', included: true, tooltip: 'Send a message when you Super Like' },
        { name: 'Advanced privacy controls', included: true },
        { name: 'Video calls', included: true },
        { name: '10% gift discounts', included: true },
        { name: 'Ad-free experience', included: true },
        { name: 'Platinum badge on profile', included: true }
      ],
      icon: <Gem className="w-6 h-6" />,
      color: '#06B6D4',
      gradient: 'linear-gradient(135deg, #06B6D4 0%, #3B82F6 100%)',
      savings: 20
    },
    {
      id: 'diamond',
      name: 'Diamond',
      tier: 'diamond',
      price: 49.99,
      yearlyPrice: 479.99,
      period: 'month',
      currency: 'USD',
      features: [
        { name: 'Create profile', included: true },
        { name: 'Upload up to 6 photos', included: true, limit: 6 },
        { name: 'Advanced matching', included: true },
        { name: 'Unlimited likes', included: true },
        { name: 'See who liked you', included: true },
        { name: 'Unlimited Super Likes', included: true },
        { name: 'Priority support', included: true },
        { name: 'Profile highlighted weekly', included: true },
        { name: 'Read receipts', included: true },
        { name: 'Unlimited rewinds', included: true },
        { name: 'Travel mode', included: true },
        { name: 'Message before match', included: true },
        { name: 'Advanced privacy controls', included: true },
        { name: 'Video calls', included: true },
        { name: '20% gift discounts', included: true },
        { name: 'Exclusive Diamond badge', included: true, tooltip: 'Premium badge that stands out' },
        { name: 'Top profile placement', included: true, tooltip: 'Your profile appears at the top of searches' },
        { name: 'Personal matchmaker', included: true, tooltip: 'Get personalized match recommendations' },
        { name: 'Exclusive events access', included: true },
        { name: 'Lifetime photo storage', included: true },
        { name: 'Concierge support', included: true },
        { name: 'Custom profile themes', included: true },
        { name: 'Ad-free experience', included: true }
      ],
      icon: <Sparkles className="w-6 h-6" />,
      color: '#F59E0B',
      gradient: 'linear-gradient(135deg, #F59E0B 0%, #F97316 100%)',
      savings: 20
    }
  ];

  const featureComparison: FeatureComparison[] = [
    {
      category: 'Profile Features',
      features: [
        { name: 'Photos', description: 'Number of photos you can upload', values: { basic: 3, love: 6, premium: 6, platinum: 6, diamond: 6 } },
        { name: 'Profile verification', description: 'Get verified badge', values: { basic: false, love: true, premium: true, platinum: true, diamond: true } },
        { name: 'Profile badge', description: 'Special tier badge on profile', values: { basic: false, love: 'Love', premium: 'Premium', platinum: 'Platinum', diamond: 'Diamond' } }
      ]
    },
    {
      category: 'Matching Features',
      features: [
        { name: 'Daily likes', description: 'Number of likes per day', values: { basic: 10, love: '∞', premium: '∞', platinum: '∞', diamond: '∞' } },
        { name: 'Super Likes', description: 'Monthly super likes', values: { basic: 0, love: 5, premium: 10, platinum: 20, diamond: '∞' } },
        { name: 'See who likes you', description: 'View profiles that liked you', values: { basic: false, love: true, premium: true, platinum: true, diamond: true } },
        { name: 'Read receipts', description: 'See when messages are read', values: { basic: false, love: false, premium: true, platinum: true, diamond: true } },
        { name: 'Message before match', description: 'Send message with Super Like', values: { basic: false, love: false, premium: false, platinum: true, diamond: true } }
      ]
    },
    {
      category: 'Boost Features',
      features: [
        { name: 'Profile boost', description: 'Get more visibility', values: { basic: false, love: false, premium: 'Weekly', platinum: 'Weekly', diamond: 'Weekly' } },
        { name: 'Top placement', description: 'Appear at top of searches', values: { basic: false, love: false, premium: false, platinum: false, diamond: true } }
      ]
    },
    {
      category: 'Communication',
      features: [
        { name: 'Video calls', description: 'Video chat with matches', values: { basic: false, love: false, premium: false, platinum: true, diamond: true } },
        { name: 'Travel mode', description: 'Match in other cities', values: { basic: false, love: false, premium: true, platinum: true, diamond: true } }
      ]
    },
    {
      category: 'Perks',
      features: [
        { name: 'Gift discounts', description: 'Discount on virtual gifts', values: { basic: 0, love: 0, premium: 0, platinum: '10%', diamond: '20%' } },
        { name: 'Ad-free', description: 'No advertisements', values: { basic: false, love: false, premium: true, platinum: true, diamond: true } },
        { name: 'Support priority', description: 'Support response time', values: { basic: 'Standard', love: 'Priority', premium: 'Priority', platinum: 'Priority', diamond: 'Concierge' } }
      ]
    }
  ];

  const paymentMethods = [
    { id: 'card', name: 'Credit Card', icon: <CreditCard className="w-5 h-5" />, description: 'Visa, Mastercard, Amex' },
    { id: 'mtn', name: 'MTN MoMo', icon: <Smartphone className="w-5 h-5" />, description: 'Mobile Money' },
    { id: 'airtel', name: 'Airtel Money', icon: <Smartphone className="w-5 h-5" />, description: 'Airtel Mobile Money' },
    { id: 'mpesa', name: 'M-Pesa', icon: <Smartphone className="w-5 h-5" />, description: 'Safaricom M-Pesa' },
    { id: 'crypto', name: 'Cryptocurrency', icon: <Wallet className="w-5 h-5" />, description: 'BTC, ETH, USDT' }
  ];

  const getYearlyPrice = (monthlyPrice: number) => {
    return Math.round(monthlyPrice * 12 * 0.8 * 100) / 100; // 20% discount
  };

  const handleSubscribe = (planId: string) => {
    setSelectedPlan(planId);
    setShowPaymentModal(true);
  };

  const handlePayment = async () => {
    setIsProcessing(true);
    
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      const finalPrice = getDisplayPrice(plans.find(p => p.id === selectedPlan)!);
      
      await updateSubscription({
        planId: selectedPlan,
        billingCycle,
        price: finalPrice,
        paymentMethod: selectedPaymentMethod
      });

      toast({
        title: "Subscription Activated! 🎉",
        description: `You are now on the ${plans.find(p => p.id === selectedPlan)?.name} plan.`,
        variant: "default",
      });

      setShowPaymentModal(false);
      
      // Redirect to profile after successful subscription
      setTimeout(() => {
        navigate('/profile');
      }, 2000);

    } catch (error) {
      toast({
        title: "Subscription Failed",
        description: "There was an error processing your payment. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handlePromoCode = () => {
    if (promoCode.toLowerCase() === 'lovex2024') {
      setPromoApplied(true);
      setPromoDiscount(15);
      toast({
        title: "Promo Code Applied!",
        description: "You received 15% off your subscription!",
        variant: "default",
      });
    } else {
      toast({
        title: "Invalid Promo Code",
        description: "Please check and try again.",
        variant: "destructive",
      });
    }
  };

  const getDisplayPrice = (plan: Plan) => {
    let price = billingCycle === 'yearly' ? plan.yearlyPrice : plan.price;
    
    if (promoApplied) {
      price = price * (1 - promoDiscount / 100);
    }
    
    return Math.round(price * 100) / 100;
  };

  const getPeriodDisplay = () => {
    return billingCycle === 'yearly' ? 'year' : 'month';
  };

  const getSavingsAmount = (plan: Plan) => {
    if (billingCycle === 'yearly') {
      const monthlyTotal = plan.price * 12;
      const yearlyTotal = plan.yearlyPrice;
      return Math.round((monthlyTotal - yearlyTotal) * 100) / 100;
    }
    return 0;
  };

  const getFeatureValue = (value: any) => {
    if (typeof value === 'boolean') {
      return value ? (
        <div className="w-6 h-6 rounded-full bg-green-100 flex items-center justify-center mx-auto">
          <Check className="w-4 h-4 text-green-600" />
        </div>
      ) : (
        <div className="w-6 h-6 rounded-full bg-gray-100 flex items-center justify-center mx-auto">
          <span className="text-gray-400 text-xs">—</span>
        </div>
      );
    }
    return <span className="font-medium text-gray-900">{value}</span>;
  };

  if (!user) return null;

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
                  <h1 className="text-xl font-bold text-gray-900">VIP Membership</h1>
                  <p className="text-sm text-gray-500">Unlock premium features for better matches</p>
                </div>
              </div>

              <div className="flex items-center gap-4">
                {currentPlan !== 'basic' && (
                  <Badge className="px-3 py-1 bg-gradient-to-r from-purple-600 to-pink-600 text-white border-0">
                    Current: {currentPlan}
                  </Badge>
                )}
                <Link to="/profile">
                  <Button variant="outline" size="sm" className="border-gray-300">
                    Back to Profile
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </div>

        <div className="container mx-auto px-4 py-8">
          {/* Hero Section */}
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.5 }}
            className="text-center mb-12"
          >
            <Badge className="mb-4 px-4 py-1 bg-gradient-to-r from-purple-600 to-pink-600 text-white border-0">
              <Crown className="w-4 h-4 mr-2" />
              Upgrade Your Experience
            </Badge>
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Choose Your <span className="bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">Perfect Plan</span>
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Get more matches, better visibility, and exclusive features with our premium memberships
            </p>
          </motion.div>

          {/* Tabs */}
          <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-8">
            <TabsList className="w-full max-w-md mx-auto grid grid-cols-2">
              <TabsTrigger value="plans">Subscription Plans</TabsTrigger>
              <TabsTrigger value="compare">Compare Features</TabsTrigger>
            </TabsList>

            {/* Plans Tab */}
            <TabsContent value="plans" className="mt-0">
              {/* Billing Toggle */}
              <motion.div
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ duration: 0.5, delay: 0.1 }}
                className="flex justify-center mb-8"
              >
              <div className="bg-white rounded-full p-1 shadow-lg border border-gray-200">
                <div className="flex rounded-full overflow-hidden">
                  <button
                    onClick={() => setBillingCycle('monthly')}
                    className={`px-6 py-2 rounded-full text-sm font-medium transition-all ${
                      billingCycle === 'monthly'
                        ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-md'
                        : 'text-gray-600 hover:text-gray-900'
                    }`}
                  >
                    Monthly
                  </button>
                  <button
                    onClick={() => setBillingCycle('yearly')}
                    className={`px-6 py-2 rounded-full text-sm font-medium transition-all flex items-center gap-2 ${
                      billingCycle === 'yearly'
                        ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-md'
                        : 'text-gray-600 hover:text-gray-900'
                    }`}
                  >
                    Yearly
                    <Badge className="px-2 py-0.5 bg-green-500 text-white border-0 text-xs">
                      Save 20%
                    </Badge>
                  </button>
                </div>
              </div>
            </motion.div>

            {/* Promo Code */}
            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="flex justify-center mb-8"
            >
              <div className="flex gap-2 max-w-md w-full">
                <input
                  type="text"
                  placeholder="Enter promo code"
                  value={promoCode}
                  onChange={(e) => setPromoCode(e.target.value)}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                  disabled={promoApplied}
                />
                <Button
                  onClick={handlePromoCode}
                  disabled={promoApplied || !promoCode}
                  variant="outline"
                  className="border-gray-300"
                >
                  {promoApplied ? 'Applied' : 'Apply'}
                </Button>
              </div>
            </motion.div>

            {/* Plans Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6 mb-12">
              {plans.map((plan, index) => (
                <motion.div
                  key={plan.id}
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ duration: 0.5, delay: 0.3 + index * 0.1 }}
                  whileHover={{ y: -10 }}
                  className="relative"
                >
                  <Card className={`border-0 shadow-xl overflow-hidden h-full transition-all duration-300 hover:shadow-2xl ${
                    plan.popular ? 'ring-2 ring-purple-500' : ''
                  } ${plan.recommended ? 'ring-2 ring-yellow-500' : ''}`}>
                    {/* Badges */}
                    <div className="absolute top-4 left-4 flex flex-col gap-2">
                      {plan.popular && (
                        <Badge className="px-3 py-1 bg-gradient-to-r from-purple-600 to-pink-600 text-white border-0">
                          🔥 Most Popular
                        </Badge>
                      )}
                      {plan.recommended && (
                        <Badge className="px-3 py-1 bg-gradient-to-r from-yellow-500 to-orange-500 text-white border-0">
                          ⭐ Recommended
                        </Badge>
                      )}
                    </div>

                    {/* Savings Badge */}
                    {billingCycle === 'yearly' && plan.price > 0 && (
                      <div className="absolute top-4 right-4">
                        <Badge className="px-3 py-1 bg-green-500 text-white border-0">
                          Save ${getSavingsAmount(plan)}
                        </Badge>
                      </div>
                    )}

                    <CardHeader className="text-center pt-12 pb-4">
                      {/* Plan Icon */}
                      <div className="w-20 h-20 mx-auto mb-4 rounded-full flex items-center justify-center text-white shadow-lg"
                           style={{ background: plan.gradient }}>
                        {plan.icon}
                      </div>

                      {/* Plan Name */}
                      <CardTitle className="text-2xl font-bold mb-2 text-gray-900">
                        {plan.name}
                      </CardTitle>

                      {/* Price */}
                      <div className="text-center">
                        {plan.price === 0 ? (
                          <div className="text-3xl font-bold text-green-600">Free</div>
                        ) : (
                          <div>
                            <div className="text-4xl font-bold" style={{ color: plan.color }}>
                              ${getDisplayPrice(plan)}
                            </div>
                            <div className="text-sm text-gray-500 mt-1">
                              per {getPeriodDisplay()}
                            </div>
                            {billingCycle === 'yearly' && (
                              <div className="text-xs text-green-600 font-medium mt-1">
                                ${Math.round(plan.price * 100) / 100}/month
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </CardHeader>

                    <CardContent className="pt-0">
                      {/* Features Preview */}
                      <div className="space-y-3 mb-6">
                        {plan.features.slice(0, 6).map((feature, featureIndex) => (
                          <TooltipProvider key={featureIndex}>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <div className="flex items-center gap-2">
                                  <div className={`w-5 h-5 rounded-full flex items-center justify-center ${
                                    feature.included ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-400'
                                  }`}>
                                    {feature.included ? (
                                      <Check className="w-3 h-3" />
                                    ) : (
                                      <span className="text-xs">×</span>
                                    )}
                                  </div>
                                  <span className={`text-sm ${feature.included ? 'text-gray-700' : 'text-gray-400'}`}>
                                    {feature.name}
                                    {feature.limit && ` (${feature.limit})`}
                                  </span>
                                </div>
                              </TooltipTrigger>
                              {feature.tooltip && (
                                <TooltipContent>
                                  <p className="text-sm">{feature.tooltip}</p>
                                </TooltipContent>
                              )}
                            </Tooltip>
                          </TooltipProvider>
                        ))}
                        {plan.features.length > 6 && (
                          <p className="text-xs text-gray-500 text-center">
                            +{plan.features.length - 6} more features
                          </p>
                        )}
                      </div>

                      {/* CTA Button */}
                      <Button
                        onClick={() => handleSubscribe(plan.id)}
                        disabled={currentPlan === plan.id}
                        className={`w-full rounded-full transition-all ${
                          currentPlan === plan.id ? 'opacity-50 cursor-not-allowed' : ''
                        }`}
                        style={{
                          ...(plan.price === 0 ? {
                            backgroundColor: '#F3F4F6',
                            color: '#374151',
                            border: '2px solid #E5E7EB'
                          } : {
                            background: plan.gradient,
                            color: 'white',
                            border: 'none'
                          })
                        }}
                      >
                        {currentPlan === plan.id ? (
                          'Current Plan'
                        ) : plan.price === 0 ? (
                          'Free Forever'
                        ) : (
                          <>
                            Get Started
                            <ArrowRight className="w-4 h-4 ml-2" />
                          </>
                        )}
                      </Button>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>

            {/* Trust Badges */}
            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.8 }}
              className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-3xl mx-auto"
            >
              {[
                { icon: <Shield className="w-5 h-5" />, text: 'Secure Payment' },
                { icon: <Clock className="w-5 h-5" />, text: 'Cancel Anytime' },
                { icon: <TrendingUp className="w-5 h-5" />, text: 'Better Matches' },
                { icon: <Users className="w-5 h-5" />, text: '10K+ Members' }
              ].map((item, index) => (
                <div key={index} className="flex items-center gap-2 text-gray-600">
                  <div className="text-purple-600">{item.icon}</div>
                  <span className="text-sm">{item.text}</span>
                </div>
              ))}
            </motion.div>
          </TabsContent>

          {/* Compare Tab */}
          <TabsContent value="compare" className="mt-0">
            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ duration: 0.5 }}
            >
              <Card className="border-0 shadow-lg overflow-hidden">
                <CardHeader>
                  <CardTitle className="text-2xl text-center text-gray-900">
                    Detailed Feature Comparison
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b border-gray-200">
                          <th className="text-left p-4 font-semibold text-gray-700">Feature</th>
                          {plans.map((plan) => (
                            <th key={plan.id} className="text-center p-4 min-w-[120px]">
                              <div className="flex flex-col items-center">
                                <div className="w-10 h-10 rounded-full flex items-center justify-center mb-2"
                                     style={{ background: plan.gradient, color: 'white' }}>
                                  {plan.icon}
                                </div>
                                <span className="font-semibold text-gray-900">{plan.name}</span>
                              </div>
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {featureComparison.map((category, categoryIndex) => (
                          <React.Fragment key={categoryIndex}>
                            <tr className="bg-gray-50">
                              <td colSpan={6} className="p-4 font-semibold text-gray-900">
                                {category.category}
                              </td>
                            </tr>
                            {category.features.map((feature, featureIndex) => (
                              <tr key={featureIndex} className="border-b border-gray-100">
                                <td className="p-4">
                                  <div className="flex items-start gap-2">
                                    <span className="font-medium text-gray-700">{feature.name}</span>
                                    <TooltipProvider>
                                      <Tooltip>
                                        <TooltipTrigger>
                                          <Info className="w-4 h-4 text-gray-400" />
                                        </TooltipTrigger>
                                        <TooltipContent>
                                          <p className="text-sm">{feature.description}</p>
                                        </TooltipContent>
                                      </Tooltip>
                                    </TooltipProvider>
                                  </div>
                                </td>
                                {plans.map((plan) => (
                                  <td key={plan.id} className="text-center p-4">
                                    {getFeatureValue(feature.values[plan.tier])}
                                  </td>
                                ))}
                              </tr>
                            ))}
                          </React.Fragment>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </TabsContent>
          </Tabs>

          {/* FAQ Section */}
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.9 }}
            className="mt-12"
          >
            <h2 className="text-2xl font-bold text-center text-gray-900 mb-8">
              Frequently Asked Questions
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto">
              {[
                {
                  q: 'Can I change my plan anytime?',
                  a: 'Yes! You can upgrade, downgrade, or cancel your subscription at any time. Changes take effect immediately.'
                },
                {
                  q: 'Is there a free trial?',
                  a: 'Premium plans come with a 7-day free trial for new users. No credit card required to start.'
                },
                {
                  q: 'What payment methods are accepted?',
                  a: 'We accept MTN MoMo, Airtel Money, M-Pesa, all major credit cards, and cryptocurrency (BTC, ETH, USDT).'
                },
                {
                  q: 'Can I cancel anytime?',
                  a: 'Absolutely! No cancellation fees or hidden charges. Your subscription will end at the next billing cycle.'
                },
                {
                  q: 'Do you offer refunds?',
                  a: 'We offer a 30-day money-back guarantee if you\'re not satisfied with your premium membership.'
                },
                {
                  q: 'Is my payment information secure?',
                  a: 'Yes! We use industry-standard encryption and never store your full payment details on our servers.'
                }
              ].map((faq, index) => (
                <motion.div
                  key={index}
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ duration: 0.5, delay: 1 + index * 0.1 }}
                  className="bg-white rounded-xl p-6 shadow-sm border border-gray-100"
                >
                  <h3 className="font-semibold text-gray-900 mb-2">{faq.q}</h3>
                  <p className="text-sm text-gray-600">{faq.a}</p>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>

        {/* Payment Modal */}
        <AnimatePresence>
          {showPaymentModal && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
              onClick={() => setShowPaymentModal(false)}
            >
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                className="bg-white rounded-xl p-6 max-w-md mx-4 w-full"
                onClick={e => e.stopPropagation()}
              >
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-900">Complete Subscription</h3>
                  <Button
                    onClick={() => setShowPaymentModal(false)}
                    variant="ghost"
                    size="sm"
                    className="h-8 w-8 p-0"
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>

                {selectedPlan && (
                  <div className="mb-6">
                    <div className="bg-gradient-to-r from-purple-50 to-pink-50 p-4 rounded-lg">
                      <div className="flex items-center gap-3 mb-3">
                        <div className="w-12 h-12 rounded-full flex items-center justify-center text-white"
                             style={{ background: plans.find(p => p.id === selectedPlan)?.gradient }}>
                          {plans.find(p => p.id === selectedPlan)?.icon}
                        </div>
                        <div>
                          <h4 className="font-semibold text-gray-900">
                            {plans.find(p => p.id === selectedPlan)?.name} Plan
                          </h4>
                          <p className="text-sm text-gray-500">
                            {billingCycle === 'yearly' ? 'Yearly' : 'Monthly'} billing
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-gray-600">Total:</span>
                        <div className="text-right">
                          <div className="text-2xl font-bold text-gray-900">
                            ${getDisplayPrice(plans.find(p => p.id === selectedPlan)!)}
                          </div>
                          {promoApplied && (
                            <div className="text-xs text-green-600">
                              {promoDiscount}% discount applied
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                <div className="space-y-4 mb-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Payment Method
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      {paymentMethods.map((method) => (
                        <button
                          key={method.id}
                          onClick={() => setSelectedPaymentMethod(method.id)}
                          className={`p-3 rounded-lg border transition-all ${
                            selectedPaymentMethod === method.id
                              ? 'border-purple-500 bg-purple-50'
                              : 'border-gray-200 hover:border-gray-300'
                          }`}
                        >
                          <div className="flex flex-col items-center text-center">
                            <div className={`mb-2 ${
                              selectedPaymentMethod === method.id ? 'text-purple-600' : 'text-gray-600'
                            }`}>
                              {method.icon}
                            </div>
                            <span className="text-xs font-medium text-gray-900">{method.name}</span>
                            <span className="text-xs text-gray-500">{method.description}</span>
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="flex gap-3">
                  <Button
                    onClick={() => setShowPaymentModal(false)}
                    variant="outline"
                    className="flex-1 border-gray-300"
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={handlePayment}
                    disabled={isProcessing}
                    className="flex-1 bg-gradient-to-r from-purple-600 to-pink-600 text-white hover:from-purple-700 hover:to-pink-700"
                  >
                    {isProcessing ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Processing...
                      </>
                    ) : (
                      'Confirm Payment'
                    )}
                  </Button>
                </div>

                <p className="text-xs text-gray-500 text-center mt-4">
                  By confirming, you agree to our Terms of Service and Privacy Policy.
                  Your subscription will automatically renew unless canceled.
                </p>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </AuthGuard>
  );
};

export default VIP;
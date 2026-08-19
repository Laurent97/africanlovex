import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link, useNavigate } from 'react-router-dom';
import { 
  Coins, 
  CreditCard, 
  Smartphone, 
  TrendingUp, 
  History, 
  Gift, 
  Crown, 
  Star, 
  Diamond,
  ChevronDown,
  Check,
  AlertTriangle,
  Info,
  ArrowRight,
  RefreshCw,
  Download,
  Upload,
  Wallet as WalletIcon,
  PiggyBank,
  Target,
  Zap,
  Heart,
  ChevronLeft,
  X,
  Loader2,
  Plus,
  Send,
  Minus,
  Copy,
  ExternalLink,
  QrCode,
  Banknote,
  Bitcoin,
  DollarSign,
  Euro,
  PoundSterling,
  Shield,
  Clock,
  Calendar,
  Filter,
  Search,
  Eye,
  EyeOff,
  Lock,
  Unlock,
  Award,
  Sparkles,
  Gem,
  Rocket,
  Building2,
  Flame,
  Coffee,
  ShoppingBag,
  CreditCard as CardIcon,
  Landmark,
  WalletCards,
  BadgeCheck,
  AlertCircle,
  CircleDollarSign
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
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
import { supabase } from '@/lib/supabase';
import { paymentsApi } from '@/api/payments';

interface CoinPackage {
  id: string;
  name: string;
  coins: number;
  price: number;
  currency: string;
  bonus: number;
  popular?: boolean;
  bestValue?: boolean;
  icon: React.ReactNode;
  description: string;
  gradient: string;
  tag?: string;
}

interface Transaction {
  id: string;
  type: 'purchase' | 'gift_sent' | 'gift_received' | 'subscription' | 'refund' | 'bonus' | 'withdrawal';
  amount: number;
  coins: number;
  description: string;
  timestamp: Date;
  status: 'completed' | 'pending' | 'failed' | 'processing';
  paymentMethod?: string;
  recipient?: string;
  currency?: string;
  reference?: string;
  fee?: number;
}

interface PaymentMethod {
  id: string;
  type: 'card' | 'mobile_money' | 'crypto' | 'bank';
  name: string;
  icon: React.ReactNode;
  description: string;
  color: string;
  enabled: boolean;
  fees?: string;
  minAmount?: number;
  maxAmount?: number;
  networks?: string[];
}

interface Bank {
  code: string;
  name: string;
}

const Wallet = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [userBalance, setUserBalance] = useState(0);
  const [selectedPackage, setSelectedPackage] = useState<string | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<string>('card');
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showWithdrawModal, setShowWithdrawModal] = useState(false);
  const [showDepositModal, setShowDepositModal] = useState(false);
  const [showTransferModal, setShowTransferModal] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [activeTab, setActiveTab] = useState('buy');
  const [filterType, setFilterType] = useState<string>('all');
  const [dateRange, setDateRange] = useState<'today' | 'week' | 'month' | 'year' | 'all'>('month');
  const [searchQuery, setSearchQuery] = useState('');
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [withdrawMethod, setWithdrawMethod] = useState('bank');
  const [withdrawPhone, setWithdrawPhone] = useState('');
  const [withdrawNetwork, setWithdrawNetwork] = useState('');
  const [selectedBank, setSelectedBank] = useState('');
  const [accountNumber, setAccountNumber] = useState('');
  const [accountName, setAccountName] = useState('');
  const [banks, setBanks] = useState<Bank[]>([]);
  const [verifyingAccount, setVerifyingAccount] = useState(false);
  const [showBalance, setShowBalance] = useState(true);
  const [selectedCurrency, setSelectedCurrency] = useState('USD');
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loadingTransactions, setLoadingTransactions] = useState(false);
  const [giftExchangeStats, setGiftExchangeStats] = useState({
    totalExchanged: 0,
    coinsFromGifts: 0,
    giftsExchanged: 0,
    thisMonth: 0
  });

  // Load user balance and transactions on mount
  const loadGiftExchangeStats = async () => {
    try {
      const { data, error } = await supabase
        .from('gift_exchange_history')
        .select('*')
        .eq('user_id', user?.id);

      if (error) throw error;

      const stats = {
        totalExchanged: data?.reduce((sum, item) => sum + item.coins_received, 0) || 0,
        coinsFromGifts: data?.reduce((sum, item) => sum + item.coins_received, 0) || 0,
        giftsExchanged: data?.length || 0,
        thisMonth: data?.filter(item => {
          const itemDate = new Date(item.exchanged_at);
          const now = new Date();
          return itemDate.getMonth() === now.getMonth() && 
                 itemDate.getFullYear() === now.getFullYear();
        }).reduce((sum, item) => sum + item.coins_received, 0) || 0
      };

      setGiftExchangeStats(stats);
    } catch (error) {
      console.error('Error loading gift exchange stats:', error);
    }
  };

  const loadUserBalance = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('coins_balance')
        .eq('id', user?.id)
        .single();

      if (error) throw error;
      setUserBalance(data.coins_balance || 0);
    } catch (error) {
      console.error('Error loading balance:', error);
    }
  };

  const loadTransactions = async () => {
    if (!user) return;
    
    setLoadingTransactions(true);
    try {
      // Fetch payment transactions
      const { data: paymentTransactions, error: paymentError } = await supabase
        .from('payment_transactions')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(50);

      // Fetch coin transactions
      const { data: coinTransactions, error: coinError } = await supabase
        .from('coin_transactions')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(50);

      // Fetch withdrawal requests
      const { data: withdrawalRequests, error: withdrawalError } = await supabase
        .from('withdrawal_requests')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(50);

      if (paymentError || coinError || withdrawalError) {
        console.error('Error loading transactions:', paymentError || coinError || withdrawalError);
        toast({
          title: 'Error',
          description: 'Failed to load transaction history',
          variant: 'destructive'
        });
      } else {
        // Combine and format all transactions
        const allTransactions: Transaction[] = [];

        // Process payment transactions
        paymentTransactions?.forEach(pt => {
          allTransactions.push({
            id: pt.id,
            type: 'purchase',
            amount: pt.amount,
            coins: pt.coins_amount || 0,
            description: `${pt.purpose} - ${pt.payment_method}`,
            timestamp: new Date(pt.created_at),
            status: pt.status as 'completed' | 'pending' | 'failed',
            paymentMethod: pt.payment_method,
            currency: pt.currency,
            reference: pt.transaction_reference
          });
        });

        // Process coin transactions
        coinTransactions?.forEach(ct => {
          allTransactions.push({
            id: ct.id,
            type: ct.type as 'purchase' | 'gift_sent' | 'gift_received' | 'subscription' | 'refund' | 'bonus' | 'withdrawal',
            amount: 0,
            coins: ct.amount,
            description: ct.description || `${ct.type}`,
            timestamp: new Date(ct.created_at),
            status: 'completed',
            reference: ct.reference_id
          });
        });

        // Process withdrawal requests
        withdrawalRequests?.forEach(wr => {
          allTransactions.push({
            id: wr.id,
            type: 'withdrawal',
            amount: wr.amount,
            coins: -(wr.coins_deducted || 0),
            description: `Withdrawal to ${wr.payment_method === 'bank' ? 'Bank Account' : 'Mobile Money'}`,
            timestamp: new Date(wr.created_at),
            status: wr.status as 'completed' | 'pending' | 'failed',
            paymentMethod: wr.payment_method,
            currency: wr.currency,
            reference: wr.reference || wr.id,
            fee: wr.fee
          });
        });

        // Sort by timestamp
        allTransactions.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
        
        setTransactions(allTransactions);
      }
    } catch (error) {
      console.error('Error loading transactions:', error);
    } finally {
      setLoadingTransactions(false);
    }
  };

  const loadBanks = async () => {
    try {
      const data = await paymentsApi.getBanks();
      if (data.status === 'success' && data.data) {
        setBanks(data.data);
      }
    } catch (error) {
      console.error('Error loading banks:', error);
    }
  };

  // Load wallet data on mount
  useEffect(() => {
    if (user) {
      loadUserBalance();
      loadTransactions();
      loadBanks();
      loadGiftExchangeStats();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const verifyAccount = async () => {
    if (!selectedBank || !accountNumber) return;

    setVerifyingAccount(true);
    try {
      const data = await paymentsApi.verifyAccount(selectedBank, accountNumber);
      
      if (data.status === 'success' && data.data) {
        setAccountName(data.data.account_name);
        toast({
          title: "Account Verified",
          description: `Account name: ${data.data.account_name}`,
        });
      } else {
        toast({
          title: "Verification Failed",
          description: data.message || "Could not verify account details",
          variant: "destructive"
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to verify account",
        variant: "destructive"
      });
    } finally {
      setVerifyingAccount(false);
    }
  };

  const handleDeposit = async () => {
    if (!selectedPackage || !user) return;

    const selectedPkg = coinPackages.find(p => p.id === selectedPackage);
    if (!selectedPkg) return;

    setIsProcessing(true);
    try {
      const tx_ref = `LX_${user.id}_${Date.now()}_${Math.random().toString(36).substring(7)}`;

      const data = await paymentsApi.initiatePayment({
        amount: selectedPkg.price,
        currency: selectedPkg.currency,
        email: user.email || '',
        fullname: user.user_metadata?.full_name || '',
        tx_ref,
        payment_method: paymentMethod,
        meta: {
          purpose: 'coin_purchase',
          package_id: selectedPkg.id,
          coins: selectedPkg.coins,
          bonus: selectedPkg.bonus,
          user_id: user.id
        }
      });

      if (data.status === 'success' && (data.data as any)?.authorization_url) {
        window.location.href = (data.data as any).authorization_url;
      } else {
        throw new Error(data.message || 'Payment initiation failed');
      }
    } catch (error: unknown) {
      console.error('Deposit error:', error);
      toast({
        title: "Payment Failed",
        description: error instanceof Error ? error.message : "There was an error processing your payment. Please try again.",
        variant: "destructive",
      });
      setIsProcessing(false);
    }
  };

  const coinPackages: CoinPackage[] = [
    {
      id: 'starter',
      name: 'Starter Pack',
      coins: 500,
      price: 4.99,
      currency: 'USD',
      bonus: 0,
      icon: <Coins className="w-6 h-6" />,
      description: 'Perfect for getting started',
      gradient: 'linear-gradient(135deg, #94A3B8 0%, #64748B 100%)',
      tag: 'Beginner'
    },
    {
      id: 'popular',
      name: 'Popular Pack',
      coins: 1200,
      price: 9.99,
      currency: 'USD',
      bonus: 100,
      popular: true,
      icon: <Star className="w-6 h-6" />,
      description: 'Most popular choice',
      gradient: 'linear-gradient(135deg, #EC4899 0%, #8B5CF6 100%)',
      tag: 'Popular'
    },
    {
      id: 'premium',
      name: 'Premium Pack',
      coins: 2500,
      price: 19.99,
      currency: 'USD',
      bonus: 300,
      icon: <Crown className="w-6 h-6" />,
      description: 'Best value for regular users',
      gradient: 'linear-gradient(135deg, #F59E0B 0%, #F97316 100%)',
      tag: 'Value'
    },
    {
      id: 'platinum',
      name: 'Platinum Pack',
      coins: 6500,
      price: 49.99,
      currency: 'USD',
      bonus: 750,
      bestValue: true,
      icon: <Diamond className="w-6 h-6" />,
      description: 'For power users',
      gradient: 'linear-gradient(135deg, #3B82F6 0%, #8B5CF6 100%)',
      tag: 'Best Value'
    },
    {
      id: 'diamond',
      name: 'Diamond Pack',
      coins: 14000,
      price: 99.99,
      currency: 'USD',
      bonus: 2000,
      icon: <Gem className="w-6 h-6" />,
      description: 'Maximum value',
      gradient: 'linear-gradient(135deg, #10B981 0%, #059669 100%)',
      tag: 'Premium'
    },
    {
      id: 'ultimate',
      name: 'Ultimate Pack',
      coins: 30000,
      price: 199.99,
      currency: 'USD',
      bonus: 5000,
      icon: <Rocket className="w-6 h-6" />,
      description: 'Ultimate experience',
      gradient: 'linear-gradient(135deg, #6366F1 0%, #8B5CF6 100%)',
      tag: 'Ultimate'
    }
  ];

  const paymentMethods: PaymentMethod[] = [
    {
      id: 'card',
      type: 'card',
      name: 'Credit/Debit Card',
      icon: <CreditCard className="w-5 h-5" />,
      description: 'Visa, Mastercard, American Express',
      color: '#3B82F6',
      enabled: true,
      fees: '2.9% + $0.30',
      minAmount: 5,
      maxAmount: 5000
    },
    {
      id: 'mtn',
      type: 'mobile_money',
      name: 'MTN MoMo',
      icon: <Smartphone className="w-5 h-5" />,
      description: 'Mobile Money - Rwanda, Uganda, Congo',
      color: '#F59E0B',
      enabled: true,
      fees: '1.5%',
      minAmount: 1,
      maxAmount: 1000,
      networks: ['MTN']
    },
    {
      id: 'airtel',
      type: 'mobile_money',
      name: 'Airtel Money',
      icon: <Smartphone className="w-5 h-5" />,
      description: 'Airtel Money - Kenya, Uganda, Congo',
      color: '#ED1C24',
      enabled: true,
      fees: '1.5%',
      minAmount: 1,
      maxAmount: 1000,
      networks: ['AIRTEL']
    },
    {
      id: 'mpesa',
      type: 'mobile_money',
      name: 'M-Pesa',
      icon: <Smartphone className="w-5 h-5" />,
      description: 'Safaricom M-Pesa - Kenya, Tanzania',
      color: '#10B981',
      enabled: true,
      fees: '1.5%',
      minAmount: 1,
      maxAmount: 1000,
      networks: ['M-PESA']
    },
    {
      id: 'crypto',
      type: 'crypto',
      name: 'Cryptocurrency',
      icon: <Bitcoin className="w-5 h-5" />,
      description: 'BTC, ETH, USDT, BNB',
      color: '#8B5CF6',
      enabled: true,
      fees: '0.5%',
      minAmount: 10,
      maxAmount: 10000
    },
    {
      id: 'bank',
      type: 'bank',
      name: 'Bank Transfer',
      icon: <Landmark className="w-5 h-5" />,
      description: 'Direct bank transfer',
      color: '#64748B',
      enabled: true,
      fees: 'Free',
      minAmount: 20,
      maxAmount: 10000
    }
  ];

  const currencies = [
    { code: 'USD', symbol: '$', name: 'US Dollar', icon: <DollarSign className="w-4 h-4" /> },
    { code: 'EUR', symbol: '€', name: 'Euro', icon: <Euro className="w-4 h-4" /> },
    { code: 'GBP', symbol: '£', name: 'British Pound', icon: <PoundSterling className="w-4 h-4" /> },
    { code: 'RWF', symbol: 'FRw', name: 'Rwandan Franc', icon: <CircleDollarSign className="w-4 h-4" /> },
    { code: 'KES', symbol: 'KSh', name: 'Kenyan Shilling', icon: <CircleDollarSign className="w-4 h-4" /> },
    { code: 'UGX', symbol: 'USh', name: 'Ugandan Shilling', icon: <CircleDollarSign className="w-4 h-4" /> },
    { code: 'TZS', symbol: 'TSh', name: 'Tanzanian Shilling', icon: <CircleDollarSign className="w-4 h-4" /> }
  ];

  const handlePurchase = (packageId: string) => {
    setSelectedPackage(packageId);
    setShowPaymentModal(true);
  };

  const handlePayment = async () => {
    if (!selectedPackage || !user) return;

    const selectedPkg = coinPackages.find(p => p.id === selectedPackage);
    if (!selectedPkg) return;

    setIsProcessing(true);
    try {
      const tx_ref = `LX_${user.id}_${Date.now()}_${Math.random().toString(36).substring(7)}`;

      const data = await paymentsApi.initiatePayment({
        amount: selectedPkg.price,
        currency: selectedPkg.currency,
        email: user.email || '',
        fullname: user.user_metadata?.full_name || '',
        tx_ref,
        payment_method: paymentMethod,
        meta: {
          purpose: 'coin_purchase',
          package_id: selectedPkg.id,
          coins: selectedPkg.coins,
          bonus: selectedPkg.bonus,
          user_id: user.id
        }
      });

      if (data.status === 'success' && (data.data as any)?.authorization_url) {
        // Redirect to Paystack to complete payment
        window.location.href = (data.data as any).authorization_url;
      } else {
        throw new Error(data.message || 'Payment initiation failed');
      }
    } catch (error: unknown) {
      toast({
        title: "Payment Failed",
        description: error instanceof Error ? error.message : 'Payment failed',
        variant: "destructive",
      });
      setIsProcessing(false);
    }
  };

  const handleWithdraw = async () => {
    if (!withdrawAmount || parseFloat(withdrawAmount) <= 0 || !user) return;

    const amount = parseFloat(withdrawAmount);
    const coinsNeeded = amount * 100; // 1 USD = 100 LX coins

    if (coinsNeeded > userBalance) {
      toast({
        title: "Insufficient Balance",
        description: "You don't have enough coins for this withdrawal.",
        variant: "destructive",
      });
      return;
    }

    // Validate withdrawal details
    if (withdrawMethod === 'bank' && (!selectedBank || !accountNumber || !accountName)) {
      toast({
        title: "Missing Information",
        description: "Please provide all bank account details",
        variant: "destructive",
      });
      return;
    }

    if (withdrawMethod === 'mobile_money' && (!withdrawPhone || !withdrawNetwork)) {
      toast({
        title: "Missing Information",
        description: "Please provide phone number and network",
        variant: "destructive",
      });
      return;
    }

    setIsProcessing(true);
    try {
      const reference = `WD_${user.id}_${Date.now()}_${Math.random().toString(36).substring(7)}`;

      const data = await paymentsApi.withdraw({
        reference,
        amount,
        currency: 'RWF',
        account_bank: withdrawMethod === 'bank' ? selectedBank : withdrawNetwork,
        account_number: withdrawMethod === 'bank' ? accountNumber : withdrawPhone,
        beneficiary_name: withdrawMethod === 'bank' ? accountName : user.user_metadata?.full_name || '',
        narration: `Withdrawal from LoveX Wallet`,
        meta: [{
          sender: user.user_metadata?.full_name || '',
          sender_country: 'RW',
          sender_address: user.user_metadata?.location || ''
        }]
      });

      if (data.status === 'success' && data.data) {
        const newTransaction: Transaction = {
          id: Date.now().toString(),
          type: 'withdrawal',
          amount: amount,
          coins: -coinsNeeded,
          description: `Withdrawal to ${withdrawMethod === 'bank' ? 'Bank Account' : 'Mobile Money'}`,
          timestamp: new Date(),
          status: 'processing',
          paymentMethod: withdrawMethod === 'bank' ? 'Bank Transfer' : 'Mobile Money',
          reference: data.data.reference,
          fee: data.data.fee || amount * 0.02
        };

        setTransactions(prev => [newTransaction, ...prev]);
        setUserBalance(prev => prev - coinsNeeded);

        toast({
          title: "Withdrawal Initiated",
          description: `Your withdrawal of $${amount} is being processed.`,
        });

        setShowWithdrawModal(false);
        setWithdrawAmount('');
        setAccountName('');
        setAccountNumber('');
      } else {
        throw new Error(data.message || 'Withdrawal failed');
      }
    } catch (error: unknown) {
      toast({
        title: "Withdrawal Failed",
        description: error instanceof Error ? error.message : 'Withdrawal failed',
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const formatTime = (date: Date) => {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    if (days < 7) return `${days}d ago`;
    return date.toLocaleDateString();
  };

  const getTransactionIcon = (type: Transaction['type']) => {
    const iconProps = { className: "w-4 h-4" };
    
    switch (type) {
      case 'purchase':
        return <ShoppingBag {...iconProps} className="text-purple-600" />;
      case 'gift_sent':
        return <Gift {...iconProps} className="text-pink-500" />;
      case 'gift_received':
        return <Heart {...iconProps} className="text-pink-500" />;
      case 'subscription':
        return <Crown {...iconProps} className="text-amber-500" />;
      case 'refund':
        return <RefreshCw {...iconProps} className="text-green-500" />;
      case 'bonus':
        return <Award {...iconProps} className="text-amber-500" />;
      case 'withdrawal':
        return <Banknote {...iconProps} className="text-gray-500" />;
      default:
        return <WalletIcon {...iconProps} className="text-gray-500" />;
    }
  };

  const getStatusColor = (status: Transaction['status']) => {
    switch (status) {
      case 'completed':
        return '#10B981';
      case 'pending':
        return '#F59E0B';
      case 'processing':
        return '#3B82F6';
      case 'failed':
        return '#EF4444';
      default:
        return '#64748B';
    }
  };

  const getStatusBadge = (status: Transaction['status']) => {
    switch (status) {
      case 'completed':
        return <Badge className="bg-green-100 text-green-700 border-0">Completed</Badge>;
      case 'pending':
        return <Badge className="bg-yellow-100 text-yellow-700 border-0">Pending</Badge>;
      case 'processing':
        return <Badge className="bg-blue-100 text-blue-700 border-0">Processing</Badge>;
      case 'failed':
        return <Badge className="bg-red-100 text-red-700 border-0">Failed</Badge>;
      default:
        return null;
    }
  };

  const filteredTransactions = transactions.filter(t => {
    const matchesFilter = filterType === 'all' || t.type === filterType;
    const matchesSearch = t.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         t.reference?.toLowerCase().includes(searchQuery.toLowerCase());
    
    const date = new Date(t.timestamp);
    const now = new Date();
    const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
    
    let matchesDate = true;
    if (dateRange === 'today') matchesDate = diffDays === 0;
    else if (dateRange === 'week') matchesDate = diffDays <= 7;
    else if (dateRange === 'month') matchesDate = diffDays <= 30;
    else if (dateRange === 'year') matchesDate = diffDays <= 365;
    
    return matchesFilter && matchesSearch && matchesDate;
  });

  const getTotalSpent = () => {
    return transactions
      .filter(t => t.type === 'purchase' && t.status === 'completed')
      .reduce((sum, t) => sum + t.amount, 0)
      .toFixed(2);
  };

  const getTotalGiftsSent = () => {
    return transactions
      .filter(t => t.type === 'gift_sent' && t.status === 'completed')
      .length;
  };

  const getTotalGiftsReceived = () => {
    return transactions
      .filter(t => t.type === 'gift_received' && t.status === 'completed')
      .length;
  };

  if (!user) return null;

  return (
    <AuthGuard>
      <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
        {/* Header */}
        <div className="sticky top-0 z-10 bg-white/80 backdrop-blur-md border-b border-gray-200">
          <div className="container mx-auto px-4 py-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
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
                  <h1 className="text-xl font-bold text-gray-900">LX Wallet</h1>
                  <p className="text-sm text-gray-500">Manage your virtual currency</p>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2 sm:gap-4">
                {/* Currency Selector */}
                <Select value={selectedCurrency} onValueChange={setSelectedCurrency}>
                  <SelectTrigger className="w-28 sm:w-32 border-gray-300 text-sm">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {currencies.map((currency) => (
                      <SelectItem key={currency.code} value={currency.code}>
                        <div className="flex items-center gap-2">
                          {currency.icon}
                          <span>{currency.code}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                {/* Balance Visibility Toggle */}
                <Button
                  onClick={() => setShowBalance(!showBalance)}
                  variant="outline"
                  size="sm"
                  className="border-gray-300 px-3"
                >
                  {showBalance ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                </Button>

                {/* Quick Actions */}
                <Button
                  onClick={() => setShowDepositModal(true)}
                  size="sm"
                  className="bg-gradient-to-r from-purple-600 to-pink-600 text-white hover:from-purple-700 hover:to-pink-700 px-3 sm:px-4"
                >
                  <Download className="w-4 h-4 sm:mr-2" />
                  <span className="hidden sm:inline">Deposit</span>
                </Button>
                <Button
                  onClick={() => setShowWithdrawModal(true)}
                  variant="outline"
                  size="sm"
                  className="border-gray-300 px-3 sm:px-4"
                >
                  <Upload className="w-4 h-4 sm:mr-2" />
                  <span className="hidden sm:inline">Withdraw</span>
                </Button>

                <Link to="/profile">
                  <Button variant="outline" size="sm" className="border-gray-300 px-3 sm:px-4">
                    <span className="hidden sm:inline">Back to Profile</span>
                    <ChevronLeft className="w-4 h-4 sm:hidden" />
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </div>

        <div className="container mx-auto px-4 py-8">
          {/* Balance Overview */}
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 sm:gap-6 mb-6 sm:mb-8">
            {/* Main Balance */}
            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="lg:col-span-2"
            >
              <Card className="border-0 shadow-xl overflow-hidden bg-gradient-to-br from-purple-600 to-pink-600">
                <CardContent className="p-4 sm:p-6">
                  <div className="flex items-start justify-between text-white mb-4">
                    <div className="flex-1">
                      <p className="text-white/80 text-xs sm:text-sm mb-1">Total Balance</p>
                      <h2 className="text-2xl sm:text-3xl font-bold">
                        {showBalance ? userBalance.toLocaleString() : '••••••'} LX
                      </h2>
                      <p className="text-white/80 text-xs sm:text-sm mt-1">
                        ≈ ${showBalance ? (userBalance / 100).toFixed(2) : '••••'} {selectedCurrency}
                      </p>
                    </div>
                    <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center flex-shrink-0">
                      <WalletIcon className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-white/80 text-xs">Monthly spent</p>
                      <p className="text-white font-semibold text-sm sm:text-base">${getTotalSpent()}</p>
                    </div>
                    <div>
                      <p className="text-white/80 text-xs">Gifts sent/received</p>
                      <p className="text-white font-semibold text-sm sm:text-base">{getTotalGiftsSent()}/{getTotalGiftsReceived()}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            {/* Quick Stats */}
            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.2 }}
            >
              <Card className="border-0 shadow-lg overflow-hidden h-full">
                <CardContent className="p-4 sm:p-6">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-green-100 flex items-center justify-center">
                      <Award className="w-4 h-4 sm:w-5 sm:h-5 text-green-600" />
                    </div>
                    <div>
                      <p className="text-xs sm:text-sm text-gray-500">Member Level</p>
                      <p className="font-semibold text-gray-900 text-sm sm:text-base">Gold Member</p>
                    </div>
                  </div>
                  <Progress value={75} className="h-2 mb-2" />
                  <p className="text-xs text-gray-500">750 points to next level</p>
                </CardContent>
              </Card>
            </motion.div>

            {/* Next Bonus */}
            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.3 }}
            >
              <Card className="border-0 shadow-lg overflow-hidden h-full bg-gradient-to-br from-green-50 to-emerald-50">
                <CardContent className="p-4 sm:p-6">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-green-100 flex items-center justify-center">
                      <TrendingUp className="w-4 h-4 sm:w-5 sm:h-5 text-green-600" />
                    </div>
                    <div>
                      <p className="text-xs sm:text-sm text-gray-600">Gift Exchange Earnings</p>
                      <p className="font-semibold text-gray-900 text-sm sm:text-base">{giftExchangeStats.coinsFromGifts.toLocaleString()} LX</p>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between text-xs">
                      <span className="text-gray-500">Gifts Exchanged</span>
                      <span className="font-medium text-gray-700">{giftExchangeStats.giftsExchanged}</span>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span className="text-gray-500">This Month</span>
                      <span className="font-medium text-green-600">+{giftExchangeStats.thisMonth} LX</span>
                    </div>
                  </div>
                  <div className="mt-3 pt-3 border-t border-green-200">
                    <Link to="/gift-inventory">
                      <Button variant="outline" size="sm" className="w-full text-green-600 border-green-200 hover:bg-green-50">
                        <Gift className="w-3 h-3 mr-2" />
                        Exchange Gifts
                      </Button>
                    </Link>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </div>

          {/* Main Content Tabs */}
          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4 sm:space-y-6">
            <TabsList className="w-full justify-start bg-white border-b border-gray-200 rounded-none h-auto p-0 overflow-x-auto">
              <TabsTrigger 
                value="buy" 
                className="rounded-none border-b-2 border-transparent data-[state=active]:border-purple-600 data-[state=active]:text-purple-600 px-4 sm:px-6 py-3 text-sm sm:text-base whitespace-nowrap"
              >
                Buy Coins
              </TabsTrigger>
              <TabsTrigger 
                value="history" 
                className="rounded-none border-b-2 border-transparent data-[state=active]:border-purple-600 data-[state=active]:text-purple-600 px-4 sm:px-6 py-3 text-sm sm:text-base whitespace-nowrap"
              >
                Transaction History
              </TabsTrigger>
              <TabsTrigger 
                value="methods" 
                className="rounded-none border-b-2 border-transparent data-[state=active]:border-purple-600 data-[state=active]:text-purple-600 px-4 sm:px-6 py-3 text-sm sm:text-base whitespace-nowrap"
              >
                Payment Methods
              </TabsTrigger>
              <TabsTrigger 
                value="stats" 
                className="rounded-none border-b-2 border-transparent data-[state=active]:border-purple-600 data-[state=active]:text-purple-600 px-4 sm:px-6 py-3 text-sm sm:text-base whitespace-nowrap"
              >
                Statistics
              </TabsTrigger>
            </TabsList>

            {/* Buy Coins Tab */}
            <TabsContent value="buy" className="mt-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {coinPackages.map((pkg, index) => (
                  <motion.div
                    key={pkg.id}
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ duration: 0.3, delay: index * 0.05 }}
                    whileHover={{ y: -5 }}
                    className="relative"
                  >
                    {pkg.popular && (
                      <div className="absolute -top-3 left-1/2 transform -translate-x-1/2 z-10">
                        <Badge className="px-3 py-1 bg-gradient-to-r from-purple-600 to-pink-600 text-white border-0">
                          🔥 Most Popular
                        </Badge>
                      </div>
                    )}
                    {pkg.bestValue && (
                      <div className="absolute -top-3 left-1/2 transform -translate-x-1/2 z-10">
                        <Badge className="px-3 py-1 bg-gradient-to-r from-yellow-500 to-orange-500 text-white border-0">
                          ⭐ Best Value
                        </Badge>
                      </div>
                    )}
                    
                    <Card className="border-0 shadow-md hover:shadow-xl transition-all duration-300 overflow-hidden cursor-pointer group">
                      <CardContent className="p-6">
                        {/* Package Icon */}
                        <div className="relative mb-4">
                          <div className="w-16 h-16 mx-auto rounded-full flex items-center justify-center text-white transition-transform group-hover:scale-110"
                               style={{ background: pkg.gradient }}>
                            {pkg.icon}
                          </div>
                          {pkg.tag && (
                            <Badge className="absolute -top-2 -right-2 bg-gray-900 text-white border-0">
                              {pkg.tag}
                            </Badge>
                          )}
                        </div>

                        {/* Package Info */}
                        <div className="text-center mb-4">
                          <h4 className="font-bold text-lg text-gray-900 mb-1">{pkg.name}</h4>
                          <div className="text-3xl font-bold mb-1 text-gray-900">
                            {pkg.coins.toLocaleString()}
                          </div>
                          <div className="text-sm text-gray-500 mb-2">
                            ${pkg.price} {pkg.currency}
                          </div>
                          {pkg.bonus > 0 && (
                            <div className="inline-flex items-center px-2 py-1 bg-green-100 rounded-full">
                              <Sparkles className="w-3 h-3 text-green-600 mr-1" />
                              <span className="text-xs font-medium text-green-600">
                                +{pkg.bonus} Bonus
                              </span>
                            </div>
                          )}
                        </div>

                        {/* Description */}
                        <p className="text-sm text-gray-600 text-center mb-4">
                          {pkg.description}
                        </p>

                        {/* Price per coin */}
                        <div className="text-xs text-gray-400 text-center mb-4">
                          ${(pkg.price / pkg.coins).toFixed(4)} per coin
                        </div>

                        {/* Purchase Button */}
                        <Button
                          onClick={() => handlePurchase(pkg.id)}
                          className="w-full rounded-full transition-all group-hover:shadow-lg text-white"
                          style={{ background: pkg.gradient }}
                        >
                          Buy Now
                          <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
                        </Button>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
              </div>
            </TabsContent>

            {/* Transaction History Tab */}
            <TabsContent value="history" className="mt-6">
              <Card className="border-0 shadow-lg overflow-hidden">
                <CardHeader className="border-b border-gray-200">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg font-semibold text-gray-900">
                      Transaction History
                    </CardTitle>
                    <div className="flex items-center gap-3">
                      {/* Search */}
                      <div className="relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <Input
                          placeholder="Search transactions..."
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                          className="pl-10 w-64 border-gray-300"
                        />
                      </div>

                      {/* Filter by Type */}
                      <Select value={filterType} onValueChange={setFilterType}>
                        <SelectTrigger className="w-40 border-gray-300">
                          <SelectValue placeholder="Filter by type" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All Types</SelectItem>
                          <SelectItem value="purchase">Purchases</SelectItem>
                          <SelectItem value="gift_sent">Gifts Sent</SelectItem>
                          <SelectItem value="gift_received">Gifts Received</SelectItem>
                          <SelectItem value="subscription">Subscriptions</SelectItem>
                          <SelectItem value="withdrawal">Withdrawals</SelectItem>
                          <SelectItem value="bonus">Bonuses</SelectItem>
                        </SelectContent>
                      </Select>

                      {/* Date Range */}
                      <Select value={dateRange} onValueChange={(value: 'today' | 'week' | 'month' | 'year' | 'all') => setDateRange(value)}>
                        <SelectTrigger className="w-32 border-gray-300">
                          <SelectValue placeholder="Date range" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="today">Today</SelectItem>
                          <SelectItem value="week">This Week</SelectItem>
                          <SelectItem value="month">This Month</SelectItem>
                          <SelectItem value="year">This Year</SelectItem>
                          <SelectItem value="all">All Time</SelectItem>
                        </SelectContent>
                      </Select>

                      {/* Export Button */}
                      <Button variant="outline" size="sm" className="border-gray-300">
                        <Download className="w-4 h-4 mr-2" />
                        Export
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="p-6">
                  {loadingTransactions ? (
                    <div className="flex items-center justify-center py-12">
                      <Loader2 className="w-8 h-8 animate-spin text-purple-600" />
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {filteredTransactions.length > 0 ? (
                        filteredTransactions.map((transaction) => (
                          <div
                            key={transaction.id}
                            className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                          >
                            <div className="flex items-start justify-between mb-4">
                              <div className="flex items-center gap-4">
                                <div className={`w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0 ${
                                  transaction.status === 'completed' ? 'bg-green-100' :
                                  transaction.status === 'pending' ? 'bg-yellow-100' :
                                  transaction.status === 'processing' ? 'bg-blue-100' :
                                  transaction.status === 'failed' ? 'bg-red-100' :
                                  'bg-gray-100'
                                }`}>
                                  {getTransactionIcon(transaction.type)}
                                </div>
                                <div>
                                  <h4 className="font-medium text-gray-900">{transaction.description}</h4>
                                  <div className="flex items-center gap-3 text-sm text-gray-500 mt-1">
                                    <span className="flex items-center gap-1">
                                      <Clock className="w-3 h-3" />
                                      {formatTime(transaction.timestamp)}
                                    </span>
                                    {transaction.reference && (
                                      <>
                                        <span>•</span>
                                        <span className="font-mono">{transaction.reference.slice(-8)}</span>
                                      </>
                                    )}
                                  </div>
                                  {transaction.paymentMethod && (
                                    <p className="text-xs text-gray-400 mt-1">
                                      via {transaction.paymentMethod}
                                      {transaction.fee && ` • Fee: $${transaction.fee.toFixed(2)}`}
                                    </p>
                                  )}
                                </div>
                              </div>
                            </div>
                            <div className="text-right">
                              <div className="font-bold text-lg text-gray-900">
                                {transaction.coins > 0 ? '+' : ''}{transaction.coins.toLocaleString()} LX
                              </div>
                              {transaction.amount > 0 && (
                                <div className="text-sm text-gray-500">
                                  ${transaction.amount.toFixed(2)}
                                </div>
                              )}
                              <div className="mt-1">
                                {getStatusBadge(transaction.status)}
                              </div>
                            </div>
                          </div>
                        ))
                      ) : (
                        <div className="text-center py-12">
                          <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-gray-100 flex items-center justify-center">
                            <History className="w-10 h-10 text-gray-400" />
                          </div>
                          <h3 className="text-gray-900 font-medium mb-2">No transactions found</h3>
                          <p className="text-sm text-gray-500">
                            Try adjusting your filters or make your first purchase
                          </p>
                        </div>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Payment Methods Tab */}
            <TabsContent value="methods" className="mt-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {paymentMethods.map((method) => (
                  <motion.div
                    key={method.id}
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ duration: 0.3 }}
                    whileHover={{ y: -5 }}
                  >
                    <Card className="border-0 shadow-md hover:shadow-xl transition-all duration-300 overflow-hidden">
                      <CardContent className="p-6">
                        <div className="flex items-start justify-between mb-4">
                          <div className="flex items-center gap-3">
                            <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
                              method.color === 'purple' ? 'bg-purple-100 text-purple-600' :
                              method.color === 'green' ? 'bg-green-100 text-green-600' :
                              method.color === 'blue' ? 'bg-blue-100 text-blue-600' :
                              method.color === 'red' ? 'bg-red-100 text-red-600' :
                              'bg-gray-100 text-gray-600'
                            }`}>
                              {method.icon}
                            </div>
                            <div>
                              <h3 className="font-semibold text-gray-900">{method.name}</h3>
                              <p className="text-sm text-gray-500">{method.description}</p>
                            </div>
                          </div>
                          <Badge className={method.enabled ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'}>
                            {method.enabled ? 'Enabled' : 'Disabled'}
                          </Badge>
                        </div>

                        <div className="space-y-2 text-sm">
                          <div className="flex items-center justify-between">
                            <span className="text-gray-500">Fees</span>
                            <span className="font-medium text-gray-900">{method.fees}</span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-gray-500">Min amount</span>
                            <span className="font-medium text-gray-900">${method.minAmount}</span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-gray-500">Max amount</span>
                            <span className="font-medium text-gray-900">${method.maxAmount}</span>
                          </div>
                        </div>

                        <div className="mt-4 flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            className="flex-1 border-gray-300"
                          >
                            Edit
                          </Button>
                          <Button
                            size="sm"
                            className="flex-1 bg-gradient-to-r from-purple-600 to-pink-600 text-white"
                          >
                            Set Default
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
              </div>
            </TabsContent>

            {/* Statistics Tab */}
            <TabsContent value="stats" className="mt-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Spending Chart */}
                <Card className="border-0 shadow-lg overflow-hidden">
                  <CardHeader>
                    <CardTitle className="text-lg font-semibold text-gray-900">
                      Spending Overview
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {[
                        { label: 'Gifts', amount: transactions.filter(t => t.type === 'gift_sent' && t.status === 'completed').reduce((sum, t) => sum + Math.abs(t.coins), 0), color: '#EC4899' },
                        { label: 'Subscriptions', amount: transactions.filter(t => t.type === 'subscription' && t.status === 'completed').reduce((sum, t) => sum + Math.abs(t.coins), 0), color: '#8B5CF6' },
                        { label: 'Bonuses', amount: transactions.filter(t => t.type === 'bonus' && t.status === 'completed').reduce((sum, t) => sum + t.coins, 0), color: '#10B981' }
                      ].map((item) => (
                        <div key={item.label}>
                          <div className="flex items-center justify-between text-sm mb-1">
                            <span className="text-gray-600">{item.label}</span>
                            <span className="font-medium text-gray-900">{item.amount} LX</span>
                          </div>
                          <Progress value={(item.amount / 2500) * 100} className={`h-2 ${
                              item.color === 'purple' ? 'bg-purple-200' :
                              item.color === 'green' ? 'bg-green-200' :
                              item.color === 'blue' ? 'bg-blue-200' :
                              item.color === 'red' ? 'bg-red-200' :
                              'bg-gray-200'
                            }`} />
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                {/* Monthly Summary */}
                <Card className="border-0 shadow-lg overflow-hidden">
                  <CardHeader>
                    <CardTitle className="text-lg font-semibold text-gray-900">
                      Monthly Summary
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <span className="text-gray-600">Total spent</span>
                        <span className="font-bold text-gray-900">${getTotalSpent()}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-gray-600">Average per month</span>
                        <span className="font-bold text-gray-900">$24.99</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-gray-600">Most used category</span>
                        <span className="font-bold text-gray-900">Gifts</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-gray-600">Favorite payment</span>
                        <span className="font-bold text-gray-900">MTN MoMo</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          </Tabs>
        </div>

        {/* Payment Modal */}
        <AnimatePresence>
          {showPaymentModal && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
              onClick={() => {
                setShowPaymentModal(false);
                setSelectedPackage(null);
              }}
            >
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                className="w-full max-w-md mx-4"
                onClick={e => e.stopPropagation()}
              >
                <Card className="border-0 shadow-2xl overflow-hidden">
                  <CardContent className="p-6">
                    <div className="text-center mb-6">
                      <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-r from-purple-600 to-pink-600 flex items-center justify-center">
                        <Coins className="w-8 h-8 text-white" />
                      </div>
                      <h3 className="text-xl font-bold mb-2 text-gray-900">
                        Complete Purchase
                      </h3>
                      
                      {selectedPackage && (
                        <div className="bg-gradient-to-r from-purple-50 to-pink-50 p-4 rounded-lg mb-6">
                          <div className="text-lg font-semibold mb-2 text-gray-900">
                            {coinPackages.find(p => p.id === selectedPackage)?.name}
                          </div>
                          <div className="text-3xl font-bold mb-1 text-gray-900">
                            {coinPackages.find(p => p.id === selectedPackage)?.coins.toLocaleString()} LX
                          </div>
                          <div className="text-sm text-gray-500 mb-2">
                            ${coinPackages.find(p => p.id === selectedPackage)?.price}
                          </div>
                          {coinPackages.find(p => p.id === selectedPackage)?.bonus > 0 && (
                            <div className="inline-flex items-center px-3 py-1 bg-green-100 rounded-full">
                              <Sparkles className="w-3 h-3 text-green-600 mr-1" />
                              <span className="text-xs font-medium text-green-600">
                                +{coinPackages.find(p => p.id === selectedPackage)?.bonus} Bonus Coins
                              </span>
                            </div>
                          )}
                        </div>
                      )}

                      <div className="space-y-4">
                        <div>
                          <label className="block text-sm font-medium mb-2 text-gray-700">
                            Payment Method
                          </label>
                          <div className="grid grid-cols-2 gap-2">
                            {paymentMethods.slice(0, 4).map((method) => (
                              <button
                                key={method.id}
                                onClick={() => setPaymentMethod(method.id)}
                                className={`p-3 rounded-lg border transition-all ${
                                  paymentMethod === method.id
                                    ? 'border-purple-500 bg-purple-50'
                                    : 'border-gray-200 hover:border-gray-300'
                                }`}
                              >
                                <div className="flex flex-col items-center">
                                  <div style={{ color: method.color }} className="mb-1">
                                    {method.icon}
                                  </div>
                                  <span className="text-xs font-medium text-gray-900">{method.name}</span>
                                </div>
                              </button>
                            ))}
                          </div>
                        </div>

                        {/* Mobile Money Network Selection */}
                        {(paymentMethod === 'mtn' || paymentMethod === 'airtel' || paymentMethod === 'mpesa') && (
                          <div className="bg-blue-50 p-4 rounded-lg">
                            <p className="text-sm text-blue-800 mb-2">
                              You'll receive a payment request on your phone
                            </p>
                          </div>
                        )}

                        <div className="flex gap-3">
                          <Button
                            onClick={() => {
                              setShowPaymentModal(false);
                              setSelectedPackage(null);
                            }}
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
                              <>
                                Pay Now
                                <ArrowRight className="w-4 h-4 ml-2" />
                              </>
                            )}
                          </Button>
                        </div>

                        {/* Security Badge */}
                        <div className="flex items-center justify-center gap-2 text-xs text-gray-500">
                          <Shield className="w-3 h-3" />
                          <span>Secure payment • 256-bit encryption</span>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Withdrawal Modal */}
        <AnimatePresence>
          {showWithdrawModal && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
              onClick={() => setShowWithdrawModal(false)}
            >
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                className="w-full max-w-md mx-4"
                onClick={e => e.stopPropagation()}
              >
                <Card className="border-0 shadow-2xl overflow-hidden">
                  <CardContent className="p-6">
                    <div className="text-center mb-6">
                      <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-green-100 flex items-center justify-center">
                        <Banknote className="w-8 h-8 text-green-600" />
                      </div>
                      <h3 className="text-xl font-bold mb-2 text-gray-900">
                        Withdraw Funds
                      </h3>
                      <p className="text-sm text-gray-500">
                        Convert your LX coins to real money
                      </p>
                    </div>

                    <div className="space-y-4 mb-6">
                      {/* Available Balance */}
                      <div className="bg-gray-50 p-4 rounded-lg">
                        <div className="flex items-center justify-between text-sm mb-2">
                          <span className="text-gray-600">Available Balance</span>
                          <span className="font-bold text-gray-900">{userBalance.toLocaleString()} LX</span>
                        </div>
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-gray-600">≈ USD Value</span>
                          <span className="font-medium text-gray-900">${(userBalance / 100).toFixed(2)}</span>
                        </div>
                      </div>

                      {/* Amount Input */}
                      <div>
                        <label className="block text-sm font-medium mb-2 text-gray-700">
                          Amount to Withdraw (USD)
                        </label>
                        <div className="relative">
                          <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                          <Input
                            type="number"
                            placeholder="0.00"
                            value={withdrawAmount}
                            onChange={(e) => setWithdrawAmount(e.target.value)}
                            className="pl-10 border-gray-300"
                          />
                        </div>
                      </div>

                      {/* Withdrawal Method Tabs */}
                      <div>
                        <label className="block text-sm font-medium mb-2 text-gray-700">
                          Withdrawal Method
                        </label>
                        <div className="grid grid-cols-2 gap-2">
                          <button
                            onClick={() => setWithdrawMethod('bank')}
                            className={`p-3 rounded-lg border transition-all ${
                              withdrawMethod === 'bank'
                                ? 'border-purple-500 bg-purple-50'
                                : 'border-gray-200 hover:border-gray-300'
                            }`}
                          >
                            <Landmark className={`w-5 h-5 mx-auto mb-1 ${
                              withdrawMethod === 'bank' ? 'text-purple-600' : 'text-gray-500'
                            }`} />
                            <span className="text-xs font-medium">Bank Transfer</span>
                          </button>
                          <button
                            onClick={() => setWithdrawMethod('mobile_money')}
                            className={`flex-1 py-3 px-4 rounded-lg border-2 transition-all ${
                              withdrawMethod === 'mobile_money' 
                                ? 'border-purple-500 bg-purple-50' 
                                : 'border-gray-200 hover:border-gray-300'
                            }`}
                          >
                            <Smartphone className={`w-5 h-5 mx-auto mb-1 ${
                              withdrawMethod === 'mobile_money' ? 'text-purple-600' : 'text-gray-500'
                            }`} />
                            <span className="text-xs font-medium">Mobile Money</span>
                          </button>
                        </div>
                      </div>

                      {/* Bank Transfer Fields */}
                      {withdrawMethod === 'bank' && (
                        <div className="space-y-4">
                          <div>
                            <label className="block text-sm font-medium mb-2 text-gray-700">
                              Select Bank
                            </label>
                            <Select value={selectedBank} onValueChange={setSelectedBank}>
                              <SelectTrigger className="border-gray-300">
                                <SelectValue placeholder="Choose your bank" />
                              </SelectTrigger>
                              <SelectContent>
                                {banks.map((bank) => (
                                  <SelectItem key={bank.code} value={bank.code}>
                                    {bank.name}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>

                          <div>
                            <label className="block text-sm font-medium mb-2 text-gray-700">
                              Account Number
                            </label>
                            <Input
                              value={accountNumber}
                              onChange={(e) => setAccountNumber(e.target.value)}
                              placeholder="Enter account number"
                              className="border-gray-300"
                            />
                          </div>

                          {selectedBank && accountNumber && (
                            <Button
                              onClick={verifyAccount}
                              disabled={verifyingAccount}
                              variant="outline"
                              className="w-full"
                            >
                              {verifyingAccount ? (
                                <>
                                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                  Verifying...
                                </>
                              ) : (
                                'Verify Account'
                              )}
                            </Button>
                          )}

                          {accountName && (
                            <div className="bg-green-50 rounded-lg p-3 flex items-start gap-3">
                              <Check className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                              <div>
                                <p className="font-medium text-green-800">Account Verified</p>
                                <p className="text-sm text-green-700">{accountName}</p>
                              </div>
                            </div>
                          )}
                        </div>
                      )}

                      {/* Mobile Money Fields */}
                      {withdrawMethod === 'mobile_money' && (
                        <div className="space-y-4">
                          <div>
                            <label className="block text-sm font-medium mb-2 text-gray-700">
                              Select Network
                            </label>
                            <Select value={withdrawNetwork} onValueChange={setWithdrawNetwork}>
                              <SelectTrigger className="border-gray-300">
                                <SelectValue placeholder="Choose network" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="MTN">MTN MoMo</SelectItem>
                                <SelectItem value="AIRTEL">Airtel Money</SelectItem>
                                <SelectItem value="M-PESA">M-Pesa</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>

                          <div>
                            <label className="block text-sm font-medium mb-2 text-gray-700">
                              Phone Number
                            </label>
                            <Input
                              value={withdrawPhone}
                              onChange={(e) => setWithdrawPhone(e.target.value)}
                              placeholder="e.g., 0788123456"
                              className="border-gray-300"
                            />
                          </div>
                        </div>
                      )}

                      {/* Summary */}
                      {withdrawAmount && (
                        <div className="bg-gray-50 p-4 rounded-lg space-y-2">
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-gray-600">Amount</span>
                            <span className="font-medium text-gray-900">${parseFloat(withdrawAmount).toFixed(2)}</span>
                          </div>
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-gray-600">Fee (2%)</span>
                            <span className="font-medium text-gray-900">
                              ${(parseFloat(withdrawAmount) * 0.02).toFixed(2)}
                            </span>
                          </div>
                          <div className="border-t border-gray-200 pt-2 mt-2">
                            <div className="flex items-center justify-between font-semibold">
                              <span className="text-gray-900">You'll receive</span>
                              <span className="text-green-600">
                                ${(parseFloat(withdrawAmount) * 0.98).toFixed(2)}
                              </span>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>

                    <div className="flex gap-3">
                      <Button
                        onClick={() => setShowWithdrawModal(false)}
                        variant="outline"
                        className="flex-1 border-gray-300"
                      >
                        Cancel
                      </Button>
                      <Button
                        onClick={handleWithdraw}
                        disabled={isProcessing || !withdrawAmount}
                        className="flex-1 bg-gradient-to-r from-green-600 to-emerald-600 text-white hover:from-green-700 hover:to-emerald-700"
                      >
                        {isProcessing ? (
                          <>
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            Processing...
                          </>
                        ) : (
                          'Withdraw'
                        )}
                      </Button>
                    </div>

                    <p className="text-xs text-gray-500 text-center mt-4">
                      Withdrawals typically take 1-3 business days to process
                    </p>
                  </CardContent>
                </Card>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Deposit Modal (Placeholder for future implementation) */}
        <AnimatePresence>
          {showDepositModal && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
              onClick={() => setShowDepositModal(false)}
            >
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                className="w-full max-w-5xl mx-4 max-h-[90vh] overflow-y-auto"
                onClick={e => e.stopPropagation()}
              >
                <Card className="border-0 shadow-2xl overflow-hidden">
                  <div className="bg-gradient-to-r from-purple-600 to-pink-600 p-4 text-white">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="text-xl font-bold mb-1">Buy LX Coins</h3>
                        <p className="text-purple-100 text-sm">Choose package and payment method</p>
                      </div>
                      <div className="text-3xl">💰</div>
                    </div>
                  </div>
                  
                  <CardContent className="p-4 space-y-4">
                    {/* Selected Package Summary */}
                    {selectedPackage && (
                      <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg p-3 border border-purple-200"
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-xs text-purple-600 font-medium">Selected</p>
                            <p className="font-semibold text-purple-900">
                              {coinPackages.find(p => p.id === selectedPackage)?.name}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="text-lg font-bold text-purple-900">
                              {coinPackages.find(p => p.id === selectedPackage)?.coins + 
                               (coinPackages.find(p => p.id === selectedPackage)?.bonus || 0)} 
                              <span className="text-xs font-normal"> coins</span>
                            </p>
                            <p className="text-xs text-purple-600">
                              {coinPackages.find(p => p.id === selectedPackage)?.currency} {
                                coinPackages.find(p => p.id === selectedPackage)?.price
                              }
                            </p>
                          </div>
                        </div>
                      </motion.div>
                    )}

                    {/* Main Content - Side by Side */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                      {/* Package Selection */}
                      <div>
                        <h4 className="text-base font-semibold mb-3 flex items-center gap-2">
                          <Gift className="w-4 h-4 text-purple-600" />
                          Choose Package
                        </h4>
                        <div className="grid grid-cols-2 gap-2">
                          {coinPackages.map((pkg) => (
                            <motion.div
                              key={pkg.id}
                              whileHover={{ scale: 1.02, y: -1 }}
                              whileTap={{ scale: 0.98 }}
                              onClick={() => setSelectedPackage(pkg.id)}
                            >
                              <Card
                                className={`cursor-pointer transition-all duration-200 ${
                                  selectedPackage === pkg.id
                                    ? 'ring-2 ring-purple-500 bg-gradient-to-br from-purple-50 to-pink-50 border-purple-300'
                                    : 'border-gray-200 hover:border-purple-300'
                                }`}
                              >
                                <CardContent className="p-3 text-center">
                                  <div className="text-2xl mb-1">{pkg.icon}</div>
                                  <h5 className="font-semibold text-gray-900 mb-1 text-sm">{pkg.name}</h5>
                                  <div className="space-y-1">
                                    <p className="text-lg font-bold text-purple-600">
                                      {pkg.coins + pkg.bonus}
                                    </p>
                                    {pkg.bonus > 0 && (
                                      <p className="text-xs text-green-600 font-medium">+{pkg.bonus}</p>
                                    )}
                                    <p className="text-xs font-semibold text-gray-900">
                                      {pkg.currency} {pkg.price}
                                    </p>
                                  </div>
                                  {pkg.popular && (
                                    <Badge className="mt-1 bg-purple-100 text-purple-800 text-xs">
                                      Popular
                                    </Badge>
                                  )}
                                </CardContent>
                              </Card>
                            </motion.div>
                          ))}
                        </div>
                      </div>

                      {/* Payment Method Selection */}
                      <div>
                        <h4 className="text-base font-semibold mb-3 flex items-center gap-2">
                          <CreditCard className="w-4 h-4 text-purple-600" />
                          Payment Method
                        </h4>
                        <div className="space-y-2">
                          {paymentMethods.map((method) => (
                            <motion.div
                              key={method.id}
                              whileHover={{ scale: 1.01 }}
                              whileTap={{ scale: 0.99 }}
                            >
                              <Card
                                className={`cursor-pointer transition-all duration-200 ${
                                  paymentMethod === method.id
                                    ? 'ring-2 ring-purple-500 bg-gradient-to-r from-purple-50 to-pink-50 border-purple-300'
                                    : 'border-gray-200 hover:border-purple-300'
                                }`}
                                onClick={() => setPaymentMethod(method.id)}
                              >
                                <CardContent className="p-3">
                                  <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                      <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                                        paymentMethod === method.id 
                                          ? 'bg-gradient-to-br from-purple-500 to-pink-500 text-white' 
                                          : 'bg-gray-100 text-gray-600'
                                      }`}>
                                        {method.icon}
                                      </div>
                                      <div>
                                        <h5 className="font-semibold text-gray-900 text-sm">{method.name}</h5>
                                        <p className="text-xs text-gray-600">{method.description}</p>
                                      </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                      {method.enabled ? (
                                        <Badge className="bg-green-100 text-green-800 border-green-200 text-xs">
                                          Available
                                        </Badge>
                                      ) : (
                                        <Badge className="bg-yellow-100 text-yellow-800 border-yellow-200 text-xs">
                                          Soon
                                        </Badge>
                                      )}
                                      <div className={`w-4 h-4 rounded-full border-2 ${
                                        paymentMethod === method.id
                                          ? 'bg-purple-600 border-purple-600'
                                          : 'border-gray-300'
                                      }`}>
                                        {paymentMethod === method.id && (
                                          <div className="w-full h-full flex items-center justify-center">
                                            <div className="w-1.5 h-1.5 bg-white rounded-full"></div>
                                          </div>
                                        )}
                                      </div>
                                    </div>
                                  </div>
                                </CardContent>
                              </Card>
                            </motion.div>
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* Payment Details Form */}
                    {selectedPackage && paymentMethod && (
                      <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="space-y-4"
                      >
                        {/* Mobile Money Form */}
                        {(paymentMethod === 'mtn' || paymentMethod === 'airtel' || paymentMethod === 'mpesa') && (
                          <div className="space-y-4">
                            <h4 className="font-semibold text-gray-900 flex items-center gap-2">
                              <Smartphone className="w-4 h-4" />
                              Mobile Money Details
                            </h4>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                              <div>
                                <label className="block text-sm font-medium mb-2 text-gray-700">
                                  Phone Number
                                </label>
                                <input
                                  type="tel"
                                  placeholder="+250788123456"
                                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                                />
                              </div>
                              <div>
                                <label className="block text-sm font-medium mb-2 text-gray-700">
                                  Network Provider
                                </label>
                                <select className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent">
                                  <option value="mtn">MTN MoMo</option>
                                  <option value="airtel">Airtel Money</option>
                                  <option value="mpesa">M-Pesa</option>
                                </select>
                              </div>
                            </div>
                          </div>
                        )}

                        {/* Credit Card Form */}
                        {paymentMethod === 'card' && (
                          <div className="space-y-4">
                            <h4 className="font-semibold text-gray-900 flex items-center gap-2">
                              <CreditCard className="w-4 h-4" />
                              Card Details
                            </h4>
                            <div className="space-y-4">
                              <div>
                                <label className="block text-sm font-medium mb-2 text-gray-700">
                                  Card Number
                                </label>
                                <input
                                  type="text"
                                  placeholder="1234 5678 9012 3456"
                                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                                />
                              </div>
                              <div className="grid grid-cols-2 gap-4">
                                <div>
                                  <label className="block text-sm font-medium mb-2 text-gray-700">
                                    Expiry Date
                                  </label>
                                  <input
                                    type="text"
                                    placeholder="MM/YY"
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                                  />
                                </div>
                                <div>
                                  <label className="block text-sm font-medium mb-2 text-gray-700">
                                    CVV
                                  </label>
                                  <input
                                    type="text"
                                    placeholder="123"
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                                  />
                                </div>
                              </div>
                              <div>
                                <label className="block text-sm font-medium mb-2 text-gray-700">
                                  Cardholder Name
                                </label>
                                <input
                                  type="text"
                                  placeholder="John Doe"
                                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                                />
                              </div>
                            </div>
                          </div>
                        )}

                        {/* Crypto Form */}
                        {paymentMethod === 'crypto' && (
                          <div className="space-y-4">
                            <h4 className="font-semibold text-gray-900 flex items-center gap-2">
                              <Bitcoin className="w-4 h-4" />
                              Cryptocurrency Payment
                            </h4>
                            <div className="bg-gray-50 rounded-lg p-4 space-y-3">
                              <div className="text-sm text-gray-600">
                                Send payment to one of the addresses below:
                              </div>
                              <div className="space-y-2">
                                <div className="flex items-center justify-between bg-white p-3 rounded border">
                                  <div className="flex items-center gap-2">
                                    <span className="text-xs font-bold text-orange-500">BTC</span>
                                    <code className="text-xs">bc1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlh</code>
                                  </div>
                                  <Button size="sm" variant="outline">Copy</Button>
                                </div>
                                <div className="flex items-center justify-between bg-white p-3 rounded border">
                                  <div className="flex items-center gap-2">
                                    <span className="text-xs font-bold text-blue-500">ETH</span>
                                    <code className="text-xs">0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb</code>
                                  </div>
                                  <Button size="sm" variant="outline">Copy</Button>
                                </div>
                                <div className="flex items-center justify-between bg-white p-3 rounded border">
                                  <div className="flex items-center gap-2">
                                    <span className="text-xs font-bold text-green-500">USDT</span>
                                    <code className="text-xs">0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb</code>
                                  </div>
                                  <Button size="sm" variant="outline">Copy</Button>
                                </div>
                              </div>
                              <div className="text-xs text-gray-500">
                                After sending, enter transaction hash:
                              </div>
                              <input
                                type="text"
                                placeholder="Transaction hash (optional)"
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                              />
                            </div>
                          </div>
                        )}

                        {/* Bank Transfer Form */}
                        {paymentMethod === 'bank' && (
                          <div className="space-y-4">
                            <h4 className="font-semibold text-gray-900 flex items-center gap-2">
                              <Building2 className="w-4 h-4" />
                              Bank Transfer Details
                            </h4>
                            <div className="bg-blue-50 rounded-lg p-4 space-y-3">
                              <div className="text-sm font-medium text-blue-900">
                                Transfer to this account:
                              </div>
                              <div className="bg-white rounded p-3 space-y-2 text-sm">
                                <div className="flex justify-between">
                                  <span className="text-gray-600">Bank:</span>
                                  <span className="font-medium">Bank of Kigali</span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-gray-600">Account Name:</span>
                                  <span className="font-medium">LoveX Dating Ltd</span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-gray-600">Account Number:</span>
                                  <span className="font-medium">0041234567890</span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-gray-600">SWIFT:</span>
                                  <span className="font-medium">BKIRRWRW</span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-gray-600">Reference:</span>
                                  <span className="font-medium text-purple-600">LX{user?.id?.slice(-8) || 'DEPOSIT'}</span>
                                </div>
                              </div>
                              <div className="text-xs text-gray-600">
                                Include your reference number in the transfer description. Your account will be credited within 24-48 hours.
                              </div>
                              <div>
                                <label className="block text-sm font-medium mb-2 text-gray-700">
                                  Upload Payment Receipt (Optional)
                                </label>
                                <input
                                  type="file"
                                  accept="image/*,.pdf"
                                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                                />
                              </div>
                            </div>
                          </div>
                        )}
                      </motion.div>
                    )}

                    {/* Action Buttons */}
                    <div className="flex gap-3 pt-3 border-t">
                      <Button
                        onClick={() => setShowDepositModal(false)}
                        variant="outline"
                        className="flex-1 h-10 text-gray-700 border-gray-300 hover:bg-gray-50"
                      >
                        Cancel
                      </Button>
                      <Button
                        onClick={handleDeposit}
                        disabled={!selectedPackage || !paymentMethod || isProcessing}
                        className="flex-1 h-10 bg-gradient-to-r from-purple-600 to-pink-600 text-white hover:from-purple-700 hover:to-pink-700 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {isProcessing ? (
                          <>
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            Processing...
                          </>
                        ) : (
                          <>
                            <Coins className="w-4 h-4 mr-2" />
                            Purchase Coins
                          </>
                        )}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </AuthGuard>
  );
};

export default Wallet;
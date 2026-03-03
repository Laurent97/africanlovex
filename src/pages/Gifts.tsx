import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link, useNavigate } from 'react-router-dom';
import { 
  Heart, 
  Gift, 
  Star, 
  Crown, 
  Diamond, 
  Flower2, 
  Cake,
  Trophy,
  Sparkles,
  Coins,
  ShoppingCart,
  Filter,
  Search,
  Package,
  Zap,
  Flame,
  IceCream,
  Music,
  Camera,
  Gamepad2,
  Coffee,
  Pizza,
  Car,
  Plane,
  Home,
  Gem,
  ChevronLeft,
  ChevronRight,
  X,
  Check,
  AlertCircle,
  Loader2,
  Info,
  Tag,
  Clock,
  TrendingUp,
  Award,
  Users,
  Rocket,
  Sun,
  Moon,
  Cloud,
  Star as StarIcon,
  Feather,
  Droplet,
  Leaf,
  Smile,
  Coffee as CoffeeIcon,
  Wine,
  Gift as GiftIcon,
  ShoppingBag,
  Wallet,
  CreditCard,
  Smartphone,
  TrendingUp as TrendingUpIcon,
  ArrowRight,
  Plus,
  Minus,
  ShoppingBasket,
  HeartHandshake,
  Sparkle,
  PartyPopper,
  Bot,
  Brain,
  ZapIcon,
  Infinity,
  Globe,
  MapPin,
  Palette,
  Brush,
  Music2,
  SparkleIcon,
  HeartPulse,
  HeartCrack,
  HeartOff,
  HeartIcon,
  Bitcoin,
  Building2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Slider } from '@/components/ui/slider';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue 
} from '@/components/ui/select';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { AuthGuard } from '@/components/auth/AuthGuard';
import { useAuth } from '@/hooks/use-auth';
import { useToast } from '@/hooks/use-toast';
import { useGiftStore } from '@/hooks/use-gift-store';
import { MobileMoneyPayment } from '@/components/payment/MobileMoneyPayment';
import { supabase } from '@/lib/supabase';

// Romantic color palette
const romanticColors = {
  primary: '#FF69B4', // Hot Pink
  secondary: '#FF1493', // Deep Pink
  accent: '#FFB6C1', // Light Pink
  gold: '#FFD700', // Gold
  rose: '#FF007F', // Rose
  blush: '#FFE4E1', // Misty Rose
  lavender: '#E6E6FA', // Lavender
  peach: '#FFDAB9', // Peach
  coral: '#FF7F50', // Coral
  mint: '#98FF98', // Mint
  pearl: '#F0EAD6', // Pearl
  ruby: '#E0115F', // Ruby
  emerald: '#50C878', // Emerald
  sapphire: '#0F52BA', // Sapphire
  amethyst: '#9966CC', // Amethyst
  champagne: '#F7E7CE', // Champagne
  silver: '#C0C0C0', // Silver
  bronze: '#CD7F32' // Bronze
};

// Enhanced gift icons with romantic styling
const GiftIcons = {
  // Romantic Gifts
  eternalRose: <Flower2 className="w-8 h-8 text-pink-500 drop-shadow-[0_4px_6px_rgba(255,105,180,0.3)]" />,
  heartBox: <Heart className="w-8 h-8 text-red-500 drop-shadow-[0_4px_6px_rgba(255,0,0,0.3)]" />,
  loveLetter: <Package className="w-8 h-8 text-purple-500 drop-shadow-[0_4px_6px_rgba(128,0,128,0.3)]" />,
  cupidArrow: <Zap className="w-8 h-8 text-yellow-500 drop-shadow-[0_4px_6px_rgba(255,215,0,0.3)]" />,
  promiseRing: <Diamond className="w-8 h-8 text-blue-500 drop-shadow-[0_4px_6px_rgba(0,0,255,0.3)]" />,
  infinityHeart: <Infinity className="w-8 h-8 text-pink-600 drop-shadow-[0_4px_6px_rgba(255,20,147,0.3)]" />,
  
  // Premium Gifts
  shootingStar: <Star className="w-8 h-8 text-yellow-400 drop-shadow-[0_4px_6px_rgba(255,215,0,0.4)]" />,
  royalCrown: <Crown className="w-8 h-8 text-amber-600 drop-shadow-[0_4px_6px_rgba(255,191,0,0.4)]" />,
  diamondCluster: <Gem className="w-8 h-8 text-cyan-500 drop-shadow-[0_4px_6px_rgba(0,255,255,0.4)]" />,
  goldenRose: <Flower2 className="w-8 h-8 text-yellow-600 drop-shadow-[0_4px_6px_rgba(255,215,0,0.4)]" />,
  
  // Legendary Gifts
  dragonHeart: <Flame className="w-8 h-8 text-orange-600 drop-shadow-[0_4px_6px_rgba(255,69,0,0.5)]" />,
  phoenixFeather: <Feather className="w-8 h-8 text-red-600 drop-shadow-[0_4px_6px_rgba(255,0,0,0.5)]" />,
  crystalBall: <Camera className="w-8 h-8 text-purple-600 drop-shadow-[0_4px_6px_rgba(128,0,128,0.5)]" />,
  northernLights: <Sparkles className="w-8 h-8 text-green-500 drop-shadow-[0_4px_6px_rgba(0,255,0,0.5)]" />,
  
  // Fun Gifts
  iceCream: <IceCream className="w-8 h-8 text-pink-400 drop-shadow-[0_4px_6px_rgba(255,182,193,0.3)]" />,
  pizza: <Pizza className="w-8 h-8 text-orange-500 drop-shadow-[0_4px_6px_rgba(255,140,0,0.3)]" />,
  coffee: <CoffeeIcon className="w-8 h-8 text-yellow-700 drop-shadow-[0_4px_6px_rgba(139,69,19,0.3)]" />,
  gameController: <Gamepad2 className="w-8 h-8 text-blue-500 drop-shadow-[0_4px_6px_rgba(0,0,255,0.3)]" />,
  musicNote: <Music className="w-8 h-8 text-purple-400 drop-shadow-[0_4px_6px_rgba(147,112,219,0.3)]" />,
  
  // Luxury Gifts
  sportsCar: <Car className="w-8 h-8 text-red-600 drop-shadow-[0_4px_6px_rgba(255,0,0,0.5)]" />,
  privateJet: <Plane className="w-8 h-8 text-gray-600 drop-shadow-[0_4px_6px_rgba(128,128,128,0.5)]" />,
  luxuryMansion: <Home className="w-8 h-8 text-amber-700 drop-shadow-[0_4px_6px_rgba(184,115,51,0.5)]" />,
  superYacht: <Package className="w-8 h-8 text-blue-600 drop-shadow-[0_4px_6px_rgba(0,0,255,0.5)]" />,
  
  // Seasonal Gifts
  valentineHeart: <HeartHandshake className="w-8 h-8 text-red-500 drop-shadow-[0_4px_6px_rgba(255,0,0,0.4)]" />,
  christmasStar: <StarIcon className="w-8 h-8 text-yellow-500 drop-shadow-[0_4px_6px_rgba(255,215,0,0.4)]" />,
  newYearFireworks: <PartyPopper className="w-8 h-8 text-purple-500 drop-shadow-[0_4px_6px_rgba(128,0,128,0.4)]" />,
  
  // Additional Romantic Icons
  heartPulse: <HeartPulse className="w-8 h-8 text-red-400 drop-shadow-[0_4px_6px_rgba(255,99,71,0.3)]" />,
  loveSparkle: <SparkleIcon className="w-8 h-8 text-yellow-400 drop-shadow-[0_4px_6px_rgba(255,215,0,0.3)]" />,
  rosePetals: <Palette className="w-8 h-8 text-pink-300 drop-shadow-[0_4px_6px_rgba(255,182,193,0.3)]" />,
  loveLetter2: <Brush className="w-8 h-8 text-purple-300 drop-shadow-[0_4px_6px_rgba(147,112,219,0.3)]" />,
  sweetMelody: <Music2 className="w-8 h-8 text-indigo-400 drop-shadow-[0_4px_6px_rgba(75,0,130,0.3)]" />
};

interface Gift {
  id: string;
  name: string;
  category: 'romantic' | 'premium' | 'legendary' | 'fun' | 'luxury' | 'seasonal' | 'limited';
  price: number;
  icon: React.ReactNode;
  description: string;
  rarity: 'common' | 'rare' | 'epic' | 'legendary' | 'mythic';
  animated: boolean;
  limited?: boolean;
  seasonal?: boolean;
  new?: boolean;
  popular?: boolean;
  discount?: number;
  stock?: number;
  tags: string[];
  previewUrl?: string;
  animationPreview?: string;
  romanticMessage?: string;
  color?: string;
  glowColor?: string;
}

interface CartItem extends Gift {
  quantity: number;
}

const Gifts = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { balance, updateBalance, addToCart: addToCartStore, removeFromCart: removeFromCartStore, clearCart, cartItems } = useGiftStore();
  
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [showCart, setShowCart] = useState(false);
  const [selectedGift, setSelectedGift] = useState<Gift | null>(null);
  const [showQuickView, setShowQuickView] = useState(false);
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 10000]);
  const [selectedRarity, setSelectedRarity] = useState<string>('all');
  const [sortBy, setSortBy] = useState<string>('popular');
  const [isLoading, setIsLoading] = useState(false);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [showCheckout, setShowCheckout] = useState(false);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<string>('coins');
  const [isProcessing, setIsProcessing] = useState(false);
  const [giftHistory, setGiftHistory] = useState<any[]>([]);
  const [showHistory, setShowHistory] = useState(false);
  const [showMobileMoneyPayment, setShowMobileMoneyPayment] = useState(false);
  const [coinsNeeded, setCoinsNeeded] = useState(0);
  const [hoveredGift, setHoveredGift] = useState<string | null>(null);

  // Enhanced gifts with romantic styling
  const [gifts, setGifts] = useState<Gift[]>([
    // Romantic Gifts
    {
      id: '1',
      name: 'Eternal Rose',
      category: 'romantic',
      price: 50,
      icon: GiftIcons.eternalRose,
      description: 'A classic red rose that never wilts, expressing your eternal love.',
      rarity: 'common',
      animated: false,
      popular: true,
      tags: ['romantic', 'classic', 'flower'],
      romanticMessage: 'Like this rose, my love for you will never fade.',
      color: '#FF69B4',
      glowColor: 'rgba(255,105,180,0.5)'
    },
    {
      id: '2',
      name: 'Heart Box',
      category: 'romantic',
      price: 100,
      icon: GiftIcons.heartBox,
      description: 'A beautiful box of virtual chocolates and hearts to sweeten their day.',
      rarity: 'common',
      animated: false,
      tags: ['sweet', 'chocolate', 'gift'],
      romanticMessage: 'Each heart in this box beats only for you.',
      color: '#FF1493',
      glowColor: 'rgba(255,20,147,0.5)'
    },
    {
      id: '3',
      name: 'Love Letter',
      category: 'romantic',
      price: 75,
      icon: GiftIcons.loveLetter,
      description: 'A romantic letter sealed with a kiss, perfect for expressing your feelings.',
      rarity: 'common',
      animated: false,
      tags: ['letter', 'romantic', 'words'],
      romanticMessage: 'Words cannot express how much you mean to me.',
      color: '#FFB6C1',
      glowColor: 'rgba(255,182,193,0.5)'
    },
    {
      id: '4',
      name: 'Cupid\'s Arrow',
      category: 'romantic',
      price: 200,
      icon: GiftIcons.cupidArrow,
      description: 'Shoot your shot with this magical arrow that guarantees a spark.',
      rarity: 'rare',
      animated: true,
      popular: true,
      tags: ['magic', 'spark', 'love'],
      romanticMessage: 'You\'ve struck my heart!',
      color: '#FFD700',
      glowColor: 'rgba(255,215,0,0.5)'
    },
    {
      id: '5',
      name: 'Promise Ring',
      category: 'romantic',
      price: 500,
      icon: GiftIcons.promiseRing,
      description: 'A symbol of your commitment and a promise for the future.',
      rarity: 'epic',
      animated: true,
      tags: ['ring', 'promise', 'commitment'],
      romanticMessage: 'A promise of forever, starting today.',
      color: '#0F52BA',
      glowColor: 'rgba(15,82,186,0.5)'
    },
    {
      id: '6',
      name: 'Infinity Heart',
      category: 'romantic',
      price: 800,
      icon: GiftIcons.infinityHeart,
      description: 'An eternal symbol of love that goes on forever.',
      rarity: 'epic',
      animated: true,
      limited: true,
      tags: ['infinity', 'eternal', 'love'],
      romanticMessage: 'My love for you is infinite.',
      color: '#FF1493',
      glowColor: 'rgba(255,20,147,0.5)'
    },

    // Premium Gifts
    {
      id: '7',
      name: 'Shooting Star',
      category: 'premium',
      price: 150,
      icon: GiftIcons.shootingStar,
      description: 'Make a wish upon this shooting star and watch it come true.',
      rarity: 'common',
      animated: true,
      popular: true,
      tags: ['star', 'wish', 'magic'],
      romanticMessage: 'I wished for you, and my wish came true.',
      color: '#FFD700',
      glowColor: 'rgba(255,215,0,0.5)'
    },
    {
      id: '8',
      name: 'Royal Crown',
      category: 'premium',
      price: 300,
      icon: GiftIcons.royalCrown,
      description: 'Make them feel like royalty with this majestic crown.',
      rarity: 'rare',
      animated: true,
      tags: ['crown', 'royal', 'premium'],
      romanticMessage: 'You deserve to be treated like royalty.',
      color: '#FFBF00',
      glowColor: 'rgba(255,191,0,0.5)'
    },
    {
      id: '9',
      name: 'Diamond Cluster',
      category: 'premium',
      price: 1000,
      icon: GiftIcons.diamondCluster,
      description: 'A precious cluster of diamonds for someone truly special.',
      rarity: 'legendary',
      animated: true,
      tags: ['diamond', 'luxury', 'precious'],
      romanticMessage: 'You shine brighter than any diamond.',
      color: '#00FFFF',
      glowColor: 'rgba(0,255,255,0.5)'
    },
    {
      id: '10',
      name: 'Golden Rose',
      category: 'premium',
      price: 600,
      icon: GiftIcons.goldenRose,
      description: 'A rose plated in pure gold - elegance personified.',
      rarity: 'epic',
      animated: true,
      limited: true,
      tags: ['gold', 'rose', 'luxury'],
      romanticMessage: 'You are worth more than gold.',
      color: '#FFD700',
      glowColor: 'rgba(255,215,0,0.5)'
    },

    // Legendary Gifts
    {
      id: '11',
      name: 'Dragon\'s Heart',
      category: 'legendary',
      price: 2000,
      icon: GiftIcons.dragonHeart,
      description: 'A heart that burns with eternal passion, forged in dragon fire.',
      rarity: 'legendary',
      animated: true,
      limited: true,
      tags: ['dragon', 'fire', 'passion'],
      romanticMessage: 'My heart burns with passion for you.',
      color: '#FF4500',
      glowColor: 'rgba(255,69,0,0.5)'
    },
    {
      id: '12',
      name: 'Phoenix Feather',
      category: 'legendary',
      price: 1500,
      icon: GiftIcons.phoenixFeather,
      description: 'Rise from the ashes with this mystical feather of rebirth.',
      rarity: 'legendary',
      animated: true,
      limited: true,
      tags: ['phoenix', 'rebirth', 'magic'],
      romanticMessage: 'With you, I feel reborn.',
      color: '#FF0000',
      glowColor: 'rgba(255,0,0,0.5)'
    },
    {
      id: '13',
      name: 'Crystal Ball',
      category: 'legendary',
      price: 1200,
      icon: GiftIcons.crystalBall,
      description: 'See your future together in this mystical crystal orb.',
      rarity: 'epic',
      animated: true,
      tags: ['crystal', 'future', 'magic'],
      romanticMessage: 'I see a beautiful future with you.',
      color: '#800080',
      glowColor: 'rgba(128,0,128,0.5)'
    },
    {
      id: '14',
      name: 'Northern Lights',
      category: 'legendary',
      price: 1800,
      icon: GiftIcons.northernLights,
      description: 'Bring the magical aurora borealis to your conversation.',
      rarity: 'legendary',
      animated: true,
      seasonal: true,
      tags: ['aurora', 'lights', 'magic'],
      romanticMessage: 'You light up my world like the northern lights.',
      color: '#00FF00',
      glowColor: 'rgba(0,255,0,0.5)'
    },

    // Fun Gifts
    {
      id: '15',
      name: 'Ice Cream Sundae',
      category: 'fun',
      price: 25,
      icon: GiftIcons.iceCream,
      description: 'A sweet virtual treat for a sweet person.',
      rarity: 'common',
      animated: false,
      popular: true,
      tags: ['ice cream', 'sweet', 'treat'],
      romanticMessage: 'You\'re sweeter than ice cream!',
      color: '#FFB6C1',
      glowColor: 'rgba(255,182,193,0.3)'
    },
    {
      id: '16',
      name: 'Gourmet Pizza',
      category: 'fun',
      price: 40,
      icon: GiftIcons.pizza,
      description: 'Share a virtual pizza together on your next date night.',
      rarity: 'common',
      animated: false,
      tags: ['pizza', 'food', 'date'],
      romanticMessage: 'You\'ve stolen a pizza my heart!',
      color: '#FF8C00',
      glowColor: 'rgba(255,140,0,0.3)'
    },
    {
      id: '17',
      name: 'Coffee Date',
      category: 'fun',
      price: 30,
      icon: GiftIcons.coffee,
      description: 'A virtual coffee to brighten their morning.',
      rarity: 'common',
      animated: false,
      tags: ['coffee', 'morning', 'date'],
      romanticMessage: 'You\'re my cup of tea!',
      color: '#8B4513',
      glowColor: 'rgba(139,69,19,0.3)'
    },
    {
      id: '18',
      name: 'Game Controller',
      category: 'fun',
      price: 80,
      icon: GiftIcons.gameController,
      description: 'For the gamer in your life - game together!',
      rarity: 'common',
      animated: false,
      tags: ['gaming', 'controller', 'fun'],
      romanticMessage: 'You complete me!',
      color: '#0000FF',
      glowColor: 'rgba(0,0,255,0.3)'
    },
    {
      id: '19',
      name: 'Music Note',
      category: 'fun',
      price: 60,
      icon: GiftIcons.musicNote,
      description: 'Send a melody straight to their heart.',
      rarity: 'common',
      animated: true,
      tags: ['music', 'melody', 'heart'],
      romanticMessage: 'You\'re the music to my heart.',
      color: '#9370DB',
      glowColor: 'rgba(147,112,219,0.3)'
    },

    // Luxury Gifts
    {
      id: '20',
      name: 'Sports Car',
      category: 'luxury',
      price: 5000,
      icon: GiftIcons.sportsCar,
      description: 'A luxury ride for your luxury love.',
      rarity: 'legendary',
      animated: true,
      limited: true,
      tags: ['car', 'luxury', 'speed'],
      romanticMessage: 'You take my breath away.',
      color: '#FF0000',
      glowColor: 'rgba(255,0,0,0.5)'
    },
    {
      id: '21',
      name: 'Private Jet',
      category: 'luxury',
      price: 10000,
      icon: GiftIcons.privateJet,
      description: 'Fly them to paradise in style.',
      rarity: 'legendary',
      animated: true,
      limited: true,
      tags: ['jet', 'travel', 'luxury'],
      romanticMessage: 'You make me fly high.',
      color: '#808080',
      glowColor: 'rgba(128,128,128,0.5)'
    },
    {
      id: '22',
      name: 'Luxury Mansion',
      category: 'luxury',
      price: 15000,
      icon: GiftIcons.luxuryMansion,
      description: 'Build your dream home together virtually.',
      rarity: 'legendary',
      animated: true,
      limited: true,
      tags: ['mansion', 'home', 'luxury'],
      romanticMessage: 'Home is wherever I\'m with you.',
      color: '#B87333',
      glowColor: 'rgba(184,115,51,0.5)'
    },
    {
      id: '23',
      name: 'Super Yacht',
      category: 'luxury',
      price: 8000,
      icon: GiftIcons.superYacht,
      description: 'Sail into the sunset on your own yacht.',
      rarity: 'legendary',
      animated: true,
      limited: true,
      tags: ['yacht', 'boat', 'luxury'],
      romanticMessage: 'You calm the seas in my life.',
      color: '#0000FF',
      glowColor: 'rgba(0,0,255,0.5)'
    },

    // Seasonal Gifts
    {
      id: '24',
      name: 'Valentine\'s Heart',
      category: 'seasonal',
      price: 150,
      icon: GiftIcons.valentineHeart,
      description: 'Special Valentine\'s Day heart with love.',
      rarity: 'rare',
      animated: true,
      seasonal: true,
      tags: ['valentine', 'heart', 'love'],
      romanticMessage: 'Be my Valentine?',
      color: '#FF0000',
      glowColor: 'rgba(255,0,0,0.4)'
    },
    {
      id: '25',
      name: 'Christmas Star',
      category: 'seasonal',
      price: 200,
      icon: GiftIcons.christmasStar,
      description: 'A magical star for the holiday season.',
      rarity: 'rare',
      animated: true,
      seasonal: true,
      tags: ['christmas', 'holiday', 'star'],
      romanticMessage: 'You\'re my star this Christmas.',
      color: '#FFD700',
      glowColor: 'rgba(255,215,0,0.4)'
    },
    {
      id: '26',
      name: 'New Year Fireworks',
      category: 'seasonal',
      price: 300,
      icon: GiftIcons.newYearFireworks,
      description: 'Celebrate the new year with spectacular fireworks.',
      rarity: 'epic',
      animated: true,
      seasonal: true,
      limited: true,
      tags: ['new year', 'fireworks', 'celebration'],
      romanticMessage: 'You make every moment feel like New Year\'s Eve.',
      color: '#800080',
      glowColor: 'rgba(128,0,128,0.4)'
    }
  ]);

  const categories = [
    { key: 'all', label: 'All Gifts', icon: <Gift className="w-4 h-4" />, count: gifts.length, gradient: 'linear-gradient(135deg, #FF69B4, #FF1493)' },
    { key: 'romantic', label: 'Romantic', icon: <Heart className="w-4 h-4" />, count: gifts.filter(g => g.category === 'romantic').length, gradient: 'linear-gradient(135deg, #FF69B4, #FF1493)' },
    { key: 'premium', label: 'Premium', icon: <Star className="w-4 h-4" />, count: gifts.filter(g => g.category === 'premium').length, gradient: 'linear-gradient(135deg, #FFD700, #FFA500)' },
    { key: 'legendary', label: 'Legendary', icon: <Crown className="w-4 h-4" />, count: gifts.filter(g => g.category === 'legendary').length, gradient: 'linear-gradient(135deg, #8B5CF6, #EC4899)' },
    { key: 'fun', label: 'Fun', icon: <Sparkles className="w-4 h-4" />, count: gifts.filter(g => g.category === 'fun').length, gradient: 'linear-gradient(135deg, #10B981, #3B82F6)' },
    { key: 'luxury', label: 'Luxury', icon: <Diamond className="w-4 h-4" />, count: gifts.filter(g => g.category === 'luxury').length, gradient: 'linear-gradient(135deg, #FFD700, #C0C0C0)' },
    { key: 'seasonal', label: 'Seasonal', icon: <Sun className="w-4 h-4" />, count: gifts.filter(g => g.category === 'seasonal').length, gradient: 'linear-gradient(135deg, #FF69B4, #FFD700)' }
  ];

  const rarityOptions = [
    { key: 'all', label: 'All Rarities', gradient: 'linear-gradient(135deg, #808080, #C0C0C0)' },
    { key: 'common', label: 'Common', gradient: 'linear-gradient(135deg, #808080, #C0C0C0)' },
    { key: 'rare', label: 'Rare', gradient: 'linear-gradient(135deg, #3B82F6, #1E3A8A)' },
    { key: 'epic', label: 'Epic', gradient: 'linear-gradient(135deg, #8B5CF6, #5B21B6)' },
    { key: 'legendary', label: 'Legendary', gradient: 'linear-gradient(135deg, #F59E0B, #B45309)' },
    { key: 'mythic', label: 'Mythic', gradient: 'linear-gradient(135deg, #EC4899, #831843)' }
  ];

  const sortOptions = [
    { key: 'popular', label: 'Most Popular', icon: <TrendingUp className="w-4 h-4" /> },
    { key: 'price_asc', label: 'Price: Low to High', icon: <ArrowRight className="w-4 h-4" /> },
    { key: 'price_desc', label: 'Price: High to Low', icon: <ArrowRight className="w-4 h-4 transform rotate-180" /> },
    { key: 'newest', label: 'Newest Arrivals', icon: <Sparkles className="w-4 h-4" /> },
    { key: 'name_asc', label: 'Name: A to Z', icon: <Package className="w-4 h-4" /> }
  ];

  const getRarityColor = (rarity: Gift['rarity']) => {
    switch (rarity) {
      case 'common': return '#808080';
      case 'rare': return '#3B82F6';
      case 'epic': return '#8B5CF6';
      case 'legendary': return '#F59E0B';
      case 'mythic': return '#EC4899';
      default: return '#808080';
    }
  };

  const getRarityGradient = (rarity: Gift['rarity']) => {
    switch (rarity) {
      case 'common': return 'linear-gradient(135deg, #808080, #C0C0C0)';
      case 'rare': return 'linear-gradient(135deg, #3B82F6, #1E3A8A)';
      case 'epic': return 'linear-gradient(135deg, #8B5CF6, #5B21B6)';
      case 'legendary': return 'linear-gradient(135deg, #F59E0B, #B45309)';
      case 'mythic': return 'linear-gradient(135deg, #EC4899, #831843)';
      default: return 'linear-gradient(135deg, #808080, #C0C0C0)';
    }
  };

  const getRarityBg = (rarity: Gift['rarity']) => {
    switch (rarity) {
      case 'common': return 'bg-gray-100';
      case 'rare': return 'bg-blue-50';
      case 'epic': return 'bg-purple-50';
      case 'legendary': return 'bg-amber-50';
      case 'mythic': return 'bg-pink-50';
      default: return 'bg-gray-100';
    }
  };

  const getCategoryIcon = (category: string) => {
    const cat = categories.find(c => c.key === category);
    return cat?.icon || <Gift className="w-4 h-4" />;
  };

  // Filter gifts based on criteria
  const filteredGifts = gifts.filter(gift => {
    const matchesCategory = selectedCategory === 'all' || gift.category === selectedCategory;
    const matchesSearch = gift.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         gift.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         gift.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesPrice = gift.price >= priceRange[0] && gift.price <= priceRange[1];
    const matchesRarity = selectedRarity === 'all' || gift.rarity === selectedRarity;
    
    return matchesCategory && matchesSearch && matchesPrice && matchesRarity;
  });

  // Sort gifts
  const sortedGifts = [...filteredGifts].sort((a, b) => {
    switch (sortBy) {
      case 'popular':
        return (b.popular ? 1 : 0) - (a.popular ? 1 : 0);
      case 'price_asc':
        return a.price - b.price;
      case 'price_desc':
        return b.price - a.price;
      case 'newest':
        return (b.new ? 1 : 0) - (a.new ? 1 : 0);
      case 'name_asc':
        return a.name.localeCompare(b.name);
      default:
        return 0;
    }
  });

  // Get featured gifts (popular + limited)
  const featuredGifts = gifts.filter(g => g.popular || g.limited || g.seasonal).slice(0, 8);

  const addToCart = (gift: Gift) => {
    setCart(prev => {
      const existing = prev.find(item => item.id === gift.id);
      if (existing) {
        return prev.map(item =>
          item.id === gift.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      }
      return [...prev, { ...gift, quantity: 1 }];
    });

    toast({
      title: "Added to Cart",
      description: (
        <div className="flex items-center gap-2">
          <Heart className="w-4 h-4 text-pink-500" />
          <span>{gift.name} has been added to your cart.</span>
        </div>
      ),
      variant: "default",
    });
  };

  const removeFromCart = (giftId: string) => {
    setCart(prev => prev.filter(item => item.id !== giftId));
  };

  const updateQuantity = (giftId: string, delta: number) => {
    setCart(prev =>
      prev.map(item => {
        if (item.id === giftId) {
          const newQuantity = Math.max(1, item.quantity + delta);
          return { ...item, quantity: newQuantity };
        }
        return item;
      })
    );
  };

  const getTotalPrice = () => {
    return cart.reduce((total, item) => total + (item.price * item.quantity), 0);
  };

  const getTotalItems = () => {
    return cart.reduce((total, item) => total + item.quantity, 0);
  };

  const handleCheckout = async () => {
    if (selectedPaymentMethod === 'coins') {
      if (getTotalPrice() > balance) {
        toast({
          title: "Insufficient Balance",
          description: (
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-red-500" />
              <span>Please purchase more coins to complete this purchase.</span>
            </div>
          ),
          variant: "destructive",
        });
        return;
      }

      setIsProcessing(true);
      
      try {
        // Simulate API call
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        const newBalance = balance - getTotalPrice();
        await updateBalance(newBalance);
        
        // Add purchased gifts to inventory
        for (const item of cart) {
          const gift = gifts.find(g => g.id === item.id);
          if (gift) {
            await supabase.rpc('add_gift_to_inventory', {
              p_user_id: user?.id,
              p_gift_id: gift.id,
              p_gift_name: gift.name,
              p_gift_icon: gift.icon,
              p_gift_rarity: gift.rarity,
              p_quantity: item.quantity,
              p_source: 'purchase',
              p_source_details: { purchase_price: gift.price, quantity: item.quantity }
            });
          }
        }
        
        // Add to gift history
        const purchase = {
          id: Date.now().toString(),
          items: cart,
          total: getTotalPrice(),
          date: new Date(),
          status: 'completed',
          added_to_inventory: true
        };
        setGiftHistory(prev => [purchase, ...prev]);
        
        setCart([]);
        setShowCart(false);
        setShowCheckout(false);
        
        toast({
          title: "Purchase Successful!",
          description: (
            <div className="flex items-center gap-2">
              <Heart className="w-4 h-4 text-pink-500 animate-pulse" />
              <span>Your gifts have been sent! 🎁</span>
            </div>
          ),
          variant: "default",
        });
        
        // Show gift animations
        cart.forEach(item => {
          for (let i = 0; i < item.quantity; i++) {
            setTimeout(() => {
              const giftElement = document.createElement('div');
              giftElement.className = 'fixed inset-0 pointer-events-none flex items-center justify-center z-50';
              giftElement.innerHTML = `
                <div class="text-9xl animate-bounce" style="filter: drop-shadow(0 0 20px ${item.color});">
                  ${item.icon}
                </div>
              `;
              document.body.appendChild(giftElement);
              
              setTimeout(() => {
                document.body.removeChild(giftElement);
              }, 2000);
            }, i * 300);
          }
        });
      } catch (error) {
        toast({
          title: "Purchase Failed",
          description: "There was an error processing your purchase. Please try again.",
          variant: "destructive",
        });
      } finally {
        setIsProcessing(false);
      }
    } else if (selectedPaymentMethod === 'mobile_money') {
      // Calculate coins needed for purchase
      const coinsNeeded = getTotalPrice();
      setCoinsNeeded(coinsNeeded);
      setShowCheckout(false);
      setShowMobileMoneyPayment(true);
    }
  };

  const handleMobileMoneySuccess = async (transaction: any) => {
    // Credit user coins after successful mobile money payment
    try {
      const response = await fetch('/api/payments/verify/' + transaction.transaction_id, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' }
      });
      
      if (response.ok) {
        const newBalance = balance + coinsNeeded;
        await updateBalance(newBalance);
        
        // Process the original gift purchase
        setIsProcessing(true);
        
        // Simulate API call for gift purchase
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        const finalBalance = newBalance - getTotalPrice();
        await updateBalance(finalBalance);
        
        // Add purchased gifts to inventory
        for (const item of cart) {
          const gift = gifts.find(g => g.id === item.id);
          if (gift) {
            await supabase.rpc('add_gift_to_inventory', {
              p_user_id: user?.id,
              p_gift_id: gift.id,
              p_gift_name: gift.name,
              p_gift_icon: gift.icon,
              p_gift_rarity: gift.rarity,
              p_quantity: item.quantity,
              p_source: 'purchase',
              p_source_details: { purchase_price: gift.price, quantity: item.quantity, payment_method: 'mobile_money' }
            });
          }
        }
        
        // Add to gift history
        const purchase = {
          id: Date.now().toString(),
          items: cart,
          total: getTotalPrice(),
          date: new Date(),
          status: 'completed',
          paymentMethod: 'Mobile Money',
          added_to_inventory: true
        };
        setGiftHistory(prev => [purchase, ...prev]);
        
        setCart([]);
        setShowMobileMoneyPayment(false);
        setCoinsNeeded(0);
        
        toast({
          title: "Purchase Successful!",
          description: (
            <div className="flex items-center gap-2">
              <Heart className="w-4 h-4 text-pink-500 animate-pulse" />
              <span>Your gifts have been sent! 🎁</span>
            </div>
          ),
          variant: "default",
        });
        
        // Show gift animations
        cart.forEach(item => {
          for (let i = 0; i < item.quantity; i++) {
            setTimeout(() => {
              const giftElement = document.createElement('div');
              giftElement.className = 'fixed inset-0 pointer-events-none flex items-center justify-center z-50';
              giftElement.innerHTML = `
                <div class="text-9xl animate-bounce" style="filter: drop-shadow(0 0 20px ${item.color});">
                  ${item.icon}
                </div>
              `;
              document.body.appendChild(giftElement);
              
              setTimeout(() => {
                document.body.removeChild(giftElement);
              }, 2000);
            }, i * 300);
          }
        });
        
        setIsProcessing(false);
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to verify payment. Please contact support.",
        variant: "destructive",
      });
      setIsProcessing(false);
    }
  };

  const handleMobileMoneyError = (error: string) => {
    toast({
      title: "Payment Failed",
      description: error,
      variant: "destructive",
    });
    setShowMobileMoneyPayment(false);
    setCoinsNeeded(0);
  };

  const handleQuickView = (gift: Gift) => {
    setSelectedGift(gift);
    setShowQuickView(true);
  };

  const handleSendGift = (gift: Gift, recipientId?: string) => {
    // In real app, open recipient selector
    if (!recipientId) {
      // Navigate to chat or recipient selection
      navigate('/chat');
    }
  };

  const getDiscountedPrice = (gift: Gift) => {
    if (gift.discount) {
      return gift.price * (1 - gift.discount / 100);
    }
    return gift.price;
  };

  if (!user) return null;

  return (
    <AuthGuard>
      <div className="min-h-screen bg-gradient-to-br from-pink-50 via-red-50 to-purple-50">
        {/* Floating hearts background - FIXED */}
        <div className="fixed inset-0 pointer-events-none overflow-hidden">
          {[...Array(8)].map((_, i) => (
            <motion.div
              key={i}
              className="absolute text-pink-200/20"
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
              }}
              initial={{ 
                scale: 0.5 + Math.random() * 0.5,
                opacity: 0.1,
                y: 0
              }}
              animate={{ 
                y: [-100, 0, -100],
                opacity: [0.1, 0.2, 0.1],
              }}
              transition={{ 
                duration: 15 + Math.random() * 15,
                repeat: Number.POSITIVE_INFINITY,
                repeatType: "loop",
                ease: "linear",
                delay: Math.random() * 5
              }}
            >
              <Heart className="w-6 h-6" />
            </motion.div>
          ))}
        </div>

        {/* Header */}
        <div className="sticky top-0 z-10 bg-white/80 backdrop-blur-md border-b border-pink-200">
          <div className="container mx-auto px-4 py-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div className="flex items-center gap-4">
                <Button
                  onClick={() => navigate(-1)}
                  variant="ghost"
                  size="sm"
                  className="text-pink-600 hover:text-pink-700 hover:bg-pink-50"
                >
                  <ChevronLeft className="w-5 h-5" />
                </Button>
                <div>
                  <h1 className="text-xl font-semibold bg-gradient-to-r from-pink-600 to-purple-600 bg-clip-text text-transparent">
                    LoveX Gift Store
                  </h1>
                  <p className="text-sm text-pink-500">Send virtual gifts to show you care</p>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2 sm:gap-4">
                {/* Balance Display */}
                <motion.div 
                  className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-pink-500 via-red-500 to-purple-500 rounded-lg shadow-lg cursor-pointer"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => navigate('/wallet')}
                >
                  <Coins className="w-5 h-5 text-yellow-300" />
                  <div>
                    <span className="text-xs text-white/80">Balance</span>
                    <p className="font-semibold text-white">{balance.toLocaleString()} LX</p>
                  </div>
                </motion.div>

                {/* Cart Button */}
                <Button
                  onClick={() => setShowCart(!showCart)}
                  variant="outline"
                  size="sm"
                  className="relative border-pink-300 text-pink-600 hover:bg-pink-50"
                >
                  <ShoppingCart className="w-4 h-4 mr-2" />
                  Cart
                  {getTotalItems() > 0 && (
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      className="absolute -top-2 -right-2"
                    >
                      <Badge className="bg-gradient-to-r from-pink-500 to-red-500 text-white border-0">
                        {getTotalItems()}
                      </Badge>
                    </motion.div>
                  )}
                </Button>

                {/* History Button */}
                <Button
                  onClick={() => setShowHistory(!showHistory)}
                  variant="outline"
                  size="sm"
                  className="border-pink-300 text-pink-600 hover:bg-pink-50"
                >
                  <Clock className="w-4 h-4 mr-2" />
                  History
                </Button>

                {/* Inventory Button */}
                <Link to="/gift-inventory">
                  <Button
                    variant="outline"
                    size="sm"
                    className="border-purple-300 text-purple-600 hover:bg-purple-50"
                  >
                    <Package className="w-4 h-4 mr-2" />
                    Inventory
                  </Button>
                </Link>

                {/* Buy Coins Button */}
                <Link to="/wallet">
                  <motion.div
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <Button
                      size="sm"
                      className="bg-gradient-to-r from-yellow-500 to-amber-600 text-white hover:from-yellow-600 hover:to-amber-700"
                    >
                      <Coins className="w-4 h-4 mr-2" />
                      Buy Coins
                    </Button>
                  </motion.div>
                </Link>
              </div>
            </div>
          </div>
        </div>

        <div className="container mx-auto px-4 py-6">
          {/* Search and Filters */}
          <motion.div 
            className="mb-6 space-y-4"
            initial={{ y: -20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.5 }}
          >
            <div className="flex flex-col md:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-pink-400" />
                <Input
                  placeholder="Search gifts by name, description, or tags..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 border-pink-200 focus:border-pink-400 focus:ring-pink-400"
                />
                {searchQuery && (
                  <Button
                    onClick={() => setSearchQuery('')}
                    variant="ghost"
                    size="sm"
                    className="absolute right-2 top-1/2 transform -translate-y-1/2 h-6 w-6 p-0 text-pink-400"
                  >
                    <X className="w-4 h-4" />
                  </Button>
                )}
              </div>
              
              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger className="w-[180px] border-pink-200 focus:ring-pink-400">
                  <SelectValue placeholder="Sort by" />
                </SelectTrigger>
                <SelectContent>
                  {sortOptions.map(option => (
                    <SelectItem key={option.key} value={option.key}>
                      <div className="flex items-center gap-2">
                        {option.icon}
                        <span>{option.label}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Button
                onClick={() => {
                  setSelectedCategory('all');
                  setSearchQuery('');
                  setPriceRange([0, 10000]);
                  setSelectedRarity('all');
                  setSortBy('popular');
                }}
                variant="outline"
                size="sm"
                className="border-pink-300 text-pink-600 hover:bg-pink-50"
              >
                <Filter className="w-4 h-4 mr-2" />
                Reset Filters
              </Button>
            </div>

            {/* Advanced Filters */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-white/50 backdrop-blur-sm rounded-lg border border-pink-200">
              <div>
                <label className="block text-sm font-medium text-pink-700 mb-2">
                  <span className="flex items-center gap-2">
                    <Coins className="w-4 h-4" />
                    Price Range: {priceRange[0]} - {priceRange[1]} LX
                  </span>
                </label>
                <Slider
                  value={priceRange}
                  onValueChange={(value) => setPriceRange(value as [number, number])}
                  max={10000}
                  min={0}
                  step={100}
                  className="w-full [&_.slider-track]:bg-pink-200 [&_.slider-range]:bg-gradient-to-r [&_.slider-range]:from-pink-500 [&_.slider-range]:to-purple-500"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-pink-700 mb-2">
                  <span className="flex items-center gap-2">
                    <Star className="w-4 h-4" />
                    Rarity
                  </span>
                </label>
                <Select value={selectedRarity} onValueChange={setSelectedRarity}>
                  <SelectTrigger className="border-pink-200 focus:ring-pink-400">
                    <SelectValue placeholder="Select rarity" />
                  </SelectTrigger>
                  <SelectContent>
                    {rarityOptions.map(option => (
                      <SelectItem key={option.key} value={option.key}>
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 rounded-full" style={{ background: option.gradient }} />
                          <span>{option.label}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="block text-sm font-medium text-pink-700 mb-2">
                  <span className="flex items-center gap-2">
                    <Heart className="w-4 h-4" />
                    Category
                  </span>
                </label>
                <div className="flex flex-wrap gap-2">
                  {categories.slice(0, 4).map(category => (
                    <Button
                      key={category.key}
                      onClick={() => setSelectedCategory(category.key)}
                      variant={selectedCategory === category.key ? 'default' : 'outline'}
                      size="sm"
                      className={`rounded-full ${
                        selectedCategory === category.key
                          ? 'bg-gradient-to-r from-pink-500 to-purple-500 text-white'
                          : 'border-pink-300 text-pink-600 hover:bg-pink-50'
                      }`}
                    >
                      {category.icon}
                      <span className="ml-2">{category.label}</span>
                      <Badge className="ml-2 bg-white/20 text-white border-0">
                        {category.count}
                      </Badge>
                    </Button>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>

          {/* Featured Gifts Carousel */}
          {selectedCategory === 'all' && (
            <motion.div 
              className="mb-8"
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.2 }}
            >
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold bg-gradient-to-r from-pink-600 to-purple-600 bg-clip-text text-transparent">
                  ✨ Featured Gifts
                </h2>
                <Button variant="ghost" size="sm" className="text-pink-600 hover:text-pink-700">
                  View All <ChevronRight className="w-4 h-4 ml-1" />
                </Button>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-4">
                {featuredGifts.map((gift, index) => (
                  <motion.div
                    key={gift.id}
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ duration: 0.3, delay: index * 0.05 }}
                    whileHover={{ y: -5, scale: 1.05 }}
                    onHoverStart={() => setHoveredGift(gift.id)}
                    onHoverEnd={() => setHoveredGift(null)}
                  >
                    <Card 
                      className="border-0 shadow-lg hover:shadow-2xl transition-all duration-300 overflow-hidden cursor-pointer bg-gradient-to-br from-white to-pink-50"
                      onClick={() => handleQuickView(gift)}
                    >
                      <CardContent className="p-4 text-center">
                        <div className="relative mb-3">
                          <motion.div 
                            className="w-16 h-16 mx-auto rounded-full flex items-center justify-center text-2xl"
                            style={{ 
                              background: getRarityGradient(gift.rarity),
                              boxShadow: hoveredGift === gift.id ? `0 0 20px ${gift.glowColor}` : 'none'
                            }}
                            animate={hoveredGift === gift.id ? {
                              scale: [1, 1.1, 1],
                              rotate: [0, 5, -5, 0]
                            } : {}}
                            transition={hoveredGift === gift.id ? {
                              duration: 0.5, 
                              repeat: Number.POSITIVE_INFINITY, 
                              repeatType: "loop"
                            } : {
                              duration: 0.5
                            }}
                          >
                            <div className="text-white">
                              {gift.icon}
                            </div>
                          </motion.div>
                          {gift.limited && (
                            <motion.div
                              initial={{ scale: 0 }}
                              animate={{ scale: 1 }}
                              className="absolute -top-2 -right-2"
                            >
                              <Badge className="bg-gradient-to-r from-red-500 to-pink-500 text-white border-0 text-xs animate-pulse">
                                Limited
                              </Badge>
                            </motion.div>
                          )}
                          {gift.animated && (
                            <motion.div
                              animate={{ rotate: 360 }}
                              transition={{ duration: 3, repeat: Number.POSITIVE_INFINITY, repeatType: "loop", ease: "linear" }}
                              className="absolute -top-1 -left-1"
                            >
                              <Sparkles className="w-4 h-4 text-yellow-500" />
                            </motion.div>
                          )}
                        </div>
                        <h3 className="font-medium text-sm text-gray-800 mb-1">{gift.name}</h3>
                        <div className="flex items-center justify-center gap-1">
                          <Coins className="w-3 h-3 text-yellow-500" />
                          <span className="font-bold text-sm text-gray-900">{gift.price}</span>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          )}

          {/* Category Tabs */}
          <Tabs value={selectedCategory} onValueChange={setSelectedCategory} className="mb-6">
            <TabsList className="w-full justify-start bg-pink-100/50 p-1 overflow-x-auto rounded-lg">
              {categories.map(category => (
                <TabsTrigger
                  key={category.key}
                  value={category.key}
                  className="flex items-center gap-2 data-[state=active]:bg-gradient-to-r data-[state=active]:from-pink-500 data-[state=active]:to-purple-500 data-[state=active]:text-white"
                >
                  {category.icon}
                  {category.label}
                  <Badge variant="secondary" className="ml-2 bg-white/20 text-current">
                    {category.count}
                  </Badge>
                </TabsTrigger>
              ))}
            </TabsList>
          </Tabs>

          {/* Results Info */}
          <div className="flex items-center justify-between mb-4">
            <p className="text-sm text-pink-500">
              Showing <span className="font-medium text-pink-700">{sortedGifts.length}</span> gifts
            </p>
            <div className="flex items-center gap-2 text-sm text-pink-500">
              <Sparkles className="w-4 h-4" />
              <span>Sorted by: {sortOptions.find(o => o.key === sortBy)?.label}</span>
            </div>
          </div>

          {/* Gifts Grid */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
            {sortedGifts.map((gift, index) => (
              <motion.div
                key={gift.id}
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ duration: 0.3, delay: index * 0.02 }}
                whileHover={{ y: -5, scale: 1.02 }}
                onHoverStart={() => setHoveredGift(gift.id)}
                onHoverEnd={() => setHoveredGift(null)}
              >
                <Card className="border-0 shadow-md hover:shadow-2xl transition-all duration-300 overflow-hidden group bg-white/80 backdrop-blur-sm">
                  <CardContent className="p-4">
                    {/* Gift Icon with Badges */}
                    <div className="relative mb-3">
                      <motion.div 
                        className="w-20 h-20 mx-auto rounded-full flex items-center justify-center text-3xl group-hover:scale-110 transition-transform duration-300"
                        style={{ 
                          background: getRarityGradient(gift.rarity),
                          boxShadow: hoveredGift === gift.id ? `0 0 30px ${gift.glowColor}` : 'none'
                        }}
                        animate={hoveredGift === gift.id ? {
                          scale: [1, 1.1, 1],
                          rotate: [0, 5, -5, 0]
                        } : {}}
                        transition={hoveredGift === gift.id ? {
                          duration: 0.5, 
                          repeat: Number.POSITIVE_INFINITY, 
                          repeatType: "loop"
                        } : {
                          duration: 0.5
                        }}
                      >
                        <div className="text-white">
                          {gift.icon}
                        </div>
                      </motion.div>
                      
                      {/* Badges */}
                      <div className="absolute top-0 left-0 flex flex-col gap-1">
                        {gift.new && (
                          <motion.div
                            initial={{ x: -50, opacity: 0 }}
                            animate={{ x: 0, opacity: 1 }}
                            transition={{ delay: 0.2 }}
                          >
                            <Badge className="bg-gradient-to-r from-blue-500 to-cyan-500 text-white border-0 text-xs">
                              NEW
                            </Badge>
                          </motion.div>
                        )}
                        {gift.popular && (
                          <motion.div
                            initial={{ x: -50, opacity: 0 }}
                            animate={{ x: 0, opacity: 1 }}
                            transition={{ delay: 0.3 }}
                          >
                            <Badge className="bg-gradient-to-r from-purple-500 to-pink-500 text-white border-0 text-xs">
                              🔥 Popular
                            </Badge>
                          </motion.div>
                        )}
                      </div>
                      
                      {gift.animated && (
                        <motion.div
                          animate={{ rotate: 360 }}
                          transition={{ duration: 3, repeat: Number.POSITIVE_INFINITY, repeatType: "loop", ease: "linear" }}
                          className="absolute -top-2 -right-2"
                        >
                          <Sparkles className="w-5 h-5 text-yellow-500" />
                        </motion.div>
                      )}
                    </div>

                    {/* Gift Info */}
                    <div className="text-center mb-3">
                      <h3 className="font-semibold text-gray-800 mb-1">{gift.name}</h3>
                      <p className="text-xs text-gray-500 line-clamp-2 mb-2">
                        {gift.description}
                      </p>
                      
                      {/* Rarity Badge */}
                      <Badge
                        className="text-xs"
                        style={{
                          background: getRarityBg(gift.rarity),
                          color: getRarityColor(gift.rarity)
                        }}
                      >
                        {gift.rarity.charAt(0).toUpperCase() + gift.rarity.slice(1)}
                      </Badge>
                    </div>

                    {/* Romantic Message (shown on hover) */}
                    <AnimatePresence>
                      {hoveredGift === gift.id && gift.romanticMessage && (
                        <motion.div
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -10 }}
                          className="absolute inset-0 bg-gradient-to-b from-transparent via-pink-500/90 to-pink-600/90 flex items-center justify-center p-4 text-center rounded-lg pointer-events-none"
                        >
                          <p className="text-white text-sm font-medium">
                            {gift.romanticMessage}
                          </p>
                        </motion.div>
                      )}
                    </AnimatePresence>

                    {/* Price and Actions */}
                    <div className="flex items-center justify-between mt-2">
                      <div className="flex items-center gap-1">
                        <Coins className="w-4 h-4 text-yellow-500" />
                        <span className="font-bold text-gray-900">
                          {gift.discount ? (
                            <>
                              <span className="line-through text-gray-400 text-xs mr-1">
                                {gift.price}
                              </span>
                              <span className="text-pink-600">{getDiscountedPrice(gift)}</span>
                            </>
                          ) : (
                            gift.price
                          )}
                        </span>
                      </div>
                      
                      <div className="flex gap-1">
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                onClick={() => handleQuickView(gift)}
                                size="sm"
                                variant="ghost"
                                className="h-8 w-8 p-0 text-pink-500 hover:text-pink-600 hover:bg-pink-50"
                              >
                                <Info className="w-4 h-4" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>Quick View</p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>

                        <motion.div
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.9 }}
                        >
                          <Button
                            onClick={() => addToCart(gift)}
                            size="sm"
                            className="h-8 w-8 p-0 bg-gradient-to-r from-pink-500 to-purple-500 text-white hover:from-pink-600 hover:to-purple-600"
                          >
                            <Plus className="w-4 h-4" />
                          </Button>
                        </motion.div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>

          {/* Empty State */}
          {sortedGifts.length === 0 && (
            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              className="text-center py-12"
            >
              <motion.div
                animate={{ 
                  scale: [1, 1.1, 1],
                  rotate: [0, 5, -5, 0]
                }}
                transition={{ duration: 2, repeat: Number.POSITIVE_INFINITY, repeatType: "loop" }}
                className="w-20 h-20 mx-auto mb-4 rounded-full bg-gradient-to-r from-pink-200 to-purple-200 flex items-center justify-center"
              >
                <Heart className="w-10 h-10 text-pink-500" />
              </motion.div>
              <h3 className="text-lg font-semibold text-gray-800 mb-2">
                No gifts found
              </h3>
              <p className="text-gray-500 mb-4">
                Try adjusting your search or filters
              </p>
              <Button
                onClick={() => {
                  setSelectedCategory('all');
                  setSearchQuery('');
                  setPriceRange([0, 10000]);
                  setSelectedRarity('all');
                  setSortBy('popular');
                }}
                variant="outline"
                className="border-pink-300 text-pink-600 hover:bg-pink-50"
              >
                Reset Filters
              </Button>
            </motion.div>
          )}
        </div>

        {/* Shopping Cart Sidebar */}
        <AnimatePresence>
          {showCart && (
            <motion.div
              initial={{ x: 400 }}
              animate={{ x: 0 }}
              exit={{ x: 400 }}
              transition={{ type: 'spring', damping: 25 }}
              className="fixed right-0 top-0 h-full w-80 sm:w-96 bg-gradient-to-b from-white to-pink-50 shadow-2xl z-50 overflow-hidden flex flex-col"
            >
              <div className="p-4 border-b border-pink-200 bg-gradient-to-r from-pink-500 to-purple-500">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-semibold text-white">Shopping Cart</h3>
                    <p className="text-sm text-white/80">{getTotalItems()} items</p>
                  </div>
                  <Button
                    onClick={() => setShowCart(false)}
                    variant="ghost"
                    size="sm"
                    className="h-8 w-8 p-0 text-white hover:bg-white/20"
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto p-4">
                {cart.length === 0 ? (
                  <div className="text-center py-8">
                    <motion.div
                      animate={{ 
                        scale: [1, 1.1, 1],
                        rotate: [0, 5, -5, 0]
                      }}
                      transition={{ duration: 2, repeat: Number.POSITIVE_INFINITY, repeatType: "loop" }}
                    >
                      <ShoppingBasket className="w-12 h-12 mx-auto mb-4 text-pink-300" />
                    </motion.div>
                    <p className="text-gray-600">Your cart is empty</p>
                    <p className="text-sm text-pink-400 mt-2">
                      Add some gifts to get started
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {cart.map((item) => (
                      <motion.div
                        key={item.id}
                        layout
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        className="flex items-start gap-3 p-3 bg-white rounded-lg shadow-sm border border-pink-100"
                      >
                        <div className="w-12 h-12 rounded-full flex items-center justify-center text-2xl flex-shrink-0"
                             style={{ background: getRarityGradient(item.rarity) }}>
                          <div className="text-white">
                            {item.icon}
                          </div>
                        </div>
                        
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between">
                            <div>
                              <h4 className="font-medium text-gray-800">{item.name}</h4>
                              <p className="text-xs text-pink-500">{item.rarity}</p>
                            </div>
                            <Button
                              onClick={() => removeFromCart(item.id)}
                              variant="ghost"
                              size="sm"
                              className="h-6 w-6 p-0 text-pink-400 hover:text-pink-600"
                            >
                              <X className="w-3 h-3" />
                            </Button>
                          </div>
                          
                          <div className="flex items-center justify-between mt-2">
                            <div className="flex items-center gap-2">
                              <Button
                                onClick={() => updateQuantity(item.id, -1)}
                                variant="outline"
                                size="sm"
                                className="h-6 w-6 p-0 border-pink-200 text-pink-600 hover:bg-pink-50"
                                disabled={item.quantity <= 1}
                              >
                                <Minus className="w-3 h-3" />
                              </Button>
                              <span className="text-sm font-medium w-6 text-center text-gray-700">
                                {item.quantity}
                              </span>
                              <Button
                                onClick={() => updateQuantity(item.id, 1)}
                                variant="outline"
                                size="sm"
                                className="h-6 w-6 p-0 border-pink-200 text-pink-600 hover:bg-pink-50"
                              >
                                <Plus className="w-3 h-3" />
                              </Button>
                            </div>
                            
                            <div className="flex items-center gap-1">
                              <Coins className="w-3 h-3 text-yellow-500" />
                              <span className="font-medium text-sm text-gray-800">
                                {item.price * item.quantity}
                              </span>
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                )}
              </div>

              {cart.length > 0 && (
                <div className="p-4 border-t border-pink-200 bg-white">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-600">Subtotal</span>
                      <span className="font-medium text-gray-800">{getTotalPrice()} LX</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-600">Your Balance</span>
                      <span className="font-medium text-gray-800">{balance} LX</span>
                    </div>
                    <div className="flex items-center justify-between font-semibold">
                      <span className="text-gray-700">Total</span>
                      <span className={`${getTotalPrice() > balance ? 'text-red-500' : 'text-green-500'}`}>
                        {getTotalPrice()} LX
                      </span>
                    </div>
                    
                    {getTotalPrice() > balance && (
                      <motion.div 
                        className="flex items-center gap-2 p-2 bg-red-50 text-red-600 rounded-lg text-sm border border-red-200"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                      >
                        <AlertCircle className="w-4 h-4 flex-shrink-0" />
                        <span>Insufficient balance. Please purchase more coins.</span>
                      </motion.div>
                    )}

                    <div className="flex gap-2">
                      <motion.div className="flex-1" whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                        <Button
                          onClick={() => setShowCheckout(true)}
                          disabled={getTotalPrice() > balance}
                          className="w-full bg-gradient-to-r from-pink-500 to-purple-500 text-white hover:from-pink-600 hover:to-purple-600 disabled:opacity-50"
                        >
                          Checkout
                          <ArrowRight className="w-4 h-4 ml-2" />
                        </Button>
                      </motion.div>
                      <Link to="/wallet" className="flex-1">
                        <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                          <Button
                            variant="outline"
                            className="w-full border-pink-300 text-pink-600 hover:bg-pink-50"
                          >
                            <Coins className="w-4 h-4 mr-2" />
                            Buy Coins
                          </Button>
                        </motion.div>
                      </Link>
                    </div>
                  </div>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Quick View Modal */}
        <AnimatePresence>
          {showQuickView && selectedGift && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
              onClick={() => setShowQuickView(false)}
            >
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                className="bg-gradient-to-b from-white to-pink-50 rounded-xl p-6 max-w-lg mx-4 w-full border-2 border-pink-200"
                onClick={e => e.stopPropagation()}
              >
                <div className="flex items-start gap-4">
                  <motion.div 
                    className="w-20 h-20 rounded-full flex items-center justify-center text-4xl flex-shrink-0"
                    style={{ background: getRarityGradient(selectedGift.rarity) }}
                    animate={{ 
                      scale: [1, 1.1, 1],
                      rotate: [0, 5, -5, 0]
                    }}
                    transition={{ duration: 2, repeat: Number.POSITIVE_INFINITY, repeatType: "loop" }}
                  >
                    <div className="text-white">
                      {selectedGift.icon}
                    </div>
                  </motion.div>
                  <div className="flex-1">
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="text-xl font-bold bg-gradient-to-r from-pink-600 to-purple-600 bg-clip-text text-transparent">
                          {selectedGift.name}
                        </h3>
                        <Badge
                          className="mt-1"
                          style={{
                            background: getRarityBg(selectedGift.rarity),
                            color: getRarityColor(selectedGift.rarity)
                          }}
                        >
                          {selectedGift.rarity}
                        </Badge>
                      </div>
                      <Button
                        onClick={() => setShowQuickView(false)}
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 p-0 text-pink-500 hover:text-pink-600"
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </div>

                <div className="mt-4">
                  <p className="text-gray-600">{selectedGift.description}</p>
                </div>

                {selectedGift.romanticMessage && (
                  <motion.div 
                    className="mt-4 p-3 bg-gradient-to-r from-pink-100 to-purple-100 rounded-lg"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                  >
                    <p className="text-pink-700 text-sm italic">
                      "{selectedGift.romanticMessage}"
                    </p>
                  </motion.div>
                )}

                <div className="mt-4 flex flex-wrap gap-2">
                  {selectedGift.tags.map(tag => (
                    <Badge key={tag} variant="secondary" className="bg-pink-100 text-pink-700">
                      #{tag}
                    </Badge>
                  ))}
                </div>

                <div className="mt-6 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Coins className="w-5 h-5 text-yellow-500" />
                    <span className="text-2xl font-bold text-gray-800">
                      {selectedGift.price} LX
                    </span>
                  </div>
                  
                  <div className="flex gap-2">
                    <Button
                      onClick={() => {
                        addToCart(selectedGift);
                        setShowQuickView(false);
                      }}
                      variant="outline"
                      className="border-pink-300 text-pink-600 hover:bg-pink-50"
                    >
                      Add to Cart
                    </Button>
                    <Button
                      onClick={() => {
                        handleSendGift(selectedGift);
                        setShowQuickView(false);
                      }}
                      className="bg-gradient-to-r from-pink-500 to-purple-500 text-white hover:from-pink-600 hover:to-purple-600"
                    >
                      Send Gift
                      <ArrowRight className="w-4 h-4 ml-2" />
                    </Button>
                  </div>
                </div>

                {selectedGift.animated && (
                  <motion.div 
                    className="mt-4 p-3 bg-purple-50 rounded-lg flex items-center gap-2 border border-purple-200"
                    animate={{ 
                      boxShadow: ['0 0 0 rgba(168,85,247,0.4)', '0 0 20px rgba(168,85,247,0.4)', '0 0 0 rgba(168,85,247,0.4)']
                    }}
                    transition={{ duration: 2, repeat: Number.POSITIVE_INFINITY, repeatType: "loop" }}
                  >
                    <Sparkles className="w-4 h-4 text-purple-600" />
                    <span className="text-sm text-purple-700">
                      This gift has a special animation when sent!
                    </span>
                  </motion.div>
                )}
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Checkout Modal */}
        <AnimatePresence>
          {showCheckout && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
              onClick={() => setShowCheckout(false)}
            >
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                className="bg-gradient-to-b from-white to-pink-50 rounded-xl p-6 max-w-md mx-4 w-full border-2 border-pink-200"
                onClick={e => e.stopPropagation()}
              >
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold bg-gradient-to-r from-pink-600 to-purple-600 bg-clip-text text-transparent">
                    Complete Purchase
                  </h3>
                  <Button
                    onClick={() => setShowCheckout(false)}
                    variant="ghost"
                    size="sm"
                    className="h-8 w-8 p-0 text-pink-500 hover:text-pink-600"
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>

                <div className="space-y-4 mb-6">
                  <div className="bg-white/50 p-4 rounded-lg border border-pink-200">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm text-gray-600">Items ({getTotalItems()})</span>
                      <span className="font-medium text-gray-800">{getTotalPrice()} LX</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Your Balance</span>
                      <span className="font-medium text-gray-800">{balance} LX</span>
                    </div>
                    <div className="border-t border-pink-200 mt-2 pt-2 flex items-center justify-between font-semibold">
                      <span className="text-gray-700">Total</span>
                      <span className={getTotalPrice() > balance ? 'text-red-500' : 'text-green-500'}>
                        {getTotalPrice()} LX
                      </span>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-pink-700 mb-2">
                      Payment Method
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      <Button
                        onClick={() => setSelectedPaymentMethod('coins')}
                        variant={selectedPaymentMethod === 'coins' ? 'default' : 'outline'}
                        className={selectedPaymentMethod === 'coins' ? 'bg-gradient-to-r from-pink-500 to-purple-500 text-white' : 'border-pink-300 text-pink-600 hover:bg-pink-50'}
                      >
                        <Coins className="w-4 h-4 mr-2" />
                        LX Coins
                      </Button>
                      <Button
                        onClick={() => setSelectedPaymentMethod('mobile_money')}
                        variant={selectedPaymentMethod === 'mobile_money' ? 'default' : 'outline'}
                        className={selectedPaymentMethod === 'mobile_money' ? 'bg-gradient-to-r from-pink-500 to-purple-500 text-white' : 'border-pink-300 text-pink-600 hover:bg-pink-50'}
                      >
                        <Smartphone className="w-4 h-4 mr-2" />
                        Mobile Money
                      </Button>
                      <Button
                        onClick={() => setSelectedPaymentMethod('card')}
                        variant={selectedPaymentMethod === 'card' ? 'default' : 'outline'}
                        className={selectedPaymentMethod === 'card' ? 'bg-gradient-to-r from-pink-500 to-purple-500 text-white' : 'border-pink-300 text-pink-600 hover:bg-pink-50'}
                      >
                        <CreditCard className="w-4 h-4 mr-2" />
                        Credit Card
                      </Button>
                      <Button
                        onClick={() => setSelectedPaymentMethod('crypto')}
                        variant={selectedPaymentMethod === 'crypto' ? 'default' : 'outline'}
                        className={selectedPaymentMethod === 'crypto' ? 'bg-gradient-to-r from-pink-500 to-purple-500 text-white' : 'border-pink-300 text-pink-600 hover:bg-pink-50'}
                      >
                        <Bitcoin className="w-4 h-4 mr-2" />
                        Crypto
                      </Button>
                      <Button
                        onClick={() => setSelectedPaymentMethod('bank')}
                        variant={selectedPaymentMethod === 'bank' ? 'default' : 'outline'}
                        className={selectedPaymentMethod === 'bank' ? 'bg-gradient-to-r from-pink-500 to-purple-500 text-white' : 'border-pink-300 text-pink-600 hover:bg-pink-50'}
                      >
                        <Building2 className="w-4 h-4 mr-2" />
                        Bank Transfer
                      </Button>
                    </div>
                  </div>

                  {/* Payment Details Form */}
                  {selectedPaymentMethod && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="space-y-4"
                    >
                      {/* Mobile Money Form */}
                      {selectedPaymentMethod === 'mobile_money' && (
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
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                              />
                            </div>
                            <div>
                              <label className="block text-sm font-medium mb-2 text-gray-700">
                                Network Provider
                              </label>
                              <select className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent">
                                <option value="mtn">MTN MoMo</option>
                                <option value="airtel">Airtel Money</option>
                                <option value="mpesa">M-Pesa</option>
                              </select>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Credit Card Form */}
                      {selectedPaymentMethod === 'card' && (
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
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
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
                                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                                />
                              </div>
                              <div>
                                <label className="block text-sm font-medium mb-2 text-gray-700">
                                  CVV
                                </label>
                                <input
                                  type="text"
                                  placeholder="123"
                                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
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
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                              />
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Crypto Form */}
                      {selectedPaymentMethod === 'crypto' && (
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
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                            />
                          </div>
                        </div>
                      )}

                      {/* Bank Transfer Form */}
                      {selectedPaymentMethod === 'bank' && (
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
                                <span className="font-medium text-pink-600">LX{user?.id?.slice(-8) || 'GIFT'}</span>
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
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                              />
                            </div>
                          </div>
                        </div>
                      )}
                    </motion.div>
                  )}
                </div>

                <div className="flex gap-3">
                  <Button
                    onClick={() => setShowCheckout(false)}
                    variant="outline"
                    className="flex-1 border-pink-300 text-pink-600 hover:bg-pink-50"
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={handleCheckout}
                    disabled={isProcessing || getTotalPrice() > balance}
                    className="flex-1 bg-gradient-to-r from-pink-500 to-purple-500 text-white hover:from-pink-600 hover:to-purple-600 disabled:opacity-50"
                  >
                    {isProcessing ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Processing...
                      </>
                    ) : (
                      'Confirm Purchase'
                    )}
                  </Button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Mobile Money Payment Modal */}
        <AnimatePresence>
          {showMobileMoneyPayment && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
              onClick={() => {
                setShowMobileMoneyPayment(false);
                setCoinsNeeded(0);
              }}
            >
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                className="w-full max-w-md mx-4"
                onClick={e => e.stopPropagation()}
              >
                <MobileMoneyPayment
                  amount={Math.ceil(coinsNeeded / 10)} // Convert coins to currency (10 coins = 1 RWF)
                  currency="RWF"
                  onSuccess={handleMobileMoneySuccess}
                  onError={handleMobileMoneyError}
                  onClose={() => {
                    setShowMobileMoneyPayment(false);
                    setCoinsNeeded(0);
                  }}
                />
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Gift History Sidebar */}
        <AnimatePresence>
          {showHistory && (
            <motion.div
              initial={{ x: 400 }}
              animate={{ x: 0 }}
              exit={{ x: 400 }}
              transition={{ type: 'spring', damping: 25 }}
              className="fixed right-0 top-0 h-full w-80 sm:w-96 bg-gradient-to-b from-white to-pink-50 shadow-2xl z-50 overflow-hidden flex flex-col"
            >
              <div className="p-4 border-b border-pink-200 bg-gradient-to-r from-pink-500 to-purple-500">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-semibold text-white">Gift History</h3>
                    <p className="text-sm text-white/80">Your recent purchases</p>
                  </div>
                  <Button
                    onClick={() => setShowHistory(false)}
                    variant="ghost"
                    size="sm"
                    className="h-8 w-8 p-0 text-white hover:bg-white/20"
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto p-4">
                {giftHistory.length === 0 ? (
                  <div className="text-center py-8">
                    <motion.div
                      animate={{ 
                        rotate: [0, 360],
                        scale: [1, 1.1, 1]
                      }}
                      transition={{ duration: 3, repeat: Number.POSITIVE_INFINITY, repeatType: "loop" }}
                    >
                      <Clock className="w-12 h-12 mx-auto mb-4 text-pink-300" />
                    </motion.div>
                    <p className="text-gray-600">No purchase history yet</p>
                    <p className="text-sm text-pink-400 mt-2">
                      Your gifts will appear here
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {giftHistory.map((purchase) => (
                      <motion.div
                        key={purchase.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="bg-white rounded-lg p-4 shadow-sm border border-pink-100"
                      >
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm font-medium text-gray-800">
                            {purchase.date.toLocaleDateString()}
                          </span>
                          <Badge className="bg-green-100 text-green-700 border-0">
                            {purchase.status}
                          </Badge>
                        </div>
                        <div className="space-y-2">
                          {purchase.items.map((item: any, i: number) => (
                            <div key={i} className="flex items-center justify-between text-sm">
                              <span className="text-gray-600">
                                {item.name} x{item.quantity}
                              </span>
                              <span className="font-medium text-gray-800">
                                {item.price * item.quantity} LX
                              </span>
                            </div>
                          ))}
                        </div>
                        <div className="border-t border-pink-100 mt-2 pt-2 flex items-center justify-between">
                          <span className="text-sm font-medium text-gray-700">Total</span>
                          <span className="font-bold text-pink-600">{purchase.total} LX</span>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </AuthGuard>
  );
};

export default Gifts;
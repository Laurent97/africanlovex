import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Gift, 
  Coins, 
  Package, 
  ShoppingCart, 
  X, 
  ArrowRight,
  Crown,
  Star,
  Diamond,
  Flame,
  Sparkles,
  TrendingUp,
  Clock,
  Heart,
  Send
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAuth } from '@/hooks/use-auth';
import { supabase } from '@/lib/supabase';
import { useNavigate } from 'react-router-dom';

interface GiftInventoryItem {
  id: string;
  gift_id: string;
  gift_name: string;
  gift_icon: string;
  gift_rarity: 'common' | 'rare' | 'epic' | 'legendary' | 'mythic';
  quantity: number;
  purchase_date: string;
  source: 'purchase' | 'received' | 'bonus';
  is_locked: boolean;
  lock_expires_at?: string;
}

interface GiftInventoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  context?: 'live-stream' | 'default'; // Add context prop
}

const GiftInventoryModal: React.FC<GiftInventoryModalProps> = ({ isOpen, onClose, context = 'default' }) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [inventory, setInventory] = useState<GiftInventoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [userCoins, setUserCoins] = useState(0);

  const loadInventory = useCallback(async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('user_gift_inventory')
        .select('*')
        .eq('user_id', user.id)
        .order('purchase_date', { ascending: false });

      if (error) throw error;
      setInventory(data || []);
    } catch (error) {
      console.error('Error loading inventory:', error);
    } finally {
      setLoading(false);
    }
  }, [user]);

  const loadUserCoins = useCallback(async () => {
    if (!user) return;
    
    try {
      const { data } = await supabase
        .from('profiles')
        .select('coins_balance')
        .eq('id', user.id)
        .single();

      setUserCoins(data?.coins_balance || 0);
    } catch (error) {
      console.error('Error loading coins:', error);
    }
  }, [user]);

  useEffect(() => {
    if (isOpen && user) {
      loadInventory();
      loadUserCoins();
    }
  }, [isOpen, user, loadInventory, loadUserCoins]);

  const getRarityColor = (rarity: string) => {
    switch (rarity) {
      case 'common': return 'bg-gray-500';
      case 'rare': return 'bg-blue-500';
      case 'epic': return 'bg-purple-500';
      case 'legendary': return 'bg-orange-500';
      case 'mythic': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  const getRarityIcon = (rarity: string) => {
    switch (rarity) {
      case 'common': return <Star className="w-4 h-4" />;
      case 'rare': return <Diamond className="w-4 h-4" />;
      case 'epic': return <Crown className="w-4 h-4" />;
      case 'legendary': return <Flame className="w-4 h-4" />;
      case 'mythic': return <Sparkles className="w-4 h-4" />;
      default: return <Gift className="w-4 h-4" />;
    }
  };

  const totalGifts = inventory.reduce((sum, item) => sum + item.quantity, 0);
  const unlockedGifts = inventory.filter(item => !item.is_locked);

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className={`fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 ${
          context === 'live-stream' ? 'z-[60]' : 'z-50'
        }`}
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          className={`bg-white dark:bg-gray-900 rounded-2xl w-full ${
            context === 'live-stream' ? 'max-w-3xl max-h-[80vh]' : 'max-w-4xl max-h-[90vh]'
          } overflow-hidden`}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="p-6 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-gradient-to-r from-rose-500 to-pink-500 flex items-center justify-center">
                  <Gift className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-gray-900 dark:text-white">My Gift Inventory</h2>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {totalGifts} total gifts • {userCoins.toLocaleString()} coins
                  </p>
                </div>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={onClose}
                className="rounded-full"
              >
                <X className="w-5 h-5" />
              </Button>
            </div>
          </div>

          {/* Content */}
          <div className={`p-6 overflow-y-auto ${
            context === 'live-stream' ? 'max-h-[50vh]' : 'max-h-[60vh]'
          }`}>
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <div className="w-8 h-8 border-2 border-rose-200 border-t-rose-500 rounded-full animate-spin" />
              </div>
            ) : inventory.length === 0 ? (
              <div className="text-center py-12">
                <div className="w-24 h-24 mx-auto mb-4 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
                  <Package className="w-12 h-12 text-gray-400" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                  No Gifts Yet
                </h3>
                <p className="text-gray-500 dark:text-gray-400 mb-6">
                  Start your collection by purchasing some amazing gifts!
                </p>
                <Button
                  onClick={() => {
                    onClose();
                    navigate('/gifts');
                  }}
                  className="bg-gradient-to-r from-rose-500 to-pink-500 text-white rounded-full"
                >
                  <ShoppingCart className="w-4 h-4 mr-2" />
                  Buy Gifts
                </Button>
              </div>
            ) : (
              <Tabs defaultValue="all" className="w-full">
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="all">All Gifts ({totalGifts})</TabsTrigger>
                  <TabsTrigger value="unlocked">Unlocked ({unlockedGifts.length})</TabsTrigger>
                  <TabsTrigger value="locked">Locked</TabsTrigger>
                </TabsList>

                <TabsContent value="all" className="mt-6">
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                    {inventory.map((item) => (
                      <Card key={item.id} className="relative overflow-hidden">
                        <CardContent className="p-4">
                          <div className="relative mb-3">
                            <div className="w-16 h-16 mx-auto rounded-lg bg-gradient-to-br from-rose-100 to-pink-100 dark:from-rose-900/20 dark:to-pink-900/20 flex items-center justify-center text-2xl">
                              {item.gift_icon}
                            </div>
                            {item.is_locked && (
                              <div className="absolute inset-0 bg-black/50 rounded-lg flex items-center justify-center">
                                <Clock className="w-6 h-6 text-white" />
                              </div>
                            )}
                            <Badge 
                              className={`absolute top-0 right-0 ${getRarityColor(item.gift_rarity)} text-white text-xs`}
                            >
                              {getRarityIcon(item.gift_rarity)}
                            </Badge>
                          </div>
                          
                          <h4 className="font-semibold text-sm text-gray-900 dark:text-white mb-1">
                            {item.gift_name}
                          </h4>
                          <div className="flex items-center justify-between">
                            <span className="text-lg font-bold text-rose-500">
                              {item.quantity}
                            </span>
                            <Button
                              size="sm"
                              variant="outline"
                              disabled={item.is_locked || item.quantity === 0}
                              className="text-xs"
                            >
                              <Send className="w-3 h-3" />
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </TabsContent>

                <TabsContent value="unlocked" className="mt-6">
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                    {unlockedGifts.map((item) => (
                      <Card key={item.id} className="relative overflow-hidden">
                        <CardContent className="p-4">
                          <div className="relative mb-3">
                            <div className="w-16 h-16 mx-auto rounded-lg bg-gradient-to-br from-rose-100 to-pink-100 dark:from-rose-900/20 dark:to-pink-900/20 flex items-center justify-center text-2xl">
                              {item.gift_icon}
                            </div>
                            <Badge 
                              className={`absolute top-0 right-0 ${getRarityColor(item.gift_rarity)} text-white text-xs`}
                            >
                              {getRarityIcon(item.gift_rarity)}
                            </Badge>
                          </div>
                          
                          <h4 className="font-semibold text-sm text-gray-900 dark:text-white mb-1">
                            {item.gift_name}
                          </h4>
                          <div className="flex items-center justify-between">
                            <span className="text-lg font-bold text-rose-500">
                              {item.quantity}
                            </span>
                            <Button
                              size="sm"
                              variant="outline"
                              disabled={item.quantity === 0}
                              className="text-xs"
                            >
                              <Send className="w-3 h-3" />
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </TabsContent>

                <TabsContent value="locked" className="mt-6">
                  <div className="text-center py-8">
                    <Clock className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-500 dark:text-gray-400">
                      Locked gifts will be available soon!
                    </p>
                  </div>
                </TabsContent>
              </Tabs>
            )}
          </div>

          {/* Footer */}
          <div className="p-6 border-t border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Coins className="w-5 h-5 text-yellow-500" />
                <span className="font-semibold text-gray-900 dark:text-white">
                  {userCoins.toLocaleString()} coins
                </span>
              </div>
              <Button
                onClick={() => {
                  onClose();
                  navigate('/gifts');
                }}
                className="bg-gradient-to-r from-rose-500 to-pink-500 text-white rounded-full"
              >
                <ShoppingCart className="w-4 h-4 mr-2" />
                Buy More Gifts
              </Button>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default GiftInventoryModal;

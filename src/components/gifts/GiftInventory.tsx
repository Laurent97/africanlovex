import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Package, 
  Gift, 
  Coins, 
  ArrowRight, 
  Send, 
  ArrowUpDown,
  Star,
  Crown,
  Diamond,
  Flame,
  Sparkles,
  X,
  Search,
  Filter,
  TrendingUp,
  Clock,
  Heart
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAuth } from '@/hooks/use-auth';
import { supabase } from '@/lib/supabase';

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

interface GiftTransaction {
  id: string;
  sender_id: string;
  receiver_id: string;
  gift_name: string;
  gift_icon: string;
  gift_rarity: string;
  quantity: number;
  context: 'chat' | 'live_stream' | 'profile';
  message?: string;
  is_anonymous: boolean;
  sent_at: string;
}

const GiftInventory: React.FC = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('inventory');
  const [inventory, setInventory] = useState<GiftInventoryItem[]>([]);
  const [transactions, setTransactions] = useState<GiftTransaction[]>([]);
  const [selectedGift, setSelectedGift] = useState<GiftInventoryItem | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRarity, setSelectedRarity] = useState<string>('all');
  const [showSendModal, setShowSendModal] = useState(false);
  const [showExchangeModal, setShowExchangeModal] = useState(false);
  const [exchangeAmount, setExchangeAmount] = useState(1);
  const [recipientId, setRecipientId] = useState('');
  const [giftMessage, setGiftMessage] = useState('');
  const [loading, setLoading] = useState(false);

  const loadInventory = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('gift_inventory')
        .select('*')
        .eq('user_id', user?.id)
        .order('purchase_date', { ascending: false });

      if (error) throw error;
      setInventory(data || []);
    } catch (error) {
      console.error('Error loading inventory:', error);
    }
  }, [user?.id]);

  const loadTransactions = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('gift_transactions')
        .select('*')
        .or(`sender_id.eq.${user?.id},receiver_id.eq.${user?.id}`)
        .order('sent_at', { ascending: false })
        .limit(50);

      if (error) throw error;
      setTransactions(data || []);
    } catch (error) {
      console.error('Error loading transactions:', error);
    }
  }, [user?.id]);

  useEffect(() => {
    if (user) {
      loadInventory();
      loadTransactions();
    }
  }, [user, loadInventory, loadTransactions]);

  const getRarityColor = (rarity: string) => {
    switch (rarity) {
      case 'common': return 'bg-gray-100 text-gray-800 border-gray-300';
      case 'rare': return 'bg-blue-100 text-blue-800 border-blue-300';
      case 'epic': return 'bg-purple-100 text-purple-800 border-purple-300';
      case 'legendary': return 'bg-yellow-100 text-yellow-800 border-yellow-300';
      case 'mythic': return 'bg-red-100 text-red-800 border-red-300';
      default: return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

  const getRarityGradient = (rarity: string) => {
    switch (rarity) {
      case 'common': return 'linear-gradient(135deg, #9CA3AF, #6B7280)';
      case 'rare': return 'linear-gradient(135deg, #3B82F6, #1D4ED8)';
      case 'epic': return 'linear-gradient(135deg, #8B5CF6, #6D28D9)';
      case 'legendary': return 'linear-gradient(135deg, #FCD34D, #F59E0B)';
      case 'mythic': return 'linear-gradient(135deg, #EF4444, #DC2626)';
      default: return 'linear-gradient(135deg, #9CA3AF, #6B7280)';
    }
  };

  const getExchangeRate = async (rarity: string) => {
    try {
      const { data, error } = await supabase
        .from('gift_exchange_rates')
        .select('exchange_rate, base_price')
        .eq('gift_rarity', rarity)
        .eq('is_active', true)
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error fetching exchange rate:', error);
      return { exchange_rate: 0.5, base_price: 100 };
    }
  };

  const sendGift = async () => {
    if (!selectedGift || !recipientId) return;

    setLoading(true);
    try {
      const { data, error } = await supabase.rpc('send_gift', {
        p_sender_id: user?.id,
        p_receiver_id: recipientId,
        p_gift_id: selectedGift.gift_id,
        p_quantity: 1,
        p_context: 'profile',
        p_context_details: {},
        p_message: giftMessage,
        p_is_anonymous: false
      });

      if (error) throw error;

      if (data) {
        setShowSendModal(false);
        setSelectedGift(null);
        setRecipientId('');
        setGiftMessage('');
        loadInventory();
        loadTransactions();
      }
    } catch (error) {
      console.error('Error sending gift:', error);
    } finally {
      setLoading(false);
    }
  };

  const exchangeGift = async () => {
    if (!selectedGift || exchangeAmount > selectedGift.quantity) return;

    setLoading(true);
    try {
      const { data, error } = await supabase.rpc('exchange_gift_for_coins', {
        p_user_id: user?.id,
        p_gift_id: selectedGift.gift_id,
        p_quantity: exchangeAmount
      });

      if (error) throw error;

      if (data > 0) {
        setShowExchangeModal(false);
        setSelectedGift(null);
        setExchangeAmount(1);
        loadInventory();
      }
    } catch (error) {
      console.error('Error exchanging gift:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredInventory = inventory.filter(item => {
    const matchesSearch = item.gift_name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesRarity = selectedRarity === 'all' || item.gift_rarity === selectedRarity;
    return matchesSearch && matchesRarity;
  });

  const totalValue = inventory.reduce((acc, item) => {
    const basePrice = item.gift_rarity === 'common' ? 50 : 
                     item.gift_rarity === 'rare' ? 100 :
                     item.gift_rarity === 'epic' ? 200 :
                     item.gift_rarity === 'legendary' ? 500 : 1000;
    return acc + (basePrice * item.quantity);
  }, 0);

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-purple-50 to-indigo-50 p-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="bg-white rounded-xl shadow-lg p-6 mb-6"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <Package className="w-8 h-8 text-purple-600" />
              <div>
                <h1 className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                  Gift Inventory
                </h1>
                <p className="text-gray-600">Manage your virtual gifts collection</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-sm text-gray-500">Total Value</p>
              <p className="text-2xl font-bold text-purple-600">{totalValue.toLocaleString()} LX</p>
            </div>
          </div>

          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="inventory">Inventory</TabsTrigger>
              <TabsTrigger value="transactions">Transactions</TabsTrigger>
              <TabsTrigger value="exchange">Exchange</TabsTrigger>
            </TabsList>

            <TabsContent value="inventory" className="space-y-4">
              {/* Search and Filters */}
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <Input
                    placeholder="Search gifts..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>
                <select
                  value={selectedRarity}
                  onChange={(e) => setSelectedRarity(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                >
                  <option value="all">All Rarities</option>
                  <option value="common">Common</option>
                  <option value="rare">Rare</option>
                  <option value="epic">Epic</option>
                  <option value="legendary">Legendary</option>
                  <option value="mythic">Mythic</option>
                </select>
              </div>

              {/* Inventory Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {filteredInventory.map((item, index) => (
                  <motion.div
                    key={item.id}
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: index * 0.05 }}
                    whileHover={{ y: -5, scale: 1.02 }}
                  >
                    <Card className="overflow-hidden hover:shadow-xl transition-all duration-300">
                      <CardHeader className="pb-3">
                        <div className="flex items-center justify-between">
                          <Badge className={getRarityColor(item.gift_rarity)}>
                            {item.gift_rarity}
                          </Badge>
                          <span className="text-2xl font-bold text-purple-600">
                            {item.quantity}
                          </span>
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        <div
                          className="w-16 h-16 mx-auto rounded-full flex items-center justify-center text-2xl"
                          style={{ background: getRarityGradient(item.gift_rarity) }}
                        >
                          <span className="text-white">{item.gift_icon}</span>
                        </div>
                        <h3 className="font-semibold text-center text-gray-800">
                          {item.gift_name}
                        </h3>
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            className="flex-1"
                            onClick={() => {
                              setSelectedGift(item);
                              setShowSendModal(true);
                            }}
                          >
                            <Send className="w-3 h-3 mr-1" />
                            Send
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            className="flex-1"
                            onClick={() => {
                              setSelectedGift(item);
                              setShowExchangeModal(true);
                            }}
                          >
                            <ArrowUpDown className="w-3 h-3 mr-1" />
                            Exchange
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
              </div>

              {filteredInventory.length === 0 && (
                <div className="text-center py-12">
                  <Package className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                  <h3 className="text-lg font-semibold text-gray-600 mb-2">No gifts found</h3>
                  <p className="text-gray-500">Start collecting gifts by purchasing or receiving them!</p>
                </div>
              )}
            </TabsContent>

            <TabsContent value="transactions" className="space-y-4">
              <div className="space-y-3">
                {transactions.map((transaction) => (
                  <motion.div
                    key={transaction.id}
                    initial={{ x: -20, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    className="bg-white rounded-lg p-4 shadow hover:shadow-md transition-shadow"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div
                          className="w-10 h-10 rounded-full flex items-center justify-center"
                          style={{ background: getRarityGradient(transaction.gift_rarity) }}
                        >
                          <span className="text-white text-sm">{transaction.gift_icon}</span>
                        </div>
                        <div>
                          <p className="font-semibold text-gray-800">{transaction.gift_name}</p>
                          <p className="text-sm text-gray-500">
                            {transaction.sender_id === user?.id ? 'Sent to' : 'Received from'} user
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <Badge className={getRarityColor(transaction.gift_rarity)}>
                          {transaction.gift_rarity}
                        </Badge>
                        <p className="text-xs text-gray-500 mt-1">
                          {new Date(transaction.sent_at).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    {transaction.message && (
                      <p className="text-sm text-gray-600 mt-2 italic">
                        "{transaction.message}"
                      </p>
                    )}
                  </motion.div>
                ))}
              </div>

              {transactions.length === 0 && (
                <div className="text-center py-12">
                  <Clock className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                  <h3 className="text-lg font-semibold text-gray-600 mb-2">No transactions yet</h3>
                  <p className="text-gray-500">Your gift transactions will appear here</p>
                </div>
              )}
            </TabsContent>

            <TabsContent value="exchange" className="space-y-4">
              <div className="bg-white rounded-lg p-6 shadow">
                <h3 className="text-lg font-semibold text-gray-800 mb-4">Exchange Rates</h3>
                <div className="space-y-3">
                  {[
                    { rarity: 'common', price: 50, rate: 40 },
                    { rarity: 'rare', price: 100, rate: 45 },
                    { rarity: 'epic', price: 200, rate: 50 },
                    { rarity: 'legendary', price: 500, rate: 55 },
                    { rarity: 'mythic', price: 1000, rate: 60 }
                  ].map((tier) => (
                    <div key={tier.rarity} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center gap-3">
                        <Badge className={getRarityColor(tier.rarity)}>
                          {tier.rarity}
                        </Badge>
                        <span className="text-sm text-gray-600">
                          Original: {tier.price} LX
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <ArrowRight className="w-4 h-4 text-gray-400" />
                        <span className="font-semibold text-green-600">
                          {Math.floor(tier.price * tier.rate / 100)} LX
                        </span>
                        <span className="text-xs text-gray-500">
                          ({tier.rate}%)
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </motion.div>
      </div>

      {/* Send Gift Modal */}
      <AnimatePresence>
        {showSendModal && selectedGift && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
            onClick={() => setShowSendModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-xl p-6 max-w-md w-full mx-4"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold">Send Gift</h3>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowSendModal(false)}
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>

              <div className="space-y-4">
                <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                  <div
                    className="w-12 h-12 rounded-full flex items-center justify-center"
                    style={{ background: getRarityGradient(selectedGift.gift_rarity) }}
                  >
                    <span className="text-white">{selectedGift.gift_icon}</span>
                  </div>
                  <div>
                    <p className="font-semibold">{selectedGift.gift_name}</p>
                    <Badge className={getRarityColor(selectedGift.gift_rarity)}>
                      {selectedGift.gift_rarity}
                    </Badge>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Recipient User ID</label>
                  <Input
                    placeholder="Enter user ID..."
                    value={recipientId}
                    onChange={(e) => setRecipientId(e.target.value)}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Message (optional)</label>
                  <textarea
                    placeholder="Add a personal message..."
                    value={giftMessage}
                    onChange={(e) => setGiftMessage(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    rows={3}
                  />
                </div>

                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    className="flex-1"
                    onClick={() => setShowSendModal(false)}
                  >
                    Cancel
                  </Button>
                  <Button
                    className="flex-1 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
                    onClick={sendGift}
                    disabled={!recipientId || loading}
                  >
                    {loading ? 'Sending...' : 'Send Gift'}
                  </Button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Exchange Gift Modal */}
      <AnimatePresence>
        {showExchangeModal && selectedGift && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
            onClick={() => setShowExchangeModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-xl p-6 max-w-md w-full mx-4"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold">Exchange for LX Coins</h3>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowExchangeModal(false)}
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>

              <div className="space-y-4">
                <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                  <div
                    className="w-12 h-12 rounded-full flex items-center justify-center"
                    style={{ background: getRarityGradient(selectedGift.gift_rarity) }}
                  >
                    <span className="text-white">{selectedGift.gift_icon}</span>
                  </div>
                  <div>
                    <p className="font-semibold">{selectedGift.gift_name}</p>
                    <Badge className={getRarityColor(selectedGift.gift_rarity)}>
                      {selectedGift.gift_rarity}
                    </Badge>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">
                    Quantity (Available: {selectedGift.quantity})
                  </label>
                  <Input
                    type="number"
                    min="1"
                    max={selectedGift.quantity}
                    value={exchangeAmount}
                    onChange={(e) => setExchangeAmount(Math.min(parseInt(e.target.value) || 1, selectedGift.quantity))}
                  />
                </div>

                <div className="p-3 bg-green-50 rounded-lg">
                  <p className="text-sm text-green-800">
                    You will receive approximately{' '}
                    <span className="font-bold">
                      {Math.floor(
                        (selectedGift.gift_rarity === 'common' ? 50 : 
                         selectedGift.gift_rarity === 'rare' ? 100 :
                         selectedGift.gift_rarity === 'epic' ? 200 :
                         selectedGift.gift_rarity === 'legendary' ? 500 : 1000) * 
                        (selectedGift.gift_rarity === 'common' ? 0.4 : 
                         selectedGift.gift_rarity === 'rare' ? 0.45 :
                         selectedGift.gift_rarity === 'epic' ? 0.5 :
                         selectedGift.gift_rarity === 'legendary' ? 0.55 : 0.6) * 
                        exchangeAmount
                      )} LX coins
                    </span>
                  </p>
                </div>

                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    className="flex-1"
                    onClick={() => setShowExchangeModal(false)}
                  >
                    Cancel
                  </Button>
                  <Button
                    className="flex-1 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700"
                    onClick={exchangeGift}
                    disabled={loading}
                  >
                    {loading ? 'Exchanging...' : 'Exchange'}
                  </Button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default GiftInventory;

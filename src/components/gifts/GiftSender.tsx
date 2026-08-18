import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Gift, 
  Send, 
  X, 
  Search, 
  Filter,
  Star,
  Crown,
  Diamond,
  Flame,
  Sparkles,
  Heart,
  Package
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { useAuth } from '@/hooks/use-auth';
import { supabase } from '@/lib/supabase';

interface GiftItem {
  id: string;
  gift_id: string;
  gift_name: string;
  gift_icon: string;
  gift_rarity: 'common' | 'rare' | 'epic' | 'legendary' | 'mythic';
  quantity: number;
}

interface GiftSenderProps {
  recipientId: string;
  recipientName?: string;
  context: 'chat' | 'live_stream' | 'profile';
  contextDetails?: Record<string, unknown>;
  onGiftSent?: (gift: Gift) => void;
  isOpen: boolean;
  onClose: () => void;
}

const GiftSender: React.FC<GiftSenderProps> = ({
  recipientId,
  recipientName,
  context,
  contextDetails,
  onGiftSent,
  isOpen,
  onClose
}) => {
  const { user } = useAuth();
  const [inventory, setInventory] = useState<GiftItem[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRarity, setSelectedRarity] = useState<string>('all');
  const [selectedGift, setSelectedGift] = useState<GiftItem | null>(null);
  const [message, setMessage] = useState('');
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [loading, setLoading] = useState(false);

  const loadInventory = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('gift_inventory')
        .select('*')
        .eq('user_id', user?.id)
        .eq('is_locked', false)
        .gt('quantity', 0)
        .order('purchase_date', { ascending: false });

      if (error) throw error;
      setInventory(data || []);
    } catch (error) {
      console.error('Error loading inventory:', error);
    }
  }, [user?.id]);

  useEffect(() => {
    if (isOpen && user) {
      loadInventory();
    }
  }, [isOpen, user, loadInventory]);

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

  const sendGift = async () => {
    if (!selectedGift || !recipientId) return;

    setLoading(true);
    try {
      const { data, error } = await supabase.rpc('send_gift', {
        p_sender_id: user?.id,
        p_receiver_id: recipientId,
        p_gift_id: selectedGift.gift_id,
        p_quantity: 1,
        p_context: context,
        p_context_details: contextDetails || {},
        p_message: message,
        p_is_anonymous: isAnonymous
      });

      if (error) throw error;

      if (data) {
        // Update inventory
        setInventory(prev => prev.map(item => 
          item.id === selectedGift.id 
            ? { ...item, quantity: item.quantity - 1 }
            : item
        ).filter(item => item.quantity > 0));

        // Reset form
        setSelectedGift(null);
        setMessage('');
        setIsAnonymous(false);

        // Notify parent
        if (onGiftSent) {
          onGiftSent({
            gift: selectedGift,
            message,
            isAnonymous,
            context,
            timestamp: new Date()
          });
        }

        onClose();
      }
    } catch (error) {
      console.error('Error sending gift:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredInventory = inventory.filter(item => {
    const matchesSearch = item.gift_name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesRarity = selectedRarity === 'all' || item.gift_rarity === selectedRarity;
    return matchesSearch && matchesRarity;
  });

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.9, opacity: 0, y: 20 }}
          className="bg-gradient-to-b from-white to-pink-50 rounded-xl p-6 max-w-2xl w-full mx-4 max-h-[80vh] overflow-hidden border-2 border-pink-200"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <Gift className="w-6 h-6 text-pink-600" />
              <div>
                <h3 className="text-lg font-semibold text-gray-800">Send a Gift</h3>
                <p className="text-sm text-gray-600">
                  {recipientName ? `to ${recipientName}` : 'to user'}
                </p>
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="h-8 w-8 p-0 text-gray-500 hover:text-gray-700"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 max-h-[60vh] overflow-y-auto">
            {/* Gift Selection */}
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <Search className="w-4 h-4 text-gray-400" />
                <Input
                  placeholder="Search gifts..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="flex-1"
                />
                <select
                  value={selectedRarity}
                  onChange={(e) => setSelectedRarity(e.target.value)}
                  className="px-2 py-1 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                >
                  <option value="all">All</option>
                  <option value="common">Common</option>
                  <option value="rare">Rare</option>
                  <option value="epic">Epic</option>
                  <option value="legendary">Legendary</option>
                  <option value="mythic">Mythic</option>
                </select>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 max-h-80 overflow-y-auto">
                {filteredInventory.map((item) => (
                  <motion.div
                    key={item.id}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setSelectedGift(item)}
                    className={`cursor-pointer transition-all ${
                      selectedGift?.id === item.id 
                        ? 'ring-2 ring-pink-500 scale-105' 
                        : 'hover:shadow-lg'
                    }`}
                  >
                    <Card className="overflow-hidden">
                      <CardContent className="p-3 text-center">
                        <div
                          className="w-12 h-12 mx-auto rounded-full flex items-center justify-center text-xl mb-2"
                          style={{ background: getRarityGradient(item.gift_rarity) }}
                        >
                          <span className="text-white">{item.gift_icon}</span>
                        </div>
                        <h4 className="font-medium text-xs text-gray-800 mb-1 truncate">
                          {item.gift_name}
                        </h4>
                        <Badge className={`text-xs ${getRarityColor(item.gift_rarity)}`}>
                          {item.gift_rarity}
                        </Badge>
                        <p className="text-xs text-gray-500 mt-1">
                          Qty: {item.quantity}
                        </p>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
              </div>

              {filteredInventory.length === 0 && (
                <div className="text-center py-8">
                  <Package className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                  <p className="text-gray-500 text-sm">No gifts available</p>
                  <p className="text-gray-400 text-xs mt-1">Purchase some gifts to send!</p>
                </div>
              )}
            </div>

            {/* Gift Details & Send Options */}
            <div className="space-y-4">
              {selectedGift ? (
                <>
                  <div className="bg-white rounded-lg p-4 border border-pink-200">
                    <div className="flex items-center gap-3 mb-3">
                      <div
                        className="w-16 h-16 rounded-full flex items-center justify-center text-2xl"
                        style={{ background: getRarityGradient(selectedGift.gift_rarity) }}
                      >
                        <span className="text-white">{selectedGift.gift_icon}</span>
                      </div>
                      <div>
                        <h4 className="font-semibold text-gray-800">{selectedGift.gift_name}</h4>
                        <Badge className={getRarityColor(selectedGift.gift_rarity)}>
                          {selectedGift.gift_rarity}
                        </Badge>
                        <p className="text-sm text-gray-500 mt-1">
                          Available: {selectedGift.quantity}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Message (optional)
                    </label>
                    <textarea
                      placeholder="Add a personal message..."
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent resize-none"
                      rows={3}
                    />
                  </div>

                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="anonymous"
                      checked={isAnonymous}
                      onChange={(e) => setIsAnonymous(e.target.checked)}
                      className="rounded border-gray-300 text-pink-600 focus:ring-pink-500"
                    />
                    <label htmlFor="anonymous" className="text-sm text-gray-700">
                      Send anonymously
                    </label>
                  </div>

                  <Button
                    onClick={sendGift}
                    disabled={loading || selectedGift.quantity === 0}
                    className="w-full bg-gradient-to-r from-pink-500 to-purple-500 hover:from-pink-600 hover:to-purple-600"
                  >
                    {loading ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                        Sending...
                      </>
                    ) : (
                      <>
                        <Send className="w-4 h-4 mr-2" />
                        Send Gift
                      </>
                    )}
                  </Button>
                </>
              ) : (
                <div className="text-center py-8">
                  <Gift className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                  <p className="text-gray-500 text-sm">Select a gift to send</p>
                </div>
              )}
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default GiftSender;

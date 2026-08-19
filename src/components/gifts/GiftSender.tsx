import React, { useState, useEffect, useCallback } from 'react';
import { 
  Gift, 
  Send, 
  Search, 
  Star,
  Crown,
  Diamond,
  Flame,
  Sparkles,
  Heart,
  Package,
  Loader2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
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

  const getRarityIcon = (rarity: string) => {
    switch (rarity) {
      case 'common': return <Heart className="w-3.5 h-3.5" />;
      case 'rare': return <Star className="w-3.5 h-3.5" />;
      case 'epic': return <Flame className="w-3.5 h-3.5" />;
      case 'legendary': return <Crown className="w-3.5 h-3.5" />;
      case 'mythic': return <Diamond className="w-3.5 h-3.5" />;
      default: return <Gift className="w-3.5 h-3.5" />;
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
        setInventory(prev => prev.map(item => 
          item.id === selectedGift.id 
            ? { ...item, quantity: item.quantity - 1 }
            : item
        ).filter(item => item.quantity > 0));

        setSelectedGift(null);
        setMessage('');
        setIsAnonymous(false);

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

  const rarityOptions = ['all', 'common', 'rare', 'epic', 'legendary', 'mythic'];

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-2xl w-[calc(100%-2rem)] max-h-[85vh] p-0 gap-0 overflow-hidden rounded-2xl border-none bg-gradient-to-b from-background to-pink-50/30">
        <DialogHeader className="p-6 pb-2">
          <DialogTitle className="flex items-center gap-2 text-xl">
            <Gift className="h-5 w-5 text-pink-500" />
            Send a Gift
          </DialogTitle>
          <DialogDescription>
            {recipientName ? `to ${recipientName}` : 'Choose a gift from your inventory'}
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="max-h-[60vh]">
          <div className="p-6 pt-2">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Gift Selection */}
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      placeholder="Search gifts..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-9"
                    />
                  </div>
                  <Select value={selectedRarity} onValueChange={setSelectedRarity}>
                    <SelectTrigger className="w-[110px]">
                      <SelectValue placeholder="Rarity" />
                    </SelectTrigger>
                    <SelectContent>
                      {rarityOptions.map(rarity => (
                        <SelectItem key={rarity} value={rarity} className="capitalize">
                          {rarity}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {filteredInventory.map((item) => (
                    <Card
                      key={item.id}
                      onClick={() => setSelectedGift(item)}
                      className={`cursor-pointer overflow-hidden border transition-all duration-200 hover:shadow-lg hover:-translate-y-0.5 active:scale-[0.98] ${
                        selectedGift?.id === item.id 
                          ? 'ring-2 ring-pink-500 ring-offset-2' 
                          : ''
                      }`}
                    >
                      <CardContent className="p-3 text-center">
                        <div
                          className="w-12 h-12 mx-auto rounded-full flex items-center justify-center text-xl mb-2 shadow-md"
                          style={{ background: getRarityGradient(item.gift_rarity) }}
                        >
                          <span className="text-white">{item.gift_icon}</span>
                        </div>
                        <h4 className="font-medium text-xs text-foreground mb-1 truncate">
                          {item.gift_name}
                        </h4>
                        <Badge className={`text-xs ${getRarityColor(item.gift_rarity)}`}>
                          {getRarityIcon(item.gift_rarity)}
                          <span className="ml-1 capitalize">{item.gift_rarity}</span>
                        </Badge>
                        <p className="text-xs text-muted-foreground mt-1">
                          Qty: {item.quantity}
                        </p>
                      </CardContent>
                    </Card>
                  ))}
                </div>

                {filteredInventory.length === 0 && (
                  <div className="text-center py-10 bg-muted/30 rounded-2xl">
                    <Package className="w-12 h-12 mx-auto mb-3 text-muted-foreground" />
                    <p className="text-muted-foreground text-sm font-medium">No gifts available</p>
                    <p className="text-muted-foreground text-xs mt-1">Purchase some gifts to send!</p>
                  </div>
                )}
              </div>

              {/* Gift Details & Send Options */}
              <div className="space-y-4">
                {selectedGift ? (
                  <>
                    <Card className="border-pink-100 bg-gradient-to-br from-white to-pink-50/50 overflow-hidden">
                      <CardContent className="p-4">
                        <div className="flex items-center gap-4">
                          <div
                            className="w-16 h-16 rounded-2xl flex items-center justify-center text-2xl shadow-lg shrink-0"
                            style={{ background: getRarityGradient(selectedGift.gift_rarity) }}
                          >
                            <span className="text-white">{selectedGift.gift_icon}</span>
                          </div>
                          <div className="min-w-0">
                            <h4 className="font-semibold text-foreground truncate">{selectedGift.gift_name}</h4>
                            <Badge className={`text-xs mt-1 ${getRarityColor(selectedGift.gift_rarity)}`}>
                              {getRarityIcon(selectedGift.gift_rarity)}
                              <span className="ml-1 capitalize">{selectedGift.gift_rarity}</span>
                            </Badge>
                            <p className="text-sm text-muted-foreground mt-1">
                              Available: {selectedGift.quantity}
                            </p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    <div className="space-y-2">
                      <Label htmlFor="gift-message" className="text-sm font-medium">
                        Message (optional)
                      </Label>
                      <Textarea
                        id="gift-message"
                        placeholder="Add a personal message..."
                        value={message}
                        onChange={(e) => setMessage(e.target.value)}
                        rows={3}
                      />
                    </div>

                    <div className="flex items-center justify-between rounded-xl bg-muted/40 p-3">
                      <div className="flex items-center gap-2">
                        <Sparkles className="w-4 h-4 text-pink-500" />
                        <Label htmlFor="anonymous" className="text-sm font-medium">
                          Send anonymously
                        </Label>
                      </div>
                      <Switch
                        id="anonymous"
                        checked={isAnonymous}
                        onCheckedChange={setIsAnonymous}
                      />
                    </div>

                    <Button
                      onClick={sendGift}
                      disabled={loading || selectedGift.quantity === 0}
                      className="w-full bg-gradient-to-r from-pink-500 to-purple-500 hover:from-pink-600 hover:to-purple-600 text-white"
                    >
                      {loading ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
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
                  <div className="text-center py-12 bg-muted/30 rounded-2xl">
                    <Gift className="w-12 h-12 mx-auto mb-3 text-muted-foreground" />
                    <p className="text-muted-foreground text-sm font-medium">Select a gift to send</p>
                    <p className="text-muted-foreground text-xs mt-1">Tap a card from your inventory</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
};

export default GiftSender;

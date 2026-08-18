import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Link, useNavigate } from 'react-router-dom';
import { 
  Heart, 
  MessageCircle, 
  Gift, 
  Star, 
  Eye, 
  Users, 
  Video, 
  Bell,
  Check,
  X,
  Filter,
  Trash2,
  ChevronRight,
  Calendar,
  Clock,
  MapPin,
  Shield,
  Crown,
  Coins,
  Sparkles
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { AuthGuard } from '@/components/auth/AuthGuard';
import { useAuth } from '@/hooks/use-auth';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/components/ui/use-toast';

interface Notification {
  id: string;
  type: 'like' | 'match' | 'message' | 'gift' | 'profile_view' | 'live' | 'system' | 'subscription' | 'coin';
  title: string;
  message: string;
  created_at: Date;
  read: boolean;
  user_id?: string;
  user?: {
    id: string;
    name: string;
    age: number;
    avatar: string;
    verified: boolean;
    vip_tier?: string;
  };
  action_url?: string;
  metadata?: {
    gift_name?: string;
    gift_value?: number;
    gift_icon?: string;
    stream_title?: string;
    viewer_count?: number;
    match_id?: string;
    conversation_id?: string;
    coin_amount?: number;
    subscription_tier?: string;
  };
}

const Notifications = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [selectedFilter, setSelectedFilter] = useState<'all' | 'unread' | 'likes' | 'matches' | 'messages' | 'gifts' | 'live'>('all');
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [unreadCount, setUnreadCount] = useState(0);

  // Update unread count whenever notifications change
  useEffect(() => {
    setUnreadCount(notifications.filter(n => !n.read).length);
  }, [notifications]);

  const loadNotifications = async () => {
    if (!user) return;

    try {
      setLoading(true);
      
      // In a real implementation, you would have a notifications table
      // For now, we'll combine data from multiple sources
      
      const notifications: Notification[] = [];

      // 1. Get unread messages
      const { data: messages } = await supabase
        .rpc('get_unread_messages', { user_id: user.id });

      if (messages) {
        messages.forEach(msg => {
          notifications.push({
            id: `msg-${msg.id}`,
            type: 'message',
            title: 'New Message',
            message: `${msg.sender?.full_name || msg.sender?.username}: "${msg.content.substring(0, 50)}${msg.content.length > 50 ? '...' : ''}"`,
            created_at: new Date(msg.created_at),
            read: false,
            user_id: msg.sender_id,
            user: {
              id: msg.sender_id,
              name: msg.sender?.full_name || msg.sender?.username || 'Anonymous',
              age: msg.sender?.age || 0,
              avatar: msg.sender?.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(msg.sender?.username || 'User')}&background=B11D2D&color=fff`,
              verified: msg.sender?.is_verified || false,
              vip_tier: msg.sender?.vip_tier
            },
            action_url: `/chat/${msg.sender_id}?conversation=${msg.conversation_id}`,
            metadata: {
              conversation_id: msg.conversation_id
            }
          });
        });
      }

      // 2. Get new matches
      const { data: matches } = await supabase
        .from('matches')
        .select(`
          *,
          user1:user1_id (
            username,
            full_name,
            avatar_url,
            is_verified,
            vip_tier,
            age
          ),
          user2:user2_id (
            username,
            full_name,
            avatar_url,
            is_verified,
            vip_tier,
            age
          )
        `)
        .or(`user1_id.eq.${user.id},user2_id.eq.${user.id}`)
        .eq('status', 'matched')
        .order('created_at', { ascending: false })
        .limit(20);

      if (matches) {
        matches.forEach(match => {
          const matchedUser = match.user1_id === user.id ? match.user2 : match.user1;
          
          notifications.push({
            id: `match-${match.id}`,
            type: 'match',
            title: 'New Match! 🎉',
            message: `You and ${matchedUser?.full_name || matchedUser?.username} liked each other`,
            created_at: new Date(match.created_at),
            read: false,
            user_id: matchedUser?.id,
            user: {
              id: matchedUser?.id,
              name: matchedUser?.full_name || matchedUser?.username || 'Anonymous',
              age: matchedUser?.age || 0,
              avatar: matchedUser?.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(matchedUser?.username || 'User')}&background=B11D2D&color=fff`,
              verified: matchedUser?.is_verified || false,
              vip_tier: matchedUser?.vip_tier
            },
            action_url: `/chat/${matchedUser?.id}?newMatch=true`,
            metadata: {
              match_id: match.id
            }
          });
        });
      }

      // 3. Get received gifts
      const { data: gifts } = await supabase
        .from('sent_gifts')
        .select(`
          *,
          sender:from_user_id (
            username,
            full_name,
            avatar_url,
            is_verified,
            vip_tier,
            age
          ),
          gift:gift_id (
            name,
            cost_coins,
            icon_url
          )
        `)
        .eq('to_user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(20);

      if (gifts) {
        gifts.forEach(gift => {
          notifications.push({
            id: `gift-${gift.id}`,
            type: 'gift',
            title: 'Gift Received! 🎁',
            message: `${gift.sender?.full_name || gift.sender?.username} sent you a ${gift.gift?.name}`,
            created_at: new Date(gift.created_at),
            read: false,
            user_id: gift.from_user_id,
            user: {
              id: gift.from_user_id,
              name: gift.sender?.full_name || gift.sender?.username || 'Anonymous',
              age: gift.sender?.age || 0,
              avatar: gift.sender?.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(gift.sender?.username || 'User')}&background=B11D2D&color=fff`,
              verified: gift.sender?.is_verified || false,
              vip_tier: gift.sender?.vip_tier
            },
            action_url: `/chat/${gift.from_user_id}`,
            metadata: {
              gift_name: gift.gift?.name,
              gift_value: gift.gift?.cost_coins,
              gift_icon: gift.gift?.icon_url
            }
          });
        });
      }

      // 4. Get live streams from followed users
      const { data: liveRooms } = await supabase
        .from('live_rooms')
        .select(`
          *,
          host:host_id (
            username,
            full_name,
            avatar_url,
            is_verified,
            vip_tier
          )
        `)
        .eq('is_active', true)
        .order('created_at', { ascending: false })
        .limit(10);

      if (liveRooms) {
        liveRooms.forEach(room => {
          notifications.push({
            id: `live-${room.id}`,
            type: 'live',
            title: 'Live Stream Started 🔴',
            message: `${room.host?.full_name || room.host?.username} is live: "${room.title}"`,
            created_at: new Date(room.created_at),
            read: false,
            user_id: room.host_id,
            user: {
              id: room.host_id,
              name: room.host?.full_name || room.host?.username || 'Anonymous',
              age: 0,
              avatar: room.host?.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(room.host?.username || 'User')}&background=B11D2D&color=fff`,
              verified: room.host?.is_verified || false,
              vip_tier: room.host?.vip_tier
            },
            action_url: `/live?stream=${room.id}`,
            metadata: {
              stream_title: room.title,
              viewer_count: room.viewer_count
            }
          });
        });
      }

      // 5. Get subscription notifications
      const { data: subscriptions } = await supabase
        .from('subscriptions')
        .select('*')
        .eq('user_id', user.id)
        .eq('status', 'active')
        .order('created_at', { ascending: false })
        .limit(5);

      if (subscriptions && subscriptions.length > 0) {
        const recentSub = subscriptions[0];
        notifications.push({
          id: `sub-${recentSub.id}`,
          type: 'subscription',
          title: 'Subscription Active ✨',
          message: `Your ${recentSub.tier} subscription is active`,
          created_at: new Date(recentSub.created_at),
          read: true,
          action_url: '/subscription',
          metadata: {
            subscription_tier: recentSub.tier
          }
        });
      }

      // 6. Get coin transaction notifications
      const { data: transactions } = await supabase
        .from('coin_transactions')
        .select('*')
        .eq('user_id', user.id)
        .eq('transaction_type', 'bonus')
        .order('created_at', { ascending: false })
        .limit(5);

      if (transactions && transactions.length > 0) {
        const recentTrans = transactions[0];
        notifications.push({
          id: `coin-${recentTrans.id}`,
          type: 'coin',
          title: 'Coins Added 💰',
          message: `You received ${recentTrans.amount} LoveX Coins`,
          created_at: new Date(recentTrans.created_at),
          read: true,
          action_url: '/wallet',
          metadata: {
            coin_amount: recentTrans.amount
          }
        });
      }

      // Sort all notifications by date (newest first)
      notifications.sort((a, b) => b.created_at.getTime() - a.created_at.getTime());

      setNotifications(notifications);

    } catch (error) {
      console.error('Error loading notifications:', error);
      toast({
        title: 'Error',
        description: 'Failed to load notifications',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const subscribeToNotifications = () => {
    if (!user) return;

    // Subscribe to new messages
    const messageSubscription = supabase
      .channel('message-notifications')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `receiver_id=eq.${user.id}`
        },
        async (payload) => {
          // Get sender info
          const { data: sender } = await supabase
            .from('profiles')
            .select('username, full_name, avatar_url, is_verified, vip_tier, age')
            .eq('id', payload.new.sender_id)
            .single();

          const newNotification: Notification = {
            id: `msg-${payload.new.id}`,
            type: 'message',
            title: 'New Message',
            message: `${sender?.full_name || sender?.username}: "${payload.new.content.substring(0, 50)}${payload.new.content.length > 50 ? '...' : ''}"`,
            created_at: new Date(payload.new.created_at),
            read: false,
            user_id: payload.new.sender_id,
            user: {
              id: payload.new.sender_id,
              name: sender?.full_name || sender?.username || 'Anonymous',
              age: sender?.age || 0,
              avatar: sender?.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(sender?.username || 'User')}&background=B11D2D&color=fff`,
              verified: sender?.is_verified || false,
              vip_tier: sender?.vip_tier
            },
            action_url: `/chat/${payload.new.sender_id}?conversation=${payload.new.conversation_id}`,
            metadata: {
              conversation_id: payload.new.conversation_id
            }
          };

          setNotifications(prev => [newNotification, ...prev]);
          
          // Show toast for new message
          toast({
            title: 'New Message',
            description: `${sender?.full_name || sender?.username} sent you a message`,
          });
        }
      )
      .subscribe();

    // Subscribe to new matches
    const matchSubscription = supabase
      .channel('match-notifications')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'matches',
          filter: `user1_id=eq.${user.id} OR user2_id=eq.${user.id}`
        },
        async (payload) => {
          const matchedUserId = payload.new.user1_id === user.id ? payload.new.user2_id : payload.new.user1_id;
          
          // Get matched user info
          const { data: matchedUser } = await supabase
            .from('profiles')
            .select('username, full_name, avatar_url, is_verified, vip_tier, age')
            .eq('id', matchedUserId)
            .single();

          const newNotification: Notification = {
            id: `match-${payload.new.id}`,
            type: 'match',
            title: 'New Match! 🎉',
            message: `You and ${matchedUser?.full_name || matchedUser?.username} liked each other`,
            created_at: new Date(payload.new.created_at),
            read: false,
            user_id: matchedUserId,
            user: {
              id: matchedUserId,
              name: matchedUser?.full_name || matchedUser?.username || 'Anonymous',
              age: matchedUser?.age || 0,
              avatar: matchedUser?.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(matchedUser?.username || 'User')}&background=B11D2D&color=fff`,
              verified: matchedUser?.is_verified || false,
              vip_tier: matchedUser?.vip_tier
            },
            action_url: `/chat/${matchedUserId}?newMatch=true`,
            metadata: {
              match_id: payload.new.id
            }
          };

          setNotifications(prev => [newNotification, ...prev]);
          
          // Show toast for new match
          toast({
            title: "It's a Match! 🎉",
            description: `You and ${matchedUser?.full_name || matchedUser?.username} liked each other`,
          });
        }
      )
      .subscribe();

    // Subscribe to new gifts
    const giftSubscription = supabase
      .channel('gift-notifications')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'sent_gifts',
          filter: `to_user_id=eq.${user.id}`
        },
        async (payload) => {
          // Get sender info
          const { data: sender } = await supabase
            .from('profiles')
            .select('username, full_name, avatar_url, is_verified, vip_tier, age')
            .eq('id', payload.new.from_user_id)
            .single();

          // Get gift info
          const { data: gift } = await supabase
            .from('gifts')
            .select('name, cost_coins, icon_url')
            .eq('id', payload.new.gift_id)
            .single();

          const newNotification: Notification = {
            id: `gift-${payload.new.id}`,
            type: 'gift',
            title: 'Gift Received! 🎁',
            message: `${sender?.full_name || sender?.username} sent you a ${gift?.name}`,
            created_at: new Date(payload.new.created_at),
            read: false,
            user_id: payload.new.from_user_id,
            user: {
              id: payload.new.from_user_id,
              name: sender?.full_name || sender?.username || 'Anonymous',
              age: sender?.age || 0,
              avatar: sender?.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(sender?.username || 'User')}&background=B11D2D&color=fff`,
              verified: sender?.is_verified || false,
              vip_tier: sender?.vip_tier
            },
            action_url: `/chat/${payload.new.from_user_id}`,
            metadata: {
              gift_name: gift?.name,
              gift_value: gift?.cost_coins,
              gift_icon: gift?.icon_url
            }
          };

          setNotifications(prev => [newNotification, ...prev]);
          
          // Show toast for new gift
          toast({
            title: 'Gift Received! 🎁',
            description: `${sender?.full_name || sender?.username} sent you a ${gift?.name}`,
          });
        }
      )
      .subscribe();

    return () => {
      messageSubscription.unsubscribe();
      matchSubscription.unsubscribe();
      giftSubscription.unsubscribe();
    };
  };

  // Load notifications on mount and set up real-time subscription
  useEffect(() => {
    if (user) {
      loadNotifications();
      const cleanup = subscribeToNotifications();
      return cleanup;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const markAsRead = async (id: string) => {
    setNotifications(prev => prev.map(notif => 
      notif.id === id ? { ...notif, read: true } : notif
    ));

    // Extract type and ID from composite ID
    const [type, actualId] = id.split('-');

    // Update in database if needed
    if (type === 'msg') {
      await supabase
        .rpc('mark_messages_as_read', { message_ids: [actualId], user_uuid: user.id });
    }
  };

  const markAllAsRead = async () => {
    setNotifications(prev => prev.map(notif => ({ ...notif, read: true })));

    // Mark all messages as read
    const messageIds = notifications
      .filter(n => n.type === 'message')
      .map(n => n.id.replace('msg-', ''));

    if (messageIds.length > 0) {
      await supabase
        .rpc('mark_messages_as_read', { message_ids: messageIds.map(id => id as any), user_uuid: user.id });
    }

    toast({
      title: 'All marked as read',
      description: 'All notifications have been marked as read',
    });
  };

  const deleteNotification = (id: string) => {
    setNotifications(prev => prev.filter(notif => notif.id !== id));
    
    // In a real implementation, you would also delete from a notifications table
    toast({
      title: 'Notification removed',
      description: 'The notification has been removed',
    });
  };

  const clearAllNotifications = () => {
    setNotifications([]);
    
    toast({
      title: 'All notifications cleared',
      description: 'Your notification list has been cleared',
    });
  };

  const getNotificationIcon = (type: Notification['type']) => {
    const iconProps = { className: "w-5 h-5" };
    
    switch (type) {
      case 'like':
        return <Heart {...iconProps} style={{ color: '#B11D2D' }} />;
      case 'match':
        return <Star {...iconProps} style={{ color: '#CFAF4E' }} />;
      case 'message':
        return <MessageCircle {...iconProps} style={{ color: '#5E2A6B' }} />;
      case 'gift':
        return <Gift {...iconProps} style={{ color: '#2C5F2D' }} />;
      case 'profile_view':
        return <Eye {...iconProps} style={{ color: '#1A5F8A' }} />;
      case 'live':
        return <Video {...iconProps} style={{ color: '#C94F2B' }} />;
      case 'subscription':
        return <Crown {...iconProps} style={{ color: '#CFAF4E' }} />;
      case 'coin':
        return <Coins {...iconProps} style={{ color: '#2C5F2D' }} />;
      default:
        return <Bell {...iconProps} style={{ color: '#7E786E' }} />;
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

  const filteredNotifications = notifications.filter(notif => {
    switch (selectedFilter) {
      case 'unread':
        return !notif.read;
      case 'likes':
        return notif.type === 'like';
      case 'matches':
        return notif.type === 'match';
      case 'messages':
        return notif.type === 'message';
      case 'gifts':
        return notif.type === 'gift';
      case 'live':
        return notif.type === 'live';
      default:
        return true;
    }
  });

  if (!user) return null;

  return (
    <AuthGuard>
      <div className="min-h-screen" style={{ backgroundColor: '#F9F7F4' }}>
        {/* Cultural Background Pattern */}
        <div className="fixed inset-0 opacity-5 pointer-events-none">
          <div className="w-full h-full" style={{
            backgroundImage: `repeating-linear-gradient(45deg, #B11D2D 0px, #B11D2D 1px, transparent 1px, transparent 16px)`,
          }} />
        </div>

        <div className="relative z-10">
          {/* Header */}
          <div className="relative overflow-hidden" style={{ 
            background: 'linear-gradient(135deg, #B11D2D 0%, #5E2A6B 100%)'
          }}>
            {/* Cultural Pattern Overlay */}
            <div className="absolute inset-0 opacity-10">
              <div className="w-full h-full" style={{
                backgroundImage: `repeating-linear-gradient(45deg, #CFAF4E 0px, #CFAF4E 2px, transparent 2px, transparent 12px)`,
              }} />
            </div>

            <div className="relative z-10 container mx-auto px-4 py-6">
              <div className="flex items-center justify-between">
                <motion.div
                  initial={{ x: -20, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  transition={{ duration: 0.5 }}
                >
                  <h1 className="text-2xl font-bold text-white" style={{ 
                    fontFamily: "'Playfair Display', serif"
                  }}>
                    Notifications
                  </h1>
                  <p className="text-white/80 text-sm">
                    {unreadCount > 0 ? `${unreadCount} unread notifications` : 'All caught up!'}
                  </p>
                </motion.div>

                <motion.div
                  initial={{ x: 20, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  transition={{ duration: 0.5, delay: 0.2 }}
                  className="flex gap-2"
                >
                  {unreadCount > 0 && (
                    <Button
                      onClick={markAllAsRead}
                      variant="outline"
                      size="sm"
                      style={{ 
                        backgroundColor: 'rgba(255,255,255,0.15)',
                        color: 'white',
                        border: '1px solid rgba(255,255,255,0.3)'
                      }}
                    >
                      <Check className="w-4 h-4 mr-2" />
                      Mark All Read
                    </Button>
                  )}
                  <Button
                    onClick={clearAllNotifications}
                    variant="outline"
                    size="sm"
                    style={{ 
                      backgroundColor: 'rgba(255,255,255,0.15)',
                      color: 'white',
                      border: '1px solid rgba(255,255,255,0.3)'
                    }}
                  >
                    <Trash2 className="w-4 h-4 mr-2" />
                    Clear All
                  </Button>
                </motion.div>
              </div>
            </div>
          </div>

          <div className="container mx-auto px-4 py-6">
            {/* Filter Tabs */}
            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="mb-6"
            >
              <div className="flex gap-2 overflow-x-auto pb-2">
                {[
                  { key: 'all', label: 'All', count: notifications.length },
                  { key: 'unread', label: 'Unread', count: unreadCount },
                  { key: 'likes', label: 'Likes', count: notifications.filter(n => n.type === 'like').length },
                  { key: 'matches', label: 'Matches', count: notifications.filter(n => n.type === 'match').length },
                  { key: 'messages', label: 'Messages', count: notifications.filter(n => n.type === 'message').length },
                  { key: 'gifts', label: 'Gifts', count: notifications.filter(n => n.type === 'gift').length },
                  { key: 'live', label: 'Live', count: notifications.filter(n => n.type === 'live').length }
                ].map((filter) => (
                  <Button
                    key={filter.key}
                    onClick={() => setSelectedFilter(filter.key as any)}
                    variant={selectedFilter === filter.key ? 'default' : 'outline'}
                    size="sm"
                    className="whitespace-nowrap"
                    style={{
                      ...(selectedFilter === filter.key ? {
                        background: 'linear-gradient(90deg, #5E2A6B, #CFAF4E)',
                        color: 'white',
                        border: 'none'
                      } : {})
                    }}
                  >
                    {filter.label}
                    {filter.count > 0 && (
                      <Badge className="ml-2 px-2 py-0 text-xs" style={{
                        backgroundColor: selectedFilter === filter.key ? 'rgba(255,255,255,0.2)' : '#F0EDE8',
                        color: selectedFilter === filter.key ? 'white' : '#26231F'
                      }}>
                        {filter.count}
                      </Badge>
                    )}
                  </Button>
                ))}
              </div>
            </motion.div>

            {/* Loading State */}
            {loading && (
              <div className="flex items-center justify-center py-12">
                <div className="text-center">
                  <div className="w-16 h-16 border-4 border-[#B11D2D] border-t-transparent rounded-full animate-spin mx-auto mb-4" />
                  <p style={{ color: '#5E5950' }}>Loading notifications...</p>
                </div>
              </div>
            )}

            {/* Notifications List */}
            {!loading && (
              <div className="space-y-3">
                {filteredNotifications.length === 0 ? (
                  <motion.div
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ duration: 0.5 }}
                    className="text-center py-12"
                  >
                    <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-gray-100 flex items-center justify-center">
                      <Bell className="w-10 h-10" style={{ color: '#A69F94' }} />
                    </div>
                    <h3 className="text-xl font-semibold mb-2" style={{ color: '#26231F' }}>
                      No notifications
                    </h3>
                    <p style={{ color: '#5E5950' }}>
                      {selectedFilter === 'all' 
                        ? "You're all caught up! Check back later for new updates."
                        : `No ${selectedFilter} notifications found.`
                      }
                    </p>
                  </motion.div>
                ) : (
                  filteredNotifications.map((notification, index) => (
                    <motion.div
                      key={notification.id}
                      initial={{ y: 20, opacity: 0 }}
                      animate={{ y: 0, opacity: 1 }}
                      transition={{ duration: 0.3, delay: index * 0.05 }}
                    >
                      <Card className={`border-0 shadow-md hover:shadow-lg transition-all duration-300 ${
                        !notification.read ? 'border-l-4' : ''
                      }`} style={{ 
                        backgroundColor: '#FFFFFF',
                        borderLeftColor: !notification.read ? '#B11D2D' : 'transparent',
                        borderRadius: '16px 16px 8px 16px'
                      }}>
                        <CardContent className="p-4">
                          <div className="flex items-start gap-3">
                            {/* Icon */}
                            <div className="flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center" style={{ backgroundColor: '#F9F7F4' }}>
                              {getNotificationIcon(notification.type)}
                            </div>

                            {/* Content */}
                            <div className="flex-1 min-w-0">
                              <div className="flex items-start justify-between mb-1">
                                <div className="flex-1">
                                  <h4 className="font-semibold text-sm" style={{ color: '#26231F' }}>
                                    {notification.title}
                                  </h4>
                                  <p className="text-sm mt-1" style={{ color: '#5E5950' }}>
                                    {notification.message}
                                  </p>
                                  
                                  {/* Metadata */}
                                  {notification.metadata && (
                                    <div className="flex items-center flex-wrap gap-2 mt-2">
                                      {notification.metadata.gift_name && (
                                        <Badge className="text-xs" style={{ 
                                          backgroundColor: '#F0EDE8',
                                          color: '#26231F'
                                        }}>
                                          <Gift className="w-3 h-3 mr-1" />
                                          {notification.metadata.gift_name}
                                          {notification.metadata.gift_value && ` (${notification.metadata.gift_value} LX)`}
                                        </Badge>
                                      )}
                                      {notification.metadata.stream_title && (
                                        <Badge className="text-xs" style={{ 
                                          backgroundColor: '#F0EDE8',
                                          color: '#26231F'
                                        }}>
                                          <Video className="w-3 h-3 mr-1" />
                                          {notification.metadata.stream_title}
                                          {notification.metadata.viewer_count && ` • ${notification.metadata.viewer_count} viewers`}
                                        </Badge>
                                      )}
                                      {notification.metadata.coin_amount && (
                                        <Badge className="text-xs" style={{ 
                                          backgroundColor: '#F0EDE8',
                                          color: '#26231F'
                                        }}>
                                          <Coins className="w-3 h-3 mr-1" />
                                          +{notification.metadata.coin_amount} LX
                                        </Badge>
                                      )}
                                      {notification.metadata.subscription_tier && (
                                        <Badge className="text-xs" style={{ 
                                          backgroundColor: '#CFAF4E',
                                          color: '#26231F'
                                        }}>
                                          <Crown className="w-3 h-3 mr-1" />
                                          {notification.metadata.subscription_tier}
                                        </Badge>
                                      )}
                                    </div>
                                  )}
                                </div>
                                
                                <div className="flex items-center gap-2 ml-2">
                                  <span className="text-xs whitespace-nowrap" style={{ color: '#A69F94' }}>
                                    {formatTime(notification.created_at)}
                                  </span>
                                  <Button
                                    onClick={() => deleteNotification(notification.id)}
                                    variant="ghost"
                                    size="sm"
                                    className="w-6 h-6 p-0"
                                  >
                                    <X className="w-3 h-3" style={{ color: '#A69F94' }} />
                                  </Button>
                                </div>
                              </div>

                              {/* User Info & Actions */}
                              {notification.user && (
                                <div className="flex items-center justify-between mt-3">
                                  <div className="flex items-center gap-2">
                                    <Avatar className="w-8 h-8">
                                      <AvatarImage src={notification.user.avatar} />
                                      <AvatarFallback>{notification.user.name[0]}</AvatarFallback>
                                    </Avatar>
                                    <div>
                                      <div className="flex items-center gap-2">
                                        <p className="text-sm font-medium" style={{ color: '#26231F' }}>
                                          {notification.user.name}
                                        </p>
                                        {notification.user.vip_tier && notification.user.vip_tier !== 'free' && (
                                          <Crown className="w-3 h-3" style={{ color: '#CFAF4E' }} />
                                        )}
                                      </div>
                                      <div className="flex items-center gap-2">
                                        {notification.user.verified && (
                                          <div className="flex items-center gap-1">
                                            <Shield className="w-3 h-3" style={{ color: '#2C5F2D' }} />
                                            <span className="text-xs" style={{ color: '#2C5F2D' }}>Verified</span>
                                          </div>
                                        )}
                                        {notification.user.age > 0 && (
                                          <span className="text-xs" style={{ color: '#A69F94' }}>
                                            {notification.user.age} years
                                          </span>
                                        )}
                                      </div>
                                    </div>
                                  </div>

                                  {notification.action_url && (
                                    <Link to={notification.action_url}>
                                      <Button
                                        size="sm"
                                        onClick={() => markAsRead(notification.id)}
                                        style={{ 
                                          background: 'linear-gradient(90deg, #5E2A6B, #CFAF4E)',
                                          color: 'white',
                                          border: 'none'
                                        }}
                                      >
                                        View
                                        <ChevronRight className="w-3 h-3 ml-1" />
                                      </Button>
                                    </Link>
                                  )}
                                </div>
                              )}

                              {/* System/Action only notifications */}
                              {!notification.user && notification.action_url && (
                                <div className="flex justify-end mt-3">
                                  <Link to={notification.action_url}>
                                    <Button
                                      size="sm"
                                      onClick={() => markAsRead(notification.id)}
                                      style={{ 
                                        background: 'linear-gradient(90deg, #5E2A6B, #CFAF4E)',
                                        color: 'white',
                                        border: 'none'
                                      }}
                                    >
                                      View Details
                                      <ChevronRight className="w-3 h-3 ml-1" />
                                    </Button>
                                  </Link>
                                </div>
                              )}
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </motion.div>
                  ))
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </AuthGuard>
  );
};

export default Notifications;
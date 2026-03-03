import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link, useParams } from 'react-router-dom';
import { 
  Send, 
  Heart, 
  Gift, 
  Search, 
  Filter,
  MoreVertical,
  Phone,
  Video,
  Circle,
  Check,
  CheckCheck,
  Smile,
  Paperclip,
  Camera,
  Mic,
  ArrowLeft,
  User,
  MapPin,
  Star,
  Users,
  Bell,
  Settings,
  Ban,
  Flag,
  Info,
  X,
  Plus,
  Image as ImageIcon
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Input } from '@/components/ui/input';
import { AuthGuard } from '@/components/auth/AuthGuard';
import { useAuth } from '@/hooks/use-auth';
import { supabase } from '@/lib/supabase';
import VerificationBadge from '@/components/verification/VerificationBadge';

interface Message {
  id: string;
  text: string;
  sender: string;
  receiver: string;
  timestamp: Date;
  read: boolean;
  type: 'text' | 'gift' | 'image' | 'system';
  delivery_status: 'sending' | 'sent' | 'delivered' | 'read';
  edited?: boolean;
  deleted?: boolean;
  reply_to?: string;
  reactions?: { [key: string]: string[] };
}

interface Conversation {
  id: string;
  participant_id: string;
  name: string;
  age: number;
  location: string;
  avatar: string;
  last_message: string;
  last_message_time: Date;
  unread_count: number;
  is_online: boolean;
  is_verified: boolean;
  verification_level?: 'basic' | 'premium' | 'golden';
  match_date: Date;
  is_typing: boolean;
  is_blocked: boolean;
  is_muted: boolean;
  phone_call_enabled: boolean;
  video_call_enabled: boolean;
}

interface TypingIndicator {
  conversation_id: string;
  user_id: string;
  is_typing: boolean;
  timestamp: Date;
}

const Chat = () => {
  const { user } = useAuth();
  const { chatId } = useParams<{ chatId: string }>();
  const [selectedChat, setSelectedChat] = useState<string | null>(chatId || null);
  const [searchQuery, setSearchQuery] = useState('');
  const [message, setMessage] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [showGiftModal, setShowGiftModal] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [showMoreOptions, setShowMoreOptions] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [onlineUsers, setOnlineUsers] = useState<Set<string>>(new Set());
  const [typingUsers, setTypingUsers] = useState<Set<string>>(new Set());
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout>();
  
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [messages, setMessages] = useState<Record<string, Message[]>>({});

  // Load conversations and messages
  useEffect(() => {
    if (user) {
      loadConversations();
      setupRealtimeSubscriptions();
    }
  }, [user]);

  // Load messages when chat is selected
  useEffect(() => {
    if (selectedChat && user) {
      loadMessages(selectedChat);
      markMessagesAsRead(selectedChat);
    }
  }, [selectedChat, user]);

  // Scroll to bottom when new messages arrive
  useEffect(() => {
    scrollToBottom();
  }, [messages, selectedChat]);

  // Handle URL parameter
  useEffect(() => {
    if (chatId && !selectedChat) {
      setSelectedChat(chatId);
    }
  }, [chatId, selectedChat]);

  const loadConversations = async () => {
    try {
      setLoading(true);
      setError(null);

      // Use the new function to get user conversations
      const { data, error } = await supabase
        .rpc('get_user_conversations', { user_uuid: user?.id });

      if (error) throw error;

      const formattedConversations = data?.map(conv => ({
        id: conv.id,
        participant_id: conv.participant_id,
        name: conv.participant_name || 'Unknown',
        age: conv.participant_age || 25,
        location: conv.participant_location || 'Unknown',
        avatar: conv.participant_avatar || '',
        last_message: conv.last_message || '',
        last_message_time: new Date(conv.last_message_time),
        unread_count: conv.unread_count || 0,
        is_online: conv.is_online || false,
        is_verified: conv.is_verified || false,
        verification_level: conv.verification_level || 'basic',
        match_date: new Date(conv.match_date),
        is_typing: conv.is_typing || false,
        is_blocked: conv.is_blocked || false,
        is_muted: conv.is_muted || false,
        phone_call_enabled: conv.phone_call_enabled || true,
        video_call_enabled: conv.video_call_enabled || true
      })) || [];

      setConversations(formattedConversations);
    } catch (err) {
      console.error('Failed to load conversations:', err);
      setError('Failed to load conversations');
      // Load mock data as fallback
      loadMockConversations();
    } finally {
      setLoading(false);
    }
  };

  const loadMockConversations = () => {
    const mockConversations: Conversation[] = [
      {
        id: '1',
        participant_id: 'user1',
        name: 'Grace Mwangi',
        age: 26,
        location: 'Nairobi, Kenya',
        avatar: 'https://images.unsplash.com/photo-1494790108755-2616b332c8cd?w=400&h=400&fit=crop',
        last_message: 'That sounds amazing! When are you free?',
        last_message_time: new Date(Date.now() - 1000 * 60 * 5),
        unread_count: 2,
        is_online: true,
        is_verified: true,
        verification_level: 'premium',
        match_date: new Date(Date.now() - 1000 * 60 * 60 * 24 * 3),
        is_typing: false,
        is_blocked: false,
        is_muted: false,
        phone_call_enabled: true,
        video_call_enabled: true
      },
      {
        id: '2',
        participant_id: 'user2',
        name: 'Aisha Kabira',
        age: 29,
        location: 'Kigali, Rwanda',
        avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&h=400&fit=crop',
        last_message: 'Looking forward to our coffee date ☕',
        last_message_time: new Date(Date.now() - 1000 * 60 * 60 * 2),
        unread_count: 0,
        is_online: false,
        is_verified: true,
        verification_level: 'basic',
        match_date: new Date(Date.now() - 1000 * 60 * 60 * 24 * 7),
        is_typing: false,
        is_blocked: false,
        is_muted: false,
        phone_call_enabled: true,
        video_call_enabled: true
      }
    ];
    setConversations(mockConversations);
  };

  const loadMessages = async (conversationId: string) => {
    try {
      const { data, error } = await supabase
        .from('messages')
        .select('*')
        .eq('conversation_id', conversationId)
        .order('created_at', { ascending: true });

      if (error) throw error;

      const formattedMessages = data?.map(msg => ({
        id: msg.id,
        text: msg.content,
        sender: msg.sender_id,
        receiver: msg.receiver_id,
        timestamp: new Date(msg.created_at),
        read: msg.read_status,
        type: msg.message_type || 'text',
        delivery_status: msg.delivery_status || 'sent',
        edited: msg.edited,
        deleted: msg.deleted,
        reply_to: msg.reply_to,
        reactions: msg.reactions || {}
      })) || [];

      setMessages(prev => ({ ...prev, [conversationId]: formattedMessages }));
    } catch (err) {
      console.error('Failed to load messages:', err);
      // Load mock messages as fallback
      loadMockMessages(conversationId);
    }
  };

  const loadMockMessages = (conversationId: string) => {
    const mockMessages: Message[] = [
      {
        id: '1',
        text: 'Hey! I loved your profile',
        sender: 'user1',
        receiver: user?.id || '',
        timestamp: new Date(Date.now() - 1000 * 60 * 60 * 3),
        read: true,
        type: 'text',
        delivery_status: 'read'
      },
      {
        id: '2',
        text: 'Thank you! Yours is really interesting too',
        sender: user?.id || '',
        receiver: 'user1',
        timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2.5),
        read: true,
        type: 'text',
        delivery_status: 'read'
      },
      {
        id: '3',
        text: 'Would you like to grab coffee sometime?',
        sender: 'user1',
        receiver: user?.id || '',
        timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2),
        read: true,
        type: 'text',
        delivery_status: 'read'
      },
      {
        id: '4',
        text: 'I would love that! How about this weekend?',
        sender: user?.id || '',
        receiver: 'user1',
        timestamp: new Date(Date.now() - 1000 * 60 * 60 * 1.5),
        read: true,
        type: 'text',
        delivery_status: 'read'
      },
      {
        id: '5',
        text: 'That sounds amazing! When are you free?',
        sender: 'user1',
        receiver: user?.id || '',
        timestamp: new Date(Date.now() - 1000 * 60 * 5),
        read: false,
        type: 'text',
        delivery_status: 'delivered'
      }
    ];
    setMessages(prev => ({ ...prev, [conversationId]: mockMessages }));
  };

  const selectedConversation = conversations.find(c => c.id === selectedChat);
  const currentMessages = selectedChat ? messages[selectedChat] || [] : [];

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const setupRealtimeSubscriptions = () => {
    // Subscribe to new messages
    const messageSubscription = supabase
      .channel('messages')
      .on('postgres_changes', 
        { event: 'INSERT', schema: 'public', table: 'messages' },
        (payload) => {
          const newMessage = payload.new as any;
          if (newMessage.conversation_id === selectedChat) {
            const formattedMessage: Message = {
              id: newMessage.id,
              text: newMessage.content,
              sender: newMessage.sender_id,
              receiver: newMessage.receiver_id,
              timestamp: new Date(newMessage.created_at),
              read: newMessage.read,
              type: newMessage.type || 'text',
              delivery_status: newMessage.delivery_status || 'sent',
              edited: newMessage.edited,
              deleted: newMessage.deleted,
              reply_to: newMessage.reply_to,
              reactions: newMessage.reactions || {}
            };
            setMessages(prev => ({
              ...prev,
              [selectedChat]: [...(prev[selectedChat] || []), formattedMessage]
            }));
          }
        }
      )
      .subscribe();

    // Subscribe to typing indicators
    const typingSubscription = supabase
      .channel('typing')
      .on('postgres_changes',
        { event: '*', schema: 'public', table: 'typing_indicators' },
        (payload) => {
          const typing = payload.new as TypingIndicator;
          if (typing.conversation_id === selectedChat && typing.user_id !== user?.id) {
            setTypingUsers(prev => {
              const updated = new Set(prev);
              if (typing.is_typing) {
                updated.add(typing.user_id);
              } else {
                updated.delete(typing.user_id);
              }
              return updated;
            });
          }
        }
      )
      .subscribe();

    return () => {
      messageSubscription.unsubscribe();
      typingSubscription.unsubscribe();
    };
  };

  const markMessagesAsRead = async (conversationId: string) => {
    try {
      const conversation = conversations.find(c => c.id === conversationId);
      if (!conversation) return;

      // Use the new function to mark messages as read
      await supabase
        .rpc('mark_conversation_read', { 
          conversation_uuid: conversationId, 
          user_uuid: user?.id 
        });

      // Update local state
      setMessages(prev => ({
        ...prev,
        [conversationId]: prev[conversationId]?.map(msg => 
          msg.receiver === user?.id ? { ...msg, read: true, delivery_status: 'read' as const } : msg
        ) || []
      }));

      // Clear unread count
      setConversations(prev => prev.map(conv => 
        conv.id === conversationId ? { ...conv, unread_count: 0 } : conv
      ));
    } catch (err) {
      console.error('Failed to mark messages as read:', err);
    }
  };

  const handleSendMessage = async () => {
    if (!message.trim() || !selectedChat || !user) return;

    const tempMessage: Message = {
      id: Date.now().toString(),
      text: message,
      sender: user.id,
      receiver: selectedConversation?.participant_id || '',
      timestamp: new Date(),
      read: false,
      type: 'text',
      delivery_status: 'sending'
    };

    // Add message to local state immediately
    setMessages(prev => ({
      ...prev,
      [selectedChat]: [...(prev[selectedChat] || []), tempMessage]
    }));

    setMessage('');
    scrollToBottom();

    try {
      // Send to database using the new function
      const { data, error } = await supabase
        .rpc('send_message', {
          conversation_uuid: selectedChat,
          sender_uuid: user.id,
          message_content: message,
          message_type: 'text'
        });

      if (error) throw error;

      // Update message with real ID and status
      setMessages(prev => ({
        ...prev,
        [selectedChat]: prev[selectedChat]?.map(msg => 
          msg.id === tempMessage.id 
            ? { ...msg, id: data, delivery_status: 'sent' as const }
            : msg
        ) || []
      }));

      // Update conversations list to refresh last message
      loadConversations();

      // Update conversation
      setConversations(prev => prev.map(conv => 
        conv.id === selectedChat 
          ? { ...conv, last_message: message, last_message_time: new Date() }
          : conv
      ));

      // Simulate delivery and read status
      setTimeout(() => {
        setMessages(prev => ({
          ...prev,
          [selectedChat]: prev[selectedChat]?.map(msg => 
            msg.id === data.id ? { ...msg, delivery_status: 'delivered' as const } : msg
          ) || []
        }));
      }, 1000);

      setTimeout(() => {
        setMessages(prev => ({
          ...prev,
          [selectedChat]: prev[selectedChat]?.map(msg => 
            msg.id === data.id ? { ...msg, delivery_status: 'read' as const, read: true } : msg
          ) || []
        }));
      }, 3000);

    } catch (err) {
      console.error('Failed to send message:', err);
      // Remove temp message or mark as failed
      setMessages(prev => ({
        ...prev,
        [selectedChat]: prev[selectedChat]?.filter(msg => msg.id !== tempMessage.id) || []
      }));
    }
  };

  const handleTyping = () => {
    if (!selectedChat || !user) return;

    // Send typing indicator
    supabase
      .from('typing_indicators')
      .upsert({
        conversation_id: selectedChat,
        user_id: user.id,
        is_typing: true,
        timestamp: new Date().toISOString()
      });

    // Clear existing timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    // Stop typing after 3 seconds
    typingTimeoutRef.current = setTimeout(() => {
      supabase
        .from('typing_indicators')
        .upsert({
          conversation_id: selectedChat,
          user_id: user.id,
          is_typing: false,
          timestamp: new Date().toISOString()
        });
    }, 3000);
  };

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !selectedChat || !user) return;

    setUploadingImage(true);
    try {
      // Upload to Cloudinary or similar
      const imageUrl = URL.createObjectURL(file); // Temporary

      const tempMessage: Message = {
        id: Date.now().toString(),
        text: '',
        sender: user.id,
        receiver: selectedConversation?.participant_id || '',
        timestamp: new Date(),
        read: false,
        type: 'image',
        delivery_status: 'sending'
      };

      setMessages(prev => ({
        ...prev,
        [selectedChat]: [...(prev[selectedChat] || []), tempMessage]
      }));

      // Send to database
      const { data, error } = await supabase
        .from('messages')
        .insert({
          conversation_id: selectedChat,
          sender_id: user.id,
          receiver_id: selectedConversation?.participant_id,
          content: imageUrl,
          type: 'image',
          delivery_status: 'sent'
        })
        .select()
        .single();

      if (error) throw error;

      setMessages(prev => ({
        ...prev,
        [selectedChat]: prev[selectedChat]?.map(msg => 
          msg.id === tempMessage.id 
            ? { ...msg, id: data.id, text: imageUrl, delivery_status: 'sent' as const }
            : msg
        ) || []
      }));

    } catch (err) {
      console.error('Failed to upload image:', err);
    } finally {
      setUploadingImage(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleSelectChat = (chatId: string) => {
    setSelectedChat(chatId);
    // Update URL
    window.history.pushState({}, '', `/chat/${chatId}`);
  };

  const handleBlockUser = async () => {
    if (!selectedConversation) return;
    
    try {
      await supabase
        .from('conversations')
        .update({ is_blocked: true })
        .eq('id', selectedChat);
      
      setConversations(prev => prev.map(conv => 
        conv.id === selectedChat ? { ...conv, is_blocked: true } : conv
      ));
      
      setShowMoreOptions(false);
    } catch (err) {
      console.error('Failed to block user:', err);
    }
  };

  const handleReportUser = async () => {
    if (!selectedConversation) return;
    
    try {
      await supabase
        .from('user_reports')
        .insert({
          reporter_id: user?.id,
          reported_user_id: selectedConversation.participant_id,
          reason: 'Inappropriate behavior',
          description: 'Reported from chat'
        });
      
      setShowMoreOptions(false);
      alert('User reported successfully');
    } catch (err) {
      console.error('Failed to report user:', err);
    }
  };

  const formatTime = (date: Date) => {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return 'now';
    if (minutes < 60) return `${minutes}m`;
    if (hours < 24) return `${hours}h`;
    if (days < 7) return `${days}d`;
    return date.toLocaleDateString();
  };

  const formatMessageTime = (date: Date) => {
    return date.toLocaleTimeString('en-US', { 
      hour: 'numeric', 
      minute: '2-digit',
      hour12: true 
    });
  };

  const filteredConversations = conversations.filter(conv =>
    conv.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    conv.location.toLowerCase().includes(searchQuery.toLowerCase())
  );

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

        <div className="relative z-10 h-screen flex flex-col">
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
                    Messages
                  </h1>
                  <p className="text-white/80 text-sm">Connect with your matches</p>
                </motion.div>

                <motion.div
                  initial={{ x: 20, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  transition={{ duration: 0.5, delay: 0.2 }}
                  className="flex gap-2"
                >
                  <Button
                    onClick={() => setShowFilters(!showFilters)}
                    variant="outline"
                    size="sm"
                    style={{ 
                      backgroundColor: 'rgba(255,255,255,0.15)',
                      color: 'white',
                      border: '1px solid rgba(255,255,255,0.3)'
                    }}
                  >
                    <Filter className="w-4 h-4 mr-2" />
                    Filters
                  </Button>
                  <Link to="/matching">
                    <Button
                      variant="outline"
                      size="sm"
                      style={{ 
                        backgroundColor: 'rgba(255,255,255,0.15)',
                        color: 'white',
                        border: '1px solid rgba(255,255,255,0.3)'
                      }}
                    >
                      <Heart className="w-4 h-4 mr-2" />
                      Find Matches
                    </Button>
                  </Link>
                </motion.div>
              </div>
            </div>
          </div>

          <div className="flex-1 flex overflow-hidden">
            {/* Conversations List */}
            <div className={`${selectedChat ? 'hidden md:flex' : 'flex'} flex-col w-full md:w-96 border-r`} style={{ borderColor: '#E5E0D8' }}>
              {/* Search Bar */}
              <div className="p-4 border-b" style={{ borderColor: '#E5E0D8', backgroundColor: '#FFFFFF' }}>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4" style={{ color: '#A69F94' }} />
                  <Input
                    placeholder="Search conversations..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                    style={{ backgroundColor: '#F9F7F4', borderColor: '#E5E0D8' }}
                  />
                </div>
              </div>

              {/* Conversations */}
              <div className="flex-1 overflow-y-auto">
                {filteredConversations.map((conversation) => (
                  <motion.div
                    key={conversation.id}
                    initial={{ x: -20, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    transition={{ duration: 0.3 }}
                    onClick={() => handleSelectChat(conversation.id)}
                    className={`p-4 border-b cursor-pointer transition-colors ${
                      selectedChat === conversation.id ? 'bg-red-50' : 'hover:bg-gray-50'
                    }`}
                    style={{ borderColor: '#E5E0D8' }}
                  >
                    <div className="flex items-start gap-3">
                      <div className="relative">
                        <Avatar className="w-12 h-12">
                          <AvatarImage src={conversation.avatar} />
                          <AvatarFallback>{conversation.name[0]}</AvatarFallback>
                        </Avatar>
                        {conversation.is_online && (
                          <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-white" />
                        )}
                        {conversation.is_verified && (
                          <div className="absolute -top-1 -right-1">
                            <VerificationBadge level={conversation.verification_level || 'basic'} size="sm" />
                          </div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1">
                          <h3 className="font-semibold truncate" style={{ color: '#26231F' }}>
                            {conversation.name}, {conversation.age}
                          </h3>
                          <span className="text-xs" style={{ color: '#A69F94' }}>
                            {formatTime(conversation.last_message_time)}
                          </span>
                        </div>
                        <div className="flex items-center gap-1 mb-1">
                          <MapPin className="w-3 h-3" style={{ color: '#A69F94' }} />
                          <span className="text-xs" style={{ color: '#A69F94' }}>
                            {conversation.location}
                          </span>
                        </div>
                        <p className="text-sm truncate" style={{ color: '#5E5950' }}>
                          {conversation.last_message}
                        </p>
                      </div>
                      {conversation.unread_count > 0 && (
                        <div className="w-6 h-6 rounded-full flex items-center justify-center text-xs text-white font-semibold" style={{ backgroundColor: '#B11D2D' }}>
                          {conversation.unread_count}
                        </div>
                      )}
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>

            {/* Chat Area */}
            {selectedChat && selectedConversation ? (
              <div className="flex-1 flex flex-col">
                {/* Chat Header */}
                <div className="p-4 border-b flex items-center justify-between" style={{ borderColor: '#E5E0D8', backgroundColor: '#FFFFFF' }}>
                  <div className="flex items-center gap-3">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setSelectedChat(null)}
                      className="md:hidden"
                    >
                      <ArrowLeft className="w-4 h-4" />
                    </Button>
                    <div className="relative">
                      <Avatar className="w-10 h-10">
                        <AvatarImage src={selectedConversation.avatar} />
                        <AvatarFallback>{selectedConversation.name[0]}</AvatarFallback>
                      </Avatar>
                      {selectedConversation.is_online && (
                        <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-white" />
                      )}
                    </div>
                    <div>
                      <h3 className="font-semibold" style={{ color: '#26231F' }}>
                        {selectedConversation.name}, {selectedConversation.age}
                      </h3>
                      <p className="text-xs" style={{ color: '#5E5950' }}>
                        {selectedConversation.is_online ? 'Active now' : `Last seen ${formatTime(selectedConversation.last_message_time)}`}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button variant="ghost" size="sm">
                      <Phone className="w-4 h-4" />
                    </Button>
                    <Button variant="ghost" size="sm">
                      <Video className="w-4 h-4" />
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => setShowMoreOptions(!showMoreOptions)}>
                      <MoreVertical className="w-4 h-4" />
                    </Button>
                  </div>
                </div>

                {/* Messages */}
                <div className="flex-1 overflow-y-auto p-4 space-y-4">
                  {currentMessages.map((msg) => (
                    <motion.div
                      key={msg.id}
                      initial={{ y: 10, opacity: 0 }}
                      animate={{ y: 0, opacity: 1 }}
                      transition={{ duration: 0.3 }}
                      className={`flex ${msg.sender === user?.id ? 'justify-end' : 'justify-start'}`}
                    >
                      <div className={`max-w-xs lg:max-w-md px-4 py-2 rounded-2xl ${
                        msg.sender === 'me' 
                          ? 'text-white rounded-br-none' 
                          : 'rounded-bl-none'
                      }`} style={{ 
                        backgroundColor: msg.sender === user?.id ? '#B11D2D' : '#F0EDE8',
                        color: msg.sender === user?.id ? 'white' : '#26231F'
                      }}>
                        <p className="text-sm">{msg.text}</p>
                        <div className={`flex items-center gap-1 mt-1 text-xs ${
                          msg.sender === user?.id ? 'text-white/70' : 'text-gray-500'
                        }`}>
                          <span>{formatMessageTime(msg.timestamp)}</span>
                          {msg.sender === user?.id && (
                            msg.delivery_status === 'read' ? <CheckCheck className="w-3 h-3" /> : 
                            msg.delivery_status === 'delivered' ? <CheckCheck className="w-3 h-3 opacity-60" /> :
                            <Check className="w-3 h-3" />
                          )}
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>

                {/* Message Input */}
                <div className="p-4 border-t" style={{ borderColor: '#E5E0D8', backgroundColor: '#FFFFFF' }}>
                  {/* Typing Indicator */}
                  {typingUsers.size > 0 && (
                    <div className="mb-2 text-sm text-gray-500 italic">
                      Someone is typing...
                    </div>
                  )}
                  
                  <div className="flex items-center gap-2">
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleImageUpload}
                      className="hidden"
                    />
                    <Button variant="ghost" size="sm" onClick={() => fileInputRef.current?.click()} disabled={uploadingImage}>
                      <Paperclip className="w-4 h-4" />
                    </Button>
                    <Button variant="ghost" size="sm" disabled={uploadingImage}>
                      <Camera className="w-4 h-4" />
                    </Button>
                    <div className="flex-1 relative">
                      <Input
                        placeholder="Type a message..."
                        value={message}
                        onChange={(e) => {
                          setMessage(e.target.value);
                          handleTyping();
                        }}
                        onKeyPress={(e) => e.key === 'Enter' && !e.shiftKey && handleSendMessage()}
                        className="pr-10"
                        style={{ backgroundColor: '#F9F7F4', borderColor: '#E5E0D8' }}
                        disabled={uploadingImage}
                      />
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="absolute right-1 top-1"
                        onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                      >
                        <Smile className="w-4 h-4" />
                      </Button>
                    </div>
                    <Button
                      onClick={handleSendMessage}
                      disabled={!message.trim() || uploadingImage}
                      style={{ 
                        background: 'linear-gradient(90deg, #5E2A6B, #CFAF4E)',
                        color: 'white',
                        border: 'none'
                      }}
                    >
                      {uploadingImage ? (
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      ) : (
                        <Send className="w-4 h-4" />
                      )}
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => setShowGiftModal(true)}>
                      <Gift className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
                
                {/* More Options Dropdown */}
                <AnimatePresence>
                  {showMoreOptions && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      className="absolute top-16 right-4 bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-50"
                      style={{ borderColor: '#E5E0D8' }}
                    >
                      <Button
                        variant="ghost"
                        size="sm"
                        className="w-full justify-start px-4 py-2"
                        onClick={() => {
                          setShowProfileModal(true);
                          setShowMoreOptions(false);
                        }}
                      >
                        <User className="w-4 h-4 mr-2" />
                        View Profile
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="w-full justify-start px-4 py-2 text-red-600"
                        onClick={handleBlockUser}
                      >
                        <Ban className="w-4 h-4 mr-2" />
                        Block User
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="w-full justify-start px-4 py-2 text-red-600"
                        onClick={handleReportUser}
                      >
                        <Flag className="w-4 h-4 mr-2" />
                        Report User
                      </Button>
                    </motion.div>
                  )}
                </AnimatePresence>
                
                <div ref={messagesEndRef} />
              </div>
            ) : (
              /* Empty State */
              <div className="hidden md:flex flex-1 items-center justify-center">
                <div className="text-center">
                  <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-gray-100 flex items-center justify-center">
                    <Heart className="w-10 h-10" style={{ color: '#A69F94' }} />
                  </div>
                  <h3 className="text-xl font-semibold mb-2" style={{ color: '#26231F' }}>
                    Select a conversation
                  </h3>
                  <p style={{ color: '#5E5950' }}>
                    Choose a match from the list to start chatting
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </AuthGuard>
  );
};

export default Chat;

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link, useParams, useNavigate } from 'react-router-dom';
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
import { BottomSheet } from '@/components/ui/BottomSheet';
import { useKeyboard } from '@/hooks/useKeyboard';
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
  const navigate = useNavigate();
  const { isKeyboardVisible } = useKeyboard();
  
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
        .rpc('get_conversation_messages', { 
          conversation_uuid: conversationId,
          limit: 50 
        });

      if (error) throw error;

      const formattedMessages = data?.map(msg => ({
        id: msg.id,
        text: msg.content || '',
        sender: msg.sender_id,
        receiver: msg.receiver_id,
        timestamp: new Date(msg.created_at),
        read: msg.read || false,
        type: msg.message_type || 'text',
        delivery_status: msg.read ? 'read' : 'delivered',
        edited: msg.edited || false,
        deleted: msg.deleted || false
      })) || [];

      setMessages(prev => ({ ...prev, [conversationId]: formattedMessages }));
    } catch (err) {
      console.error('Failed to load messages:', err);
      loadMockMessages(conversationId);
    }
  };

  const loadMockMessages = (conversationId: string) => {
    const mockMessages: Message[] = [
      {
        id: '1',
        text: 'Hey! I saw your profile and really liked what I read 😊',
        sender: 'user1',
        receiver: user?.id || '',
        timestamp: new Date(Date.now() - 1000 * 60 * 30),
        read: true,
        type: 'text',
        delivery_status: 'read'
      },
      {
        id: '2',
        text: 'Thank you! I felt the same way when I saw yours',
        sender: user?.id || '',
        receiver: 'user1',
        timestamp: new Date(Date.now() - 1000 * 60 * 25),
        read: true,
        type: 'text',
        delivery_status: 'read'
      },
      {
        id: '3',
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

  const setupRealtimeSubscriptions = () => {
    // Subscribe to new messages
    const messageSubscription = supabase
      .channel('messages')
      .on('postgres_changes', 
        { event: 'INSERT', schema: 'public', table: 'messages' },
        (payload) => {
          const newMessage = payload.new;
          if (newMessage.conversation_id === selectedChat) {
            setMessages(prev => ({
              ...prev,
              [selectedChat!]: [...(prev[selectedChat!] || []), {
                id: newMessage.id,
                text: newMessage.content,
                sender: newMessage.sender_id,
                receiver: newMessage.receiver_id,
                timestamp: new Date(newMessage.created_at),
                read: false,
                type: newMessage.message_type || 'text',
                delivery_status: 'sent'
              }]
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
          if (typing.conversation_id === selectedChat) {
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
      await supabase
        .rpc('mark_messages_read', { conversation_uuid: conversationId });
    } catch (err) {
      console.error('Failed to mark messages as read:', err);
    }
  };

  const handleSendMessage = async () => {
    if (!message.trim() || uploadingImage) return;

    try {
      const tempMessage: Message = {
        id: Date.now().toString(),
        text: message,
        sender: user?.id || '',
        receiver: selectedChat || '',
        timestamp: new Date(),
        read: false,
        type: 'text',
        delivery_status: 'sending'
      };

      setMessages(prev => ({
        ...prev,
        [selectedChat!]: [...(prev[selectedChat!] || []), tempMessage]
      }));

      setMessage('');

      const { data, error } = await supabase
        .rpc('send_message', {
          sender_uuid: user?.id,
          receiver_uuid: selectedChat,
          content: message,
          message_type: 'text'
        });

      if (error) throw error;

      // Update message status
      setMessages(prev => ({
        ...prev,
        [selectedChat!]: prev[selectedChat!].map(msg =>
          msg.id === tempMessage.id
            ? { ...msg, id: data.id, delivery_status: 'sent' }
            : msg
        )
      }));

    } catch (err) {
      console.error('Failed to send message:', err);
      setError('Failed to send message');
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingImage(true);
    try {
      // Upload image to Supabase storage
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}.${fileExt}`;
      
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('chat-images')
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('chat-images')
        .getPublicUrl(fileName);

      // Send image message
      const { data, error } = await supabase
        .rpc('send_message', {
          sender_uuid: user?.id,
          receiver_uuid: selectedChat,
          content: publicUrl,
          message_type: 'image'
        });

      if (error) throw error;

      const imageMessage: Message = {
        id: data.id,
        text: publicUrl,
        sender: user?.id || '',
        receiver: selectedChat || '',
        timestamp: new Date(),
        read: false,
        type: 'image',
        delivery_status: 'sent'
      };

      setMessages(prev => ({
        ...prev,
        [selectedChat!]: [...(prev[selectedChat!] || []), imageMessage]
      }));

    } catch (err) {
      console.error('Failed to upload image:', err);
      setError('Failed to upload image');
    } finally {
      setUploadingImage(false);
    }
  };

  const handleTyping = () => {
    if (!selectedChat) return;

    // Clear existing timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    // Set typing indicator
    setTypingUsers(prev => new Set(prev).add(user?.id || ''));

    // Clear typing indicator after 1 second of inactivity
    typingTimeoutRef.current = setTimeout(() => {
      setTypingUsers(prev => {
        const updated = new Set(prev);
        updated.delete(user?.id || '');
        return updated;
      });
    }, 1000);
  };

  const handleBlockUser = async () => {
    try {
      await supabase
        .rpc('block_user', { 
          blocker_uuid: user?.id,
          blocked_uuid: selectedChat 
        });
      
      setShowMoreOptions(false);
      // Update conversation state
      setConversations(prev => prev.map(conv =>
        conv.id === selectedChat
          ? { ...conv, is_blocked: true }
          : conv
      ));
    } catch (err) {
      console.error('Failed to block user:', err);
      setError('Failed to block user');
    }
  };

  const handleReportUser = async () => {
    try {
      await supabase
        .rpc('report_user', { 
          reporter_uuid: user?.id,
          reported_uuid: selectedChat,
          reason: 'inappropriate_behavior'
        });
      
      setShowMoreOptions(false);
      setError('User reported successfully');
    } catch (err) {
      console.error('Failed to report user:', err);
      setError('Failed to report user');
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const formatTime = (date: Date) => {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return 'just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    return `${days}d ago`;
  };

  const formatMessageTime = (date: Date) => {
    return date.toLocaleTimeString('en-US', { 
      hour: 'numeric', 
      minute: '2-digit',
      hour12: true 
    });
  };

  const selectedConversation = conversations.find(conv => conv.id === selectedChat);
  const currentMessages = messages[selectedChat || ''] || [];
  const filteredConversations = conversations.filter(conv =>
    conv.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    conv.location.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-purple-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Loading conversations...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <X className="w-8 h-8 text-red-600" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Something went wrong</h3>
          <p className="text-gray-600 mb-4">{error}</p>
          <Button onClick={loadConversations}>Try Again</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Mobile: Full-screen conversation list */}
      <div className="md:hidden">
        {!selectedChat ? (
          /* Mobile Conversation List */
          <div className="w-full h-screen flex flex-col">
            {/* Mobile Header */}
            <div className="bg-white border-b border-gray-200 p-4 pt-safe">
              <div className="flex items-center justify-between mb-4">
                <h1 className="text-xl font-bold">Messages</h1>
                <Button variant="ghost" size="sm" onClick={() => setShowFilters(true)}>
                  <Filter className="w-5 h-5" />
                </Button>
              </div>
              
              {/* Search */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  placeholder="Search conversations..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 touch-target"
                />
              </div>
            </div>

            {/* Conversation List */}
            <div className="flex-1 overflow-y-auto">
              {filteredConversations.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-center p-8">
                  <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                    <Users className="w-8 h-8 text-gray-400" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">No conversations</h3>
                  <p className="text-gray-600">Start matching to see conversations here</p>
                </div>
              ) : (
                filteredConversations.map((conversation) => (
                  <motion.div
                    key={conversation.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    onClick={() => {
                      setSelectedChat(conversation.id);
                      navigate(`/chat/${conversation.id}`);
                    }}
                    className="bg-white border-b border-gray-100 p-4 cursor-pointer hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className="relative">
                        <Avatar className="w-12 h-12">
                          <AvatarImage src={conversation.avatar} />
                          <AvatarFallback>{conversation.name[0]}</AvatarFallback>
                        </Avatar>
                        {conversation.is_online && (
                          <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-white" />
                        )}
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1">
                          <h3 className="font-semibold text-gray-900 truncate">
                            {conversation.name}, {conversation.age}
                          </h3>
                          <span className="text-xs text-gray-500">
                            {formatTime(conversation.last_message_time)}
                          </span>
                        </div>
                        
                        <div className="flex items-center justify-between">
                          <p className="text-sm text-gray-600 truncate">
                            {conversation.last_message}
                          </p>
                          {conversation.unread_count > 0 && (
                            <div className="w-5 h-5 rounded-full bg-purple-600 text-white text-xs font-semibold flex items-center justify-center">
                              {conversation.unread_count}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ))
              )}
            </div>
          </div>
        ) : (
          /* Mobile Chat View */
          <div className="w-full h-screen flex flex-col">
            {/* Mobile Chat Header */}
            <div className="bg-white border-b border-gray-200 p-4 pt-safe">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setSelectedChat(null);
                      navigate('/chat');
                    }}
                  >
                    <ArrowLeft className="w-5 h-5" />
                  </Button>
                  
                  {selectedConversation && (
                    <>
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
                        <h3 className="font-semibold text-gray-900">
                          {selectedConversation.name}, {selectedConversation.age}
                        </h3>
                        <p className="text-xs text-gray-500">
                          {selectedConversation.is_online ? 'Active now' : `Last seen ${formatTime(selectedConversation.last_message_time)}`}
                        </p>
                      </div>
                    </>
                  )}
                </div>
                
                {selectedConversation && (
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
                )}
              </div>
            </div>

            {/* Mobile Messages */}
            <div className="flex-1 overflow-y-auto p-4">
              {currentMessages.map((msg) => (
                <motion.div
                  key={msg.id}
                  initial={{ y: 10, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ duration: 0.3 }}
                  className={`flex mb-4 ${msg.sender === user?.id ? 'justify-end' : 'justify-start'}`}
                >
                  <div className={`max-w-xs lg:max-w-md px-4 py-2 rounded-2xl ${
                    msg.sender === user?.id 
                      ? 'bg-purple-600 text-white rounded-br-none' 
                      : 'bg-gray-100 text-gray-900 rounded-bl-none'
                  }`}>
                    <p className="text-sm break-words">{msg.text}</p>
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
              
              {/* Typing Indicator */}
              {typingUsers.size > 0 && (
                <div className="flex justify-start mb-4">
                  <div className="bg-gray-100 rounded-2xl rounded-bl-none px-4 py-2">
                    <div className="flex gap-1">
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                    </div>
                  </div>
                </div>
              )}
              
              <div ref={messagesEndRef} />
            </div>

            {/* Mobile Message Input */}
            <div className={`bg-white border-t border-gray-200 p-4 pb-safe transition-all duration-300 ${
              isKeyboardVisible ? 'pb-8' : 'pb-4'
            }`}>
              <div className="flex items-center gap-2">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="hidden"
                />
                <Button variant="ghost" size="sm" onClick={() => fileInputRef.current?.click()} disabled={uploadingImage} className="touch-target">
                  <Paperclip className="w-5 h-5" />
                </Button>
                <Button variant="ghost" size="sm" disabled={uploadingImage} className="touch-target">
                  <Camera className="w-5 h-5" />
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
                    className="pr-10 touch-target"
                    disabled={uploadingImage}
                  />
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="absolute right-1 top-1/2 transform -translate-y-1/2"
                    onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                  >
                    <Smile className="w-4 h-4" />
                  </Button>
                </div>
                <Button
                  onClick={handleSendMessage}
                  disabled={!message.trim() || uploadingImage}
                  className="touch-target bg-gradient-to-r from-purple-600 to-pink-600"
                >
                  {uploadingImage ? (
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <Send className="w-4 h-4" />
                  )}
                </Button>
                <Button variant="ghost" size="sm" onClick={() => setShowGiftModal(true)} className="touch-target">
                  <Gift className="w-5 h-5" />
                </Button>
              </div>
            </div>

            {/* Mobile More Options */}
            <AnimatePresence>
              {showMoreOptions && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className="absolute bottom-20 right-4 bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-50 min-w-[150px]"
                >
                  <Button
                    variant="ghost"
                    size="sm"
                    className="w-full justify-start px-4 py-2 touch-target"
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
                    className="w-full justify-start px-4 py-2 text-red-600 touch-target"
                    onClick={handleBlockUser}
                  >
                    <Ban className="w-4 h-4 mr-2" />
                    Block User
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="w-full justify-start px-4 py-2 text-red-600 touch-target"
                    onClick={handleReportUser}
                  >
                    <Flag className="w-4 h-4 mr-2" />
                    Report User
                  </Button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}
      </div>

      {/* Desktop: Split view */}
      <div className="hidden md:flex w-full h-screen">
        {/* Desktop Sidebar */}
        <div className="w-80 bg-white border-r border-gray-200 flex flex-col">
          {/* Desktop Header */}
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-center justify-between mb-4">
              <h1 className="text-xl font-bold">Messages</h1>
              <Button variant="ghost" size="sm" onClick={() => setShowFilters(true)}>
                <Filter className="w-4 h-4" />
              </Button>
            </div>
            
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                placeholder="Search conversations..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          {/* Desktop Conversation List */}
          <div className="flex-1 overflow-y-auto">
            {filteredConversations.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-center p-8">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                  <Users className="w-8 h-8 text-gray-400" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">No conversations</h3>
                <p className="text-gray-600">Start matching to see conversations here</p>
              </div>
            ) : (
              filteredConversations.map((conversation, index) => (
                <motion.div
                  key={conversation.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 }}
                  onClick={() => {
                    setSelectedChat(conversation.id);
                    navigate(`/chat/${conversation.id}`);
                  }}
                  className={`p-4 cursor-pointer hover:bg-gray-50 transition-colors border-b border-gray-100 ${
                    selectedChat === conversation.id ? 'bg-purple-50 border-purple-200' : ''
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className="relative">
                      <Avatar className="w-12 h-12">
                        <AvatarImage src={conversation.avatar} />
                        <AvatarFallback>{conversation.name[0]}</AvatarFallback>
                      </Avatar>
                      {conversation.is_online && (
                        <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-white" />
                      )}
                      {conversation.verification_level && (
                        <VerificationBadge level={conversation.verification_level} />
                      )}
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <h3 className="font-semibold text-gray-900 truncate">
                          {conversation.name}, {conversation.age}
                        </h3>
                        <span className="text-xs text-gray-500">
                          {formatTime(conversation.last_message_time)}
                        </span>
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <p className="text-sm text-gray-600 truncate">
                          {conversation.last_message}
                        </p>
                        {conversation.unread_count > 0 && (
                          <div className="w-5 h-5 rounded-full bg-purple-600 text-white text-xs font-semibold flex items-center justify-center">
                            {conversation.unread_count}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))
            )}
          </div>
        </div>

        {/* Desktop Chat Area */}
        <div className="flex-1 flex flex-col">
          {selectedChat && selectedConversation ? (
            <>
              {/* Desktop Chat Header */}
              <div className="bg-white border-b border-gray-200 p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="relative">
                      <Avatar className="w-10 h-10">
                        <AvatarImage src={selectedConversation.avatar} />
                        <AvatarFallback>{selectedConversation.name[0]}</AvatarFallback>
                      </Avatar>
                      {selectedConversation.is_online && (
                        <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-white" />
                      )}
                      {selectedConversation.verification_level && (
                        <VerificationBadge level={selectedConversation.verification_level} />
                      )}
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900">
                        {selectedConversation.name}, {selectedConversation.age}
                      </h3>
                      <p className="text-xs text-gray-500">
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
              </div>

              {/* Desktop Messages */}
              <div className="flex-1 overflow-y-auto p-6">
                {currentMessages.map((msg) => (
                  <motion.div
                    key={msg.id}
                    initial={{ y: 10, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ duration: 0.3 }}
                    className={`flex mb-4 ${msg.sender === user?.id ? 'justify-end' : 'justify-start'}`}
                  >
                    <div className={`max-w-md px-4 py-2 rounded-2xl ${
                      msg.sender === user?.id 
                        ? 'bg-purple-600 text-white rounded-br-none' 
                        : 'bg-gray-100 text-gray-900 rounded-bl-none'
                    }`}>
                      <p className="text-sm break-words">{msg.text}</p>
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
                
                {/* Typing Indicator */}
                {typingUsers.size > 0 && (
                  <div className="flex justify-start mb-4">
                    <div className="bg-gray-100 rounded-2xl rounded-bl-none px-4 py-2">
                      <div className="flex gap-1">
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                      </div>
                    </div>
                  </div>
                )}
                
                <div ref={messagesEndRef} />
              </div>

              {/* Desktop Message Input */}
              <div className="bg-white border-t border-gray-200 p-4">
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
                      disabled={uploadingImage}
                    />
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="absolute right-1 top-1/2 transform -translate-y-1/2"
                      onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                    >
                      <Smile className="w-4 h-4" />
                    </Button>
                  </div>
                  <Button
                    onClick={handleSendMessage}
                    disabled={!message.trim() || uploadingImage}
                    className="bg-gradient-to-r from-purple-600 to-pink-600"
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
            </>
          ) : (
            /* Desktop Empty State */
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center">
                <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-gray-100 flex items-center justify-center">
                  <Heart className="w-10 h-10 text-gray-400" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">Select a conversation</h3>
                <p className="text-gray-600">Choose a match from the list to start chatting</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Filters Bottom Sheet (Mobile) */}
      <BottomSheet open={showFilters} onClose={() => setShowFilters(false)} title="Filter Conversations">
        <div className="p-4 space-y-4">
          <div>
            <label className="text-sm font-medium mb-2 block">Show only</label>
            <div className="space-y-2">
              <label className="flex items-center space-x-2">
                <input type="checkbox" />
                <span className="text-sm">Unread messages</span>
              </label>
              <label className="flex items-center space-x-2">
                <input type="checkbox" />
                <span className="text-sm">Online users</span>
              </label>
              <label className="flex items-center space-x-2">
                <input type="checkbox" />
                <span className="text-sm">Verified users</span>
              </label>
            </div>
          </div>
          
          <div className="flex gap-3 pt-4 border-t">
            <Button variant="outline" className="flex-1" onClick={() => setShowFilters(false)}>
              Cancel
            </Button>
            <Button className="flex-1" onClick={() => setShowFilters(false)}>
              Apply Filters
            </Button>
          </div>
        </div>
      </BottomSheet>
    </div>
  );
};

export default Chat;

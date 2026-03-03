import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
    storage: typeof window !== 'undefined' ? window.localStorage : null,
  },
})

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          username: string
          full_name: string | null
          avatar_url: string | null
          bio: string | null
          age: number | null
          gender: 'male' | 'female' | 'other' | null
          country: string | null
          city: string | null
          tribe: string | null
          languages: string[] | null
          interests: string[] | null
          relationship_intention: 'looking_for_love' | 'serious_only' | 'friends_first' | 'sugar_daddy' | 'sugar_mommy' | null
          verification_level: 'basic' | 'standard' | 'premium'
          is_verified: boolean
          is_premium: boolean
          vip_tier: 'free' | 'basic' | 'premium' | 'platinum' | 'diamond'
          coins_balance: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          username: string
          full_name?: string | null
          avatar_url?: string | null
          bio?: string | null
          age?: number | null
          gender?: 'male' | 'female' | 'other' | null
          country?: string | null
          city?: string | null
          tribe?: string | null
          languages?: string[] | null
          interests?: string[] | null
          relationship_intention?: 'looking_for_love' | 'serious_only' | 'friends_first' | 'sugar_daddy' | 'sugar_mommy' | null
          verification_level?: 'basic' | 'standard' | 'premium'
          is_verified?: boolean
          is_premium?: boolean
          vip_tier?: 'free' | 'basic' | 'premium' | 'platinum' | 'diamond'
          coins_balance?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          username?: string
          full_name?: string | null
          avatar_url?: string | null
          bio?: string | null
          age?: number | null
          gender?: 'male' | 'female' | 'other' | null
          country?: string | null
          city?: string | null
          tribe?: string | null
          languages?: string[] | null
          interests?: string[] | null
          relationship_intention?: 'looking_for_love' | 'serious_only' | 'friends_first' | 'sugar_daddy' | 'sugar_mommy' | null
          verification_level?: 'basic' | 'standard' | 'premium'
          is_verified?: boolean
          is_premium?: boolean
          vip_tier?: 'free' | 'basic' | 'premium' | 'platinum' | 'diamond'
          coins_balance?: number
          created_at?: string
          updated_at?: string
        }
      }
      matches: {
        Row: {
          id: string
          user1_id: string
          user2_id: string
          status: 'pending' | 'matched' | 'rejected' | 'expired'
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user1_id: string
          user2_id: string
          status?: 'pending' | 'matched' | 'rejected' | 'expired'
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user1_id?: string
          user2_id?: string
          status?: 'pending' | 'matched' | 'rejected' | 'expired'
          created_at?: string
          updated_at?: string
        }
      }
      messages: {
        Row: {
          id: string
          match_id: string
          sender_id: string
          content: string
          message_type: 'text' | 'image' | 'voice' | 'gift'
          gift_id?: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          match_id: string
          sender_id: string
          content: string
          message_type?: 'text' | 'image' | 'voice' | 'gift'
          gift_id?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          match_id?: string
          sender_id?: string
          content?: string
          message_type?: 'text' | 'image' | 'voice' | 'gift'
          gift_id?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      gifts: {
        Row: {
          id: string
          name: string
          name_local: string
          description: string
          tier: 'everyday' | 'romantic' | 'serious' | 'legendary' | 'real_world'
          cost_coins: number
          animation_url: string | null
          icon_url: string | null
          is_active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          name_local: string
          description: string
          tier: 'everyday' | 'romantic' | 'serious' | 'legendary' | 'real_world'
          cost_coins: number
          animation_url?: string | null
          icon_url?: string | null
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          name_local?: string
          description?: string
          tier?: 'everyday' | 'romantic' | 'serious' | 'legendary' | 'real_world'
          cost_coins?: number
          animation_url?: string | null
          icon_url?: string | null
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      sent_gifts: {
        Row: {
          id: string
          from_user_id: string
          to_user_id: string
          gift_id: string
          message: string | null
          created_at: string
        }
        Insert: {
          id?: string
          from_user_id: string
          to_user_id: string
          gift_id: string
          message?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          from_user_id?: string
          to_user_id?: string
          gift_id?: string
          message?: string | null
          created_at?: string
        }
      }
      live_rooms: {
        Row: {
          id: string
          host_id: string
          title: string
          description: string | null
          room_type: 'public' | 'private' | 'speed_dating'
          is_active: boolean
          viewer_count: number
          max_viewers: number
          cost_per_minute: number | null
          thumbnail_url: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          host_id: string
          title: string
          description?: string | null
          room_type?: 'public' | 'private' | 'speed_dating'
          is_active?: boolean
          viewer_count?: number
          max_viewers?: number
          cost_per_minute?: number | null
          thumbnail_url?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          host_id?: string
          title?: string
          description?: string | null
          room_type?: 'public' | 'private' | 'speed_dating'
          is_active?: boolean
          viewer_count?: number
          max_viewers?: number
          cost_per_minute?: number | null
          thumbnail_url?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      subscriptions: {
        Row: {
          id: string
          user_id: string
          tier: 'basic' | 'premium' | 'platinum' | 'diamond'
          status: 'active' | 'cancelled' | 'expired'
          start_date: string
          end_date: string
          amount: number
          currency: string
          payment_method: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          tier: 'basic' | 'premium' | 'platinum' | 'diamond'
          status?: 'active' | 'cancelled' | 'expired'
          start_date: string
          end_date: string
          amount: number
          currency: string
          payment_method: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          tier?: 'basic' | 'premium' | 'platinum' | 'diamond'
          status?: 'active' | 'cancelled' | 'expired'
          start_date?: string
          end_date?: string
          amount?: number
          currency?: string
          payment_method?: string
          created_at?: string
          updated_at?: string
        }
      }
      coin_transactions: {
        Row: {
          id: string
          user_id: string
          amount: number
          transaction_type: 'purchase' | 'gift_sent' | 'gift_received' | 'withdrawal' | 'bonus'
          description: string
          reference_id: string | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          amount: number
          transaction_type: 'purchase' | 'gift_sent' | 'gift_received' | 'withdrawal' | 'bonus'
          description: string
          reference_id?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          amount?: number
          transaction_type?: 'purchase' | 'gift_sent' | 'gift_received' | 'withdrawal' | 'bonus'
          description?: string
          reference_id?: string | null
          created_at?: string
        }
      }
      blocked_users: {
        Row: {
          id: string
          blocker_id: string
          blocked_user_id: string
          created_at: string
        }
        Insert: {
          id: string
          blocker_id: string
          blocked_user_id: string
          created_at?: string
        }
        Update: {
          id?: string
          blocker_id?: string
          blocked_user_id?: string
          created_at?: string
        }
      }
      profile_reports: {
        Row: {
          id: string
          reporter_id: string
          reported_user_id: string
          reason: string
          category: 'fake_profile' | 'inappropriate_content' | 'scam' | 'harassment' | 'underage' | 'other'
          description: string
          evidence: string[] | null
          status: 'pending' | 'reviewing' | 'resolved' | 'dismissed'
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          reporter_id: string
          reported_user_id: string
          reason: string
          category: 'fake_profile' | 'inappropriate_content' | 'scam' | 'harassment' | 'underage' | 'other'
          description: string
          evidence?: string[] | null
          status?: 'pending' | 'reviewing' | 'resolved' | 'dismissed'
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          reporter_id?: string
          reported_user_id?: string
          reason?: string
          category?: 'fake_profile' | 'inappropriate_content' | 'scam' | 'harassment' | 'underage' | 'other'
          description?: string
          evidence?: string[] | null
          status?: 'pending' | 'reviewing' | 'resolved' | 'dismissed'
          updated_at?: string
        }
      }
      moderation_actions: {
        Row: {
          id: string
          report_id: string
          action: 'warn' | 'suspend' | 'ban' | 'clear'
          moderator_id: string
          notes: string | null
          duration_days: number | null
          created_at: string
        }
        Insert: {
          id?: string
          report_id: string
          action: 'warn' | 'suspend' | 'ban' | 'clear'
          moderator_id: string
          notes?: string | null
          duration_days?: number | null
          created_at?: string
        }
      }
      phone_history: {
        Row: {
          id: string
          user_id: string
          phone_number: string
          country: string
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          phone_number: string
          country: string
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          phone_number?: string
          country?: string
          created_at?: string
        }
      }
      safety_alerts: {
        Row: {
          id: string
          user_id: string
          alert_type: 'scam_attempt' | 'inappropriate_content' | 'suspicious_activity'
          details: any
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          alert_type: 'scam_attempt' | 'inappropriate_content' | 'suspicious_activity'
          details: any
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          alert_type: 'scam_attempt' | 'inappropriate_content' | 'suspicious_activity'
          details: any
          created_at?: string
        }
      }
    }
  }
}

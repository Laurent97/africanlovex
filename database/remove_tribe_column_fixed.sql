-- Remove tribe/ethnicity column from profiles table
-- This removes the tribe field that was previously part of the signup process

-- First, update the view to remove tribe dependency
CREATE OR REPLACE VIEW user_profiles_with_stats AS
SELECT 
    p.id,
    p.username,
    p.full_name,
    p.avatar_url,
    p.bio,
    p.age,
    p.gender,
    p.country,
    p.city,
    p.languages,
    p.interests,
    p.relationship_intention,
    p.verification_level,
    p.is_verified,
    p.is_premium,
    p.vip_tier,
    p.coins_balance,
    p.created_at,
    p.updated_at,
    
    -- Stats
    COALESCE(match_stats.total_matches, 0) as total_matches,
    COALESCE(message_stats.unread_messages, 0) as unread_messages,
    COALESCE(view_stats.profile_views, 0) as profile_views,
    COALESCE(gift_stats_sent.gifts_sent, 0) as gifts_sent,
    COALESCE(gift_stats_received.gifts_received, 0) as gifts_received
FROM profiles p
LEFT JOIN (
    SELECT 
        CASE WHEN user1_id = p.id THEN user2_id ELSE user1_id END as matched_user_id,
        COUNT(*) as total_matches
    FROM matches m
    WHERE m.status = 'matched'
    AND (m.user1_id = p.id OR m.user2_id = p.id)
    GROUP BY CASE WHEN user1_id = p.id THEN user2_id ELSE user1_id END
) match_stats ON true

LEFT JOIN (
    SELECT 
        COUNT(*) as unread_messages
    FROM messages msg
    WHERE msg.receiver_id = p.id
    AND msg.read_status = false
) message_stats ON true

LEFT JOIN (
    SELECT 
        COUNT(*) as profile_views
    FROM profile_views pv
    WHERE pv.profile_id = p.id
    AND pv.created_at >= NOW() - INTERVAL '7 days'
) view_stats ON true

LEFT JOIN (
    SELECT 
        COUNT(*) as gifts_sent
    FROM sent_gifts sg
    WHERE sg.from_user_id = p.id
) gift_stats_sent ON true

LEFT JOIN (
    SELECT 
        COUNT(*) as gifts_received
    FROM sent_gifts sg
    WHERE sg.to_user_id = p.id
) gift_stats_received ON true;

-- Now safely drop the tribe column
ALTER TABLE profiles DROP COLUMN IF EXISTS tribe;

-- Note: This migration first updates the view to remove tribe dependency,
-- then safely drops the column. The tribe field has been removed from the frontend.

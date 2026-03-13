-- Optimized Dashboard Functions for Performance
-- These functions replace multiple separate queries with single optimized calls

-- Function to get all dashboard stats in one call
CREATE OR REPLACE FUNCTION get_user_dashboard_stats(p_user_id UUID)
RETURNS TABLE(
    total_matches BIGINT,
    new_messages BIGINT,
    profile_views BIGINT,
    gifts_received BIGINT,
    gifts_sent BIGINT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        (SELECT COUNT(*)::BIGINT FROM matches 
         WHERE (user1_id = p_user_id OR user2_id = p_user_id) 
         AND status = 'matched') as total_matches,
        
        (SELECT COUNT(*)::BIGINT FROM messages 
         WHERE receiver_id = p_user_id 
         AND read_status = false) as new_messages,
        
        (SELECT COUNT(*)::BIGINT FROM profile_views 
         WHERE profile_id = p_user_id 
         AND created_at >= NOW() - INTERVAL '7 days') as profile_views,
        
        (SELECT COUNT(*)::BIGINT FROM sent_gifts 
         WHERE to_user_id = p_user_id) as gifts_received,
        
        (SELECT COUNT(*)::BIGINT FROM sent_gifts 
         WHERE from_user_id = p_user_id) as gifts_sent;
END;
$$;

-- Function to get recent activity in one call
CREATE OR REPLACE FUNCTION get_user_recent_activity(
    p_user_id UUID,
    limit_count INTEGER DEFAULT 10
)
RETURNS TABLE(
    id TEXT,
    type TEXT,
    user_id UUID,
    user_name TEXT,
    user_avatar TEXT,
    user_age INTEGER,
    user_verified BOOLEAN,
    message TEXT,
    created_at TIMESTAMP WITH TIME ZONE,
    action_url TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    -- Recent matches
    SELECT 
        'match-' || m.id::TEXT as id,
        'match' as type,
        CASE WHEN m.user1_id = p_user_id THEN m.user2_id ELSE m.user1_id END as user_id,
        COALESCE(CASE 
            WHEN m.user1_id = p_user_id THEN p2.full_name 
            ELSE p1.full_name 
        END, CASE 
            WHEN m.user1_id = p_user_id THEN p2.username 
            ELSE p1.username 
        END, 'Anonymous') as user_name,
        COALESCE(CASE 
            WHEN m.user1_id = p_user_id THEN p2.avatar_url 
            ELSE p1.avatar_url 
        END, '') as user_avatar,
        COALESCE(CASE 
            WHEN m.user1_id = p_user_id THEN p2.age 
            ELSE p1.age 
        END, 25) as user_age,
        COALESCE(CASE 
            WHEN m.user1_id = p_user_id THEN p2.is_verified 
            ELSE p1.is_verified 
        END, false) as user_verified,
        'You matched with ' || COALESCE(CASE 
            WHEN m.user1_id = p_user_id THEN p2.full_name 
            ELSE p1.full_name 
        END, CASE 
            WHEN m.user1_id = p_user_id THEN p2.username 
            ELSE p1.username 
        END, 'Anonymous') || '!' as message,
        m.created_at as created_at,
        '/chat/' || CASE WHEN m.user1_id = p_user_id THEN m.user2_id::TEXT ELSE m.user1_id::TEXT END || '?newMatch=true' as action_url
    FROM matches m
    LEFT JOIN profiles p1 ON m.user1_id = p1.id
    LEFT JOIN profiles p2 ON m.user2_id = p2.id
    WHERE (m.user1_id = p_user_id OR m.user2_id = p_user_id)
    AND m.status = 'matched'
    
    UNION ALL
    
    -- Recent messages
    SELECT 
        'msg-' || msg.id::TEXT as id,
        'message' as type,
        msg.sender_id as user_id,
        COALESCE(p.full_name, p.username, 'Anonymous') as user_name,
        COALESCE(p.avatar_url, '') as user_avatar,
        COALESCE(p.age, 25) as user_age,
        COALESCE(p.is_verified, false) as user_verified,
        CASE 
            WHEN LENGTH(msg.content) > 50 THEN SUBSTRING(msg.content, 1, 50) || '...'
            ELSE msg.content
        END as message,
        msg.created_at as created_at,
        '/chat/' || msg.sender_id::TEXT as action_url
    FROM messages msg
    LEFT JOIN profiles p ON msg.sender_id = p.id
    WHERE msg.receiver_id = p_user_id
    
    UNION ALL
    
    -- Recent gifts
    SELECT 
        'gift-' || g.id::TEXT as id,
        'gift' as type,
        g.from_user_id as user_id,
        COALESCE(p.full_name, p.username, 'Anonymous') as user_name,
        COALESCE(p.avatar_url, '') as user_avatar,
        COALESCE(p.age, 25) as user_age,
        COALESCE(p.is_verified, false) as user_verified,
        'Received a ' || COALESCE(gift.name, 'gift') || '! 🎁' as message,
        g.created_at as created_at,
        '/chat/' || g.from_user_id::TEXT as action_url
    FROM sent_gifts g
    LEFT JOIN profiles p ON g.from_user_id = p.id
    LEFT JOIN gifts gift ON g.gift_id = gift.id
    WHERE g.to_user_id = p_user_id
    
    ORDER BY created_at DESC
    LIMIT limit_count;
END;
$$;

-- Create necessary indexes for performance
CREATE INDEX IF NOT EXISTS idx_matches_user_status ON matches(user1_id, user2_id, status);
CREATE INDEX IF NOT EXISTS idx_messages_receiver_read ON messages(receiver_id, read_status);
CREATE INDEX IF NOT EXISTS idx_profile_views_created ON profile_views(profile_id, created_at);
CREATE INDEX IF NOT EXISTS idx_sent_gifts_recipient ON sent_gifts(to_user_id);
CREATE INDEX IF NOT EXISTS idx_sent_gifts_sender ON sent_gifts(from_user_id);
CREATE INDEX IF NOT EXISTS idx_messages_created_at ON messages(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_matches_created_at ON matches(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_sent_gifts_created_at ON sent_gifts(created_at DESC);

-- Grant execute permissions to authenticated users
GRANT EXECUTE ON FUNCTION get_user_dashboard_stats TO authenticated;
GRANT EXECUTE ON FUNCTION get_user_recent_activity TO authenticated;

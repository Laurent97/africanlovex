// To re-enable optimized functions after migration, replace these functions:

const loadMatchStatsOptimized = async () => {
  if (!user) return;
  
  try {
    const { data, error } = await supabase.rpc('get_user_dashboard_stats', {
      p_user_id: user.id
    });

    if (error) throw error;

    if (data) {
      setStats(prev => ({
        ...prev,
        totalMatches: data.total_matches || 0,
        newMessages: data.new_messages || 0,
        profileViews: data.profile_views || 0,
        giftsReceived: data.gifts_received || 0,
        giftsSent: data.gifts_sent || 0
      }));
    }
  } catch (error) {
    console.error('Error loading optimized stats, falling back:', error);
    await loadMatchStatsFallback();
  }
};

const loadRecentActivityOptimized = async () => {
  if (!user) return;
  
  const { data, error } = await supabase.rpc('get_user_recent_activity', {
    p_user_id: user.id,
    limit_count: 10
  });

  if (error) {
    console.error('Error loading activity:', error);
    return loadRecentActivity();
  }

  if (data) {
    setRecentActivity(data);
  }
};

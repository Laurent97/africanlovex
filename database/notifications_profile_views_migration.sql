-- Create missing tables for notifications and profile views
-- Migration: Add notifications and profile_views tables

BEGIN;

-- Create notifications table
CREATE TABLE IF NOT EXISTS public.notifications (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('match', 'message', 'like', 'gift', 'profile_view', 'subscription', 'system')),
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    data JSONB DEFAULT '{}',
    read BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create profile_views table
CREATE TABLE IF NOT EXISTS public.profile_views (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    viewer_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    profile_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(viewer_id, profile_id) -- Prevent duplicate views
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON public.notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_read ON public.notifications(read);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON public.notifications(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notifications_user_read_created ON public.notifications(user_id, read, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_profile_views_profile_id ON public.profile_views(profile_id);
CREATE INDEX IF NOT EXISTS idx_profile_views_created_at ON public.profile_views(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_profile_views_viewer_id ON public.profile_views(viewer_id);

-- Enable RLS (Row Level Security)
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profile_views ENABLE ROW LEVEL SECURITY;

-- RLS Policies for notifications
CREATE POLICY "Users can view their own notifications" ON public.notifications
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own notifications" ON public.notifications
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own notifications" ON public.notifications
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own notifications" ON public.notifications
    FOR DELETE USING (auth.uid() = user_id);

-- RLS Policies for profile_views
CREATE POLICY "Users can view all profile views" ON public.profile_views
    FOR SELECT USING (true);

CREATE POLICY "Users can insert profile views" ON public.profile_views
    FOR INSERT WITH CHECK (auth.uid() = viewer_id);

CREATE POLICY "Users can update their own profile views" ON public.profile_views
    FOR UPDATE USING (auth.uid() = viewer_id);

CREATE POLICY "Users can delete their own profile views" ON public.profile_views
    FOR DELETE USING (auth.uid() = viewer_id);

-- Function to automatically create notifications
CREATE OR REPLACE FUNCTION public.create_notification(
    p_user_id UUID,
    p_type TEXT,
    p_title TEXT,
    p_message TEXT,
    p_data JSONB DEFAULT '{}'
) RETURNS UUID AS $$
DECLARE
    notification_id UUID;
BEGIN
    INSERT INTO public.notifications (user_id, type, title, message, data)
    VALUES (p_user_id, p_type, p_title, p_message, p_data)
    RETURNING id INTO notification_id;
    
    RETURN notification_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to record profile view
CREATE OR REPLACE FUNCTION public.record_profile_view(
    p_viewer_id UUID,
    p_profile_id UUID
) RETURNS BOOLEAN AS $$
BEGIN
    -- Don't record if viewing own profile
    IF p_viewer_id = p_profile_id THEN
        RETURN false;
    END IF;
    
    INSERT INTO public.profile_views (viewer_id, profile_id)
    VALUES (p_viewer_id, p_profile_id)
    ON CONFLICT (viewer_id, profile_id) DO UPDATE
    SET created_at = NOW();
    
    -- Create notification for profile owner
    PERFORM public.create_notification(
        p_profile_id,
        'profile_view',
        'New Profile View',
        'Someone viewed your profile',
        jsonb_build_object('viewer_id', p_viewer_id)
    );
    
    RETURN true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_notifications_updated_at
    BEFORE UPDATE ON public.notifications
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

COMMIT;

-- LoveX Seed Data
-- East Africa's Premier Romance & Live Gifting Platform
-- This script safely populates the database with initial gifts and sample data
-- It checks for existing data to avoid duplicate key errors

DO $$
DECLARE
    -- Auth user IDs (using static UUIDs for consistency)
    auth_id_1 UUID := '11111111-1111-1111-1111-111111111111';
    auth_id_2 UUID := '22222222-2222-2222-2222-222222222222';
    auth_id_3 UUID := '33333333-3333-3333-3333-333333333333';
    auth_id_4 UUID := '44444444-4444-4444-4444-444444444444';
    auth_id_5 UUID := '55555555-5555-5555-5555-555555555555';
    auth_id_6 UUID := '66666666-6666-6666-6666-666666666666';
    auth_id_7 UUID := '77777777-7777-7777-7777-777777777777';
    auth_id_8 UUID := '88888888-8888-8888-8888-888888888888';
    auth_id_9 UUID := '99999999-9999-9999-9999-999999999999';
    auth_id_10 UUID := 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa';
    auth_id_11 UUID := 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb';
    auth_id_12 UUID := 'cccccccc-cccc-cccc-cccc-cccccccccccc';
    auth_id_13 UUID := 'dddddddd-dddd-dddd-dddd-dddddddddddd';
    auth_id_14 UUID := 'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee';
    auth_id_15 UUID := 'ffffffff-ffff-ffff-ffff-ffffffffffff';
    auth_id_16 UUID := '00000000-0000-0000-0000-000000000000';
    
    -- Profile variables
    rwanda_id_1 UUID;
    rwanda_id_2 UUID;
    rwanda_id_3 UUID;
    kenya_id_1 UUID;
    kenya_id_2 UUID;
    kenya_id_3 UUID;
    uganda_id_1 UUID;
    uganda_id_2 UUID;
    uganda_id_3 UUID;
    tanzania_id_1 UUID;
    tanzania_id_2 UUID;
    tanzania_id_3 UUID;
    burundi_id_1 UUID;
    burundi_id_2 UUID;
    congo_id_1 UUID;
    congo_id_2 UUID;
    
    match_1_id UUID;
    match_2_id UUID;
    match_3_id UUID;
    match_4_id UUID;
    
    gift_rose_id UUID;
    gift_coffee_id UUID;
    gift_heart_id UUID;
    gift_music_id UUID;
    
    room_1_id UUID;
    room_2_id UUID;
    room_3_id UUID;
    room_4_id UUID;
    room_5_id UUID;
BEGIN

-- First, add unique constraint to gifts table if it doesn't exist
BEGIN
    ALTER TABLE public.gifts ADD CONSTRAINT gifts_name_unique UNIQUE (name);
EXCEPTION
    WHEN duplicate_table THEN
        RAISE NOTICE 'Unique constraint on gifts.name already exists, skipping...';
    WHEN others THEN
        RAISE NOTICE 'Could not add unique constraint: %', SQLERRM;
END;

-- Clean up any existing test data to avoid conflicts
-- WARNING: This will delete all test data. Comment these lines if you want to preserve existing data.
DELETE FROM public.room_participants;
DELETE FROM public.blocked_users;
DELETE FROM public.daily_recommendations;
DELETE FROM public.swipe_history;
DELETE FROM public.coin_transactions;
DELETE FROM public.subscriptions;
DELETE FROM public.live_rooms;
DELETE FROM public.sent_gifts;
DELETE FROM public.messages;
DELETE FROM public.matches;
DELETE FROM public.profiles WHERE id IN (auth_id_1, auth_id_2, auth_id_3, auth_id_4, auth_id_5, auth_id_6, auth_id_7, auth_id_8, auth_id_9, auth_id_10, auth_id_11, auth_id_12, auth_id_13, auth_id_14, auth_id_15, auth_id_16);
DELETE FROM auth.users WHERE id IN (auth_id_1, auth_id_2, auth_id_3, auth_id_4, auth_id_5, auth_id_6, auth_id_7, auth_id_8, auth_id_9, auth_id_10, auth_id_11, auth_id_12, auth_id_13, auth_id_14, auth_id_15, auth_id_16);

-- Insert auth.users entries first (required for profiles foreign key)
INSERT INTO auth.users (id, email, encrypted_password, email_confirmed_at, created_at, updated_at, raw_app_meta_data, raw_user_meta_data, is_super_admin, role)
VALUES
(auth_id_1, 'mukiza@lovex.rw', crypt('password123', gen_salt('bf')), NOW(), NOW(), NOW(), '{"provider":"email","providers":["email"]}', '{"username":"mukiza_2024"}', false, 'authenticated'),
(auth_id_2, 'umwari@lovex.rw', crypt('password123', gen_salt('bf')), NOW(), NOW(), NOW(), '{"provider":"email","providers":["email"]}', '{"username":"umwari_kigali"}', false, 'authenticated'),
(auth_id_3, 'gahigi@lovex.rw', crypt('password123', gen_salt('bf')), NOW(), NOW(), NOW(), '{"provider":"email","providers":["email"]}', '{"username":"gahigi_butare"}', false, 'authenticated'),
(auth_id_4, 'njoroge@lovex.ke', crypt('password123', gen_salt('bf')), NOW(), NOW(), NOW(), '{"provider":"email","providers":["email"]}', '{"username":"njoroge_nairobi"}', false, 'authenticated'),
(auth_id_5, 'akisha@lovex.ke', crypt('password123', gen_salt('bf')), NOW(), NOW(), NOW(), '{"provider":"email","providers":["email"]}', '{"username":"akisha_mombasa"}', false, 'authenticated'),
(auth_id_6, 'otieno@lovex.ke', crypt('password123', gen_salt('bf')), NOW(), NOW(), NOW(), '{"provider":"email","providers":["email"]}', '{"username":"otieno_kisumu"}', false, 'authenticated'),
(auth_id_7, 'nakato@lovex.ug', crypt('password123', gen_salt('bf')), NOW(), NOW(), NOW(), '{"provider":"email","providers":["email"]}', '{"username":"nakato_kampala"}', false, 'authenticated'),
(auth_id_8, 'mukasa@lovex.ug', crypt('password123', gen_salt('bf')), NOW(), NOW(), NOW(), '{"provider":"email","providers":["email"]}', '{"username":"mukasa_jinja"}', false, 'authenticated'),
(auth_id_9, 'acholi@lovex.ug', crypt('password123', gen_salt('bf')), NOW(), NOW(), NOW(), '{"provider":"email","providers":["email"]}', '{"username":"acholi_gulu"}', false, 'authenticated'),
(auth_id_10, 'mussa@lovex.tz', crypt('password123', gen_salt('bf')), NOW(), NOW(), NOW(), '{"provider":"email","providers":["email"]}', '{"username":"mussa_dar"}', false, 'authenticated'),
(auth_id_11, 'zawadi@lovex.tz', crypt('password123', gen_salt('bf')), NOW(), NOW(), NOW(), '{"provider":"email","providers":["email"]}', '{"username":"zawadi_arusha"}', false, 'authenticated'),
(auth_id_12, 'khalid@lovex.tz', crypt('password123', gen_salt('bf')), NOW(), NOW(), NOW(), '{"provider":"email","providers":["email"]}', '{"username":"khalid_zanzibar"}', false, 'authenticated'),
(auth_id_13, 'nizigiyimana@lovex.bi', crypt('password123', gen_salt('bf')), NOW(), NOW(), NOW(), '{"provider":"email","providers":["email"]}', '{"username":"nizigiyimana_bujumbura"}', false, 'authenticated'),
(auth_id_14, 'sophie@lovex.bi', crypt('password123', gen_salt('bf')), NOW(), NOW(), NOW(), '{"provider":"email","providers":["email"]}', '{"username":"sophie_gitega"}', false, 'authenticated'),
(auth_id_15, 'antoine@lovex.cd', crypt('password123', gen_salt('bf')), NOW(), NOW(), NOW(), '{"provider":"email","providers":["email"]}', '{"username":"antoine_kinshasa"}', false, 'authenticated'),
(auth_id_16, 'marie@lovex.cd', crypt('password123', gen_salt('bf')), NOW(), NOW(), NOW(), '{"provider":"email","providers":["email"]}', '{"username":"marie_lubumbashi"}', false, 'authenticated')
ON CONFLICT (id) DO NOTHING;

-- Insert East African themed gifts by tier (with proper type casting)
INSERT INTO public.gifts (name, name_local, description, tier, cost_coins, icon_url, is_active)
SELECT * FROM (VALUES
-- Everyday Gifts (10-100 LoveX Coins)
('Rose', 'Ibara', 'A beautiful red rose to express your affection', 'everyday'::gift_tier, 10, '🌹', true),
('Heart', 'Umutima', 'Classic red heart to show you care', 'everyday'::gift_tier, 15, '❤️', true),
('Coffee', 'Ikawa', 'Share a virtual coffee with someone special', 'everyday'::gift_tier, 20, '☕', true),
('Music Note', 'Indimbo', 'Send a musical note to express your feelings', 'everyday'::gift_tier, 25, '🎵', true),
('Smile', 'Ukurikanye', 'A warm smile to brighten their day', 'everyday'::gift_tier, 30, '😊', true),
('Star', 'Inyenyeri', 'A shining star for someone who lights up your life', 'everyday'::gift_tier, 35, '⭐', true),
('Flower', 'Urukwavu', 'A beautiful flower to brighten their day', 'everyday'::gift_tier, 40, '🌸', true),
('Chocolate', 'Shokora', 'Sweet chocolate for a sweet person', 'everyday'::gift_tier, 45, '🍫', true),
('Ice Cream', 'Amashyushyu', 'Cool ice cream for a cool person', 'everyday'::gift_tier, 50, '🍦', true),
('Cake', 'Umutumba', 'A slice of cake to celebrate', 'everyday'::gift_tier, 60, '🍰', true),
('Pizza', 'Pizza', 'Share a virtual pizza together', 'everyday'::gift_tier, 70, '🍕', true),
('Movie Ticket', 'Ifilime', 'Movie ticket for a virtual date night', 'everyday'::gift_tier, 80, '🎬', true),
('Book', 'Igitabo', 'A book to share knowledge and stories', 'everyday'::gift_tier, 90, '📚', true),
('Game Controller', 'Imashanyarazi', 'Play games together online', 'everyday'::gift_tier, 100, '🎮', true),

-- Romantic Gifts (200-500 LoveX Coins)
('Love Letter', 'Ibaru ry''ukwishaka', 'A heartfelt love letter written just for them', 'romantic'::gift_tier, 200, '💌', true),
('Perfume', 'Ishushanyiko', 'Sweet fragrance to remember you by', 'romantic'::gift_tier, 250, '🌸', true),
('Wine', 'Uvinwa', 'A bottle of fine wine for a romantic evening', 'romantic'::gift_tier, 300, '🍷', true),
('Jewelry', 'Ubusozi', 'Beautiful jewelry to show commitment', 'romantic'::gift_tier, 350, '💍', true),
('Teddy Bear', 'Inkono', 'Cuddly teddy bear to keep them company', 'romantic'::gift_tier, 400, '🧸', true),
('Photo Album', 'Akarubu', 'Create memories together in a photo album', 'romantic'::gift_tier, 450, '📷', true),
('Candlelight Dinner', 'Ifunguro ry''umucyo', 'Romantic candlelight dinner for two', 'romantic'::gift_tier, 500, '🕯️', true),

-- Serious Gifts (1,000-2,000 LoveX Coins)
('Promise Ring', 'Intobo ry''ubwenge', 'A promise ring to show serious commitment', 'serious'::gift_tier, 1000, '💍', true),
('Weekend Getaway', 'Ushushanyiko ku munsi', 'A romantic weekend getaway for two', 'serious'::gift_tier, 1200, '🏖️', true),
('Spa Day', 'Umunsi w''ibyiza', 'Relaxing spa day for couples', 'serious'::gift_tier, 1500, '💆', true),
('Concert Tickets', 'Amahugurwa y''indimbo', 'Tickets to see their favorite artist together', 'serious'::gift_tier, 1800, '🎤', true),
('Cooking Class', 'Korana umwanya', 'Learn to cook traditional dishes together', 'serious'::gift_tier, 2000, '👨‍🍳', true),

-- Legendary Gifts (2,000-10,000 LoveX Coins)
('Traditional Wedding', 'Ubukwe bw''ibitangaza', 'Traditional East African wedding ceremony', 'legendary'::gift_tier, 3000, '👰', true),
('Safari Adventure', 'Uruhukiro rw''inyamaswa', 'Amazing safari adventure for two', 'legendary'::gift_tier, 4000, '🦁', true),
('Mountain Climbing', 'Kugenda ku musozi', 'Climb Mount Kilimanjaro together', 'legendary'::gift_tier, 5000, '🏔️', true),
('Beach Resort', 'Ishyamba r''umuhanda', 'Luxury beach resort vacation', 'legendary'::gift_tier, 6000, '🏝️', true),
('Cultural Tour', 'Uruhukiro rw''umuco', 'Tour East African cultural sites together', 'legendary'::gift_tier, 7000, '🏛️', true),
('Private Jet', 'Uburongo bwo hanyine', 'Private jet experience for ultimate luxury', 'legendary'::gift_tier, 8000, '✈️', true),
('Yacht Experience', 'Ubugari bw''amazi', 'Luxury yacht experience on Lake Victoria', 'legendary'::gift_tier, 9000, '⛵', true),
('Royal Treatment', 'Ukwihishura', 'Royal treatment experience with local traditions', 'legendary'::gift_tier, 10000, '👑', true),

-- Real World Gifts (Physical delivery)
('Fresh Flowers', 'Indabyo zimeze', 'Fresh flowers delivered to their door', 'real_world'::gift_tier, 1500, '💐', true),
('Local Artisan Crafts', 'Umusanzu w''ubuhanzi', 'Handmade crafts from local artisans', 'real_world'::gift_tier, 2000, '🎨', true),
('Traditional Clothing', 'Imbuto z''igihugu', 'Beautiful traditional East African clothing', 'real_world'::gift_tier, 2500, '👗', true),
('Local Cuisine Box', 'Ibiribwa by''igihugu', 'Box of authentic local delicacies', 'real_world'::gift_tier, 3000, '🍱', true),
('Musical Instrument', 'Inyungu z''indimbo', 'Traditional musical instrument from their country', 'real_world'::gift_tier, 3500, '🎸', true),
('Spice Collection', 'Ibirungo', 'Collection of authentic East African spices', 'real_world'::gift_tier, 4000, '🌶️', true),
('Coffee Set', 'Imbuto z''ikawa', 'Premium coffee set with local beans', 'real_world'::gift_tier, 4500, '☕', true),
('Jewelry Set', 'Ubusozi bwose', 'Complete jewelry set with local designs', 'real_world'::gift_tier, 5000, '💎', true)
) AS g(name, name_local, description, tier, cost_coins, icon_url, is_active)
WHERE NOT EXISTS (SELECT 1 FROM public.gifts WHERE name = g.name);

-- Insert profiles using the auth user IDs
INSERT INTO public.profiles (id, username, full_name, avatar_url, bio, age, gender, country, city, languages, interests, relationship_intention, verification_level, is_verified, vip_tier, coins_balance) VALUES
-- Rwanda profiles
(auth_id_1, 'mukiza_2024', 'Mukiza Niyonzima', 'https://picsum.photos/seed/mukiza/200/200.jpg', 'Passionate about technology and culture. Looking for someone who shares my love for Kinyarwanda poetry and modern innovation.', 28, 'male'::gender_type, 'RW', 'Kigali', ARRAY['rw', 'en', 'fr'], ARRAY['technology', 'poetry', 'hiking', 'coffee', 'music'], 'looking_for_love'::relationship_intention, 'standard'::verification_level, true, 'free'::vip_tier, 500),
(auth_id_2, 'umwari_kigali', 'Umwari Mukamana', 'https://picsum.photos/seed/umwari/200/200.jpg', 'Coffee enthusiast and dancer. Love exploring Kigali''s hidden gems and sharing Rwandan culture with others.', 25, 'female'::gender_type, 'RW', 'Kigali', ARRAY['rw', 'en'], ARRAY['dancing', 'coffee', 'travel', 'cooking', 'art'], 'serious_only'::relationship_intention, 'premium'::verification_level, true, 'premium'::vip_tier, 1200),
(auth_id_3, 'gahigi_butare', 'Gahigi Habyarimana', 'https://picsum.photos/seed/gahigi/200/200.jpg', 'University professor passionate about education and traditional music. Seeking intellectual connection and cultural exchange.', 35, 'male'::gender_type, 'RW', 'Butare', ARRAY['rw', 'en', 'fr'], ARRAY['education', 'music', 'reading', 'teaching', 'research'], 'friends_first'::relationship_intention, 'standard'::verification_level, true, 'free'::vip_tier, 800),

-- Kenya profiles
(auth_id_4, 'njoroge_nairobi', 'Njoroge Kamau', 'https://picsum.photos/seed/njoroge/200/200.jpg', 'Tech entrepreneur who loves Swahili literature and hiking Mount Kenya. Looking for a partner to build dreams with.', 30, 'male'::gender_type, 'KE', 'Nairobi', ARRAY['sw', 'en'], ARRAY['technology', 'business', 'hiking', 'literature', 'innovation'], 'looking_for_love'::relationship_intention, 'premium'::verification_level, true, 'platinum'::vip_tier, 3000),
(auth_id_5, 'akisha_mombasa', 'Akisha Wanjiru', 'https://picsum.photos/seed/akisha/200/200.jpg', 'Marine biologist and beach lover. Passionate about ocean conservation and Swahili culture.', 27, 'female'::gender_type, 'KE', 'Mombasa', ARRAY['sw', 'en'], ARRAY['ocean', 'conservation', 'swimming', 'photography', 'travel'], 'serious_only'::relationship_intention, 'standard'::verification_level, true, 'free'::vip_tier, 600),
(auth_id_6, 'otieno_kisumu', 'Otieno Ochieng', 'https://picsum.photos/seed/otieno/200/200.jpg', 'Football coach and community leader. Love teaching kids and exploring Lake Victoria region.', 32, 'male'::gender_type, 'KE', 'Kisumu', ARRAY['sw', 'en', 'luo'], ARRAY['football', 'coaching', 'community', 'fishing', 'music'], 'friends_first'::relationship_intention, 'basic'::verification_level, true, 'free'::vip_tier, 300),

-- Uganda profiles
(auth_id_7, 'nakato_kampala', 'Nakato Namulondo', 'https://picsum.photos/seed/nakato/200/200.jpg', 'Fashion designer and Luganda language enthusiast. Creating modern designs with traditional Ugandan inspiration.', 26, 'female'::gender_type, 'UG', 'Kampala', ARRAY['lg', 'en', 'sw'], ARRAY['fashion', 'design', 'culture', 'art', 'entrepreneurship'], 'looking_for_love'::relationship_intention, 'premium'::verification_level, true, 'premium'::vip_tier, 1500),
(auth_id_8, 'mukasa_jinja', 'Mukasa Ssebadduka', 'https://picsum.photos/seed/mukasa/200/200.jpg', 'Tour guide and storyteller. Love sharing Uganda''s history and exploring the source of the Nile.', 29, 'male'::gender_type, 'UG', 'Jinja', ARRAY['lg', 'en'], ARRAY['tourism', 'history', 'storytelling', 'nature', 'adventure'], 'serious_only'::relationship_intention, 'standard'::verification_level, true, 'free'::vip_tier, 900),
(auth_id_9, 'acholi_gulu', 'Aciro Lakot', 'https://picsum.photos/seed/aciro/200/200.jpg', 'Social worker and traditional dancer. Preserving Acholi culture while building better communities.', 31, 'female'::gender_type, 'UG', 'Gulu', ARRAY['en', 'sw', 'lg'], ARRAY['social_work', 'dancing', 'culture', 'community', 'music'], 'friends_first'::relationship_intention, 'basic'::verification_level, true, 'free'::vip_tier, 400),

-- Tanzania profiles
(auth_id_10, 'mussa_dar', 'Mussa Kimario', 'https://picsum.photos/seed/mussa/200/200.jpg', 'Safari guide and wildlife photographer. Capturing Tanzania''s beauty one photo at a time.', 33, 'male'::gender_type, 'TZ', 'Dar es Salaam', ARRAY['sw', 'en'], ARRAY['photography', 'wildlife', 'safari', 'travel', 'conservation'], 'looking_for_love'::relationship_intention, 'premium'::verification_level, true, 'platinum'::vip_tier, 2500),
(auth_id_11, 'zawadi_arusha', 'Zawadi Mwangi', 'https://picsum.photos/seed/zawadi/200/200.jpg', 'Mount Kilimanjaro guide and adventure seeker. Love heights and helping others reach their peaks.', 24, 'female'::gender_type, 'TZ', 'Arusha', ARRAY['sw', 'en', 'ma'], ARRAY['hiking', 'adventure', 'guiding', 'nature', 'fitness'], 'serious_only'::relationship_intention, 'standard'::verification_level, true, 'free'::vip_tier, 700),
(auth_id_12, 'khalid_zanzibar', 'Khalid Hassan', 'https://picsum.photos/seed/khalid/200/200.jpg', 'Spice merchant and historian. Sharing Zanzibar''s rich history and aromatic treasures.', 36, 'male'::gender_type, 'TZ', 'Zanzibar', ARRAY['sw', 'en', 'ar'], ARRAY['history', 'spices', 'trade', 'culture', 'storytelling'], 'friends_first'::relationship_intention, 'basic'::verification_level, true, 'free'::vip_tier, 350),

-- Burundi profiles
(auth_id_13, 'nizigiyimana_bujumbura', 'Nizigiyimana Barutwanayo', 'https://picsum.photos/seed/nizigiyimana/200/200.jpg', 'Journalist and drummer. Preserving Burundi''s stories through words and rhythms.', 28, 'male'::gender_type, 'BI', 'Bujumbura', ARRAY['fr', 'rw', 'sw'], ARRAY['journalism', 'music', 'drumming', 'culture', 'writing'], 'looking_for_love'::relationship_intention, 'standard'::verification_level, true, 'free'::vip_tier, 550),
(auth_id_14, 'sophie_gitega', 'Sophie Ndayisenga', 'https://picsum.photos/seed/sophie/200/200.jpg', 'Teacher and community organizer. Empowering youth through education in Kirundi and French.', 30, 'female'::gender_type, 'BI', 'Gitega', ARRAY['fr', 'rw', 'sw'], ARRAY['education', 'community', 'teaching', 'culture', 'empowerment'], 'serious_only'::relationship_intention, 'basic'::verification_level, true, 'free'::vip_tier, 280),

-- Congo profiles
(auth_id_15, 'antoine_kinshasa', 'Antoine Mbuyi', 'https://picsum.photos/seed/antoine/200/200.jpg', 'Music producer and Lingala artist. Creating beats that tell Congo''s stories.', 32, 'male'::gender_type, 'CD', 'Kinshasa', ARRAY['fr', 'ln', 'sw'], ARRAY['music', 'production', 'lingala', 'dance', 'culture'], 'looking_for_love'::relationship_intention, 'premium'::verification_level, true, 'premium'::vip_tier, 1800),
(auth_id_16, 'marie_lubumbashi', 'Marie Kalonji', 'https://picsum.photos/seed/marie/200/200.jpg', 'Mining engineer and advocate. Balancing industry growth with environmental protection.', 29, 'female'::gender_type, 'CD', 'Lubumbashi', ARRAY['fr', 'sw', 'ln'], ARRAY['engineering', 'environment', 'advocacy', 'mining', 'innovation'], 'friends_first'::relationship_intention, 'standard'::verification_level, true, 'free'::vip_tier, 650)
ON CONFLICT (id) DO NOTHING;

-- Get profile IDs for later use
SELECT id INTO rwanda_id_1 FROM public.profiles WHERE username = 'mukiza_2024';
SELECT id INTO rwanda_id_2 FROM public.profiles WHERE username = 'umwari_kigali';
SELECT id INTO rwanda_id_3 FROM public.profiles WHERE username = 'gahigi_butare';
SELECT id INTO kenya_id_1 FROM public.profiles WHERE username = 'njoroge_nairobi';
SELECT id INTO kenya_id_2 FROM public.profiles WHERE username = 'akisha_mombasa';
SELECT id INTO kenya_id_3 FROM public.profiles WHERE username = 'otieno_kisumu';
SELECT id INTO uganda_id_1 FROM public.profiles WHERE username = 'nakato_kampala';
SELECT id INTO uganda_id_2 FROM public.profiles WHERE username = 'mukasa_jinja';
SELECT id INTO uganda_id_3 FROM public.profiles WHERE username = 'acholi_gulu';
SELECT id INTO tanzania_id_1 FROM public.profiles WHERE username = 'mussa_dar';
SELECT id INTO tanzania_id_2 FROM public.profiles WHERE username = 'zawadi_arusha';
SELECT id INTO tanzania_id_3 FROM public.profiles WHERE username = 'khalid_zanzibar';
SELECT id INTO burundi_id_1 FROM public.profiles WHERE username = 'nizigiyimana_bujumbura';
SELECT id INTO burundi_id_2 FROM public.profiles WHERE username = 'sophie_gitega';
SELECT id INTO congo_id_1 FROM public.profiles WHERE username = 'antoine_kinshasa';
SELECT id INTO congo_id_2 FROM public.profiles WHERE username = 'marie_lubumbashi';

-- Get gift IDs for later use
SELECT id INTO gift_rose_id FROM public.gifts WHERE name = 'Rose';
SELECT id INTO gift_coffee_id FROM public.gifts WHERE name = 'Coffee';
SELECT id INTO gift_heart_id FROM public.gifts WHERE name = 'Heart';
SELECT id INTO gift_music_id FROM public.gifts WHERE name = 'Music Note';

-- Insert some sample matches
INSERT INTO public.matches (user1_id, user2_id, status) VALUES
(rwanda_id_1, rwanda_id_2, 'matched'::match_status),
(kenya_id_1, kenya_id_2, 'matched'::match_status),
(uganda_id_1, uganda_id_2, 'pending'::match_status),
(tanzania_id_1, tanzania_id_2, 'matched'::match_status)
ON CONFLICT (user1_id, user2_id) DO NOTHING;

-- Get match IDs
SELECT id INTO match_1_id FROM public.matches WHERE user1_id = rwanda_id_1 AND user2_id = rwanda_id_2;
SELECT id INTO match_2_id FROM public.matches WHERE user1_id = kenya_id_1 AND user2_id = kenya_id_2;
SELECT id INTO match_3_id FROM public.matches WHERE user1_id = uganda_id_1 AND user2_id = uganda_id_2;
SELECT id INTO match_4_id FROM public.matches WHERE user1_id = tanzania_id_1 AND user2_id = tanzania_id_2;

-- Insert sample messages
INSERT INTO public.messages (match_id, sender_id, content, message_type) VALUES
(match_1_id, rwanda_id_1, 'Murakaza neza! I loved reading about your passion for dancing. What type of traditional Rwandan dance do you enjoy most?', 'text'::message_type),
(match_1_id, rwanda_id_2, 'Amakuru! I love Intore dancing the most. It tells our story as Rwandans. What about you?', 'text'::message_type),
(match_2_id, kenya_id_1, 'Sasa! Your work with ocean conservation is amazing. How did you get started in marine biology?', 'text'::message_type),
(match_2_id, kenya_id_2, 'Poa sana! I grew up near the ocean and fell in love with marine life. What''s your favorite Swahili poem?', 'text'::message_type);

-- Insert sample sent gifts
INSERT INTO public.sent_gifts (from_user_id, to_user_id, gift_id, message) VALUES
(kenya_id_1, kenya_id_2, gift_rose_id, 'A rose for the ocean guardian'),
(kenya_id_2, kenya_id_1, gift_coffee_id, 'Coffee for our morning conversations'),
(rwanda_id_1, rwanda_id_2, gift_heart_id, 'My heart dances when I think of you'),
(rwanda_id_2, rwanda_id_1, gift_music_id, 'A melody for our connection');

-- Insert sample live rooms
INSERT INTO public.live_rooms (host_id, title, description, room_type, viewer_count, max_viewers, cost_per_minute) VALUES
(uganda_id_1, 'Ugandan Culture Night', 'Join us for an evening of traditional Ugandan music and stories', 'public'::room_type, 45, 100, 0),
(tanzania_id_1, 'Safari Stories', 'Live from Tanzania - sharing wildlife adventures and conservation tips', 'public'::room_type, 78, 150, 0),
(kenya_id_1, 'Tech Talk Swahili', 'Discussing technology and innovation in Swahili', 'public'::room_type, 23, 80, 0),
(tanzania_id_2, 'Private Kilimanjaro Training', 'Personal training session for those wanting to climb Kilimanjaro', 'private'::room_type, 5, 10, 50),
(rwanda_id_2, 'Speed Dating Kigali', '3-minute rotations to meet amazing people in Kigali', 'speed_dating'::room_type, 12, 20, 0);

-- Get room IDs
SELECT id INTO room_1_id FROM public.live_rooms WHERE title = 'Ugandan Culture Night';
SELECT id INTO room_2_id FROM public.live_rooms WHERE title = 'Safari Stories';
SELECT id INTO room_3_id FROM public.live_rooms WHERE title = 'Tech Talk Swahili';
SELECT id INTO room_4_id FROM public.live_rooms WHERE title = 'Private Kilimanjaro Training';
SELECT id INTO room_5_id FROM public.live_rooms WHERE title = 'Speed Dating Kigali';

-- Insert sample subscriptions
INSERT INTO public.subscriptions (user_id, tier, status, start_date, end_date, amount, currency, payment_method) VALUES
(kenya_id_1, 'platinum'::subscription_tier, 'active', NOW() - INTERVAL '1 month', NOW() + INTERVAL '11 months', 19.99, 'USD', 'stripe_card'),
(rwanda_id_2, 'premium'::subscription_tier, 'active', NOW() - INTERVAL '2 weeks', NOW() + INTERVAL '2 weeks', 9.99, 'USD', 'mpesa'),
(uganda_id_1, 'premium'::subscription_tier, 'active', NOW() - INTERVAL '1 month', NOW() + INTERVAL '1 month', 9.99, 'USD', 'airtel_money'),
(tanzania_id_1, 'platinum'::subscription_tier, 'active', NOW() - INTERVAL '15 days', NOW() + INTERVAL '15 days', 19.99, 'USD', 'tigo_pesa');

-- Insert sample coin transactions
INSERT INTO public.coin_transactions (user_id, amount, type, description, reference_id) VALUES
(kenya_id_1, 3000, 'purchase', 'Purchased 3000 LoveX Coins', (SELECT id FROM public.subscriptions WHERE user_id = kenya_id_1 LIMIT 1)),
(rwanda_id_2, 500, 'purchase', 'Purchased 500 LoveX Coins', NULL),
(kenya_id_2, 200, 'bonus', 'Monthly bonus - Premium subscription', NULL),
(rwanda_id_1, -10, 'gift_sent', 'Sent Rose to umwari_kigali', (SELECT id FROM public.sent_gifts WHERE from_user_id = rwanda_id_1 LIMIT 1)),
(rwanda_id_2, -20, 'gift_sent', 'Sent Coffee to njoroge_nairobi', (SELECT id FROM public.sent_gifts WHERE from_user_id = rwanda_id_2 LIMIT 1)),
(kenya_id_2, 1, 'gift_received', 'Received Rose from njoroge_nairobi', (SELECT id FROM public.sent_gifts WHERE to_user_id = kenya_id_2 LIMIT 1)),
(kenya_id_1, 2, 'gift_received', 'Received Coffee from umwari_kigali', (SELECT id FROM public.sent_gifts WHERE to_user_id = kenya_id_1 LIMIT 1));

-- Insert sample swipe history
INSERT INTO public.swipe_history (user_id, profile_id, action) VALUES
(rwanda_id_1, rwanda_id_2, 'like'),
(rwanda_id_2, rwanda_id_1, 'like'),
(kenya_id_1, kenya_id_2, 'like'),
(kenya_id_2, kenya_id_1, 'like'),
(rwanda_id_3, rwanda_id_2, 'pass'),
(kenya_id_3, rwanda_id_2, 'like'),
(uganda_id_1, uganda_id_2, 'like'),
(uganda_id_2, uganda_id_1, 'like');

-- Insert sample daily recommendations
INSERT INTO public.daily_recommendations (user_id, recommended_user_id, score, date) VALUES
(rwanda_id_1, rwanda_id_3, 85, CURRENT_DATE),
(rwanda_id_1, kenya_id_2, 72, CURRENT_DATE),
(kenya_id_1, uganda_id_1, 68, CURRENT_DATE),
(kenya_id_1, uganda_id_2, 75, CURRENT_DATE);

-- Insert sample blocked users (for testing)
INSERT INTO public.blocked_users (blocker_id, blocked_user_id) VALUES
(rwanda_id_3, kenya_id_3);

-- Insert sample room participants
INSERT INTO public.room_participants (room_id, user_id, is_host, joined_at, is_muted, is_video_enabled) 
SELECT room_1_id, uganda_id_1, true, NOW() - INTERVAL '1 hour', false, true
WHERE NOT EXISTS (SELECT 1 FROM public.room_participants WHERE room_id = room_1_id AND user_id = uganda_id_1);

INSERT INTO public.room_participants (room_id, user_id, is_host, joined_at, is_muted, is_video_enabled) 
SELECT room_1_id, uganda_id_2, false, NOW() - INTERVAL '30 minutes', false, false
WHERE NOT EXISTS (SELECT 1 FROM public.room_participants WHERE room_id = room_1_id AND user_id = uganda_id_2);

INSERT INTO public.room_participants (room_id, user_id, is_host, joined_at, is_muted, is_video_enabled) 
SELECT room_2_id, tanzania_id_1, true, NOW() - INTERVAL '2 hours', false, true
WHERE NOT EXISTS (SELECT 1 FROM public.room_participants WHERE room_id = room_2_id AND user_id = tanzania_id_1);

INSERT INTO public.room_participants (room_id, user_id, is_host, joined_at, is_muted, is_video_enabled) 
SELECT room_2_id, tanzania_id_2, false, NOW() - INTERVAL '45 minutes', true, false
WHERE NOT EXISTS (SELECT 1 FROM public.room_participants WHERE room_id = room_2_id AND user_id = tanzania_id_2);

END $$;

COMMIT;
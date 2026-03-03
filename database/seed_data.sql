-- LoveX Seed Data
-- East African Gifts Database

-- Insert East African themed gifts

-- Level 1: Everyday Romance (10-100 LX)
INSERT INTO public.gifts (name, name_local, description, tier, cost_coins, icon_url) VALUES
('Ikibuno', 'Ikibuno', 'Kinyarwanda wink - A subtle gesture of interest', 'everyday', 10, '/gifts/wink.svg'),
('Agasatsi', 'Agasatsi', 'Traditional East African greeting gesture', 'everyday', 15, '/gifts/greeting.svg'),
('Digital Rose', 'Ikihugu', 'Beautiful digital rose with local flower varieties', 'everyday', 25, '/gifts/rose.svg'),
('Fanta', 'Fanta', 'Share a virtual soda together', 'everyday', 30, '/gifts/soda.svg'),
('Rolex', 'Rolex', 'Ugandan favorite - rolled egg chapati animation', 'everyday', 50, '/gifts/rolex.svg'),
('Chai Time', 'Chai', 'Kenyan tea date invitation', 'everyday', 50, '/gifts/tea.svg'),
('Mandazi', 'Mandazi', 'Virtual breakfast treat to start the day', 'everyday', 40, '/gifts/mandazi.svg'),
('Kitenge', 'Kitenge', 'Digital fabric pattern with vibrant colors', 'everyday', 75, '/gifts/kitenge.svg');

-- Level 2: Romantic Gestures (100-500 LX)
INSERT INTO public.gifts (name, name_local, description, tier, cost_coins, icon_url) VALUES
('M-Pesa Love', 'M-Pesa', 'Virtual money transfer animation showing care', 'romantic', 150, '/gifts/mpesa.svg'),
('Wedding Intro', 'Kenyi', 'Traditional introduction ceremony invitation', 'romantic', 200, '/gifts/intro.svg'),
('Igitero', 'Igitero', 'Surprise visit animation with excitement', 'romantic', 200, '/gifts/surprise.svg'),
('Bus Fare', 'Amafaranga y''ibasi', 'Come see me gesture - I''ll pay your way', 'romantic', 150, '/gifts/bus.svg'),
('Movie Night', 'Filime', 'Riverwood/Nollywood themed movie date', 'romantic', 250, '/gifts/movie.svg'),
('Lake Kivu Sunset', 'Iseka rya Kivu', 'Romantic sunset over Lake Kivu', 'romantic', 300, '/gifts/sunset.svg'),
('Maasai Market', 'Ishuri rya Maasai', 'Virtual shopping spree experience', 'romantic', 400, '/gifts/market.svg');

-- Level 3: Serious Commitment (500-2,000 LX)
INSERT INTO public.gifts (name, name_local, description, tier, cost_coins, icon_url) VALUES
('Kweranka', 'Kweranka', 'Engagement proposal with Gorilla background 🇷🇼', 'serious', 1000, '/gifts/proposal.svg'),
('Kubandwa', 'Kubandwa', 'Traditional ceremony blessing for commitment', 'serious', 1200, '/gifts/blessing.svg'),
('Ingobyi', 'Ingobyi', 'Royal throne - very prestigious honor', 'serious', 1500, '/gifts/throne.svg'),
('Cow Dowry', 'Inka', 'Traditional bride price symbol - Inka', 'serious', 1800, '/gifts/cow.svg'),
('Zebra Skin', 'Imvere ze Zebra', 'Premium status symbol of wealth and taste', 'serious', 2000, '/gifts/zebra.svg');

-- Level 4: Legendary Gifts (2,000-10,000 LX)
INSERT INTO public.gifts (name, name_local, description, tier, cost_coins, icon_url) VALUES
('Mount Kilimanjaro Proposal', 'Kilimanjaro', 'Full screen mountain proposal animation', 'legendary', 3000, '/gifts/kilimanjaro.svg'),
('Source of the Nile', 'Inkomoko ya Nil', 'Eternal love symbolism from Nile source', 'legendary', 3500, '/gifts/nile.svg'),
('Virunga Gorilla Trek', 'Gorilla Trek', 'Adventure proposal in Virunga mountains', 'legendary', 4000, '/gifts/gorilla.svg'),
('Zanzibar Dream Wedding', 'Zanzibar', 'Beach ceremony animation with ocean waves', 'legendary', 5000, '/gifts/wedding.svg'),
('Queen of Sheba Crown', 'Umwami wa Sheba', 'Ultimate respect and admiration gift', 'legendary', 7500, '/gifts/crown.svg'),
('Lualaba Treasure', 'Lualaba', 'Congo diamond animation - precious love', 'legendary', 10000, '/gifts/diamond.svg');

-- Level 5: Real-World Connected Gifts
INSERT INTO public.gifts (name, name_local, description, tier, cost_coins, icon_url) VALUES
('Real Flower Delivery', 'Amashuzi', 'Partner with local florists for real delivery', 'real_world', 1500, '/gifts/real-flowers.svg'),
('Chocolate Hamper', 'Shokole', 'Ugandan chocolate makers special delivery', 'real_world', 2000, '/gifts/chocolate.svg'),
('Date Night Voucher', 'Igitaramo', 'Partner restaurants in major cities', 'real_world', 3000, '/gifts/dinner.svg'),
('Airtime Top-up', 'Amamenyetso', 'Direct MTN, Airtel, Safaricom integration', 'real_world', 500, '/gifts/airtime.svg'),
('Mobile Money Gift', 'Mobile Money', 'Direct M-Pesa, MTN MoMo transfer', 'real_world', 1000, '/gifts/mobile-money.svg');

-- Insert some sample countries and cities data (for reference)
-- These would typically be handled in application code or separate lookup tables

-- East African Countries with their codes
-- Rwanda (RW), Burundi (BI), Uganda (UG), Kenya (KE), Tanzania (TZ), Congo (CD)

-- Sample interests for matching
-- Note: These would typically be tags or categories in the application
INSERT INTO public.profiles (id, username, country, interests) VALUES 
('00000000-0000-0000-0000-000000000001', 'demo_user_rw', 'RW', 
 ARRAY['music', 'dancing', 'travel', 'cooking', 'kinyarwanda', 'coffee']);

-- Create indexes for better search performance
CREATE INDEX IF NOT EXISTS idx_gifts_cost ON public.gifts(cost_coins);
CREATE INDEX IF NOT EXISTS idx_gifts_name ON public.gifts(name);

-- Add comments for documentation
COMMENT ON TABLE public.gifts IS 'East African themed virtual gifts for LoveX platform';
COMMENT ON COLUMN public.gifts.name_local IS 'Local language name of the gift (Kinyarwanda, Swahili, etc.)';
COMMENT ON COLUMN public.gifts.tier IS 'Gift tier: everyday, romantic, serious, legendary, real_world';
COMMENT ON COLUMN public.gifts.cost_coins IS 'Cost in LoveX Coins (LX)';

-- Gift Inventory System Migration
-- Creates tables for storing user gift inventories and transactions

-- Gift inventory table - stores gifts users have purchased and can send
CREATE TABLE IF NOT EXISTS gift_inventory (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    gift_id TEXT NOT NULL, -- References the gift ID from the gifts store
    gift_name TEXT NOT NULL,
    gift_icon TEXT NOT NULL, -- JSON or emoji representation
    gift_rarity TEXT NOT NULL, -- common, rare, epic, legendary, mythic
    quantity INTEGER NOT NULL DEFAULT 1,
    purchase_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    source TEXT NOT NULL, -- 'purchase', 'received', 'bonus'
    source_details JSONB, -- Additional details about source
    is_locked BOOLEAN DEFAULT FALSE, -- For promotional gifts
    lock_expires_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Gift transactions table - tracks all gift sending/receiving
CREATE TABLE IF NOT EXISTS gift_transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    sender_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    receiver_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    gift_id TEXT NOT NULL,
    gift_name TEXT NOT NULL,
    gift_icon TEXT NOT NULL,
    gift_rarity TEXT NOT NULL,
    quantity INTEGER NOT NULL DEFAULT 1,
    context TEXT NOT NULL, -- 'chat', 'live_stream', 'profile'
    context_details JSONB, -- Chat message ID, stream ID, etc.
    message TEXT, -- Personal message with gift
    is_anonymous BOOLEAN DEFAULT FALSE,
    sent_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Gift exchange rates table - defines coin values for gifts
CREATE TABLE IF NOT EXISTS gift_exchange_rates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    gift_rarity TEXT NOT NULL UNIQUE,
    base_price INTEGER NOT NULL, -- Original purchase price in LX coins
    exchange_rate DECIMAL(3,2) NOT NULL DEFAULT 0.50, -- Percentage of original price returned
    min_exchange_level INTEGER DEFAULT 1, -- Minimum user level to exchange
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Gift exchange history table - tracks gift-to-coin conversions
CREATE TABLE IF NOT EXISTS gift_exchange_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    gift_inventory_id UUID REFERENCES gift_inventory(id) ON DELETE CASCADE,
    gift_id TEXT NOT NULL,
    gift_name TEXT NOT NULL,
    gift_rarity TEXT NOT NULL,
    quantity_exchanged INTEGER NOT NULL,
    coins_received INTEGER NOT NULL,
    exchange_rate_applied DECIMAL(3,2) NOT NULL,
    exchanged_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_gift_inventory_user_id ON gift_inventory(user_id);
CREATE INDEX IF NOT EXISTS idx_gift_inventory_gift_id ON gift_inventory(gift_id);
CREATE INDEX IF NOT EXISTS idx_gift_transactions_sender_id ON gift_transactions(sender_id);
CREATE INDEX IF NOT EXISTS idx_gift_transactions_receiver_id ON gift_transactions(receiver_id);
CREATE INDEX IF NOT EXISTS idx_gift_transactions_sent_at ON gift_transactions(sent_at);
CREATE INDEX IF NOT EXISTS idx_gift_exchange_history_user_id ON gift_exchange_history(user_id);

-- RLS (Row Level Security) policies
ALTER TABLE gift_inventory ENABLE ROW LEVEL SECURITY;
ALTER TABLE gift_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE gift_exchange_history ENABLE ROW LEVEL SECURITY;

-- Gift inventory policies
CREATE POLICY "Users can view own gift inventory" ON gift_inventory
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own gift inventory" ON gift_inventory
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own gift inventory" ON gift_inventory
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own gift inventory" ON gift_inventory
    FOR DELETE USING (auth.uid() = user_id);

-- Gift transactions policies
CREATE POLICY "Users can view transactions involving them" ON gift_transactions
    FOR SELECT USING (auth.uid() = sender_id OR auth.uid() = receiver_id);

CREATE POLICY "Users can insert sent transactions" ON gift_transactions
    FOR INSERT WITH CHECK (auth.uid() = sender_id);

-- Gift exchange history policies
CREATE POLICY "Users can view own exchange history" ON gift_exchange_history
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own exchange history" ON gift_exchange_history
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Insert default exchange rates
INSERT INTO gift_exchange_rates (gift_rarity, base_price, exchange_rate) VALUES
    ('common', 50, 0.40),
    ('rare', 100, 0.45),
    ('epic', 200, 0.50),
    ('legendary', 500, 0.55),
    ('mythic', 1000, 0.60)
ON CONFLICT (gift_rarity) DO UPDATE SET
    base_price = EXCLUDED.base_price,
    exchange_rate = EXCLUDED.exchange_rate,
    updated_at = NOW();

-- Functions for gift inventory management
CREATE OR REPLACE FUNCTION add_gift_to_inventory(
    p_user_id UUID,
    p_gift_id TEXT,
    p_gift_name TEXT,
    p_gift_icon TEXT,
    p_gift_rarity TEXT,
    p_quantity INTEGER DEFAULT 1,
    p_source TEXT DEFAULT 'purchase',
    p_source_details JSONB DEFAULT '{}'
) RETURNS UUID AS $$
DECLARE
    inventory_id UUID;
BEGIN
    -- Check if user already has this gift
    SELECT id INTO inventory_id
    FROM gift_inventory
    WHERE user_id = p_user_id AND gift_id = p_gift_id AND source = p_source;
    
    IF inventory_id IS NOT NULL THEN
        -- Update existing inventory
        UPDATE gift_inventory
        SET quantity = quantity + p_quantity,
            updated_at = NOW()
        WHERE id = inventory_id;
        
        RETURN inventory_id;
    ELSE
        -- Insert new inventory item
        INSERT INTO gift_inventory (
            user_id, gift_id, gift_name, gift_icon, gift_rarity,
            quantity, source, source_details
        )
        VALUES (
            p_user_id, p_gift_id, p_gift_name, p_gift_icon, p_gift_rarity,
            p_quantity, p_source, p_source_details
        )
        RETURNING id INTO inventory_id;
        
        RETURN inventory_id;
    END IF;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION send_gift(
    p_sender_id UUID,
    p_receiver_id UUID,
    p_gift_id TEXT,
    p_quantity INTEGER DEFAULT 1,
    p_context TEXT DEFAULT 'chat',
    p_context_details JSONB DEFAULT '{}',
    p_message TEXT DEFAULT NULL,
    p_is_anonymous BOOLEAN DEFAULT FALSE
) RETURNS BOOLEAN AS $$
DECLARE
    inventory_id UUID;
    transaction_id UUID;
BEGIN
    -- Check sender has enough gifts
    SELECT id INTO inventory_id
    FROM gift_inventory
    WHERE user_id = p_sender_id AND gift_id = p_gift_id AND quantity >= p_quantity;
    
    IF inventory_id IS NULL THEN
        RETURN FALSE;
    END IF;
    
    -- Deduct from sender inventory
    UPDATE gift_inventory
    SET quantity = quantity - p_quantity,
        updated_at = NOW()
    WHERE id = inventory_id;
    
    -- Remove inventory item if quantity is 0
    DELETE FROM gift_inventory
    WHERE id = inventory_id AND quantity = 0;
    
    -- Add to receiver inventory
    PERFORM add_gift_to_inventory(
        p_receiver_id, p_gift_id, 
        (SELECT gift_name FROM gift_inventory WHERE id = inventory_id),
        (SELECT gift_icon FROM gift_inventory WHERE id = inventory_id),
        (SELECT gift_rarity FROM gift_inventory WHERE id = inventory_id),
        p_quantity, 'received', 
        jsonb_build_object('sender_id', p_sender_id, 'context', p_context)
    );
    
    -- Record transaction
    INSERT INTO gift_transactions (
        sender_id, receiver_id, gift_id, gift_name, gift_icon, gift_rarity,
        quantity, context, context_details, message, is_anonymous
    )
    SELECT 
        p_sender_id, p_receiver_id, p_gift_id, gift_name, gift_icon, gift_rarity,
        p_quantity, p_context, p_context_details, p_message, p_is_anonymous
    FROM gift_inventory WHERE id = inventory_id;
    
    RETURN TRUE;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION exchange_gift_for_coins(
    p_user_id UUID,
    p_gift_id TEXT,
    p_quantity INTEGER DEFAULT 1
) RETURNS INTEGER AS $$
DECLARE
    inventory_id UUID;
    exchange_rate DECIMAL(3,2);
    coins_received INTEGER;
    exchange_id UUID;
BEGIN
    -- Check user has enough gifts and get exchange rate
    SELECT 
        gi.id, ger.exchange_rate
    INTO inventory_id, exchange_rate
    FROM gift_inventory gi
    JOIN gift_exchange_rates ger ON gi.gift_rarity = ger.gift_rarity
    WHERE gi.user_id = p_user_id 
        AND gi.gift_id = p_gift_id 
        AND gi.quantity >= p_quantity
        AND ger.is_active = TRUE;
    
    IF inventory_id IS NULL THEN
        RETURN 0;
    END IF;
    
    -- Calculate coins to receive
    coins_received := FLOOR(
        (SELECT base_price FROM gift_exchange_rates ger 
         JOIN gift_inventory gi ON ger.gift_rarity = gi.gift_rarity
         WHERE gi.id = inventory_id) * p_quantity * exchange_rate
    );
    
    -- Deduct from inventory
    UPDATE gift_inventory
    SET quantity = quantity - p_quantity,
        updated_at = NOW()
    WHERE id = inventory_id;
    
    -- Remove if quantity is 0
    DELETE FROM gift_inventory WHERE id = inventory_id AND quantity = 0;
    
    -- Add coins to user wallet (assuming wallet table exists)
    UPDATE wallets
    SET balance = balance + coins_received,
        updated_at = NOW()
    WHERE user_id = p_user_id;
    
    -- Record exchange history
    INSERT INTO gift_exchange_history (
        user_id, gift_inventory_id, gift_id, gift_name, gift_rarity,
        quantity_exchanged, coins_received, exchange_rate_applied
    )
    SELECT 
        p_user_id, inventory_id, p_gift_id, gift_name, gift_rarity,
        p_quantity, coins_received, exchange_rate
    FROM gift_inventory WHERE id = inventory_id;
    
    RETURN coins_received;
END;
$$ LANGUAGE plpgsql;

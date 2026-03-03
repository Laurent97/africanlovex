-- ========================================
-- LOVEX PAYMENT SYSTEM MIGRATION
-- ========================================
-- Migration for Flutterwave mobile money integration
-- Includes payment transactions, coin management, and withdrawal functionality

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ========================================
-- PAYMENT TRANSACTIONS TABLE
-- ========================================
CREATE TABLE IF NOT EXISTS payment_transactions (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  transaction_reference TEXT UNIQUE NOT NULL,
  flutterwave_reference TEXT,
  amount DECIMAL(12,2) NOT NULL,
  currency TEXT NOT NULL CHECK (currency IN ('RWF', 'KES', 'UGX', 'TZS', 'CDF', 'BIF')),
  payment_method TEXT CHECK (payment_method IN ('mobile_money', 'card', 'bank_transfer')) NOT NULL,
  mobile_network TEXT,
  phone_number TEXT,
  status TEXT CHECK (status IN ('pending', 'processing', 'completed', 'failed', 'refunded')) DEFAULT 'pending',
  purpose TEXT CHECK (purpose IN ('coin_purchase', 'gift_purchase', 'withdrawal', 'subscription')) NOT NULL,
  coins_amount INTEGER,
  metadata JSONB DEFAULT '{}',
  flutterwave_response JSONB,
  completed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ========================================
-- COIN TRANSACTIONS TABLE
-- ========================================
CREATE TABLE IF NOT EXISTS coin_transactions (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  amount INTEGER NOT NULL, -- Positive for credits, negative for debits
  type TEXT CHECK (type IN ('purchase', 'gift_sent', 'gift_received', 'bonus', 'withdrawal', 'refund')) NOT NULL,
  reference_id TEXT, -- Link to payment_transactions or gifts
  balance_after INTEGER NOT NULL,
  description TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ========================================
-- WITHDRAWAL REQUESTS TABLE
-- ========================================
CREATE TABLE IF NOT EXISTS withdrawal_requests (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  amount DECIMAL(12,2) NOT NULL,
  currency TEXT NOT NULL CHECK (currency IN ('RWF', 'KES', 'UGX', 'TZS', 'CDF', 'BIF')),
  bank_name TEXT NOT NULL,
  bank_code TEXT NOT NULL,
  account_number TEXT NOT NULL,
  account_name TEXT NOT NULL,
  status TEXT CHECK (status IN ('pending', 'processing', 'completed', 'failed', 'cancelled')) DEFAULT 'pending',
  flutterwave_transfer_id TEXT,
  fee DECIMAL(8,2) DEFAULT 0,
  reference TEXT UNIQUE NOT NULL,
  narration TEXT DEFAULT 'Withdrawal from LoveX',
  metadata JSONB DEFAULT '{}',
  processed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ========================================
-- PAYMENT PACKAGES TABLE
-- ========================================
CREATE TABLE IF NOT EXISTS payment_packages (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  coins_amount INTEGER NOT NULL,
  price DECIMAL(10,2) NOT NULL,
  currency TEXT NOT NULL DEFAULT 'RWF',
  bonus_coins INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  is_popular BOOLEAN DEFAULT false,
  sort_order INTEGER DEFAULT 0,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ========================================
-- INDEXES FOR PERFORMANCE
-- ========================================
CREATE INDEX IF NOT EXISTS idx_payment_transactions_user_id ON payment_transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_payment_transactions_reference ON payment_transactions(transaction_reference);
CREATE INDEX IF NOT EXISTS idx_payment_transactions_status ON payment_transactions(status);
CREATE INDEX IF NOT EXISTS idx_payment_transactions_created_at ON payment_transactions(created_at);

CREATE INDEX IF NOT EXISTS idx_coin_transactions_user_id ON coin_transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_coin_transactions_type ON coin_transactions(type);
CREATE INDEX IF NOT EXISTS idx_coin_transactions_created_at ON coin_transactions(created_at);

CREATE INDEX IF NOT EXISTS idx_withdrawal_requests_user_id ON withdrawal_requests(user_id);
CREATE INDEX IF NOT EXISTS idx_withdrawal_requests_status ON withdrawal_requests(status);
CREATE INDEX IF NOT EXISTS idx_withdrawal_requests_reference ON withdrawal_requests(reference);

-- ========================================
-- RLS POLICIES
-- ========================================
-- Payment Transactions
ALTER TABLE payment_transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own payment transactions" ON payment_transactions
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own payment transactions" ON payment_transactions
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Coin Transactions
ALTER TABLE coin_transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own coin transactions" ON coin_transactions
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own coin transactions" ON coin_transactions
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Withdrawal Requests
ALTER TABLE withdrawal_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own withdrawal requests" ON withdrawal_requests
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own withdrawal requests" ON withdrawal_requests
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Payment Packages (public read access)
ALTER TABLE payment_packages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view active payment packages" ON payment_packages
  FOR SELECT USING (is_active = true);

-- ========================================
-- TRIGGERS FOR UPDATED_AT
-- ========================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_payment_transactions_updated_at BEFORE UPDATE ON payment_transactions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_withdrawal_requests_updated_at BEFORE UPDATE ON withdrawal_requests
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_payment_packages_updated_at BEFORE UPDATE ON payment_packages
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ========================================
-- STORED PROCEDURES
-- ========================================

-- Function to credit user coins
CREATE OR REPLACE FUNCTION credit_user_coins(
  p_user_id UUID,
  p_coin_amount INTEGER,
  p_transaction_ref TEXT,
  p_description TEXT DEFAULT 'Coin purchase'
)
RETURNS INTEGER AS $$
DECLARE
  current_balance INTEGER;
  new_balance INTEGER;
BEGIN
  -- Get current balance
  SELECT COALESCE(coin_balance, 0) INTO current_balance
  FROM profiles
  WHERE id = p_user_id;
  
  -- Calculate new balance
  new_balance := current_balance + p_coin_amount;
  
  -- Update user balance
  UPDATE profiles
  SET coin_balance = new_balance
  WHERE id = p_user_id;
  
  -- Create coin transaction record
  INSERT INTO coin_transactions (
    user_id, amount, type, reference_id, balance_after, description
  ) VALUES (
    p_user_id, p_coin_amount, 'purchase', p_transaction_ref, new_balance, p_description
  );
  
  RETURN new_balance;
END;
$$ LANGUAGE plpgsql;

-- Function to debit user coins
CREATE OR REPLACE FUNCTION debit_user_coins(
  p_user_id UUID,
  p_coin_amount INTEGER,
  p_transaction_ref TEXT,
  p_description TEXT DEFAULT 'Coin debit'
)
RETURNS BOOLEAN AS $$
DECLARE
  current_balance INTEGER;
  new_balance INTEGER;
BEGIN
  -- Get current balance
  SELECT COALESCE(coin_balance, 0) INTO current_balance
  FROM profiles
  WHERE id = p_user_id;
  
  -- Check sufficient balance
  IF current_balance < p_coin_amount THEN
    RAISE EXCEPTION 'Insufficient coin balance';
  END IF;
  
  -- Calculate new balance
  new_balance := current_balance - p_coin_amount;
  
  -- Update user balance
  UPDATE profiles
  SET coin_balance = new_balance
  WHERE id = p_user_id;
  
  -- Create coin transaction record
  INSERT INTO coin_transactions (
    user_id, amount, type, reference_id, balance_after, description
  ) VALUES (
    p_user_id, -p_coin_amount, 'gift_sent', p_transaction_ref, new_balance, p_description
  );
  
  RETURN TRUE;
END;
$$ LANGUAGE plpgsql;

-- Function to get user coin balance
CREATE OR REPLACE FUNCTION get_user_coin_balance(p_user_id UUID)
RETURNS INTEGER AS $$
BEGIN
  RETURN COALESCE((SELECT coin_balance FROM profiles WHERE id = p_user_id), 0);
END;
$$ LANGUAGE plpgsql;

-- ========================================
-- SAMPLE DATA
-- ========================================

-- Insert sample payment packages
INSERT INTO payment_packages (name, description, coins_amount, price, bonus_coins, is_popular, sort_order) VALUES
('Starter Pack', 'Perfect for getting started', 100, 1000, 0, false, 1),
('Popular Pack', 'Most popular choice', 500, 4500, 50, true, 2),
('Premium Pack', 'Great value for regular users', 1200, 10000, 200, false, 3),
('VIP Pack', 'Maximum value for power users', 3000, 24000, 600, false, 4)
ON CONFLICT DO NOTHING;

-- ========================================
-- VIEWS FOR REPORTING
-- ========================================

-- User payment summary view
CREATE OR REPLACE VIEW user_payment_summary AS
SELECT 
  p.id as user_id,
  p.username,
  COALESCE(pt.total_spent, 0) as total_spent,
  COALESCE(ct.total_coins_purchased, 0) as total_coins_purchased,
  COALESCE(p.coin_balance, 0) as current_coin_balance,
  COALESCE(wr.total_withdrawn, 0) as total_withdrawn,
  COUNT(pt.id) as total_transactions
FROM profiles p
LEFT JOIN (
  SELECT 
    user_id, 
    SUM(amount) as total_spent,
    COUNT(*) as total_transactions
  FROM payment_transactions 
  WHERE status = 'completed' AND purpose = 'coin_purchase'
  GROUP BY user_id
) pt ON p.id = pt.user_id
LEFT JOIN (
  SELECT 
    user_id, 
    SUM(amount) as total_coins_purchased
  FROM coin_transactions 
  WHERE type = 'purchase' AND amount > 0
  GROUP BY user_id
) ct ON p.id = ct.user_id
LEFT JOIN (
  SELECT 
    user_id, 
    SUM(amount) as total_withdrawn
  FROM withdrawal_requests 
  WHERE status = 'completed'
  GROUP BY user_id
) wr ON p.id = wr.user_id
GROUP BY p.id, p.username, p.coin_balance, pt.total_spent, ct.total_coins_purchased, wr.total_withdrawn;

-- Daily revenue view
CREATE OR REPLACE VIEW daily_revenue AS
SELECT 
  DATE(created_at) as date,
  COUNT(*) as transaction_count,
  SUM(amount) as total_revenue,
  SUM(coins_amount) as total_coins_sold,
  currency
FROM payment_transactions 
WHERE status = 'completed' AND purpose = 'coin_purchase'
GROUP BY DATE(created_at), currency
ORDER BY date DESC;

-- ========================================
-- COMPLETION MESSAGE
-- ========================================
DO $$
BEGIN
  RAISE NOTICE 'LoveX Payment System Migration completed successfully!';
  RAISE NOTICE '- Created payment_transactions table';
  RAISE NOTICE '- Created coin_transactions table';
  RAISE NOTICE '- Created withdrawal_requests table';
  RAISE NOTICE '- Created payment_packages table';
  RAISE NOTICE '- Added indexes for performance';
  RAISE NOTICE '- Configured RLS policies';
  RAISE NOTICE '- Created stored procedures for coin management';
  RAISE NOTICE '- Added sample payment packages';
  RAISE NOTICE '- Created reporting views';
END $$;

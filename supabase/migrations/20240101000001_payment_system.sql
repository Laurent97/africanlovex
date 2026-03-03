-- Payment System Migration for LoveX
-- Run this in Supabase SQL Editor to create payment system tables

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
  status TEXT NOT NULL CHECK (status IN ('pending', 'processing', 'completed', 'failed', 'cancelled')) DEFAULT 'pending',
  purpose TEXT NOT NULL CHECK (purpose IN ('coin_purchase', 'gift_purchase', 'subscription', 'refund')),
  coins_amount INTEGER NOT NULL DEFAULT 0,
  flutterwave_response JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  completed_at TIMESTAMP WITH TIME ZONE
);

-- ========================================
-- COIN TRANSACTIONS TABLE
-- ========================================
CREATE TABLE IF NOT EXISTS coin_transactions (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  transaction_type TEXT NOT NULL CHECK (transaction_type IN ('credit', 'debit')),
  amount INTEGER NOT NULL,
  balance_after INTEGER NOT NULL,
  transaction_ref TEXT,
  description TEXT,
  metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ========================================
-- WITHDRAWAL REQUESTS TABLE
-- ========================================
CREATE TABLE IF NOT EXISTS withdrawal_requests (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  amount DECIMAL(12,2) NOT NULL,
  currency TEXT NOT NULL CHECK (currency IN ('RWF', 'KES', 'UGX', 'TZS', 'CDF', 'BIF')) DEFAULT 'RWF',
  bank_code TEXT NOT NULL,
  account_number TEXT NOT NULL,
  account_name TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('pending', 'processing', 'completed', 'failed', 'cancelled')) DEFAULT 'pending',
  reference TEXT UNIQUE NOT NULL,
  narration TEXT,
  flutterwave_transfer_id TEXT,
  fee DECIMAL(12,2) DEFAULT 0,
  metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  processed_at TIMESTAMP WITH TIME ZONE
);

-- ========================================
-- PAYMENT PACKAGES TABLE
-- ========================================
CREATE TABLE IF NOT EXISTS payment_packages (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  coins INTEGER NOT NULL,
  bonus INTEGER DEFAULT 0,
  price DECIMAL(12,2) NOT NULL,
  currency TEXT NOT NULL CHECK (currency IN ('RWF', 'KES', 'UGX', 'TZS', 'CDF', 'BIF')) DEFAULT 'RWF',
  is_active BOOLEAN DEFAULT true,
  is_popular BOOLEAN DEFAULT false,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ========================================
-- INDEXES
-- ========================================
CREATE INDEX IF NOT EXISTS idx_payment_transactions_user_id ON payment_transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_payment_transactions_status ON payment_transactions(status);
CREATE INDEX IF NOT EXISTS idx_payment_transactions_created_at ON payment_transactions(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_coin_transactions_user_id ON coin_transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_coin_transactions_created_at ON coin_transactions(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_withdrawal_requests_user_id ON withdrawal_requests(user_id);
CREATE INDEX IF NOT EXISTS idx_withdrawal_requests_status ON withdrawal_requests(status);
CREATE INDEX IF NOT EXISTS idx_withdrawal_requests_created_at ON withdrawal_requests(created_at DESC);

-- ========================================
-- RLS POLICIES
-- ========================================
ALTER TABLE payment_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE coin_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE withdrawal_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE payment_packages ENABLE ROW LEVEL SECURITY;

-- Users can only see their own payment transactions
CREATE POLICY "Users can view own payment transactions" ON payment_transactions
  FOR SELECT USING (auth.uid() = user_id);

-- Users can only see their own coin transactions
CREATE POLICY "Users can view own coin transactions" ON coin_transactions
  FOR SELECT USING (auth.uid() = user_id);

-- Users can only see their own withdrawal requests
CREATE POLICY "Users can view own withdrawal requests" ON withdrawal_requests
  FOR SELECT USING (auth.uid() = user_id);

-- Anyone can view active payment packages
CREATE POLICY "Anyone can view payment packages" ON payment_packages
  FOR SELECT USING (is_active = true);

-- ========================================
-- TRIGGERS AND FUNCTIONS
-- ========================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers to update updated_at
CREATE TRIGGER update_payment_transactions_updated_at BEFORE UPDATE ON payment_transactions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_withdrawal_requests_updated_at BEFORE UPDATE ON withdrawal_requests
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_payment_packages_updated_at BEFORE UPDATE ON payment_packages
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to credit user coins
DROP FUNCTION IF EXISTS credit_user_coins(uuid,integer,text,text);
CREATE OR REPLACE FUNCTION credit_user_coins(
  p_user_id UUID,
  p_coin_amount INTEGER,
  p_transaction_ref TEXT DEFAULT NULL,
  p_description TEXT DEFAULT NULL
)
RETURNS VOID AS $$
DECLARE
  current_balance INTEGER;
BEGIN
  -- Get current balance
  SELECT COALESCE(coins_balance, 0) INTO current_balance
  FROM profiles
  WHERE id = p_user_id
  FOR UPDATE;

  -- Update balance
  UPDATE profiles
  SET coins_balance = current_balance + p_coin_amount
  WHERE id = p_user_id;

  -- Record transaction
  INSERT INTO coin_transactions (
    user_id,
    transaction_type,
    amount,
    balance_after,
    transaction_ref,
    description
  ) VALUES (
    p_user_id,
    'credit',
    p_coin_amount,
    current_balance + p_coin_amount,
    p_transaction_ref,
    p_description
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to debit user coins
DROP FUNCTION IF EXISTS debit_user_coins(uuid,integer,text,text);
CREATE OR REPLACE FUNCTION debit_user_coins(
  p_user_id UUID,
  p_coin_amount INTEGER,
  p_transaction_ref TEXT DEFAULT NULL,
  p_description TEXT DEFAULT NULL
)
RETURNS VOID AS $$
DECLARE
  current_balance INTEGER;
BEGIN
  -- Get current balance
  SELECT COALESCE(coins_balance, 0) INTO current_balance
  FROM profiles
  WHERE id = p_user_id
  FOR UPDATE;

  -- Check sufficient balance
  IF current_balance < p_coin_amount THEN
    RAISE EXCEPTION 'Insufficient coin balance';
  END IF;

  -- Update balance
  UPDATE profiles
  SET coins_balance = current_balance - p_coin_amount
  WHERE id = p_user_id;

  -- Record transaction
  INSERT INTO coin_transactions (
    user_id,
    transaction_type,
    amount,
    balance_after,
    transaction_ref,
    description
  ) VALUES (
    p_user_id,
    'debit',
    p_coin_amount,
    current_balance - p_coin_amount,
    p_transaction_ref,
    p_description
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ========================================
-- SAMPLE DATA
-- ========================================

-- Insert sample payment packages
INSERT INTO payment_packages (name, description, coins, bonus, price, currency, is_popular, sort_order) VALUES
  ('Starter Pack', 'Perfect for trying out LoveX features', 100, 0, 1000, 'RWF', false, 1),
  ('Popular Pack', 'Most popular choice for regular users', 500, 50, 4500, 'RWF', true, 2),
  ('Premium Pack', 'Great value for active users', 1000, 150, 8500, 'RWF', false, 3),
  ('VIP Pack', 'Ultimate package for power users', 2500, 500, 20000, 'RWF', false, 4)
ON CONFLICT DO NOTHING;

-- Add coins_balance column to profiles if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'profiles' AND column_name = 'coins_balance'
  ) THEN
    ALTER TABLE profiles ADD COLUMN coins_balance INTEGER DEFAULT 0;
  END IF;
END $$;

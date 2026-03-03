-- Payment System Migration Fix
-- Run this if you get function return type errors

-- Safely drop existing functions with wrong return types
DROP FUNCTION IF EXISTS credit_user_coins CASCADE;
DROP FUNCTION IF EXISTS debit_user_coins CASCADE;

-- Recreate functions with correct return types
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

-- Ensure coins_balance column exists
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'profiles' AND column_name = 'coins_balance'
  ) THEN
    ALTER TABLE profiles ADD COLUMN coins_balance INTEGER DEFAULT 0;
  END IF;
END $$;

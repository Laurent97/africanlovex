-- Direct fix for message_type enum issue
-- Use this if the main schema update doesn't work

-- Step 1: Check current enum values
SELECT enumlabel FROM pg_enum 
WHERE enumtypid = (SELECT oid FROM pg_type WHERE typname = 'message_type');

-- Step 2: If you see limited values, run this to drop the enum constraint
ALTER TABLE messages DROP CONSTRAINT IF EXISTS messages_message_type_check;

-- Step 3: Fix the column default (this is the key issue!)
ALTER TABLE messages ALTER COLUMN message_type DROP DEFAULT;
ALTER TABLE messages ALTER COLUMN message_type SET DEFAULT 'text';

-- Step 4: Convert column to TEXT to remove enum restriction (if still needed)
ALTER TABLE messages ALTER COLUMN message_type TYPE TEXT USING message_type::TEXT;

-- Step 5: Add proper CHECK constraint for all message types
ALTER TABLE messages 
ADD CONSTRAINT messages_message_type_check 
CHECK (message_type IN ('text', 'gift', 'system', 'dating_interest', 'join', 'leave'));

-- Step 6: Verify the fix
SELECT column_name, data_type, is_nullable, column_default 
FROM information_schema.columns 
WHERE table_name = 'messages' AND column_name = 'message_type';

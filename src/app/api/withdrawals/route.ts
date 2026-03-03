import { FlutterwaveService, WithdrawalData } from '@/services/flutterwave.service';
import { supabase } from '@/lib/supabase';

const flwService = new FlutterwaveService();

/**
 * Initiate withdrawal to bank account
 */
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { 
      amount,
      currency,
      bank_code,
      account_number,
      account_name,
      narration
    } = body;

    // Get user from authentication
    // In a real implementation, you'd verify the user is authenticated
    // For now, we'll assume user_id is passed in the body
    const { user_id } = body;

    if (!user_id || !amount || !currency || !bank_code || !account_number || !account_name) {
      return Response.json({ 
        success: false, 
        error: 'Missing required fields' 
      }, { status: 400 });
    }

    // Validate amount
    if (amount <= 0) {
      return Response.json({ 
        success: false, 
        error: 'Amount must be greater than 0' 
      }, { status: 400 });
    }

    // Get user's current coin balance
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('coin_balance, username, full_name')
      .eq('id', user_id)
      .single();

    if (profileError || !profile) {
      return Response.json({ 
        success: false, 
        error: 'User profile not found' 
      }, { status: 404 });
    }

    // Calculate coins needed (1 currency unit = 100 coins, adjust based on currency)
    const coinsNeeded = calculateCoinsNeeded(amount, currency);

    // Check if user has sufficient coins
    if (profile.coin_balance < coinsNeeded) {
      return Response.json({ 
        success: false, 
        error: `Insufficient balance. You need ${coinsNeeded} LX coins but have ${profile.coin_balance}` 
      }, { status: 400 });
    }

    // Generate unique withdrawal reference
    const reference = `WTH_${user_id}_${Date.now()}_${Math.random().toString(36).substring(7)}`;

    // Create withdrawal request record
    const { data: withdrawal, error: withdrawalError } = await supabase
      .from('withdrawal_requests')
      .insert({
        user_id,
        amount,
        currency,
        bank_name: '', // Will be filled after getting bank info
        bank_code,
        account_number,
        account_name,
        status: 'pending',
        reference,
        narration: narration || 'Withdrawal from LoveX',
        metadata: {
          coins_used: coinsNeeded,
          previous_balance: profile.coin_balance
        }
      })
      .select()
      .single();

    if (withdrawalError) {
      console.error('Error creating withdrawal request:', withdrawalError);
      return Response.json({ 
        success: false, 
        error: 'Failed to create withdrawal request' 
      }, { status: 500 });
    }

    // Get bank information
    const banksResponse = await flwService.getBanks(getCountryCode(currency));
    if (!banksResponse.success) {
      return Response.json({ 
        success: false, 
        error: 'Failed to fetch bank information' 
      }, { status: 500 });
    }

    const bankInfo = banksResponse.data.find((bank: any) => bank.code === bank_code);
    if (!bankInfo) {
      return Response.json({ 
        success: false, 
        error: 'Invalid bank code' 
      }, { status: 400 });
    }

    // Update withdrawal request with bank name
    await supabase
      .from('withdrawal_requests')
      .update({ bank_name: bankInfo.name })
      .eq('id', withdrawal.id);

    // Debit user coins
    const { error: debitError } = await supabase.rpc('debit_user_coins', {
      p_user_id: user_id,
      p_coin_amount: coinsNeeded,
      p_transaction_ref: reference,
      p_description: `Withdrawal of ${amount} ${currency} to ${account_name}`
    });

    if (debitError) {
      console.error('Error debiting user coins:', debitError);
      // Update withdrawal status to failed
      await supabase
        .from('withdrawal_requests')
        .update({ status: 'failed' })
        .eq('id', withdrawal.id);
      
      return Response.json({ 
        success: false, 
        error: 'Failed to process coin deduction' 
      }, { status: 500 });
    }

    // Prepare withdrawal data for Flutterwave
    const withdrawalData: WithdrawalData = {
      amount,
      currency,
      account_bank: bank_code,
      account_number,
      beneficiary_name: account_name,
      reference,
      narration: narration || `Withdrawal from LoveX - ${profile.username || profile.full_name}`,
      meta: {
        sender: profile.username || profile.full_name || 'LoveX User',
        sender_country: getCountryCode(currency),
        sender_address: 'East Africa'
      }
    };

    // Initiate withdrawal with Flutterwave
    const result = await flwService.initiateWithdrawal(withdrawalData);

    if (result.success) {
      // Update withdrawal request with Flutterwave transfer ID
      await supabase
        .from('withdrawal_requests')
        .update({
          status: 'processing',
          flutterwave_transfer_id: result.data.id,
          fee: result.data.fee,
          metadata: {
            ...withdrawal.metadata,
            flutterwave_response: result.data
          }
        })
        .eq('id', withdrawal.id);

      return Response.json({
        success: true,
        data: {
          withdrawal_id: withdrawal.id,
          reference,
          amount,
          currency,
          bank_name: bankInfo.name,
          account_number: maskAccountNumber(account_number),
          account_name,
          status: 'processing',
          fee: result.data.fee,
          coins_used: coinsNeeded,
          created_at: withdrawal.created_at
        }
      });
    } else {
      // Refund coins if withdrawal failed
      await supabase.rpc('credit_user_coins', {
        p_user_id: user_id,
        p_coin_amount: coinsNeeded,
        p_transaction_ref: `REFUND_${reference}`,
        p_description: `Refund for failed withdrawal: ${reference}`
      });

      // Update withdrawal status to failed
      await supabase
        .from('withdrawal_requests')
        .update({ 
          status: 'failed',
          metadata: {
            ...withdrawal.metadata,
            error: result.error
          }
        })
        .eq('id', withdrawal.id);

      return Response.json({
        success: false,
        error: result.error || 'Withdrawal initiation failed'
      }, { status: 400 });
    }

  } catch (error: any) {
    console.error('Withdrawal initiation error:', error);
    return Response.json({
      success: false,
      error: error.message || 'Internal server error'
    }, { status: 500 });
  }
}

/**
 * Get withdrawal status
 */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const withdrawalId = searchParams.get('id');
    const reference = searchParams.get('reference');
    const userId = searchParams.get('user_id');

    let query = supabase
      .from('withdrawal_requests')
      .select('*');

    if (withdrawalId) {
      query = query.eq('id', withdrawalId);
    } else if (reference) {
      query = query.eq('reference', reference);
    } else if (userId) {
      query = query.eq('user_id', userId).order('created_at', { ascending: false });
    } else {
      return Response.json({ 
        success: false, 
        error: 'Must provide withdrawal ID, reference, or user ID' 
      }, { status: 400 });
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching withdrawal:', error);
      return Response.json({ 
        success: false, 
        error: 'Failed to fetch withdrawal data' 
      }, { status: 500 });
    }

    // If we have a Flutterwave transfer ID, check status with Flutterwave
    if (data && data.length > 0 && data[0].flutterwave_transfer_id) {
      const transferStatus = await flwService.getTransferStatus(data[0].flutterwave_transfer_id);
      
      if (transferStatus.success) {
        // Update our records if status has changed
        if (data[0].status !== transferStatus.data.status) {
          await supabase
            .from('withdrawal_requests')
            .update({
              status: transferStatus.data.status,
              processed_at: transferStatus.data.status === 'SUCCESSFUL' ? new Date().toISOString() : null,
              metadata: {
                ...data[0].metadata,
                flutterwave_status: transferStatus.data
              }
            })
            .eq('id', data[0].id);
          
          data[0].status = transferStatus.data.status;
        }
      }
    }

    return Response.json({
      success: true,
      data: userId ? data : data[0] // Return array for user history, single object for specific request
    });

  } catch (error: any) {
    console.error('Withdrawal status error:', error);
    return Response.json({
      success: false,
      error: error.message || 'Internal server error'
    }, { status: 500 });
  }
}

/**
 * Calculate coins needed based on currency and amount
 */
function calculateCoinsNeeded(amount: number, currency: string): number {
  // Same conversion rates as in payment system
  const conversionRates: Record<string, number> = {
    'RWF': 0.1,    // 1 RWF = 0.1 coins (10 RWF = 1 coin)
    'KES': 1,      // 1 KES = 1 coin
    'UGX': 0.03,   // 1 UGX = 0.03 coins (33 UGX = 1 coin)
    'TZS': 0.02,   // 1 TZS = 0.02 coins (50 TZS = 1 coin)
    'CDF': 0.0005, // 1 CDF = 0.0005 coins (2000 CDF = 1 coin)
    'BIF': 0.0004  // 1 BIF = 0.0004 coins (2500 BIF = 1 coin)
  };

  const rate = conversionRates[currency] || 1;
  return Math.round(amount / rate); // Inverse of payment calculation
}

/**
 * Get country code from currency
 */
function getCountryCode(currency: string): string {
  const countryMap: Record<string, string> = {
    'RWF': 'RW',
    'KES': 'KE',
    'UGX': 'UG',
    'TZS': 'TZ',
    'CDF': 'CD',
    'BIF': 'BI'
  };

  return countryMap[currency] || 'RW';
}

/**
 * Mask account number for security
 */
function maskAccountNumber(accountNumber: string): string {
  if (accountNumber.length <= 4) return accountNumber;
  return accountNumber.slice(0, 2) + '****' + accountNumber.slice(-2);
}

import crypto from 'crypto';
import { FlutterwaveService } from '@/services/flutterwave.service';
import { supabase } from '@/lib/supabase';

const flwService = new FlutterwaveService();

/**
 * Flutterwave Webhook Handler
 * Handles real-time payment updates from Flutterwave
 */
export async function POST(request: Request) {
  try {
    const body = await request.text();
    const signature = request.headers.get('flutterwave-signature');
    
    // Verify webhook signature
    const secretHash = process.env.FLUTTERWAVE_WEBHOOK_SECRET;
    if (!secretHash) {
      console.error('FLUTTERWAVE_WEBHOOK_SECRET not configured');
      return Response.json({ error: 'Server configuration error' }, { status: 500 });
    }

    const hash = crypto
      .createHmac('sha256', secretHash)
      .update(body)
      .digest('hex');

    if (hash !== signature) {
      console.error('Invalid webhook signature');
      return Response.json({ error: 'Invalid signature' }, { status: 401 });
    }

    const event = JSON.parse(body);
    console.log('Flutterwave webhook received:', event);

    // Handle different event types
    switch (event.event?.type) {
      case 'charge.completed':
        await handleSuccessfulPayment(event.data);
        break;
      case 'transfer.completed':
        await handleSuccessfulWithdrawal(event.data);
        break;
      case 'charge.failed':
        await handleFailedPayment(event.data);
        break;
      case 'transfer.failed':
        await handleFailedWithdrawal(event.data);
        break;
      default:
        console.log('Unhandled event type:', event.event?.type);
    }

    // Always return 200 to acknowledge receipt
    return Response.json({ received: true });

  } catch (error) {
    console.error('Webhook processing error:', error);
    return Response.json({ error: 'Webhook processing failed' }, { status: 500 });
  }
}

/**
 * Handle successful payment
 */
async function handleSuccessfulPayment(data: any) {
  try {
    const { tx_ref, id: transactionId, amount, currency, customer, payment_type } = data;

    // Double-check with Flutterwave API
    const verification = await flwService.verifyTransaction(transactionId);
    if (!verification.success || verification.data.status !== 'successful') {
      console.error('Payment verification failed:', verification);
      return;
    }

    // Extract user ID from transaction reference
    const userId = tx_ref.split('_')[0];
    if (!userId) {
      console.error('Unable to extract user ID from transaction reference:', tx_ref);
      return;
    }

    // Update payment transaction record
    const { error: updateError } = await supabase
      .from('payment_transactions')
      .update({
        status: 'completed',
        flutterwave_response: data,
        completed_at: new Date().toISOString()
      })
      .eq('transaction_reference', tx_ref);

    if (updateError) {
      console.error('Error updating payment transaction:', updateError);
      return;
    }

    // Calculate coins (1 currency unit = 100 coins, adjust based on currency)
    const coinAmount = calculateCoins(amount, currency);

    // Credit user coins
    const { error: coinError } = await supabase.rpc('credit_user_coins', {
      p_user_id: userId,
      p_coin_amount: coinAmount,
      p_transaction_ref: tx_ref,
      p_description: `Coin purchase via ${payment_type}`
    });

    if (coinError) {
      console.error('Error crediting user coins:', coinError);
      return;
    }

    // Send notification to user
    await sendPaymentNotification(userId, {
      type: 'payment_success',
      amount,
      currency,
      coins: coinAmount,
      tx_ref
    });

    console.log(`Successfully processed payment: ${tx_ref}, credited ${coinAmount} coins to user ${userId}`);

  } catch (error) {
    console.error('Error handling successful payment:', error);
  }
}

/**
 * Handle failed payment
 */
async function handleFailedPayment(data: any) {
  try {
    const { tx_ref, processor_response } = data;

    // Update payment transaction record
    const { error } = await supabase
      .from('payment_transactions')
      .update({
        status: 'failed',
        flutterwave_response: data
      })
      .eq('transaction_reference', tx_ref);

    if (error) {
      console.error('Error updating failed payment transaction:', error);
      return;
    }

    // Extract user ID from transaction reference
    const userId = tx_ref.split('_')[0];
    if (userId) {
      // Send notification to user
      await sendPaymentNotification(userId, {
        type: 'payment_failed',
        tx_ref,
        reason: processor_response
      });
    }

    console.log(`Payment failed: ${tx_ref} - ${processor_response}`);

  } catch (error) {
    console.error('Error handling failed payment:', error);
  }
}

/**
 * Handle successful withdrawal
 */
async function handleSuccessfulWithdrawal(data: any) {
  try {
    const { reference, amount, currency, bank_name, account_number } = data;

    // Update withdrawal request record
    const { error } = await supabase
      .from('withdrawal_requests')
      .update({
        status: 'completed',
        flutterwave_transfer_id: data.id,
        processed_at: new Date().toISOString(),
        metadata: {
          ...data,
          completed_at: new Date().toISOString()
        }
      })
      .eq('reference', reference);

    if (error) {
      console.error('Error updating withdrawal request:', error);
      return;
    }

    // Get user ID from withdrawal request
    const { data: withdrawal } = await supabase
      .from('withdrawal_requests')
      .select('user_id')
      .eq('reference', reference)
      .single();

    if (withdrawal?.user_id) {
      // Send notification to user
      await sendPaymentNotification(withdrawal.user_id, {
        type: 'withdrawal_success',
        amount,
        currency,
        bank_name,
        account_number: maskAccountNumber(account_number),
        reference
      });
    }

    console.log(`Withdrawal completed: ${reference} - ${amount} ${currency}`);

  } catch (error) {
    console.error('Error handling successful withdrawal:', error);
  }
}

/**
 * Handle failed withdrawal
 */
async function handleFailedWithdrawal(data: any) {
  try {
    const { reference, processor_response } = data;

    // Update withdrawal request record
    const { error } = await supabase
      .from('withdrawal_requests')
      .update({
        status: 'failed',
        flutterwave_transfer_id: data.id,
        metadata: {
          ...data,
          failed_at: new Date().toISOString()
        }
      })
      .eq('reference', reference);

    if (error) {
      console.error('Error updating failed withdrawal request:', error);
      return;
    }

    // Get user ID from withdrawal request
    const { data: withdrawal } = await supabase
      .from('withdrawal_requests')
      .select('user_id')
      .eq('reference', reference)
      .single();

    if (withdrawal?.user_id) {
      // Send notification to user
      await sendPaymentNotification(withdrawal.user_id, {
        type: 'withdrawal_failed',
        reference,
        reason: processor_response
      });
    }

    console.log(`Withdrawal failed: ${reference} - ${processor_response}`);

  } catch (error) {
    console.error('Error handling failed withdrawal:', error);
  }
}

/**
 * Calculate coins based on currency and amount
 */
function calculateCoins(amount: number, currency: string): number {
  // Base conversion rates (1 currency unit = X coins)
  const conversionRates: Record<string, number> = {
    'RWF': 0.1,    // 1 RWF = 0.1 coins (10 RWF = 1 coin)
    'KES': 1,      // 1 KES = 1 coin
    'UGX': 0.03,   // 1 UGX = 0.03 coins (33 UGX = 1 coin)
    'TZS': 0.02,   // 1 TZS = 0.02 coins (50 TZS = 1 coin)
    'CDF': 0.0005, // 1 CDF = 0.0005 coins (2000 CDF = 1 coin)
    'BIF': 0.0004  // 1 BIF = 0.0004 coins (2500 BIF = 1 coin)
  };

  const rate = conversionRates[currency] || 1;
  return Math.round(amount * rate);
}

/**
 * Send payment notification to user
 */
async function sendPaymentNotification(userId: string, data: any) {
  try {
    // Create notification record
    const notificationData = {
      user_id: userId,
      type: data.type === 'payment_success' ? 'coin' : 
            data.type === 'payment_failed' ? 'system' :
            data.type === 'withdrawal_success' ? 'coin' : 'system',
      title: getNotificationTitle(data.type),
      message: getNotificationMessage(data),
      read: false,
      metadata: data
    };

    const { error } = await supabase
      .from('notifications')
      .insert(notificationData);

    if (error) {
      console.error('Error creating notification:', error);
    }

    // Here you could also send push notifications, emails, etc.
    console.log(`Notification sent to user ${userId}:`, data.type);

  } catch (error) {
    console.error('Error sending payment notification:', error);
  }
}

/**
 * Get notification title based on type
 */
function getNotificationTitle(type: string): string {
  switch (type) {
    case 'payment_success':
      return 'Payment Successful! 💰';
    case 'payment_failed':
      return 'Payment Failed ❌';
    case 'withdrawal_success':
      return 'Withdrawal Completed! ✅';
    case 'withdrawal_failed':
      return 'Withdrawal Failed ❌';
    default:
      return 'Payment Update';
  }
}

/**
 * Get notification message based on type and data
 */
function getNotificationMessage(data: any): string {
  switch (data.type) {
    case 'payment_success':
      return `Your payment of ${data.amount} ${data.currency} was successful. ${data.coins} LX coins have been added to your account.`;
    case 'payment_failed':
      return `Your payment failed: ${data.reason || 'Unknown error'}. Please try again or contact support.`;
    case 'withdrawal_success':
      return `Your withdrawal of ${data.amount} ${data.currency} to ${data.bank_name} (${data.account_number}) was successful.`;
    case 'withdrawal_failed':
      return `Your withdrawal failed: ${data.reason || 'Unknown error'}. Please check your details and try again.`;
    default:
      return 'Payment status updated';
  }
}

/**
 * Mask account number for security
 */
function maskAccountNumber(accountNumber: string): string {
  if (accountNumber.length <= 4) return accountNumber;
  return accountNumber.slice(0, 2) + '****' + accountNumber.slice(-2);
}

/**
 * GET endpoint for webhook testing
 */
export async function GET() {
  return Response.json({ 
    message: 'Flutterwave webhook endpoint is active',
    timestamp: new Date().toISOString()
  });
}

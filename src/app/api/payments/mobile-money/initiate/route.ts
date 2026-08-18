import { flutterwaveService, MobileMoneyPayment } from '@/services/flutterwave.service';
import { supabase } from '@/lib/supabase';

/**
 * Initiate mobile money payment
 */
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { 
      amount, 
      currency, 
      phone_number, 
      network, 
      country, 
      tx_ref, 
      email, 
      fullname 
    } = body as MobileMoneyPayment;

    // Validate required fields
    if (!amount || !currency || !phone_number || !network || !tx_ref || !email) {
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

    // Extract user ID from transaction reference
    const userId = tx_ref.split('_')[0];
    if (!userId) {
      return Response.json({ 
        success: false, 
        error: 'Invalid transaction reference' 
      }, { status: 400 });
    }

    // Create payment transaction record
    const { data: transaction, error: transactionError } = await supabase
      .from('payment_transactions')
      .insert({
        user_id: userId,
        transaction_reference: tx_ref,
        amount,
        currency,
        payment_method: 'mobile_money',
        mobile_network: network,
        phone_number,
        status: 'pending',
        purpose: 'coin_purchase',
        metadata: {
          country,
          source: 'mobile_money_payment'
        }
      })
      .select()
      .single();

    if (transactionError) {
      console.error('Error creating payment transaction:', transactionError);
      return Response.json({ 
        success: false, 
        error: 'Failed to create payment record' 
      }, { status: 500 });
    }

    // Initiate payment with Flutterwave
    const paymentData: MobileMoneyPayment = {
      amount,
      currency,
      phone_number,
      network,
      country,
      tx_ref,
      email,
      fullname,
      redirect_url: `${process.env.APP_URL}/payment/callback`,
      meta: {
        user_id: userId,
        transaction_id: transaction.id
      }
    };

    const result = await flutterwaveService.initiateMobileMoneyPayment(paymentData);

    if (result.status === 'success') {
      // Update transaction with Flutterwave reference
      await supabase
        .from('payment_transactions')
        .update({
          flutterwave_reference: result.data.flw_ref,
          flutterwave_response: result.data
        })
        .eq('id', transaction.id);

      return Response.json({
        success: true,
        data: {
          transaction_id: result.data.transaction_id,
          tx_ref: result.data.tx_ref,
          flw_ref: result.data.flw_ref,
          amount: result.data.amount,
          currency: result.data.currency,
          phone_number: result.data.phone_number,
          status: result.data.status
        }
      });
    } else {
      // Update transaction as failed
      await supabase
        .from('payment_transactions')
        .update({
          status: 'failed',
          flutterwave_response: result
        })
        .eq('id', transaction.id);

      return Response.json({
        success: false,
        error: result.message || 'Payment initiation failed'
      }, { status: 400 });
    }

  } catch (error: unknown) {
    console.error('Payment initiation error:', error);
    return Response.json({
      success: false,
      error: error instanceof Error ? error.message : 'Internal server error'
    }, { status: 500 });
  }
}

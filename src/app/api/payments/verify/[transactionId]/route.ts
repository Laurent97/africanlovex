import { FlutterwaveService } from '@/services/flutterwave.service';
import { supabase } from '@/lib/supabase';

const flwService = new FlutterwaveService();

/**
 * Verify transaction status
 * GET /api/payments/verify/[transactionId]
 */
export async function GET(
  request: Request,
  { params }: { params: { transactionId: string } }
) {
  try {
    const { transactionId } = params;

    if (!transactionId) {
      return Response.json({ 
        success: false, 
        error: 'Transaction ID is required' 
      }, { status: 400 });
    }

    // Verify transaction with Flutterwave
    const verification = await flwService.verifyTransaction(transactionId);

    if (!verification.success) {
      return Response.json({
        success: false,
        error: verification.error || 'Verification failed'
      }, { status: 400 });
    }

    const transactionData = verification.data;

    // Find our transaction record
    const { data: ourTransaction, error: fetchError } = await supabase
      .from('payment_transactions')
      .select('*')
      .eq('flutterwave_reference', transactionData.flw_ref)
      .single();

    if (fetchError) {
      console.error('Error fetching transaction:', fetchError);
      return Response.json({
        success: false,
        error: 'Transaction not found'
      }, { status: 404 });
    }

    // Update transaction status in our database
    let newStatus = 'pending';
    if (transactionData.status === 'successful') {
      newStatus = 'completed';
    } else if (transactionData.status === 'failed') {
      newStatus = 'failed';
    } else if (transactionData.status === 'processing') {
      newStatus = 'processing';
    }

    // Update only if status has changed
    if (ourTransaction.status !== newStatus) {
      const updateData: any = {
        status: newStatus,
        flutterwave_response: transactionData
      };

      if (newStatus === 'completed') {
        updateData.completed_at = new Date().toISOString();
      }

      const { error: updateError } = await supabase
        .from('payment_transactions')
        .update(updateData)
        .eq('id', ourTransaction.id);

      if (updateError) {
        console.error('Error updating transaction:', updateError);
      }
    }

    return Response.json({
      success: true,
      data: {
        id: transactionData.id,
        tx_ref: transactionData.tx_ref,
        flw_ref: transactionData.flw_ref,
        amount: transactionData.amount,
        currency: transactionData.currency,
        status: transactionData.status,
        payment_type: transactionData.payment_type,
        customer: transactionData.customer,
        processor_response: transactionData.processor_response,
        our_status: newStatus,
        created_at: ourTransaction.created_at,
        completed_at: ourTransaction.completed_at
      }
    });

  } catch (error: any) {
    console.error('Transaction verification error:', error);
    return Response.json({
      success: false,
      error: error.message || 'Internal server error'
    }, { status: 500 });
  }
}

/**
 * Handle webhook-style verification (POST)
 */
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { transactionId } = body;

    if (!transactionId) {
      return Response.json({ 
        success: false, 
        error: 'Transaction ID is required' 
      }, { status: 400 });
    }

    // Reuse the GET logic
    const verification = await flwService.verifyTransaction(transactionId);

    if (!verification.success) {
      return Response.json({
        success: false,
        error: verification.error || 'Verification failed'
      }, { status: 400 });
    }

    return Response.json({
      success: true,
      data: verification.data
    });

  } catch (error: any) {
    console.error('Transaction verification error:', error);
    return Response.json({
      success: false,
      error: error.message || 'Internal server error'
    }, { status: 500 });
  }
}

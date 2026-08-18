import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Check, X, Loader2, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { paymentsApi } from '@/api/payments';
import { supabase } from '@/lib/supabase';

const PaymentCallback = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [status, setStatus] = useState<'loading' | 'success' | 'failed'>('loading');
  const [message, setMessage] = useState('');

  useEffect(() => {
    const handlePaymentCallback = async () => {
      // Paystack returns either `reference` or `trxref`
      const reference = searchParams.get('reference') || searchParams.get('trxref');
      const statusParam = searchParams.get('status');

      if (!reference) {
        setStatus('failed');
        setMessage('Invalid payment reference');
        return;
      }

      try {
        // If Paystack already tells us it failed, we can short-circuit
        if (statusParam === 'failed' || statusParam === 'cancelled') {
          setStatus('failed');
          setMessage('Payment was not successful. Please try again.');
          return;
        }

        // Verify the transaction with Paystack
        const verification = await paymentsApi.verifyTransaction(reference);

        if (verification.status !== 'success' || (verification.data as any)?.status !== 'success') {
          setStatus('failed');
          setMessage('Payment verification failed. Please contact support.');
          return;
        }

        // Find the pending transaction record we created during initiation
        const { data: paymentRecord, error: paymentError } = await supabase
          .from('payment_transactions')
          .select('*')
        .eq('transaction_id', reference)
          .maybeSingle();

        if (paymentError || !paymentRecord) {
          console.error('Payment record not found:', paymentError);
          setStatus('failed');
          setMessage('We could not find your payment record. Please contact support.');
          return;
        }

        const metadata = (paymentRecord.metadata as Record<string, any>) || {};
        const purpose = metadata.purpose || 'general';
        const userId = paymentRecord.user_id;

        // Mark the transaction as verified (requires UPDATE RLS policy to succeed)
        await supabase
          .from('payment_transactions')
          .update({ status: 'success', updated_at: new Date().toISOString() })
          .eq('id', paymentRecord.id);

        // Fulfill only when the money has actually been received
        const fulfillment = await fulfillPayment(userId, paymentRecord, purpose, metadata);

        if (fulfillment.success) {
          setStatus('success');
          setMessage(fulfillment.message || 'Payment completed successfully!');

          toast({
            title: 'Payment Successful! 🎉',
            description: fulfillment.message,
          });
        } else {
          setStatus('failed');
          setMessage(fulfillment.message || 'Payment could not be fulfilled. Please contact support.');
        }
      } catch (error) {
        console.error('Payment callback error:', error);
        setStatus('failed');
        setMessage('An error occurred while processing your payment.');
      }
    };

    const fulfillPayment = async (
      userId: string,
      paymentRecord: any,
      purpose: string,
      metadata: Record<string, any>
    ): Promise<{ success: boolean; message?: string }> => {
      if (purpose === 'coin_purchase') {
        const coins = Number(metadata.coins || 0);
        const bonus = Number(metadata.bonus || 0);
        const totalCoins = coins + bonus;

        if (totalCoins <= 0) {
          return { success: false, message: 'Invalid coin amount for this purchase.' };
        }

        // Idempotency: only credit if no coin transaction is already linked to this payment
        const { data: existing } = await supabase
          .from('coin_transactions')
          .select('id')
          .eq('reference_id', paymentRecord.id)
          .maybeSingle();

        if (existing) {
          return { success: true, message: 'Your coins have already been credited.' };
        }

        // Credit the user
        const { data: profile } = await supabase
          .from('profiles')
          .select('coins_balance')
          .eq('id', userId)
          .single();

        const newBalance = (profile?.coins_balance || 0) + totalCoins;

        const { error: updateError } = await supabase
          .from('profiles')
          .update({ coins_balance: newBalance })
          .eq('id', userId);

        if (updateError) {
          console.error('Failed to update coin balance:', updateError);
          return { success: false, message: 'Could not credit your coins. Please contact support.' };
        }

        const { error: coinTxError } = await supabase.from('coin_transactions').insert({
          user_id: userId,
          amount: totalCoins,
          transaction_type: 'purchase',
          description: `Coin purchase via Paystack (${paymentRecord.currency} ${paymentRecord.amount})`,
          reference_id: paymentRecord.id
        });

        if (coinTxError) {
          console.error('Failed to log coin transaction:', coinTxError);
        }

        return { success: true, message: `Your wallet has been credited with ${totalCoins.toLocaleString()} LX coins!` };
      }

      if (purpose === 'vip_subscription') {
        const planId = metadata.planId as string;
        const tier = metadata.tier as string;
        const durationDays = Number(metadata.durationDays || 30);

        if (!tier) {
          return { success: false, message: 'Missing VIP tier information.' };
        }

        // Idempotency: avoid creating a duplicate subscription for the same payment
        const { data: existing } = await supabase
          .from('subscriptions')
          .select('id')
          .eq('user_id', userId)
          .eq('tier', tier)
          .eq('amount', paymentRecord.amount)
          .gt('created_at', new Date(Date.now() - 5 * 60 * 1000).toISOString())
          .maybeSingle();

        if (existing) {
          return { success: true, message: 'Your VIP subscription is already active.' };
        }

        const startDate = new Date();
        const endDate = new Date(startDate);
        endDate.setDate(endDate.getDate() + durationDays);

        const { error: subError } = await supabase.from('subscriptions').insert({
          user_id: userId,
          tier,
          status: 'active',
          start_date: startDate.toISOString(),
          end_date: endDate.toISOString(),
          amount: paymentRecord.amount,
          currency: paymentRecord.currency,
          payment_method: 'paystack'
        });

        if (subError) {
          console.error('Failed to create subscription:', subError);
          return { success: false, message: 'Could not activate your VIP subscription. Please contact support.' };
        }

        const { error: profileError } = await supabase
          .from('profiles')
          .update({ is_premium: true, vip_tier: tier })
          .eq('id', userId);

        if (profileError) {
          console.error('Failed to update profile VIP status:', profileError);
        }

        return { success: true, message: `Welcome to ${tier} VIP! Your subscription is now active.` };
      }

      // Fallback for unsupported or future purposes
      return { success: true, message: 'Payment verified successfully.' };
    };

    handlePaymentCallback();
  }, [searchParams, toast]);

  const handleBackToWallet = () => {
    navigate('/wallet');
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md"
      >
        <Card className="border-0 shadow-2xl overflow-hidden">
          <CardContent className="p-8">
            <div className="text-center">
              {/* Status Icon */}
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.2, duration: 0.3 }}
                className={`w-20 h-20 mx-auto mb-6 rounded-full flex items-center justify-center ${
                  status === 'success'
                    ? 'bg-green-100'
                    : status === 'failed'
                    ? 'bg-red-100'
                    : 'bg-blue-100'
                }`}
              >
                {status === 'loading' && (
                  <Loader2 className="w-10 h-10 text-blue-600 animate-spin" />
                )}
                {status === 'success' && (
                  <Check className="w-10 h-10 text-green-600" />
                )}
                {status === 'failed' && (
                  <X className="w-10 h-10 text-red-600" />
                )}
              </motion.div>

              {/* Status Text */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.3, duration: 0.3 }}
              >
                <h1 className="text-2xl font-bold mb-2">
                  {status === 'loading' && 'Processing Payment...'}
                  {status === 'success' && 'Payment Successful!'}
                  {status === 'failed' && 'Payment Failed'}
                </h1>

                <p className="text-gray-600 mb-6">
                  {status === 'loading' && 'Please wait while we verify your payment...'}
                  {status === 'success' && message}
                  {status === 'failed' && message}
                </p>
              </motion.div>

              {/* Action Buttons */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.4, duration: 0.3 }}
                className="space-y-3"
              >
                {status !== 'loading' && (
                  <Button
                    onClick={handleBackToWallet}
                    className="w-full bg-gradient-to-r from-purple-600 to-pink-600 text-white hover:from-purple-700 hover:to-pink-700"
                  >
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Back to Wallet
                  </Button>
                )}

                {status === 'failed' && (
                  <Button
                    onClick={() => navigate('/wallet')}
                    variant="outline"
                    className="w-full"
                  >
                    Try Again
                  </Button>
                )}
              </motion.div>

              {/* Additional Info */}
              {status === 'success' && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.5, duration: 0.3 }}
                  className="mt-6 p-4 bg-green-50 rounded-lg"
                >
                  <p className="text-sm text-green-800">
                    <strong>Tip:</strong> You can now use your coins to send gifts, unlock premium features, and more!
                  </p>
                </motion.div>
              )}

              {status === 'failed' && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.5, duration: 0.3 }}
                  className="mt-6 p-4 bg-red-50 rounded-lg"
                >
                  <p className="text-sm text-red-800">
                    <strong>Need help?</strong> Contact our support team if you believe this is an error.
                  </p>
                </motion.div>
              )}
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
};

export default PaymentCallback;

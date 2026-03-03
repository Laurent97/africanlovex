import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Check, X, Loader2, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { paymentsApi } from '@/api/payments';

const PaymentCallback = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [status, setStatus] = useState<'loading' | 'success' | 'failed'>('loading');
  const [message, setMessage] = useState('');

  useEffect(() => {
    const handlePaymentCallback = async () => {
      const txRef = searchParams.get('tx_ref');
      const status = searchParams.get('status');
      const transactionId = searchParams.get('transaction_id');

      if (!txRef) {
        setStatus('failed');
        setMessage('Invalid payment reference');
        return;
      }

      try {
        if (status === 'successful') {
          // Verify the transaction with Flutterwave
          const verification = await paymentsApi.verifyTransaction(txRef);
          
          if (verification.status === 'success' && verification.data?.status === 'successful') {
            setStatus('success');
            setMessage('Payment completed successfully! Your coins have been added to your wallet.');
            
            toast({
              title: "Payment Successful! 🎉",
              description: "Your coins have been added to your wallet.",
            });
          } else {
            setStatus('failed');
            setMessage('Payment verification failed. Please contact support.');
          }
        } else if (status === 'failed') {
          setStatus('failed');
          setMessage('Payment was not successful. Please try again.');
        } else {
          setStatus('failed');
          setMessage('Payment status unknown. Please contact support.');
        }
      } catch (error) {
        console.error('Payment callback error:', error);
        setStatus('failed');
        setMessage('An error occurred while processing your payment.');
      }
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

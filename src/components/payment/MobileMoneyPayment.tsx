import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Smartphone, 
  CheckCircle, 
  AlertCircle, 
  Loader2, 
  Info,
  Globe,
  Phone,
  CreditCard,
  Shield
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/use-auth';
import { supabase } from '@/lib/supabase';
import { paymentsApi } from '@/api/payments';

interface MobileMoneyPaymentProps {
  amount: number;
  currency?: string;
  onSuccess: (transaction: Record<string, unknown>) => void;
  onError: (error: string) => void;
  onClose?: () => void;
}

const MOBILE_NETWORKS = {
  Rwanda: [
    { code: 'MTN', name: 'MTN Mobile Money', icon: '📱' },
    { code: 'AIRTEL', name: 'Airtel Money', icon: '📱' }
  ],
  Kenya: [
    { code: 'MPESA', name: 'M-Pesa', icon: '📱' }
  ],
  Uganda: [
    { code: 'MTN', name: 'MTN Mobile Money', icon: '📱' },
    { code: 'AIRTEL', name: 'Airtel Money', icon: '📱' }
  ],
  Tanzania: [
    { code: 'AIRTEL', name: 'Airtel Money', icon: '📱' },
    { code: 'TIGO', name: 'Tigo Pesa', icon: '📱' },
    { code: 'HALOPESA', name: 'Halopesa', icon: '📱' }
  ],
  Burundi: [
    { code: 'ECOCASH', name: 'EcoCash', icon: '📱' },
    { code: 'LUMICASH', name: 'Lumicash', icon: '📱' }
  ],
  'DRC': [
    { code: 'AIRTEL', name: 'Airtel Money', icon: '📱' },
    { code: 'ORANGE', name: 'Orange Money', icon: '📱' },
    { code: 'MPESA', name: 'M-Pesa', icon: '📱' }
  ],
  Nigeria: [
    { code: 'MTN', name: 'MTN Mobile Money', icon: '📱' },
    { code: 'AIRTEL', name: 'Airtel Money', icon: '📱' }
  ],
  Ghana: [
    { code: 'MTN', name: 'MTN Mobile Money', icon: '📱' },
    { code: 'AIRTEL', name: 'Airtel Money', icon: '📱' },
    { code: 'TIGO', name: 'Tigo Cash', icon: '📱' }
  ]
};

const COUNTRY_CONFIG = {
  Rwanda: { currency: 'RWF', flag: '🇷🇼', name: 'Rwanda' },
  Kenya: { currency: 'KES', flag: '🇰🇪', name: 'Kenya' },
  Uganda: { currency: 'UGX', flag: '🇺🇬', name: 'Uganda' },
  Tanzania: { currency: 'TZS', flag: '🇹🇿', name: 'Tanzania' },
  Burundi: { currency: 'BIF', flag: '🇧🇮', name: 'Burundi' },
  'DRC': { currency: 'CDF', flag: '🇨🇩', name: 'DRC' },
  Nigeria: { currency: 'NGN', flag: '🇳🇬', name: 'Nigeria' },
  Ghana: { currency: 'GHS', flag: '🇬🇭', name: 'Ghana' }
};

export const MobileMoneyPayment: React.FC<MobileMoneyPaymentProps> = ({
  amount,
  currency = 'RWF',
  onSuccess,
  onError,
  onClose
}) => {
  const [step, setStep] = useState(1);
  const [selectedCountry, setSelectedCountry] = useState('Rwanda');
  const [selectedNetwork, setSelectedNetwork] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [transactionRef, setTransactionRef] = useState('');
  const [pollingInterval, setPollingInterval] = useState<NodeJS.Timeout | null>(null);
  
  const { toast } = useToast();
  const { user } = useAuth();

  // Auto-select country based on currency
  useEffect(() => {
    const country = Object.entries(COUNTRY_CONFIG).find(
      ([_, config]) => config.currency === currency
    )?.[0] || 'Rwanda';
    setSelectedCountry(country);
  }, [currency]);

  // Cleanup polling on unmount
  useEffect(() => {
    return () => {
      if (pollingInterval) {
        clearInterval(pollingInterval);
      }
    };
  }, [pollingInterval]);

  const validatePhoneNumber = (phone: string, country: string) => {
    const patterns: Record<string, RegExp> = {
      Rwanda: /^07[238]\d{7}$|^7[238]\d{7}$|^2507[238]\d{7}$/,
      Kenya: /^07\d{8}$|^01\d{8}$|^2547\d{8}$/,
      Uganda: /^07\d{8}$|^078\d{7}$|^2567\d{8}$/,
      Tanzania: /^06\d{8}$|^07\d{8}$|^255[67]\d{8}$/,
      Burundi: /^07\d{8}$|^2577\d{8}$/,
      'DRC': /^08\d{8}$|^09\d{8}$|^243[89]\d{8}$/
    };
    
    return patterns[country]?.test(phone.replace(/\s/g, '')) || phone.length >= 10;
  };

  const formatPhoneNumber = (phone: string, country: string) => {
    const cleaned = phone.replace(/\s/g, '');
    const countryCodes: Record<string, string> = {
      Rwanda: '250',
      Kenya: '254',
      Uganda: '256',
      Tanzania: '255',
      Burundi: '257',
      'DRC': '243'
    };

    const code = countryCodes[country];
    
    // If number starts with country code, return as is
    if (cleaned.startsWith(code)) {
      return cleaned;
    }
    
    // If number starts with 0, replace with country code
    if (cleaned.startsWith('0')) {
      return code + cleaned.slice(1);
    }
    
    // Otherwise, add country code
    return code + cleaned;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validatePhoneNumber(phoneNumber, selectedCountry)) {
      toast({
        title: "Invalid Phone Number",
        description: `Please enter a valid ${COUNTRY_CONFIG[selectedCountry as keyof typeof COUNTRY_CONFIG].name} phone number`,
        variant: "destructive"
      });
      return;
    }

    if (!selectedNetwork) {
      toast({
        title: "Network Required",
        description: "Please select your mobile money network",
        variant: "destructive"
      });
      return;
    }

    setIsProcessing(true);
    
    try {
      // Generate unique transaction reference
      const tx_ref = `${user?.id}_${Date.now()}_${Math.random().toString(36).substring(7)}`;
      setTransactionRef(tx_ref);

      const formattedPhone = formatPhoneNumber(phoneNumber, selectedCountry);

      const result = await paymentsApi.initiatePayment({
        amount,
        currency: COUNTRY_CONFIG[selectedCountry as keyof typeof COUNTRY_CONFIG].currency,
        email: user?.email || '',
        fullname: user?.user_metadata?.full_name || user?.user_metadata?.username || 'User',
        tx_ref,
        payment_method: selectedNetwork.toLowerCase(),
        meta: {
          purpose: 'coin_purchase',
          user_id: user?.id,
          phone_number: formattedPhone,
          network: selectedNetwork,
          country: selectedCountry
        }
      });
      
      if (result.status === 'success') {
        setStep(2);

        const data = result.data as any;
        const txId = data?.transaction_id || data?.reference || tx_ref;

        // Open Paystack checkout so the user can complete payment
        if (data?.authorization_url) {
          window.open(data.authorization_url, '_blank');
        }

        // Start polling for transaction status
        startPolling(txId);
      } else {
        throw new Error(result.message || 'Payment initiation failed');
      }
    } catch (error: unknown) {
      console.error('Payment initiation error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to initiate payment';
      onError(errorMessage);
      toast({
        title: "Payment Failed",
        description: errorMessage,
        variant: "destructive"
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const startPolling = (transactionId: string) => {
    const interval = setInterval(async () => {
      try {
        const result = await paymentsApi.verifyTransaction(transactionId);
        
        if (result.status === 'success' && result.data) {
          const data = result.data as any;
          if (data.status === 'success') {
            clearInterval(interval);
            setPollingInterval(null);

            // Mark the payment record as successful
            await supabase
              .from('payment_transactions')
              .update({ status: 'success', updated_at: new Date().toISOString() })
              .eq('transaction_id', transactionId);

            onSuccess(data);
            setStep(3);
          } else if (data.status === 'failed' || data.status === 'abandoned') {
            clearInterval(interval);
            setPollingInterval(null);

            await supabase
              .from('payment_transactions')
              .update({ status: 'failed', updated_at: new Date().toISOString() })
              .eq('transaction_id', transactionId);

            onError('Payment failed');
            setStep(1);
          }
        }
      } catch (error) {
        console.error('Polling error:', error);
      }
    }, 3000); // Poll every 3 seconds

    setPollingInterval(interval);

    // Stop polling after 2 minutes
    setTimeout(() => {
      clearInterval(interval);
      setPollingInterval(null);
    }, 120000);
  };

  const resetForm = () => {
    setStep(1);
    setPhoneNumber('');
    setSelectedNetwork('');
    setTransactionRef('');
    if (pollingInterval) {
      clearInterval(pollingInterval);
      setPollingInterval(null);
    }
  };

  return (
    <div className="max-w-md mx-auto w-full">
      <Card className="border-0 shadow-lg">
        <CardHeader className="text-center pb-4">
          <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center mx-auto mb-4">
            <Smartphone className="w-8 h-8 text-white" />
          </div>
          <CardTitle className="text-xl">Mobile Money Payment</CardTitle>
          <p className="text-sm text-gray-600">
            Pay {amount} {currency} with your preferred mobile money service
          </p>
        </CardHeader>

        <CardContent className="space-y-6">
          {step === 1 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-4"
            >
              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Country Selection */}
                <div>
                  <Label className="text-sm font-medium">Country</Label>
                  <Select value={selectedCountry} onValueChange={setSelectedCountry}>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select your country" />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(COUNTRY_CONFIG).map(([code, config]) => (
                        <SelectItem key={code} value={code}>
                          <div className="flex items-center gap-2">
                            <span>{config.flag}</span>
                            <span>{config.name}</span>
                            <Badge variant="outline" className="text-xs">
                              {config.currency}
                            </Badge>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Network Selection */}
                <div>
                  <Label className="text-sm font-medium">Mobile Network</Label>
                  <Select value={selectedNetwork} onValueChange={setSelectedNetwork}>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select your network" />
                    </SelectTrigger>
                    <SelectContent>
                      {MOBILE_NETWORKS[selectedCountry as keyof typeof MOBILE_NETWORKS]?.map(network => (
                        <SelectItem key={network.code} value={network.code}>
                          <div className="flex items-center gap-2">
                            <span>{network.icon}</span>
                            <span>{network.name}</span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Phone Number */}
                <div>
                  <Label className="text-sm font-medium">Phone Number</Label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <Input
                      type="tel"
                      placeholder={`e.g., 0788123456`}
                      value={phoneNumber}
                      onChange={(e) => setPhoneNumber(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    Enter your mobile money number without country code
                  </p>
                </div>

                {/* Security Badge */}
                <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                  <div className="flex items-center gap-2">
                    <Shield className="w-4 h-4 text-green-600" />
                    <span className="text-sm text-green-800">
                      Secured by Paystack
                    </span>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-3">
                  <Button
                    type="submit"
                    disabled={isProcessing}
                    className="flex-1 bg-gradient-to-r from-purple-600 to-pink-600 text-white"
                  >
                    {isProcessing ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Processing...
                      </>
                    ) : (
                      `Pay ${amount} ${currency}` 
                    )}
                  </Button>
                  {onClose && (
                    <Button
                      type="button"
                      variant="outline"
                      onClick={onClose}
                    >
                      Cancel
                    </Button>
                  )}
                </div>
              </form>

              {/* Instructions */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <Info className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                  <div className="text-sm text-blue-800">
                    <p className="font-medium mb-1">How it works:</p>
                    <ol className="list-decimal list-inside space-y-1">
                      <li>Enter your mobile money number</li>
                      <li>You'll receive a payment request via USSD</li>
                      <li>Enter your PIN to confirm payment</li>
                      <li>Your balance updates instantly</li>
                    </ol>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {step === 2 && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="text-center py-8"
            >
              <Loader2 className="w-16 h-16 animate-spin text-purple-600 mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">Waiting for Payment</h3>
              <p className="text-sm text-gray-600 mb-4">
                Please check your phone and complete the payment
              </p>
              <div className="bg-gray-50 rounded-lg p-4 text-left">
                <p className="text-sm font-medium mb-2">Transaction Details:</p>
                <div className="space-y-1 text-xs">
                  <p><strong>Reference:</strong> {transactionRef}</p>
                  <p><strong>Amount:</strong> {amount} {currency}</p>
                  <p><strong>Network:</strong> {selectedNetwork}</p>
                  <p><strong>Phone:</strong> {phoneNumber}</p>
                </div>
              </div>
              <Button
                variant="outline"
                onClick={resetForm}
                className="mt-4"
              >
                Cancel Payment
              </Button>
            </motion.div>
          )}

          {step === 3 && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="text-center py-8"
            >
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="w-8 h-8 text-green-600" />
              </div>
              <h3 className="text-lg font-semibold text-green-600 mb-2">
                Payment Successful!
              </h3>
              <p className="text-sm text-gray-600 mb-4">
                Your balance has been updated
              </p>
              <div className="bg-green-50 rounded-lg p-4 text-left">
                <p className="text-sm font-medium mb-2">Payment Completed:</p>
                <div className="space-y-1 text-xs">
                  <p><strong>Amount:</strong> {amount} {currency}</p>
                  <p><strong>Reference:</strong> {transactionRef}</p>
                  <p><strong>Status:</strong> <span className="text-green-600">Completed</span></p>
                </div>
              </div>
              <Button
                onClick={onClose || resetForm}
                className="mt-4 bg-green-600 text-white"
              >
                Continue
              </Button>
            </motion.div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

import { paystackService, MobileMoneyPayment, WithdrawalData } from '@/services/paystack.service';
import { supabase } from '@/lib/supabase';

export interface PaymentInitiateRequest {
  amount: number;
  currency: string;
  email: string;
  fullname: string;
  tx_ref: string;
  payment_method: string;
  meta?: Record<string, unknown>;
}

export interface Bank {
  code: string;
  name: string;
}

export interface PaymentResponse {
  status: 'success' | 'error';
  message: string;
  data?: unknown;
}

class PaymentsApi {
  /**
   * Initiate payment (mobile money or card)
   */
  async initiatePayment(paymentData: PaymentInitiateRequest): Promise<PaymentResponse> {
    try {
      const userId = paymentData.meta?.user_id as string | undefined;
      if (!userId) {
        return {
          status: 'error',
          message: 'Missing user_id in payment metadata'
        };
      }

      let result: PaymentResponse;

      // For mobile money payments
      if (paymentData.payment_method.startsWith('mtn') ||
          paymentData.payment_method.startsWith('airtel') ||
          paymentData.payment_method.startsWith('mpesa')) {

        const mobileMoneyData: MobileMoneyPayment = {
          amount: paymentData.amount,
          currency: paymentData.currency as 'RWF' | 'UGX' | 'KES' | 'GHS' | 'NGN' | 'USD',
          phone_number: paymentData.meta?.phone_number || '',
          network: paymentData.payment_method.toUpperCase() as 'MTN' | 'AIRTEL' | 'MPESA',
          email: paymentData.email,
          fullname: paymentData.fullname,
          tx_ref: paymentData.tx_ref,
          country: (paymentData.meta?.country as string) || 'RW',
          meta: paymentData.meta
        };

        result = await paystackService.initiateMobileMoneyPayment(mobileMoneyData);
      }
      // For card payments, create payment link
      else if (paymentData.payment_method === 'card') {
        result = await paystackService.createPaymentLink({
          amount: paymentData.amount,
          currency: paymentData.currency,
          email: paymentData.email,
          fullname: paymentData.fullname,
          tx_ref: paymentData.tx_ref
        });
      }
      // Other payment methods
      else {
        result = await paystackService.createPaymentLink({
          amount: paymentData.amount,
          currency: paymentData.currency,
          email: paymentData.email,
          fullname: paymentData.fullname,
          tx_ref: paymentData.tx_ref
        });
      }

      if (result.status === 'success' && result.data) {
        const data = result.data as any;
        const reference = data.reference || data.transaction_id || paymentData.tx_ref;

        // Persist the pending transaction so the callback can verify and fulfill it
        const { error: insertError } = await supabase.from('payment_transactions').insert({
          user_id: userId,
          transaction_id: reference,
          amount: paymentData.amount,
          currency: paymentData.currency,
          status: 'pending',
          payment_method: paymentData.payment_method,
          provider: 'paystack',
          metadata: {
            ...(paymentData.meta || {}),
            purpose: (paymentData.meta?.purpose as string) || 'general',
            paystack_reference: reference,
            authorization_url: data.authorization_url || data.payment_link || data.link,
            initialized_at: new Date().toISOString()
          }
        });

        if (insertError) {
          console.error('Failed to record payment transaction:', insertError);
        }
      }

      return result;
    } catch (error: unknown) {
      return {
        status: 'error',
        message: error instanceof Error ? error.message : 'Payment initiation failed'
      };
    }
  }

  /**
   * Verify transaction status
   */
  async verifyTransaction(txRef: string): Promise<PaymentResponse> {
    try {
      return await paystackService.verifyTransaction(txRef);
    } catch (error: unknown) {
      return {
        status: 'error',
        message: error instanceof Error ? error.message : 'Transaction verification failed'
      };
    }
  }

  /**
   * Initiate withdrawal
   */
  async withdraw(withdrawalData: WithdrawalData): Promise<PaymentResponse> {
    try {
      return await paystackService.initiateWithdrawal(withdrawalData);
    } catch (error: unknown) {
      return {
        status: 'error',
        message: error instanceof Error ? error.message : 'Withdrawal initiation failed'
      };
    }
  }

  /**
   * Get withdrawal status
   */
  async getWithdrawalStatus(transferId: string): Promise<PaymentResponse> {
    try {
      return await paystackService.getTransferStatus(transferId);
    } catch (error: unknown) {
      return {
        status: 'error',
        message: error instanceof Error ? error.message : 'Failed to get withdrawal status'
      };
    }
  }

  /**
   * Get banks list
   */
  async getBanks(country: string = 'RW'): Promise<PaymentResponse> {
    try {
      const response = await fetch(`/api/flutterwave/banks?country=${country}`);
      const data = await response.json();
      
      if (response.ok && data.success) {
        return {
          status: 'success',
          message: 'Banks retrieved successfully',
          data: data.data
        };
      } else {
        return {
          status: 'error',
          message: data.error || 'Failed to retrieve banks'
        };
      }
    } catch (error: unknown) {
      return {
        status: 'error',
        message: error instanceof Error ? error.message : 'Failed to retrieve banks'
      };
    }
  }

  /**
   * Verify bank account
   */
  async verifyAccount(accountNumber: string, bankCode: string): Promise<PaymentResponse> {
    try {
      return await paystackService.verifyAccount(accountNumber, bankCode);
    } catch (error: unknown) {
      return {
        status: 'error',
        message: error instanceof Error ? error.message : 'Account verification failed'
      };
    }
  }
}

export const paymentsApi = new PaymentsApi();

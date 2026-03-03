import { flutterwaveService, MobileMoneyPayment, WithdrawalData } from '@/services/flutterwave.service';

export interface PaymentInitiateRequest {
  amount: number;
  currency: string;
  email: string;
  fullname: string;
  tx_ref: string;
  payment_method: string;
  meta?: Record<string, any>;
}

export interface Bank {
  code: string;
  name: string;
}

export interface PaymentResponse {
  status: 'success' | 'error';
  message: string;
  data?: any;
}

class PaymentsApi {
  /**
   * Initiate payment (mobile money or card)
   */
  async initiatePayment(paymentData: PaymentInitiateRequest): Promise<PaymentResponse> {
    try {
      // For mobile money payments
      if (paymentData.payment_method.startsWith('mtn') || 
          paymentData.payment_method.startsWith('airtel') || 
          paymentData.payment_method.startsWith('mpesa')) {
        
        const mobileMoneyData: MobileMoneyPayment = {
          amount: paymentData.amount,
          currency: paymentData.currency as any,
          phone_number: '', // Will be provided by user in frontend
          network: paymentData.payment_method.toUpperCase() as any,
          email: paymentData.email,
          fullname: paymentData.fullname,
          tx_ref: paymentData.tx_ref,
          country: 'RW', // Default to Rwanda
          meta: paymentData.meta
        };

        return await flutterwaveService.initiateMobileMoneyPayment(mobileMoneyData);
      } 
      
      // For card payments, create payment link
      else if (paymentData.payment_method === 'card') {
        return await flutterwaveService.createPaymentLink({
          amount: paymentData.amount,
          currency: paymentData.currency,
          email: paymentData.email,
          fullname: paymentData.fullname,
          tx_ref: paymentData.tx_ref
        });
      }
      
      // Other payment methods
      else {
        return await flutterwaveService.createPaymentLink({
          amount: paymentData.amount,
          currency: paymentData.currency,
          email: paymentData.email,
          fullname: paymentData.fullname,
          tx_ref: paymentData.tx_ref
        });
      }
    } catch (error: any) {
      return {
        status: 'error',
        message: error.message || 'Payment initiation failed'
      };
    }
  }

  /**
   * Verify transaction status
   */
  async verifyTransaction(txRef: string): Promise<PaymentResponse> {
    try {
      return await flutterwaveService.verifyTransaction(txRef);
    } catch (error: any) {
      return {
        status: 'error',
        message: error.message || 'Transaction verification failed'
      };
    }
  }

  /**
   * Initiate withdrawal
   */
  async withdraw(withdrawalData: WithdrawalData): Promise<PaymentResponse> {
    try {
      return await flutterwaveService.initiateWithdrawal(withdrawalData);
    } catch (error: any) {
      return {
        status: 'error',
        message: error.message || 'Withdrawal initiation failed'
      };
    }
  }

  /**
   * Get withdrawal status
   */
  async getWithdrawalStatus(transferId: string): Promise<PaymentResponse> {
    try {
      return await flutterwaveService.getTransferStatus(transferId);
    } catch (error: any) {
      return {
        status: 'error',
        message: error.message || 'Failed to get withdrawal status'
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
    } catch (error: any) {
      return {
        status: 'error',
        message: error.message || 'Failed to retrieve banks'
      };
    }
  }

  /**
   * Verify bank account
   */
  async verifyAccount(accountNumber: string, bankCode: string): Promise<PaymentResponse> {
    try {
      return await flutterwaveService.verifyAccount(accountNumber, bankCode);
    } catch (error: any) {
      return {
        status: 'error',
        message: error.message || 'Account verification failed'
      };
    }
  }
}

export const paymentsApi = new PaymentsApi();

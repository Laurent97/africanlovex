export interface MobileMoneyPayment {
  amount: number;
  currency: 'RWF' | 'KES' | 'UGX' | 'TZS' | 'CDF' | 'BIF';
  phone_number: string;
  network: 'MTN' | 'AIRTEL' | 'MPESA' | 'TIGO' | 'ORANGE' | 'ECOCASH' | 'LUMICASH' | 'HALOPESA';
  email: string;
  fullname: string;
  tx_ref: string;
  country: string;
  redirect_url?: string;
  meta?: Record<string, any>;
}

export interface WithdrawalData {
  amount: number;
  currency: string;
  account_bank: string;
  account_number: string;
  beneficiary_name: string;
  reference: string;
  narration?: string;
  meta?: {
    sender: string;
    sender_country: string;
    sender_address: string;
  };
}

export interface FlutterwaveResponse {
  status: 'success' | 'error';
  message: string;
  data?: any;
}

export class FlutterwaveService {
  private baseUrl = 'https://api.flutterwave.com/v3';
  private secretKey: string;
  private publicKey: string;
  
  constructor() {
    this.secretKey = import.meta.env.FLUTTERWAVE_SECRET_KEY || '';
    this.publicKey = import.meta.env.VITE_FLUTTERWAVE_PUBLIC_KEY || '';
  }

  private getHeaders() {
    return {
      'Authorization': `Bearer ${this.secretKey}`,
      'Content-Type': 'application/json',
    };
  }

  /**
   * Initialize mobile money payment
   */
  async initiateMobileMoneyPayment(paymentData: MobileMoneyPayment): Promise<FlutterwaveResponse> {
    try {
      // Map network to Flutterwave's expected format
      const networkMap: Record<string, string> = {
        'MTN': 'mtn',
        'AIRTEL': 'airtel',
        'MPESA': 'mpesa',
        'TIGO': 'tigo',
        'ORANGE': 'orange',
        'ECOCASH': 'ecocash',
        'LUMICASH': 'lumicash',
        'HALOPESA': 'halopesa'
      };

      const payload = {
        tx_ref: paymentData.tx_ref,
        amount: paymentData.amount,
        currency: paymentData.currency,
        payment_options: 'mobilemoney',
        payment_plan: null,
        redirect_url: paymentData.redirect_url || `${import.meta.env.VITE_APP_URL}/payment/callback`,
        customer: {
          email: paymentData.email,
          phonenumber: paymentData.phone_number,
          name: paymentData.fullname
        },
        customizations: {
          title: 'LoveX - Coin Purchase',
          description: `Purchase ${paymentData.amount} ${paymentData.currency} worth of LX Coins`,
          logo: `${import.meta.env.VITE_APP_URL}/favicon.ico`
        },
        meta: {
          ...paymentData.meta,
          platform: 'web',
          source: 'lovex_wallet'
        }
      };

      const response = await fetch(`${this.baseUrl}/payments`, {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify(payload)
      });

      const data = await response.json();

      if (data.status === 'success') {
        return {
          status: 'success',
          message: 'Payment initiated successfully',
          data: data.data
        };
      } else {
        return {
          status: 'error',
          message: data.message || 'Failed to initiate payment',
          data: data
        };
      }
    } catch (error: any) {
      console.error('Flutterwave payment error:', error);
      return {
        status: 'error',
        message: error.message || 'Payment initiation failed'
      };
    }
  }

  /**
   * Verify transaction status
   */
  async verifyTransaction(transactionId: string): Promise<FlutterwaveResponse> {
    try {
      const response = await fetch(`${this.baseUrl}/transactions/${transactionId}/verify`, {
        method: 'GET',
        headers: this.getHeaders()
      });

      const data = await response.json();

      if (data.status === 'success') {
        return {
          status: 'success',
          message: 'Transaction verified successfully',
          data: data.data
        };
      } else {
        return {
          status: 'error',
          message: data.message || 'Failed to verify transaction',
          data: data
        };
      }
    } catch (error: any) {
      console.error('Flutterwave verification error:', error);
      return {
        status: 'error',
        message: error.message || 'Transaction verification failed'
      };
    }
  }

  /**
   * Initiate withdrawal/transfer
   */
  async initiateWithdrawal(withdrawalData: WithdrawalData): Promise<FlutterwaveResponse> {
    try {
      const payload = {
        account_bank: withdrawalData.account_bank,
        account_number: withdrawalData.account_number,
        amount: withdrawalData.amount,
        currency: withdrawalData.currency,
        beneficiary_name: withdrawalData.beneficiary_name,
        reference: withdrawalData.reference,
        narration: withdrawalData.narration || 'Withdrawal from LoveX',
        meta: withdrawalData.meta
      };

      const response = await fetch(`${this.baseUrl}/transfers`, {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify(payload)
      });

      const data = await response.json();

      if (data.status === 'success') {
        return {
          status: 'success',
          message: 'Withdrawal initiated successfully',
          data: data.data
        };
      } else {
        return {
          status: 'error',
          message: data.message || 'Failed to initiate withdrawal',
          data: data
        };
      }
    } catch (error: any) {
      console.error('Flutterwave withdrawal error:', error);
      return {
        status: 'error',
        message: error.message || 'Withdrawal initiation failed'
      };
    }
  }

  /**
   * Get transfer status
   */
  async getTransferStatus(transferId: string): Promise<FlutterwaveResponse> {
    try {
      const response = await fetch(`${this.baseUrl}/transfers/${transferId}`, {
        method: 'GET',
        headers: this.getHeaders()
      });

      const data = await response.json();

      if (data.status === 'success') {
        return {
          status: 'success',
          message: 'Transfer status retrieved successfully',
          data: data.data
        };
      } else {
        return {
          status: 'error',
          message: data.message || 'Failed to get transfer status',
          data: data
        };
      }
    } catch (error: any) {
      console.error('Flutterwave transfer status error:', error);
      return {
        status: 'error',
        message: error.message || 'Failed to get transfer status'
      };
    }
  }

  /**
   * Get banks for a country
   */
  async getBanks(country: string = 'RW'): Promise<FlutterwaveResponse> {
    try {
      const response = await fetch(`${this.baseUrl}/banks/${country}`, {
        method: 'GET',
        headers: this.getHeaders()
      });

      const data = await response.json();

      if (data.status === 'success') {
        return {
          status: 'success',
          message: 'Banks retrieved successfully',
          data: data.data
        };
      } else {
        return {
          status: 'error',
          message: data.message || 'Failed to retrieve banks',
          data: data
        };
      }
    } catch (error: any) {
      console.error('Flutterwave banks error:', error);
      return {
        status: 'error',
        message: error.message || 'Failed to retrieve banks'
      };
    }
  }

  /**
   * Verify bank account
   */
  async verifyAccount(accountNumber: string, bankCode: string): Promise<FlutterwaveResponse> {
    try {
      const payload = {
        account_number: accountNumber,
        account_bank: bankCode
      };

      const response = await fetch(`${this.baseUrl}/accounts/resolve`, {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify(payload)
      });

      const data = await response.json();

      if (data.status === 'success') {
        return {
          status: 'success',
          message: 'Account verified successfully',
          data: data.data
        };
      } else {
        return {
          status: 'error',
          message: data.message || 'Failed to verify account',
          data: data
        };
      }
    } catch (error: any) {
      console.error('Flutterwave account verification error:', error);
      return {
        status: 'error',
        message: error.message || 'Account verification failed'
      };
    }
  }

  /**
   * Create payment link for card payments
   */
  async createPaymentLink(paymentData: {
    amount: number;
    currency: string;
    email: string;
    fullname: string;
    tx_ref: string;
    redirect_url?: string;
  }): Promise<FlutterwaveResponse> {
    try {
      const payload = {
        title: 'LoveX - Coin Purchase',
        description: `Purchase ${paymentData.amount} ${paymentData.currency} worth of LX Coins`,
        amount: paymentData.amount,
        currency: paymentData.currency,
        redirect_url: paymentData.redirect_url || `${import.meta.env.VITE_APP_URL}/payment/callback`,
        customer: {
          email: paymentData.email,
          name: paymentData.fullname
        },
        customizations: {
          logo: `${import.meta.env.VITE_APP_URL}/favicon.ico`
        },
        meta: {
          platform: 'web',
          source: 'lovex_wallet'
        }
      };

      const response = await fetch(`${this.baseUrl}/payments`, {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify(payload)
      });

      const data = await response.json();

      if (data.status === 'success') {
        return {
          status: 'success',
          message: 'Payment link created successfully',
          data: data.data
        };
      } else {
        return {
          status: 'error',
          message: data.message || 'Failed to create payment link',
          data: data
        };
      }
    } catch (error: any) {
      console.error('Flutterwave payment link error:', error);
      return {
        status: 'error',
        message: error.message || 'Payment link creation failed'
      };
    }
  }
}

export const flutterwaveService = new FlutterwaveService();

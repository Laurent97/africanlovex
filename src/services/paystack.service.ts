export interface MobileMoneyPayment {
  amount: number;
  currency: 'RWF' | 'KES' | 'UGX' | 'TZS' | 'CDF' | 'BIF' | 'NGN' | 'GHS' | 'USD' | 'ZAR';
  phone_number: string;
  network: 'MTN' | 'AIRTEL' | 'MPESA' | 'TIGO' | 'ORANGE' | 'ECOCASH' | 'LUMICASH' | 'HALOPESA';
  email: string;
  fullname: string;
  tx_ref: string;
  country: string;
  redirect_url?: string;
  meta?: Record<string, unknown>;
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

export interface PaystackResponse {
  status: 'success' | 'error';
  message: string;
  data?: unknown;
}

interface PaystackInitData {
  authorization_url: string;
  access_code: string;
  reference: string;
}

interface PaystackVerifyData {
  status: 'success' | 'abandoned' | 'failed' | 'reversed';
  reference: string;
  amount: number;
  currency: string;
  paid_at?: string;
  channel?: string;
}

class PaystackService {
  private baseUrl = 'https://api.paystack.co';
  private secretKey: string;
  private publicKey: string;
  private targetCurrency: string;

  // Approximate rates from 1 USD for testing. Replace with live rates in production.
  private exchangeRates: Record<string, number> = {
    USD: 1,
    NGN: 1550,
    KES: 130,
    GHS: 15,
    ZAR: 18,
    RWF: 1300,
    UGX: 3700,
    TZS: 2600,
    BIF: 2860,
    CDF: 2800
  };

  constructor() {
    this.secretKey = import.meta.env.PAYSTACK_SECRET_KEY || '';
    this.publicKey = import.meta.env.VITE_PAYSTACK_PUBLIC_KEY || '';
    this.targetCurrency = import.meta.env.VITE_PAYSTACK_CURRENCY || 'NGN';
  }

  private getHeaders() {
    return {
      Authorization: `Bearer ${this.secretKey}`,
      'Content-Type': 'application/json'
    };
  }

  /**
   * Convert a display amount to the merchant's supported Paystack currency and subunit
   */
  private toPaystackCurrency(amount: number, fromCurrency: string): { amount: number; currency: string } {
    const sourceRate = this.exchangeRates[fromCurrency.toUpperCase()];
    const targetRate = this.exchangeRates[this.targetCurrency];

    if (!sourceRate || !targetRate) {
      console.warn(`Exchange rate missing for ${fromCurrency} or ${this.targetCurrency}. Proceeding with original values.`);
      return { amount, currency: fromCurrency };
    }

    // Convert display currency -> USD -> target Paystack currency
    const inUsd = amount / sourceRate;
    const converted = Math.round(inUsd * targetRate);
    return { amount: converted, currency: this.targetCurrency };
  }

  /**
   * Convert amount to the smallest currency unit Paystack expects (kobo/pesewas/cents)
   */
  private toPaystackAmount(amount: number, currency: string): number {
    const subunitCurrencies = ['NGN', 'GHS', 'ZAR', 'KES', 'USD'];
    if (subunitCurrencies.includes(currency.toUpperCase())) {
      return Math.round(amount * 100);
    }
    console.warn(`Currency ${currency} may not be supported by Paystack. Amount sent as-is.`);
    return Math.round(amount);
  }

  /**
   * Map payment method/network to Paystack channels
   */
  private getChannels(_network: string, paymentMethod: 'mobile_money' | 'card' = 'mobile_money'): string[] {
    if (paymentMethod === 'card') return ['card'];

    // Paystack test accounts do not have mobile money enabled by default.
    // Fall back to card so development testing can still complete.
    if (this.secretKey.startsWith('sk_test_')) {
      console.warn('Paystack test key detected: using card channel. Enable mobile_money in your Paystack dashboard for live mobile-money transactions.');
      return ['card'];
    }

    // Paystack mobile money channel covers Ghana/Kenya mobile money wallets
    return ['mobile_money'];
  }

  /**
   * Initialize a transaction (used for both card and mobile money)
   */
  async initializeTransaction(options: {
    amount: number;
    currency: string;
    email: string;
    reference: string;
    channels?: string[];
    callback_url?: string;
    metadata?: Record<string, unknown>;
  }): Promise<PaystackResponse> {
    if (!this.secretKey) {
      return { status: 'error', message: 'Paystack secret key is not configured' };
    }

    try {
      const paystackPrice = this.toPaystackCurrency(options.amount, options.currency);
      const paystackAmount = this.toPaystackAmount(paystackPrice.amount, paystackPrice.currency);

      const callbackUrl = options.callback_url || (typeof window !== 'undefined' ? `${window.location.origin}/payment/callback` : '');

      const body: Record<string, unknown> = {
        email: options.email,
        amount: paystackAmount,
        reference: options.reference,
        currency: paystackPrice.currency.toUpperCase(),
        channels: options.channels || this.getChannels('', 'card'),
        metadata: {
          ...(options.metadata || {}),
          original_amount: options.amount,
          original_currency: options.currency,
          paystack_amount: paystackPrice.amount,
          paystack_currency: paystackPrice.currency
        },
        callback_url: callbackUrl
      };

      const response = await fetch(`${this.baseUrl}/transaction/initialize`, {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify(body)
      });

      const result = await response.json();

      if (!response.ok || !result.status) {
        return {
          status: 'error',
          message: result.message || 'Paystack initialization failed'
        };
      }

      const initData = result.data as PaystackInitData;
      return {
        status: 'success',
        message: 'Payment initialized successfully',
        data: {
          authorization_url: initData.authorization_url,
          reference: initData.reference,
          access_code: initData.access_code,
          transaction_id: initData.reference
        }
      };
    } catch (error: unknown) {
      return {
        status: 'error',
        message: error instanceof Error ? error.message : 'Paystack initialization failed'
      };
    }
  }

  /**
   * Initialize mobile money payment
   */
  async initiateMobileMoneyPayment(paymentData: MobileMoneyPayment): Promise<PaystackResponse> {
    const channels = this.getChannels(paymentData.network, 'mobile_money');

    return this.initializeTransaction({
      amount: paymentData.amount,
      currency: paymentData.currency,
      email: paymentData.email,
      reference: paymentData.tx_ref,
      channels,
      callback_url: paymentData.redirect_url,
      metadata: {
        phone_number: paymentData.phone_number,
        network: paymentData.network,
        country: paymentData.country,
        fullname: paymentData.fullname,
        ...paymentData.meta
      }
    });
  }

  /**
   * Create a card payment link / authorization
   */
  async createPaymentLink(options: {
    amount: number;
    currency: string;
    email: string;
    fullname: string;
    tx_ref: string;
  }): Promise<PaystackResponse> {
    return this.initializeTransaction({
      amount: options.amount,
      currency: options.currency,
      email: options.email,
      reference: options.tx_ref,
      channels: ['card'],
      metadata: {
        fullname: options.fullname
      }
    });
  }

  /**
   * Verify a transaction by reference
   */
  async verifyTransaction(reference: string): Promise<PaystackResponse> {
    if (!this.secretKey) {
      return { status: 'error', message: 'Paystack secret key is not configured' };
    }

    try {
      const response = await fetch(`${this.baseUrl}/transaction/verify/${encodeURIComponent(reference)}`, {
        method: 'GET',
        headers: this.getHeaders()
      });

      const result = await response.json();

      if (!response.ok || !result.status) {
        return {
          status: 'error',
          message: result.message || 'Paystack verification failed'
        };
      }

      const verifyData = result.data as PaystackVerifyData;
      return {
        status: 'success',
        message: 'Transaction verified',
        data: {
          status: verifyData.status,
          reference: verifyData.reference,
          transaction_id: verifyData.reference,
          amount: verifyData.amount,
          currency: verifyData.currency,
          channel: verifyData.channel,
          paid_at: verifyData.paid_at
        }
      };
    } catch (error: unknown) {
      return {
        status: 'error',
        message: error instanceof Error ? error.message : 'Paystack verification failed'
      };
    }
  }

  /**
   * Initialize withdrawal (Paystack transfer). Stub for test mode.
   */
  async initiateWithdrawal(withdrawalData: WithdrawalData): Promise<PaystackResponse> {
    if (!this.secretKey) {
      return { status: 'error', message: 'Paystack secret key is not configured' };
    }

    try {
      // For test keys, Paystack transfers may not be enabled. Return a simulated success.
      console.warn('Paystack withdrawals are not fully implemented; returning test success.', withdrawalData);
      return {
        status: 'success',
        message: 'Withdrawal request received (test mode)',
        data: {
          reference: withdrawalData.reference,
          status: 'pending'
        }
      };
    } catch (error: unknown) {
      return {
        status: 'error',
        message: error instanceof Error ? error.message : 'Withdrawal initiation failed'
      };
    }
  }

  /**
   * Get transfer status. Stub for test mode.
   */
  async getTransferStatus(transferId: string): Promise<PaystackResponse> {
    return {
      status: 'success',
      message: 'Transfer status retrieved (test mode)',
      data: { reference: transferId, status: 'success' }
    };
  }

  /**
   * Verify account number. Stub for test mode.
   */
  async verifyAccount(_accountNumber: string, _bankCode: string): Promise<PaystackResponse> {
    return {
      status: 'success',
      message: 'Account verified (test mode)',
      data: { account_name: 'Test Account' }
    };
  }
}

export const paystackService = new PaystackService();

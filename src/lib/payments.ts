import { supabase } from './supabase'
import type { Database } from './supabase'

type CoinTransaction = Database['public']['Tables']['coin_transactions']['Row']
type Subscription = Database['public']['Tables']['subscriptions']['Row']

export interface PaymentMethod {
  id: string
  type: 'mobile_money' | 'card' | 'crypto'
  provider: string
  country: string
  currency: string
  name: string
  icon: string
  enabled: boolean
  config?: {
    consumer_key?: string
    api_key?: string
    webhook_url?: string
    merchant_id?: string
    consumer_secret?: string
  }
}

export interface PaymentRequest {
  amount: number
  currency: string
  payment_method_id: string
  user_id: string
  description: string
  reference_id?: string
  metadata?: Record<string, any>
}

export interface PaymentResult {
  success: boolean
  transaction_id?: string
  reference?: string
  status?: string
  message?: string
  provider_response?: any
}

// East African payment methods configuration
export const EAST_AFRICAN_PAYMENT_METHODS: PaymentMethod[] = [
  // Rwanda
  {
    id: 'mtn_momo_rw',
    type: 'mobile_money',
    provider: 'MTN',
    country: 'RW',
    currency: 'RWF',
    name: 'MTN Mobile Money',
    icon: '📱',
    enabled: true,
    config: {
      consumer_key: process.env.VITE_MTN_RW_CONSUMER_KEY,
      api_key: process.env.VITE_MTN_RW_API_KEY
    }
  },
  {
    id: 'airtel_money_rw',
    type: 'mobile_money',
    provider: 'Airtel',
    country: 'RW',
    currency: 'RWF',
    name: 'Airtel Money',
    icon: '📱',
    enabled: true,
    config: {
      consumer_key: process.env.VITE_AIRTEL_RW_CONSUMER_KEY,
      api_key: process.env.VITE_AIRTEL_RW_API_KEY
    }
  },
  
  // Kenya
  {
    id: 'mpesa_ke',
    type: 'mobile_money',
    provider: 'Safaricom',
    country: 'KE',
    currency: 'KES',
    name: 'M-Pesa',
    icon: '📱',
    enabled: true,
    config: {
      consumer_key: process.env.VITE_MPESA_CONSUMER_KEY,
      consumer_secret: process.env.VITE_MPESA_CONSUMER_SECRET
    }
  },
  {
    id: 'airtel_money_ke',
    type: 'mobile_money',
    provider: 'Airtel',
    country: 'KE',
    currency: 'KES',
    name: 'Airtel Money',
    icon: '📱',
    enabled: true
  },
  {
    id: 'tkash_ke',
    type: 'mobile_money',
    provider: 'Telkom',
    country: 'KE',
    currency: 'KES',
    name: 'T-Kash',
    icon: '📱',
    enabled: true
  },
  
  // Uganda
  {
    id: 'mtn_momo_ug',
    type: 'mobile_money',
    provider: 'MTN',
    country: 'UG',
    currency: 'UGX',
    name: 'MTN Mobile Money',
    icon: '📱',
    enabled: true,
    config: {
      consumer_key: process.env.VITE_MTN_UG_CONSUMER_KEY,
      api_key: process.env.VITE_MTN_UG_API_KEY
    }
  },
  {
    id: 'airtel_money_ug',
    type: 'mobile_money',
    provider: 'Airtel',
    country: 'UG',
    currency: 'UGX',
    name: 'Airtel Money',
    icon: '📱',
    enabled: true
  },
  
  // Tanzania
  {
    id: 'mpesa_tz',
    type: 'mobile_money',
    provider: 'Vodacom',
    country: 'TZ',
    currency: 'TZS',
    name: 'M-Pesa',
    icon: '📱',
    enabled: true
  },
  {
    id: 'tigo_pesa_tz',
    type: 'mobile_money',
    provider: 'Tigo',
    country: 'TZ',
    currency: 'TZS',
    name: 'Tigo Pesa',
    icon: '📱',
    enabled: true
  },
  {
    id: 'airtel_money_tz',
    type: 'mobile_money',
    provider: 'Airtel',
    country: 'TZ',
    currency: 'TZS',
    name: 'Airtel Money',
    icon: '📱',
    enabled: true
  },
  {
    id: 'halopesa_tz',
    type: 'mobile_money',
    provider: 'Halotel',
    country: 'TZ',
    currency: 'TZS',
    name: 'Halopesa',
    icon: '📱',
    enabled: true
  },
  
  // Burundi
  {
    id: 'lumicash_bi',
    type: 'mobile_money',
    provider: 'Lumicash',
    country: 'BI',
    currency: 'BIF',
    name: 'Lumicash',
    icon: '📱',
    enabled: true
  },
  {
    id: 'ecocash_bi',
    type: 'mobile_money',
    provider: 'EcoCash',
    country: 'BI',
    currency: 'BIF',
    name: 'EcoCash',
    icon: '📱',
    enabled: true
  },
  {
    id: 'mpesa_bi',
    type: 'mobile_money',
    provider: 'Econet',
    country: 'BI',
    currency: 'BIF',
    name: 'M-Pesa',
    icon: '📱',
    enabled: true
  },
  
  // Congo (DRC)
  {
    id: 'mpesa_cd',
    type: 'mobile_money',
    provider: 'Vodacom',
    country: 'CD',
    currency: 'CDF',
    name: 'M-Pesa',
    icon: '📱',
    enabled: true
  },
  {
    id: 'airtel_money_cd',
    type: 'mobile_money',
    provider: 'Airtel',
    country: 'CD',
    currency: 'CDF',
    name: 'Airtel Money',
    icon: '📱',
    enabled: true
  },
  {
    id: 'orange_money_cd',
    type: 'mobile_money',
    provider: 'Orange',
    country: 'CD',
    currency: 'CDF',
    name: 'Orange Money',
    icon: '📱',
    enabled: true
  },
  {
    id: 'africash_cd',
    type: 'mobile_money',
    provider: 'Africash',
    country: 'CD',
    currency: 'CDF',
    name: 'AfriCash',
    icon: '📱',
    enabled: true
  },
  
  // Card payments (region-wide)
  {
    id: 'stripe_card',
    type: 'card',
    provider: 'Stripe',
    country: 'REGION',
    currency: 'USD',
    name: 'Credit/Debit Card',
    icon: '💳',
    enabled: true,
    config: {
      webhook_url: process.env.VITE_STRIPE_WEBHOOK_URL
    }
  },
  
  // Cryptocurrency (region-wide)
  {
    id: 'bitcoin_lightning',
    type: 'crypto',
    provider: 'Bitcoin',
    country: 'REGION',
    currency: 'BTC',
    name: 'Bitcoin (Lightning)',
    icon: '₿',
    enabled: true
  },
  {
    id: 'usdt_trc20',
    type: 'crypto',
    provider: 'TRON',
    country: 'REGION',
    currency: 'USDT',
    name: 'USDT (TRC-20)',
    icon: '₮',
    enabled: true
  }
]

// Get payment methods by country
export const getPaymentMethodsByCountry = (country: string): PaymentMethod[] => {
  return EAST_AFRICAN_PAYMENT_METHODS.filter(method => 
    method.enabled && (method.country === country || method.country === 'REGION')
  )
}

// Get payment method by ID
export const getPaymentMethodById = (id: string): PaymentMethod | null => {
  return EAST_AFRICAN_PAYMENT_METHODS.find(method => method.id === id) || null
}

// Process mobile money payment
export const processMobileMoneyPayment = async (
  paymentRequest: PaymentRequest
): Promise<PaymentResult> => {
  const paymentMethod = getPaymentMethodById(paymentRequest.payment_method_id)
  if (!paymentMethod || paymentMethod.type !== 'mobile_money') {
    return { success: false, message: 'Invalid payment method' }
  }

  try {
    switch (paymentMethod.provider) {
      case 'MTN':
        return await processMTNPayment(paymentRequest, paymentMethod)
      case 'Safaricom':
        return await processMpesaPayment(paymentRequest, paymentMethod)
      case 'Airtel':
        return await processAirtelPayment(paymentRequest, paymentMethod)
      case 'Vodacom':
        return await processVodacomPayment(paymentRequest, paymentMethod)
      case 'Tigo':
        return await processTigoPayment(paymentRequest, paymentMethod)
      case 'Halotel':
        return await processHalotelPayment(paymentRequest, paymentMethod)
      case 'Lumicash':
        return await processLumicashPayment(paymentRequest, paymentMethod)
      case 'EcoCash':
        return await processEcoCashPayment(paymentRequest, paymentMethod)
      case 'Econet':
        return await processEconetPayment(paymentRequest, paymentMethod)
      case 'Orange':
        return await processOrangePayment(paymentRequest, paymentMethod)
      case 'Africash':
        return await processAfricashPayment(paymentRequest, paymentMethod)
      case 'Telkom':
        return await processTelkomPayment(paymentRequest, paymentMethod)
      default:
        return { success: false, message: 'Unsupported provider' }
    }
  } catch (error: any) {
    return { success: false, message: error.message }
  }
}

// MTN Mobile Money (Rwanda, Uganda, Congo)
const processMTNPayment = async (
  paymentRequest: PaymentRequest,
  paymentMethod: PaymentMethod
): Promise<PaymentResult> => {
  // In a real implementation, this would integrate with MTN MoMo API
  // For now, we'll simulate the process
  
  const transactionId = `MTN_${Date.now()}`
  
  // Record the transaction
  await supabase
    .from('payment_transactions')
    .insert({
      user_id: paymentRequest.user_id,
      amount: paymentRequest.amount,
      currency: paymentRequest.currency,
      payment_method_id: paymentRequest.payment_method_id,
      provider: paymentMethod.provider,
      transaction_id: transactionId,
      status: 'pending',
      description: paymentRequest.description,
      reference_id: paymentRequest.reference_id,
      metadata: paymentRequest.metadata
    })

  // Simulate API call
  await new Promise(resolve => setTimeout(resolve, 2000))

  // Update transaction status
  await supabase
    .from('payment_transactions')
    .update({
      status: 'completed',
      provider_response: { simulated: true }
    })
    .eq('transaction_id', transactionId)

  return {
    success: true,
    transaction_id: transactionId,
    status: 'completed',
    message: 'Payment processed successfully'
  }
}

// M-Pesa (Kenya, Tanzania, Burundi, Congo)
const processMpesaPayment = async (
  paymentRequest: PaymentRequest,
  paymentMethod: PaymentMethod
): Promise<PaymentResult> => {
  // In a real implementation, this would integrate with M-Pesa API
  const transactionId = `MPESA_${Date.now()}`
  
  await supabase
    .from('payment_transactions')
    .insert({
      user_id: paymentRequest.user_id,
      amount: paymentRequest.amount,
      currency: paymentRequest.currency,
      payment_method_id: paymentRequest.payment_method_id,
      provider: paymentMethod.provider,
      transaction_id: transactionId,
      status: 'pending',
      description: paymentRequest.description,
      reference_id: paymentRequest.reference_id,
      metadata: paymentRequest.metadata
    })

  // Simulate STK push
  await new Promise(resolve => setTimeout(resolve, 3000))

  await supabase
    .from('payment_transactions')
    .update({
      status: 'completed',
      provider_response: { stk_push: true }
    })
    .eq('transaction_id', transactionId)

  return {
    success: true,
    transaction_id: transactionId,
    status: 'completed',
    message: 'M-Pesa payment processed successfully'
  }
}

// Airtel Money (All countries)
const processAirtelPayment = async (
  paymentRequest: PaymentRequest,
  paymentMethod: PaymentMethod
): Promise<PaymentResult> => {
  const transactionId = `AIRTEL_${Date.now()}`
  
  await supabase
    .from('payment_transactions')
    .insert({
      user_id: paymentRequest.user_id,
      amount: paymentRequest.amount,
      currency: paymentRequest.currency,
      payment_method_id: paymentRequest.payment_method_id,
      provider: paymentMethod.provider,
      transaction_id: transactionId,
      status: 'pending',
      description: paymentRequest.description,
      reference_id: paymentRequest.reference_id,
      metadata: paymentRequest.metadata
    })

  await new Promise(resolve => setTimeout(resolve, 2500))

  await supabase
    .from('payment_transactions')
    .update({
      status: 'completed',
      provider_response: { airtel_money: true }
    })
    .eq('transaction_id', transactionId)

  return {
    success: true,
    transaction_id: transactionId,
    status: 'completed',
    message: 'Airtel Money payment processed successfully'
  }
}

// Placeholder functions for other providers
const processVodacomPayment = async (paymentRequest: PaymentRequest, paymentMethod: PaymentMethod) => {
  const transactionId = `VODACOM_${Date.now()}`
  // Similar implementation
  return { success: true, transaction_id: transactionId, status: 'completed' }
}

const processTigoPayment = async (paymentRequest: PaymentRequest, paymentMethod: PaymentMethod) => {
  const transactionId = `TIGO_${Date.now()}`
  // Similar implementation
  return { success: true, transaction_id: transactionId, status: 'completed' }
}

const processHalotelPayment = async (paymentRequest: PaymentRequest, paymentMethod: PaymentMethod) => {
  const transactionId = `HALOTEL_${Date.now()}`
  // Similar implementation
  return { success: true, transaction_id: transactionId, status: 'completed' }
}

const processLumicashPayment = async (paymentRequest: PaymentRequest, paymentMethod: PaymentMethod) => {
  const transactionId = `LUMICASH_${Date.now()}`
  // Similar implementation
  return { success: true, transaction_id: transactionId, status: 'completed' }
}

const processEcoCashPayment = async (paymentRequest: PaymentRequest, paymentMethod: PaymentMethod) => {
  const transactionId = `ECOCASH_${Date.now()}`
  // Similar implementation
  return { success: true, transaction_id: transactionId, status: 'completed' }
}

const processEconetPayment = async (paymentRequest: PaymentRequest, paymentMethod: PaymentMethod) => {
  const transactionId = `ECONET_${Date.now()}`
  // Similar implementation
  return { success: true, transaction_id: transactionId, status: 'completed' }
}

const processOrangePayment = async (paymentRequest: PaymentRequest, paymentMethod: PaymentMethod) => {
  const transactionId = `ORANGE_${Date.now()}`
  // Similar implementation
  return { success: true, transaction_id: transactionId, status: 'completed' }
}

const processAfricashPayment = async (paymentRequest: PaymentRequest, paymentMethod: PaymentMethod) => {
  const transactionId = 'AFRICASH_${Date.now()}'
  // Similar implementation
  return { success: true, transaction_id: transactionId, status: 'completed' }
}

const processTelkomPayment = async (paymentRequest: PaymentRequest, paymentMethod: PaymentMethod) => {
  const transactionId = `TELKOM_${Date.now()}`
  // Similar implementation
  return { success: true, transaction_id: transactionId, status: 'completed' }
}

// Process card payment via Stripe
export const processCardPayment = async (
  paymentRequest: PaymentRequest,
  stripeToken: string
): Promise<PaymentResult> => {
  // In a real implementation, this would use Stripe SDK
  const transactionId = `STRIPE_${Date.now()}`
  
  await supabase
    .from('payment_transactions')
    .insert({
      user_id: paymentRequest.user_id,
      amount: paymentRequest.amount,
      currency: paymentRequest.currency,
      payment_method_id: paymentRequest.payment_method_id,
      provider: 'Stripe',
      transaction_id: transactionId,
      status: 'pending',
      description: paymentRequest.description,
      reference_id: paymentRequest.reference_id,
      metadata: { stripe_token: stripeToken }
    })

  // Simulate Stripe payment processing
  await new Promise(resolve => setTimeout(resolve, 3000))

  await supabase
    .from('payment_transactions')
    .update({
      status: 'completed',
      provider_response: { stripe_payment_intent_id: `pi_${transactionId}` }
    })
    .eq('transaction_id', transactionId)

  return {
    success: true,
    transaction_id: transactionId,
    status: 'completed',
    message: 'Card payment processed successfully'
  }
}

// Process cryptocurrency payment
export const processCryptoPayment = async (
  paymentRequest: PaymentRequest,
  cryptoType: 'bitcoin' | 'usdt',
  walletAddress: string
): Promise<PaymentResult> => {
  const transactionId = `CRYPTO_${Date.now()}_${cryptoType.toUpperCase()}`
  
  await supabase
    .from('payment_transactions')
    .insert({
      user_id: paymentRequest.user_id,
      amount: paymentRequest.amount,
      currency: paymentRequest.currency,
      payment_method_id: paymentRequest.payment_method_id,
      provider: cryptoType.toUpperCase(),
      transaction_id: transactionId,
      status: 'pending',
      description: paymentRequest.description,
      reference_id: paymentRequest.reference_id,
      metadata: { 
        crypto_type: cryptoType,
        wallet_address: walletAddress
      }
    })

  // In a real implementation, this would:
  // 1. Generate payment address
  // 2. Monitor blockchain for payment
  // 3. Confirm payment when detected
  
  return {
    success: true,
    transaction_id: transactionId,
    status: 'pending',
    message: `Please send ${paymentRequest.amount} ${cryptoType.toUpperCase()} to ${walletAddress}`
  }
}

// Purchase LoveX Coins
export const purchaseCoins = async (
  userId: string,
  amount: number,
  paymentMethodId: string,
  country: string
): Promise<PaymentResult> => {
  const paymentMethod = getPaymentMethodsByCountry(country).find(pm => pm.id === paymentMethodId)
  if (!paymentMethod) {
    return { success: false, message: 'Payment method not available in your country' }
  }

  const coinPackage = getCoinPackage(amount)
  const price = coinPackage.price

  const paymentRequest: PaymentRequest = {
    amount: price,
    currency: paymentMethod.currency,
    payment_method_id: paymentMethodId,
    user_id: userId,
    description: `Purchase ${amount} LoveX Coins`,
    reference_id: `coins_${amount}_${Date.now()}`,
    metadata: {
      coin_amount: amount,
      package_type: coinPackage.type
    }
  }

  let paymentResult: PaymentResult

  if (paymentMethod.type === 'mobile_money') {
    paymentResult = await processMobileMoneyPayment(paymentRequest)
  } else if (paymentMethod.type === 'card') {
    // Would need stripe token from frontend
    return { success: false, message: 'Card payment requires stripe token' }
  } else if (paymentMethod.type === 'crypto') {
    return { success: false, message: 'Crypto payment requires wallet address' }
  } else {
    return { success: false, message: 'Unsupported payment type' }
  }

  // If payment successful, add coins to user balance
  if (paymentResult.success) {
    await supabase.rpc('update_coins_balance', {
      user_uuid: userId,
      amount_change: amount
    })

    await supabase
      .from('coin_transactions')
      .insert({
        user_id: userId,
        amount: amount,
        transaction_type: 'purchase',
        description: `Purchased ${amount} LoveX Coins via ${paymentMethod.provider}`,
        reference_id: paymentResult.transaction_id
      })
  }

  return paymentResult
}

// Get coin packages
export const getCoinPackages = () => [
  { amount: 100, price: 1.00, bonus: 0, type: 'starter' },
  { amount: 500, price: 4.50, bonus: 50, type: 'popular' }, // 550 coins for $4.50
  { amount: 1000, price: 8.00, bonus: 200, type: 'value' }, // 1200 coins for $8.00
  { amount: 2500, price: 18.00, bonus: 750, type: 'premium' }, // 3250 coins for $18.00
  { amount: 5000, price: 35.00, bonus: 1500, type: 'vip' } // 6500 coins for $35.00
]

const getCoinPackage = (amount: number) => {
  const packages = getCoinPackages()
  return packages.find(pkg => pkg.amount === amount) || { amount, price: amount / 100, bonus: 0, type: 'custom' }
}

// Get payment history
export const getPaymentHistory = async (
  userId: string,
  limit: number = 50
): Promise<any[]> => {
  const { data, error } = await supabase
    .from('payment_transactions')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(limit)

  if (error) throw error
  return data || []
}

// Handle payment webhook (for mobile money providers)
export const handlePaymentWebhook = async (
  provider: string,
  transactionId: string,
  status: string,
  metadata: any = {}
): Promise<void> => {
  // Update transaction status
  await supabase
    .from('payment_transactions')
    .update({
      status: status.toLowerCase(),
      provider_response: metadata,
      updated_at: new Date().toISOString()
    })
    .eq('transaction_id', transactionId)

  // If payment is successful, process the order
  if (status.toLowerCase() === 'completed') {
    const { data: transaction } = await supabase
      .from('payment_transactions')
      .select('*')
      .eq('transaction_id', transactionId)
      .single()

    if (transaction && transaction.metadata?.coin_amount) {
      // Add coins to user
      await supabase.rpc('update_coins_balance', {
        user_uuid: transaction.user_id,
        amount_change: transaction.metadata.coin_amount
      })

      await supabase
        .from('coin_transactions')
        .insert({
          user_id: transaction.user_id,
          amount: transaction.metadata.coin_amount,
          transaction_type: 'purchase',
          description: `Purchased LoveX Coins via ${provider}`,
          reference_id: transactionId
        })
    }
  }
}

// Validate phone number for mobile money
export const validatePhoneNumber = (
  phone: string,
  country: string
): { valid: boolean; formatted?: string; error?: string } => {
  const patterns = {
    RW: /^(\+250|0)?7[238]\d{7}$/,
    KE: /^(\+254|0)?[17]\d{8}$/,
    UG: /^(\+256|0)?[37]\d{8}$/,
    TZ: /^(\+255|0)?[67]\d{8}$/,
    BI: /^(\+257|0)?[29]\d{7}$/,
    CD: /^(\+243|0)?[89]\d{8}$/
  }

  const pattern = patterns[country as keyof typeof patterns]
  if (!pattern) {
    return { valid: false, error: 'Unsupported country' }
  }

  if (!pattern.test(phone)) {
    return { valid: false, error: 'Invalid phone number format' }
  }

  // Format phone number
  const cleaned = phone.replace(/\D/g, '')
  let formatted = cleaned

  if (country === 'RW' && !cleaned.startsWith('+250')) {
    formatted = '+250' + (cleaned.startsWith('0') ? cleaned.slice(1) : cleaned)
  } else if (country === 'KE' && !cleaned.startsWith('+254')) {
    formatted = '+254' + (cleaned.startsWith('0') ? cleaned.slice(1) : cleaned)
  } else if (country === 'UG' && !cleaned.startsWith('+256')) {
    formatted = '+256' + (cleaned.startsWith('0') ? cleaned.slice(1) : cleaned)
  }
  // Add similar formatting for other countries...

  return { valid: true, formatted }
}

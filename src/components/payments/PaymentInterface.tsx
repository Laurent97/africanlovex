import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  CreditCard, 
  Smartphone, 
  Bitcoin, 
  Coins, 
  CheckCircle, 
  AlertCircle,
  Loader2,
  Gift,
  Crown
} from 'lucide-react'
import { 
  purchaseCoins, 
  getPaymentMethodsByCountry, 
  getCoinPackages,
  validatePhoneNumber,
  handlePaymentWebhook
} from '@/lib/payments'
import { getCurrentUser } from '@/lib/auth'

interface PaymentInterfaceProps {
  onPaymentComplete?: (result: any) => void
  onCancel?: () => void
  defaultAmount?: number
  defaultType?: 'coins' | 'subscription'
}

export const PaymentInterface: React.FC<PaymentInterfaceProps> = ({
  onPaymentComplete,
  onCancel,
  defaultAmount = 500,
  defaultType = 'coins'
}) => {
  const [paymentType, setPaymentType] = useState<'coins' | 'subscription'>(defaultType)
  const [selectedCountry, setSelectedCountry] = useState('RW')
  const [selectedAmount, setSelectedAmount] = useState(defaultAmount)
  const [selectedPackage, setSelectedPackage] = useState(defaultAmount)
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState('')
  const [phoneNumber, setPhoneNumber] = useState('')
  const [stripeToken, setStripeToken] = useState('')
  const [cryptoAddress, setCryptoAddress] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [paymentStep, setPaymentStep] = useState<'method' | 'details' | 'processing' | 'complete'>('method')

  const coinPackages = getCoinPackages()
  const availablePaymentMethods = getPaymentMethodsByCountry(selectedCountry)

  const subscriptionTiers = [
    {
      id: 'basic',
      name: 'LoveX Basic',
      price: 4.99,
      currency: 'USD',
      features: ['Unlimited swipes', 'See who liked you', '1 free boost/week', 'Send voice messages', 'No ads'],
      icon: '🌟'
    },
    {
      id: 'premium',
      name: 'LoveX Premium',
      price: 9.99,
      currency: 'USD',
      features: ['All Basic features', 'Unlimited rewind', '5 boosts/week', 'See read receipts', 'Priority support', 'Exclusive gifts'],
      icon: '💎'
    },
    {
      id: 'platinum',
      name: 'LoveX Platinum',
      price: 19.99,
      currency: 'USD',
      features: ['All Premium features', 'VIP badge', 'Top search ranking', 'Private mode', '500 bonus coins/month', 'Exclusive events'],
      icon: '👑'
    },
    {
      id: 'diamond',
      name: 'LoveX Diamond',
      price: 49.99,
      currency: 'USD',
      features: ['All Platinum features', 'Personal matchmaker', 'Real gift concierge', 'Featured profile', 'VIP mixers'],
      icon: '💍'
    }
  ]

  useEffect(() => {
    // Load Stripe.js if needed
    // Stripe integration would be initialized here
  }, [])

  const handlePayment = async () => {
    setLoading(true)
    setError('')
    setSuccess('')

    try {
      const user = await getCurrentUser()
      if (!user) {
        setError('You must be logged in to make payments')
        return
      }

      setPaymentStep('processing')

      let result

      if (paymentType === 'coins') {
        result = await purchaseCoins(user.id, selectedAmount, selectedPaymentMethod, selectedCountry)
      } else {
        // Handle subscription payment
        result = await processSubscription(user.id, selectedPaymentMethod, selectedCountry)
      }

      if (result.success) {
        setPaymentStep('complete')
        setSuccess('Payment processed successfully!')
        onPaymentComplete?.(result)
      } else {
        setError(result.message || 'Payment failed')
        setPaymentStep('method')
      }
    } catch (error: any) {
      setError(error.message)
      setPaymentStep('method')
    } finally {
      setLoading(false)
    }
  }

  const processSubscription = async (userId: string, paymentMethodId: string, country: string) => {
    // This would integrate with subscription management
    const subscription = subscriptionTiers.find(t => t.price === selectedPackage)
    if (!subscription) throw new Error('Invalid subscription tier')

    // Simulate subscription processing
    return {
      success: true,
      transaction_id: `SUB_${Date.now()}`,
      message: 'Subscription activated successfully'
    }
  }

  const validatePaymentDetails = () => {
    const paymentMethod = availablePaymentMethods.find(pm => pm.id === selectedPaymentMethod)
    if (!paymentMethod) return false

    if (paymentMethod.type === 'mobile_money') {
      const validation = validatePhoneNumber(phoneNumber, selectedCountry)
      if (!validation.valid) {
        setError(validation.error || 'Invalid phone number')
        return false
      }
    }

    if (paymentMethod.type === 'card' && !stripeToken) {
      setError('Please provide card details')
      return false
    }

    if (paymentMethod.type === 'crypto' && !cryptoAddress) {
      setError('Please provide crypto wallet address')
      return false
    }

    return true
  }

  const getPaymentMethodIcon = (type: string) => {
    switch (type) {
      case 'mobile_money': return <Smartphone className="w-5 h-5" />
      case 'card': return <CreditCard className="w-5 h-5" />
      case 'crypto': return <Bitcoin className="w-5 h-5" />
      default: return <Coins className="w-5 h-5" />
    }
  }

  const formatPrice = (price: number, currency: string) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency
    }).format(price)
  }

  const countries = [
    { code: 'RW', name: 'Rwanda 🇷🇼', flag: '🇷🇼' },
    { code: 'KE', name: 'Kenya 🇰🇪', flag: '🇰🇪' },
    { code: 'UG', name: 'Uganda 🇺🇬', flag: '🇺🇬' },
    { code: 'TZ', name: 'Tanzania 🇹🇿', flag: '🇹🇿' },
    { code: 'BI', name: 'Burundi 🇧🇮', flag: '🇧🇮' },
    { code: 'CD', name: 'Congo 🇨🇩', flag: '🇨🇩' }
  ]

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Coins className="w-6 h-6 mr-2 text-love-red" />
            {paymentType === 'coins' ? 'Purchase LoveX Coins' : 'Upgrade to VIP'}
          </CardTitle>
        </CardHeader>
      </Card>

      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {success && (
        <Alert>
          <AlertDescription className="flex items-center">
            <CheckCircle className="w-4 h-4 mr-2 text-green-500" />
            {success}
          </AlertDescription>
        </Alert>
      )}

      {paymentStep === 'complete' ? (
        <Card>
          <CardContent className="p-8 text-center">
            <CheckCircle className="w-16 h-16 mx-auto mb-4 text-green-500" />
            <h2 className="text-2xl font-bold mb-2">Payment Complete!</h2>
            <p className="text-muted-foreground mb-4">
              {paymentType === 'coins' 
                ? `Your ${selectedAmount} LoveX Coins have been added to your account.`
                : 'Your subscription has been activated successfully.'
              }
            </p>
            <Button onClick={onCancel} className="w-full">
              Continue
            </Button>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Payment Type Selection */}
          <Card>
            <CardHeader>
              <CardTitle>What would you like to purchase?</CardTitle>
            </CardHeader>
            <CardContent>
              <RadioGroup value={paymentType} onValueChange={(value: any) => setPaymentType(value)}>
                <div className="grid grid-cols-2 gap-4">
                  <Label htmlFor="coins" className="flex items-center space-x-3 cursor-pointer">
                    <RadioGroupItem value="coins" id="coins" />
                    <div className="flex-1">
                      <div className="font-medium">LoveX Coins</div>
                      <div className="text-sm text-muted-foreground">Send gifts and unlock premium features</div>
                    </div>
                    <Coins className="w-8 h-8 text-love-red" />
                  </Label>
                  
                  <Label htmlFor="subscription" className="flex items-center space-x-3 cursor-pointer">
                    <RadioGroupItem value="subscription" id="subscription" />
                    <div className="flex-1">
                      <div className="font-medium">VIP Subscription</div>
                      <div className="text-sm text-muted-foreground">Get unlimited access to all features</div>
                    </div>
                    <Crown className="w-8 h-8 text-love-gold" />
                  </Label>
                </div>
              </RadioGroup>
            </CardContent>
          </Card>

          {/* Country Selection */}
          <Card>
            <CardHeader>
              <CardTitle>Select Your Country</CardTitle>
            </CardHeader>
            <CardContent>
              <Select value={selectedCountry} onValueChange={(value: any) => setSelectedCountry(value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {countries.map(country => (
                    <SelectItem key={country.code} value={country.code}>
                      {country.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </CardContent>
          </Card>

          {paymentType === 'coins' ? (
            /* Coin Packages */
            <Card>
              <CardHeader>
                <CardTitle>Choose Coin Package</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {coinPackages.map(pkg => (
                    <div
                      key={pkg.amount}
                      className={`p-4 border rounded-lg cursor-pointer transition-all ${
                        selectedAmount === pkg.amount 
                          ? 'border-love-red bg-love-red/10' 
                          : 'border-border hover:border-love-red/50'
                      }`}
                      onClick={() => setSelectedPackage(pkg.amount)}
                    >
                      <div className="text-center">
                        <div className="text-2xl font-bold text-love-red mb-1">
                          {pkg.amount.toLocaleString()}
                        </div>
                        <div className="text-sm text-muted-foreground mb-2">Coins</div>
                        {pkg.bonus > 0 && (
                          <Badge className="mb-2 bg-green-100 text-green-800">
                            +{pkg.bonus} Bonus
                          </Badge>
                        )}
                        <div className="text-lg font-bold">
                          {formatPrice(pkg.price, 'USD')}
                        </div>
                        {pkg.bonus > 0 && (
                          <div className="text-xs text-green-600">
                            Save {formatPrice((pkg.amount / 100 - pkg.price), 'USD')}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          ) : (
            /* Subscription Tiers */
            <Card>
              <CardHeader>
                <CardTitle>Choose VIP Plan</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {subscriptionTiers.map(tier => (
                    <div
                      key={tier.id}
                      className={`p-4 border rounded-lg cursor-pointer transition-all ${
                        selectedPackage === tier.price 
                          ? 'border-love-red bg-love-red/10' 
                          : 'border-border hover:border-love-red/50'
                      }`}
                      onClick={() => setSelectedPackage(tier.price)}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center space-x-2 mb-2">
                            <span className="text-2xl">{tier.icon}</span>
                            <div>
                              <h3 className="font-bold text-lg">{tier.name}</h3>
                              <div className="text-2xl font-bold text-love-red">
                                {formatPrice(tier.price, tier.currency)}
                                <span className="text-sm text-muted-foreground">/month</span>
                              </div>
                            </div>
                          </div>
                          
                          <div className="space-y-1">
                            {tier.features.map((feature, index) => (
                              <div key={index} className="flex items-center text-sm">
                                <CheckCircle className="w-4 h-4 mr-2 text-green-500" />
                                {feature}
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Payment Method Selection */}
          <Card>
            <CardHeader>
              <CardTitle>Payment Method</CardTitle>
            </CardHeader>
            <CardContent>
              <Tabs value={paymentStep} onValueChange={(value: any) => setPaymentStep(value)}>
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="method">Select Method</TabsTrigger>
                  <TabsTrigger value="details">Payment Details</TabsTrigger>
                  <TabsTrigger value="processing" disabled>Processing</TabsTrigger>
                </TabsList>

                <TabsContent value="method" className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {availablePaymentMethods.map(method => (
                      <div
                        key={method.id}
                        className={`p-4 border rounded-lg cursor-pointer transition-all ${
                          selectedPaymentMethod === method.id 
                            ? 'border-love-red bg-love-red/10' 
                            : 'border-border hover:border-love-red/50'
                        }`}
                        onClick={() => setSelectedPaymentMethod(method.id)}
                      >
                        <div className="flex items-center space-x-3">
                          <div className="text-2xl">{method.icon}</div>
                          <div className="flex-1">
                            <div className="font-medium">{method.name}</div>
                            <div className="text-sm text-muted-foreground">
                              {method.currency} • {method.type === 'mobile_money' ? 'Mobile Money' : method.type}
                            </div>
                          </div>
                          {getPaymentMethodIcon(method.type)}
                        </div>
                      </div>
                    ))}
                  </div>
                </TabsContent>

                <TabsContent value="details" className="space-y-4">
                  {selectedPaymentMethod && (() => {
                    const method = availablePaymentMethods.find(pm => pm.id === selectedPaymentMethod)
                    if (!method) return null

                    return (
                      <div className="space-y-4">
                        <div className="p-4 bg-muted rounded-lg">
                          <div className="flex items-center space-x-3 mb-2">
                            <div className="text-2xl">{method.icon}</div>
                            <div>
                              <h3 className="font-bold">{method.name}</h3>
                              <p className="text-sm text-muted-foreground">
                                Paying with {method.currency}
                              </p>
                            </div>
                          </div>
                        </div>

                        {method.type === 'mobile_money' && (
                          <div className="space-y-2">
                            <Label htmlFor="phone">Phone Number</Label>
                            <Input
                              id="phone"
                              type="tel"
                              placeholder={`Enter your ${method.name} number`}
                              value={phoneNumber}
                              onChange={(e) => setPhoneNumber(e.target.value)}
                            />
                            <p className="text-xs text-muted-foreground">
                              Format: {method.country === 'RW' ? '07xx xxx xxx' : 
                                     method.country === 'KE' ? '07xx xxx xxx' : 
                                     'Phone number format for your country'}
                            </p>
                          </div>
                        )}

                        {method.type === 'card' && (
                          <div className="space-y-2">
                            <Label htmlFor="card">Card Details</Label>
                            <div className="p-4 border rounded-lg bg-muted">
                              <p className="text-sm text-muted-foreground">
                                Secure card payment form would be integrated here
                              </p>
                            </div>
                          </div>
                        )}

                        {method.type === 'crypto' && (
                          <div className="space-y-2">
                            <Label htmlFor="crypto">Crypto Wallet</Label>
                            <Input
                              id="crypto"
                              placeholder="Enter your wallet address"
                              value={cryptoAddress}
                              onChange={(e) => setCryptoAddress(e.target.value)}
                            />
                            <p className="text-xs text-muted-foreground">
                              Send {method.currency} to this address
                            </p>
                          </div>
                        )}
                      </div>
                    )
                  })()}
                </TabsContent>

                <TabsContent value="processing">
                  <div className="text-center py-8">
                    <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4" />
                    <h3 className="text-lg font-medium mb-2">Processing Payment...</h3>
                    <p className="text-muted-foreground">
                      Please wait while we process your payment
                    </p>
                  </div>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>

          {/* Action Buttons */}
          <Card>
            <CardContent className="p-6">
              <div className="flex space-x-4">
                <Button
                  variant="outline"
                  onClick={onCancel}
                  disabled={loading}
                >
                  Cancel
                </Button>
                
                <Button
                  onClick={handlePayment}
                  disabled={loading || !selectedPaymentMethod || paymentStep !== 'details'}
                  className="bg-love-red hover:bg-love-red/90 flex-1"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    <>
                      {paymentType === 'coins' ? (
                        <>
                          <Coins className="w-4 h-4 mr-2" />
                          Purchase {selectedAmount} Coins
                        </>
                      ) : (
                        <>
                          <Crown className="w-4 h-4 mr-2" />
                          Subscribe for {formatPrice(selectedPackage, 'USD')}/month
                        </>
                      )}
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  )
}

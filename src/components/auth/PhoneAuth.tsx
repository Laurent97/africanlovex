import React, { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Loader2, Phone, MessageCircle } from 'lucide-react'
import { sendPhoneOTP, verifyPhoneOTP, phoneFormats } from '@/lib/auth'

interface PhoneAuthProps {
  onSuccess: (user: { id: string; email?: string }) => void
  onError: (error: string) => void
}

export const PhoneAuth: React.FC<PhoneAuthProps> = ({ onSuccess, onError }) => {
  const [step, setStep] = useState<'phone' | 'otp'>('phone')
  const [countryCode, setCountryCode] = useState<keyof typeof phoneFormats>('RW')
  const [phoneNumber, setPhoneNumber] = useState('')
  const [otpCode, setOtpCode] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [sentPhone, setSentPhone] = useState('')

  const handleSendOTP = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    setSuccess('')

    try {
      const result = await sendPhoneOTP(phoneNumber, countryCode)
      setSuccess(result.message)
      setSentPhone(result.phone)
      setStep('otp')
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to send OTP')
    } finally {
      setLoading(false)
    }
  }

  const handleVerifyOTP = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const result = await verifyPhoneOTP(sentPhone, otpCode, {
        username: `user_${Date.now()}`,
        country: countryCode
      })

      if (result.success) {
        onSuccess(result.user)
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Invalid OTP code')
    } finally {
      setLoading(false)
    }
  }

  const formatPhoneNumber = (phone: string, code: keyof typeof phoneFormats) => {
    const format = phoneFormats[code]
    if (!format) return phone
    
    // Basic formatting for display
    const cleaned = phone.replace(/\D/g, '')
    if (cleaned.length <= 3) return cleaned
    if (cleaned.length <= 6) return `${cleaned.slice(0, 3)} ${cleaned.slice(3)}`
    return `${cleaned.slice(0, 3)} ${cleaned.slice(3, 6)} ${cleaned.slice(6, 9)}`
  }

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader className="text-center">
        <CardTitle className="text-2xl font-bold text-love-red">
          Join LoveX 💕
        </CardTitle>
        <CardDescription>
          Connect with hearts across East Africa
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-4">
        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
        
        {success && (
          <Alert>
            <AlertDescription>{success}</AlertDescription>
          </Alert>
        )}

        {step === 'phone' ? (
          <form onSubmit={handleSendOTP} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="country">Country</Label>
              <Select value={countryCode} onValueChange={(value: keyof typeof phoneFormats) => setCountryCode(value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(phoneFormats).map(([code, format]) => (
                    <SelectItem key={code} value={code}>
                      {format.name} (+{code.replace(/[A-Z]/g, '')})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone">Phone Number</Label>
              <div className="flex items-center space-x-2">
                <div className="flex items-center px-3 py-2 border rounded-md bg-muted">
                  <Phone className="h-4 w-4 mr-2" />
                  <span className="text-sm font-medium">
                    +{countryCode.replace(/[A-Z]/g, '')}
                  </span>
                </div>
                <Input
                  id="phone"
                  type="tel"
                  placeholder="7xx xxx xxx"
                  value={formatPhoneNumber(phoneNumber, countryCode)}
                  onChange={(e) => setPhoneNumber(e.target.value.replace(/\D/g, ''))}
                  className="flex-1"
                  required
                />
              </div>
              <p className="text-xs text-muted-foreground">
                Enter your phone number to receive a verification code
              </p>
            </div>

            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Sending OTP...
                </>
              ) : (
                <>
                  <MessageCircle className="mr-2 h-4 w-4" />
                  Send Verification Code
                </>
              )}
            </Button>
          </form>
        ) : (
          <form onSubmit={handleVerifyOTP} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="otp">Verification Code</Label>
              <Input
                id="otp"
                type="text"
                placeholder="Enter 6-digit code"
                value={otpCode}
                onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                className="text-center text-lg font-mono"
                maxLength={6}
                required
              />
              <p className="text-xs text-muted-foreground">
                Enter the 6-digit code sent to {sentPhone}
              </p>
            </div>

            <Button type="submit" className="w-full" disabled={loading || otpCode.length !== 6}>
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Verifying...
                </>
              ) : (
                'Verify & Continue'
              )}
            </Button>

            <Button
              type="button"
              variant="outline"
              className="w-full"
              onClick={() => {
                setStep('phone')
                setSuccess('')
                setError('')
              }}
            >
              Back to Phone Number
            </Button>
          </form>
        )}
      </CardContent>

      <CardFooter className="text-center">
        <p className="text-xs text-muted-foreground w-full">
          By joining, you agree to our Terms of Service and Privacy Policy.
          Standard message rates may apply.
        </p>
      </CardFooter>
    </Card>
  )
}

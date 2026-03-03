import { supabase } from './supabase'
import type { Database } from './supabase'

type Profile = Database['public']['Tables']['profiles']['Row']
type ProfileInsert = Database['public']['Tables']['profiles']['Insert']

// Phone number validation for East African countries
export const phoneFormats = {
  RW: {
    name: 'Rwanda',
    pattern: /^(\+250|0)?7[238]\d{7}$/,
    format: (phone: string) => {
      const cleaned = phone.replace(/\D/g, '')
      if (cleaned.startsWith('250')) return `+250${cleaned.slice(3)}`
      if (cleaned.startsWith('0')) return `+250${cleaned.slice(1)}`
      return `+250${cleaned}`
    }
  },
  KE: {
    name: 'Kenya',
    pattern: /^(\+254|0)?[17]\d{8}$/,
    format: (phone: string) => {
      const cleaned = phone.replace(/\D/g, '')
      if (cleaned.startsWith('254')) return `+254${cleaned.slice(3)}`
      if (cleaned.startsWith('0')) return `+254${cleaned.slice(1)}`
      return `+254${cleaned}`
    }
  },
  UG: {
    name: 'Uganda',
    pattern: /^(\+256|0)?[37]\d{8}$/,
    format: (phone: string) => {
      const cleaned = phone.replace(/\D/g, '')
      if (cleaned.startsWith('256')) return `+256${cleaned.slice(3)}`
      if (cleaned.startsWith('0')) return `+256${cleaned.slice(1)}`
      return `+256${cleaned}`
    }
  },
  TZ: {
    name: 'Tanzania',
    pattern: /^(\+255|0)?[67]\d{8}$/,
    format: (phone: string) => {
      const cleaned = phone.replace(/\D/g, '')
      if (cleaned.startsWith('255')) return `+255${cleaned.slice(3)}`
      if (cleaned.startsWith('0')) return `+255${cleaned.slice(1)}`
      return `+255${cleaned}`
    }
  },
  BI: {
    name: 'Burundi',
    pattern: /^(\+257|0)?[29]\d{7}$/,
    format: (phone: string) => {
      const cleaned = phone.replace(/\D/g, '')
      if (cleaned.startsWith('257')) return `+257${cleaned.slice(3)}`
      if (cleaned.startsWith('0')) return `+257${cleaned.slice(1)}`
      return `+257${cleaned}`
    }
  },
  CD: {
    name: 'Congo (DRC)',
    pattern: /^(\+243|0)?[89]\d{8}$/,
    format: (phone: string) => {
      const cleaned = phone.replace(/\D/g, '')
      if (cleaned.startsWith('243')) return `+243${cleaned.slice(3)}`
      if (cleaned.startsWith('0')) return `+243${cleaned.slice(1)}`
      return `+243${cleaned}`
    }
  }
}

// Validate phone number for East African countries
export const validatePhoneNumber = (phone: string, countryCode: keyof typeof phoneFormats) => {
  const format = phoneFormats[countryCode]
  if (!format) return { valid: false, error: 'Unsupported country code' }
  
  const cleaned = phone.replace(/\D/g, '')
  const isValid = format.pattern.test(phone)
  
  return {
    valid: isValid,
    formatted: isValid ? format.format(phone) : null,
    error: isValid ? null : `Invalid ${format.name} phone number format`
  }
}

// Detect country from phone number
export const detectCountryFromPhone = (phone: string): keyof typeof phoneFormats | null => {
  const cleaned = phone.replace(/\D/g, '')
  
  for (const [code, format] of Object.entries(phoneFormats)) {
    if (format.pattern.test(phone)) {
      return code as keyof typeof phoneFormats
    }
  }
  
  return null
}

// Send OTP to phone number
export const sendPhoneOTP = async (phone: string, countryCode: keyof typeof phoneFormats) => {
  const validation = validatePhoneNumber(phone, countryCode)
  if (!validation.valid) {
    throw new Error(validation.error)
  }
  
  const formattedPhone = validation.formatted!
  
  // In a real implementation, this would integrate with SMS providers
  // For now, we'll use Supabase auth with phone
  const { data, error } = await supabase.auth.signInWithOtp({
    phone: formattedPhone,
    options: {
      data: {
        country: countryCode,
        phone_verified: false
      }
    }
  })
  
  if (error) throw error
  
  return {
    success: true,
    message: `OTP sent to ${formattedPhone}`,
    phone: formattedPhone
  }
}

// Verify OTP and create/update user
export const verifyPhoneOTP = async (phone: string, token: string, userData?: Partial<ProfileInsert>) => {
  const { data, error } = await supabase.auth.verifyOtp({
    phone,
    token,
    type: 'sms'
  })
  
  if (error) throw error
  
  if (data.user) {
    // Update profile with additional data
    if (userData) {
      await supabase
        .from('profiles')
        .update({
          ...userData,
          verification_level: 'basic',
          updated_at: new Date().toISOString()
        })
        .eq('id', data.user.id)
    }
    
    // Give welcome bonus coins
    await supabase.rpc('update_coins_balance', {
      user_uuid: data.user.id,
      amount_change: 100 // Welcome bonus
    })
    
    // Record the bonus transaction
    await supabase
      .from('coin_transactions')
      .insert({
        user_id: data.user.id,
        amount: 100,
        transaction_type: 'bonus',
        description: 'Welcome bonus for joining LoveX'
      })
  }
  
  return {
    success: true,
    user: data.user,
    session: data.session
  }
}

// Sign up with email and password (alternative method)
export const signUpWithEmail = async (email: string, password: string, userData: ProfileInsert) => {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        username: userData.username,
        country: userData.country,
        phone_verified: false
      }
    }
  })
  
  if (error) throw error
  
  if (data.user) {
    // Create profile
    await supabase
      .from('profiles')
      .insert({
        id: data.user.id,
        ...userData,
        verification_level: 'basic'
      })
    
    // Welcome bonus
    await supabase.rpc('update_coins_balance', {
      user_uuid: data.user.id,
      amount_change: 100
    })
    
    await supabase
      .from('coin_transactions')
      .insert({
        user_id: data.user.id,
        amount: 100,
        transaction_type: 'bonus',
        description: 'Welcome bonus for joining LoveX'
      })
  }
  
  return {
    success: true,
    user: data.user,
    session: data.session
  }
}

// Sign in with email and password
export const signInWithEmail = async (email: string, password: string) => {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password
  })
  
  if (error) throw error
  
  return {
    success: true,
    user: data.user,
    session: data.session
  }
}

// Sign in with phone and OTP
export const signInWithPhone = async (phone: string, token: string) => {
  const { data, error } = await supabase.auth.verifyOtp({
    phone,
    token,
    type: 'sms'
  })
  
  if (error) throw error
  
  return {
    success: true,
    user: data.user,
    session: data.session
  }
}

// Sign out
export const signOut = async () => {
  const { error } = await supabase.auth.signOut()
  if (error) throw error
  return { success: true }
}

// Get current user
export const getCurrentUser = async () => {
  const { data: { user }, error } = await supabase.auth.getUser()
  if (error) throw error
  return user
}

// Get user profile
export const getUserProfile = async (userId: string): Promise<Profile | null> => {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single()
  
  if (error && error.code !== 'PGRST116') throw error
  return data
}

// Update user profile
export const updateUserProfile = async (userId: string, updates: Partial<Profile>) => {
  const { data, error } = await supabase
    .from('profiles')
    .update({
      ...updates,
      updated_at: new Date().toISOString()
    })
    .eq('id', userId)
    .select()
    .single()
  
  if (error) throw error
  return data
}

// Check if username is available
export const checkUsernameAvailability = async (username: string): Promise<boolean> => {
  const { data, error } = await supabase
    .from('profiles')
    .select('username')
    .eq('username', username)
    .single()
  
  if (error && error.code === 'PGRST116') return true // Not found = available
  if (error) throw error
  return false // Found = not available
}

// Reset password
export const resetPassword = async (email: string) => {
  const { error } = await supabase.auth.resetPasswordForEmail(email)
  
  if (error) throw error
  return { success: true }
}

// Update password
export const updatePassword = async (newPassword: string) => {
  const { error } = await supabase.auth.updateUser({
    password: newPassword
  })
  
  if (error) throw error
  return { success: true }
}

// Auth state listener
export const onAuthStateChange = (callback: (event: string, session: any) => void) => {
  return supabase.auth.onAuthStateChange(callback)
}

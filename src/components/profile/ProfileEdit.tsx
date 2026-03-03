import React, { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Loader2, Camera, Check, Star, Crown, Shield } from 'lucide-react'
import { updateProfile, uploadProfilePicture, getCurrentProfile } from '@/lib/profile'
import type { Database } from '@/lib/supabase'

type Profile = Database['public']['Tables']['profiles']['Row']
type ProfileUpdate = Database['public']['Tables']['profiles']['Update']

interface ProfileEditProps {
  onSave?: (profile: Profile) => void
  onCancel?: () => void
}

export const ProfileEdit: React.FC<ProfileEditProps> = ({ onSave, onCancel }) => {
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [activeTab, setActiveTab] = useState('basic')

  // Form state
  const [formData, setFormData] = useState({
    username: '',
    full_name: '',
    bio: '',
    age: '',
    gender: 'male' as 'male' | 'female' | 'other',
    country: 'RW',
    city: '',
    tribe: '',
    languages: [] as string[],
    interests: [] as string[],
    relationship_intention: 'looking_for_love' as 'looking_for_love' | 'serious_only' | 'friends_first' | 'sugar_daddy' | 'sugar_mommy'
  })

  // Interest options
  const interestOptions = [
    'Music', 'Dancing', 'Travel', 'Cooking', 'Reading', 'Sports', 'Movies',
    'Photography', 'Art', 'Fashion', 'Technology', 'Business', 'Fitness',
    'Nature', 'Animals', 'Gaming', 'Writing', 'Languages', 'Culture'
  ]

  // Language options
  const languageOptions = [
    { code: 'en', name: 'English' },
    { code: 'sw', name: 'Swahili' },
    { code: 'rw', name: 'Kinyarwanda' },
    { code: 'rn', name: 'Kirundi' },
    { code: 'lg', name: 'Luganda' },
    { code: 'ln', name: 'Lingala' },
    { code: 'fr', name: 'French' }
  ]

  // Country options
  const countryOptions = [
    { code: 'RW', name: 'Rwanda 🇷🇼' },
    { code: 'KE', name: 'Kenya 🇰🇪' },
    { code: 'UG', name: 'Uganda 🇺🇬' },
    { code: 'TZ', name: 'Tanzania 🇹🇿' },
    { code: 'BI', name: 'Burundi 🇧🇮' },
    { code: 'CD', name: 'Congo 🇨🇩' }
  ]

  useEffect(() => {
    loadProfile()
  }, [])

  const loadProfile = async () => {
    try {
      const data = await getCurrentProfile()
      if (data) {
        setProfile(data)
        setFormData({
          username: data.username || '',
          full_name: data.full_name || '',
          bio: data.bio || '',
          age: data.age?.toString() || '',
          gender: data.gender || 'male',
          country: data.country || 'RW',
          city: data.city || '',
          tribe: data.tribe || '',
          languages: data.languages || [],
          interests: data.interests || [],
          relationship_intention: data.relationship_intention || 'looking_for_love'
        })
      }
    } catch (err: any) {
      setError(err.message)
    }
  }

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    setError('')
    setSuccess('')
  }

  const handleMultiSelect = (field: 'languages' | 'interests', value: string) => {
    const current = formData[field]
    if (current.includes(value)) {
      handleInputChange(field, current.filter(item => item !== value))
    } else {
      handleInputChange(field, [...current, value])
    }
  }

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    setUploading(true)
    setError('')

    try {
      const url = await uploadProfilePicture(file)
      setSuccess('Profile picture updated successfully!')
      
      if (profile) {
        setProfile({ ...profile, avatar_url: url })
      }
    } catch (err: any) {
      setError(err.message)
    } finally {
      setUploading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    setSuccess('')

    try {
      const updates: ProfileUpdate = {
        username: formData.username,
        full_name: formData.full_name,
        bio: formData.bio,
        age: formData.age ? parseInt(formData.age) : undefined,
        gender: formData.gender,
        country: formData.country,
        city: formData.city || null,
        tribe: formData.tribe || null,
        languages: formData.languages,
        interests: formData.interests,
        relationship_intention: formData.relationship_intention
      }

      const updatedProfile = await updateProfile(updates)
      setProfile(updatedProfile)
      setSuccess('Profile updated successfully!')
      onSave?.(updatedProfile)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const getProfileCompletion = () => {
    let completed = 0
    let total = 8

    if (formData.username) completed++
    if (formData.full_name) completed++
    if (formData.bio) completed++
    if (formData.age) completed++
    if (formData.city) completed++
    if (formData.languages.length > 0) completed++
    if (formData.interests.length > 0) completed++
    if (profile?.avatar_url) completed++

    return Math.round((completed / total) * 100)
  }

  const getVerificationBadge = (level: string) => {
    const badges = {
      basic: { color: 'bg-gray-100 text-gray-800', icon: null, text: 'Basic' },
      standard: { color: 'bg-blue-100 text-blue-800', icon: Star, text: 'Verified' },
      premium: { color: 'bg-purple-100 text-purple-800', icon: Crown, text: 'Premium' }
    }
    
    const badge = badges[level as keyof typeof badges] || badges.basic
    const Icon = badge.icon
    
    return (
      <Badge className={badge.color}>
        {Icon && <Icon className="w-3 h-3 mr-1" />}
        {badge.text}
      </Badge>
    )
  }

  if (!profile) {
    return (
      <Card className="w-full max-w-2xl mx-auto">
        <CardContent className="p-6">
          <div className="flex items-center justify-center">
            <Loader2 className="w-8 h-8 animate-spin" />
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Edit Profile</CardTitle>
            <CardDescription>Update your LoveX profile information</CardDescription>
          </div>
          <div className="flex items-center space-x-2">
            {getVerificationBadge(profile.verification_level)}
            <Badge variant="outline">{profile.vip_tier.toUpperCase()}</Badge>
          </div>
        </div>
        
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span>Profile Completion</span>
            <span>{getProfileCompletion()}%</span>
          </div>
          <Progress value={getProfileCompletion()} className="w-full" />
        </div>
      </CardHeader>

      <CardContent>
        {error && (
          <Alert variant="destructive" className="mb-4">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
        
        {success && (
          <Alert className="mb-4">
            <AlertDescription>{success}</AlertDescription>
          </Alert>
        )}

        <form onSubmit={handleSubmit}>
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="basic">Basic Info</TabsTrigger>
              <TabsTrigger value="details">Details</TabsTrigger>
              <TabsTrigger value="preferences">Preferences</TabsTrigger>
            </TabsList>

            <TabsContent value="basic" className="space-y-4">
              <div className="flex items-center space-x-4">
                <Avatar className="w-20 h-20">
                  <AvatarImage src={profile.avatar_url || ''} alt={profile.username} />
                  <AvatarFallback className="text-lg">
                    {profile.username?.slice(0, 2).toUpperCase() || 'U'}
                  </AvatarFallback>
                </Avatar>
                
                <div>
                  <Label htmlFor="avatar" className="cursor-pointer">
                    <div className="flex items-center space-x-2 px-4 py-2 border rounded-md hover:bg-muted">
                      <Camera className="w-4 h-4" />
                      <span>Change Photo</span>
                    </div>
                    <Input
                      id="avatar"
                      type="file"
                      accept="image/*"
                      onChange={handleImageUpload}
                      className="hidden"
                    />
                  </Label>
                  {uploading && (
                    <p className="text-sm text-muted-foreground mt-1">
                      Uploading...
                    </p>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="username">Username</Label>
                  <Input
                    id="username"
                    value={formData.username}
                    onChange={(e) => handleInputChange('username', e.target.value)}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="full_name">Full Name</Label>
                  <Input
                    id="full_name"
                    value={formData.full_name}
                    onChange={(e) => handleInputChange('full_name', e.target.value)}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="bio">Bio</Label>
                <Textarea
                  id="bio"
                  placeholder="Tell us about yourself..."
                  value={formData.bio}
                  onChange={(e) => handleInputChange('bio', e.target.value)}
                  rows={4}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="age">Age</Label>
                  <Input
                    id="age"
                    type="number"
                    min="18"
                    max="100"
                    value={formData.age}
                    onChange={(e) => handleInputChange('age', e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Gender</Label>
                  <Select value={formData.gender} onValueChange={(value: 'male' | 'female' | 'other') => handleInputChange('gender', value)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="male">Male</SelectItem>
                      <SelectItem value="female">Female</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="details" className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Country</Label>
                  <Select value={formData.country} onValueChange={(value) => handleInputChange('country', value)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {countryOptions.map(country => (
                        <SelectItem key={country.code} value={country.code}>
                          {country.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="city">City</Label>
                  <Input
                    id="city"
                    placeholder="Your city"
                    value={formData.city}
                    onChange={(e) => handleInputChange('city', e.target.value)}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="tribe">Tribe/Ethnic Group (Optional)</Label>
                <Input
                  id="tribe"
                  placeholder="e.g., Tutsi, Hutu, Luo, Kikuyu..."
                  value={formData.tribe}
                  onChange={(e) => handleInputChange('tribe', e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label>Languages</Label>
                <div className="flex flex-wrap gap-2">
                  {languageOptions.map(language => (
                    <Badge
                      key={language.code}
                      variant={formData.languages.includes(language.code) ? "default" : "outline"}
                      className="cursor-pointer"
                      onClick={() => handleMultiSelect('languages', language.code)}
                    >
                      {language.name}
                      {formData.languages.includes(language.code) && <Check className="w-3 h-3 ml-1" />}
                    </Badge>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <Label>Interests</Label>
                <div className="flex flex-wrap gap-2">
                  {interestOptions.map(interest => (
                    <Badge
                      key={interest}
                      variant={formData.interests.includes(interest) ? "default" : "outline"}
                      className="cursor-pointer"
                      onClick={() => handleMultiSelect('interests', interest)}
                    >
                      {interest}
                      {formData.interests.includes(interest) && <Check className="w-3 h-3 ml-1" />}
                    </Badge>
                  ))}
                </div>
              </div>
            </TabsContent>

            <TabsContent value="preferences" className="space-y-4">
              <div className="space-y-2">
                <Label>Relationship Intention</Label>
                <Select value={formData.relationship_intention} onValueChange={(value: 'looking_for_love' | 'serious_only' | 'friends_first' | 'sugar_daddy' | 'sugar_mommy') => handleInputChange('relationship_intention', value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="looking_for_love">Ndi Mukundwa 💕 (Looking for love)</SelectItem>
                    <SelectItem value="serious_only">Serious Only 💍 (Gushaka umuryango)</SelectItem>
                    <SelectItem value="friends_first">Friends First 🤝 (Ubucuti mbere)</SelectItem>
                    <SelectItem value="sugar_daddy">Manzi 💰 (Sugar daddy)</SelectItem>
                    <SelectItem value="sugar_mommy">Mukwano 💰 (Sugar mommy)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="p-4 border rounded-lg">
                <h3 className="font-semibold mb-2 flex items-center">
                  <Shield className="w-4 h-4 mr-2" />
                  Verification Status
                </h3>
                <div className="space-y-2">
                  {getVerificationBadge(profile.verification_level)}
                  <p className="text-sm text-muted-foreground">
                    {profile.verification_level === 'basic' && 'Complete phone verification to upgrade to Standard'}
                    {profile.verification_level === 'standard' && 'Upload ID documents to upgrade to Premium'}
                    {profile.verification_level === 'premium' && 'You have the highest verification level!'}
                  </p>
                </div>
              </div>
            </TabsContent>
          </Tabs>

          <div className="flex justify-end space-x-2 mt-6">
            {onCancel && (
              <Button type="button" variant="outline" onClick={onCancel}>
                Cancel
              </Button>
            )}
            <Button type="submit" disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                'Save Changes'
              )}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}

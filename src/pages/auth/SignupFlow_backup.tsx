import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ArrowRight, 
  ArrowLeft, 
  CheckCircle, 
  Camera, 
  Upload, 
  User, 
  MapPin, 
  Calendar, 
  Heart, 
  Shield,
  AlertCircle,
  Eye,
  EyeOff,
  Loader2,
  Sparkles,
  Globe,
  Briefcase,
  Music,
  Coffee,
  Book,
  Plane,
  Gamepad2,
  Dumbbell,
  Palette,
  Film,
  Mic,
  Star,
  Info
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { useAuth } from '@/hooks/use-auth';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/lib/supabase';
import VerificationBadge from '@/components/verification/VerificationBadge';
import { VerificationGate } from '@/components/verification/VerificationGate';

interface SignupData {
  email: string;
  password: string;
  confirmPassword: string;
  username: string;
  full_name: string;
  age: string;
  gender: string;
  country: string;
  city: string;
  tribe: string;
  languages: string[];
  interests: string[];
  relationship_intention: string;
  bio: string;
  avatar_url: string;
  photos: string[];
  height: string;
  education: string;
  drinking: string;
  smoking: string;
  kids: string;
  religion: string;
  instagram: string;
  spotify: string;
}

const SignupFlow: React.FC = () => {
  const navigate = useNavigate();
  const { signUp, user } = useAuth();
  const { toast } = useToast();
  
  const [currentStep, setCurrentStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  
  const [signupData, setSignupData] = useState<SignupData>({
    email: '',
    password: '',
    confirmPassword: '',
    username: '',
    full_name: '',
    age: '',
    gender: '',
    country: 'Rwanda',
    city: '',
    tribe: '',
    languages: [],
    interests: [],
    relationship_intention: 'looking_for_love',
    bio: '',
    avatar_url: '',
    photos: [],
    height: '',
    education: '',
    drinking: '',
    smoking: '',
    kids: '',
    religion: '',
    instagram: '',
    spotify: ''
  });

  const totalSteps = 6;
  const progress = (currentStep / totalSteps) * 100;

  const languagesList = [
    'English', 'French', 'Spanish', 'German', 'Italian', 'Portuguese',
    'Russian', 'Chinese', 'Japanese', 'Korean', 'Arabic', 'Hindi',
    'Swahili', 'Kinyarwanda', 'Luganda', 'Lingala', 'Zulu', 'Yoruba'
  ];

  const interestsList = [
    'Travel', 'Music', 'Coffee', 'Reading', 'Cooking', 'Photography',
    'Art', 'Dancing', 'Movies', 'Sports', 'Fitness', 'Nature',
    'Technology', 'Gaming', 'Fashion', 'Food', 'Wine', 'Animals',
    'Volunteering', 'Spirituality', 'Business', 'Science', 'History'
  ];

  const countries = [
    'Rwanda', 'Kenya', 'Uganda', 'Tanzania', 'Burundi', 'South Sudan',
    'Ethiopia', 'Eritrea', 'Somalia', 'Djibouti', 'Sudan', 'Egypt',
    'Libya', 'Tunisia', 'Algeria', 'Morocco', 'Nigeria', 'Cameroon',
    'Chad', 'Niger', 'Mali', 'Burkina Faso', 'Senegal', 'Gambia',
    'Guinea', 'Guinea-Bissau', 'Sierra Leone', 'Liberia', 'Ivory Coast',
    'Ghana', 'Togo', 'Benin', 'Nigeria', 'Equatorial Guinea', 'Gabon',
    'Congo', 'DRC', 'Angola', 'Zambia', 'Malawi', 'Mozambique',
    'Zimbabwe', 'Botswana', 'Namibia', 'South Africa', 'Eswatini',
    'Lesotho', 'Madagascar', 'Mauritius', 'Seychelles', 'Comoros'
  ];

  const tribes = [
    'Tutsi', 'Hutu', 'Twa', 'Kikuyu', 'Luo', 'Kalenjin', 'Luhya',
    'Kamba', 'Meru', 'Embu', 'Mijikenda', 'Mbeere', 'Kamba',
    'Taita', 'Pare', 'Chaga', 'Iraqw', 'Gorowa', 'Rangi',
    'Chagga', 'Sambaa', 'Digo', 'Bondei', 'Zanaki', 'Makonde',
    'Yao', 'Ngoni', 'Tumbuka', 'Chewa', 'Nyanja', 'Lomwe',
    'Sen', 'Khoe', 'San', 'Ovambo', 'Herero', 'Nama', 'Damara',
    'Lozi', 'Tonga', 'Ila', 'Lunda', 'Luba', 'Kongo'
  ];

  const validateStep = (step: number): boolean => {
    const newErrors: Record<string, string> = {};
    
    switch (step) {
      case 1:
        if (!signupData.email) newErrors.email = 'Email is required';
        else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(signupData.email)) {
          newErrors.email = 'Please enter a valid email';
        }
        
        if (!signupData.password) newErrors.password = 'Password is required';
        else if (signupData.password.length < 8) {
          newErrors.password = 'Password must be at least 8 characters';
        }
        
        if (!signupData.confirmPassword) {
          newErrors.confirmPassword = 'Please confirm your password';
        } else if (signupData.password !== signupData.confirmPassword) {
          newErrors.confirmPassword = 'Passwords do not match';
        }
        break;
        
      case 2:
        if (!signupData.username) newErrors.username = 'Username is required';
        else if (signupData.username.length < 3) {
          newErrors.username = 'Username must be at least 3 characters';
        }
        
        if (!signupData.full_name) newErrors.full_name = 'Full name is required';
        else if (signupData.full_name.length < 2) {
          newErrors.full_name = 'Full name must be at least 2 characters';
        }
        
        if (!signupData.age) newErrors.age = 'Age is required';
        else if (parseInt(signupData.age) < 18 || parseInt(signupData.age) > 100) {
          newErrors.age = 'You must be between 18 and 100 years old';
        }
        
        if (!signupData.gender) newErrors.gender = 'Gender is required';
        break;
        
      case 3:
        if (!signupData.country) newErrors.country = 'Country is required';
        if (!signupData.city) newErrors.city = 'City is required';
        if (!signupData.tribe) newErrors.tribe = 'Tribe is required';
        if (signupData.languages.length === 0) newErrors.languages = 'Select at least one language';
        break;
        
      case 4:
        if (!signupData.interests.length) newErrors.interests = 'Select at least 3 interests';
        else if (signupData.interests.length < 3) {
          newErrors.interests = 'Select at least 3 interests';
        }
        
        if (!signupData.relationship_intention) {
          newErrors.relationship_intention = 'Relationship intention is required';
        }
        
        if (!signupData.bio) newErrors.bio = 'Bio is required';
        else if (signupData.bio.length < 50) {
          newErrors.bio = 'Bio must be at least 50 characters';
        } else if (signupData.bio.length > 500) {
          newErrors.bio = 'Bio must be less than 500 characters';
        }
        break;
        
      case 5:
        if (!signupData.height) newErrors.height = 'Height is required';
        if (!signupData.education) newErrors.education = 'Education is required';
        if (!signupData.drinking) newErrors.drinking = 'Drinking preference is required';
        if (!signupData.smoking) newErrors.smoking = 'Smoking preference is required';
        if (!signupData.kids) newErrors.kids = 'Kids preference is required';
        if (!signupData.religion) newErrors.religion = 'Religion is required';
        break;
        
      case 6:
        if (signupData.photos.length === 0) {
          newErrors.photos = 'Please upload at least one photo';
        }
        break;
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (!validateStep(currentStep)) return;
    
    if (currentStep < totalSteps) {
      setCurrentStep(currentStep + 1);
    } else {
      handleSubmit();
    }
  };

  const handlePrevious = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSubmit = async () => {
    setIsLoading(true);
    
    try {
      const { error } = await supabase.auth.signUp({
        email: signupData.email,
        password: signupData.password,
        options: {
          data: {
            username: signupData.username,
            full_name: signupData.full_name,
            user_metadata: {
              signup_step: 'completed',
              signup_photos: signupData.photos
            }
          }
        }
      });

      if (error) throw error;

      // Create profile
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .insert({
          id: user?.id,
          username: signupData.username,
          full_name: signupData.full_name,
          age: parseInt(signupData.age),
          gender: signupData.gender,
          country: signupData.country,
          city: signupData.city,
          tribe: signupData.tribe,
          languages: signupData.languages,
          interests: signupData.interests,
          relationship_intention: signupData.relationship_intention,
          bio: signupData.bio,
          avatar_url: signupData.avatar_url || signupData.photos[0] || '',
          height: signupData.height,
          education: signupData.education,
          drinking: signupData.drinking,
          smoking: signupData.smoking,
          kids: signupData.kids,
          religion: signupData.religion,
          instagram: signupData.instagram,
          spotify: signupData.spotify,
          photos: signupData.photos
        })
        .select()
        .single();

      if (profileError) throw profileError;

      toast({
        title: "Account created successfully!",
        description: "Welcome to LoveX! Your profile has been set up.",
      });

      // Navigate to verification
      navigate('/verification');
      
    } catch (error: unknown) {
      console.error('Signup error:', error);
      toast({
        title: "Signup failed",
        description: error instanceof Error ? error.message : "An error occurred during signup. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handlePhotoUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Check file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: "File too large",
        description: "Please select an image under 5MB",
        variant: "destructive",
      });
      return;
    }

    // Check file type
    if (!file.type.startsWith('image/')) {
      toast({
        title: "Invalid file type",
        description: "Please select an image file",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    
    try {
      // In a real app, you'd upload to Cloudinary here
      // For now, we'll create a preview URL
      const previewUrl = URL.createObjectURL(file);
      
      setSignupData(prev => ({
        ...prev,
        photos: [...prev.photos, previewUrl]
      }));
      
      toast({
        title: "Photo uploaded",
        description: "Your photo has been added successfully",
      });
      
    } catch (error) {
      console.error('Photo upload error:', error);
      toast({
        title: "Upload failed",
        description: "Failed to upload photo. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const removePhoto = (index: number) => {
    setSignupData(prev => ({
      ...prev,
      photos: prev.photos.filter((_, i) => i !== index)
    }));
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="space-y-6"
          >
            <div className="text-center mb-8">
              <div className="w-16 h-16 bg-gradient-to-r from-purple-600 to-pink-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <User className="w-8 h-8 text-white" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900">Create Your Account</h2>
              <p className="text-gray-600">Join LoveX and find your perfect match</p>
            </div>

            <div className="space-y-4">
              <div>
                <Label htmlFor="email">Email Address</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="your.email@example.com"
                  value={signupData.email}
                  onChange={(e) => setSignupData(prev => ({ ...prev, email: e.target.value }))}
                  className={errors.email ? 'border-red-500' : ''}
                />
                {errors.email && <p className="text-red-500 text-sm">{errors.email}</p>}
              </div>

              <div>
                <Label htmlFor="password">Password</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Create a strong password"
                    value={signupData.password}
                    onChange={(e) => setSignupData(prev => ({ ...prev, password: e.target.value }))}
                    className={errors.password ? 'border-red-500' : ''}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                {errors.password && <p className="text-red-500 text-sm">{errors.password}</p>}
              </div>

              <div>
                <Label htmlFor="confirmPassword">Confirm Password</Label>
                <div className="relative">
                  <Input
                    id="confirmPassword"
                    type={showConfirmPassword ? 'text' : 'password'}
                    placeholder="Confirm your password"
                    value={signupData.confirmPassword}
                    onChange={(e) => setSignupData(prev => ({ ...prev, confirmPassword: e.target.value }))}
                    className={errors.confirmPassword ? 'border-red-500' : ''}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                {errors.confirmPassword && <p className="text-red-500 text-sm">{errors.confirmPassword}</p>}
              </div>
            </div>
          </motion.div>
        );

      case 2:
        return (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="space-y-6"
          >
            <div className="text-center mb-8">
              <div className="w-16 h-16 bg-gradient-to-r from-purple-600 to-pink-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <User className="w-8 h-8 text-white" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900">Basic Information</h2>
              <p className="text-gray-600">Tell us about yourself</p>
            </div>

            <div className="space-y-4">
              <div>
                <Label htmlFor="username">Username</Label>
                <Input
                  id="username"
                  placeholder="Choose a username"
                  value={signupData.username}
                  onChange={(e) => setSignupData(prev => ({ ...prev, username: e.target.value }))}
                  className={errors.username ? 'border-red-500' : ''}
                />
                {errors.username && <p className="text-red-500 text-sm">{errors.username}</p>}
              </div>

              <div>
                <Label htmlFor="full_name">Full Name</Label>
                <Input
                  id="full_name"
                  placeholder="Your full name"
                  value={signupData.full_name}
                  onChange={(e) => setSignupData(prev => ({ ...prev, full_name: e.target.value }))}
                  className={errors.full_name ? 'border-red-500' : ''}
                />
                {errors.full_name && <p className="text-red-500 text-sm">{errors.full_name}</p>}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="age">Age</Label>
                  <Select value={signupData.age} onValueChange={(value) => setSignupData(prev => ({ ...prev, age: value }))}>
                    <SelectTrigger className={errors.age ? 'border-red-500' : ''}>
                      <SelectValue placeholder="Select age" />
                    </SelectTrigger>
                    <SelectContent>
                      {Array.from({ length: 83 }, (_, i) => (
                        <SelectItem key={i + 18} value={(i + 18).toString()}>
                          {i + 18}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {errors.age && <p className="text-red-500 text-sm">{errors.age}</p>}
                </div>

                <div>
                  <Label htmlFor="gender">Gender</Label>
                  <Select value={signupData.gender} onValueChange={(value) => setSignupData(prev => ({ ...prev, gender: value }))}>
                    <SelectTrigger className={errors.gender ? 'border-red-500' : ''}>
                      <SelectValue placeholder="Select gender" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="male">Male</SelectItem>
                      <SelectItem value="female">Female</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                  {errors.gender && <p className="text-red-500 text-sm">{errors.gender}</p>}
                </div>
              </div>
            </div>
          </motion.div>
        );

      case 3:
        return (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="space-y-6"
          >
            <div className="text-center mb-8">
              <div className="w-16 h-16 bg-gradient-to-r from-purple-600 to-pink-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <Globe className="w-8 h-8 text-white" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900">Location & Background</h2>
              <p className="text-gray-600">Where are you from?</p>
            </div>

            <div className="space-y-4">
              <div>
                <Label htmlFor="country">Country</Label>
                <Select value={signupData.country} onValueChange={(value) => setSignupData(prev => ({ ...prev, country: value }))}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select country" />
                  </SelectTrigger>
                  <SelectContent>
                    {countries.map(country => (
                      <SelectItem key={country} value={country}>{country}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="city">City</Label>
                <Input
                  id="city"
                  placeholder="Your city"
                  value={signupData.city}
                  onChange={(e) => setSignupData(prev => ({ ...prev, city: e.target.value }))}
                />
              </div>

              <div>
                <Label htmlFor="tribe">Tribe/Ethnicity</Label>
                <Select value={signupData.tribe} onValueChange={(value) => setSignupData(prev => ({ ...prev, tribe: value }))}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select your tribe/ethnicity" />
                  </SelectTrigger>
                  <SelectContent>
                    {tribes.map(tribe => (
                      <SelectItem key={tribe} value={tribe}>{tribe}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Languages</Label>
                <div className="grid grid-cols-2 gap-2">
                  {languagesList.slice(0, 8).map(language => (
                    <div key={language} className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        id={language}
                        checked={signupData.languages.includes(language)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSignupData(prev => ({ ...prev, languages: [...prev.languages, language] }));
                          } else {
                            setSignupData(prev => ({ ...prev, languages: prev.languages.filter(l => l !== language) }));
                          }
                        }}
                        className="rounded"
                      />
                      <Label htmlFor={language} className="text-sm">{language}</Label>
                    </div>
                  ))}
                </div>
                {errors.languages && <p className="text-red-500 text-sm">{errors.languages}</p>}
              </div>
            </div>
          </motion.div>
        );

      case 4:
        return (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="space-y-6"
          >
            <div className="text-center mb-8">
              <div className="w-16 h-16 bg-gradient-to-r from-purple-600 to-pink-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <Heart className="w-8 h-8 text-white" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900">Interests & Intentions</h2>
              <p className="text-600">What are you looking for?</p>
            </div>

            <div className="space-y-4">
              <div>
                <Label>Interests (Select at least 3)</Label>
                <div className="grid grid-cols-3 gap-2">
                  {interestsList.map(interest => (
                    <div key={interest} className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        id={interest}
                        checked={signupData.interests.includes(interest)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSignupData(prev => ({ ...prev, interests: [...prev.interests, interest] }));
                          } else {
                            setSignupData(prev => ({ ...prev, interests: prev.interests.filter(i => i !== interest) }));
                          }
                        }}
                        className="rounded"
                      />
                      <Label htmlFor={interest} className="text-sm">{interest}</Label>
                    </div>
                  ))}
                </div>
                {errors.interests && <p className="text-red-500 text-sm">{errors.interests}</p>}
              </div>

              <div>
                <Label htmlFor="relationship_intention">Relationship Intention</Label>
                <Select value={signupData.relationship_intention} onValueChange={(value) => setSignupData(prev => ({ ...prev, relationship_intention: value }))}>
                  <SelectTrigger>
                    <SelectValue placeholder="What are you looking for?" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="looking_for_love">Looking for Love</SelectItem>
                    <SelectItem value="serious_only">Serious Relationship Only</SelectItem>
                    <SelectItem value="friends_first">Friends First</SelectItem>
                    <SelectItem value="casual_dating">Casual Dating</SelectItem>
                    <SelectItem value="sugar_daddy">Sugar Daddy</SelectItem>
                    <SelectItem value="sugar_mommy">Sugar Mommy</SelectItem>
                  </SelectContent>
                </Select>
                {errors.relationship_intention && <p className="text-red-500 text-sm">{errors.relationship_intention}</p>}
              </div>

              <div>
                <Label htmlFor="bio">Bio</Label>
                <Textarea
                  id="bio"
                  placeholder="Tell us about yourself..."
                  value={signupData.bio}
                  onChange={(e) => setSignupData(prev => ({ ...prev, bio: e.target.value }))}
                  rows={4}
                  className={errors.bio ? 'border-red-500' : ''}
                />
                <div className="flex justify-between text-sm text-gray-500 mt-1">
                  <span>{signupData.bio.length}/500</span>
                </div>
                {errors.bio && <p className="text-red-500 text-sm">{errors.bio}</p>}
              </div>
            </div>
          </motion.div>
        );

      case 5:
        return (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="space-y-6"
          >
            <div className="text-center mb-8">
              <div className="w-16 h-16 bg-gradient-to-r from-purple-600 to-pink-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <Briefcase className="w-8 h-8 text-white" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900">Lifestyle Details</h2>
              <p className="text-gray-600">Help us know you better</p>
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="height">Height</Label>
                  <Select value={signupData.height} onValueChange={(value) => setSignupData(prev => ({ ...prev, height: value }))}>
                    <SelectTrigger>
                      <SelectValue placeholder="Height" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="150-160cm">150-160cm</SelectItem>
                      <SelectItem value="160-170cm">160-170cm</SelectItem>
                      <SelectItem value="170-180cm">170-180cm</SelectItem>
                      <SelectItem value="180-190cm">180-190cm</SelectItem>
                      <SelectItem value="190-200cm">190-200cm</SelectItem>
                      <SelectItem value="200cm+">200cm+</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="education">Education</Label>
                  <Select value={signupData.education} onValueChange={(value) => setSignupData(prev => ({ ...prev, education: value }))}>
                    <SelectTrigger>
                      <SelectValue placeholder="Education" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="High School">High School</SelectItem>
                      <SelectItem value="Some College">Some College</SelectItem>
                      <SelectItem value="Bachelor's Degree">Bachelor's Degree</SelectItem>
                      <SelectItem value="Master's Degree">Master's Degree</SelectItem>
                      <SelectItem value="PhD">PhD</SelectItem>
                      <SelectItem value="Other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="drinking">Drinking</Label>
                  <Select value={signupData.drinking} onValueChange={(value) => setSignupData(prev => ({ ...prev, drinking: value }))}>
                    <SelectTrigger>
                      <SelectValue placeholder="Drinking" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Never">Never</SelectItem>
                      <SelectItem value="Socially">Socially</SelectItem>
                      <SelectItem value="Often">Often</SelectItem>
                      <SelectItem value="Daily">Daily</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="smoking">Smoking</Label>
                  <Select value={signupData.smoking} onValueChange={(value) => setSignupData(prev => ({ ...prev, smoking: value }))}>
                    <SelectTrigger>
                      <SelectValue placeholder="Smoking" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Never">Never</SelectItem>
                      <SelectItem value="Occasionally">Occasionally</SelectItem>
                      <SelectItem value="Regularly">Regularly</SelectItem>
                      <SelectItem value="Daily">Daily</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="kids">Kids</Label>
                  <Select value={signupData.kids} onValueChange={(value) => setSignupData(prev => ({ ...prev, kids: value }))}>
                    <SelectTrigger>
                      <SelectValue placeholder="Kids" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="No">No</SelectItem>
                      <SelectItem value="Want someday">Want someday</SelectItem>
                      <SelectItem value="Have kids">Have kids</SelectItem>
                      <SelectItem value="Open to kids">Open to kids</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="religion">Religion</Label>
                  <Select value={signupData.religion} onValueChange={(value) => setSignupData(prev => ({ ...prev, religion: value }))}>
                    <SelectTrigger>
                      <SelectValue placeholder="Religion" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Christian">Christian</SelectItem>
                      <SelectItem value="Muslim">Muslim</SelectItem>
                      <SelectItem value="Hindu">Hindu</SelectItem>
                      <SelectItem value="Buddhist">Buddhist</SelectItem>
                      <SelectItem value="Jewish">Jewish</SelectItem>
                      <SelectItem value="Spiritual">Spiritual</SelectItem>
                      <SelectItem value="Agnostic">Agnostic</SelectItem>
                      <SelectItem value="Other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="instagram">Instagram (Optional)</Label>
                  <Input
                    id="instagram"
                    placeholder="@username"
                    value={signupData.instagram}
                    onChange={(e) => setSignupData(prev => ({ ...prev, instagram: e.target.value }))}
                  />
                </div>

                <div>
                  <Label htmlFor="spotify">Spotify (Optional)</Label>
                  <Input
                    id="spotify"
                    placeholder="Spotify profile"
                    value={signupData.spotify}
                    onChange={(e) => setSignupData(prev => ({ ...prev, spotify: e.target.value }))}
                  />
                </div>
              </div>
            </div>
          </motion.div>
        );

      case 6:
        return (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="space-y-6"
          >
            <div className="text-center mb-8">
              <div className="w-16 h-16 bg-gradient-to-r from-purple-600 to-pink-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <Camera className="w-8 h-8 text-white" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900">Add Photos</h2>
              <p className="text-gray-600">Show us your best self</p>
            </div>

            <div className="space-y-4">
              <div>
                <Label>Upload Photos</Label>
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                  <Upload className="w-12 h-12 mx-auto text-gray-400 mb-4" />
                  <p className="text-gray-600 mb-4">Click to upload or drag and drop</p>
                  <input
                    type="file"
                    multiple
                    accept="image/*"
                    onChange={handlePhotoUpload}
                    className="hidden"
                    id="photo-upload"
                  />
                  <label
                    htmlFor="photo-upload"
                    className="inline-flex items-center px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 cursor-pointer"
                  >
                    <Upload className="w-4 h-4 mr-2" />
                    Choose Photos
                  </label>
                  <p className="text-xs text-gray-500 mt-2">JPG, PNG up to 5MB</p>
                </div>
              </div>

              {signupData.photos.length > 0 && (
                <div>
                  <Label>Your Photos ({signupData.photos.length}/5)</Label>
                  <div className="grid grid-cols-3 gap-4">
                    {signupData.photos.map((photo, index) => (
                      <div key={index} className="relative group">
                        <img
                          src={photo}
                          alt={`Photo ${index + 1}`}
                          className="w-full h-32 object-cover rounded-lg"
                        />
                        <button
                          onClick={() => removePhoto(index)}
                          className="absolute top-2 right-2 w-8 h-8 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <X className="w-4 h-4" />
                        </button>
                        {index === 0 && (
                          <Badge className="absolute top-2 left-2 bg-purple-600 text-white">
                            Main
                          </Badge>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {errors.photos && (
                <p className="text-red-500 text-sm">{errors.photos}</p>
              )}

              <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <Info className="w-5 h-5 text-purple-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <h4 className="font-semibold text-purple-900 mb-1">Photo Guidelines</h4>
                    <ul className="text-sm text-purple-800 space-y-1">
                      <li>• Clear, recent photos of yourself</li>
                      <li>• No filters or heavy editing</li>
                      <li>• At least one clear face photo</li>
                      <li>• Appropriate content only</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-50">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <Link to="/auth/login" className="flex items-center text-gray-600 hover:text-gray-900">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Login
          </Link>
          
          <div className="text-center">
            <h1 className="text-3xl font-bold text-gray-900">Join LoveX</h1>
            <p className="text-gray-600">Already have an account? <Link to="/auth/login" className="text-purple-600 hover:text-purple-700 font-medium">Sign in</Link></p>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-700">Step {currentStep} of {totalSteps}</span>
            <span className="text-sm font-medium text-purple-600">{Math.round(progress)}% Complete</span>
          </div>
          <Progress value={progress} className="h-2" />
        </div>

        {/* Main Content */}
        <Card className="max-w-2xl mx-auto">
          <CardContent className="p-8">
            {renderStepContent()}
            
            {/* Navigation */}
            <div className="flex justify-between mt-8">
              <Button
                variant="outline"
                onClick={handlePrevious}
                disabled={currentStep === 1}
                className="flex items-center gap-2"
              >
                <ArrowLeft className="w-4 h-4" />
                Previous
              </Button>
              
              <Button
                onClick={handleNext}
                disabled={isLoading}
                className="flex items-center gap-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white hover:from-purple-700 hover:to-pink-700"
              >
                {currentStep === totalSteps ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Create Account
                  </>
                ) : (
                  <>
                    {currentStep === totalSteps - 1 ? 'Complete' : 'Next'}
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Footer */}
        <div className="text-center mt-8 text-gray-600">
          <p className="text-sm">
            By creating an account, you agree to our{' '}
            <Link to="/terms" className="text-purple-600 hover:text-purple-700 underline">
              Terms of Service
            </Link>{' '}
            and{' '}
            <Link to="/privacy" className="text-purple-600 hover:text-purple-700 underline">
              Privacy Policy
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default SignupFlow;

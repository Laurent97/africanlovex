import React, { useState, useCallback, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { 
  ArrowRight, 
  ArrowLeft, 
  Camera, 
  Upload, 
  User, 
  Globe, 
  Heart, 
  Briefcase,
  Music,
  Sparkles,
  Check,
  X,
  Loader2,
  MapPin,
  Calendar,
  Shield,
  Star
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Checkbox } from '@/components/ui/checkbox';
import { useDropzone } from 'react-dropzone';
import { useToast } from '@/hooks/use-toast';
import { signUpWithEmail, sendPhoneOTP } from '@/lib/auth';
import { supabase } from '@/lib/supabase';

// Zod schemas for each step
const step1Schema = z.object({
  email: z.string().email('Please enter a valid email'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  confirmPassword: z.string(),
  username: z.string().min(3, 'Username must be at least 3 characters'),
  fullName: z.string().min(2, 'Full name must be at least 2 characters'),
  birthDate: z.string().refine((date) => {
    const birthDate = new Date(date);
    const today = new Date();
    const age = today.getFullYear() - birthDate.getFullYear();
    return age >= 18 && age <= 100;
  }, 'You must be between 18 and 100 years old'),
  gender: z.enum(['male', 'female', 'non_binary', 'other']),
  showGender: z.boolean().default(true)
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

const step2Schema = z.object({
  country: z.string().min(1, 'Please select your country'),
  city: z.string().min(2, 'City must be at least 2 characters'),
  languages: z.array(z.string()).min(1, 'Select at least one language')
});

const step3Schema = z.object({
  photos: z.array(z.string()).min(1, 'Please upload at least one photo').max(6, 'Maximum 6 photos allowed')
});

const step4Schema = z.object({
  bio: z.string().min(50, 'Bio must be at least 50 characters').max(500, 'Bio must be less than 500 characters'),
  interests: z.array(z.string()).min(3, 'Select at least 3 interests'),
  relationshipIntention: z.enum(['looking_for_love', 'serious_only', 'friends_first', 'sugar_daddy', 'sugar_mommy'])
});

const step5Schema = z.object({
  height: z.string().min(1, 'Please select your height'),
  education: z.string().min(1, 'Please select your education'),
  occupation: z.string().min(2, 'Occupation must be at least 2 characters'),
  drinking: z.enum(['never', 'socially', 'regularly']),
  smoking: z.enum(['never', 'socially', 'regularly']),
  kids: z.enum(['dont_want', 'want_someday', 'have_kids', 'open_to_kids']),
  religion: z.string().min(1, 'Please select your religion')
});

const step6Schema = z.object({
  instagram: z.string().optional(),
  spotify: z.string().optional()
});

type Step1Data = z.infer<typeof step1Schema>;
type Step2Data = z.infer<typeof step2Schema>;
type Step3Data = z.infer<typeof step3Schema>;
type Step4Data = z.infer<typeof step4Schema>;
type Step5Data = z.infer<typeof step5Schema>;
type Step6Data = z.infer<typeof step6Schema>;

interface SignupData extends Step1Data, Step2Data, Step3Data, Step4Data, Step5Data, Step6Data {}

const ModernSignupFlow: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { toast } = useToast();
  
  const [currentStep, setCurrentStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isCheckingUsername, setIsCheckingUsername] = useState(false);
  const [usernameAvailable, setUsernameAvailable] = useState<boolean | null>(null);
  
  // Form controllers for each step
  const step1Form = useForm<Step1Data>({ resolver: zodResolver(step1Schema) });
  const step2Form = useForm<Step2Data>({ resolver: zodResolver(step2Schema) });
  const step3Form = useForm<Step3Data>({ resolver: zodResolver(step3Schema) });
  const step4Form = useForm<Step4Data>({ resolver: zodResolver(step4Schema) });
  const step5Form = useForm<Step5Data>({ resolver: zodResolver(step5Schema) });
  const step6Form = useForm<Step6Data>({ resolver: zodResolver(step6Schema) });

  // Combined data state
  const [signupData, setSignupData] = useState<Partial<SignupData>>({});

  const totalSteps = 6;
  const progress = (currentStep / totalSteps) * 100;

  // Save progress to localStorage
  useEffect(() => {
    if (signupData) {
      localStorage.setItem('lovex_signup_progress', JSON.stringify(signupData));
    }
  }, [signupData, currentStep]);

  // Load saved progress on mount
  useEffect(() => {
    const saved = localStorage.getItem('lovex_signup_progress');
    if (saved) {
      const data = JSON.parse(saved);
      setSignupData(data);
      const savedStep = data.onboardingStep || 1;
      setCurrentStep(Math.min(savedStep, totalSteps));
    }
  }, []);

  // Constants
  const countries = [
    'Rwanda', 'Kenya', 'Uganda', 'Tanzania', 'Burundi', 'South Sudan',
    'Ethiopia', 'Eritrea', 'Somalia', 'Djibouti', 'Sudan', 'Egypt',
    'Libya', 'Tunisia', 'Algeria', 'Morocco', 'Nigeria', 'Cameroon',
    'Chad', 'Niger', 'Mali', 'Burkina Faso', 'Senegal', 'Gambia',
    'Guinea', 'Guinea-Bissau', 'Sierra Leone', 'Liberia', 'Ivory Coast',
    'Ghana', 'Togo', 'Benin', 'Equatorial Guinea', 'Gabon',
    'Congo', 'DRC', 'Angola', 'Zambia', 'Malawi', 'Mozambique',
    'Zimbabwe', 'Botswana', 'Namibia', 'South Africa', 'Eswatini',
    'Lesotho', 'Madagascar', 'Mauritius', 'Seychelles', 'Comoros'
  ];

  const tribes = [
    'Tutsi', 'Hutu', 'Twa', 'Kikuyu', 'Luo', 'Kalenjin', 'Luhya',
    'Kamba', 'Meru', 'Embu', 'Mbeere', 'Taita', 'Pare', 'Chaga',
    'Iraqw', 'Gorowa', 'Rangi', 'Chagga', 'Sambaa', 'Digo', 'Bondei',
    'Zanaki', 'Makonde', 'Yao', 'Ngoni', 'Tumbuka', 'Chewa', 'Nyanja',
    'Lomwe', 'Sen', 'Khoe', 'San', 'Ovambo', 'Herero', 'Nama', 'Damara',
    'Lozi', 'Tonga', 'Ila', 'Lunda', 'Luba', 'Kongo'
  ];

  const languages = [
    'English', 'French', 'Spanish', 'German', 'Italian', 'Portuguese',
    'Russian', 'Chinese', 'Japanese', 'Korean', 'Arabic', 'Hindi',
    'Swahili', 'Kinyarwanda', 'Luganda', 'Lingala', 'Zulu', 'Yoruba'
  ];

  const interests = [
    { name: 'Travel', icon: '✈️', category: 'lifestyle' },
    { name: 'Music', icon: '🎵', category: 'arts' },
    { name: 'Coffee', icon: '☕', category: 'lifestyle' },
    { name: 'Reading', icon: '📚', category: 'intellectual' },
    { name: 'Cooking', icon: '🍳', category: 'lifestyle' },
    { name: 'Photography', icon: '📸', category: 'arts' },
    { name: 'Art', icon: '🎨', category: 'arts' },
    { name: 'Dancing', icon: '💃', category: 'arts' },
    { name: 'Movies', icon: '🎬', category: 'entertainment' },
    { name: 'Sports', icon: '⚽', category: 'fitness' },
    { name: 'Fitness', icon: '💪', category: 'fitness' },
    { name: 'Nature', icon: '🌿', category: 'outdoor' },
    { name: 'Technology', icon: '💻', category: 'intellectual' },
    { name: 'Gaming', icon: '🎮', category: 'entertainment' },
    { name: 'Fashion', icon: '👗', category: 'lifestyle' },
    { name: 'Food', icon: '🍕', category: 'lifestyle' },
    { name: 'Wine', icon: '🍷', category: 'lifestyle' },
    { name: 'Animals', icon: '🐾', category: 'lifestyle' },
    { name: 'Volunteering', icon: '🤝', category: 'social' },
    { name: 'Spirituality', icon: '🧘', category: 'lifestyle' },
    { name: 'Business', icon: '💼', category: 'career' },
    { name: 'Science', icon: '🔬', category: 'intellectual' },
    { name: 'History', icon: '📜', category: 'intellectual' }
  ];

  // Check username availability
  const checkUsername = useCallback(async (username: string) => {
    if (username.length < 3) {
      setUsernameAvailable(null);
      return;
    }

    setIsCheckingUsername(true);
    try {
      const { data } = await supabase
        .from('profiles')
        .select('username')
        .eq('username', username)
        .single();
      
      setUsernameAvailable(!data);
    } catch (error) {
      setUsernameAvailable(null);
    } finally {
      setIsCheckingUsername(false);
    }
  }, []);

  // Photo upload with Cloudinary
  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    const files = acceptedFiles.slice(0, 6 - (signupData.photos?.length || 0));
    
    for (const file of files) {
      if (file.size > 5 * 1024 * 1024) {
        toast({
          title: "File too large",
          description: "Please select an image under 5MB",
          variant: "destructive",
        });
        continue;
      }

      try {
        // Upload to Cloudinary (you'll need to set this up)
        const formData = new FormData();
        formData.append('file', file);
        formData.append('upload_preset', 'lovex_signup');
        
        // For now, create preview URL
        const previewUrl = URL.createObjectURL(file);
        
        setSignupData(prev => ({
          ...prev,
          photos: [...(prev.photos || []), previewUrl]
        }));
        
        toast({
          title: "Photo uploaded",
          description: "Your photo has been added successfully",
        });
      } catch (error) {
        toast({
          title: "Upload failed",
          description: "Failed to upload photo. Please try again.",
          variant: "destructive",
        });
      }
    }
  }, [signupData.photos, toast]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.jpeg', '.jpg', '.png', '.gif']
    },
    maxFiles: 6,
    maxSize: 5 * 1024 * 1024 // 5MB
  });

  const removePhoto = (index: number) => {
    setSignupData(prev => ({
      ...prev,
      photos: prev.photos?.filter((_, i) => i !== index) || []
    }));
  };

  const saveStepData = (stepData: Record<string, unknown>) => {
    setSignupData(prev => ({ ...prev, ...stepData, onboardingStep: currentStep }));
  };

  const validateAndProceed = async () => {
    let isValid = false;
    let stepData: Record<string, unknown> = {};

    switch (currentStep) {
      case 1: {
        const step1Result = await step1Form.trigger();
        if (step1Result) {
          stepData = step1Form.getValues();
          isValid = true;
        }
        break;
      }
      case 2: {
        const step2Result = await step2Form.trigger();
        if (step2Result) {
          stepData = step2Form.getValues();
          isValid = true;
        }
        break;
      }
      case 3: {
        const step3Result = await step3Form.trigger();
        if (step3Result) {
          stepData = step3Form.getValues();
          isValid = true;
        }
        break;
      }
      case 4: {
        const step4Result = await step4Form.trigger();
        if (step4Result) {
          stepData = step4Form.getValues();
          isValid = true;
        }
        break;
      }
      case 5: {
        const step5Result = await step5Form.trigger();
        if (step5Result) {
          stepData = step5Form.getValues();
          isValid = true;
        }
        break;
      }
      case 6: {
        const step6Result = await step6Form.trigger();
        if (step6Result) {
          stepData = step6Form.getValues();
          isValid = true;
        }
        break;
      }
    }

    if (isValid) {
      saveStepData(stepData);
      if (currentStep < totalSteps) {
        setCurrentStep(currentStep + 1);
      } else {
        await handleSubmit();
      }
    }
  };

  const handleSubmit = async () => {
    setIsLoading(true);
    
    try {
      // Calculate age from birth date
      const birthDate = new Date(signupData.birthDate!);
      const today = new Date();
      const age = today.getFullYear() - birthDate.getFullYear();

      const result = await signUpWithEmail(signupData.email!, signupData.password!, {
        id: '', // Will be set by Supabase
        username: signupData.username!,
        full_name: signupData.fullName!,
        birth_date: signupData.birthDate,
        age: age,
        gender: signupData.gender!,
        show_gender: signupData.showGender!,
        country: signupData.country!,
        city: signupData.city!,
        tribe: signupData.tribe!,
        languages: signupData.languages!,
        avatar_url: signupData.photos?.[0],
        bio: signupData.bio!,
        interests: signupData.interests!,
        relationship_intention: signupData.relationshipIntention!,
        height: parseInt(signupData.height!),
        education: signupData.education!,
        occupation: signupData.occupation!,
        drinking: signupData.drinking!,
        smoking: signupData.smoking!,
        kids: signupData.kids!,
        religion: signupData.religion!,
        instagram: signupData.instagram,
        spotify: signupData.spotify,
        onboarding_completed: true,
        onboarding_step: totalSteps
      });

      if (result.success) {
        // Clear saved progress
        localStorage.removeItem('lovex_signup_progress');
        
        toast({
          title: "Welcome to LoveX! 🎉",
          description: "Your profile has been created successfully.",
        });

        navigate('/verification');
      }

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

  const stepVariants = {
    enter: { x: 300, opacity: 0 },
    center: { x: 0, opacity: 1 },
    exit: { x: -300, opacity: 0 }
  };

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return (
          <motion.div
            key="step1"
            variants={stepVariants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            className="space-y-6"
          >
            <div className="text-center mb-8">
              <div className="w-20 h-20 bg-gradient-to-r from-purple-600 to-pink-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <User className="w-10 h-10 text-white" />
              </div>
              <h2 className="text-3xl font-bold text-gray-900 mb-2">Let's Get Started</h2>
              <p className="text-gray-600">Create your account to find your perfect match</p>
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="fullName">Full Name</Label>
                  <Input
                    id="fullName"
                    placeholder="Enter your full name"
                    {...step1Form.register('fullName')}
                    className={step1Form.formState.errors.fullName ? 'border-red-500' : ''}
                  />
                  {step1Form.formState.errors.fullName && (
                    <p className="text-red-500 text-sm">{step1Form.formState.errors.fullName.message}</p>
                  )}
                </div>

                <div>
                  <Label htmlFor="username">Username</Label>
                  <div className="relative">
                    <Input
                      id="username"
                      placeholder="Choose a username"
                      {...step1Form.register('username', {
                        onChange: (e) => checkUsername(e.target.value)
                      })}
                      className={step1Form.formState.errors.username ? 'border-red-500' : ''}
                    />
                    {isCheckingUsername && (
                      <Loader2 className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 animate-spin text-gray-400" />
                    )}
                    {usernameAvailable === true && (
                      <Check className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-green-500" />
                    )}
                    {usernameAvailable === false && (
                      <X className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-red-500" />
                    )}
                  </div>
                  {step1Form.formState.errors.username && (
                    <p className="text-red-500 text-sm">{step1Form.formState.errors.username.message}</p>
                  )}
                </div>
              </div>

              <div>
                <Label htmlFor="email">Email Address</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="your.email@example.com"
                  {...step1Form.register('email')}
                  className={step1Form.formState.errors.email ? 'border-red-500' : ''}
                />
                {step1Form.formState.errors.email && (
                  <p className="text-red-500 text-sm">{step1Form.formState.errors.email.message}</p>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="password">Password</Label>
                  <div className="relative">
                    <Input
                      id="password"
                      type={showPassword ? 'text' : 'password'}
                      placeholder="Create a strong password"
                      {...step1Form.register('password')}
                      className={step1Form.formState.errors.password ? 'border-red-500' : ''}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      {showPassword ? <X className="w-4 h-4" /> : <Camera className="w-4 h-4" />}
                    </button>
                  </div>
                  {step1Form.formState.errors.password && (
                    <p className="text-red-500 text-sm">{step1Form.formState.errors.password.message}</p>
                  )}
                </div>

                <div>
                  <Label htmlFor="confirmPassword">Confirm Password</Label>
                  <Input
                    id="confirmPassword"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Confirm your password"
                    {...step1Form.register('confirmPassword')}
                    className={step1Form.formState.errors.confirmPassword ? 'border-red-500' : ''}
                  />
                  {step1Form.formState.errors.confirmPassword && (
                    <p className="text-red-500 text-sm">{step1Form.formState.errors.confirmPassword.message}</p>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="birthDate">Birth Date</Label>
                  <Input
                    id="birthDate"
                    type="date"
                    {...step1Form.register('birthDate')}
                    className={step1Form.formState.errors.birthDate ? 'border-red-500' : ''}
                  />
                  {step1Form.formState.errors.birthDate && (
                    <p className="text-red-500 text-sm">{step1Form.formState.errors.birthDate.message}</p>
                  )}
                </div>

                <div>
                  <Label htmlFor="gender">Gender</Label>
                  <Select onValueChange={(value) => step1Form.setValue('gender', value as any)}>
                    <SelectTrigger className={step1Form.formState.errors.gender ? 'border-red-500' : ''}>
                      <SelectValue placeholder="Select gender" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="male">Male</SelectItem>
                      <SelectItem value="female">Female</SelectItem>
                      <SelectItem value="non_binary">Non-binary</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                  {step1Form.formState.errors.gender && (
                    <p className="text-red-500 text-sm">{step1Form.formState.errors.gender.message}</p>
                  )}
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="showGender"
                  checked={step1Form.watch('showGender')}
                  onCheckedChange={(checked) => step1Form.setValue('showGender', checked)}
                />
                <Label htmlFor="showGender" className="text-sm">Show my gender on my profile</Label>
              </div>
            </div>
          </motion.div>
        );

      case 2:
        return (
          <motion.div
            key="step2"
            variants={stepVariants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            className="space-y-6"
          >
            <div className="text-center mb-8">
              <div className="w-20 h-20 bg-gradient-to-r from-blue-600 to-green-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <Globe className="w-10 h-10 text-white" />
              </div>
              <h2 className="text-3xl font-bold text-gray-900 mb-2">Where Are You From?</h2>
              <p className="text-gray-600">Help us find matches in your area</p>
            </div>

            <div className="space-y-4">
              <div>
                <Label htmlFor="country">Country</Label>
                <Select onValueChange={(value) => step2Form.setValue('country', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select your country" />
                  </SelectTrigger>
                  <SelectContent className="max-h-60">
                    {countries.map(country => (
                      <SelectItem key={country} value={country}>{country}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {step2Form.formState.errors.country && (
                  <p className="text-red-500 text-sm">{step2Form.formState.errors.country.message}</p>
                )}
              </div>

              <div>
                <Label htmlFor="city">City</Label>
                <Input
                  id="city"
                  placeholder="Enter your city"
                  {...step2Form.register('city')}
                  className={step2Form.formState.errors.city ? 'border-red-500' : ''}
                />
                {step2Form.formState.errors.city && (
                  <p className="text-red-500 text-sm">{step2Form.formState.errors.city.message}</p>
                )}
              </div>

              <div>
                <Label htmlFor="tribe">Tribe/Ethnicity</Label>
                <Select onValueChange={(value) => step2Form.setValue('tribe', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select your tribe/ethnicity" />
                  </SelectTrigger>
                  <SelectContent className="max-h-60">
                    {tribes.map(tribe => (
                      <SelectItem key={tribe} value={tribe}>{tribe}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {step2Form.formState.errors.tribe && (
                  <p className="text-red-500 text-sm">{step2Form.formState.errors.tribe.message}</p>
                )}
              </div>

              <div>
                <Label>Languages (Select all that apply)</Label>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {languages.map(language => (
                    <div key={language} className="flex items-center space-x-2">
                      <Checkbox
                        id={language}
                        checked={step2Form.watch('languages')?.includes(language) || false}
                        onCheckedChange={(checked) => {
                          const current = step2Form.watch('languages') || [];
                          if (checked) {
                            step2Form.setValue('languages', [...current, language]);
                          } else {
                            step2Form.setValue('languages', current.filter(l => l !== language));
                          }
                        }}
                      />
                      <Label htmlFor={language} className="text-sm">{language}</Label>
                    </div>
                  ))}
                </div>
                {step2Form.formState.errors.languages && (
                  <p className="text-red-500 text-sm">{step2Form.formState.errors.languages.message}</p>
                )}
              </div>
            </div>
          </motion.div>
        );

      case 3:
        return (
          <motion.div
            key="step3"
            variants={stepVariants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            className="space-y-6"
          >
            <div className="text-center mb-8">
              <div className="w-20 h-20 bg-gradient-to-r from-pink-600 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <Camera className="w-10 h-10 text-white" />
              </div>
              <h2 className="text-3xl font-bold text-gray-900 mb-2">Add Your Photos</h2>
              <p className="text-gray-600">Show your best self to attract matches</p>
            </div>

            <div className="space-y-4">
              <div
                {...getRootProps()}
                className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
                  isDragActive ? 'border-purple-500 bg-purple-50' : 'border-gray-300 hover:border-gray-400'
                }`}
              >
                <input {...getInputProps()} />
                <Upload className="w-12 h-12 mx-auto text-gray-400 mb-4" />
                <p className="text-gray-600 mb-2">
                  {isDragActive ? 'Drop your photos here' : 'Drag & drop your photos here'}
                </p>
                <p className="text-sm text-gray-500 mb-4">or click to browse</p>
                <Button type="button" variant="outline" aria-label="Choose photos to upload">
                  <Upload className="w-4 h-4 mr-2" />
                  Choose Photos
                </Button>
                <p className="text-xs text-gray-500 mt-4">JPG, PNG up to 5MB each • Max 6 photos</p>
              </div>

              {signupData.photos && signupData.photos.length > 0 && (
                <div>
                  <Label>Your Photos ({signupData.photos.length}/6)</Label>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
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

              <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <Sparkles className="w-5 h-5 text-purple-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <h4 className="font-semibold text-purple-900 mb-1">Photo Tips</h4>
                    <ul className="text-sm text-purple-800 space-y-1">
                      <li>• Clear, recent photos work best</li>
                      <li>• Show your face clearly</li>
                      <li>• Include full-body shots</li>
                      <li>• No filters or heavy editing</li>
                      <li>• First photo will be your main profile picture</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        );

      case 4:
        return (
          <motion.div
            key="step4"
            variants={stepVariants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            className="space-y-6"
          >
            <div className="text-center mb-8">
              <div className="w-20 h-20 bg-gradient-to-r from-red-600 to-pink-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <Heart className="w-10 h-10 text-white" />
              </div>
              <h2 className="text-3xl font-bold text-gray-900 mb-2">About You</h2>
              <p className="text-gray-600">Tell us what makes you unique</p>
            </div>

            <div className="space-y-4">
              <div>
                <Label htmlFor="bio">Bio</Label>
                <Textarea
                  id="bio"
                  placeholder="Tell us about yourself... What are you passionate about? What are you looking for?"
                  rows={4}
                  {...step4Form.register('bio')}
                  className={step4Form.formState.errors.bio ? 'border-red-500' : ''}
                />
                <div className="flex justify-between text-sm text-gray-500 mt-1">
                  <span>{step4Form.watch('bio')?.length || 0}/500</span>
                </div>
                {step4Form.formState.errors.bio && (
                  <p className="text-red-500 text-sm">{step4Form.formState.errors.bio.message}</p>
                )}
              </div>

              <div>
                <Label>Interests (Select at least 3)</Label>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {interests.map(interest => (
                    <div key={interest.name} className="flex items-center space-x-2">
                      <Checkbox
                        id={interest.name}
                        checked={step4Form.watch('interests')?.includes(interest.name) || false}
                        onCheckedChange={(checked) => {
                          const current = step4Form.watch('interests') || [];
                          if (checked) {
                            step4Form.setValue('interests', [...current, interest.name]);
                          } else {
                            step4Form.setValue('interests', current.filter(i => i !== interest.name));
                          }
                        }}
                      />
                      <Label htmlFor={interest.name} className="text-sm flex items-center gap-1">
                        <span>{interest.icon}</span>
                        {interest.name}
                      </Label>
                    </div>
                  ))}
                </div>
                {step4Form.formState.errors.interests && (
                  <p className="text-red-500 text-sm">{step4Form.formState.errors.interests.message}</p>
                )}
              </div>

              <div>
                <Label htmlFor="relationshipIntention">What Are You Looking For?</Label>
                <Select onValueChange={(value) => step4Form.setValue('relationshipIntention', value as any)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select your relationship intention" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="looking_for_love">💕 Looking for Love</SelectItem>
                    <SelectItem value="serious_only">💍 Serious Relationship Only</SelectItem>
                    <SelectItem value="friends_first">🤝 Friends First</SelectItem>
                    <SelectItem value="sugar_daddy">💰 Sugar Daddy</SelectItem>
                    <SelectItem value="sugar_mommy">💰 Sugar Mommy</SelectItem>
                  </SelectContent>
                </Select>
                {step4Form.formState.errors.relationshipIntention && (
                  <p className="text-red-500 text-sm">{step4Form.formState.errors.relationshipIntention.message}</p>
                )}
              </div>
            </div>
          </motion.div>
        );

      case 5:
        return (
          <motion.div
            key="step5"
            variants={stepVariants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            className="space-y-6"
          >
            <div className="text-center mb-8">
              <div className="w-20 h-20 bg-gradient-to-r from-green-600 to-blue-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <Briefcase className="w-10 h-10 text-white" />
              </div>
              <h2 className="text-3xl font-bold text-gray-900 mb-2">Lifestyle Details</h2>
              <p className="text-gray-600">Help us understand your lifestyle better</p>
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="height">Height</Label>
                  <Select onValueChange={(value) => step5Form.setValue('height', value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select height" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="150">150cm</SelectItem>
                      <SelectItem value="155">155cm</SelectItem>
                      <SelectItem value="160">160cm</SelectItem>
                      <SelectItem value="165">165cm</SelectItem>
                      <SelectItem value="170">170cm</SelectItem>
                      <SelectItem value="175">175cm</SelectItem>
                      <SelectItem value="180">180cm</SelectItem>
                      <SelectItem value="185">185cm</SelectItem>
                      <SelectItem value="190">190cm</SelectItem>
                      <SelectItem value="195">195cm</SelectItem>
                      <SelectItem value="200">200cm+</SelectItem>
                    </SelectContent>
                  </Select>
                  {step5Form.formState.errors.height && (
                    <p className="text-red-500 text-sm">{step5Form.formState.errors.height.message}</p>
                  )}
                </div>

                <div>
                  <Label htmlFor="education">Education</Label>
                  <Select onValueChange={(value) => step5Form.setValue('education', value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select education" />
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
                  {step5Form.formState.errors.education && (
                    <p className="text-red-500 text-sm">{step5Form.formState.errors.education.message}</p>
                  )}
                </div>
              </div>

              <div>
                <Label htmlFor="occupation">Occupation</Label>
                <Input
                  id="occupation"
                  placeholder="What do you do for work?"
                  {...step5Form.register('occupation')}
                  className={step5Form.formState.errors.occupation ? 'border-red-500' : ''}
                />
                {step5Form.formState.errors.occupation && (
                  <p className="text-red-500 text-sm">{step5Form.formState.errors.occupation.message}</p>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="drinking">Drinking</Label>
                  <Select onValueChange={(value) => step5Form.setValue('drinking', value as any)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select drinking habits" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="never">🚫 Never</SelectItem>
                      <SelectItem value="socially">🍷 Socially</SelectItem>
                      <SelectItem value="regularly">🍺 Regularly</SelectItem>
                    </SelectContent>
                  </Select>
                  {step5Form.formState.errors.drinking && (
                    <p className="text-red-500 text-sm">{step5Form.formState.errors.drinking.message}</p>
                  )}
                </div>

                <div>
                  <Label htmlFor="smoking">Smoking</Label>
                  <Select onValueChange={(value) => step5Form.setValue('smoking', value as any)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select smoking habits" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="never">🚫 Never</SelectItem>
                      <SelectItem value="socially">🚬 Socially</SelectItem>
                      <SelectItem value="regularly">🚬 Regularly</SelectItem>
                    </SelectContent>
                  </Select>
                  {step5Form.formState.errors.smoking && (
                    <p className="text-red-500 text-sm">{step5Form.formState.errors.smoking.message}</p>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="kids">Kids</Label>
                  <Select onValueChange={(value) => step5Form.setValue('kids', value as any)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select preference" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="dont_want">🚫 Don't want kids</SelectItem>
                      <SelectItem value="want_someday">👶 Want someday</SelectItem>
                      <SelectItem value="have_kids">👨‍👩‍👧‍👦 Have kids</SelectItem>
                      <SelectItem value="open_to_kids">🤗 Open to kids</SelectItem>
                    </SelectContent>
                  </Select>
                  {step5Form.formState.errors.kids && (
                    <p className="text-red-500 text-sm">{step5Form.formState.errors.kids.message}</p>
                  )}
                </div>

                <div>
                  <Label htmlFor="religion">Religion</Label>
                  <Select onValueChange={(value) => step5Form.setValue('religion', value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select religion" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Christian">✝️ Christian</SelectItem>
                      <SelectItem value="Muslim">☪️ Muslim</SelectItem>
                      <SelectItem value="Hindu">🕉️ Hindu</SelectItem>
                      <SelectItem value="Buddhist">☸️ Buddhist</SelectItem>
                      <SelectItem value="Jewish">✡️ Jewish</SelectItem>
                      <SelectItem value="Spiritual">🧘 Spiritual</SelectItem>
                      <SelectItem value="Agnostic">❓ Agnostic</SelectItem>
                      <SelectItem value="Atheist">🚫 Atheist</SelectItem>
                      <SelectItem value="Other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                  {step5Form.formState.errors.religion && (
                    <p className="text-red-500 text-sm">{step5Form.formState.errors.religion.message}</p>
                  )}
                </div>
              </div>
            </div>
          </motion.div>
        );

      case 6:
        return (
          <motion.div
            key="step6"
            variants={stepVariants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            className="space-y-6"
          >
            <div className="text-center mb-8">
              <div className="w-20 h-20 bg-gradient-to-r from-purple-600 to-indigo-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <Music className="w-10 h-10 text-white" />
              </div>
              <h2 className="text-3xl font-bold text-gray-900 mb-2">Connect Your Socials</h2>
              <p className="text-gray-600">Optional - Help others find you</p>
            </div>

            <div className="space-y-4">
              <div>
                <Label htmlFor="instagram">Instagram Username (Optional)</Label>
                <Input
                  id="instagram"
                  placeholder="@yourusername"
                  {...step6Form.register('instagram')}
                  className={step6Form.formState.errors.instagram ? 'border-red-500' : ''}
                />
                {step6Form.formState.errors.instagram && (
                  <p className="text-red-500 text-sm">{step6Form.formState.errors.instagram.message}</p>
                )}
              </div>

              <div>
                <Label htmlFor="spotify">Spotify Profile (Optional)</Label>
                <Input
                  id="spotify"
                  placeholder="Your Spotify profile URL"
                  {...step6Form.register('spotify')}
                  className={step6Form.formState.errors.spotify ? 'border-red-500' : ''}
                />
                {step6Form.formState.errors.spotify && (
                  <p className="text-red-500 text-sm">{step6Form.formState.errors.spotify.message}</p>
                )}
              </div>

              <div className="bg-gradient-to-r from-purple-50 to-pink-50 border border-purple-200 rounded-lg p-6">
                <div className="text-center">
                  <Star className="w-12 h-12 text-purple-600 mx-auto mb-4" />
                  <h3 className="text-xl font-bold text-gray-900 mb-2">You're All Set! 🎉</h3>
                  <p className="text-gray-600 mb-4">
                    Your profile is ready to go. Click "Create Account" to join LoveX and start meeting amazing people!
                  </p>
                  <div className="flex items-center justify-center gap-2 text-sm text-purple-600">
                    <Shield className="w-4 h-4" />
                    <span>Your information is secure and private</span>
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
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <Button
            variant="ghost"
            onClick={() => navigate('/auth')}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Login
          </Button>
          
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-900">Join LoveX</h1>
            <p className="text-sm text-gray-600">Where East African Hearts Connect</p>
          </div>
          
          <div className="w-20" /> {/* Spacer for centering */}
        </div>

        {/* Progress Bar */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-700">Step {currentStep} of {totalSteps}</span>
            <span className="text-sm font-medium text-purple-600">{Math.round(progress)}% Complete</span>
          </div>
          <Progress value={progress} className="h-3" />
          <div className="flex justify-between mt-2">
            {Array.from({ length: totalSteps }, (_, i) => (
              <div
                key={i}
                className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-medium ${
                  i + 1 <= currentStep
                    ? 'bg-purple-600 text-white'
                    : 'bg-gray-200 text-gray-500'
                }`}
              >
                {i + 1}
              </div>
            ))}
          </div>
        </div>

        {/* Main Content */}
        <Card className="max-w-4xl mx-auto shadow-xl">
          <CardContent className="p-8">
            <AnimatePresence mode="wait">
              {renderStep()}
            </AnimatePresence>
            
            {/* Navigation */}
            <div className="flex justify-between mt-8">
              <Button
                variant="outline"
                onClick={() => setCurrentStep(Math.max(1, currentStep - 1))}
                disabled={currentStep === 1}
                className="flex items-center gap-2"
              >
                <ArrowLeft className="w-4 h-4" />
                Previous
              </Button>
              
              <Button
                onClick={validateAndProceed}
                disabled={isLoading}
                className="flex items-center gap-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white hover:from-purple-700 hover:to-pink-700 px-8"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Creating Account...
                  </>
                ) : currentStep === totalSteps ? (
                  <>
                    <Sparkles className="w-4 h-4 mr-2" />
                    Create Account
                  </>
                ) : (
                  <>
                    {currentStep === totalSteps - 1 ? 'Review' : 'Next'}
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
            <a href="/terms" className="text-purple-600 hover:text-purple-700 underline">
              Terms of Service
            </a>{' '}
            and{' '}
            <a href="/privacy" className="text-purple-600 hover:text-purple-700 underline">
              Privacy Policy
            </a>
          </p>
        </div>
      </div>
    </div>
  );
};

export default ModernSignupFlow;

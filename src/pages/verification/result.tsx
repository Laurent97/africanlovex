import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  CheckCircle, 
  AlertCircle, 
  ArrowRight,
  RefreshCw,
  Shield,
  Star,
  Crown,
  Eye,
  Brain,
  Heart,
  Users,
  TrendingUp
} from 'lucide-react';
import { useAuth } from '../../hooks/use-auth';
import { useVerification } from '../../hooks/use-verification';
import VerificationBadge from '../../components/verification/VerificationBadge';
import type { VerificationResult, VerificationLevel } from '../../types/verification';

const VerificationResultPage: React.FC = () => {
  const { verificationId } = useParams<{ verificationId: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  const { status, retryVerification } = useVerification(user?.id);
  
  const [result, setResult] = useState<VerificationResult | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Simulate getting verification result
    // In a real app, this would fetch the actual result from the database
    const mockResult: VerificationResult = {
      approved: Math.random() > 0.3, // 70% success rate for demo
      confidence: Math.random() * 0.3 + 0.7, // 0.7-1.0 confidence
      badgeLevel: (['basic', 'premium', 'golden'] as VerificationLevel[])[Math.floor(Math.random() * 3)],
      reason: Math.random() > 0.3 ? undefined : 'Face could not be properly detected in all photos',
      details: {
        samePerson: Math.random() > 0.1,
        livenessScore: Math.random() * 0.2 + 0.8,
        poseScores: {
          neutral: Math.random() * 0.3 + 0.7,
          left: Math.random() * 0.3 + 0.7,
          right: Math.random() * 0.3 + 0.7,
          smile: Math.random() * 0.3 + 0.7,
          wink: Math.random() * 0.3 + 0.7
        },
        profileMatch: Math.random() * 0.3 + 0.7
      }
    };

    setTimeout(() => {
      setResult(mockResult);
      setLoading(false);
    }, 1000);
  }, [verificationId]);

  const handleRetry = async () => {
    try {
      await retryVerification();
      navigate('/verification/capture');
    } catch (err) {
      console.error('Failed to retry verification:', err);
    }
  };

  const handleContinue = () => {
    navigate('/dashboard');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-purple-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading verification result...</p>
        </div>
      </div>
    );
  }

  if (!result) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-50 flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Result Not Found</h2>
          <p className="text-gray-600 mb-4">Unable to load verification result</p>
          <button
            onClick={() => navigate('/verification')}
            className="px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
          >
            Back to Verification
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-50">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          {/* Result Header */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-8"
          >
            <div className="flex items-center justify-center mb-4">
              {result.approved ? (
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: "spring", duration: 0.5 }}
                  className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center"
                >
                  <CheckCircle className="w-8 h-8 text-green-600" />
                </motion.div>
              ) : (
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: "spring", duration: 0.5 }}
                  className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center"
                >
                  <AlertCircle className="w-8 h-8 text-red-600" />
                </motion.div>
              )}
            </div>
            
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              {result.approved ? 'Verification Successful!' : 'Verification Failed'}
            </h1>
            
            <p className="text-gray-600">
              {result.approved 
                ? `You've earned the ${result.badgeLevel} verification badge!`
                : result.reason || 'Verification could not be completed'
              }
            </p>

            {result.approved && (
              <div className="mt-4">
                <VerificationBadge level={result.badgeLevel!} size="lg" animated={true} />
              </div>
            )}
          </motion.div>

          {/* Result Details */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="grid md:grid-cols-2 gap-6 mb-8"
          >
            {/* Verification Score */}
            <div className="bg-white rounded-xl p-6 shadow-lg">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Verification Score</h3>
              
              <div className="mb-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-gray-600">Overall Confidence</span>
                  <span className="text-sm font-medium text-purple-600">
                    {Math.round(result.confidence * 100)}%
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-3">
                  <motion.div
                    className={`h-3 rounded-full ${
                      result.confidence > 0.9 
                        ? 'bg-gradient-to-r from-yellow-400 to-yellow-600'
                        : result.confidence > 0.8
                          ? 'bg-gradient-to-r from-purple-400 to-purple-600'
                          : 'bg-gradient-to-r from-blue-400 to-blue-600'
                    }`}
                    initial={{ width: 0 }}
                    animate={{ width: `${result.confidence * 100}%` }}
                    transition={{ duration: 1, delay: 0.5 }}
                  />
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Users className="w-4 h-4 text-gray-400" />
                    <span className="text-sm text-gray-600">Same Person</span>
                  </div>
                  <span className={`text-sm font-medium ${
                    result.details.samePerson ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {result.details.samePerson ? 'Passed' : 'Failed'}
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Eye className="w-4 h-4 text-gray-400" />
                    <span className="text-sm text-gray-600">Liveness Check</span>
                  </div>
                  <span className={`text-sm font-medium ${
                    result.details.livenessScore > 0.8 ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {Math.round(result.details.livenessScore * 100)}%
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Heart className="w-4 h-4 text-gray-400" />
                    <span className="text-sm text-gray-600">Profile Match</span>
                  </div>
                  <span className={`text-sm font-medium ${
                    result.details.profileMatch > 0.6 ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {Math.round(result.details.profileMatch * 100)}%
                  </span>
                </div>
              </div>
            </div>

            {/* Pose Performance */}
            <div className="bg-white rounded-xl p-6 shadow-lg">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Pose Performance</h3>
              
              <div className="space-y-3">
                {Object.entries(result.details.poseScores).map(([pose, score]) => {
                  const poseNames = {
                    neutral: 'Looking Straight',
                    left: 'Head Left',
                    right: 'Head Right',
                    smile: 'Smiling',
                    wink: 'Winking'
                  };

                  return (
                    <div key={pose} className="space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">{poseNames[pose as keyof typeof poseNames]}</span>
                        <span className="text-sm font-medium text-purple-600">
                          {Math.round(score * 100)}%
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <motion.div
                          className="bg-purple-600 h-2 rounded-full"
                          initial={{ width: 0 }}
                          animate={{ width: `${score * 100}%` }}
                          transition={{ duration: 0.5, delay: 0.8 + (Object.keys(result.details.poseScores).indexOf(pose) * 0.1) }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </motion.div>

          {/* Benefits or Next Steps */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="bg-white rounded-xl p-6 shadow-lg mb-8"
          >
            {result.approved ? (
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Your New Benefits</h3>
                
                <div className="grid md:grid-cols-2 gap-4">
                  {[
                    {
                      icon: Shield,
                      title: 'Increased Trust',
                      description: 'Other users will trust you more with your verified badge'
                    },
                    {
                      icon: TrendingUp,
                      title: 'Better Matches',
                      description: 'Get prioritized in matching algorithms'
                    },
                    {
                      icon: Users,
                      title: 'More Visibility',
                      description: 'Your profile will be shown to more users'
                    },
                    {
                      icon: Star,
                      title: 'Premium Features',
                      description: 'Access to exclusive verification-only features'
                    }
                  ].map((benefit, index) => (
                    <div key={index} className="flex items-start gap-3">
                      <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center flex-shrink-0">
                        <benefit.icon className="w-5 h-5 text-purple-600" />
                      </div>
                      <div>
                        <h4 className="font-medium text-gray-900">{benefit.title}</h4>
                        <p className="text-sm text-gray-600">{benefit.description}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">What to Do Next</h3>
                
                <div className="space-y-4">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 bg-yellow-100 rounded-lg flex items-center justify-center flex-shrink-0">
                      <Brain className="w-5 h-5 text-yellow-600" />
                    </div>
                    <div>
                      <h4 className="font-medium text-gray-900">Check Your Photos</h4>
                      <p className="text-sm text-gray-600">
                        Make sure your face is clearly visible and well-lit in all photos
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 bg-yellow-100 rounded-lg flex items-center justify-center flex-shrink-0">
                      <Eye className="w-5 h-5 text-yellow-600" />
                    </div>
                    <div>
                      <h4 className="font-medium text-gray-900">Follow Instructions</h4>
                      <p className="text-sm text-gray-600">
                        Carefully follow the pose instructions for each photo
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 bg-yellow-100 rounded-lg flex items-center justify-center flex-shrink-0">
                      <RefreshCw className="w-5 h-5 text-yellow-600" />
                    </div>
                    <div>
                      <h4 className="font-medium text-gray-900">Try Again</h4>
                      <p className="text-sm text-gray-600">
                        You can retry verification after a short cooldown period
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </motion.div>

          {/* Action Buttons */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className="flex flex-col sm:flex-row gap-4 justify-center"
          >
            {result.approved ? (
              <button
                onClick={handleContinue}
                className="inline-flex items-center gap-2 px-8 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white font-semibold rounded-xl hover:from-purple-700 hover:to-pink-700 transition-all transform hover:scale-105"
              >
                Continue to Dashboard
                <ArrowRight className="w-5 h-5" />
              </button>
            ) : (
              <>
                <button
                  onClick={handleRetry}
                  className="inline-flex items-center gap-2 px-8 py-3 bg-purple-600 text-white font-semibold rounded-xl hover:bg-purple-700 transition-colors"
                >
                  <RefreshCw className="w-5 h-5" />
                  Try Again
                </button>
                
                <button
                  onClick={() => navigate('/dashboard')}
                  className="px-8 py-3 bg-gray-200 text-gray-700 font-semibold rounded-xl hover:bg-gray-300 transition-colors"
                >
                  Skip for Now
                </button>
              </>
            )}
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default VerificationResultPage;

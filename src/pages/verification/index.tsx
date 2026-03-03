import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { 
  Shield, 
  CheckCircle, 
  Star, 
  Crown, 
  AlertCircle,
  ArrowRight,
  Clock,
  UserCheck,
  Lock,
  Eye,
  Camera
} from 'lucide-react';
import { useAuth } from '../../hooks/use-auth';
import { useVerification } from '../../hooks/use-verification';
import VerificationBadge from '../../components/verification/VerificationBadge';
import { VerificationStatus, VerificationLevel } from '../../types/verification';

const VerificationHub: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { status, loading, error, startVerification } = useVerification(user?.id);
  
  const [isStarting, setIsStarting] = useState(false);

  const handleStartVerification = async () => {
    if (!user) return;
    
    setIsStarting(true);
    try {
      const verificationId = await startVerification();
      navigate(`/verification/capture/${verificationId}`);
    } catch (err) {
      console.error('Failed to start verification:', err);
    } finally {
      setIsStarting(false);
    }
  };

  const getVerificationStatusInfo = () => {
    if (!status) return null;

    switch (status.badge_type) {
      case 'golden':
        return {
          icon: Crown,
          title: 'Golden Verified',
          description: 'Highest level of trust - complete identity verification',
          color: 'text-yellow-500',
          bg: 'bg-yellow-50 border-yellow-200',
          benefits: [
            'Unlimited matches',
            'Priority profile placement',
            'Advanced search filters',
            'Exclusive events access',
            'Golden profile badge'
          ]
        };
      case 'premium':
        return {
          icon: Star,
          title: 'Premium Verified',
          description: 'Enhanced trust with photo verification',
          color: 'text-purple-500',
          bg: 'bg-purple-50 border-purple-200',
          benefits: [
            'More profile visibility',
            'Extended search options',
            'Verified badge',
            'Priority support'
          ]
        };
      case 'basic':
        return {
          icon: CheckCircle,
          title: 'Basic Verified',
          description: 'Photo verified identity',
          color: 'text-blue-500',
          bg: 'bg-blue-50 border-blue-200',
          benefits: [
            'Verified badge',
            'Increased trust',
            'Better matching'
          ]
        };
      default:
        return null;
    }
  };

  const verificationInfo = getVerificationStatusInfo();

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-purple-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading verification status...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-50">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <div className="flex items-center justify-center mb-4">
            <Shield className="w-12 h-12 text-purple-600 mr-3" />
            <h1 className="text-4xl font-bold text-gray-900">Profile Verification</h1>
          </div>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Get verified to build trust and unlock premium features on LoveX
          </p>
        </motion.div>

        {/* Current Status */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2 }}
          className="max-w-4xl mx-auto mb-8"
        >
          {status?.is_verified && verificationInfo ? (
            <div className={`rounded-2xl border-2 p-8 ${verificationInfo.bg}`}>
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-4">
                  <div className={`p-3 rounded-full bg-white shadow-lg`}>
                    <verificationInfo.icon className={`w-8 h-8 ${verificationInfo.color}`} />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900">{verificationInfo.title}</h2>
                    <p className="text-gray-600">{verificationInfo.description}</p>
                  </div>
                </div>
                <VerificationBadge level={status.badge_type!} size="lg" />
              </div>

              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <h3 className="font-semibold text-gray-900 mb-3">Benefits:</h3>
                  <ul className="space-y-2">
                    {verificationInfo.benefits.map((benefit, index) => (
                      <li key={index} className="flex items-center gap-2 text-gray-700">
                        <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0" />
                        {benefit}
                      </li>
                    ))}
                  </ul>
                </div>
                
                <div>
                  <h3 className="font-semibold text-gray-900 mb-3">Verification Details:</h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Verified on:</span>
                      <span className="text-gray-900">
                        {status.verified_at ? new Date(status.verified_at).toLocaleDateString() : 'N/A'}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Badge level:</span>
                      <span className={`font-semibold ${verificationInfo.color}`}>
                        {status.badge_type?.charAt(0).toUpperCase() + status.badge_type?.slice(1)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Total attempts:</span>
                      <span className="text-gray-900">{status.attempt_count}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-2xl border-2 border-gray-200 p-8 text-center">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <UserCheck className="w-8 h-8 text-gray-400" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Not Verified Yet</h2>
              <p className="text-gray-600 mb-6">
                Get verified to increase your profile visibility and build trust with other users
              </p>
              
              {status?.pending_attempt ? (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
                  <div className="flex items-center gap-2 text-yellow-800">
                    <Clock className="w-5 h-5" />
                    <span className="font-medium">Verification in progress</span>
                  </div>
                  <p className="text-yellow-700 text-sm mt-1">
                    Your verification is being processed. This usually takes a few minutes.
                  </p>
                </div>
              ) : null}
            </div>
          )}
        </motion.div>

        {/* Verification Options */}
        {!status?.is_verified && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="max-w-4xl mx-auto"
          >
            <div className="grid md:grid-cols-3 gap-6 mb-8">
              {/* Basic Verification */}
              <div className="bg-white rounded-xl border border-gray-200 p-6 hover:shadow-lg transition-shadow">
                <div className="flex items-center justify-between mb-4">
                  <CheckCircle className="w-8 h-8 text-blue-500" />
                  <span className="text-sm text-gray-500">Required</span>
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Basic Verification</h3>
                <p className="text-gray-600 text-sm mb-4">
                  Photo verification with pose detection
                </p>
                <ul className="space-y-1 text-sm text-gray-600 mb-4">
                  <li>• 4 pose photos</li>
                  <li>• AI verification</li>
                  <li>• Basic badge</li>
                </ul>
              </div>

              {/* Premium Verification */}
              <div className="bg-white rounded-xl border border-gray-200 p-6 hover:shadow-lg transition-shadow relative">
                <div className="absolute -top-2 -right-2 bg-purple-600 text-white text-xs px-2 py-1 rounded-full">
                  Popular
                </div>
                <div className="flex items-center justify-between mb-4">
                  <Star className="w-8 h-8 text-purple-500" />
                  <span className="text-sm text-gray-500">Recommended</span>
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Premium Verification</h3>
                <p className="text-gray-600 text-sm mb-4">
                  Enhanced verification with liveness detection
                </p>
                <ul className="space-y-1 text-sm text-gray-600 mb-4">
                  <li>• All basic features</li>
                  <li>• Liveness detection</li>
                  <li>• Premium badge</li>
                  <li>• Priority support</li>
                </ul>
              </div>

              {/* Golden Verification */}
              <div className="bg-white rounded-xl border border-gray-200 p-6 hover:shadow-lg transition-shadow">
                <div className="flex items-center justify-between mb-4">
                  <Crown className="w-8 h-8 text-yellow-500" />
                  <span className="text-sm text-gray-500">Premium</span>
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Golden Verification</h3>
                <p className="text-gray-600 text-sm mb-4">
                  Highest level verification with all checks
                </p>
                <ul className="space-y-1 text-sm text-gray-600 mb-4">
                  <li>• All premium features</li>
                  <li>• Advanced AI checks</li>
                  <li>• Golden badge</li>
                  <li>• Exclusive benefits</li>
                </ul>
              </div>
            </div>

            {/* Start Verification Button */}
            <div className="text-center">
              <button
                onClick={handleStartVerification}
                disabled={isStarting || status?.pending_attempt}
                className="inline-flex items-center gap-3 px-8 py-4 bg-gradient-to-r from-purple-600 to-pink-600 text-white font-semibold rounded-xl hover:from-purple-700 hover:to-pink-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all transform hover:scale-105"
              >
                {isStarting ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    Starting Verification...
                  </>
                ) : (
                  <>
                    <Camera className="w-5 h-5" />
                    Start Verification
                    <ArrowRight className="w-5 h-5" />
                  </>
                )}
              </button>
              
              <p className="text-gray-500 text-sm mt-3">
                Takes about 2-3 minutes • Camera required
              </p>
            </div>
          </motion.div>
        )}

        {/* How it Works */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="max-w-4xl mx-auto mt-12"
        >
          <h3 className="text-2xl font-bold text-gray-900 text-center mb-8">How Verification Works</h3>
          
          <div className="grid md:grid-cols-4 gap-6">
            {[
              {
                icon: Camera,
                title: 'Capture Photos',
                description: 'Take 4-5 photos in different poses'
              },
              {
                icon: Eye,
                title: 'AI Analysis',
                description: 'Our AI verifies your identity and liveness'
              },
              {
                icon: Lock,
                title: 'Secure Processing',
                description: 'All photos are encrypted and processed securely'
              },
              {
                icon: Shield,
                title: 'Get Verified',
                description: 'Receive your badge based on verification quality'
              }
            ].map((step, index) => (
              <div key={index} className="text-center">
                <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <step.icon className="w-8 h-8 text-purple-600" />
                </div>
                <h4 className="font-semibold text-gray-900 mb-2">{step.title}</h4>
                <p className="text-gray-600 text-sm">{step.description}</p>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Privacy & Security */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8 }}
          className="max-w-4xl mx-auto mt-12"
        >
          <div className="bg-blue-50 rounded-xl p-6 border border-blue-200">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
              <div>
                <h4 className="font-semibold text-blue-900 mb-2">Privacy & Security</h4>
                <ul className="text-blue-800 text-sm space-y-1">
                  <li>• Your verification photos are used only for identity verification</li>
                  <li>• Photos are encrypted and stored securely</li>
                  <li>• You can delete your verification data at any time</li>
                  <li>• We never share your verification photos with other users</li>
                </ul>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Error Display */}
        {error && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="max-w-4xl mx-auto mt-6"
          >
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-center gap-3">
              <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0" />
              <div>
                <h4 className="font-semibold text-red-900">Verification Error</h4>
                <p className="text-red-800 text-sm">{error}</p>
              </div>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default VerificationHub;

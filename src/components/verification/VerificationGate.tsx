import React from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { 
  Shield, 
  Lock, 
  AlertCircle, 
  Star, 
  Crown,
  ArrowRight,
  Camera,
  CheckCircle
} from 'lucide-react';
import { useAuth } from '../../hooks/use-auth';
import { useVerification } from '../../hooks/use-verification';
import VerificationBadge from './VerificationBadge';

interface VerificationGateProps {
  children: React.ReactNode;
  feature?: 'matching' | 'messaging' | 'live_streaming' | 'premium_features';
  fallback?: React.ReactNode;
  showUpgradePrompt?: boolean;
}

const VerificationGate: React.FC<VerificationGateProps> = ({
  children,
  feature = 'matching',
  fallback,
  showUpgradePrompt = true
}) => {
  const { user } = useAuth();
  const { status, startVerification } = useVerification(user?.id);

  // If user is verified, show the content
  if (status?.is_verified) {
    return <>{children}</>;
  }

  // Custom fallback provided
  if (fallback) {
    return <>{fallback}</>;
  }

  // Default verification gate UI
  return (
    <div className="flex items-center justify-center min-h-[400px] px-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full text-center"
      >
        {/* Lock Icon */}
        <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <Lock className="w-8 h-8 text-gray-400" />
        </div>

        <h3 className="text-xl font-bold text-gray-900 mb-2">
          Verification Required
        </h3>

        <p className="text-gray-600 mb-6">
          {getFeatureMessage(feature)}
        </p>

        {/* Verification Benefits */}
        <div className="bg-purple-50 rounded-lg p-4 mb-6">
          <h4 className="font-semibold text-purple-900 mb-3">Get Verified to Unlock:</h4>
          <ul className="space-y-2 text-left">
            {getFeatureBenefits(feature).map((benefit, index) => (
              <li key={index} className="flex items-center gap-2 text-purple-800">
                <CheckCircle className="w-4 h-4 flex-shrink-0" />
                <span className="text-sm">{benefit}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Action Buttons */}
        {showUpgradePrompt && (
          <div className="space-y-3">
            <Link
              to="/verification"
              className="inline-flex items-center gap-2 w-full px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white font-semibold rounded-xl hover:from-purple-700 hover:to-pink-700 transition-all transform hover:scale-105"
            >
              <Camera className="w-5 h-5" />
              Get Verified Now
              <ArrowRight className="w-5 h-5" />
            </Link>
            
            <button
              onClick={() => window.history.back()}
              className="w-full px-6 py-3 bg-gray-200 text-gray-700 font-semibold rounded-xl hover:bg-gray-300 transition-colors"
            >
              Go Back
            </button>
          </div>
        )}

        {/* Trust Indicators */}
        <div className="mt-6 pt-6 border-t border-gray-200">
          <div className="flex items-center justify-center gap-4 text-xs text-gray-500">
            <div className="flex items-center gap-1">
              <Shield className="w-3 h-3" />
              <span>Secure</span>
            </div>
            <div className="flex items-center gap-1">
              <Star className="w-3 h-3" />
              <span>2-3 mins</span>
            </div>
            <div className="flex items-center gap-1">
              <Crown className="w-3 h-3" />
              <span>Permanent</span>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

function getFeatureMessage(feature: string): string {
  switch (feature) {
    case 'matching':
      return 'Verify your profile to start matching with other users';
    case 'messaging':
      return 'Get verified to send and receive messages';
    case 'live_streaming':
      return 'Verification required to host or join live streams';
    case 'premium_features':
      return 'Unlock premium features by verifying your identity';
    default:
      return 'Please verify your profile to access this feature';
  }
}

function getFeatureBenefits(feature: string): string[] {
  switch (feature) {
    case 'matching':
      return [
        'Swipe and match with other users',
        'See who likes you',
        'Unlimited matches per day'
      ];
    case 'messaging':
      return [
        'Send unlimited messages',
        'Share photos and gifts',
        'Video chat with matches'
      ];
    case 'live_streaming':
      return [
        'Host your own live streams',
        'Join premium streams',
        'Receive virtual gifts'
      ];
    case 'premium_features':
      return [
        'Advanced search filters',
        'Profile visibility boost',
        'Exclusive events access'
      ];
    default:
      return [
        'Increased profile visibility',
        'Verified badge on profile',
        'Better matching algorithm'
      ];
  }
}

export default VerificationGate;

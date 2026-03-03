import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ArrowLeft, 
  ArrowRight, 
  Camera, 
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Loader2
} from 'lucide-react';
import { useAuth } from '../../hooks/use-auth';
import { useVerification } from '../../hooks/use-verification';
import CameraCapture from '../../components/verification/CameraCapture';
import { CapturedImage, PoseType, VerificationPose } from '../../types/verification';
import { POSE_INSTRUCTIONS } from '../../types/verification';

const VerificationCapture: React.FC = () => {
  const { verificationId } = useParams<{ verificationId: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  const { submitVerification, loading } = useVerification(user?.id);
  
  const [currentPoseIndex, setCurrentPoseIndex] = useState(0);
  const [capturedImages, setCapturedImages] = useState<CapturedImage[]>([]);
  const [isComplete, setIsComplete] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [poses, setPoses] = useState<VerificationPose[]>([]);

  // Default poses if not loaded from database
  const defaultPoses: PoseType[] = ['neutral', 'left', 'right', 'smile', 'wink'];

  useEffect(() => {
    // Load poses from database or use defaults
    const loadPoses = async () => {
      try {
        // In a real app, you'd fetch these from the database
        // For now, use the default poses
        const poseData: VerificationPose[] = defaultPoses.map((pose, index) => ({
          id: pose,
          pose_key: pose,
          instruction: POSE_INSTRUCTIONS[pose].text,
          icon: POSE_INSTRUCTIONS[pose].icon,
          duration_seconds: POSE_INSTRUCTIONS[pose].durationSeconds,
          guide_image_url: null,
          is_active: true,
          sort_order: index,
          created_at: new Date().toISOString()
        }));
        setPoses(poseData);
      } catch (err) {
        console.error('Failed to load poses:', err);
        setError('Failed to load verification poses');
      }
    };

    loadPoses();
  }, []);

  const currentPose = poses[currentPoseIndex]?.pose_key || defaultPoses[currentPoseIndex];
  const currentInstruction = POSE_INSTRUCTIONS[currentPose];
  const progress = ((currentPoseIndex + 1) / poses.length) * 100;

  const handleCapture = (image: CapturedImage) => {
    setError(null);
    
    const newImages = [...capturedImages, image];
    setCapturedImages(newImages);

    // Move to next pose or complete verification
    if (currentPoseIndex < poses.length - 1) {
      setTimeout(() => {
        setCurrentPoseIndex(currentPoseIndex + 1);
      }, 1000);
    } else {
      setIsComplete(true);
      handleSubmitVerification(newImages);
    }
  };

  const handleSubmitVerification = async (images: CapturedImage[]) => {
    if (!verificationId) {
      setError('Invalid verification session');
      return;
    }

    try {
      await submitVerification(images);
      navigate(`/verification/processing/${verificationId}`);
    } catch (err) {
      console.error('Failed to submit verification:', err);
      setError('Failed to submit verification. Please try again.');
    }
  };

  const handleRetryPose = () => {
    // Remove the last captured image for this pose
    const newImages = capturedImages.slice(0, -1);
    setCapturedImages(newImages);
    setError(null);
  };

  const handleGoBack = () => {
    if (currentPoseIndex > 0) {
      setCurrentPoseIndex(currentPoseIndex - 1);
      // Remove the last captured image
      const newImages = capturedImages.slice(0, -1);
      setCapturedImages(newImages);
    } else {
      navigate('/verification');
    }
  };

  const handleSkipPose = () => {
    if (currentPoseIndex < poses.length - 1) {
      setCurrentPoseIndex(currentPoseIndex + 1);
    } else {
      // Skip all remaining poses and submit with what we have
      if (capturedImages.length > 0) {
        setIsComplete(true);
        handleSubmitVerification(capturedImages);
      } else {
        setError('At least one pose is required for verification');
      }
    }
  };

  if (!verificationId) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-50 flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Invalid Verification Session</h2>
          <p className="text-gray-600 mb-4">Please start a new verification session</p>
          <button
            onClick={() => navigate('/verification')}
            className="px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
          >
            Go to Verification
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-50">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <button
            onClick={handleGoBack}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            Back
          </button>
          
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-900">Photo Verification</h1>
            <p className="text-gray-600">Pose {currentPoseIndex + 1} of {poses.length}</p>
          </div>

          <div className="w-20"></div> {/* Spacer for centering */}
        </div>

        {/* Progress Bar */}
        <div className="max-w-2xl mx-auto mb-8">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-600">Progress</span>
            <span className="text-sm font-medium text-purple-600">{Math.round(progress)}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <motion.div
              className="bg-gradient-to-r from-purple-600 to-pink-600 h-2 rounded-full"
              initial={{ width: '0%' }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.5 }}
            />
          </div>
        </div>

        {/* Pose Instructions */}
        <motion.div
          key={currentPose}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          className="max-w-2xl mx-auto mb-8"
        >
          <div className="bg-white rounded-xl p-6 shadow-lg">
            <div className="flex items-center gap-4 mb-4">
              <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center">
                <span className="text-3xl">{currentInstruction.icon}</span>
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-900">{currentInstruction.text}</h2>
                <p className="text-gray-600">{currentInstruction.tip}</p>
              </div>
            </div>
            
            {/* Pose Timeline */}
            <div className="flex items-center gap-2 mt-6">
              {poses.map((pose, index) => {
                const poseKey = pose.pose_key || defaultPoses[index];
                const instruction = POSE_INSTRUCTIONS[poseKey];
                const isCompleted = index < currentPoseIndex;
                const isCurrent = index === currentPoseIndex;
                
                return (
                  <div key={pose.id || index} className="flex items-center">
                    <div
                      className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors ${
                        isCompleted 
                          ? 'bg-green-500 text-white' 
                          : isCurrent 
                            ? 'bg-purple-600 text-white' 
                            : 'bg-gray-200 text-gray-400'
                      }`}
                    >
                      {isCompleted ? (
                        <CheckCircle2 className="w-5 h-5" />
                      ) : (
                        <span className="text-lg">{instruction.icon}</span>
                      )}
                    </div>
                    {index < poses.length - 1 && (
                      <div
                        className={`w-8 h-0.5 mx-2 transition-colors ${
                          isCompleted ? 'bg-green-500' : 'bg-gray-200'
                        }`}
                      />
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </motion.div>

        {/* Camera Capture */}
        <div className="max-w-4xl mx-auto mb-8">
          <CameraCapture
            onCapture={handleCapture}
            pose={currentPose}
            isActive={!isComplete}
            showOverlay={true}
            mirror={true}
          />
        </div>

        {/* Controls */}
        <div className="max-w-2xl mx-auto">
          <div className="flex items-center justify-between">
            <button
              onClick={handleRetryPose}
              disabled={capturedImages.length === 0 || isComplete}
              className="flex items-center gap-2 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <RefreshCw className="w-4 h-4" />
              Retry Pose
            </button>

            <button
              onClick={handleSkipPose}
              disabled={isComplete}
              className="px-4 py-2 text-gray-600 hover:text-gray-900 transition-colors"
            >
              Skip Pose
            </button>
          </div>
        </div>

        {/* Error Display */}
        <AnimatePresence>
          {error && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="max-w-2xl mx-auto mt-6"
            >
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-center gap-3">
                <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0" />
                <div>
                  <h4 className="font-semibold text-red-900">Error</h4>
                  <p className="text-red-800 text-sm">{error}</p>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Loading Overlay */}
        {isComplete && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-white rounded-xl p-8 text-center max-w-md"
            >
              <Loader2 className="w-16 h-16 text-purple-600 mx-auto mb-4 animate-spin" />
              <h3 className="text-xl font-bold text-gray-900 mb-2">Processing Verification</h3>
              <p className="text-gray-600 mb-4">
                Analyzing your photos and verifying your identity...
              </p>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <motion.div
                  className="bg-gradient-to-r from-purple-600 to-pink-600 h-2 rounded-full"
                  animate={{ width: ['0%', '100%'] }}
                  transition={{ duration: 3, ease: 'easeInOut' }}
                />
              </div>
            </motion.div>
          </div>
        )}
      </div>
    </div>
  );
};

export default VerificationCapture;

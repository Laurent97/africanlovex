import React, { useRef, useState, useEffect, useCallback } from 'react';
import Webcam from 'react-webcam';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Camera, 
  CameraOff, 
  RefreshCw, 
  AlertCircle,
  CheckCircle2,
  Zap
} from 'lucide-react';
import { 
  CameraCaptureProps, 
  PoseDetectionState, 
  CapturedImage,
  PoseType,
  VERIFICATION_CONSTANTS 
} from '../../types/verification';
import { faceDetectionService } from '../../services/faceDetection';
import { POSE_INSTRUCTIONS } from '../../types/verification';

const CameraCapture: React.FC<CameraCaptureProps> = ({
  onCapture,
  pose,
  isActive,
  showOverlay = true,
  mirror = true
}) => {
  const webcamRef = useRef<Webcam>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const detectionIntervalRef = useRef<NodeJS.Timeout>();
  
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [hasPermission, setHasPermission] = useState(false);
  const [isDetecting, setIsDetecting] = useState(false);
  const [detectionState, setDetectionState] = useState<PoseDetectionState>({
    isDetecting: false,
    currentPose: pose,
    isPoseMatched: false,
    confidence: 0,
    countdown: 0,
    progress: 0
  });
  const [lighting, setLighting] = useState<{ isGood: boolean; brightness: number }>({ isGood: true, brightness: 0 });
  const [error, setError] = useState<string | null>(null);
  const [devices, setDevices] = useState<MediaDeviceInfo[]>([]);
  const [currentDeviceId, setCurrentDeviceId] = useState<string>('');

  // Initialize camera
  const startCamera = useCallback(async () => {
    try {
      setError(null);
      
      // Check if mediaDevices is supported
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('Camera API not supported in this browser');
      }

      // Try different camera configurations
      const configs = [
        {
          video: {
            facingMode: 'user',
            width: { ideal: 640 },
            height: { ideal: 480 }
          }
        },
        {
          video: {
            facingMode: 'user'
          }
        },
        {
          video: true
        }
      ];

      let mediaStream: MediaStream | null = null;
      let lastError: Error | null = null;

      // Try each configuration
      for (const config of configs) {
        try {
          console.log('Trying camera config:', config);
          mediaStream = await navigator.mediaDevices.getUserMedia(config);
          break; // Success, exit the loop
        } catch (err) {
          console.warn('Camera config failed:', config, err);
          lastError = err as Error;
          continue;
        }
      }

      if (!mediaStream) {
        throw lastError || new Error('Failed to access camera');
      }

      setStream(mediaStream);
      setHasPermission(true);

      // Get available devices
      try {
        const deviceList = await navigator.mediaDevices.enumerateDevices();
        const videoDevices = deviceList.filter(device => device.kind === 'videoinput');
        setDevices(videoDevices);
        
        if (videoDevices.length > 0) {
          setCurrentDeviceId(videoDevices[0].deviceId);
        }
      } catch (deviceErr) {
        console.warn('Failed to enumerate devices:', deviceErr);
      }

      console.log('Camera started successfully');

    } catch (err: unknown) {
      console.error('Camera access failed:', err);
      
      let userMessage = 'Camera access failed. Please allow camera access to continue.';
      
      if (err instanceof Error && (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError')) {
        userMessage = 'Camera access was denied. Please allow camera access in your browser settings and refresh the page.';
      } else if (err instanceof Error && (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError')) {
        userMessage = 'No camera device found. Please connect a camera and try again.';
      } else if (err.name === 'NotReadableError' || err.name === 'TrackStartError') {
        userMessage = 'Camera is already in use by another application. Please close other apps using the camera and try again.';
      } else if (err.name === 'OverconstrainedError' || err.name === 'ConstraintNotSatisfiedError') {
        userMessage = 'Camera does not support the required settings. Try using a different camera.';
      }
      
      setError(userMessage);
      setHasPermission(false);
    }
  }, []);

  // Stop camera
  const stopCamera = useCallback(() => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
    if (detectionIntervalRef.current) {
      clearInterval(detectionIntervalRef.current);
    }
    setIsDetecting(false);
  }, [stream]);

  // Switch camera device
  const switchCamera = useCallback(async (deviceId: string) => {
    stopCamera();
    
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: {
          deviceId: { exact: deviceId },
          width: { ideal: 640 },
          height: { ideal: 480 }
        }
      });

      setStream(mediaStream);
      setCurrentDeviceId(deviceId);
    } catch (err) {
      console.error('Failed to switch camera:', err);
      setError('Failed to switch camera. Please try again.');
    }
  }, [stopCamera]);

  // Capture frame from webcam
  const captureFrame = useCallback((): string | null => {
    if (!webcamRef.current || !canvasRef.current) return null;

    const video = webcamRef.current.video;
    const canvas = canvasRef.current;
    const context = canvas.getContext('2d');

    if (!context || !video) return null;

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    
    // Apply mirror effect if needed
    if (mirror) {
      context.translate(canvas.width, 0);
      context.scale(-1, 1);
    }
    
    context.drawImage(video, 0, 0, canvas.width, canvas.height);
    
    return canvas.toDataURL('image/jpeg', 0.9);
  }, [mirror]);

  // Start pose detection
  const startDetection = useCallback(() => {
    if (!isActive || !webcamRef.current) return;

    setIsDetecting(true);
    setDetectionState(prev => ({
      ...prev,
      isDetecting: true,
      currentPose: pose,
      isPoseMatched: false,
      countdown: 3,
      progress: 0
    }));

    detectionIntervalRef.current = setInterval(async () => {
      await performPoseDetection();
    }, 100);
  }, [isActive, pose]);

  // Stop pose detection
  const stopDetection = useCallback(() => {
    if (detectionIntervalRef.current) {
      clearInterval(detectionIntervalRef.current);
    }
    setIsDetecting(false);
    setDetectionState(prev => ({
      ...prev,
      isDetecting: false,
      isPoseMatched: false,
      countdown: 0,
      progress: 0
    }));
  }, []);

  // Perform pose detection
  const performPoseDetection = useCallback(async () => {
    if (!webcamRef.current || !canvasRef.current) return;

    try {
      const video = webcamRef.current.video;
      const canvas = canvasRef.current;
      const context = canvas.getContext('2d');

      if (!context || !video || video.readyState !== 4) return;

      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      context.drawImage(video, 0, 0, canvas.width, canvas.height);

      const imageData = context.getImageData(0, 0, canvas.width, canvas.height);
      
      // Check lighting
      const lightingResult = await faceDetectionService.detectLighting(imageData);
      setLighting(lightingResult);

      // Perform pose detection
      const poseResult = await faceDetectionService.detectPose(imageData, pose);
      
      const isMatched = poseResult.confidence > VERIFICATION_CONSTANTS.MIN_CONFIDENCE;
      
      setDetectionState(prev => ({
        ...prev,
        isPoseMatched: isMatched,
        confidence: poseResult.confidence,
        progress: Math.min(100, prev.progress + (100 / (POSE_INSTRUCTIONS[pose].durationSeconds * 10)))
      }));

      // Start countdown when pose is matched
      if (isMatched && detectionState.countdown > 0) {
        setTimeout(() => {
          setDetectionState(prev => ({ ...prev, countdown: prev.countdown - 1 }));
        }, 1000);
      }

      // Auto-capture when countdown reaches 0
      if (isMatched && detectionState.countdown === 0) {
        await captureImage();
      }

    } catch (err) {
      console.error('Pose detection failed:', err);
      setError('Face detection failed. Please ensure your face is clearly visible.');
    }
  }, [pose, detectionState.countdown]);

  // Capture image with pose data
  const captureImage = useCallback(async () => {
    stopDetection();

    const imageData = captureFrame();
    if (!imageData) {
      setError('Failed to capture image. Please try again.');
      return;
    }

    const capturedImage: CapturedImage = {
      url: imageData,
      pose: pose,
      confidence: detectionState.confidence,
      timestamp: new Date().toISOString(),
      imageData: imageData
    };

    onCapture(capturedImage);
  }, [captureFrame, pose, detectionState.confidence, onCapture, stopDetection]);

  // Manual capture
  const handleManualCapture = useCallback(() => {
    const imageData = captureFrame();
    if (!imageData) {
      setError('Failed to capture image. Please try again.');
      return;
    }

    const capturedImage: CapturedImage = {
      url: imageData,
      pose: pose,
      confidence: 0.5, // Manual capture gets default confidence
      timestamp: new Date().toISOString(),
      imageData: imageData
    };

    onCapture(capturedImage);
  }, [captureFrame, pose, onCapture]);

  // Initialize camera on mount
  useEffect(() => {
    if (isActive) {
      startCamera();
    }

    return () => {
      stopCamera();
    };
  }, [isActive, startCamera, stopCamera]);

  // Start/stop detection based on pose changes
  useEffect(() => {
    if (isActive && hasPermission && pose) {
      stopDetection();
      setTimeout(() => startDetection(), 500);
    }

    return () => {
      stopDetection();
    };
  }, [pose, isActive, hasPermission, startDetection, stopDetection]);

  // Handle device changes
  useEffect(() => {
    const handleDeviceChange = () => {
      navigator.mediaDevices.enumerateDevices().then(deviceList => {
        const videoDevices = deviceList.filter(device => device.kind === 'videoinput');
        setDevices(videoDevices);
      });
    };

    navigator.mediaDevices.addEventListener('devicechange', handleDeviceChange);
    return () => {
      navigator.mediaDevices.removeEventListener('devicechange', handleDeviceChange);
    };
  }, []);

  const currentInstruction = POSE_INSTRUCTIONS[pose];

  return (
    <div className="relative w-full max-w-2xl mx-auto">
      {/* Camera View */}
      <div className="relative aspect-video bg-black rounded-lg overflow-hidden">
        {!hasPermission ? (
          <div className="absolute inset-0 flex items-center justify-center bg-gray-900">
            <div className="text-center p-6">
              <CameraOff className="w-16 h-16 mx-auto mb-4 text-gray-400" />
              <h3 className="text-white text-lg font-semibold mb-2">Camera Access Required</h3>
              <p className="text-gray-400 mb-4">Please allow camera access to verify your identity</p>
              <button
                onClick={startCamera}
                className="px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
              >
                Enable Camera
              </button>
            </div>
          </div>
        ) : (
          <>
            <Webcam
              ref={webcamRef}
              audio={false}
              screenshotFormat="image/jpeg"
              className={`w-full h-full object-cover ${mirror ? 'scale-x-[-1]' : ''}`}
              videoConstraints={{
                deviceId: currentDeviceId || undefined,
                width: { ideal: 640 },
                height: { ideal: 480 },
                facingMode: 'user'
              }}
            />
            
            {/* Hidden canvas for processing */}
            <canvas ref={canvasRef} className="hidden" />

            {/* Camera Overlay */}
            {showOverlay && (
              <CameraOverlay
                detectionState={detectionState}
                instruction={currentInstruction}
                lighting={lighting}
                isDetecting={isDetecting}
              />
            )}

            {/* Error Display */}
            {error && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="absolute top-4 left-4 right-4 bg-red-500 text-white p-3 rounded-lg flex items-center gap-2"
              >
                <AlertCircle className="w-5 h-5 flex-shrink-0" />
                <span className="text-sm">{error}</span>
              </motion.div>
            )}

            {/* Device Selector */}
            {devices.length > 1 && (
              <div className="absolute top-4 right-4">
                <label htmlFor="camera-select" className="sr-only">Select camera</label>
                <select
                  id="camera-select"
                  value={currentDeviceId}
                  onChange={(e) => switchCamera(e.target.value)}
                  className="bg-black/50 text-white border border-white/20 rounded px-2 py-1 text-sm"
                  title="Select camera device"
                >
                  {devices.map(device => (
                    <option key={device.deviceId} value={device.deviceId}>
                      {device.label || `Camera ${devices.indexOf(device) + 1}`}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </>
        )}
      </div>

      {/* Controls */}
      <div className="mt-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <button
            onClick={handleManualCapture}
            disabled={!hasPermission || isDetecting}
            className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
          >
            <Camera className="w-4 h-4" />
            Capture Manually
          </button>
          
          <button
            onClick={() => {
              stopDetection();
              setTimeout(startDetection, 100);
            }}
            disabled={!hasPermission}
            className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
          >
            <RefreshCw className="w-4 h-4" />
            Retry
          </button>
        </div>

        {/* Status Indicators */}
        <div className="flex items-center gap-4 text-sm">
          {lighting.isGood ? (
            <div className="flex items-center gap-1 text-green-400">
              <CheckCircle2 className="w-4 h-4" />
              <span>Good lighting</span>
            </div>
          ) : (
            <div className="flex items-center gap-1 text-yellow-400">
              <Zap className="w-4 h-4" />
              <span>Low light</span>
            </div>
          )}
          
          {detectionState.isPoseMatched && (
            <div className="flex items-center gap-1 text-green-400">
              <CheckCircle2 className="w-4 h-4" />
              <span>Pose matched!</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// Camera Overlay Component
interface CameraOverlayProps {
  detectionState: PoseDetectionState;
  instruction: { title: string; description: string; durationSeconds: number };
  lighting: { isGood: boolean; brightness: number };
  isDetecting: boolean;
}

const CameraOverlay: React.FC<CameraOverlayProps> = ({
  detectionState,
  instruction,
  lighting,
  isDetecting
}) => {
  return (
    <div className="absolute inset-0 pointer-events-none">
      {/* Face outline guide */}
      <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
        <motion.div
          className={`w-64 h-64 rounded-full border-4 transition-colors duration-300 ${
            detectionState.isPoseMatched 
              ? 'border-green-500 shadow-lg shadow-green-500/50' 
              : 'border-white/50'
          }`}
          animate={{
            scale: detectionState.isPoseMatched ? [1, 1.05, 1] : 1,
          }}
          transition={{
            duration: 1,
            repeat: detectionState.isPoseMatched ? Infinity : 0,
            repeatType: 'reverse'
          }}
        >
          {/* Face landmarks visualization */}
          <div className="absolute top-1/4 left-1/4 w-8 h-8 rounded-full bg-white/20" />
          <div className="absolute top-1/4 right-1/4 w-8 h-8 rounded-full bg-white/20" />
          <div className="absolute bottom-1/3 left-1/2 transform -translate-x-1/2 w-12 h-4 rounded-full bg-white/20" />
        </motion.div>
      </div>
      
      {/* Countdown */}
      <AnimatePresence>
        {detectionState.countdown > 0 && detectionState.isPoseMatched && (
          <motion.div
            key={detectionState.countdown}
            initial={{ scale: 1.5, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.5, opacity: 0 }}
            className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2"
          >
            <div className="w-20 h-20 bg-purple-600 rounded-full flex items-center justify-center text-4xl font-bold text-white shadow-lg">
              {detectionState.countdown}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      
      {/* Progress Bar */}
      {isDetecting && (
        <div className="absolute bottom-0 left-0 right-0 bg-black/50 p-4">
          <div className="flex items-center justify-between text-white mb-2">
            <div className="flex items-center gap-2">
              <span className="text-2xl">{instruction.icon}</span>
              <span className="font-medium">{instruction.text}</span>
            </div>
            <span className="text-sm opacity-75">{Math.round(detectionState.progress)}%</span>
          </div>
          <div className="w-full bg-white/20 rounded-full h-2">
            <motion.div
              className="bg-gradient-to-r from-purple-600 to-pink-600 h-2 rounded-full"
              initial={{ width: '0%' }}
              animate={{ width: `${detectionState.progress}%` }}
              transition={{ duration: 0.3 }}
            />
          </div>
          <p className="text-white/75 text-xs mt-1">{instruction.tip}</p>
        </div>
      )}
      
      {/* Lighting Warning */}
      {!lighting.isGood && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="absolute top-4 left-1/2 transform -translate-x-1/2 bg-yellow-500 text-white px-4 py-2 rounded-full text-sm flex items-center gap-2"
        >
          <Zap className="w-4 h-4" />
          <span>Lighting too dark - move to brighter area</span>
        </motion.div>
      )}

      {/* Detection Status */}
      {isDetecting && (
        <div className="absolute top-4 left-4">
          <div className="flex items-center gap-2 bg-black/50 text-white px-3 py-1 rounded-full text-sm">
            <div className={`w-2 h-2 rounded-full ${
              detectionState.isPoseMatched ? 'bg-green-500' : 'bg-yellow-500'
            } animate-pulse`} />
            <span>{detectionState.isPoseMatched ? 'Pose Matched' : 'Detecting...'}</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default CameraCapture;

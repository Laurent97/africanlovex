import { z } from 'zod';

// Verification status types
export type VerificationStatus = 'unverified' | 'pending' | 'approved' | 'rejected' | 'expired';
export type VerificationLevel = 'basic' | 'premium' | 'golden';
export type BadgeType = 'basic' | 'premium' | 'golden';
export type PoseType = 'neutral' | 'left' | 'right' | 'smile' | 'wink';

// Database schemas
export const VerificationAttemptSchema = z.object({
  id: z.string().uuid(),
  user_id: z.string().uuid(),
  attempt_number: z.number().int().positive(),
  status: z.enum(['pending', 'approved', 'rejected', 'expired']),
  selfie_urls: z.array(z.string().url()),
  pose_types: z.array(z.enum(['neutral', 'left', 'right', 'smile', 'wink'])),
  confidence_scores: z.array(z.number().min(0).max(1)),
  rejection_reason: z.string().nullable(),
  ip_address: z.string().nullable(),
  user_agent: z.string().nullable(),
  device_info: z.record(z.any()).nullable(),
  created_at: z.string().datetime(),
  completed_at: z.string().datetime().nullable(),
});

export const VerifiedUserSchema = z.object({
  user_id: z.string().uuid(),
  verification_id: z.string().uuid(),
  verified_at: z.string().datetime(),
  expires_at: z.string().datetime().nullable(),
  verification_level: z.enum(['basic', 'premium', 'golden']),
  badge_type: z.string(),
  verification_metadata: z.record(z.any()).nullable(),
});

export const VerificationPoseSchema = z.object({
  id: z.string().uuid(),
  pose_key: z.string(),
  instruction: z.string(),
  icon: z.string(),
  duration_seconds: z.number().int().positive(),
  guide_image_url: z.string().url().nullable(),
  is_active: z.boolean(),
  sort_order: z.number().int(),
  created_at: z.string().datetime(),
});

// TypeScript interfaces
export interface VerificationAttempt {
  id: string;
  user_id: string;
  attempt_number: number;
  status: VerificationStatus;
  selfie_urls: string[];
  pose_types: PoseType[];
  confidence_scores: number[];
  rejection_reason?: string;
  ip_address?: string;
  user_agent?: string;
  device_info?: Record<string, any>;
  created_at: string;
  completed_at?: string;
}

export interface VerifiedUser {
  user_id: string;
  verification_id: string;
  verified_at: string;
  expires_at?: string;
  verification_level: VerificationLevel;
  badge_type: string;
  verification_metadata?: Record<string, any>;
}

export interface VerificationPose {
  id: string;
  pose_key: PoseType;
  instruction: string;
  icon: string;
  duration_seconds: number;
  guide_image_url?: string;
  is_active: boolean;
  sort_order: number;
  created_at: string;
}

export interface VerificationStatusResponse {
  status: VerificationStatus;
  is_verified: boolean;
  badge_type?: VerificationLevel;
  verified_at?: string;
  expires_at?: string;
  pending_attempt: boolean;
  attempt_count: number;
}

// Face detection types
export interface FaceDetection {
  detection: {
    score: number;
    box: {
      x: number;
      y: number;
      width: number;
      height: number;
    };
  };
  landmarks: FaceLandmarks;
  expressions: FaceExpressions;
  age?: number;
  gender?: string;
}

export interface FaceLandmarks {
  positions: Array<{
    x: number;
    y: number;
  }>;
  getLeftEye: () => Array<{ x: number; y: number }>;
  getRightEye: () => Array<{ x: number; y: number }>;
  getNose: () => Array<{ x: number; y: number }>;
  getMouth: () => Array<{ x: number; y: number }>;
  getJawOutline: () => Array<{ x: number; y: number }>;
}

export interface FaceExpressions {
  neutral: number;
  happy: number;
  sad: number;
  angry: number;
  fearful: number;
  disgusted: number;
  surprised: number;
  asSortedArray: () => Array<{ expression: string; probability: number }>;
}

export interface HeadPose {
  yaw: number; // Left-right rotation
  pitch: number; // Up-down rotation
  roll: number; // Tilting
}

export interface PoseResult {
  headPose: HeadPose;
  expression: { expression: string; probability: number };
  confidence: number;
  landmarks?: FaceLandmarks;
}

// Liveness detection types
export interface LivenessResult {
  isLive: boolean;
  confidence: number;
  spoofProbability: number;
  checks: {
    blinking: boolean;
    microExpressions: boolean;
    headMovement: boolean;
    texture: boolean;
    screenReflection: boolean;
  };
}

export interface SpoofResult {
  isSpoof: boolean;
  confidence: number;
  reasons: string[];
  checks: Array<{
    type: string;
    isSpoof: boolean;
    confidence: number;
    reason?: string;
  }>;
}

export interface CheckResult {
  type: string;
  isSpoof: boolean;
  confidence: number;
  reason?: string;
}

// Verification flow types
export interface VerificationFlow {
  step: number;
  totalSteps: number;
  currentPose?: PoseType;
  capturedImages: CapturedImage[];
  verificationId?: string;
  status: VerificationStatus;
  error?: VerificationError;
}

export interface CapturedImage {
  url: string;
  pose: PoseType;
  confidence: number;
  timestamp: string;
  imageData?: string; // Base64 for processing
}

export interface VerificationResult {
  approved: boolean;
  confidence: number;
  badgeLevel?: VerificationLevel;
  reason?: string;
  details: {
    samePerson: boolean;
    livenessScore: number;
    poseScores: Record<PoseType, number>;
    profileMatch: number;
  };
}

// Camera component types
export interface CameraConfig {
  width: number;
  height: number;
  facingMode: 'user' | 'environment';
  constraints: MediaStreamConstraints;
}

export interface CameraState {
  stream: MediaStream | null;
  isActive: boolean;
  hasPermission: boolean;
  error?: string;
  devices: MediaDeviceInfo[];
  currentDevice?: string;
}

export interface PoseDetectionState {
  isDetecting: boolean;
  currentPose: PoseType;
  isPoseMatched: boolean;
  confidence: number;
  countdown: number;
  progress: number;
}

// Badge component types
export interface VerificationBadgeProps {
  level: VerificationLevel;
  size?: 'sm' | 'md' | 'lg';
  showTooltip?: boolean;
  animated?: boolean;
  className?: string;
}

export interface BadgeConfig {
  icon: string;
  color: string;
  bg: string;
  label: string;
  gradient: string;
  animation?: string;
}

// Error types
export interface VerificationError {
  code: string;
  message: string;
  userMessage: string;
  recoverable: boolean;
  details?: Record<string, any>;
}

export type ErrorCode = 
  | 'CAMERA_DENIED'
  | 'CAMERA_NOT_FOUND'
  | 'LOW_LIGHT'
  | 'FACE_NOT_FOUND'
  | 'MULTIPLE_FACES'
  | 'POSE_NOT_MATCHED'
  | 'SPOOF_DETECTED'
  | 'NETWORK_ERROR'
  | 'RATE_LIMITED'
  | 'VERIFICATION_EXPIRED'
  | 'INVALID_IMAGE'
  | 'AI_PROCESSING_ERROR'
  | 'STORAGE_ERROR'
  | 'VERIFICATION_REJECTED';

// Verification Error class
export class VerificationError extends Error {
  declare code: ErrorCode;
  declare userMessage: string;
  declare recoverable: boolean;

  constructor(message: string, code: ErrorCode, userMessage: string, recoverable: boolean = false) {
    super(message);
    (this as any).code = code;
    (this as any).userMessage = userMessage;
    (this as any).recoverable = recoverable;
    this.name = 'VerificationError';
  }
}

// API types
export interface StartVerificationRequest {
  user_id: string;
}

export interface StartVerificationResponse {
  verification_id: string;
  required_poses: VerificationPose[];
  attempt_number: number;
}

export interface SubmitVerificationRequest {
  verification_id: string;
  images: Array<{
    url: string;
    pose: PoseType;
    confidence: number;
  }>;
}

export interface SubmitVerificationResponse {
  status: 'processing';
  estimated_time: number;
}

export interface VerificationStatusRequest {
  verification_id: string;
}

export interface VerificationStatusResponse {
  status: VerificationStatus;
  confidence?: number;
  badge_level?: VerificationLevel;
  rejection_reason?: string;
  completed_at?: string;
}

// Analytics types
export interface VerificationAnalytics {
  date: string;
  total_attempts: number;
  successful_verifications: number;
  failed_verifications: number;
  average_confidence: number;
  rejection_reasons: Record<string, number>;
}

export interface UserVerificationStats {
  total_attempts: number;
  successful_attempts: number;
  failed_attempts: number;
  current_streak: number;
  best_streak: number;
  average_confidence: number;
  last_attempt?: string;
}

// Hook types
export interface UseVerificationReturn {
  status: VerificationStatusResponse;
  loading: boolean;
  error: VerificationError | null;
  startVerification: () => Promise<string>;
  submitVerification: (images: CapturedImage[]) => Promise<void>;
  checkStatus: (verificationId: string) => Promise<VerificationStatusResponse>;
  retryVerification: () => Promise<void>;
  reset: () => void;
}

export interface UseCameraReturn {
  stream: MediaStream | null;
  isActive: boolean;
  hasPermission: boolean;
  error: string | null;
  devices: MediaDeviceInfo[];
  startCamera: () => Promise<void>;
  stopCamera: () => void;
  switchCamera: (deviceId: string) => Promise<void>;
  captureFrame: () => string | null;
}

export interface UseFaceDetectionReturn {
  isDetecting: boolean;
  currentPose: PoseType;
  isPoseMatched: boolean;
  confidence: number;
  landmarks: FaceLandmarks | null;
  expressions: FaceExpressions | null;
  startDetection: () => void;
  stopDetection: () => void;
  captureWithPose: (pose: PoseType) => Promise<CapturedImage | null>;
}

// Component props types
export interface CameraCaptureProps {
  onCapture: (image: CapturedImage) => void;
  pose: PoseType;
  isActive: boolean;
  showOverlay?: boolean;
  mirror?: boolean;
}

export interface PoseGuideProps {
  currentPose: PoseType;
  onPoseComplete: () => void;
  isActive: boolean;
  progress: number;
}

export interface VerificationReviewProps {
  images: CapturedImage[];
  result: VerificationResult;
  onRetry: () => void;
  onContinue: () => void;
}

export interface ProcessingScreenProps {
  verificationId: string;
  onComplete: (result: VerificationResult) => void;
  onError: (error: VerificationError) => void;
}

// Utility types
export type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P];
};

export type Optional<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;

export type RequiredFields<T, K extends keyof T> = T & Required<Pick<T, K>>;

// Constants
export const VERIFICATION_CONSTANTS = {
  MAX_ATTEMPTS: 3,
  COOLDOWN_HOURS: 24,
  MIN_CONFIDENCE: 0.7,
  HIGH_CONFIDENCE: 0.9,
  PREMIUM_CONFIDENCE: 0.8,
  GOLDEN_CONFIDENCE: 0.95,
  POSE_TIMEOUT: 10000, // 10 seconds
  CAPTURE_DELAY: 3000, // 3 seconds countdown
  MIN_FACE_SIZE: 100,
  MAX_FACE_DISTANCE: 0.6,
  LIVENESS_THRESHOLD: 0.8,
  SPOOF_THRESHOLD: 0.3,
} as const;

export const POSE_INSTRUCTIONS = {
  neutral: {
    text: 'Look straight at the camera',
    icon: '👤',
    tip: 'Make sure your face is clearly visible',
    tolerance: 15, // degrees
    targetYaw: 0,
    expression: 'neutral' as const,
    durationSeconds: 3,
  },
  left: {
    text: 'Turn your head slowly to the left',
    icon: '👈',
    tip: 'Don\'t move your shoulders, just your head',
    tolerance: 20,
    targetYaw: -30,
    expression: 'neutral' as const,
    durationSeconds: 3,
  },
  right: {
    text: 'Turn your head slowly to the right',
    icon: '👉',
    tip: 'Keep your eyes on the camera',
    tolerance: 20,
    targetYaw: 30,
    expression: 'neutral' as const,
    durationSeconds: 3,
  },
  smile: {
    text: 'Give us a natural smile',
    icon: '😊',
    tip: 'Show those pearly whites!',
    tolerance: 10,
    targetYaw: 0,
    expression: 'happy' as const,
    durationSeconds: 2,
  },
  wink: {
    text: 'Give a little wink',
    icon: '😉',
    tip: 'Just one eye, naturally!',
    tolerance: 15,
    targetYaw: 0,
    expression: 'surprised' as const,
    durationSeconds: 2,
  },
} as const;

export const BADGE_CONFIGS = {
  basic: {
    icon: 'CheckCircle',
    color: 'text-blue-500',
    bg: 'bg-blue-100',
    label: 'Basic Verified',
    gradient: 'from-blue-500 to-blue-600',
    animation: 'pulse',
  },
  premium: {
    icon: 'Star',
    color: 'text-purple-500',
    bg: 'bg-purple-100',
    label: 'Premium Verified',
    gradient: 'from-purple-500 to-pink-500',
    animation: 'pulse-glow',
  },
  golden: {
    icon: 'Crown',
    color: 'text-yellow-500',
    bg: 'bg-yellow-100',
    label: 'Golden Verified',
    gradient: 'from-yellow-500 to-orange-500',
    animation: 'shimmer',
  },
} as const;

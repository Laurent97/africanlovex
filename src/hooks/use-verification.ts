import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { verificationAI } from '../services/verificationAI';
import { 
  UseVerificationReturn, 
  VerificationStatusResponse, 
  CapturedImage,
  VerificationError,
  ErrorCode,
  VerificationStatus 
} from '../types/verification';

export const useVerification = (userId?: string): UseVerificationReturn => {
  const [status, setStatus] = useState<VerificationStatusResponse>({
    status: 'unverified',
    is_verified: false,
    pending_attempt: false,
    attempt_count: 0
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<VerificationError | null>(null);

  // Load verification status
  const loadStatus = useCallback(async () => {
    if (!userId) return;

    try {
      setLoading(true);
      setError(null);

      const { data, error: statusError } = await supabase
        .rpc('get_verification_status', {
          user_uuid: userId
        });

      if (statusError) {
        throw statusError;
      }

      setStatus(data || {
        status: 'unverified',
        is_verified: false,
        pending_attempt: false,
        attempt_count: 0
      });

    } catch (err) {
      console.error('Failed to load verification status:', err);
      setError({
        code: 'NETWORK_ERROR',
        message: 'Failed to load verification status',
        userMessage: 'Unable to load verification status. Please refresh the page.',
        recoverable: true
      });
    } finally {
      setLoading(false);
    }
  }, [userId]);

  // Start verification
  const startVerification = useCallback(async (): Promise<string> => {
    if (!userId) {
      throw new Error('User ID is required');
    }

    try {
      setError(null);

      // Check if user can attempt verification
      const { data: canAttempt, error: checkError } = await supabase
        .rpc('can_attempt_verification', {
          user_uuid: userId
        });

      if (checkError) {
        throw checkError;
      }

      if (!canAttempt) {
        throw new VerificationError(
          'Rate limit exceeded',
          'RATE_LIMITED',
          'You have reached the maximum number of verification attempts. Please try again later.',
          false
        );
      }

      // Get attempt count
      const { data: attempts } = await supabase
        .from('verification_attempts')
        .select('attempt_number')
        .eq('user_id', userId)
        .order('attempt_number', { ascending: false })
        .limit(1);

      const nextAttemptNumber = (attempts?.[0]?.attempt_number || 0) + 1;

      // Create new verification attempt
      const { data: verification, error: createError } = await supabase
        .from('verification_attempts')
        .insert({
          user_id: userId,
          attempt_number: nextAttemptNumber,
          status: 'pending',
          ip_address: await getClientIP(),
          user_agent: navigator.userAgent,
          device_info: {
            platform: navigator.platform,
            language: navigator.language,
            screenResolution: `${screen.width}x${screen.height}`,
            timezone: Intl.DateTimeFormat().resolvedOptions().timeZone
          }
        })
        .select()
        .single();

      if (createError) {
        throw createError;
      }

      if (!verification) {
        throw new Error('Failed to create verification attempt');
      }

      // Reload status
      await loadStatus();

      return verification.id;

    } catch (err) {
      console.error('Failed to start verification:', err);
      
      if (err instanceof VerificationError) {
        setError(err);
        throw err;
      }

      const verificationError = new VerificationError(
        'Failed to start verification',
        'NETWORK_ERROR',
        'Unable to start verification. Please try again.',
        true
      );
      
      setError(verificationError);
      throw verificationError;
    }
  }, [userId, loadStatus]);

  // Submit verification images
  const submitVerification = useCallback(async (images: CapturedImage[]): Promise<void> => {
    if (!userId) {
      throw new Error('User ID is required');
    }

    if (images.length === 0) {
      throw new VerificationError(
        'No images provided',
        'INVALID_IMAGE',
        'Please capture at least one photo for verification.',
        true
      );
    }

    try {
      setError(null);
      setLoading(true);

      // Get current pending verification
      const { data: pendingAttempt } = await supabase
        .from('verification_attempts')
        .select('id')
        .eq('user_id', userId)
        .eq('status', 'pending')
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (!pendingAttempt) {
        throw new VerificationError(
          'No pending verification',
          'VERIFICATION_EXPIRED',
          'Your verification session has expired. Please start a new verification.',
          true
        );
      }

      // Submit to AI for processing
      const result = await verificationAI.verifyImages(images, userId, pendingAttempt.id);

      if (!result.approved) {
        // Mark as rejected
        await supabase
          .from('verification_attempts')
          .update({
            status: 'rejected',
            rejection_reason: result.reason,
            completed_at: new Date().toISOString()
          })
          .eq('id', pendingAttempt.id);

        throw new VerificationError(
          'Verification failed',
          'VERIFICATION_REJECTED',
          result.reason || 'Verification failed. Please try again.',
          true
        );
      }

      // Reload status
      await loadStatus();

    } catch (err) {
      console.error('Failed to submit verification:', err);
      
      if (err instanceof VerificationError) {
        setError(err);
        throw err;
      }

      const verificationError = new VerificationError(
        'Failed to submit verification',
        'AI_PROCESSING_ERROR',
        'Unable to process verification. Please try again.',
        true
      );
      
      setError(verificationError);
      throw verificationError;
    } finally {
      setLoading(false);
    }
  }, [userId, loadStatus]);

  // Check verification status
  const checkStatus = useCallback(async (verificationId: string): Promise<VerificationStatusResponse> => {
    try {
      setError(null);

      const { data, error: statusError } = await supabase
        .from('verification_attempts')
        .select(`
          status,
          confidence_scores,
          rejection_reason,
          completed_at,
          verified_users!inner(
            verification_level,
            verified_at
          )
        `)
        .eq('id', verificationId)
        .single();

      if (statusError) {
        throw statusError;
      }

      const response: VerificationStatusResponse = {
        status: data.status as VerificationStatus,
        is_verified: data.status === 'approved',
        badge_type: (data.verified_users as any)?.verification_level,
        verified_at: (data.verified_users as any)?.verified_at,
        expires_at: null, // Could be calculated from verified_users.expires_at
        pending_attempt: data.status === 'pending',
        attempt_count: status.attempt_count || 0
      };

      return response;

    } catch (err) {
      console.error('Failed to check verification status:', err);
      
      const verificationError = new VerificationError(
        'Failed to check status',
        'NETWORK_ERROR',
        'Unable to check verification status.',
        true
      );
      
      setError(verificationError);
      throw verificationError;
    }
  }, [status.attempt_count]);

  // Retry verification
  const retryVerification = useCallback(async (): Promise<void> => {
    if (!userId) {
      throw new Error('User ID is required');
    }

    try {
      setError(null);
      setLoading(true);

      // Get current pending verification to reject it
      const { data: pendingAttempt } = await supabase
        .from('verification_attempts')
        .select('id')
        .eq('user_id', userId)
        .eq('status', 'pending')
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (pendingAttempt) {
        await supabase
          .from('verification_attempts')
          .update({
            status: 'rejected',
            rejection_reason: 'User retry',
            completed_at: new Date().toISOString()
          })
          .eq('id', pendingAttempt.id);
      }

      // Start new verification
      await startVerification();

    } catch (err) {
      console.error('Failed to retry verification:', err);
      
      if (err instanceof VerificationError) {
        setError(err);
        throw err;
      }

      const verificationError = new VerificationError(
        'Failed to retry verification',
        'NETWORK_ERROR',
        'Unable to retry verification. Please try again.',
        true
      );
      
      setError(verificationError);
      throw verificationError;
    } finally {
      setLoading(false);
    }
  }, [userId, startVerification]);

  // Reset error state
  const reset = useCallback(() => {
    setError(null);
  }, []);

  // Load status on mount
  useEffect(() => {
    if (userId) {
      loadStatus();
    }
  }, [userId, loadStatus]);

  return {
    status,
    loading,
    error,
    startVerification,
    submitVerification,
    checkStatus,
    retryVerification,
    reset
  };
};

// Helper function to get client IP
async function getClientIP(): Promise<string> {
  try {
    const response = await fetch('https://api.ipify.org?format=json');
    const data = await response.json();
    return data.ip;
  } catch (error) {
    console.error('Failed to get client IP:', error);
    return 'unknown';
  }
}

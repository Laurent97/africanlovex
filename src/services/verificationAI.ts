import { 
  VerificationResult, 
  CapturedImage, 
  PoseType, 
  VerificationLevel,
  VERIFICATION_CONSTANTS 
} from '../types/verification';
import { faceDetectionService } from './faceDetection';
import { livenessDetectionService } from './livenessDetection';
import { supabase } from '../lib/supabase';
import { uploadToCloudinary } from '../lib/cloudinary';

export class VerificationAI {
  async verifyImages(
    images: CapturedImage[], 
    userId: string,
    verificationId: string
  ): Promise<VerificationResult> {
    try {
      console.log('Starting AI verification for', images.length, 'images');

      // Step 1: Check if all images show the same person
      const samePersonResult = await this.verifySamePerson(images);
      if (!samePersonResult.passed) {
        return {
          approved: false,
          confidence: samePersonResult.confidence,
          reason: samePersonResult.reason,
          details: {
            samePerson: false,
            livenessScore: 0,
            poseScores: {} as Record<PoseType, number>,
            profileMatch: 0
          }
        };
      }

      // Step 2: Check for liveness in each image
      const livenessResults = await Promise.all(
        images.map(img => this.checkImageLiveness(img))
      );
      
      const avgLivenessScore = livenessResults.reduce((sum, result) => sum + result.confidence, 0) / livenessResults.length;
      
      if (avgLivenessScore < VERIFICATION_CONSTANTS.LIVENESS_THRESHOLD) {
        return {
          approved: false,
          confidence: avgLivenessScore,
          reason: 'Liveness check failed - possible spoof attempt',
          details: {
            samePerson: true,
            livenessScore: avgLivenessScore,
            poseScores: {} as Record<PoseType, number>,
            profileMatch: 0
          }
        };
      }

      // Step 3: Verify each pose was performed correctly
      const poseScores: Record<PoseType, number> = {} as Record<PoseType, number>;
      for (const image of images) {
        poseScores[image.pose] = image.confidence;
      }
      
      const avgPoseScore = Object.values(poseScores).reduce((sum, score) => sum + score, 0) / Object.values(poseScores).length;
      
      if (avgPoseScore < VERIFICATION_CONSTANTS.MIN_CONFIDENCE) {
        return {
          approved: false,
          confidence: avgPoseScore,
          reason: 'Poses not performed correctly',
          details: {
            samePerson: true,
            livenessScore: avgLivenessScore,
            poseScores,
            profileMatch: 0
          }
        };
      }

      // Step 4: Check against existing profile photos
      const profileMatchResult = await this.compareWithProfile(images[0], userId);
      
      if (profileMatchResult.score < 0.6 && profileMatchResult.hasExistingPhotos) {
        return {
          approved: false,
          confidence: profileMatchResult.score,
          reason: 'Verification photos don\'t match profile photos',
          details: {
            samePerson: true,
            livenessScore: avgLivenessScore,
            poseScores,
            profileMatch: profileMatchResult.score
          }
        };
      }

      // Step 5: Calculate overall confidence and determine badge level
      const overallConfidence = (avgPoseScore + avgLivenessScore + profileMatchResult.score) / 3;
      const badgeLevel = this.determineBadgeLevel(overallConfidence);

      // Step 6: Store verification images and update database
      await this.storeVerificationImages(images, userId, verificationId);
      await this.updateVerificationStatus(userId, verificationId, badgeLevel, overallConfidence);

      return {
        approved: true,
        confidence: overallConfidence,
        badgeLevel,
        details: {
          samePerson: true,
          livenessScore: avgLivenessScore,
          poseScores,
          profileMatch: profileMatchResult.score
        }
      };

    } catch (error) {
      console.error('Verification AI failed:', error);
      return {
        approved: false,
        confidence: 0,
        reason: 'AI processing error - please try again',
        details: {
          samePerson: false,
          livenessScore: 0,
          poseScores: {} as Record<PoseType, number>,
          profileMatch: 0
        }
      };
    }
  }

  private async verifySamePerson(images: CapturedImage[]): Promise<{ passed: boolean; confidence: number; reason: string }> {
    try {
      const descriptors: Float32Array[] = [];
      
      // Extract face descriptors from all images
      for (const image of images) {
        const imgElement = await this.loadImageElement(image.url);
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        
        if (!ctx) continue;
        
        canvas.width = imgElement.width;
        canvas.height = imgElement.height;
        ctx.drawImage(imgElement, 0, 0);
        
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const descriptor = await faceDetectionService.extractFaceDescriptor(imageData);
        
        if (descriptor) {
          descriptors.push(descriptor);
        }
      }

      if (descriptors.length < 2) {
        return { passed: false, confidence: 0, reason: 'Not enough valid face detections' };
      }

      // Compare all descriptors
      let totalSimilarity = 0;
      let comparisons = 0;

      for (let i = 0; i < descriptors.length - 1; i++) {
        for (let j = i + 1; j < descriptors.length; j++) {
          const similarity = await faceDetectionService.compareFaces(descriptors[i], descriptors[j]);
          totalSimilarity += similarity;
          comparisons++;
        }
      }

      const avgSimilarity = totalSimilarity / comparisons;
      const threshold = 0.7;

      return {
        passed: avgSimilarity >= threshold,
        confidence: avgSimilarity,
        reason: avgSimilarity >= threshold ? 'Same person verified' : 'Different people detected'
      };

    } catch (error) {
      console.error('Same person verification failed:', error);
      return { passed: false, confidence: 0, reason: 'Face comparison failed' };
    }
  }

  private async checkImageLiveness(image: CapturedImage): Promise<{ confidence: number; passed: boolean }> {
    try {
      const imgElement = await this.loadImageElement(image.url);
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      
      if (!ctx) {
        return { confidence: 0, passed: false };
      }
      
      canvas.width = imgElement.width;
      canvas.height = imgElement.height;
      ctx.drawImage(imgElement, 0, 0);
      
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      
      // Get face data for liveness detection
      const faceData = await faceDetectionService.detectFace(imageData);
      
      const livenessResult = await livenessDetectionService.checkLiveness(imageData, faceData);
      
      return {
        confidence: livenessResult.confidence,
        passed: livenessResult.isLive
      };

    } catch (error) {
      console.error('Liveness check failed:', error);
      return { confidence: 0, passed: false };
    }
  }

  private async compareWithProfile(image: CapturedImage, userId: string): Promise<{ score: number; hasExistingPhotos: boolean }> {
    try {
      // Get user's existing profile photos
      const { data: profile } = await supabase
        .from('profiles')
        .select('avatar_url')
        .eq('id', userId)
        .single();

      if (!profile?.avatar_url) {
        // No existing photos to compare with
        return { score: 0.8, hasExistingPhotos: false };
      }

      // Compare verification image with profile avatar
      const verificationDescriptor = await this.getImageDescriptor(image.url);
      const profileDescriptor = await this.getImageDescriptor(profile.avatar_url);

      if (!verificationDescriptor || !profileDescriptor) {
        return { score: 0.5, hasExistingPhotos: true };
      }

      const similarity = await faceDetectionService.compareFaces(verificationDescriptor, profileDescriptor);
      
      return { score: similarity, hasExistingPhotos: true };

    } catch (error) {
      console.error('Profile comparison failed:', error);
      return { score: 0.5, hasExistingPhotos: false };
    }
  }

  private async getImageDescriptor(imageUrl: string): Promise<Float32Array | null> {
    try {
      const imgElement = await this.loadImageElement(imageUrl);
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      
      if (!ctx) return null;
      
      canvas.width = imgElement.width;
      canvas.height = imgElement.height;
      ctx.drawImage(imgElement, 0, 0);
      
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      return await faceDetectionService.extractFaceDescriptor(imageData);

    } catch (error) {
      console.error('Failed to get image descriptor:', error);
      return null;
    }
  }

  private async loadImageElement(url: string): Promise<HTMLImageElement> {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => resolve(img);
      img.onerror = reject;
      img.src = url;
    });
  }

  private determineBadgeLevel(confidence: number): VerificationLevel {
    if (confidence >= VERIFICATION_CONSTANTS.GOLDEN_CONFIDENCE) {
      return 'golden';
    } else if (confidence >= VERIFICATION_CONSTANTS.PREMIUM_CONFIDENCE) {
      return 'premium';
    } else {
      return 'basic';
    }
  }

  private async storeVerificationImages(images: CapturedImage[], userId: string, verificationId: string): Promise<void> {
    try {
      const uploadPromises = images.map(async (image, index) => {
        const folder = `lovex/verifications/${userId}/attempt-${verificationId}`;
        const publicUrl = await this.uploadBase64Image(image.imageData || image.url, folder, `pose-${image.pose}`);
        return publicUrl;
      });

      const uploadedUrls = await Promise.all(uploadPromises);

      // Update verification attempt with uploaded URLs
      await supabase
        .from('verification_attempts')
        .update({
          selfie_urls: uploadedUrls,
          pose_types: images.map(img => img.pose),
          confidence_scores: images.map(img => img.confidence),
          completed_at: new Date().toISOString()
        })
        .eq('id', verificationId);

    } catch (error) {
      console.error('Failed to store verification images:', error);
      throw error;
    }
  }

  private async uploadBase64Image(base64Data: string, folder: string, filename: string): Promise<string> {
    try {
      // Convert base64 to blob
      const response = await fetch(base64Data);
      const blob = await response.blob();
      const file = new File([blob], `${filename}.jpg`, { type: 'image/jpeg' });

      // Create form data for Cloudinary upload
      const formData = new FormData();
      formData.append('file', file);
      formData.append('upload_preset', import.meta.env.VITE_CLOUDINARY_VERIFICATION_PRESET);
      formData.append('folder', folder);

      const cloudinaryResponse = await fetch(
        `https://api.cloudinary.com/v1_1/${import.meta.env.VITE_CLOUDINARY_CLOUD_NAME}/image/upload`,
        {
          method: 'POST',
          body: formData
        }
      );

      if (!cloudinaryResponse.ok) {
        throw new Error('Cloudinary upload failed');
      }

      const result = await cloudinaryResponse.json();
      return result.secure_url;

    } catch (error) {
      console.error('Failed to upload base64 image:', error);
      throw error;
    }
  }

  private async updateVerificationStatus(
    userId: string, 
    verificationId: string, 
    badgeLevel: VerificationLevel, 
    confidence: number
  ): Promise<void> {
    try {
      // Update verification attempt status
      await supabase
        .from('verification_attempts')
        .update({
          status: 'approved',
          completed_at: new Date().toISOString()
        })
        .eq('id', verificationId);

      // Add to verified users table
      await supabase
        .from('verified_users')
        .upsert({
          user_id: userId,
          verification_id: verificationId,
          verified_at: new Date().toISOString(),
          expires_at: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(), // 1 year
          verification_level: badgeLevel,
          badge_type: 'verified',
          verification_metadata: {
            confidence,
            processed_at: new Date().toISOString(),
            ai_version: '1.0'
          }
        });

      // Update profile verification status
      await supabase.rpc('update_profile_verification', {
        user_uuid: userId,
        badge_level: badgeLevel
      });

    } catch (error) {
      console.error('Failed to update verification status:', error);
      throw error;
    }
  }

  async retryVerification(userId: string, previousVerificationId: string): Promise<string> {
    try {
      // Check if user can attempt verification
      const { data: canAttempt } = await supabase
        .rpc('can_attempt_verification', {
          user_uuid: userId
        });

      if (!canAttempt) {
        throw new Error('Verification attempt limit reached. Please try again later.');
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
      const { data: newVerification, error } = await supabase
        .from('verification_attempts')
        .insert({
          user_id: userId,
          attempt_number: nextAttemptNumber,
          status: 'pending',
          ip_address: await this.getClientIP(),
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

      if (error || !newVerification) {
        throw error || new Error('Failed to create verification attempt');
      }

      return newVerification.id;

    } catch (error) {
      console.error('Failed to retry verification:', error);
      throw error;
    }
  }

  private async getClientIP(): Promise<string> {
    try {
      // In production, you'd use a proper IP detection service
      const response = await fetch('https://api.ipify.org?format=json');
      const data = await response.json();
      return data.ip;
    } catch (error) {
      console.error('Failed to get client IP:', error);
      return 'unknown';
    }
  }

  async getVerificationStatus(userId: string): Promise<any> {
    try {
      const { data } = await supabase
        .rpc('get_verification_status', {
          user_uuid: userId
        });

      return data;
    } catch (error) {
      console.error('Failed to get verification status:', error);
      throw error;
    }
  }

  async revokeVerification(userId: string, reason?: string): Promise<void> {
    try {
      await supabase.rpc('revoke_verification', {
        user_uuid: userId,
        reason: reason || 'Manual revocation'
      });
    } catch (error) {
      console.error('Failed to revoke verification:', error);
      throw error;
    }
  }

  // Admin methods for manual review
  async getPendingVerifications(): Promise<any[]> {
    try {
      const { data } = await supabase
        .from('verification_attempts')
        .select(`
          *,
          profiles!inner(
            username,
            full_name,
            avatar_url
          )
        `)
        .eq('status', 'pending')
        .order('created_at', { ascending: false });

      return data || [];
    } catch (error) {
      console.error('Failed to get pending verifications:', error);
      throw error;
    }
  }

  async manualReview(verificationId: string, approved: boolean, reason?: string): Promise<void> {
    try {
      const { data: attempt } = await supabase
        .from('verification_attempts')
        .select('user_id, confidence_scores')
        .eq('id', verificationId)
        .single();

      if (!attempt) {
        throw new Error('Verification attempt not found');
      }

      if (approved) {
        const avgConfidence = attempt.confidence_scores?.reduce((a: number, b: number) => a + b, 0) / attempt.confidence_scores.length || 0;
        const badgeLevel = this.determineBadgeLevel(avgConfidence);
        
        await this.updateVerificationStatus(attempt.user_id, verificationId, badgeLevel, avgConfidence);
      } else {
        await supabase
          .from('verification_attempts')
          .update({
            status: 'rejected',
            rejection_reason: reason || 'Manual rejection',
            completed_at: new Date().toISOString()
          })
          .eq('id', verificationId);
      }

    } catch (error) {
      console.error('Manual review failed:', error);
      throw error;
    }
  }
}

// Singleton instance
export const verificationAI = new VerificationAI();

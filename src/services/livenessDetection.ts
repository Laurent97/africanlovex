import { 
  LivenessResult, 
  SpoofResult, 
  CheckResult,
  VERIFICATION_CONSTANTS 
} from '../types/verification';

export class LivenessDetectionService {
  private blinkHistory: number[] = [];
  private expressionHistory: string[] = [];
  private headMovementHistory: { x: number; y: number; timestamp: number }[] = [];
  private readonly maxHistoryLength = 30;
  private readonly blinkThreshold = 0.2;
  private readonly movementThreshold = 5;

  async checkLiveness(imageData: ImageData, faceData?: any): Promise<LivenessResult> {
    const checks = await Promise.all([
      this.checkBlinking(faceData),
      this.checkMicroExpressions(faceData),
      this.checkHeadMovement(faceData),
      this.checkTexture(imageData),
      this.checkScreenReflection(imageData)
    ]);

    const passedChecks = checks.filter(check => check.passed).length;
    const totalChecks = checks.length;
    const confidence = passedChecks / totalChecks;
    const spoofProbability = 1 - confidence;

    return {
      isLive: confidence >= VERIFICATION_CONSTANTS.LIVENESS_THRESHOLD,
      confidence,
      spoofProbability,
      checks: {
        blinking: checks[0].passed,
        microExpressions: checks[1].passed,
        headMovement: checks[2].passed,
        texture: checks[3].passed,
        screenReflection: checks[4].passed
      }
    };
  }

  async detectSpoof(imageData: ImageData, faceData?: any): Promise<SpoofResult> {
    const checks = await Promise.all([
      this.checkScreenReflection(imageData),
      this.checkPaperTexture(imageData),
      this.checkDepthConsistency(imageData),
      this.checkEyeBlinkSequence(faceData),
      this.checkLightingInconsistency(imageData),
      this.checkEdgeArtifacts(imageData)
    ]);

    const spoofChecks = checks.filter(check => check.isSpoof);
    const spoofScore = spoofChecks.length / checks.length;

    return {
      isSpoof: spoofScore > VERIFICATION_CONSTANTS.SPOOF_THRESHOLD,
      confidence: 1 - spoofScore,
      reasons: spoofChecks.map(check => check.reason || 'Unknown spoof detected'),
      checks: checks.map(check => ({
        type: check.type,
        isSpoof: check.isSpoof,
        confidence: check.confidence,
        reason: check.reason
      }))
    };
  }

  private async checkBlinking(faceData?: any): Promise<CheckResult> {
    if (!faceData || !faceData.landmarks) {
      return { type: 'blinking', isSpoof: false, confidence: 0.5, reason: 'No face data' };
    }

    const landmarks = faceData.landmarks;
    const leftEye = landmarks.getLeftEye();
    const rightEye = landmarks.getRightEye();

    // Calculate Eye Aspect Ratio (EAR) for blink detection
    const leftEAR = this.calculateEyeAspectRatio(leftEye);
    const rightEAR = this.calculateEyeAspectRatio(rightEye);
    const avgEAR = (leftEAR + rightEAR) / 2;

    this.blinkHistory.push(avgEAR);
    if (this.blinkHistory.length > this.maxHistoryLength) {
      this.blinkHistory.shift();
    }

    // Detect blink patterns
    const recentBlinks = this.detectBlinkPattern();
    const hasBlinking = recentBlinks >= 2; // At least 2 blinks in recent history

    return {
      type: 'blinking',
      isSpoof: !hasBlinking,
      confidence: hasBlinking ? 0.9 : 0.3,
      reason: hasBlinking ? 'Natural blinking detected' : 'No blinking detected - possible spoof'
    };
  }

  private calculateEyeAspectRatio(eye: Array<{ x: number; y: number }>): number {
    // Calculate vertical distances
    const vertical1 = Math.sqrt(
      Math.pow(eye[1].x - eye[5].x, 2) + Math.pow(eye[1].y - eye[5].y, 2)
    );
    const vertical2 = Math.sqrt(
      Math.pow(eye[2].x - eye[4].x, 2) + Math.pow(eye[2].y - eye[4].y, 2)
    );
    
    // Calculate horizontal distance
    const horizontal = Math.sqrt(
      Math.pow(eye[0].x - eye[3].x, 2) + Math.pow(eye[0].y - eye[3].y, 2)
    );
    
    // Eye Aspect Ratio
    const ear = (vertical1 + vertical2) / (2 * horizontal);
    return ear;
  }

  private detectBlinkPattern(): number {
    if (this.blinkHistory.length < 10) return 0;

    let blinkCount = 0;
    for (let i = 1; i < this.blinkHistory.length; i++) {
      const prev = this.blinkHistory[i - 1];
      const curr = this.blinkHistory[i];
      
      // A blink is detected when EAR drops significantly
      if (prev - curr > this.blinkThreshold) {
        blinkCount++;
      }
    }
    
    return blinkCount;
  }

  private async checkMicroExpressions(faceData?: any): Promise<CheckResult> {
    if (!faceData || !faceData.expressions) {
      return { type: 'micro-expressions', isSpoof: false, confidence: 0.5, reason: 'No expression data' };
    }

    const expressions = faceData.expressions;
    const dominantExpression = expressions.asSortedArray()[0];

    this.expressionHistory.push(dominantExpression.expression);
    if (this.expressionHistory.length > this.maxHistoryLength) {
      this.expressionHistory.shift();
    }

    // Check for natural expression variations
    const hasVariations = this.expressionHistory.length >= 5 && 
      new Set(this.expressionHistory.slice(-5)).size > 1;

    return {
      type: 'micro-expressions',
      isSpoof: !hasVariations,
      confidence: hasVariations ? 0.8 : 0.4,
      reason: hasVariations ? 'Natural micro-expressions detected' : 'Static expressions - possible photo'
    };
  }

  private async checkHeadMovement(faceData?: any): Promise<CheckResult> {
    if (!faceData || !faceData.landmarks) {
      return { type: 'head-movement', isSpoof: false, confidence: 0.5, reason: 'No face data' };
    }

    const landmarks = faceData.landmarks;
    const nose = landmarks.getNose();
    const noseTip = nose[nose.length - 1];

    const now = Date.now();
    this.headMovementHistory.push({ 
      x: noseTip.x, 
      y: noseTip.y, 
      timestamp: now 
    });

    if (this.headMovementHistory.length > this.maxHistoryLength) {
      this.headMovementHistory.shift();
    }

    // Check for natural head movement
    const hasMovement = this.detectNaturalMovement();

    return {
      type: 'head-movement',
      isSpoof: !hasMovement,
      confidence: hasMovement ? 0.7 : 0.3,
      reason: hasMovement ? 'Natural head movement detected' : 'No head movement - possible static image'
    };
  }

  private detectNaturalMovement(): boolean {
    if (this.headMovementHistory.length < 10) return false;

    let totalMovement = 0;
    for (let i = 1; i < this.headMovementHistory.length; i++) {
      const prev = this.headMovementHistory[i - 1];
      const curr = this.headMovementHistory[i];
      
      const distance = Math.sqrt(
        Math.pow(curr.x - prev.x, 2) + Math.pow(curr.y - prev.y, 2)
      );
      
      totalMovement += distance;
    }

    const avgMovement = totalMovement / (this.headMovementHistory.length - 1);
    return avgMovement > this.movementThreshold;
  }

  private async checkTexture(imageData: ImageData): Promise<CheckResult> {
    const data = imageData.data;
    const width = imageData.width;
    const height = imageData.height;

    // Analyze texture patterns to detect printed photos vs real faces
    let textureVariance = 0;
    const sampleSize = 100;
    const samples: number[] = [];

    for (let i = 0; i < sampleSize; i++) {
      const x = Math.floor(Math.random() * width);
      const y = Math.floor(Math.random() * height);
      const idx = (y * width + x) * 4;
      
      // Calculate local texture variance
      const localVariance = this.calculateLocalVariance(data, idx, width);
      samples.push(localVariance);
    }

    // Calculate overall texture variance
    const mean = samples.reduce((a, b) => a + b, 0) / samples.length;
    textureVariance = samples.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / samples.length;

    // Real faces have higher texture variance than printed photos
    const hasRealTexture = textureVariance > 50;

    return {
      type: 'texture',
      isSpoof: !hasRealTexture,
      confidence: hasRealTexture ? 0.8 : 0.4,
      reason: hasRealTexture ? 'Natural skin texture detected' : 'Low texture variance - possible printed photo'
    };
  }

  private calculateLocalVariance(data: Uint8ClampedArray, centerIdx: number, width: number): number {
    const radius = 3;
    const values: number[] = [];

    for (let dy = -radius; dy <= radius; dy++) {
      for (let dx = -radius; dx <= radius; dx++) {
        const idx = centerIdx + (dy * width + dx) * 4;
        if (idx >= 0 && idx < data.length - 3) {
          // Use luminance
          const luminance = (0.299 * data[idx] + 0.587 * data[idx + 1] + 0.114 * data[idx + 2]);
          values.push(luminance);
        }
      }
    }

    if (values.length === 0) return 0;

    const mean = values.reduce((a, b) => a + b, 0) / values.length;
    const variance = values.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / values.length;
    
    return variance;
  }

  private async checkScreenReflection(imageData: ImageData): Promise<CheckResult> {
    const data = imageData.data;
    const width = imageData.width;
    const height = imageData.height;

    // Look for screen reflection patterns (moire, glare, etc.)
    let reflectionScore = 0;
    const step = 10; // Sample every 10th pixel for performance

    for (let y = 0; y < height; y += step) {
      for (let x = 0; x < width; x += step) {
        const idx = (y * width + x) * 4;
        
        // Check for unusual brightness patterns typical of screen reflections
        const brightness = (data[idx] + data[idx + 1] + data[idx + 2]) / 3;
        
        // Screen reflections often have very high brightness with low saturation
        if (brightness > 240) {
          const saturation = this.calculateSaturation(data[idx], data[idx + 1], data[idx + 2]);
          if (saturation < 0.1) {
            reflectionScore++;
          }
        }
      }
    }

    const totalSamples = (width / step) * (height / step);
    const reflectionRatio = reflectionScore / totalSamples;
    const hasScreenReflection = reflectionRatio > 0.05;

    return {
      type: 'screen-reflection',
      isSpoof: hasScreenReflection,
      confidence: hasScreenReflection ? 0.3 : 0.8,
      reason: hasScreenReflection ? 'Screen reflection patterns detected' : 'No screen reflections detected'
    };
  }

  private calculateSaturation(r: number, g: number, b: number): number {
    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    return max === 0 ? 0 : (max - min) / max;
  }

  private async checkPaperTexture(imageData: ImageData): Promise<CheckResult> {
    // Similar to texture check but specifically for paper patterns
    const textureResult = await this.checkTexture(imageData);
    
    // Paper typically has very low texture variance
    const isPaper = textureResult.confidence < 0.5;

    return {
      type: 'paper-texture',
      isSpoof: isPaper,
      confidence: isPaper ? 0.7 : 0.8,
      reason: isPaper ? 'Paper-like texture detected' : 'Natural skin texture detected'
    };
  }

  private async checkDepthConsistency(imageData: ImageData): Promise<CheckResult> {
    // Analyze depth consistency across the face
    // Real faces have natural depth variations, photos have flat appearance
    const data = imageData.data;
    const width = imageData.width;
    const height = imageData.height;

    let depthVariance = 0;
    const regions = this.analyzeDepthRegions(data, width, height);
    
    // Calculate variance between regions
    const mean = regions.reduce((a, b) => a + b, 0) / regions.length;
    depthVariance = regions.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / regions.length;

    const hasDepth = depthVariance > 30;

    return {
      type: 'depth-consistency',
      isSpoof: !hasDepth,
      confidence: hasDepth ? 0.8 : 0.4,
      reason: hasDepth ? 'Natural depth variations detected' : 'Flat appearance - possible photo'
    };
  }

  private analyzeDepthRegions(data: Uint8ClampedArray, width: number, height: number): number[] {
    const regions: number[] = [];
    const regionSize = 50;
    
    for (let y = 0; y < height; y += regionSize) {
      for (let x = 0; x < width; x += regionSize) {
        let regionBrightness = 0;
        let pixelCount = 0;
        
        for (let dy = 0; dy < regionSize && y + dy < height; dy++) {
          for (let dx = 0; dx < regionSize && x + dx < width; dx++) {
            const idx = ((y + dy) * width + (x + dx)) * 4;
            regionBrightness += (data[idx] + data[idx + 1] + data[idx + 2]) / 3;
            pixelCount++;
          }
        }
        
        regions.push(regionBrightness / pixelCount);
      }
    }
    
    return regions;
  }

  private async checkEyeBlinkSequence(faceData?: any): Promise<CheckResult> {
    // More sophisticated blink sequence analysis
    const blinkResult = await this.checkBlinking(faceData);
    
    return {
      type: 'eye-blink-sequence',
      isSpoof: blinkResult.isSpoof,
      confidence: blinkResult.confidence,
      reason: blinkResult.reason
    };
  }

  private async checkLightingInconsistency(imageData: ImageData): Promise<CheckResult> {
    const data = imageData.data;
    const width = imageData.width;
    const height = imageData.height;

    // Check for inconsistent lighting patterns typical of photos
    let lightingScore = 0;
    const step = 20;

    for (let y = 0; y < height; y += step) {
      for (let x = 0; x < width; x += step) {
        const idx = (y * width + x) * 4;
        const brightness = (data[idx] + data[idx + 1] + data[idx + 2]) / 3;
        
        // Check for harsh lighting transitions
        if (x > 0 && y > 0) {
          const prevIdx = ((y - step) * width + (x - step)) * 4;
          const prevBrightness = (data[prevIdx] + data[prevIdx + 1] + data[prevIdx + 2]) / 3;
          const diff = Math.abs(brightness - prevBrightness);
          
          if (diff > 100) {
            lightingScore++;
          }
        }
      }
    }

    const totalSamples = (width / step) * (height / step);
    const lightingRatio = lightingScore / totalSamples;
    const hasInconsistentLighting = lightingRatio > 0.1;

    return {
      type: 'lighting-inconsistency',
      isSpoof: hasInconsistentLighting,
      confidence: hasInconsistentLighting ? 0.6 : 0.8,
      reason: hasInconsistentLighting ? 'Inconsistent lighting detected' : 'Natural lighting detected'
    };
  }

  private async checkEdgeArtifacts(imageData: ImageData): Promise<CheckResult> {
    // Check for edge artifacts typical of digital manipulation
    const data = imageData.data;
    const width = imageData.width;
    const height = imageData.height;

    let edgeArtifacts = 0;
    const step = 5;

    for (let y = step; y < height - step; y += step) {
      for (let x = step; x < width - step; x += step) {
        const centerIdx = (y * width + x) * 4;
        const centerBrightness = (data[centerIdx] + data[centerIdx + 1] + data[centerIdx + 2]) / 3;
        
        // Check surrounding pixels
        let maxDiff = 0;
        for (let dy = -1; dy <= 1; dy++) {
          for (let dx = -1; dx <= 1; dx++) {
            if (dx === 0 && dy === 0) continue;
            
            const surroundIdx = ((y + dy) * width + (x + dx)) * 4;
            const surroundBrightness = (data[surroundIdx] + data[surroundIdx + 1] + data[surroundIdx + 2]) / 3;
            const diff = Math.abs(centerBrightness - surroundBrightness);
            maxDiff = Math.max(maxDiff, diff);
          }
        }
        
        // Sharp edges indicate potential artifacts
        if (maxDiff > 150) {
          edgeArtifacts++;
        }
      }
    }

    const totalSamples = ((width - 2 * step) / step) * ((height - 2 * step) / step);
    const artifactRatio = edgeArtifacts / totalSamples;
    const hasArtifacts = artifactRatio > 0.15;

    return {
      type: 'edge-artifacts',
      isSpoof: hasArtifacts,
      confidence: hasArtifacts ? 0.5 : 0.8,
      reason: hasArtifacts ? 'Edge artifacts detected' : 'No significant edge artifacts'
    };
  }

  // Reset detection history (useful for new verification attempts)
  resetHistory(): void {
    this.blinkHistory = [];
    this.expressionHistory = [];
    this.headMovementHistory = [];
  }
}

// Singleton instance
export const livenessDetectionService = new LivenessDetectionService();

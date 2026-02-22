/**
 * TensorFlow.js Pose Detection Service
 * Reliable pose detection using TensorFlow.js and PoseNet
 */

import * as tf from '@tensorflow/tfjs';
import * as posenet from '@tensorflow-models/posenet';

import type {
  PoseLandmark,
  PoseDetectionConfig,
  CameraConfig,
  PoseDetectionError,
  FormAnalysis,
} from '@/types/pose';

export interface TensorFlowPoseConfig {
  architecture: 'MobileNetV1' | 'ResNet50';
  outputStride: 8 | 16 | 32;
  inputResolution: number;
  multiplier: 0.50 | 0.75 | 1.0;
  quantBytes: 1 | 2 | 4;
  scoreThreshold: number;
  nmsRadius: number;
}

export class TensorFlowPoseService {
  private model: posenet.PoseNet | null = null;
  private videoElement: HTMLVideoElement | null = null;
  private canvasElement: HTMLCanvasElement | null = null;
  private canvasCtx: CanvasRenderingContext2D | null = null;
  private stream: MediaStream | null = null;
  private isInitialized = false;
  private isDetecting = false;
  private currentPose: PoseLandmark[] | null = null;
  private animationFrameId: number | null = null;
  private onPoseDetected?: (landmarks: PoseLandmark[]) => void;
  private onError?: (error: PoseDetectionError) => void;

  private readonly defaultConfig: TensorFlowPoseConfig = {
    architecture: 'MobileNetV1',
    outputStride: 16,
    inputResolution: 513,
    multiplier: 0.75,
    quantBytes: 2,
    scoreThreshold: 0.5,
    nmsRadius: 20,
  };

  private readonly defaultCameraConfig: CameraConfig = {
    width: 640,
    height: 480,
    facingMode: 'user',
    frameRate: 30,
  };

  constructor() {
    this.initializeTensorFlow();
  }

  /**
   * Initialize TensorFlow.js backend
   */
  private async initializeTensorFlow(): Promise<void> {
    try {
      // Let TensorFlow.js choose the best available backend automatically
      await tf.ready();
      console.log(`✅ TensorFlow.js initialized with ${tf.getBackend()} backend`);
    } catch (error) {
      console.error('❌ Failed to initialize TensorFlow.js:', error);
      throw new Error('Failed to initialize TensorFlow.js');
    }
  }

  /**
   * Load PoseNet model
   */
  private async loadModel(config: TensorFlowPoseConfig): Promise<void> {
    try {
      console.log('🔄 Loading PoseNet model...');
      
      this.model = await posenet.load({
        architecture: config.architecture,
        outputStride: config.outputStride,
        inputResolution: config.inputResolution,
        multiplier: config.multiplier,
        quantBytes: config.quantBytes,
      });

      console.log('✅ PoseNet model loaded successfully');
    } catch (error) {
      console.error('❌ Failed to load PoseNet model:', error);
      throw new Error(`Failed to load PoseNet model: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Initialize pose detection
   */
  async initialize(
    videoElement: HTMLVideoElement,
    canvasElement: HTMLCanvasElement,
    config: Partial<TensorFlowPoseConfig> = {},
    cameraConfig: Partial<CameraConfig> = {}
  ): Promise<void> {
    try {
      this.videoElement = videoElement;
      this.canvasElement = canvasElement;
      this.canvasCtx = canvasElement.getContext('2d');

      if (!this.canvasCtx) {
        throw new Error('Failed to get canvas context');
      }

      const poseConfig = { ...this.defaultConfig, ...config };
      const camConfig = { ...this.defaultCameraConfig, ...cameraConfig };

      // Load the model
      await this.loadModel(poseConfig);

      // Set canvas dimensions
      this.canvasElement.width = camConfig.width;
      this.canvasElement.height = camConfig.height;

      this.isInitialized = true;
      console.log('✅ TensorFlow pose detection service initialized');
    } catch (error) {
      const poseError: PoseDetectionError = {
        type: 'model_load_failed',
        message: `Failed to initialize pose detection: ${error instanceof Error ? error.message : 'Unknown error'}`,
        recoverable: true,
      };
      this.handleError(poseError);
      throw error;
    }
  }

  /**
   * Start pose detection
   */
  async startDetection(): Promise<void> {
    if (!this.isInitialized || !this.model || !this.videoElement) {
      throw new Error('Pose detection service not initialized');
    }

    try {
      console.log('🎥 Starting camera...');
      
      // Get camera stream
      this.stream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: this.defaultCameraConfig.width,
          height: this.defaultCameraConfig.height,
          facingMode: this.defaultCameraConfig.facingMode,
          frameRate: this.defaultCameraConfig.frameRate,
        },
      });

      this.videoElement.srcObject = this.stream;
      await this.videoElement.play();

      this.isDetecting = true;
      
      // Start processing frames
      this.processFrame();
      
      console.log('✅ Pose detection started');
    } catch (error) {
      const poseError: PoseDetectionError = {
        type: 'camera_access_denied',
        message: 'Failed to access camera. Please grant camera permissions.',
        recoverable: true,
      };
      this.handleError(poseError);
      throw error;
    }
  }

  /**
   * Process video frames for pose detection
   */
  private async processFrame(): Promise<void> {
    if (!this.isDetecting || !this.model || !this.videoElement || !this.canvasCtx || !this.canvasElement) {
      return;
    }

    try {
      // Detect pose
      const pose = await this.model.estimateSinglePose(this.videoElement, {
        flipHorizontal: true,
        decodingMethod: 'single-person',
      });

      // Clear canvas
      this.canvasCtx.save();
      this.canvasCtx.clearRect(0, 0, this.canvasElement.width, this.canvasElement.height);

      // Draw video frame
      this.canvasCtx.scale(-1, 1); // Flip horizontally for mirror effect
      this.canvasCtx.drawImage(
        this.videoElement,
        -this.canvasElement.width,
        0,
        this.canvasElement.width,
        this.canvasElement.height
      );
      this.canvasCtx.restore();

      // Process pose if detected with good confidence
      if (pose && pose.score > this.defaultConfig.scoreThreshold) {
        // Convert PoseNet keypoints to our PoseLandmark format
        const landmarks: PoseLandmark[] = pose.keypoints.map((keypoint) => ({
          x: keypoint.position.x / this.canvasElement!.width, // Normalize to 0-1
          y: keypoint.position.y / this.canvasElement!.height, // Normalize to 0-1
          z: 0, // PoseNet doesn't provide Z coordinate
          visibility: keypoint.score,
        }));

        this.currentPose = landmarks;

        // Draw pose
        this.drawPose(pose);

        // Notify listeners
        if (this.onPoseDetected) {
          this.onPoseDetected(landmarks);
        }
      }

      // Schedule next frame
      this.animationFrameId = requestAnimationFrame(() => this.processFrame());
    } catch (error) {
      console.error('❌ Error processing frame:', error);
      // Continue processing despite errors
      this.animationFrameId = requestAnimationFrame(() => this.processFrame());
    }
  }

  /**
   * Draw pose on canvas
   */
  private drawPose(pose: posenet.Pose): void {
    if (!this.canvasCtx || !this.canvasElement) return;

    const ctx = this.canvasCtx;
    const minPartConfidence = 0.5;
    const minPoseConfidence = 0.1;

    // Draw keypoints
    pose.keypoints.forEach((keypoint) => {
      if (keypoint.score > minPartConfidence) {
        ctx.beginPath();
        ctx.arc(keypoint.position.x, keypoint.position.y, 5, 0, 2 * Math.PI);
        ctx.fillStyle = '#FF0000';
        ctx.fill();
      }
    });

    // Draw skeleton
    const adjacentKeyPoints = posenet.getAdjacentKeyPoints(pose.keypoints, minPoseConfidence);
    
    adjacentKeyPoints.forEach((keypoints) => {
      ctx.beginPath();
      ctx.moveTo(keypoints[0].position.x, keypoints[0].position.y);
      ctx.lineTo(keypoints[1].position.x, keypoints[1].position.y);
      ctx.lineWidth = 2;
      ctx.strokeStyle = '#00FF00';
      ctx.stroke();
    });
  }

  /**
   * Stop pose detection
   */
  stopDetection(): void {
    this.isDetecting = false;
    
    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }
    
    if (this.stream) {
      this.stream.getTracks().forEach(track => track.stop());
      this.stream = null;
    }
    
    if (this.videoElement) {
      this.videoElement.srcObject = null;
    }
    
    console.log('🛑 Pose detection stopped');
  }

  /**
   * Get current pose landmarks
   */
  getCurrentPose(): PoseLandmark[] | null {
    return this.currentPose;
  }

  /**
   * Set pose detection callback
   */
  setOnPoseDetected(callback: (landmarks: PoseLandmark[]) => void): void {
    this.onPoseDetected = callback;
  }

  /**
   * Set error callback
   */
  setOnError(callback: (error: PoseDetectionError) => void): void {
    this.onError = callback;
  }

  /**
   * Handle errors
   */
  private handleError(error: PoseDetectionError): void {
    console.error('❌ Pose detection error:', error);
    if (this.onError) {
      this.onError(error);
    }
  }

  /**
   * Check if browser supports required features
   */
  static checkBrowserSupport(): { supported: boolean; missingFeatures: string[] } {
    if (typeof window === 'undefined') {
      return { supported: true, missingFeatures: [] };
    }

    const missingFeatures: string[] = [];
    
    try {
      // Check for getUserMedia support
      if (!navigator?.mediaDevices?.getUserMedia) {
        missingFeatures.push('Camera access (getUserMedia)');
      }

      // Check for Canvas 2D support
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        missingFeatures.push('Canvas 2D');
      }
    } catch (error) {
      console.warn('⚠️ Browser support check failed:', error);
    }

    return {
      supported: missingFeatures.length === 0,
      missingFeatures,
    };
  }

  /**
   * Analyze pose for form correctness
   */
  analyzePoseForm(landmarks: PoseLandmark[], exerciseId: string): FormAnalysis {
    // Import the form analysis service dynamically
    const { formAnalysisService } = require('./formAnalysisService');
    
    return formAnalysisService.analyzePoseForm(landmarks, exerciseId);
  }

  /**
   * Cleanup resources
   */
  dispose(): void {
    this.stopDetection();
    
    if (this.model) {
      this.model.dispose();
      this.model = null;
    }
    
    this.videoElement = null;
    this.canvasElement = null;
    this.canvasCtx = null;
    this.currentPose = null;
    this.isInitialized = false;
    
    console.log('🧹 TensorFlow pose detection service disposed');
  }
}

// Export singleton instance
export const tensorflowPoseService = new TensorFlowPoseService();
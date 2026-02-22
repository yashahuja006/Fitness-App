/**
 * Enhanced Pose Detection Service
 * Integrates TensorFlow.js and MediaPipe for real-time pose detection with advanced analysis
 * 
 * Task 15.2: Integration and system wiring - Update existing pose detection service integration
 * - Enhanced with new advanced analysis pipeline
 * - Maintained backward compatibility with existing components
 * - Added new advanced analysis pipeline
 * - Included performance optimization
 */

import * as tf from '@tensorflow/tfjs';
import '@tensorflow/tfjs-backend-webgl';

import type {
  PoseLandmark,
  PoseDetectionConfig,
  CameraConfig,
  PoseDetectionError,
  FormAnalysis,
} from '@/types/pose';

import type {
  ExerciseType,
  ExerciseMode,
  ExerciseAngles,
  FormViolation,
  FeedbackResponse,
  ViewAnalysis,
  RepCountResult,
  ExerciseState
} from '@/types/advancedPose';

// MediaPipe pose detection using CDN
declare global {
  interface Window {
    Pose: any;
    drawConnectors: any;
    drawLandmarks: any;
    POSE_CONNECTIONS: any;
  }
}

export class PoseDetectionService {
  private pose: any = null;
  private videoElement: HTMLVideoElement | null = null;
  private canvasElement: HTMLCanvasElement | null = null;
  private canvasCtx: CanvasRenderingContext2D | null = null;
  private stream: MediaStream | null = null;
  private isInitialized = false;
  private currentPose: PoseLandmark[] | null = null;
  private onPoseDetected?: (landmarks: PoseLandmark[]) => void;
  private onError?: (error: PoseDetectionError) => void;

  // Enhanced analysis integration
  private isAdvancedAnalysisEnabled = false;
  private exerciseType: ExerciseType = 'squat';
  private exerciseMode: ExerciseMode = 'beginner';
  private currentState: ExerciseState = 's1';
  private analysisServices: {
    angleCalculator?: any;
    exerciseStateMachine?: any;
    formAnalysisService?: any;
    repCounter?: any;
    cameraViewAnalyzer?: any;
    adaptiveFeedbackEngine?: any;
  } = {};

  // Performance optimization (Task 16.1)
  private useWebWorker = true;
  private angleCalculatorWorker?: any;
  private performanceMonitor?: any;
  private frameThrottleInterval = 0; // 0 = no throttling
  private lastProcessedFrameTime = 0;

  private readonly defaultConfig: PoseDetectionConfig = {
    modelComplexity: 1,
    smoothLandmarks: true,
    enableSegmentation: false,
    smoothSegmentation: true,
    minDetectionConfidence: 0.5,
    minTrackingConfidence: 0.5,
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
      // Set backend to WebGL for better performance
      await tf.setBackend('webgl');
      await tf.ready();
      console.log('TensorFlow.js initialized with WebGL backend');
    } catch (error) {
      console.warn('Failed to initialize WebGL backend, falling back to CPU:', error);
      try {
        await tf.setBackend('cpu');
        await tf.ready();
        console.log('TensorFlow.js initialized with CPU backend');
      } catch (cpuError) {
        console.error('Failed to initialize TensorFlow.js:', cpuError);
        throw new Error('Failed to initialize TensorFlow.js');
      }
    }
  }

  /**
   * Load MediaPipe scripts dynamically
   */
  private async loadMediaPipeScripts(): Promise<void> {
    if (typeof window === 'undefined') return;

    // Check if already loaded
    if (window.Pose) return;

    return new Promise((resolve, reject) => {
      const scripts = [
        'https://cdn.jsdelivr.net/npm/@mediapipe/camera_utils/camera_utils.js',
        'https://cdn.jsdelivr.net/npm/@mediapipe/control_utils/control_utils.js',
        'https://cdn.jsdelivr.net/npm/@mediapipe/drawing_utils/drawing_utils.js',
        'https://cdn.jsdelivr.net/npm/@mediapipe/pose/pose.js'
      ];

      let loadedCount = 0;
      const totalScripts = scripts.length;

      scripts.forEach((src) => {
        const script = document.createElement('script');
        script.src = src;
        script.onload = () => {
          loadedCount++;
          if (loadedCount === totalScripts) {
            resolve();
          }
        };
        script.onerror = () => reject(new Error(`Failed to load ${src}`));
        document.head.appendChild(script);
      });
    });
  }

  /**
   * Initialize pose detection with MediaPipe
   */
  async initialize(
    videoElement: HTMLVideoElement,
    canvasElement: HTMLCanvasElement,
    config: Partial<PoseDetectionConfig> = {},
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

      // Load MediaPipe scripts
      await this.loadMediaPipeScripts();

      // Initialize MediaPipe Pose
      this.pose = new window.Pose({
        locateFile: (file: string) => {
          return `https://cdn.jsdelivr.net/npm/@mediapipe/pose/${file}`;
        },
      });

      this.pose.setOptions(poseConfig);

      // Set up pose detection callback
      this.pose.onResults((results: any) => {
        this.onResults(results);
      });

      // Set canvas dimensions
      this.canvasElement.width = camConfig.width;
      this.canvasElement.height = camConfig.height;

      this.isInitialized = true;
      console.log('Pose detection service initialized successfully');
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
   * Enable advanced analysis with service integration
   */
  async enableAdvancedAnalysis(
    exerciseType: ExerciseType = 'squat',
    exerciseMode: ExerciseMode = 'beginner',
    options: { useWebWorker?: boolean; targetFPS?: number } = {}
  ): Promise<void> {
    this.isAdvancedAnalysisEnabled = true;
    this.exerciseType = exerciseType;
    this.exerciseMode = exerciseMode;
    this.useWebWorker = options.useWebWorker !== false; // Default to true

    try {
      // Initialize performance monitor (Task 16.1)
      const { PerformanceMonitor } = await import('@/lib/performanceMonitor');
      this.performanceMonitor = new PerformanceMonitor({
        targetFPS: options.targetFPS || 30,
        maxLatency: 50,
        memoryThreshold: 500,
        sampleWindow: 30
      });

      // Initialize Web Worker for angle calculations if enabled (Task 16.1)
      if (this.useWebWorker) {
        const { AngleCalculatorWorkerService } = await import('@/lib/angleCalculatorWorkerService');
        this.angleCalculatorWorker = new AngleCalculatorWorkerService();
        await this.angleCalculatorWorker.initialize();
        console.log('Web Worker enabled for angle calculations');
      }

      // Dynamically import analysis services to avoid circular dependencies
      const [
        { angleCalculator },
        { exerciseStateMachine },
        { formAnalysisService },
        { repCounter },
        { cameraViewAnalyzer },
        { adaptiveFeedbackEngine }
      ] = await Promise.all([
        import('@/lib/angleCalculator'),
        import('@/lib/exerciseStateMachine'),
        import('@/lib/formAnalysisService'),
        import('@/lib/repCounter'),
        import('@/lib/cameraViewAnalyzer'),
        import('@/lib/adaptiveFeedbackEngine')
      ]);

      this.analysisServices = {
        angleCalculator,
        exerciseStateMachine,
        formAnalysisService,
        repCounter,
        cameraViewAnalyzer,
        adaptiveFeedbackEngine
      };

      // Configure services for current exercise
      this.analysisServices.exerciseStateMachine?.setExerciseMode(exerciseMode);
      this.analysisServices.repCounter?.updateConfig({ mode: exerciseMode });

      console.log('Advanced analysis enabled with integrated services');
    } catch (error) {
      console.error('Failed to enable advanced analysis:', error);
      this.isAdvancedAnalysisEnabled = false;
      throw new Error('Failed to initialize advanced analysis services');
    }
  }

  /**
   * Disable advanced analysis
   */
  disableAdvancedAnalysis(): void {
    this.isAdvancedAnalysisEnabled = false;
    this.analysisServices = {};
    
    // Clean up Web Worker (Task 16.1)
    if (this.angleCalculatorWorker) {
      this.angleCalculatorWorker.dispose();
      this.angleCalculatorWorker = undefined;
    }
    
    // Reset performance monitor (Task 16.1)
    if (this.performanceMonitor) {
      this.performanceMonitor.reset();
      this.performanceMonitor = undefined;
    }
  }

  /**
   * Start pose detection
   */
  async startDetection(): Promise<void> {
    if (!this.isInitialized || !this.pose || !this.videoElement) {
      throw new Error('Pose detection service not initialized');
    }

    try {
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
      this.videoElement.play();

      // Start processing frames
      this.processFrame();
      
      console.log('Pose detection started');
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
   * Process video frames
   */
  private processFrame(): void {
    if (!this.pose || !this.videoElement || !this.stream) return;

    const processNextFrame = () => {
      if (this.pose && this.videoElement && this.stream) {
        this.pose.send({ image: this.videoElement });
        requestAnimationFrame(processNextFrame);
      }
    };

    requestAnimationFrame(processNextFrame);
  }

  /**
   * Stop pose detection
   */
  stopDetection(): void {
    if (this.stream) {
      this.stream.getTracks().forEach(track => track.stop());
      this.stream = null;
    }
    
    if (this.videoElement) {
      this.videoElement.srcObject = null;
    }
    
    console.log('Pose detection stopped');
  }

  /**
   * Handle pose detection results with integrated advanced analysis
   */
  private async onResults(results: any): Promise<void> {
    if (!this.canvasCtx || !this.canvasElement) return;

    // Clear canvas
    this.canvasCtx.save();
    this.canvasCtx.clearRect(0, 0, this.canvasElement.width, this.canvasElement.height);

    // Draw the image
    this.canvasCtx.drawImage(results.image, 0, 0, this.canvasElement.width, this.canvasElement.height);

    if (results.poseLandmarks) {
      // Convert MediaPipe landmarks to our format
      const landmarks: PoseLandmark[] = results.poseLandmarks.map((landmark: any) => ({
        x: landmark.x,
        y: landmark.y,
        z: landmark.z,
        visibility: landmark.visibility || 1,
      }));

      this.currentPose = landmarks;

      // Draw pose landmarks and connections
      if (window.drawConnectors && window.drawLandmarks && window.POSE_CONNECTIONS) {
        window.drawConnectors(this.canvasCtx, results.poseLandmarks, window.POSE_CONNECTIONS, {
          color: '#00FF00',
          lineWidth: 4,
        });
        window.drawLandmarks(this.canvasCtx, results.poseLandmarks, {
          color: '#FF0000',
          lineWidth: 2,
        });
      }

      // Perform advanced analysis if enabled (with frame throttling - Task 16.1)
      if (this.isAdvancedAnalysisEnabled && this.analysisServices.angleCalculator) {
        const now = performance.now();
        
        // Apply frame throttling if configured
        if (this.frameThrottleInterval === 0 || 
            now - this.lastProcessedFrameTime >= this.frameThrottleInterval) {
          this.lastProcessedFrameTime = now;
          await this.performAdvancedAnalysis(landmarks);
        }
      }

      // Notify listeners
      if (this.onPoseDetected) {
        this.onPoseDetected(landmarks);
      }
    }

    this.canvasCtx.restore();
  }

  /**
   * Perform integrated advanced analysis with performance monitoring (Task 16.1)
   */
  private async performAdvancedAnalysis(landmarks: PoseLandmark[]): Promise<void> {
    // Start performance monitoring (Task 16.1)
    const frameStartTime = this.performanceMonitor?.startFrame() || performance.now();

    try {
      const {
        angleCalculator,
        exerciseStateMachine,
        formAnalysisService,
        repCounter,
        cameraViewAnalyzer,
        adaptiveFeedbackEngine
      } = this.analysisServices;

      if (!angleCalculator || !exerciseStateMachine || !formAnalysisService || 
          !repCounter || !cameraViewAnalyzer || !adaptiveFeedbackEngine) {
        return; // Services not loaded
      }

      // 1. Calculate angles (using Web Worker if enabled - Task 16.1)
      let angles: ExerciseAngles;
      if (this.useWebWorker && this.angleCalculatorWorker?.isReady()) {
        // Offload to Web Worker for better performance
        angles = await this.angleCalculatorWorker.extractExerciseAngles(landmarks);
      } else {
        // Fallback to main thread calculation
        angles = angleCalculator.extractExerciseAngles(landmarks);
      }

      // 2. Analyze camera view
      const viewAnalysis: ViewAnalysis = cameraViewAnalyzer.analyzeView({
        nose: landmarks[0],
        leftShoulder: landmarks[11],
        rightShoulder: landmarks[12],
        leftHip: landmarks[23],
        rightHip: landmarks[24]
      });

      // 3. Update exercise state
      const stateTransition = exerciseStateMachine.updateState(angles);
      this.currentState = stateTransition.currentState;

      // 4. Analyze form violations
      const formViolations: FormViolation[] = formAnalysisService.analyzeAdvancedForm(
        landmarks,
        angles,
        this.exerciseType,
        this.exerciseMode
      );

      // 5. Check for rep completion
      const repResult: RepCountResult = repCounter.processStateTransition(stateTransition, formViolations);

      // 6. Generate adaptive feedback
      const feedbackResponse: FeedbackResponse = adaptiveFeedbackEngine.generateFeedback(
        formViolations,
        this.currentState,
        angles,
        viewAnalysis,
        repResult.repCompleted ? repResult : undefined,
        this.exerciseMode
      );

      // Store analysis results for external access
      this.storeAnalysisResults({
        angles,
        viewAnalysis,
        stateTransition,
        formViolations,
        repResult,
        feedbackResponse
      });

      // End performance monitoring with landmark confidence (Task 16.1)
      if (this.performanceMonitor) {
        const avgConfidence = landmarks.reduce((sum, l) => sum + l.visibility, 0) / landmarks.length;
        this.performanceMonitor.endFrame(frameStartTime, avgConfidence);
      }

    } catch (error) {
      console.error('Advanced analysis error:', error);
      
      // End performance monitoring even on error (Task 16.1)
      if (this.performanceMonitor) {
        this.performanceMonitor.endFrame(frameStartTime);
      }
      
      // Continue with basic pose detection even if advanced analysis fails
    }
  }

  /**
   * Store analysis results for external access
   */
  private storeAnalysisResults(results: {
    angles: ExerciseAngles;
    viewAnalysis: ViewAnalysis;
    stateTransition: any;
    formViolations: FormViolation[];
    repResult: RepCountResult;
    feedbackResponse: FeedbackResponse;
  }): void {
    // Store results in service for external access
    (this as any).lastAnalysisResults = results;
  }

  /**
   * Get last analysis results (for external access)
   */
  getLastAnalysisResults(): any {
    return (this as any).lastAnalysisResults || null;
  }

  /**
   * Get current pose landmarks
   */
  getCurrentPose(): PoseLandmark[] | null {
    return this.currentPose;
  }

  /**
   * Get current exercise state (advanced analysis)
   */
  getCurrentExerciseState(): ExerciseState {
    return this.currentState;
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
    console.error('Pose detection error:', error);
    if (this.onError) {
      this.onError(error);
    }
  }

  /**
   * Check if browser supports required features
   */
  static checkBrowserSupport(): { supported: boolean; missingFeatures: string[] } {
    // Always return supported during SSR to avoid hydration mismatches
    if (typeof window === 'undefined') {
      return {
        supported: true,
        missingFeatures: [],
      };
    }

    // Defer the actual check to avoid hydration issues
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
      console.warn('Browser support check failed:', error);
      // Don't fail completely, just log the error
    }

    return {
      supported: missingFeatures.length === 0,
      missingFeatures,
    };
  }

  /**
   * Analyze pose for form correctness using advanced form analysis service
   */
  analyzePoseForm(landmarks: PoseLandmark[], exerciseId: string): FormAnalysis {
    // Import the form analysis service dynamically to avoid circular dependencies
    const { formAnalysisService } = require('./formAnalysisService');
    
    return formAnalysisService.analyzePoseForm(landmarks, exerciseId);
  }

  /**
   * Calculate basic form score based on pose landmarks
   */
  private calculateBasicFormScore(landmarks: PoseLandmark[]): number {
    if (landmarks.length === 0) return 0;

    // Basic scoring based on landmark visibility and positioning
    let score = 1;
    let visibilitySum = 0;
    let visibleLandmarks = 0;

    for (const landmark of landmarks) {
      if (landmark.visibility > 0.5) {
        visibilitySum += landmark.visibility;
        visibleLandmarks++;
      }
    }

    if (visibleLandmarks > 0) {
      const averageVisibility = visibilitySum / visibleLandmarks;
      score = Math.min(score, averageVisibility);
    }

    // Ensure score is between 0 and 1
    return Math.max(0, Math.min(1, score));
  }

  /**
   * Update exercise configuration
   */
  updateExerciseConfig(exerciseType: ExerciseType, exerciseMode: ExerciseMode): void {
    this.exerciseType = exerciseType;
    this.exerciseMode = exerciseMode;

    // Update analysis services if enabled
    if (this.isAdvancedAnalysisEnabled) {
      this.analysisServices.exerciseStateMachine?.setExerciseMode(exerciseMode);
      this.analysisServices.repCounter?.updateConfig({ mode: exerciseMode });
    }
  }

  /**
   * Set frame rate throttling (Task 16.1)
   * @param targetFPS Target frames per second (0 = no throttling, 15-30 recommended)
   */
  setFrameRateThrottle(targetFPS: number): void {
    if (targetFPS <= 0) {
      this.frameThrottleInterval = 0; // No throttling
    } else {
      this.frameThrottleInterval = 1000 / targetFPS; // Convert FPS to milliseconds
    }
    
    // Update performance monitor target FPS
    if (this.performanceMonitor) {
      this.performanceMonitor.updateConfig({ targetFPS });
    }
    
    console.log(`Frame rate throttle set to ${targetFPS} FPS (${this.frameThrottleInterval}ms interval)`);
  }

  /**
   * Enable or disable Web Worker for angle calculations (Task 16.1)
   */
  async setUseWebWorker(enabled: boolean): Promise<void> {
    if (enabled === this.useWebWorker) {
      return; // No change needed
    }

    this.useWebWorker = enabled;

    if (enabled && !this.angleCalculatorWorker) {
      // Initialize Web Worker
      const { AngleCalculatorWorkerService } = await import('@/lib/angleCalculatorWorkerService');
      this.angleCalculatorWorker = new AngleCalculatorWorkerService();
      await this.angleCalculatorWorker.initialize();
      console.log('Web Worker enabled for angle calculations');
    } else if (!enabled && this.angleCalculatorWorker) {
      // Dispose Web Worker
      this.angleCalculatorWorker.dispose();
      this.angleCalculatorWorker = undefined;
      console.log('Web Worker disabled for angle calculations');
    }
  }

  /**
   * Get performance metrics (Task 16.1 - Enhanced with performance monitor)
   */
  getPerformanceMetrics(): {
    frameRate: number;
    processingLatency: number;
    memoryUsage: number;
    landmarkConfidence: number;
    analysisAccuracy?: number;
    droppedFrames?: number;
    totalFrames?: number;
    performanceIssues?: string[];
    recommendations?: string[];
  } {
    // Use performance monitor if available (Task 16.1)
    if (this.performanceMonitor) {
      const metrics = this.performanceMonitor.getMetrics();
      const performance = this.performanceMonitor.isPerformanceAcceptable();
      const recommendations = this.performanceMonitor.getRecommendations();

      return {
        frameRate: metrics.frameRate,
        processingLatency: metrics.processingLatency,
        memoryUsage: metrics.memoryUsage,
        landmarkConfidence: metrics.landmarkConfidence,
        analysisAccuracy: metrics.analysisAccuracy,
        droppedFrames: metrics.droppedFrames,
        totalFrames: metrics.totalFrames,
        performanceIssues: performance.issues,
        recommendations: recommendations.length > 0 ? recommendations : undefined
      };
    }

    // Fallback to basic metrics
    const metrics = {
      frameRate: 30, // Estimated based on camera config
      processingLatency: 33, // ~33ms for 30fps
      memoryUsage: 0, // Would need performance.memory API
      landmarkConfidence: 0
    };

    // Calculate average landmark confidence if pose is available
    if (this.currentPose && this.currentPose.length > 0) {
      const totalConfidence = this.currentPose.reduce((sum, landmark) => sum + landmark.visibility, 0);
      metrics.landmarkConfidence = totalConfidence / this.currentPose.length;
    }

    // Get memory usage if available
    if ('memory' in performance) {
      metrics.memoryUsage = (performance as any).memory.usedJSHeapSize / 1024 / 1024; // MB
    }

    return metrics;
  }

  /**
   * Cleanup resources (Task 16.1 - Enhanced with worker and monitor cleanup)
   */
  dispose(): void {
    this.stopDetection();
    
    if (this.pose) {
      this.pose.close();
      this.pose = null;
    }
    
    // Clean up Web Worker (Task 16.1)
    if (this.angleCalculatorWorker) {
      this.angleCalculatorWorker.dispose();
      this.angleCalculatorWorker = undefined;
    }
    
    // Clean up performance monitor (Task 16.1)
    if (this.performanceMonitor) {
      this.performanceMonitor.reset();
      this.performanceMonitor = undefined;
    }
    
    this.videoElement = null;
    this.canvasElement = null;
    this.canvasCtx = null;
    this.currentPose = null;
    this.isInitialized = false;
    this.isAdvancedAnalysisEnabled = false;
    this.analysisServices = {};
    
    console.log('Pose detection service disposed');
  }
}

// Export the class for manual instantiation when needed
export { PoseDetectionService };
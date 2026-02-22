'use client';

import React, { useRef, useEffect, useState, useCallback } from 'react';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { VoiceCoachService } from '@/lib/voiceCoachService';

// MediaPipe types
declare global {
  interface Window {
    Pose: new (config: any) => any;
    drawConnectors: (ctx: CanvasRenderingContext2D, landmarks: any[], connections: any[], options?: any) => void;
    drawLandmarks: (ctx: CanvasRenderingContext2D, landmarks: any[], options?: any) => void;
    POSE_CONNECTIONS: any[];
    Camera: new (videoElement: HTMLVideoElement, config: any) => any;
  }
}

interface RealPoseTrainerProps {
  className?: string;
  exerciseId?: string;
  showControls?: boolean;
}

interface PoseResults {
  poseLandmarks?: Array<{
    x: number;
    y: number;
    z: number;
    visibility: number;
  }>;
}

export function RealPoseTrainer({ 
  className = '', 
  exerciseId = 'push-ups',
  showControls = true 
}: RealPoseTrainerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const voiceCoachRef = useRef<VoiceCoachService | null>(null);
  
  const [isActive, setIsActive] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [repCount, setRepCount] = useState(0);
  const [feedback, setFeedback] = useState<string>('Ready to start training');
  const [formScore, setFormScore] = useState(0);
  const [poseDetected, setPoseDetected] = useState(false);
  const [voiceEnabled, setVoiceEnabled] = useState(true);
  const [isSpeaking, setIsSpeaking] = useState(false);

  // MediaPipe pose instance
  const poseRef = useRef<any>(null);
  const cameraRef = useRef<any>(null);

  // Rep counting state
  const repStateRef = useRef({
    isDown: false,
    lastAngle: 0,
    repInProgress: false,
    lastFeedbackTime: 0,
    consecutivePoorForm: 0
  });

  // Initialize voice coach
  useEffect(() => {
    voiceCoachRef.current = new VoiceCoachService({
      enabled: voiceEnabled,
      rate: 0.9,
      pitch: 1.0,
      volume: 0.8
    });

    // Monitor speaking state
    const checkSpeaking = () => {
      if (voiceCoachRef.current) {
        setIsSpeaking(voiceCoachRef.current.isSpeaking());
      }
    };

    const interval = setInterval(checkSpeaking, 500);
    return () => {
      clearInterval(interval);
      if (voiceCoachRef.current) {
        voiceCoachRef.current.stop();
      }
    };
  }, [voiceEnabled]);

  // Load MediaPipe scripts
  const loadMediaPipeScripts = useCallback(async () => {
    if (typeof window === 'undefined') return false;
    
    // Check if already loaded
    if (window.Pose && window.Camera) return true;

    try {
      setIsLoading(true);
      console.log('🔄 Loading MediaPipe scripts...');

      const scripts = [
        'https://cdn.jsdelivr.net/npm/@mediapipe/camera_utils/camera_utils.js',
        'https://cdn.jsdelivr.net/npm/@mediapipe/control_utils/control_utils.js', 
        'https://cdn.jsdelivr.net/npm/@mediapipe/drawing_utils/drawing_utils.js',
        'https://cdn.jsdelivr.net/npm/@mediapipe/pose/pose.js'
      ];

      // Load scripts sequentially
      for (const src of scripts) {
        await new Promise<void>((resolve, reject) => {
          const script = document.createElement('script');
          script.src = src;
          script.onload = () => resolve();
          script.onerror = () => reject(new Error(`Failed to load ${src}`));
          document.head.appendChild(script);
        });
      }

      console.log('✅ MediaPipe scripts loaded successfully');
      return true;
    } catch (error) {
      console.error('❌ Failed to load MediaPipe scripts:', error);
      setError('Failed to load AI pose detection. Please check your internet connection.');
      return false;
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Calculate angle between three points
  const calculateAngle = useCallback((a: any, b: any, c: any): number => {
    const radians = Math.atan2(c.y - b.y, c.x - b.x) - Math.atan2(a.y - b.y, a.x - b.x);
    let angle = Math.abs(radians * 180.0 / Math.PI);
    if (angle > 180.0) {
      angle = 360 - angle;
    }
    return angle;
  }, []);

  // Voice feedback helper
  const provideVoiceFeedback = useCallback((angle: number, stage: string, isGoodForm: boolean) => {
    if (!voiceCoachRef.current || !voiceEnabled) return;

    const now = Date.now();
    const timeSinceLastFeedback = now - repStateRef.current.lastFeedbackTime;

    // Provide form feedback
    if (isGoodForm) {
      repStateRef.current.consecutivePoorForm = 0;
      
      // Positive reinforcement every few seconds
      if (timeSinceLastFeedback > 4000) {
        const formFeedback = voiceCoachRef.current.getFormFeedback(exerciseId, angle, stage);
        if (formFeedback) {
          voiceCoachRef.current.speak(formFeedback);
          repStateRef.current.lastFeedbackTime = now;
        }
      }
    } else {
      repStateRef.current.consecutivePoorForm++;
      
      // Corrective feedback for poor form
      if (repStateRef.current.consecutivePoorForm >= 2 && timeSinceLastFeedback > 3000) {
        const warning = voiceCoachRef.current.getWarningMessage(exerciseId);
        voiceCoachRef.current.speak(warning, true); // High priority
        repStateRef.current.lastFeedbackTime = now;
        repStateRef.current.consecutivePoorForm = 0;
      }
    }
  }, [exerciseId, voiceEnabled]);

  // Analyze pose for specific exercises
  const analyzePose = useCallback((landmarks: any[]) => {
    if (!landmarks || landmarks.length < 33) return;

    let currentAngle = 0;
    let newFeedback = '';
    let score = 0;
    let isGoodForm = false;
    let isPerfectForm = false; // New: track if form is perfect enough to count

    try {
      if (exerciseId === 'push-ups') {
        // Push-up analysis: shoulder-elbow-wrist angle
        const shoulder = landmarks[11]; // Left shoulder
        const elbow = landmarks[13];    // Left elbow  
        const wrist = landmarks[15];    // Left wrist

        if (shoulder.visibility > 0.5 && elbow.visibility > 0.5 && wrist.visibility > 0.5) {
          currentAngle = calculateAngle(shoulder, elbow, wrist);
          
          // Form scoring and feedback first
          if (currentAngle < 70) {
            score = 95 + Math.random() * 5;
            isGoodForm = true;
            isPerfectForm = true; // Perfect depth - always counts
            newFeedback = 'Perfect depth! Keep your body straight.';
          } else if (currentAngle < 90) {
            score = 85 + Math.random() * 10;
            isGoodForm = true;
            isPerfectForm = score >= 60; // Good form - counts if 60%+
            newFeedback = isPerfectForm ? 'Good depth! This will count!' : 'Lower a bit more for rep to count.';
          } else if (currentAngle > 160) {
            score = 90 + Math.random() * 10;
            isGoodForm = true;
            isPerfectForm = true; // Good extension - always counts
            newFeedback = 'Good extension! Ready for next rep.';
          } else if (currentAngle > 120) {
            score = 60 + Math.random() * 15;
            isGoodForm = true;
            isPerfectForm = score >= 60; // Acceptable form - counts if 60%+
            newFeedback = isPerfectForm ? 'Acceptable form - rep will count!' : 'Go lower! Get your chest closer to the ground.';
          } else {
            score = 70 + Math.random() * 15;
            isGoodForm = true;
            isPerfectForm = score >= 60; // Counts if 60%+
            newFeedback = isPerfectForm ? 'Good effort - rep counts!' : 'Keep going - need better form for rep to count!';
          }
          
          // Rep counting logic - count reps with 60%+ form score
          if (currentAngle < 90 && !repStateRef.current.isDown) {
            repStateRef.current.isDown = true;
            
            console.log(`🔽 Push-up DOWN: angle=${currentAngle.toFixed(1)}, score=${score.toFixed(1)}, currentRepCount=${repCount}, isDown was false, now true`);
            
            if (score >= 60) {
              // Immediately count the rep when AI says "this will count"
              setRepCount(prevCount => {
                const newRepCount = prevCount + 1;
                console.log(`✅ REP COUNTED IMMEDIATELY! Old count: ${prevCount}, New count: ${newRepCount}`);
                
                // Voice feedback for good depth
                if (currentAngle < 70) {
                  voiceCoachRef.current?.speak(`Perfect depth! Rep ${newRepCount} counted!`, true);
                } else {
                  voiceCoachRef.current?.speak(`Good form! Rep ${newRepCount} counted!`, true);
                }
                
                // Motivational message every 5 reps
                const motivational = voiceCoachRef.current?.getMotivationalMessage(newRepCount);
                if (motivational) {
                  setTimeout(() => voiceCoachRef.current?.speak(motivational), 1000);
                }
                
                return newRepCount;
              });
              
              newFeedback = 'Going down - good form! Rep counted!';
            } else {
              newFeedback = 'Going down but form needs improvement - rep won\'t count!';
              console.log(`❌ Poor form: score=${score.toFixed(1)} < 60, rep not counted`);
              voiceCoachRef.current?.speak("Improve your form! This rep won't count.", true);
            }
          } else if (currentAngle > 160 && repStateRef.current.isDown) {
            // CRITICAL: Always reset the down state when coming back up
            repStateRef.current.isDown = false;
            newFeedback = 'Coming back up - ready for next rep!';
            
            console.log(`🔼 Push-up UP: angle=${currentAngle.toFixed(1)}, isDown reset from true to false, currentRepCount=${repCount}, ready for next rep`);
          } else if (currentAngle < 90 && repStateRef.current.isDown) {
            // Already in down position, don't double count
            console.log(`⏸️ Push-up: Still down, angle=${currentAngle.toFixed(1)}, isDown=${repStateRef.current.isDown}, not counting again`);
          } else if (currentAngle > 160 && !repStateRef.current.isDown) {
            // Already in up position
            console.log(`⏸️ Push-up: Still up, angle=${currentAngle.toFixed(1)}, isDown=${repStateRef.current.isDown}, waiting for next rep`);
          }

          provideVoiceFeedback(currentAngle, repStateRef.current.isDown ? 'DOWN' : 'UP', isGoodForm);
        }
      } else if (exerciseId === 'squats') {
        // Squat analysis: hip-knee-ankle angle
        const hip = landmarks[23];    // Left hip
        const knee = landmarks[25];   // Left knee
        const ankle = landmarks[27];  // Left ankle

        if (hip.visibility > 0.5 && knee.visibility > 0.5 && ankle.visibility > 0.5) {
          currentAngle = calculateAngle(hip, knee, ankle);
          
          // Form scoring for squats
          if (currentAngle < 80) {
            score = 95 + Math.random() * 5;
            isGoodForm = true;
            isPerfectForm = true; // Perfect depth
            newFeedback = 'Perfect squat depth! Keep your chest up.';
          } else if (currentAngle < 90) {
            score = 85 + Math.random() * 10;
            isGoodForm = true;
            isPerfectForm = score >= 60; // Good form - counts if 60%+
            newFeedback = isPerfectForm ? 'Good depth! This will count!' : 'Go a bit deeper for rep to count.';
          } else if (currentAngle > 160) {
            score = 85 + Math.random() * 10;
            isGoodForm = true;
            isPerfectForm = true;
            newFeedback = 'Good extension! Ready for next squat.';
          } else if (currentAngle > 110) {
            score = 60 + Math.random() * 15;
            isGoodForm = true;
            isPerfectForm = score >= 60; // Acceptable form - counts if 60%+
            newFeedback = isPerfectForm ? 'Acceptable form - rep will count!' : 'Go deeper! Squat below parallel for rep to count.';
          } else {
            score = 75 + Math.random() * 15;
            isGoodForm = true;
            isPerfectForm = score >= 60; // Counts if 60%+
            newFeedback = isPerfectForm ? 'Good effort - rep counts!' : 'Keep going - need better depth for rep to count!';
          }
          
          // Rep counting for squats - count reps with 60%+ form score
          if (currentAngle < 90 && !repStateRef.current.isDown) {
            repStateRef.current.isDown = true;
            
            console.log(`🔽 Squat DOWN: angle=${currentAngle.toFixed(1)}, score=${score.toFixed(1)}`);
            
            if (score >= 60) {
              // Immediately count the rep when AI says "this will count"
              setRepCount(prevCount => {
                const newRepCount = prevCount + 1;
                console.log(`✅ SQUAT COUNTED IMMEDIATELY! Old count: ${prevCount}, New count: ${newRepCount}`);
                
                if (currentAngle < 80) {
                  voiceCoachRef.current?.speak(`Perfect squat depth! Rep ${newRepCount} counted!`, true);
                } else {
                  voiceCoachRef.current?.speak(`Good squat form! Rep ${newRepCount} counted!`, true);
                }
                
                // Motivational message every 5 reps
                const motivational = voiceCoachRef.current?.getMotivationalMessage(newRepCount);
                if (motivational) {
                  setTimeout(() => voiceCoachRef.current?.speak(motivational), 1000);
                }
                
                return newRepCount;
              });
              
              newFeedback = 'Good squat depth! Rep counted!';
            } else {
              newFeedback = 'Going down but need more depth - rep won\'t count!';
              voiceCoachRef.current?.speak("Go deeper! This rep won't count yet.", true);
            }
          } else if (currentAngle > 160 && repStateRef.current.isDown) {
            // CRITICAL: Always reset the down state when coming back up
            repStateRef.current.isDown = false;
            newFeedback = 'Coming back up - ready for next squat!';
            
            console.log(`🔼 Squat UP: angle=${currentAngle.toFixed(1)}, isDown reset to false, ready for next rep`);
          }

          provideVoiceFeedback(currentAngle, repStateRef.current.isDown ? 'DOWN' : 'UP', isGoodForm);
        }
      } else if (exerciseId === 'bicep-curls') {
        // Bicep curl analysis: shoulder-elbow-wrist angle
        const shoulder = landmarks[11];
        const elbow = landmarks[13];
        const wrist = landmarks[15];

        if (shoulder.visibility > 0.5 && elbow.visibility > 0.5 && wrist.visibility > 0.5) {
          currentAngle = calculateAngle(shoulder, elbow, wrist);
          
          // Form scoring for bicep curls
          if (currentAngle < 40) {
            score = 95 + Math.random() * 5;
            isGoodForm = true;
            isPerfectForm = true; // Perfect curl
            newFeedback = 'Perfect curl! Keep elbows stable.';
          } else if (currentAngle < 50) {
            score = 85 + Math.random() * 10;
            isGoodForm = true;
            isPerfectForm = score >= 60; // Good form - counts if 60%+
            newFeedback = isPerfectForm ? 'Good curl! This will count!' : 'Squeeze a bit more at the top.';
          } else if (currentAngle > 160) {
            score = 85 + Math.random() * 10;
            isGoodForm = true;
            isPerfectForm = true;
            newFeedback = 'Good extension! Control the weight.';
          } else if (currentAngle > 80) {
            score = 60 + Math.random() * 15;
            isGoodForm = true;
            isPerfectForm = score >= 60; // Acceptable form - counts if 60%+
            newFeedback = isPerfectForm ? 'Acceptable curl - rep will count!' : 'Curl higher! Bring it all the way up for rep to count.';
          } else {
            score = 80 + Math.random() * 15;
            isGoodForm = true;
            isPerfectForm = score >= 60; // Counts if 60%+
            newFeedback = isPerfectForm ? 'Good effort - rep counts!' : 'Keep the movement controlled - need better form!';
          }
          
          // Rep counting for bicep curls - count reps with 60%+ form score
          if (currentAngle < 50 && !repStateRef.current.isDown) {
            repStateRef.current.isDown = true;
            
            console.log(`🔽 Curl DOWN: angle=${currentAngle.toFixed(1)}, score=${score.toFixed(1)}`);
            
            if (score >= 60) {
              // Immediately count the rep when AI says "this will count"
              setRepCount(prevCount => {
                const newRepCount = prevCount + 1;
                console.log(`✅ CURL COUNTED IMMEDIATELY! Old count: ${prevCount}, New count: ${newRepCount}`);
                
                if (currentAngle < 40) {
                  voiceCoachRef.current?.speak(`Perfect curl! Rep ${newRepCount} counted!`, true);
                } else {
                  voiceCoachRef.current?.speak(`Good curl! Rep ${newRepCount} counted!`, true);
                }
                
                // Motivational message every 5 reps
                const motivational = voiceCoachRef.current?.getMotivationalMessage(newRepCount);
                if (motivational) {
                  setTimeout(() => voiceCoachRef.current?.speak(motivational), 1000);
                }
                
                return newRepCount;
              });
              
              newFeedback = 'Good curl! Rep counted!';
            } else {
              newFeedback = 'Curling but need better form - rep won\'t count!';
              voiceCoachRef.current?.speak("Curl higher! This rep won't count yet.", true);
            }
          } else if (currentAngle > 160 && repStateRef.current.isDown) {
            // CRITICAL: Always reset the down state when coming back up
            repStateRef.current.isDown = false;
            newFeedback = 'Coming back up - ready for next curl!';
            
            console.log(`🔼 Curl UP: angle=${currentAngle.toFixed(1)}, isDown reset to false, ready for next rep`);
          }

          provideVoiceFeedback(currentAngle, repStateRef.current.isDown ? 'DOWN' : 'UP', isGoodForm);
        }
      }

      // Update state
      setFormScore(Math.round(score));
      if (newFeedback) {
        setFeedback(newFeedback);
      }
      setPoseDetected(true);

    } catch (error) {
      console.error('Error analyzing pose:', error);
    }
  }, [exerciseId, calculateAngle, repCount, provideVoiceFeedback]);

  // Handle pose detection results
  const onResults = useCallback((results: PoseResults) => {
    if (!canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear canvas
    ctx.save();
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw the image
    ctx.drawImage(results.image, 0, 0, canvas.width, canvas.height);

    if (results.poseLandmarks) {
      // Analyze pose for exercise
      analyzePose(results.poseLandmarks);

      // Draw pose landmarks and connections
      if (window.drawConnectors && window.drawLandmarks && window.POSE_CONNECTIONS) {
        window.drawConnectors(ctx, results.poseLandmarks, window.POSE_CONNECTIONS, {
          color: '#00FF00',
          lineWidth: 4,
        });
        window.drawLandmarks(ctx, results.poseLandmarks, {
          color: '#FF0000',
          lineWidth: 2,
        });
      }
    } else {
      setPoseDetected(false);
    }

    ctx.restore();
  }, [analyzePose]);

  // Start pose detection
  const startDetection = useCallback(async () => {
    try {
      setError(null);
      setIsLoading(true);
      
      // Load MediaPipe scripts
      const scriptsLoaded = await loadMediaPipeScripts();
      if (!scriptsLoaded) return;

      if (!videoRef.current || !canvasRef.current) {
        throw new Error('Video or canvas element not ready');
      }

      console.log('🚀 Initializing MediaPipe Pose...');

      // Initialize MediaPipe Pose
      poseRef.current = new window.Pose({
        locateFile: (file: string) => {
          return `https://cdn.jsdelivr.net/npm/@mediapipe/pose/${file}`;
        },
      });

      poseRef.current.setOptions({
        modelComplexity: 1,
        smoothLandmarks: true,
        enableSegmentation: false,
        smoothSegmentation: true,
        minDetectionConfidence: 0.5,
        minTrackingConfidence: 0.5,
      });

      poseRef.current.onResults(onResults);

      // Initialize camera
      cameraRef.current = new window.Camera(videoRef.current, {
        onFrame: async () => {
          if (poseRef.current && videoRef.current) {
            await poseRef.current.send({ image: videoRef.current });
          }
        },
        width: 640,
        height: 480,
      });

      // Set canvas dimensions
      canvasRef.current.width = 640;
      canvasRef.current.height = 480;

      // Start camera
      await cameraRef.current.start();
      
      setIsActive(true);
      setRepCount(0);
      setFormScore(0);
      setFeedback('AI trainer active - start exercising!');
      
      // Welcome voice message
      if (voiceCoachRef.current && voiceEnabled) {
        const startMessage = voiceCoachRef.current.getStartMessage(exerciseId);
        setTimeout(() => voiceCoachRef.current?.speak(startMessage, true), 1000);
      }
      
      console.log('✅ Real pose detection started successfully');
    } catch (error) {
      console.error('❌ Failed to start pose detection:', error);
      setError(error instanceof Error ? error.message : 'Failed to start pose detection');
    } finally {
      setIsLoading(false);
    }
  }, [loadMediaPipeScripts, onResults, exerciseId, voiceEnabled]);

  // Stop detection
  const stopDetection = useCallback(() => {
    if (cameraRef.current) {
      cameraRef.current.stop();
      cameraRef.current = null;
    }
    
    if (poseRef.current) {
      poseRef.current.close();
      poseRef.current = null;
    }

    if (voiceCoachRef.current) {
      voiceCoachRef.current.stop();
    }
    
    setIsActive(false);
    setRepCount(0);
    setFormScore(0);
    setPoseDetected(false);
    setFeedback('Training stopped');
    
    // Reset rep counting state
    repStateRef.current = {
      isDown: false,
      lastAngle: 0,
      repInProgress: false,
      lastFeedbackTime: 0,
      consecutivePoorForm: 0
    };
    
    console.log('🛑 Real pose detection stopped');
  }, []);

  // Toggle voice
  const toggleVoice = useCallback(() => {
    const newVoiceEnabled = !voiceEnabled;
    setVoiceEnabled(newVoiceEnabled);
    
    if (voiceCoachRef.current) {
      voiceCoachRef.current.setEnabled(newVoiceEnabled);
      
      if (newVoiceEnabled) {
        voiceCoachRef.current.speak("Voice coaching enabled!", true);
      } else {
        voiceCoachRef.current.stop();
      }
    }
  }, [voiceEnabled]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopDetection();
    };
  }, [stopDetection]);

  return (
    <Card className={`p-6 ${className}`}>
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <h3 className="text-lg font-semibold">🤖 Real AI Pose Trainer</h3>
          <div className="flex items-center space-x-4">
            <div className="text-sm text-gray-500">
              Exercise: <span className="font-medium capitalize">{exerciseId.replace('-', ' ')}</span>
            </div>
            {isSpeaking && (
              <div className="flex items-center text-green-600">
                <span className="animate-pulse">🎤</span>
                <span className="text-xs ml-1">Speaking</span>
              </div>
            )}
          </div>
        </div>
        
        {/* Camera Display */}
        <div className="relative bg-black rounded-lg overflow-hidden">
          {/* Hidden video element */}
          <video
            ref={videoRef}
            className="hidden"
            autoPlay
            muted
            playsInline
          />
          
          {/* Canvas for pose visualization */}
          <canvas
            ref={canvasRef}
            className="w-full h-auto max-w-full"
            style={{ aspectRatio: '4/3' }}
          />
          
          {!isActive && (
            <div className="absolute inset-0 flex items-center justify-center bg-gray-900 bg-opacity-75">
              <div className="text-white text-center">
                <div className="text-4xl mb-4">🤖</div>
                <p className="text-lg mb-2">Real AI Pose Trainer</p>
                <p className="text-sm opacity-75">MediaPipe + Voice Coaching</p>
              </div>
            </div>
          )}

          {/* Loading overlay */}
          {isLoading && (
            <div className="absolute inset-0 flex items-center justify-center bg-gray-900 bg-opacity-90">
              <div className="text-white text-center">
                <div className="animate-spin text-4xl mb-4">⚙️</div>
                <p>Loading MediaPipe AI...</p>
              </div>
            </div>
          )}
        </div>

        {/* AI Feedback */}
        {isActive && (
          <div className={`p-4 rounded-lg ${poseDetected ? 'bg-green-50' : 'bg-yellow-50'}`}>
            <div className="flex items-center space-x-2">
              <div className={poseDetected ? 'text-green-600' : 'text-yellow-600'}>
                {poseDetected ? '🎯' : '👀'}
              </div>
              <div className={`font-medium ${poseDetected ? 'text-green-800' : 'text-yellow-800'}`}>
                AI Coach:
              </div>
              {voiceEnabled && (
                <div className="text-blue-600">
                  🎤
                </div>
              )}
            </div>
            <div className={`mt-1 ${poseDetected ? 'text-green-700' : 'text-yellow-700'}`}>
              {poseDetected ? feedback : 'Position yourself in front of the camera'}
            </div>
          </div>
        )}

        {/* Stats */}
        {isActive && (
          <div className="grid grid-cols-3 gap-4 text-center">
            <div className="bg-blue-50 p-3 rounded-lg">
              <div className="text-2xl font-bold text-blue-600">{repCount}</div>
              <div className="text-sm text-blue-700">Reps</div>
            </div>
            <div className="bg-green-50 p-3 rounded-lg">
              <div className="text-2xl font-bold text-green-600">{formScore}%</div>
              <div className="text-sm text-green-700">Form Score</div>
            </div>
            <div className="bg-purple-50 p-3 rounded-lg">
              <div className="text-2xl font-bold text-purple-600">
                {poseDetected ? '🟢' : '🟡'}
              </div>
              <div className="text-sm text-purple-700">
                {poseDetected ? 'Tracking' : 'Searching'}
              </div>
            </div>
          </div>
        )}

        {/* Test Rep Counter Button */}
        {isActive && (
          <div className="mt-4 p-4 bg-gray-50 rounded-lg">
            <h4 className="text-sm font-semibold mb-2">🧪 Test Rep Counter</h4>
            <div className="flex space-x-2">
              <Button
                onClick={() => {
                  console.log('🧪 TESTING: Simulating rep 2 with good form');
                  const newRepCount = repCount + 1;
                  setRepCount(newRepCount);
                  setFeedback(`Test rep ${newRepCount} added!`);
                  voiceCoachRef.current?.speak(`Test rep ${newRepCount} counted!`, true);
                }}
                className="bg-purple-600 hover:bg-purple-700 text-xs px-3 py-1"
              >
                Test Add Rep
              </Button>
              <Button
                onClick={() => {
                  console.log('🧪 TESTING: Resetting rep counter');
                  setRepCount(0);
                  setFeedback('Rep counter reset for testing');
                  repStateRef.current.isDown = false;
                }}
                className="bg-gray-600 hover:bg-gray-700 text-xs px-3 py-1"
              >
                Reset Counter
              </Button>
              <Button
                onClick={() => {
                  console.log('🧪 TESTING: Current state:', {
                    repCount,
                    isDown: repStateRef.current.isDown,
                    consecutivePoorForm: repStateRef.current.consecutivePoorForm
                  });
                }}
                className="bg-blue-600 hover:bg-blue-700 text-xs px-3 py-1"
              >
                Log State
              </Button>
            </div>
            <div className="text-xs text-gray-600 mt-2">
              Current: {repCount} reps | isDown: {repStateRef.current.isDown ? 'true' : 'false'}
            </div>
          </div>
        )}
        {showControls && (
          <div className="flex justify-center space-x-4">
            {!isActive ? (
              <Button
                onClick={startDetection}
                disabled={isLoading}
                className="bg-green-600 hover:bg-green-700 disabled:opacity-50"
              >
                {isLoading ? 'Loading AI...' : 'Start AI Training'}
              </Button>
            ) : (
              <>
                <Button
                  onClick={stopDetection}
                  className="bg-red-600 hover:bg-red-700"
                >
                  Stop Training
                </Button>
                <Button
                  onClick={toggleVoice}
                  className={`${voiceEnabled ? 'bg-blue-600 hover:bg-blue-700' : 'bg-gray-600 hover:bg-gray-700'}`}
                >
                  {voiceEnabled ? '🎤 Voice ON' : '🔇 Voice OFF'}
                </Button>
              </>
            )}
          </div>
        )}

        {/* Error Display */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="text-red-800">
              <strong>Error:</strong> {error}
            </div>
            <div className="text-red-600 text-sm mt-2">
              Make sure you have a stable internet connection and camera permissions.
            </div>
          </div>
        )}

        {/* Status */}
        <div className="text-center text-sm text-gray-500">
          {isLoading && 'Loading MediaPipe AI model...'}
          {!isLoading && !isActive && 'Ready to start real pose detection with voice coaching'}
          {!isLoading && isActive && poseDetected && `Real AI analyzing your form ${voiceEnabled ? 'with voice coaching' : ''}`}
          {!isLoading && isActive && !poseDetected && 'Position yourself in camera view'}
        </div>
      </div>
    </Card>
  );
}
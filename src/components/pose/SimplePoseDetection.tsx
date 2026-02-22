'use client';

import React, { useRef, useEffect, useState, useCallback } from 'react';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';

interface SimplePoseDetectionProps {
  exerciseId: string;
  className?: string;
}

interface RepCounter {
  count: number;
  isInPosition: boolean;
  lastPositionTime: number;
}

export function SimplePoseDetection({ exerciseId, className = '' }: SimplePoseDetectionProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isActive, setIsActive] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [repCounter, setRepCounter] = useState<RepCounter>({
    count: 0,
    isInPosition: false,
    lastPositionTime: 0
  });
  const [formFeedback, setFormFeedback] = useState<string>('');
  const animationFrameRef = useRef<number>();

  const startCamera = async () => {
    try {
      setError(null);
      console.log('🎥 Starting pose detection camera...');
      
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: 640,
          height: 480,
          facingMode: 'user'
        }
      });

      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
        videoRef.current.play();
        setStream(mediaStream);
        setIsActive(true);
        
        // Start simple motion detection
        startMotionDetection();
        console.log('✅ Pose detection started');
      }
    } catch (err) {
      console.error('❌ Camera error:', err);
      setError(err instanceof Error ? err.message : 'Failed to access camera');
    }
  };

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
    }
    setIsActive(false);
    console.log('🛑 Pose detection stopped');
  };

  const startMotionDetection = useCallback(() => {
    if (!videoRef.current || !canvasRef.current) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    
    if (!ctx) return;

    // Set canvas size to match video
    canvas.width = video.videoWidth || 640;
    canvas.height = video.videoHeight || 480;

    let previousImageData: ImageData | null = null;

    const detectMotion = () => {
      if (!isActive || !video || !ctx) return;

      // Draw current frame
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      const currentImageData = ctx.getImageData(0, 0, canvas.width, canvas.height);

      if (previousImageData) {
        // Simple motion detection by comparing pixels
        const motionLevel = calculateMotionLevel(previousImageData, currentImageData);
        
        // Simple rep counting based on motion patterns
        updateRepCount(motionLevel);
        
        // Provide basic form feedback
        updateFormFeedback(motionLevel);
      }

      previousImageData = currentImageData;
      animationFrameRef.current = requestAnimationFrame(detectMotion);
    };

    // Wait for video to be ready
    video.addEventListener('loadeddata', () => {
      detectMotion();
    });

    if (video.readyState >= 2) {
      detectMotion();
    }
  }, [isActive]);

  const calculateMotionLevel = (prev: ImageData, current: ImageData): number => {
    let totalDiff = 0;
    const threshold = 30;
    let changedPixels = 0;

    for (let i = 0; i < prev.data.length; i += 4) {
      const rDiff = Math.abs(prev.data[i] - current.data[i]);
      const gDiff = Math.abs(prev.data[i + 1] - current.data[i + 1]);
      const bDiff = Math.abs(prev.data[i + 2] - current.data[i + 2]);
      
      const pixelDiff = (rDiff + gDiff + bDiff) / 3;
      
      if (pixelDiff > threshold) {
        changedPixels++;
        totalDiff += pixelDiff;
      }
    }

    return changedPixels / (prev.data.length / 4);
  };

  const updateRepCount = (motionLevel: number) => {
    const now = Date.now();
    const motionThreshold = 0.1; // 10% of pixels changed
    const minTimeBetweenReps = 1000; // 1 second minimum between reps

    setRepCounter(prev => {
      const isCurrentlyInMotion = motionLevel > motionThreshold;
      
      // Detect rep completion: was in motion, now not in motion
      if (prev.isInPosition && !isCurrentlyInMotion && 
          (now - prev.lastPositionTime) > minTimeBetweenReps) {
        return {
          count: prev.count + 1,
          isInPosition: false,
          lastPositionTime: now
        };
      }
      
      // Detect start of rep: wasn't in motion, now in motion
      if (!prev.isInPosition && isCurrentlyInMotion) {
        return {
          ...prev,
          isInPosition: true,
          lastPositionTime: now
        };
      }

      return prev;
    });
  };

  const updateFormFeedback = (motionLevel: number) => {
    if (motionLevel > 0.3) {
      setFormFeedback('Moving too fast - slow down for better form');
    } else if (motionLevel > 0.1) {
      setFormFeedback('Good movement - keep it controlled');
    } else if (motionLevel > 0.05) {
      setFormFeedback('Nice and steady - maintain this pace');
    } else {
      setFormFeedback('Ready to start your exercise');
    }
  };

  const resetCounter = () => {
    setRepCounter({
      count: 0,
      isInPosition: false,
      lastPositionTime: 0
    });
    setFormFeedback('Counter reset - ready to start');
  };

  useEffect(() => {
    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [stream]);

  return (
    <Card className={`p-6 ${className}`}>
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <h3 className="text-lg font-semibold">Simple Pose Detection</h3>
          <div className="text-sm text-gray-600 dark:text-gray-400 capitalize">
            {exerciseId.replace('-', ' ')}
          </div>
        </div>
        
        {/* Video and Canvas Container */}
        <div className="relative bg-black rounded-lg overflow-hidden">
          <video
            ref={videoRef}
            className="w-full h-auto max-w-full"
            style={{ aspectRatio: '4/3' }}
            autoPlay
            muted
            playsInline
          />
          
          {/* Hidden canvas for motion detection */}
          <canvas
            ref={canvasRef}
            className="hidden"
          />
          
          {!isActive && (
            <div className="absolute inset-0 flex items-center justify-center bg-gray-900 bg-opacity-75">
              <div className="text-white text-center">
                <div className="text-4xl mb-4">🎯</div>
                <p>Simple pose detection ready</p>
                <p className="text-sm mt-2">Motion-based rep counting</p>
              </div>
            </div>
          )}

          {/* Rep Counter Overlay */}
          {isActive && (
            <div className="absolute top-4 right-4 bg-black bg-opacity-90 text-white px-4 py-3 rounded-lg">
              <div className="text-center">
                <div className="text-2xl font-bold">{repCounter.count}</div>
                <div className="text-xs">REPS</div>
                {repCounter.isInPosition && (
                  <div className="text-xs text-green-400 mt-1">In Motion</div>
                )}
              </div>
            </div>
          )}

          {/* Form Feedback Overlay */}
          {isActive && formFeedback && (
            <div className="absolute bottom-4 left-4 right-4 bg-black bg-opacity-90 text-white p-3 rounded-lg">
              <div className="text-sm text-center">{formFeedback}</div>
            </div>
          )}
        </div>

        {/* Controls */}
        <div className="flex justify-center space-x-4">
          {!isActive ? (
            <Button
              onClick={startCamera}
              className="bg-green-600 hover:bg-green-700"
            >
              Start Pose Detection
            </Button>
          ) : (
            <>
              <Button
                onClick={resetCounter}
                className="bg-blue-600 hover:bg-blue-700"
              >
                Reset Count
              </Button>
              <Button
                onClick={stopCamera}
                className="bg-red-600 hover:bg-red-700"
              >
                Stop Detection
              </Button>
            </>
          )}
        </div>

        {/* Error Display */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="text-red-800">
              <strong>Error:</strong> {error}
            </div>
          </div>
        )}

        {/* Info */}
        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
          <h4 className="font-medium text-blue-900 dark:text-blue-100 mb-2">
            How it works
          </h4>
          <div className="text-sm text-blue-800 dark:text-blue-200 space-y-1">
            <div>• Uses motion detection to count repetitions</div>
            <div>• Provides real-time form feedback</div>
            <div>• Works without complex AI models</div>
            <div>• Reliable and fast performance</div>
          </div>
        </div>
      </div>
    </Card>
  );
}
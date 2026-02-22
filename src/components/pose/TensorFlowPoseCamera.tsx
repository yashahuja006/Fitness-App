'use client';

import React, { useRef, useEffect, useState, useCallback } from 'react';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { TensorFlowPoseService } from '@/lib/tensorflowPoseService';
import type { PoseLandmark, PoseDetectionError } from '@/types/pose';

interface TensorFlowPoseCameraProps {
  className?: string;
  exerciseId?: string;
  onPoseDetected?: (landmarks: PoseLandmark[]) => void;
  showControls?: boolean;
}

export function TensorFlowPoseCamera({ 
  className = '', 
  exerciseId = 'push-ups',
  onPoseDetected,
  showControls = true 
}: TensorFlowPoseCameraProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const serviceRef = useRef<TensorFlowPoseService | null>(null);
  
  const [isActive, setIsActive] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [poseCount, setPoseCount] = useState(0);
  const [isLoading, setIsLoading] = useState(false);

  // Initialize service
  useEffect(() => {
    serviceRef.current = new TensorFlowPoseService();
    
    return () => {
      if (serviceRef.current) {
        serviceRef.current.dispose();
      }
    };
  }, []);

  // Handle pose detection
  const handlePoseDetected = useCallback((landmarks: PoseLandmark[]) => {
    setPoseCount(prev => prev + 1);
    if (onPoseDetected) {
      onPoseDetected(landmarks);
    }
  }, [onPoseDetected]);

  // Handle errors
  const handleError = useCallback((error: PoseDetectionError) => {
    console.error('Pose detection error:', error);
    setError(error.message);
    setIsActive(false);
  }, []);
  // Start camera and pose detection
  const startDetection = useCallback(async () => {
    if (!videoRef.current || !canvasRef.current || !serviceRef.current) {
      setError('Camera elements not ready');
      return;
    }

    try {
      setIsLoading(true);
      setError(null);
      console.log('🚀 Starting TensorFlow pose detection...');

      // Initialize the service
      await serviceRef.current.initialize(
        videoRef.current,
        canvasRef.current,
        {
          architecture: 'MobileNetV1',
          outputStride: 16,
          inputResolution: 513,
          multiplier: 0.75,
          scoreThreshold: 0.5,
        }
      );

      // Set up callbacks
      serviceRef.current.setOnPoseDetected(handlePoseDetected);
      serviceRef.current.setOnError(handleError);

      // Start detection
      await serviceRef.current.startDetection();
      
      setIsInitialized(true);
      setIsActive(true);
      setPoseCount(0);
      console.log('✅ TensorFlow pose detection started successfully');
    } catch (err) {
      console.error('❌ Failed to start pose detection:', err);
      setError(err instanceof Error ? err.message : 'Failed to start pose detection');
    } finally {
      setIsLoading(false);
    }
  }, [handlePoseDetected, handleError]);

  // Stop detection
  const stopDetection = useCallback(() => {
    if (serviceRef.current) {
      serviceRef.current.stopDetection();
    }
    setIsActive(false);
    setIsInitialized(false);
    setPoseCount(0);
    console.log('🛑 Pose detection stopped');
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (serviceRef.current) {
        serviceRef.current.dispose();
      }
    };
  }, []);

  return (
    <Card className={`p-6 ${className}`}>
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <h3 className="text-lg font-semibold">AI Posture Trainer</h3>
          <div className="text-sm text-gray-500">
            Exercise: <span className="font-medium capitalize">{exerciseId.replace('-', ' ')}</span>
          </div>
        </div>
        
        {/* Camera Display */}
        <div className="relative bg-black rounded-lg overflow-hidden">
          {/* Video element (hidden, used for input) */}
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
                <p className="text-lg mb-2">AI Trainer Ready</p>
                <p className="text-sm opacity-75">TensorFlow.js + PoseNet</p>
              </div>
            </div>
          )}

          {/* Loading overlay */}
          {isLoading && (
            <div className="absolute inset-0 flex items-center justify-center bg-gray-900 bg-opacity-90">
              <div className="text-white text-center">
                <div className="animate-spin text-4xl mb-4">⚙️</div>
                <p>Loading AI Model...</p>
              </div>
            </div>
          )}
        </div>

        {/* Stats */}
        {isActive && (
          <div className="grid grid-cols-3 gap-4 text-center">
            <div className="bg-green-50 p-3 rounded-lg">
              <div className="text-2xl font-bold text-green-600">{poseCount}</div>
              <div className="text-sm text-green-700">Poses Detected</div>
            </div>
            <div className="bg-blue-50 p-3 rounded-lg">
              <div className="text-2xl font-bold text-blue-600">
                {isActive ? '🟢' : '⚪'}
              </div>
              <div className="text-sm text-blue-700">Status</div>
            </div>
            <div className="bg-purple-50 p-3 rounded-lg">
              <div className="text-2xl font-bold text-purple-600">AI</div>
              <div className="text-sm text-purple-700">TensorFlow.js</div>
            </div>
          </div>
        )}

        {/* Controls */}
        {showControls && (
          <div className="flex justify-center space-x-4">
            {!isActive ? (
              <Button
                onClick={startDetection}
                disabled={isLoading}
                className="bg-green-600 hover:bg-green-700 disabled:opacity-50"
              >
                {isLoading ? 'Loading AI...' : 'Start AI Trainer'}
              </Button>
            ) : (
              <Button
                onClick={stopDetection}
                className="bg-red-600 hover:bg-red-700"
              >
                Stop Training
              </Button>
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
              Please make sure you've granted camera permissions and try again.
            </div>
          </div>
        )}

        {/* Status */}
        <div className="text-center text-sm text-gray-500">
          {isLoading && 'Loading AI model...'}
          {!isLoading && !isActive && 'Ready to start'}
          {!isLoading && isActive && 'AI trainer active - analyzing your form'}
        </div>
      </div>
    </Card>
  );
}
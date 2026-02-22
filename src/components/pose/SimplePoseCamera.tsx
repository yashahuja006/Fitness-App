/**
 * Simple Pose Detection Camera Component
 * Basic pose detection without advanced features
 */

'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { usePoseDetection } from '@/hooks/usePoseDetection';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import type { FormAnalysis, PoseLandmark } from '@/types/pose';

interface SimplePoseCameraProps {
  exerciseId?: string;
  onPoseDetected?: (landmarks: PoseLandmark[]) => void;
  onFormAnalysis?: (analysis: FormAnalysis) => void;
  className?: string;
  showControls?: boolean;
  autoStart?: boolean;
}

export function SimplePoseCamera({
  exerciseId,
  onPoseDetected,
  onFormAnalysis,
  className = '',
  showControls = true,
  autoStart = false,
}: SimplePoseCameraProps) {
  const [isStarted, setIsStarted] = useState(false);
  const [formAnalysis, setFormAnalysis] = useState<FormAnalysis | null>(null);

  const {
    state,
    videoRef,
    canvasRef,
    startDetection,
    stopDetection,
    isSupported,
    supportInfo,
  } = usePoseDetection({
    exerciseId,
    onPoseDetected: useCallback((landmarks: PoseLandmark[]) => {
      onPoseDetected?.(landmarks);
    }, [onPoseDetected]),
    onFormAnalysis: (analysis) => {
      setFormAnalysis(analysis);
      onFormAnalysis?.(analysis);
    },
    autoStart,
  });

  const handleStart = async () => {
    try {
      await startDetection();
      setIsStarted(true);
    } catch (error) {
      console.error('Failed to start pose detection:', error);
    }
  };

  const handleStop = () => {
    stopDetection();
    setIsStarted(false);
    setFormAnalysis(null);
  };

  if (!isSupported) {
    return (
      <Card className={`p-6 ${className}`}>
        <div className="text-center">
          <h3 className="text-lg font-semibold text-red-600 mb-2">
            Browser Not Supported
          </h3>
          <p className="text-gray-600 mb-4">
            Your browser is missing required features for pose detection:
          </p>
          <ul className="list-disc list-inside text-sm text-gray-500 mb-4">
            {supportInfo.missingFeatures.map((feature, index) => (
              <li key={index}>{feature}</li>
            ))}
          </ul>
          <p className="text-sm text-gray-500">
            Please use a modern browser with camera and WebGL support.
          </p>
        </div>
      </Card>
    );
  }

  return (
    <Card className={`p-4 ${className}`}>
      <div className="space-y-4">
        {/* Camera View */}
        <div className="relative">
          <div className="relative bg-black rounded-lg overflow-hidden">
            {/* Video element (hidden, used for camera input) */}
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
            
            {/* Loading overlay */}
            {state.isInitialized && !state.isDetecting && (
              <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
                <div className="text-white text-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white mx-auto mb-2"></div>
                  <p>Initializing camera...</p>
                </div>
              </div>
            )}
          </div>

          {/* Pose Info Display */}
          {state.isDetecting && state.currentPose && (
            <div className="absolute top-4 left-4 bg-black bg-opacity-90 text-white px-4 py-3 rounded-lg">
              <div className="text-sm">
                <div>Pose detected: {state.currentPose.length} points</div>
                {formAnalysis && (
                  <div>Form score: {Math.round(formAnalysis.correctness * 100)}%</div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Controls */}
        {showControls && (
          <div className="flex justify-center space-x-4">
            {!isStarted ? (
              <Button
                onClick={handleStart}
                disabled={!state.hasCamera && !state.isInitialized}
                className="bg-green-600 hover:bg-green-700"
              >
                {state.isInitialized ? 'Start Detection' : 'Initialize Camera'}
              </Button>
            ) : (
              <Button
                onClick={handleStop}
                className="bg-red-600 hover:bg-red-700"
              >
                Stop Detection
              </Button>
            )}
          </div>
        )}

        {/* Error Display */}
        {state.error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex items-start">
              <div className="flex-shrink-0">
                <svg
                  className="h-5 w-5 text-red-400"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-red-800">
                  Pose Detection Error
                </h3>
                <p className="text-sm text-red-700 mt-1">{state.error.message}</p>
                {state.error.recoverable && (
                  <div className="mt-2">
                    <Button
                      onClick={handleStart}
                      size="sm"
                      className="bg-red-600 hover:bg-red-700 text-white"
                    >
                      Try Again
                    </Button>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Form Analysis Display */}
        {formAnalysis && formAnalysis.issues.length > 0 && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <h3 className="text-sm font-medium text-yellow-800 mb-2">
              Form Feedback
            </h3>
            <div className="space-y-2">
              {formAnalysis.issues.map((issue, index) => (
                <div key={index} className="text-sm">
                  <div className="flex items-center space-x-2">
                    <span
                      className={`inline-block w-2 h-2 rounded-full ${
                        issue.severity === 'high'
                          ? 'bg-red-500'
                          : issue.severity === 'medium'
                          ? 'bg-yellow-500'
                          : 'bg-blue-500'
                      }`}
                    />
                    <span className="font-medium text-yellow-800">
                      {issue.description}
                    </span>
                  </div>
                  <p className="text-yellow-700 ml-4 mt-1">{issue.correction}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Status Information */}
        <div className="text-xs text-gray-500 text-center">
          Status: {state.isDetecting ? 'Detecting' : state.isInitialized ? 'Ready' : 'Not initialized'}
          {state.isDetecting && (
            <span> | Camera: {state.hasCamera ? 'Connected' : 'Disconnected'}</span>
          )}
        </div>
      </div>
    </Card>
  );
}
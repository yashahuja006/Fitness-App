'use client';

import React, { useRef, useEffect, useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';

interface SimpleCameraTestProps {
  className?: string;
}

export function SimpleCameraTest({ className = '' }: SimpleCameraTestProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isActive, setIsActive] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);

  const startCamera = async () => {
    try {
      setError(null);
      console.log('🎥 Starting camera...');
      
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
        console.log('✅ Camera started successfully');
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
    setIsActive(false);
    console.log('🛑 Camera stopped');
  };

  useEffect(() => {
    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, [stream]);

  return (
    <Card className={`p-6 ${className}`}>
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Camera Test</h3>
        
        {/* Video Display */}
        <div className="relative bg-black rounded-lg overflow-hidden">
          <video
            ref={videoRef}
            className="w-full h-auto max-w-full"
            style={{ aspectRatio: '4/3' }}
            autoPlay
            muted
            playsInline
          />
          
          {!isActive && (
            <div className="absolute inset-0 flex items-center justify-center bg-gray-900 bg-opacity-75">
              <div className="text-white text-center">
                <div className="text-4xl mb-4">📹</div>
                <p>Camera is ready to start</p>
              </div>
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
              Start Camera
            </Button>
          ) : (
            <Button
              onClick={stopCamera}
              className="bg-red-600 hover:bg-red-700"
            >
              Stop Camera
            </Button>
          )}
        </div>

        {/* Error Display */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="text-red-800">
              <strong>Camera Error:</strong> {error}
            </div>
            <div className="text-red-600 text-sm mt-2">
              Please make sure you've granted camera permissions and no other application is using the camera.
            </div>
          </div>
        )}

        {/* Status */}
        <div className="text-center text-sm text-gray-500">
          Status: {isActive ? '🟢 Camera Active' : '⚪ Camera Inactive'}
        </div>
      </div>
    </Card>
  );
}
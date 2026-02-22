'use client';

import { useState, useRef, useEffect } from 'react';
import { Navigation } from '@/components/ui/Navigation';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';

export default function CameraTestPage() {
  const [isStreaming, setIsStreaming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [devices, setDevices] = useState<MediaDeviceInfo[]>([]);
  const [selectedDevice, setSelectedDevice] = useState<string>('');
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  useEffect(() => {
    // Get available camera devices
    navigator.mediaDevices.enumerateDevices()
      .then(deviceList => {
        const cameras = deviceList.filter(device => device.kind === 'videoinput');
        setDevices(cameras);
        if (cameras.length > 0 && !selectedDevice) {
          setSelectedDevice(cameras[0].deviceId);
        }
      })
      .catch(err => {
        console.error('Error enumerating devices:', err);
      });

    return () => {
      stopCamera();
    };
  }, []);

  const startCamera = async () => {
    try {
      setError(null);
      const constraints: MediaStreamConstraints = {
        video: selectedDevice ? { deviceId: selectedDevice } : true,
        audio: false
      };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      streamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        setIsStreaming(true);
      }
    } catch (err) {
      console.error('Error accessing camera:', err);
      setError('Failed to access camera. Please check permissions.');
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setIsStreaming(false);
  };

  const toggleCamera = () => {
    if (isStreaming) {
      stopCamera();
    } else {
      startCamera();
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <Navigation />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Camera Test
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Test your camera setup for pose detection
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Camera Feed */}
          <div className="lg:col-span-2">
            <Card className="p-6">
              <div className="relative bg-black rounded-lg overflow-hidden" style={{ aspectRatio: '16/9' }}>
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  className="w-full h-full object-cover"
                />
                
                {!isStreaming && (
                  <div className="absolute inset-0 flex items-center justify-center bg-gray-900">
                    <div className="text-center">
                      <div className="text-6xl mb-4">📹</div>
                      <p className="text-white text-lg">Camera not active</p>
                      <p className="text-gray-400 text-sm mt-2">Click "Start Camera" to begin</p>
                    </div>
                  </div>
                )}

                {error && (
                  <div className="absolute inset-0 flex items-center justify-center bg-red-900/90">
                    <div className="text-center p-6">
                      <div className="text-4xl mb-4">⚠️</div>
                      <p className="text-white text-lg font-semibold mb-2">Camera Error</p>
                      <p className="text-red-200">{error}</p>
                    </div>
                  </div>
                )}
              </div>

              <div className="mt-6 flex gap-4">
                <Button
                  onClick={toggleCamera}
                  variant={isStreaming ? 'secondary' : 'primary'}
                  className="flex-1"
                  size="lg"
                >
                  {isStreaming ? '⏹ Stop Camera' : '▶️ Start Camera'}
                </Button>
              </div>
            </Card>
          </div>

          {/* Controls & Info */}
          <div className="space-y-6">
            {/* Camera Selection */}
            <Card className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Camera Selection
              </h3>
              
              {devices.length > 0 ? (
                <div className="space-y-2">
                  {devices.map((device, index) => (
                    <button
                      key={device.deviceId}
                      onClick={() => {
                        setSelectedDevice(device.deviceId);
                        if (isStreaming) {
                          stopCamera();
                          setTimeout(startCamera, 100);
                        }
                      }}
                      className={`w-full text-left p-3 rounded-lg transition-all ${
                        selectedDevice === device.deviceId
                          ? 'bg-blue-600 text-white'
                          : 'bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white hover:bg-gray-200 dark:hover:bg-gray-700'
                      }`}
                    >
                      <div className="font-medium">
                        {device.label || `Camera ${index + 1}`}
                      </div>
                    </button>
                  ))}
                </div>
              ) : (
                <p className="text-gray-600 dark:text-gray-400 text-sm">
                  No cameras detected
                </p>
              )}
            </Card>

            {/* Camera Info */}
            <Card className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Camera Status
              </h3>
              
              <div className="space-y-3 text-sm">
                <div className="flex items-center justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Status:</span>
                  <span className={`font-semibold ${isStreaming ? 'text-green-600' : 'text-gray-600'}`}>
                    {isStreaming ? '🟢 Active' : '⚫ Inactive'}
                  </span>
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Devices Found:</span>
                  <span className="font-semibold text-gray-900 dark:text-white">
                    {devices.length}
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Permission:</span>
                  <span className="font-semibold text-gray-900 dark:text-white">
                    {error ? '❌ Denied' : isStreaming ? '✅ Granted' : '⏳ Pending'}
                  </span>
                </div>
              </div>
            </Card>

            {/* Tips */}
            <Card className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Tips for Best Results
              </h3>
              
              <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
                <li className="flex items-start">
                  <span className="mr-2">💡</span>
                  <span>Ensure good lighting in your workout area</span>
                </li>
                <li className="flex items-start">
                  <span className="mr-2">📏</span>
                  <span>Position camera to capture your full body</span>
                </li>
                <li className="flex items-start">
                  <span className="mr-2">🎯</span>
                  <span>Stand 6-8 feet away from the camera</span>
                </li>
                <li className="flex items-start">
                  <span className="mr-2">👕</span>
                  <span>Wear fitted clothing for better detection</span>
                </li>
              </ul>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}

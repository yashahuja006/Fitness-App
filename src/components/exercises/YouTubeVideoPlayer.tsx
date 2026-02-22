'use client';

import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/Button';

interface YouTubeVideoPlayerProps {
  videoUrl: string;
  title: string;
  autoLoop?: boolean;
  className?: string;
}

export function YouTubeVideoPlayer({ 
  videoUrl, 
  title, 
  autoLoop = true, 
  className = '' 
}: YouTubeVideoPlayerProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  // Extract video ID from YouTube URL
  const getVideoId = (url: string) => {
    const match = url.match(/embed\/([^?&]+)/);
    return match ? match[1] : '';
  };

  const videoId = getVideoId(videoUrl);
  
  // Construct YouTube embed URL with parameters
  const embedUrl = `https://www.youtube.com/embed/${videoId}?enablejsapi=1&loop=${autoLoop ? 1 : 0}&playlist=${videoId}&rel=0&modestbranding=1&controls=1&showinfo=0`;

  const handlePlay = () => {
    if (iframeRef.current) {
      // Post message to YouTube iframe to play
      iframeRef.current.contentWindow?.postMessage(
        '{"event":"command","func":"playVideo","args":""}',
        '*'
      );
      setIsPlaying(true);
    }
  };

  const handlePause = () => {
    if (iframeRef.current) {
      // Post message to YouTube iframe to pause
      iframeRef.current.contentWindow?.postMessage(
        '{"event":"command","func":"pauseVideo","args":""}',
        '*'
      );
      setIsPlaying(false);
    }
  };

  const handleRestart = () => {
    if (iframeRef.current) {
      // Post message to YouTube iframe to seek to beginning
      iframeRef.current.contentWindow?.postMessage(
        '{"event":"command","func":"seekTo","args":[0, true]}',
        '*'
      );
      iframeRef.current.contentWindow?.postMessage(
        '{"event":"command","func":"playVideo","args":""}',
        '*'
      );
      setIsPlaying(true);
    }
  };

  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (event.origin !== 'https://www.youtube.com') return;
      
      try {
        const data = JSON.parse(event.data);
        if (data.event === 'video-progress') {
          // Handle video progress if needed
        }
      } catch (e) {
        // Ignore parsing errors
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, []);

  return (
    <div className={`relative bg-black rounded-lg overflow-hidden ${className}`}>
      {/* Video Container */}
      <div className="relative aspect-video">
        <iframe
          ref={iframeRef}
          src={embedUrl}
          title={title}
          className="absolute inset-0 w-full h-full"
          frameBorder="0"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
          onLoad={() => setIsLoading(false)}
        />
        
        {/* Loading Overlay */}
        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-gray-900 bg-opacity-75">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
          </div>
        )}
      </div>

      {/* Custom Controls */}
      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black via-black/80 to-transparent p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <button
              onClick={isPlaying ? handlePause : handlePlay}
              className="group relative flex items-center justify-center w-14 h-14 bg-white/20 hover:bg-white/30 backdrop-blur-sm rounded-full transition-all duration-300 hover:scale-110 active:scale-95"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full opacity-0 group-hover:opacity-20 transition-opacity duration-300"></div>
              {isPlaying ? (
                <div className="flex space-x-1">
                  <div className="w-1.5 h-6 bg-white rounded-full"></div>
                  <div className="w-1.5 h-6 bg-white rounded-full"></div>
                </div>
              ) : (
                <div className="w-0 h-0 border-l-[12px] border-l-white border-t-[8px] border-t-transparent border-b-[8px] border-b-transparent ml-1"></div>
              )}
            </button>
            
            <button
              onClick={handleRestart}
              className="group relative flex items-center justify-center w-12 h-12 bg-white/20 hover:bg-white/30 backdrop-blur-sm rounded-full transition-all duration-300 hover:scale-110 active:scale-95"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-green-500 to-teal-600 rounded-full opacity-0 group-hover:opacity-20 transition-opacity duration-300"></div>
              <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z" clipRule="evenodd" />
              </svg>
            </button>

            <div className="flex items-center space-x-2 text-white text-sm font-medium">
              <span className="px-3 py-1.5 bg-white/20 backdrop-blur-sm rounded-full border border-white/30">
                🎬 HD
              </span>
              {autoLoop && (
                <span className="px-3 py-1.5 bg-gradient-to-r from-purple-500/30 to-pink-500/30 backdrop-blur-sm rounded-full border border-purple-400/50 flex items-center space-x-1">
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z" clipRule="evenodd" />
                  </svg>
                  <span>Loop</span>
                </span>
              )}
            </div>
          </div>

          <div className="flex items-center space-x-3">
            <button className="group relative flex items-center justify-center w-10 h-10 bg-white/20 hover:bg-white/30 backdrop-blur-sm rounded-full transition-all duration-300 hover:scale-110">
              <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" clipRule="evenodd" />
              </svg>
            </button>
            <button className="group relative flex items-center justify-center w-10 h-10 bg-white/20 hover:bg-white/30 backdrop-blur-sm rounded-full transition-all duration-300 hover:scale-110">
              <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
                <path d="M15 8a3 3 0 10-2.977-2.63l-4.94 2.47a3 3 0 100 4.319l4.94 2.47a3 3 0 10.895-1.789l-4.94-2.47a3.027 3.027 0 000-.74l4.94-2.47C13.456 7.68 14.19 8 15 8z" />
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* Video Title */}
      <div className="absolute top-0 left-0 right-0 bg-gradient-to-b from-black/80 via-black/40 to-transparent p-6">
        <div className="flex items-center justify-between">
          <h4 className="text-white font-semibold text-lg truncate flex-1">
            {title}
          </h4>
          <div className="flex items-center space-x-2 ml-4">
            <span className="px-2 py-1 bg-red-600 text-white text-xs font-bold rounded">
              LIVE
            </span>
            <span className="px-2 py-1 bg-white/20 backdrop-blur-sm text-white text-xs rounded border border-white/30">
              Exercise Demo
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
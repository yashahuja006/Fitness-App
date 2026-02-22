'use client';

import { useState } from 'react';

interface ExerciseVideoThumbnailProps {
  videoUrl: string;
  title: string;
  className?: string;
}

export function ExerciseVideoThumbnail({ 
  videoUrl, 
  title, 
  className = '' 
}: ExerciseVideoThumbnailProps) {
  const [imageError, setImageError] = useState(false);

  // Extract video ID from YouTube URL
  const getVideoId = (url: string) => {
    const match = url.match(/embed\/([^?&]+)/);
    return match ? match[1] : '';
  };

  const videoId = getVideoId(videoUrl);
  const thumbnailUrl = `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`;
  const fallbackThumbnailUrl = `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`;

  return (
    <div className={`relative bg-gray-200 dark:bg-gray-700 rounded-lg overflow-hidden ${className}`}>
      <div className="aspect-video relative">
        {!imageError ? (
          <img
            src={thumbnailUrl}
            alt={title}
            className="w-full h-full object-cover"
            onError={() => setImageError(true)}
          />
        ) : (
          <img
            src={fallbackThumbnailUrl}
            alt={title}
            className="w-full h-full object-cover"
            onError={() => {
              // If both thumbnails fail, show placeholder
              const target = event?.target as HTMLImageElement;
              if (target) {
                target.style.display = 'none';
              }
            }}
          />
        )}
        
        {/* Play Button Overlay */}
        <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-30 hover:bg-opacity-40 transition-all duration-200">
          <div className="w-12 h-12 bg-white bg-opacity-90 rounded-full flex items-center justify-center shadow-lg">
            <div className="w-0 h-0 border-l-[8px] border-l-gray-800 border-t-[6px] border-t-transparent border-b-[6px] border-b-transparent ml-1"></div>
          </div>
        </div>

        {/* Video Duration Badge (if available) */}
        <div className="absolute bottom-2 right-2 bg-black bg-opacity-75 text-white text-xs px-2 py-1 rounded">
          Demo
        </div>
      </div>
    </div>
  );
}
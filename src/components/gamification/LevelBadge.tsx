'use client';

import { motion } from 'framer-motion';
import { GamificationEngine } from '@/lib/gamificationEngine';

interface LevelBadgeProps {
  level: number;
  size?: 'sm' | 'md' | 'lg';
  showTitle?: boolean;
  animated?: boolean;
}

export function LevelBadge({ level, size = 'md', showTitle = false, animated = true }: LevelBadgeProps) {
  const levelTitle = GamificationEngine.getLevelTitle(level);
  
  const sizeClasses = {
    sm: 'w-10 h-10 text-sm',
    md: 'w-16 h-16 text-lg',
    lg: 'w-24 h-24 text-2xl',
  };

  const getBadgeColor = (level: number) => {
    if (level >= 20) return 'from-yellow-400 to-orange-500'; // Legend
    if (level >= 15) return 'from-purple-500 to-pink-600'; // Elite
    if (level >= 10) return 'from-red-500 to-pink-500'; // Master
    if (level >= 7) return 'from-orange-500 to-red-500'; // Expert
    if (level >= 5) return 'from-green-500 to-teal-500'; // Advanced
    if (level >= 3) return 'from-blue-500 to-cyan-500'; // Intermediate
    return 'from-gray-400 to-gray-500'; // Beginner/Novice
  };

  const badgeColor = getBadgeColor(level);

  const BadgeContent = (
    <div className="relative">
      <div
        className={`
          ${sizeClasses[size]}
          rounded-full
          bg-gradient-to-br ${badgeColor}
          flex items-center justify-center
          font-bold text-white
          shadow-lg
          relative
          overflow-hidden
        `}
      >
        {/* Shine effect */}
        <div className="absolute inset-0 bg-gradient-to-br from-white/30 to-transparent" />
        
        {/* Level number */}
        <span className="relative z-10">{level}</span>
        
        {/* Glow effect */}
        <div className="absolute inset-0 rounded-full blur-md opacity-50 bg-gradient-to-br from-white/50 to-transparent" />
      </div>
      
      {showTitle && (
        <div className="mt-2 text-center">
          <p className="text-xs font-semibold text-gray-700 dark:text-gray-300">
            {levelTitle}
          </p>
        </div>
      )}
    </div>
  );

  if (animated) {
    return (
      <motion.div
        initial={{ scale: 0, rotate: -180 }}
        animate={{ scale: 1, rotate: 0 }}
        transition={{ type: 'spring', stiffness: 200, damping: 15 }}
        whileHover={{ scale: 1.1, rotate: 5 }}
      >
        {BadgeContent}
      </motion.div>
    );
  }

  return BadgeContent;
}

'use client';

import { motion } from 'framer-motion';

interface StreakCounterProps {
  currentStreak: number;
  longestStreak?: number;
  showLongest?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

export function StreakCounter({ 
  currentStreak, 
  longestStreak, 
  showLongest = true,
  size = 'md' 
}: StreakCounterProps) {
  const getStreakColor = (streak: number) => {
    if (streak >= 90) return 'from-purple-500 to-pink-600';
    if (streak >= 30) return 'from-orange-500 to-red-500';
    if (streak >= 14) return 'from-yellow-500 to-orange-500';
    if (streak >= 7) return 'from-green-500 to-teal-500';
    return 'from-blue-500 to-cyan-500';
  };

  const getStreakEmoji = (streak: number) => {
    if (streak >= 90) return '🏆';
    if (streak >= 30) return '🔥';
    if (streak >= 14) return '⚡';
    if (streak >= 7) return '💪';
    return '✨';
  };

  const sizeClasses = {
    sm: { container: 'p-3', number: 'text-2xl', label: 'text-xs', emoji: 'text-2xl' },
    md: { container: 'p-4', number: 'text-4xl', label: 'text-sm', emoji: 'text-3xl' },
    lg: { container: 'p-6', number: 'text-6xl', label: 'text-base', emoji: 'text-4xl' },
  };

  const classes = sizeClasses[size];
  const streakColor = getStreakColor(currentStreak);
  const streakEmoji = getStreakEmoji(currentStreak);

  return (
    <div className="space-y-3">
      <motion.div
        className={`
          ${classes.container}
          bg-gradient-to-br ${streakColor}
          rounded-2xl
          text-white
          text-center
          shadow-lg
          relative
          overflow-hidden
        `}
        whileHover={{ scale: 1.05 }}
        transition={{ type: 'spring', stiffness: 300 }}
      >
        {/* Background pattern */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute inset-0 bg-gradient-to-br from-white to-transparent" />
        </div>

        {/* Content */}
        <div className="relative z-10">
          <motion.div
            className={classes.emoji}
            animate={{ 
              scale: [1, 1.2, 1],
              rotate: [0, 10, -10, 0]
            }}
            transition={{ 
              duration: 2,
              repeat: Infinity,
              repeatDelay: 3
            }}
          >
            {streakEmoji}
          </motion.div>
          
          <motion.div
            className={`${classes.number} font-bold mt-2`}
            key={currentStreak}
            initial={{ scale: 1.5, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: 'spring', stiffness: 200 }}
          >
            {currentStreak}
          </motion.div>
          
          <div className={`${classes.label} font-medium opacity-90 mt-1`}>
            Day Streak
          </div>
        </div>

        {/* Shine effect */}
        <motion.div
          className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent"
          initial={{ x: '-100%' }}
          animate={{ x: '200%' }}
          transition={{ duration: 2, repeat: Infinity, repeatDelay: 5 }}
        />
      </motion.div>

      {showLongest && longestStreak !== undefined && longestStreak > currentStreak && (
        <div className="text-center">
          <p className="text-xs text-gray-600 dark:text-gray-400">
            Personal Best: <span className="font-semibold">{longestStreak} days</span>
          </p>
        </div>
      )}

      {/* Milestone indicators */}
      {currentStreak > 0 && (
        <div className="flex justify-center gap-2">
          {[7, 14, 30, 90].map((milestone) => (
            <div
              key={milestone}
              className={`
                w-2 h-2 rounded-full
                ${currentStreak >= milestone 
                  ? 'bg-green-500' 
                  : 'bg-gray-300 dark:bg-gray-600'
                }
              `}
              title={`${milestone} days`}
            />
          ))}
        </div>
      )}
    </div>
  );
}

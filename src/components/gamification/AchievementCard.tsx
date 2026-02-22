'use client';

import { motion } from 'framer-motion';

interface Achievement {
  id: string;
  name: string;
  description: string;
  unlocked: boolean;
  progress: number;
  xpReward: number;
  icon?: string;
}

interface AchievementCardProps {
  achievement: Achievement;
  size?: 'sm' | 'md' | 'lg';
}

export function AchievementCard({ achievement, size = 'md' }: AchievementCardProps) {
  const sizeClasses = {
    sm: { container: 'p-3', icon: 'text-2xl', title: 'text-sm', desc: 'text-xs' },
    md: { container: 'p-4', icon: 'text-3xl', title: 'text-base', desc: 'text-sm' },
    lg: { container: 'p-6', icon: 'text-4xl', title: 'text-lg', desc: 'text-base' },
  };

  const classes = sizeClasses[size];

  const getAchievementIcon = (id: string) => {
    const iconMap: Record<string, string> = {
      'first_workout': '🎯',
      '100_workouts': '💯',
      '500_workouts': '⚡',
      'first_program': '🎓',
      '10_programs': '🏅',
      '7_day_streak': '🔥',
      '30_day_streak': '🌟',
      '90_day_streak': '👑',
      'first_pr': '💪',
      '50_prs': '🚀',
    };
    return iconMap[id] || '🏆';
  };

  const icon = achievement.icon || getAchievementIcon(achievement.id);

  return (
    <motion.div
      className={`
        ${classes.container}
        rounded-xl
        border-2
        ${achievement.unlocked 
          ? 'bg-gradient-to-br from-yellow-50 to-orange-50 dark:from-yellow-900/20 dark:to-orange-900/20 border-yellow-400 dark:border-yellow-600' 
          : 'bg-gray-50 dark:bg-gray-800 border-gray-300 dark:border-gray-700'
        }
        ${!achievement.unlocked && 'opacity-60'}
        transition-all
        relative
        overflow-hidden
      `}
      whileHover={{ scale: achievement.unlocked ? 1.05 : 1 }}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
    >
      {/* Locked overlay */}
      {!achievement.unlocked && (
        <div className="absolute top-2 right-2">
          <div className="w-6 h-6 rounded-full bg-gray-400 dark:bg-gray-600 flex items-center justify-center">
            <span className="text-xs">🔒</span>
          </div>
        </div>
      )}

      {/* Shine effect for unlocked */}
      {achievement.unlocked && (
        <motion.div
          className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent"
          initial={{ x: '-100%' }}
          animate={{ x: '200%' }}
          transition={{ duration: 2, repeat: Infinity, repeatDelay: 5 }}
        />
      )}

      <div className="relative z-10">
        {/* Icon */}
        <div className={`${classes.icon} mb-2`}>
          {achievement.unlocked ? (
            <motion.span
              animate={{ 
                scale: [1, 1.2, 1],
                rotate: [0, 10, -10, 0]
              }}
              transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }}
            >
              {icon}
            </motion.span>
          ) : (
            <span className="grayscale">{icon}</span>
          )}
        </div>

        {/* Title */}
        <h3 className={`${classes.title} font-bold text-gray-900 dark:text-white mb-1`}>
          {achievement.name}
        </h3>

        {/* Description */}
        <p className={`${classes.desc} text-gray-600 dark:text-gray-400 mb-3`}>
          {achievement.description}
        </p>

        {/* Progress bar (if not unlocked) */}
        {!achievement.unlocked && achievement.progress > 0 && (
          <div className="mb-2">
            <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
              <motion.div
                className="h-full bg-blue-500 rounded-full"
                initial={{ width: 0 }}
                animate={{ width: `${achievement.progress * 100}%` }}
                transition={{ duration: 0.5 }}
              />
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              {Math.round(achievement.progress * 100)}% complete
            </p>
          </div>
        )}

        {/* XP Reward */}
        <div className="flex items-center gap-1">
          <span className="text-xs font-semibold text-yellow-600 dark:text-yellow-400">
            +{achievement.xpReward} XP
          </span>
          {achievement.unlocked && (
            <span className="text-xs text-green-600 dark:text-green-400">
              ✓ Unlocked
            </span>
          )}
        </div>
      </div>
    </motion.div>
  );
}

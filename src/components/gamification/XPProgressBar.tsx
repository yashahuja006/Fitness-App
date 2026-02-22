'use client';

import { motion } from 'framer-motion';
import { UserXP } from '@/types/program';
import { GamificationEngine } from '@/lib/gamificationEngine';

interface XPProgressBarProps {
  userXP: UserXP;
  showDetails?: boolean;
}

export function XPProgressBar({ userXP, showDetails = true }: XPProgressBarProps) {
  const progress = (userXP.currentLevelXP / userXP.nextLevelXP) * 100;
  const levelTitle = GamificationEngine.getLevelTitle(userXP.level);

  return (
    <div className="w-full">
      {showDetails && (
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold text-gray-900 dark:text-white">
              Level {userXP.level}
            </span>
            <span className="text-xs text-gray-500 dark:text-gray-400">
              {levelTitle}
            </span>
          </div>
          <span className="text-xs text-gray-600 dark:text-gray-400">
            {userXP.currentLevelXP} / {userXP.nextLevelXP} XP
          </span>
        </div>
      )}
      
      <div className="relative h-3 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
        <motion.div
          className="absolute inset-y-0 left-0 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full"
          initial={{ width: 0 }}
          animate={{ width: `${progress}%` }}
          transition={{ duration: 0.8, ease: 'easeOut' }}
        />
        
        {/* Shine effect */}
        <motion.div
          className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent"
          initial={{ x: '-100%' }}
          animate={{ x: '200%' }}
          transition={{ duration: 1.5, repeat: Infinity, repeatDelay: 3 }}
        />
      </div>
      
      {showDetails && (
        <div className="mt-1 text-xs text-gray-500 dark:text-gray-400">
          {Math.round(progress)}% to next level
        </div>
      )}
    </div>
  );
}

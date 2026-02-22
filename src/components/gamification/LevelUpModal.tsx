'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/Button';
import { LevelBadge } from './LevelBadge';
import { GamificationEngine } from '@/lib/gamificationEngine';

interface LevelUpModalProps {
  isOpen: boolean;
  onClose: () => void;
  oldLevel: number;
  newLevel: number;
  totalXP: number;
}

export function LevelUpModal({ isOpen, onClose, oldLevel, newLevel, totalXP }: LevelUpModalProps) {
  const newLevelTitle = GamificationEngine.getLevelTitle(newLevel);

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />

          {/* Modal */}
          <div className="fixed inset-0 flex items-center justify-center z-50 p-4">
            <motion.div
              className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-md w-full p-8 relative overflow-hidden"
              initial={{ scale: 0.5, opacity: 0, y: 100 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.5, opacity: 0, y: 100 }}
              transition={{ type: 'spring', stiffness: 200, damping: 20 }}
            >
              {/* Confetti background effect */}
              <div className="absolute inset-0 overflow-hidden pointer-events-none">
                {[...Array(20)].map((_, i) => (
                  <motion.div
                    key={i}
                    className="absolute w-2 h-2 bg-yellow-400 rounded-full"
                    initial={{ 
                      x: Math.random() * 400 - 200,
                      y: -20,
                      opacity: 1
                    }}
                    animate={{ 
                      y: 600,
                      opacity: 0,
                      rotate: Math.random() * 360
                    }}
                    transition={{ 
                      duration: 2 + Math.random() * 2,
                      delay: Math.random() * 0.5,
                      repeat: Infinity
                    }}
                  />
                ))}
              </div>

              {/* Content */}
              <div className="relative z-10 text-center">
                {/* Title */}
                <motion.h2
                  className="text-3xl font-bold text-gray-900 dark:text-white mb-2"
                  initial={{ y: -20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.2 }}
                >
                  🎉 Level Up!
                </motion.h2>

                <motion.p
                  className="text-gray-600 dark:text-gray-400 mb-8"
                  initial={{ y: -20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.3 }}
                >
                  You've reached a new level!
                </motion.p>

                {/* Level badges */}
                <div className="flex items-center justify-center gap-8 mb-8">
                  <div className="text-center">
                    <LevelBadge level={oldLevel} size="md" animated={false} />
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
                      Level {oldLevel}
                    </p>
                  </div>

                  <motion.div
                    className="text-4xl"
                    animate={{ x: [0, 10, 0] }}
                    transition={{ duration: 1, repeat: Infinity }}
                  >
                    →
                  </motion.div>

                  <div className="text-center">
                    <LevelBadge level={newLevel} size="lg" animated={true} />
                    <p className="text-sm font-semibold text-gray-900 dark:text-white mt-2">
                      Level {newLevel}
                    </p>
                  </div>
                </div>

                {/* New title */}
                <motion.div
                  className="mb-8 p-4 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 rounded-lg"
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ delay: 0.5 }}
                >
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                    New Title Unlocked
                  </p>
                  <p className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600">
                    {newLevelTitle}
                  </p>
                </motion.div>

                {/* Stats */}
                <motion.div
                  className="grid grid-cols-2 gap-4 mb-8"
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.6 }}
                >
                  <div className="p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                    <p className="text-xs text-gray-600 dark:text-gray-400">Total XP</p>
                    <p className="text-xl font-bold text-gray-900 dark:text-white">
                      {totalXP.toLocaleString()}
                    </p>
                  </div>
                  <div className="p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                    <p className="text-xs text-gray-600 dark:text-gray-400">Next Level</p>
                    <p className="text-xl font-bold text-gray-900 dark:text-white">
                      {GamificationEngine.getXPForNextLevel(newLevel).toLocaleString()}
                    </p>
                  </div>
                </motion.div>

                {/* Close button */}
                <motion.div
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.7 }}
                >
                  <Button
                    variant="primary"
                    onClick={onClose}
                    className="w-full"
                  >
                    Continue Training
                  </Button>
                </motion.div>
              </div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
}

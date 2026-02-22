'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { useEffect } from 'react';

interface AchievementNotificationProps {
  achievement: {
    id: string;
    title: string;
    description: string;
    icon: string;
  } | null;
  isVisible: boolean;
  onClose: () => void;
}

export function AchievementNotification({ 
  achievement, 
  isVisible, 
  onClose 
}: Readonly<AchievementNotificationProps>) {
  useEffect(() => {
    if (isVisible) {
      const timer = setTimeout(() => {
        onClose();
      }, 5000); // Show for 5 seconds
      return () => clearTimeout(timer);
    }
  }, [isVisible, onClose]);

  if (!achievement) return null;

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          className="fixed top-20 right-4 z-50 max-w-sm"
          initial={{ opacity: 0, x: 100, scale: 0.8 }}
          animate={{ opacity: 1, x: 0, scale: 1 }}
          exit={{ opacity: 0, x: 100, scale: 0.8 }}
          transition={{ type: 'spring', stiffness: 200, damping: 20 }}
        >
          <div className="bg-linear-to-br from-yellow-400 to-orange-500 text-white p-6 rounded-lg shadow-2xl border-2 border-yellow-300">
            <div className="flex items-start gap-4">
              <motion.div
                className="text-5xl"
                animate={{ 
                  rotate: [0, -10, 10, -10, 0],
                  scale: [1, 1.2, 1.1, 1.2, 1]
                }}
                transition={{ duration: 0.6 }}
              >
                {achievement.icon}
              </motion.div>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xs font-bold uppercase tracking-wider text-yellow-100">
                    Achievement Unlocked!
                  </span>
                </div>
                <h3 className="font-bold text-lg mb-1">{achievement.title}</h3>
                <p className="text-sm text-yellow-50">{achievement.description}</p>
              </div>
            </div>
            
            {/* Sparkle effects */}
            <div className="absolute top-2 right-2">
              <motion.div
                animate={{ 
                  scale: [1, 1.5, 1],
                  opacity: [1, 0.5, 1]
                }}
                transition={{ 
                  duration: 1.5,
                  repeat: Number.POSITIVE_INFINITY,
                  ease: 'easeInOut'
                }}
                className="text-yellow-200"
              >
                ✨
              </motion.div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

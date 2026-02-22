'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { useEffect } from 'react';

interface XPNotificationProps {
  xpEarned: number;
  isVisible: boolean;
  onClose: () => void;
}

export function XPNotification({ xpEarned, isVisible, onClose }: Readonly<XPNotificationProps>) {
  useEffect(() => {
    if (isVisible) {
      const timer = setTimeout(() => {
        onClose();
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [isVisible, onClose]);

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          className="fixed top-20 right-4 z-50"
          initial={{ opacity: 0, x: 100, scale: 0.8 }}
          animate={{ opacity: 1, x: 0, scale: 1 }}
          exit={{ opacity: 0, x: 100, scale: 0.8 }}
          transition={{ type: 'spring', stiffness: 200, damping: 20 }}
        >
          <div className="bg-linear-to-r from-blue-500 to-purple-600 text-white px-6 py-4 rounded-lg shadow-2xl">
            <div className="flex items-center gap-3">
              <motion.div
                className="text-3xl"
                animate={{ 
                  rotate: [0, 10, -10, 10, 0],
                  scale: [1, 1.2, 1]
                }}
                transition={{ duration: 0.5 }}
              >
                ⭐
              </motion.div>
              <div>
                <p className="font-bold text-lg">+{xpEarned} XP</p>
                <p className="text-sm text-blue-100">Great work!</p>
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

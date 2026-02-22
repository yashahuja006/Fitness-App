'use client';

import { motion } from 'framer-motion';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';

interface StreakProtectionProps {
  currentStreak: number;
  protectionAvailable: boolean;
  isPro: boolean;
  onActivate: () => void;
  onUpgrade: () => void;
}

export function StreakProtection({
  currentStreak,
  protectionAvailable,
  isPro,
  onActivate,
  onUpgrade,
}: Readonly<StreakProtectionProps>) {
  if (!isPro) {
    return (
      <Card className="p-6 relative overflow-hidden">
        <div className="absolute inset-0 bg-linear-to-br from-yellow-500/10 to-orange-500/10" />
        <div className="relative">
          <div className="flex items-start justify-between mb-4">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <span className="text-2xl">🛡️</span>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Streak Protection
                </h3>
                <span className="px-2 py-1 bg-gradient-to-r from-yellow-400 to-orange-500 text-white text-xs font-bold rounded">
                  PRO
                </span>
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Never lose your streak! Get automatic protection when life gets busy.
              </p>
            </div>
          </div>

          <div className="space-y-3 mb-4">
            <div className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
              <span className="text-green-500">✓</span>
              <span>Automatic 1-day grace period</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
              <span className="text-green-500">✓</span>
              <span>Protect streaks up to 90 days</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
              <span className="text-green-500">✓</span>
              <span>Get notified before streak expires</span>
            </div>
          </div>

          <Button
            variant="primary"
            onClick={onUpgrade}
            className="w-full bg-gradient-to-r from-yellow-400 to-orange-500 hover:from-yellow-500 hover:to-orange-600"
          >
            Upgrade to Pro
          </Button>
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-6">
      <div className="flex items-start justify-between mb-4">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="text-2xl">🛡️</span>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              Streak Protection
            </h3>
          </div>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Your {currentStreak}-day streak is protected
          </p>
        </div>
        {protectionAvailable && (
          <motion.div
            animate={{ scale: [1, 1.1, 1] }}
            transition={{ duration: 2, repeat: Number.POSITIVE_INFINITY }}
            className="text-2xl"
          >
            ✨
          </motion.div>
        )}
      </div>

      {protectionAvailable ? (
        <div className="space-y-4">
          <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-green-600 dark:text-green-400 text-xl">✓</span>
              <span className="font-semibold text-green-900 dark:text-green-100">
                Protection Active
              </span>
            </div>
            <p className="text-sm text-green-700 dark:text-green-300">
              You have a 1-day grace period. If you miss today's workout, your streak will be protected automatically.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="text-center p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
              <div className="text-2xl font-bold text-gray-900 dark:text-white">
                {currentStreak}
              </div>
              <div className="text-xs text-gray-600 dark:text-gray-400">
                Current Streak
              </div>
            </div>
            <div className="text-center p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
              <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                1
              </div>
              <div className="text-xs text-gray-600 dark:text-gray-400">
                Days Protected
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg border border-yellow-200 dark:border-yellow-800">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-yellow-600 dark:text-yellow-400 text-xl">⚠️</span>
              <span className="font-semibold text-yellow-900 dark:text-yellow-100">
                Protection Used
              </span>
            </div>
            <p className="text-sm text-yellow-700 dark:text-yellow-300">
              Your streak protection was used recently. Complete a workout to reactivate it.
            </p>
          </div>

          <Button
            variant="primary"
            onClick={onActivate}
            disabled
            className="w-full"
          >
            Complete Workout to Reactivate
          </Button>
        </div>
      )}

      <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
        <p className="text-xs text-gray-500 dark:text-gray-400 text-center">
          Streak protection automatically activates when you miss a day. Reactivates after your next workout.
        </p>
      </div>
    </Card>
  );
}

'use client';

import { motion } from 'framer-motion';

interface WeeklyScore {
  week: number;
  score: number;
  breakdown: {
    completion: number;
    consistency: number;
    intensity: number;
    progression: number;
  };
  grade: 'A+' | 'A' | 'B' | 'C' | 'D' | 'F';
}

interface WeeklyScoreCardProps {
  weeklyScore: WeeklyScore;
}

export function WeeklyScoreCard({ weeklyScore }: WeeklyScoreCardProps) {
  const getGradeColor = (grade: string) => {
    const colors = {
      'A+': 'from-green-500 to-emerald-600',
      'A': 'from-green-400 to-green-600',
      'B': 'from-blue-400 to-blue-600',
      'C': 'from-yellow-400 to-yellow-600',
      'D': 'from-orange-400 to-orange-600',
      'F': 'from-red-400 to-red-600',
    };
    return colors[grade as keyof typeof colors] || colors.B;
  };

  const getGradeEmoji = (grade: string) => {
    const emojis = {
      'A+': '🏆',
      'A': '⭐',
      'B': '👍',
      'C': '😐',
      'D': '😕',
      'F': '😞',
    };
    return emojis[grade as keyof typeof emojis] || '📊';
  };

  const gradeColor = getGradeColor(weeklyScore.grade);
  const gradeEmoji = getGradeEmoji(weeklyScore.grade);

  return (
    <motion.div
      className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 border border-gray-200 dark:border-gray-700"
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.3 }}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-bold text-gray-900 dark:text-white">
            Week {weeklyScore.week} Performance
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Your weekly score breakdown
          </p>
        </div>
        
        {/* Grade Badge */}
        <motion.div
          className={`
            w-20 h-20
            rounded-full
            bg-gradient-to-br ${gradeColor}
            flex flex-col items-center justify-center
            text-white
            shadow-lg
          `}
          whileHover={{ scale: 1.1, rotate: 5 }}
        >
          <div className="text-2xl">{gradeEmoji}</div>
          <div className="text-xl font-bold">{weeklyScore.grade}</div>
        </motion.div>
      </div>

      {/* Total Score */}
      <div className="mb-6">
        <div className="flex items-end gap-2 mb-2">
          <motion.span
            className="text-5xl font-bold text-gray-900 dark:text-white"
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', stiffness: 200 }}
          >
            {weeklyScore.score}
          </motion.span>
          <span className="text-2xl text-gray-500 dark:text-gray-400 mb-2">
            / 100
          </span>
        </div>
        
        {/* Progress bar */}
        <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
          <motion.div
            className={`h-full bg-gradient-to-r ${gradeColor} rounded-full`}
            initial={{ width: 0 }}
            animate={{ width: `${weeklyScore.score}%` }}
            transition={{ duration: 1, ease: 'easeOut' }}
          />
        </div>
      </div>

      {/* Breakdown */}
      <div className="space-y-3">
        <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
          Score Breakdown
        </h4>
        
        {Object.entries(weeklyScore.breakdown).map(([key, value]) => {
          const maxScores = {
            completion: 40,
            consistency: 30,
            intensity: 20,
            progression: 10,
          };
          const max = maxScores[key as keyof typeof maxScores];
          const percentage = (value / max) * 100;
          
          return (
            <div key={key} className="space-y-1">
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600 dark:text-gray-400 capitalize">
                  {key}
                </span>
                <span className="font-semibold text-gray-900 dark:text-white">
                  {value} / {max}
                </span>
              </div>
              <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                <motion.div
                  className="h-full bg-blue-500 rounded-full"
                  initial={{ width: 0 }}
                  animate={{ width: `${percentage}%` }}
                  transition={{ duration: 0.5, delay: 0.2 }}
                />
              </div>
            </div>
          );
        })}
      </div>

      {/* Feedback */}
      <div className="mt-6 p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
        <p className="text-sm text-gray-700 dark:text-gray-300">
          {weeklyScore.grade === 'A+' && '🎉 Outstanding performance! You crushed this week!'}
          {weeklyScore.grade === 'A' && '⭐ Excellent work! Keep up the great consistency!'}
          {weeklyScore.grade === 'B' && '👍 Good job! A few improvements and you\'ll hit A grade!'}
          {weeklyScore.grade === 'C' && '😐 Decent effort. Focus on consistency this week.'}
          {weeklyScore.grade === 'D' && '😕 Room for improvement. Let\'s get back on track!'}
          {weeklyScore.grade === 'F' && '😞 Tough week. Remember, every day is a fresh start!'}
        </p>
      </div>
    </motion.div>
  );
}

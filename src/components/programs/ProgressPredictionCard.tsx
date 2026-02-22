'use client';

import { Card } from '@/components/ui/Card';
import { ProgressPrediction } from '@/types/program';

interface ProgressPredictionCardProps {
  prediction: ProgressPrediction;
  isPro?: boolean;
}

export function ProgressPredictionCard({ prediction, isPro = false }: ProgressPredictionCardProps) {
  if (!isPro) {
    return (
      <Card className="p-6 relative overflow-hidden">
        <div className="absolute inset-0 backdrop-blur-sm bg-gray-900/50 flex items-center justify-center z-10">
          <div className="text-center">
            <div className="text-4xl mb-2">🔒</div>
            <p className="text-white font-semibold mb-2">Pro Feature</p>
            <p className="text-gray-300 text-sm">Unlock AI progress predictions</p>
          </div>
        </div>
        <div className="blur-sm">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            {prediction.timeframe}-Week Predictions
          </h3>
          <div className="grid grid-cols-2 gap-4">
            <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded">
              <p className="text-sm text-gray-600 dark:text-gray-400">Muscle Gain</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">+X.X lbs</p>
            </div>
          </div>
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
          {prediction.timeframe}-Week Predictions
        </h3>
        <span className="px-3 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-400 rounded-full text-sm font-medium">
          {prediction.confidence}% confidence
        </span>
      </div>

      <div className="grid grid-cols-2 gap-4 mb-4">
        <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
          <p className="text-sm text-green-700 dark:text-green-400 mb-1">Muscle Mass Gain</p>
          <p className="text-2xl font-bold text-green-900 dark:text-green-300">
            +{prediction.muscleMassGain.expected} {prediction.muscleMassGain.unit}
          </p>
          <p className="text-xs text-green-600 dark:text-green-500 mt-1">
            Range: {prediction.muscleMassGain.min}-{prediction.muscleMassGain.max} {prediction.muscleMassGain.unit}
          </p>
        </div>

        <div className="p-4 bg-red-50 dark:bg-red-900/20 rounded-lg">
          <p className="text-sm text-red-700 dark:text-red-400 mb-1">Fat Loss</p>
          <p className="text-2xl font-bold text-red-900 dark:text-red-300">
            -{prediction.fatLoss.expected} {prediction.fatLoss.unit}
          </p>
          <p className="text-xs text-red-600 dark:text-red-500 mt-1">
            Range: {prediction.fatLoss.min}-{prediction.fatLoss.max} {prediction.fatLoss.unit}
          </p>
        </div>
      </div>

      <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg mb-4">
        <p className="text-sm text-blue-700 dark:text-blue-400 mb-2">Strength Gains</p>
        <div className="grid grid-cols-3 gap-3">
          <div>
            <p className="text-xs text-blue-600 dark:text-blue-500">Bench</p>
            <p className="text-lg font-bold text-blue-900 dark:text-blue-300">
              +{prediction.strengthGain.bench}%
            </p>
          </div>
          <div>
            <p className="text-xs text-blue-600 dark:text-blue-500">Squat</p>
            <p className="text-lg font-bold text-blue-900 dark:text-blue-300">
              +{prediction.strengthGain.squat}%
            </p>
          </div>
          <div>
            <p className="text-xs text-blue-600 dark:text-blue-500">Deadlift</p>
            <p className="text-lg font-bold text-blue-900 dark:text-blue-300">
              +{prediction.strengthGain.deadlift}%
            </p>
          </div>
        </div>
      </div>

      <div className="p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
        <p className="text-sm text-purple-700 dark:text-purple-400 mb-1">Time Commitment</p>
        <p className="text-lg font-bold text-purple-900 dark:text-purple-300">
          {prediction.timeCommitment.hoursPerWeek} hours/week
        </p>
        <p className="text-xs text-purple-600 dark:text-purple-500 mt-1">
          Total: {prediction.timeCommitment.totalHours} hours over {prediction.timeframe} weeks
        </p>
      </div>

      <div className="mt-4 p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded border border-yellow-200 dark:border-yellow-800">
        <p className="text-xs text-yellow-800 dark:text-yellow-400">
          💡 Predictions update weekly based on your actual progress and compliance
        </p>
      </div>
    </Card>
  );
}

'use client';

import { useState } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';

export interface UserWorkoutProfile {
  fitnessLevel: 'beginner' | 'intermediate' | 'advanced';
  goal: 'lose_weight' | 'build_muscle' | 'get_fit' | 'maintain';
  daysPerWeek: number;
  sessionDuration: number;
  preferredTime: 'morning' | 'afternoon' | 'evening';
  equipment: string[];
  injuries: string;
}

interface WorkoutOnboardingProps {
  onComplete: (profile: UserWorkoutProfile) => void;
  onSkip: () => void;
}

export function WorkoutOnboarding({ onComplete, onSkip }: WorkoutOnboardingProps) {
  const [step, setStep] = useState(1);
  const [profile, setProfile] = useState<Partial<UserWorkoutProfile>>({
    equipment: [],
  });

  const handleNext = () => {
    if (step < 5) setStep(step + 1);
    else if (profile.fitnessLevel && profile.goal && profile.daysPerWeek && profile.sessionDuration && profile.preferredTime) {
      onComplete(profile as UserWorkoutProfile);
    }
  };

  const handleBack = () => {
    if (step > 1) setStep(step - 1);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70">
      <Card className="max-w-2xl w-full p-8">
        <div className="mb-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
              Personalize Your Workout Plan
            </h2>
            <button onClick={onSkip} className="text-gray-500 hover:text-gray-700 dark:text-gray-400">
              Skip
            </button>
          </div>
          <div className="flex gap-2">
            {[1, 2, 3, 4, 5].map((s) => (
              <div
                key={s}
                className={`h-2 flex-1 rounded-full ${
                  s <= step ? 'bg-blue-600' : 'bg-gray-200 dark:bg-gray-700'
                }`}
              />
            ))}
          </div>
        </div>

        {/* Step 1: Fitness Level */}
        {step === 1 && (
          <div>
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
              What's your current fitness level?
            </h3>
            <div className="space-y-3">
              {[
                { value: 'beginner', label: 'Beginner', desc: 'New to working out or returning after a break' },
                { value: 'intermediate', label: 'Intermediate', desc: 'Regular workouts for 6+ months' },
                { value: 'advanced', label: 'Advanced', desc: 'Consistent training for 2+ years' },
              ].map((level) => (
                <button
                  key={level.value}
                  onClick={() => setProfile({ ...profile, fitnessLevel: level.value as any })}
                  className={`w-full p-4 rounded-lg border-2 text-left transition-all ${
                    profile.fitnessLevel === level.value
                      ? 'border-blue-600 bg-blue-50 dark:bg-blue-900/20'
                      : 'border-gray-200 dark:border-gray-700 hover:border-blue-300'
                  }`}
                >
                  <div className="font-semibold text-gray-900 dark:text-white">{level.label}</div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">{level.desc}</div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Step 2: Goal */}
        {step === 2 && (
          <div>
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
              What's your primary fitness goal?
            </h3>
            <div className="grid grid-cols-2 gap-3">
              {[
                { value: 'lose_weight', label: 'Lose Weight', icon: '🔥' },
                { value: 'build_muscle', label: 'Build Muscle', icon: '💪' },
                { value: 'get_fit', label: 'Get Fit', icon: '🏃' },
                { value: 'maintain', label: 'Maintain', icon: '⚖️' },
              ].map((goal) => (
                <button
                  key={goal.value}
                  onClick={() => setProfile({ ...profile, goal: goal.value as any })}
                  className={`p-6 rounded-lg border-2 text-center transition-all ${
                    profile.goal === goal.value
                      ? 'border-blue-600 bg-blue-50 dark:bg-blue-900/20'
                      : 'border-gray-200 dark:border-gray-700 hover:border-blue-300'
                  }`}
                >
                  <div className="text-4xl mb-2">{goal.icon}</div>
                  <div className="font-semibold text-gray-900 dark:text-white">{goal.label}</div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Step 3: Frequency */}
        {step === 3 && (
          <div>
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
              How many days per week can you workout?
            </h3>
            <div className="grid grid-cols-4 gap-3 mb-6">
              {[3, 4, 5, 6].map((days) => (
                <button
                  key={days}
                  onClick={() => setProfile({ ...profile, daysPerWeek: days })}
                  className={`p-6 rounded-lg border-2 text-center transition-all ${
                    profile.daysPerWeek === days
                      ? 'border-blue-600 bg-blue-50 dark:bg-blue-900/20'
                      : 'border-gray-200 dark:border-gray-700 hover:border-blue-300'
                  }`}
                >
                  <div className="text-3xl font-bold text-gray-900 dark:text-white">{days}</div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">days</div>
                </button>
              ))}
            </div>
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
              How long per session?
            </h3>
            <div className="grid grid-cols-3 gap-3">
              {[30, 45, 60].map((duration) => (
                <button
                  key={duration}
                  onClick={() => setProfile({ ...profile, sessionDuration: duration })}
                  className={`p-6 rounded-lg border-2 text-center transition-all ${
                    profile.sessionDuration === duration
                      ? 'border-blue-600 bg-blue-50 dark:bg-blue-900/20'
                      : 'border-gray-200 dark:border-gray-700 hover:border-blue-300'
                  }`}
                >
                  <div className="text-3xl font-bold text-gray-900 dark:text-white">{duration}</div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">minutes</div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Step 4: Preferred Time & Equipment */}
        {step === 4 && (
          <div>
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
              When do you prefer to workout?
            </h3>
            <div className="grid grid-cols-3 gap-3 mb-6">
              {[
                { value: 'morning', label: 'Morning', icon: '🌅' },
                { value: 'afternoon', label: 'Afternoon', icon: '☀️' },
                { value: 'evening', label: 'Evening', icon: '🌙' },
              ].map((time) => (
                <button
                  key={time.value}
                  onClick={() => setProfile({ ...profile, preferredTime: time.value as any })}
                  className={`p-6 rounded-lg border-2 text-center transition-all ${
                    profile.preferredTime === time.value
                      ? 'border-blue-600 bg-blue-50 dark:bg-blue-900/20'
                      : 'border-gray-200 dark:border-gray-700 hover:border-blue-300'
                  }`}
                >
                  <div className="text-3xl mb-2">{time.icon}</div>
                  <div className="font-semibold text-gray-900 dark:text-white">{time.label}</div>
                </button>
              ))}
            </div>
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
              What equipment do you have access to?
            </h3>
            <div className="grid grid-cols-2 gap-3">
              {['Dumbbells', 'Barbell', 'Resistance Bands', 'Pull-up Bar', 'Bench', 'None'].map((eq) => (
                <button
                  key={eq}
                  onClick={() => {
                    const current = profile.equipment || [];
                    setProfile({
                      ...profile,
                      equipment: current.includes(eq)
                        ? current.filter((e) => e !== eq)
                        : [...current, eq],
                    });
                  }}
                  className={`p-4 rounded-lg border-2 text-center transition-all ${
                    profile.equipment?.includes(eq)
                      ? 'border-blue-600 bg-blue-50 dark:bg-blue-900/20'
                      : 'border-gray-200 dark:border-gray-700 hover:border-blue-300'
                  }`}
                >
                  <div className="font-semibold text-gray-900 dark:text-white">{eq}</div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Step 5: Injuries/Limitations */}
        {step === 5 && (
          <div>
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
              Any injuries or limitations? (Optional)
            </h3>
            <textarea
              value={profile.injuries || ''}
              onChange={(e) => setProfile({ ...profile, injuries: e.target.value })}
              placeholder="e.g., Lower back pain, knee issues, shoulder injury..."
              className="w-full p-4 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white min-h-32"
            />
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
              This helps us customize exercises to avoid aggravating any existing conditions.
            </p>
          </div>
        )}

        {/* Navigation Buttons */}
        <div className="flex justify-between mt-8">
          <Button
            variant="secondary"
            onClick={handleBack}
            disabled={step === 1}
          >
            Back
          </Button>
          <Button
            variant="primary"
            onClick={handleNext}
            disabled={
              (step === 1 && !profile.fitnessLevel) ||
              (step === 2 && !profile.goal) ||
              (step === 3 && (!profile.daysPerWeek || !profile.sessionDuration)) ||
              (step === 4 && !profile.preferredTime)
            }
          >
            {step === 5 ? 'Complete Setup' : 'Next'}
          </Button>
        </div>
      </Card>
    </div>
  );
}

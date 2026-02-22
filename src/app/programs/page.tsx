'use client';

import { useState, useEffect } from 'react';
import { Navigation } from '@/components/ui/Navigation';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { ProgramRecommendations } from '@/components/programs/ProgramRecommendations';
import { ProgressPredictionCard } from '@/components/programs/ProgressPredictionCard';
import { Program, ProgramScore, UserProgramProfile } from '@/types/program';
import { ProgressPredictionService } from '@/lib/progressPredictionService';
import { ProfileConverter } from '@/lib/profileConverter';

export default function ProgramsPage() {
  const [userProfile, setUserProfile] = useState<UserProgramProfile | null>(null);
  const [selectedProgram, setSelectedProgram] = useState<{ program: Program; score: ProgramScore } | null>(null);
  const [isPro, setIsPro] = useState(false);
  const [showProfileSetup, setShowProfileSetup] = useState(false);

  // Load user profile
  useEffect(() => {
    // Try to load program profile, or convert from workout profile
    const profile = ProfileConverter.loadProgramProfile();
    if (profile) {
      setUserProfile(profile);
    } else {
      setShowProfileSetup(true);
    }

    // Check Pro status (placeholder)
    const proStatus = localStorage.getItem('isProUser');
    setIsPro(proStatus === 'true');
  }, []);

  const handleSelectProgram = (program: Program, score: ProgramScore) => {
    setSelectedProgram({ program, score });
    
    // Generate prediction
    const prediction = ProgressPredictionService.generatePrediction(
      program,
      userProfile!,
      85, // Default compliance
      0   // New user
    );
    
    console.log('Program selected:', program.name);
    console.log('Prediction:', prediction);
  };

  const handleStartProgram = () => {
    if (!selectedProgram) return;
    
    // Save program selection
    localStorage.setItem('activeProgram', JSON.stringify(selectedProgram.program));
    localStorage.setItem('programStartDate', new Date().toISOString());
    
    alert(`Started ${selectedProgram.program.name}! Your journey begins now.`);
  };

  if (showProfileSetup && !userProfile) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <Navigation />
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <Card className="p-8">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
              Set Up Your Profile
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              To get personalized program recommendations, please complete your workout profile first.
            </p>
            <Button
              variant="primary"
              onClick={() => window.location.href = '/workouts'}
            >
              Go to Workouts Page
            </Button>
          </Card>
        </div>
      </div>
    );
  }

  if (!userProfile) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <Navigation />
        <div className="flex items-center justify-center h-screen">
          <div className="text-center">
            <div className="text-4xl mb-4">⏳</div>
            <p className="text-gray-600 dark:text-gray-400">Loading...</p>
          </div>
        </div>
      </div>
    );
  }

  const prediction = selectedProgram
    ? ProgressPredictionService.generatePrediction(
        selectedProgram.program,
        userProfile,
        85,
        0
      )
    : null;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <Navigation />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Hero Section */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-2">
                AI Program Intelligence Center
              </h1>
              <p className="text-gray-600 dark:text-gray-400">
                Intelligent program matching powered by advanced scoring algorithms
              </p>
            </div>
            {!isPro && (
              <Button
                variant="primary"
                onClick={() => {
                  localStorage.setItem('isProUser', 'true');
                  setIsPro(true);
                }}
                className="bg-gradient-to-r from-blue-500 to-purple-600"
              >
                🚀 Upgrade to Pro
              </Button>
            )}
          </div>

          {/* User Profile Summary */}
          <Card className="p-6 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-6">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Primary Goal</p>
                  <p className="text-lg font-semibold text-gray-900 dark:text-white capitalize">
                    {userProfile.primaryGoal.replace('_', ' ')}
                  </p>
                </div>
                <div className="h-12 w-px bg-gray-300 dark:bg-gray-700" />
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Experience</p>
                  <p className="text-lg font-semibold text-gray-900 dark:text-white capitalize">
                    {userProfile.experienceLevel}
                  </p>
                </div>
                <div className="h-12 w-px bg-gray-300 dark:bg-gray-700" />
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Availability</p>
                  <p className="text-lg font-semibold text-gray-900 dark:text-white">
                    {userProfile.daysPerWeek} days/week
                  </p>
                </div>
                <div className="h-12 w-px bg-gray-300 dark:bg-gray-700" />
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Recovery</p>
                  <p className="text-lg font-semibold text-gray-900 dark:text-white capitalize">
                    {userProfile.recoveryQuality}
                  </p>
                </div>
              </div>
              <Button
                variant="secondary"
                onClick={() => window.location.href = '/workouts'}
              >
                Edit Profile
              </Button>
            </div>
          </Card>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Main Content - Recommendations */}
          <div className="lg:col-span-2">
            <ProgramRecommendations
              userProfile={userProfile}
              onSelectProgram={handleSelectProgram}
              isPro={isPro}
            />
          </div>

          {/* Sidebar - Selected Program Details */}
          <div className="space-y-6">
            {selectedProgram ? (
              <>
                <Card className="p-6">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                    Selected Program
                  </h3>
                  <div className="mb-4">
                    <p className="font-medium text-gray-900 dark:text-white mb-2">
                      {selectedProgram.program.name}
                    </p>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                      {selectedProgram.program.description}
                    </p>
                    <div className="flex items-center gap-2 mb-4">
                      <span className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                        {selectedProgram.score.totalScore}
                      </span>
                      <span className="text-sm text-gray-500 dark:text-gray-400">/ 100 match score</span>
                    </div>
                  </div>
                  
                  <div className="space-y-3 mb-6">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600 dark:text-gray-400">Duration</span>
                      <span className="font-medium text-gray-900 dark:text-white">
                        {selectedProgram.program.duration} weeks
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600 dark:text-gray-400">Frequency</span>
                      <span className="font-medium text-gray-900 dark:text-white">
                        {selectedProgram.program.daysPerWeek} days/week
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600 dark:text-gray-400">Volume</span>
                      <span className="font-medium text-gray-900 dark:text-white">
                        {selectedProgram.program.volumeProfile.setsPerWeek} sets/week
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600 dark:text-gray-400">Intensity</span>
                      <span className="font-medium text-gray-900 dark:text-white capitalize">
                        {selectedProgram.program.volumeProfile.intensityLevel}
                      </span>
                    </div>
                  </div>

                  <Button
                    variant="primary"
                    onClick={handleStartProgram}
                    className="w-full"
                  >
                    Start This Program
                  </Button>
                </Card>

                {prediction && (
                  <ProgressPredictionCard prediction={prediction} isPro={isPro} />
                )}

                {isPro && (
                  <Card className="p-6">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                      Program Features
                    </h3>
                    <ul className="space-y-2 text-sm">
                      <li className="flex items-start">
                        <span className="mr-2">✅</span>
                        <span className="text-gray-600 dark:text-gray-400">
                          Adaptive volume adjustments
                        </span>
                      </li>
                      <li className="flex items-start">
                        <span className="mr-2">✅</span>
                        <span className="text-gray-600 dark:text-gray-400">
                          Weekly progress predictions
                        </span>
                      </li>
                      <li className="flex items-start">
                        <span className="mr-2">✅</span>
                        <span className="text-gray-600 dark:text-gray-400">
                          Smart deload scheduling
                        </span>
                      </li>
                      <li className="flex items-start">
                        <span className="mr-2">✅</span>
                        <span className="text-gray-600 dark:text-gray-400">
                          Plateau detection & intervention
                        </span>
                      </li>
                      <li className="flex items-start">
                        <span className="mr-2">✅</span>
                        <span className="text-gray-600 dark:text-gray-400">
                          Automatic calendar scheduling
                        </span>
                      </li>
                    </ul>
                  </Card>
                )}
              </>
            ) : (
              <Card className="p-6">
                <div className="text-center text-gray-500 dark:text-gray-400">
                  <div className="text-4xl mb-3">👈</div>
                  <p className="text-sm">
                    Select a program to see detailed predictions and features
                  </p>
                </div>
              </Card>
            )}
          </div>
        </div>

        {/* Feature Highlights */}
        {isPro && (
          <div className="mt-12">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
              Pro Features Active
            </h2>
            <div className="grid md:grid-cols-3 gap-6">
              <Card className="p-6">
                <div className="text-3xl mb-3">🎯</div>
                <h3 className="font-semibold text-gray-900 dark:text-white mb-2">
                  Adaptive Training
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Programs automatically adjust based on your compliance, recovery, and progress
                </p>
              </Card>
              
              <Card className="p-6">
                <div className="text-3xl mb-3">📊</div>
                <h3 className="font-semibold text-gray-900 dark:text-white mb-2">
                  Progress Predictions
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  See expected muscle gain, fat loss, and strength increases before you start
                </p>
              </Card>
              
              <Card className="p-6">
                <div className="text-3xl mb-3">🏆</div>
                <h3 className="font-semibold text-gray-900 dark:text-white mb-2">
                  Gamification System
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Earn XP, level up, unlock achievements, and maintain streaks
                </p>
              </Card>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

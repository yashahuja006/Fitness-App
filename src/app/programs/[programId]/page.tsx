'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Navigation } from '@/components/ui/Navigation';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Program } from '@/types/program';
import { programDatabase } from '@/data/programDatabase';
import { ProgressPredictionService } from '@/lib/progressPredictionService';
import { ProfileConverter } from '@/lib/profileConverter';
import { ProgressPredictionCard } from '@/components/programs/ProgressPredictionCard';

export default function ProgramDetailPage() {
  const params = useParams();
  const router = useRouter();
  const programId = params.programId as string;
  
  const [program, setProgram] = useState<Program | null>(null);
  const [activeWeek, setActiveWeek] = useState(1);
  const [isPro, setIsPro] = useState(false);

  useEffect(() => {
    const foundProgram = programDatabase.find(p => p.id === programId);
    setProgram(foundProgram || null);
    
    const proStatus = localStorage.getItem('isProUser');
    setIsPro(proStatus === 'true');
  }, [programId]);

  if (!program) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <Navigation />
        <div className="flex items-center justify-center h-screen">
          <div className="text-center">
            <p className="text-gray-600 dark:text-gray-400">Program not found</p>
            <Button variant="primary" onClick={() => router.push('/programs')} className="mt-4">
              Back to Programs
            </Button>
          </div>
        </div>
      </div>
    );
  }

  const handleStartProgram = () => {
    localStorage.setItem('activeProgram', JSON.stringify(program));
    localStorage.setItem('programStartDate', new Date().toISOString());
    localStorage.setItem('currentWeek', '1');
    router.push('/programs/active');
  };

  const userProfile = ProfileConverter.loadProgramProfile();
  const prediction = userProfile 
    ? ProgressPredictionService.generatePrediction(program, userProfile, 85, 0)
    : null;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <Navigation />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Back button */}
        <button
          onClick={() => router.back()}
          className="flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white mb-6"
        >
          <span>←</span>
          <span>Back</span>
        </button>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Main content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Hero section */}
            <Card className="p-8">
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                    {program.name}
                  </h1>
                  <p className="text-gray-600 dark:text-gray-400 mb-4">
                    {program.description}
                  </p>
                  <div className="flex flex-wrap gap-2">
                    <span className="px-3 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-400 rounded-full text-sm font-medium capitalize">
                      {program.difficulty}
                    </span>
                    <span className="px-3 py-1 bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-400 rounded-full text-sm font-medium capitalize">
                      {program.goal.replace('_', ' ')}
                    </span>
                    {program.tags.map(tag => (
                      <span key={tag} className="px-3 py-1 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-full text-sm">
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Duration</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">{program.duration}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">weeks</p>
                </div>
                <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Frequency</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">{program.daysPerWeek}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">days/week</p>
                </div>
                <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Volume</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">{program.volumeProfile.setsPerWeek}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">sets/week</p>
                </div>
                <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Intensity</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white capitalize">{program.volumeProfile.intensityLevel}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">level</p>
                </div>
              </div>

              <Button variant="primary" onClick={handleStartProgram} className="w-full">
                Start This Program
              </Button>
            </Card>

            {/* Week-by-week breakdown */}
            <Card className="p-6">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
                Program Structure
              </h2>
              
              {/* Week selector */}
              <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
                {Array.from({ length: program.duration }, (_, i) => i + 1).map(week => (
                  <button
                    key={week}
                    onClick={() => setActiveWeek(week)}
                    className={`
                      px-4 py-2 rounded-lg font-medium whitespace-nowrap
                      ${activeWeek === week
                        ? 'bg-blue-500 text-white'
                        : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
                      }
                      ${program.deloadWeeks.includes(week) && 'border-2 border-yellow-400'}
                    `}
                  >
                    Week {week}
                    {program.deloadWeeks.includes(week) && ' 🔄'}
                  </button>
                ))}
              </div>

              {/* Workout splits */}
              <div className="space-y-4">
                {program.splits.map((split, index) => (
                  <motion.div
                    key={index}
                    className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 }}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <h3 className="font-semibold text-gray-900 dark:text-white">
                          Day {split.day}: {split.name}
                        </h3>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          {split.exercises} exercises • {split.estimatedDuration} min
                        </p>
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-2 mt-3">
                      {split.muscleGroups.map(muscle => (
                        <span
                          key={muscle}
                          className="px-2 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-400 rounded text-xs"
                        >
                          {muscle}
                        </span>
                      ))}
                    </div>
                  </motion.div>
                ))}
              </div>

              {program.deloadWeeks.includes(activeWeek) && (
                <div className="mt-4 p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
                  <p className="text-sm text-yellow-800 dark:text-yellow-400">
                    🔄 <strong>Deload Week:</strong> Reduce volume by 40% and intensity by 20%. Focus on recovery and technique.
                  </p>
                </div>
              )}
            </Card>

            {/* Equipment requirements */}
            <Card className="p-6">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
                Equipment Required
              </h2>
              <div className="flex flex-wrap gap-2">
                {program.equipment.map(eq => (
                  <span
                    key={eq}
                    className="px-4 py-2 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-lg"
                  >
                    {eq}
                  </span>
                ))}
              </div>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {prediction && (
              <ProgressPredictionCard prediction={prediction} isPro={isPro} />
            )}

            <Card className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Program Details
              </h3>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Rep Range</span>
                  <span className="font-medium text-gray-900 dark:text-white">
                    {program.volumeProfile.repsRange[0]}-{program.volumeProfile.repsRange[1]}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Total Workouts</span>
                  <span className="font-medium text-gray-900 dark:text-white">
                    {program.duration * program.daysPerWeek}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Deload Weeks</span>
                  <span className="font-medium text-gray-900 dark:text-white">
                    {program.deloadWeeks.length}
                  </span>
                </div>
              </div>
            </Card>

            <Card className="p-6 bg-gradient-to-br from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                Ready to Start?
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                Begin your {program.duration}-week journey to achieve your {program.goal.replace('_', ' ')} goals.
              </p>
              <Button variant="primary" onClick={handleStartProgram} className="w-full">
                Start Program
              </Button>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}

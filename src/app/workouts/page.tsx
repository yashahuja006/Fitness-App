'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { WorkoutLogger } from '@/components/workouts/WorkoutLogger';
import { WorkoutCalendar } from '@/components/workouts/WorkoutCalendar';
import { WorkoutStats } from '@/components/workouts/WorkoutStats';
import { MeasurementsTracker } from '@/components/workouts/MeasurementsTracker';
import { WorkoutRoutines } from '@/components/workouts/WorkoutRoutines';
import { WorkoutPrograms } from '@/components/workouts/WorkoutPrograms';
import { CameraWorkoutInterface } from '@/components/workouts/CameraWorkoutInterface';
import { WorkoutSession } from '@/types/workout';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Navigation } from '@/components/ui/Navigation';

interface WorkoutProgram {
  id: string;
  name: string;
  description: string;
  level: string;
  goal: string;
  equipment: string;
  duration: string;
  routinesCount: number;
}

type TabType = 'calendar' | 'routines' | 'programs' | 'statistics' | 'measurements';
type WorkoutMode = 'selection' | 'manual' | 'camera';

interface Measurement {
  id: string;
  type: 'weight' | 'body_fat' | 'muscle_mass' | 'chest' | 'waist' | 'arms' | 'thighs' | 'custom';
  value: number;
  unit: string;
  date: Date;
  notes?: string;
}

export default function WorkoutsPage() {
  const [isLogging, setIsLogging] = useState(false);
  const [workoutMode, setWorkoutMode] = useState<WorkoutMode>('selection');
  const [activeTab, setActiveTab] = useState<TabType>('calendar');
  const [selectedDate, setSelectedDate] = useState<Date>();
  const [workoutHistory, setWorkoutHistory] = useState<WorkoutSession[]>([
    // Sample data for demonstration
    {
      id: 'workout_1',
      userId: 'user_1',
      name: 'Push Day',
      exercises: [
        {
          id: 'ex_1',
          exerciseId: 'bench_press',
          exerciseName: 'Bench Press',
          sets: [
            { id: 'set_1', reps: 12, weight: 60, completed: true, restTime: 90 },
            { id: 'set_2', reps: 10, weight: 65, completed: true, restTime: 90 },
            { id: 'set_3', reps: 8, weight: 70, completed: true, restTime: 90 }
          ],
          targetSets: 3,
          targetReps: 10
        }
      ],
      startTime: new Date(2026, 0, 23), // Jan 23, 2026
      endTime: new Date(2026, 0, 23),
      duration: 45,
      totalVolume: 585,
      tags: ['push', 'chest'],
      isTemplate: false,
      createdAt: new Date(2026, 0, 23),
      updatedAt: new Date(2026, 0, 23)
    }
  ]);
  const [measurements, setMeasurements] = useState<Measurement[]>([]);

  const handleStartWorkout = () => {
    setIsLogging(true);
    setWorkoutMode('selection');
  };

  const handleSelectWorkoutMode = (mode: 'manual' | 'camera') => {
    setWorkoutMode(mode);
  };

  const handleSaveWorkout = (workout: WorkoutSession) => {
    setWorkoutHistory(prev => [workout, ...prev]);
    setIsLogging(false);
  };

  const handleCancelWorkout = () => {
    setIsLogging(false);
    setWorkoutMode('selection');
  };

  const handleAddMeasurement = (measurement: Omit<Measurement, 'id'>) => {
    const newMeasurement: Measurement = {
      ...measurement,
      id: `measurement_${Date.now()}`
    };
    setMeasurements(prev => [newMeasurement, ...prev]);
  };

  if (isLogging) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <Navigation />
        
        {workoutMode === 'selection' && (
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="text-center mb-8">
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
                Choose Your Workout Mode
              </h1>
              <p className="text-gray-600 dark:text-gray-400">
                Select how you'd like to track your workout today
              </p>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              {/* Manual Logging Mode */}
              <Card className="p-6 hover:shadow-lg transition-shadow cursor-pointer border-2 hover:border-blue-500"
                    onClick={() => handleSelectWorkoutMode('manual')}>
                <div className="text-center">
                  <div className="text-4xl mb-4">📝</div>
                  <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                    Manual Logging
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400 mb-4">
                    Track your sets, reps, and weights manually. Perfect for gym workouts with equipment.
                  </p>
                  <ul className="text-sm text-gray-500 dark:text-gray-400 space-y-1">
                    <li>• Log exercises, sets, and reps</li>
                    <li>• Track weights and rest times</li>
                    <li>• Build custom routines</li>
                    <li>• Works with any equipment</li>
                  </ul>
                </div>
              </Card>

              {/* AI Camera Mode */}
              <Card className="p-6 hover:shadow-lg transition-shadow cursor-pointer border-2 hover:border-green-500"
                    onClick={() => handleSelectWorkoutMode('camera')}>
                <div className="text-center">
                  <div className="text-4xl mb-4">📹</div>
                  <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                    AI Camera Trainer
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400 mb-4">
                    Use your camera for real-time form analysis and rep counting with AI coaching.
                  </p>
                  <ul className="text-sm text-gray-500 dark:text-gray-400 space-y-1">
                    <li>• Real-time pose detection</li>
                    <li>• Automatic rep counting</li>
                    <li>• Form feedback & scoring</li>
                    <li>• Voice coaching guidance</li>
                  </ul>
                </div>
              </Card>
            </div>

            <div className="text-center mt-8">
              <Button variant="secondary" onClick={handleCancelWorkout}>
                Cancel
              </Button>
            </div>
          </div>
        )}

        {workoutMode === 'manual' && (
          <WorkoutLogger
            onSave={handleSaveWorkout}
            onCancel={handleCancelWorkout}
          />
        )}

        {workoutMode === 'camera' && (
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="mb-6">
              <div className="flex items-center justify-between">
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                  AI Camera Trainer
                </h1>
                <Button variant="secondary" onClick={handleCancelWorkout}>
                  End Session
                </Button>
              </div>
              <p className="text-gray-600 dark:text-gray-400 mt-2">
                Position yourself in front of the camera and start exercising. The AI will track your form and count reps automatically.
              </p>
            </div>
            
            <CameraWorkoutInterface onCancel={handleCancelWorkout} />
          </div>
        )}
      </div>
    );
  }

  const tabs = [
    { id: 'calendar' as const, name: 'Calendar', icon: '📅' },
    { id: 'routines' as const, name: 'Routines', icon: '📝' },
    { id: 'programs' as const, name: 'Programs', icon: '📋' },
    { id: 'statistics' as const, name: 'Statistics', icon: '📊' },
    { id: 'measurements' as const, name: 'Measurements', icon: '📏' }
  ];

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <Navigation />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Tab Navigation */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex space-x-1 bg-gray-100 dark:bg-gray-800 rounded-lg p-1">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`
                  flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all
                  ${activeTab === tab.id
                    ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm'
                    : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                  }
                `}
              >
                <span>{tab.icon}</span>
                <span className="hidden sm:inline">{tab.name}</span>
              </button>
            ))}
          </div>

          {/* Quick Start Workout Button */}
          <Button variant="primary" onClick={handleStartWorkout}>
            <span className="mr-2">🚀</span>
            <span>Start Workout</span>
          </Button>
        </div>

        {/* Tab Content */}
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          {activeTab === 'calendar' && (
            <WorkoutCalendar
              workouts={workoutHistory}
              onDateSelect={setSelectedDate}
              selectedDate={selectedDate}
            />
          )}

          {activeTab === 'routines' && (
            <WorkoutRoutines
              onStartRoutine={(routine) => {
                console.log('Starting routine:', routine);
                handleStartWorkout();
              }}
            />
          )}

          {activeTab === 'programs' && (
            <WorkoutPrograms
              onSelectProgram={(program: WorkoutProgram) => {
                console.log('Selected program:', program);
                // Handle program selection
              }}
            />
          )}

          {activeTab === 'statistics' && (
            <WorkoutStats
              workouts={workoutHistory}
              selectedDate={selectedDate}
            />
          )}

          {activeTab === 'measurements' && (
            <MeasurementsTracker
              measurements={measurements}
              onAddMeasurement={handleAddMeasurement}
            />
          )}
        </motion.div>
      </div>
    </div>
  );
}
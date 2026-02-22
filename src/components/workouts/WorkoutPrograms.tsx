'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';

interface WorkoutProgram {
  id: string;
  name: string;
  description: string;
  level: 'Beginner' | 'Intermediate' | 'Advanced';
  goal: 'Strength' | 'Muscle Building' | 'Fat Loss' | 'Endurance' | 'General Fitness';
  equipment: 'Gym Equipment' | 'Dumbbells Only' | 'Bodyweight' | 'At Home' | 'Travel';
  duration: string;
  routinesCount: number;
  image: string;
  tags: string[];
}

interface WorkoutProgramsProps {
  onSelectProgram: (program: WorkoutProgram) => void;
}

const samplePrograms: WorkoutProgram[] = [
  {
    id: 'push-pull-legs-beginner',
    name: 'Beginner Push/Pull/Legs',
    description: 'Perfect starter program for building strength and muscle',
    level: 'Beginner',
    goal: 'Muscle Building',
    equipment: 'Gym Equipment',
    duration: '12 weeks',
    routinesCount: 3,
    image: 'PUSH\nPULL\nLEGS',
    tags: ['Popular', 'Beginner-Friendly']
  },
  {
    id: 'full-body-intermediate',
    name: 'Intermediate Full-Body',
    description: 'Comprehensive full-body workouts for intermediate lifters',
    level: 'Intermediate',
    goal: 'General Fitness',
    equipment: 'Gym Equipment',
    duration: '8 weeks',
    routinesCount: 3,
    image: 'FULL\nBODY',
    tags: ['Time-Efficient', 'Balanced']
  },
  {
    id: 'push-pull-legs-intermediate',
    name: 'Intermediate Push/Pull/Legs',
    description: 'Advanced push/pull/legs split for experienced lifters',
    level: 'Intermediate',
    goal: 'Strength',
    equipment: 'Gym Equipment',
    duration: '16 weeks',
    routinesCount: 3,
    image: 'PUSH\nPULL\nLEGS',
    tags: ['Proven', 'Muscle Building']
  }
];

const routineCategories = [
  { id: 'at-home', name: 'At home', icon: '🏠' },
  { id: 'travel', name: 'Travel', icon: '🧳' },
  { id: 'dumbbells', name: 'Dumbbells Only', icon: '🏋️' },
  { id: 'band', name: 'Band', icon: '🔵' },
  { id: 'cardio', name: 'Cardio & HIIT', icon: '💨' },
  { id: 'gym', name: 'Gym', icon: '🏢' },
  { id: 'bodyweight', name: 'Bodyweight', icon: '🤸' },
  { id: 'suspension', name: 'Suspension Band', icon: '⚫' }
];

export function WorkoutPrograms({ onSelectProgram }: WorkoutProgramsProps) {
  const [selectedFilters, setSelectedFilters] = useState({
    level: 'All',
    goal: 'All',
    equipment: 'All'
  });

  const [showAllPrograms, setShowAllPrograms] = useState(false);

  const filteredPrograms = samplePrograms.filter(program => {
    return (
      (selectedFilters.level === 'All' || program.level === selectedFilters.level) &&
      (selectedFilters.goal === 'All' || program.goal === selectedFilters.goal) &&
      (selectedFilters.equipment === 'All' || program.equipment === selectedFilters.equipment)
    );
  });

  const displayedPrograms = showAllPrograms ? filteredPrograms : filteredPrograms.slice(0, 3);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-gray-900 dark:text-white">
          Explore
        </h2>
      </div>

      {/* Featured Programs */}
      <div className="space-y-4">
        {displayedPrograms.map((program, index) => (
          <motion.div
            key={program.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
          >
            <Card className="p-0 overflow-hidden hover:shadow-lg transition-shadow cursor-pointer">
              <div className="flex">
                {/* Program Image/Icon */}
                <div className="w-24 h-24 bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white font-bold text-xs leading-tight">
                  {program.image.split('\n').map((line, i) => (
                    <div key={i}>{line}</div>
                  ))}
                </div>
                
                {/* Program Info */}
                <div className="flex-1 p-4">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <h3 className="font-semibold text-gray-900 dark:text-white">
                        {program.name}
                      </h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        ({program.equipment})
                      </p>
                    </div>
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => onSelectProgram(program)}
                    >
                      →
                    </Button>
                  </div>
                  
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                    {program.routinesCount} routines
                  </p>
                  
                  <div className="flex flex-wrap gap-1">
                    {program.tags.map(tag => (
                      <span
                        key={tag}
                        className="px-2 py-1 bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-400 text-xs rounded-full"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Show All Programs Button */}
      {!showAllPrograms && filteredPrograms.length > 3 && (
        <Button
          variant="secondary"
          onClick={() => setShowAllPrograms(true)}
          className="w-full"
        >
          Show all {filteredPrograms.length} programs
        </Button>
      )}

      {/* Filters */}
      {showAllPrograms && (
        <Card className="p-4">
          <div className="flex items-center gap-4 mb-4">
            <Button variant="secondary" size="sm">
              🔧 Filters
            </Button>
            
            <select
              value={selectedFilters.level}
              onChange={(e) => setSelectedFilters(prev => ({ ...prev, level: e.target.value }))}
              className="px-3 py-1 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-sm"
            >
              <option value="All">Level ▼</option>
              <option value="Beginner">Beginner</option>
              <option value="Intermediate">Intermediate</option>
              <option value="Advanced">Advanced</option>
            </select>
            
            <select
              value={selectedFilters.goal}
              onChange={(e) => setSelectedFilters(prev => ({ ...prev, goal: e.target.value }))}
              className="px-3 py-1 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-sm"
            >
              <option value="All">Goal ▼</option>
              <option value="Strength">Strength</option>
              <option value="Muscle Building">Muscle Building</option>
              <option value="Fat Loss">Fat Loss</option>
              <option value="Endurance">Endurance</option>
              <option value="General Fitness">General Fitness</option>
            </select>
            
            <select
              value={selectedFilters.equipment}
              onChange={(e) => setSelectedFilters(prev => ({ ...prev, equipment: e.target.value }))}
              className="px-3 py-1 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-sm"
            >
              <option value="All">Equipment ▼</option>
              <option value="Gym Equipment">Gym Equipment</option>
              <option value="Dumbbells Only">Dumbbells Only</option>
              <option value="Bodyweight">Bodyweight</option>
              <option value="At Home">At Home</option>
              <option value="Travel">Travel</option>
            </select>
          </div>
        </Card>
      )}

      {/* Routines Categories */}
      <div>
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Routines
        </h3>
        
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {routineCategories.map((category) => (
            <Card
              key={category.id}
              className="p-4 text-center hover:shadow-md transition-shadow cursor-pointer"
            >
              <div className="text-2xl mb-2">{category.icon}</div>
              <div className="font-medium text-gray-900 dark:text-white text-sm">
                {category.name}
              </div>
            </Card>
          ))}
        </div>
      </div>

      {/* Quick Start Options */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Quick Start
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Button variant="primary" className="h-12">
            🏋️‍♂️ Start Empty Workout
          </Button>
          <Button variant="secondary" className="h-12">
            📋 Use Template
          </Button>
        </div>
      </Card>

      {/* Program Details Modal would go here */}
    </div>
  );
}
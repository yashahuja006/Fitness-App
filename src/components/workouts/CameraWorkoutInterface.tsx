'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { RealPoseTrainer } from '@/components/pose/RealPoseTrainer';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';

interface CameraWorkoutInterfaceProps {
  readonly onCancel: () => void;
}

interface Exercise {
  id: string;
  name: string;
  description: string;
  icon: string;
  instructions: string[];
  targetMuscles: string[];
  difficulty: 'Beginner' | 'Intermediate' | 'Advanced';
  equipment: 'None' | 'Bodyweight' | 'Dumbbells' | 'Barbell' | 'Machine';
  hasAISupport: boolean;
}

interface MuscleGroup {
  id: string;
  name: string;
  icon: string;
  exercises: Exercise[];
}

const EXERCISE_DATABASE: MuscleGroup[] = [
  {
    id: 'chest',
    name: 'Chest',
    icon: '💪',
    exercises: [
      {
        id: 'push-ups',
        name: 'Push-ups',
        description: 'Classic bodyweight chest exercise',
        icon: '💪',
        instructions: [
          'Start in plank position with hands shoulder-width apart',
          'Lower your body until chest nearly touches the ground',
          'Push back up to starting position',
          'Keep your body straight throughout the movement'
        ],
        targetMuscles: ['Chest', 'Shoulders', 'Triceps', 'Core'],
        difficulty: 'Beginner',
        equipment: 'None',
        hasAISupport: true
      },
      {
        id: 'incline-push-ups',
        name: 'Incline Push-ups',
        description: 'Easier variation with hands elevated',
        icon: '📐',
        instructions: [
          'Place hands on elevated surface (bench, step)',
          'Lower body toward the surface',
          'Push back up to starting position',
          'Great for beginners building strength'
        ],
        targetMuscles: ['Chest', 'Shoulders', 'Triceps'],
        difficulty: 'Beginner',
        equipment: 'None',
        hasAISupport: false
      },
      {
        id: 'decline-push-ups',
        name: 'Decline Push-ups',
        description: 'Advanced variation with feet elevated',
        icon: '⬇️',
        instructions: [
          'Place feet on elevated surface',
          'Hands on ground in push-up position',
          'Lower chest toward ground',
          'Push back up with control'
        ],
        targetMuscles: ['Upper Chest', 'Shoulders', 'Triceps'],
        difficulty: 'Advanced',
        equipment: 'None',
        hasAISupport: false
      },
      {
        id: 'wide-push-ups',
        name: 'Wide Push-ups',
        description: 'Targets outer chest muscles',
        icon: '↔️',
        instructions: [
          'Place hands wider than shoulder-width',
          'Lower body keeping elbows out',
          'Push back up focusing on chest squeeze',
          'Maintain straight body line'
        ],
        targetMuscles: ['Outer Chest', 'Shoulders'],
        difficulty: 'Intermediate',
        equipment: 'None',
        hasAISupport: false
      },
      {
        id: 'diamond-push-ups',
        name: 'Diamond Push-ups',
        description: 'Close-grip variation for triceps',
        icon: '💎',
        instructions: [
          'Form diamond shape with hands',
          'Lower body keeping elbows close',
          'Push up focusing on triceps',
          'Advanced chest and tricep exercise'
        ],
        targetMuscles: ['Inner Chest', 'Triceps'],
        difficulty: 'Advanced',
        equipment: 'None',
        hasAISupport: false
      },
      {
        id: 'archer-push-ups',
        name: 'Archer Push-ups',
        description: 'Unilateral strength builder',
        icon: '🏹',
        instructions: [
          'Start in wide push-up position',
          'Lower to one side, other arm straight',
          'Push back to center',
          'Alternate sides each rep'
        ],
        targetMuscles: ['Chest', 'Shoulders', 'Core'],
        difficulty: 'Advanced',
        equipment: 'None',
        hasAISupport: false
      },
      {
        id: 'bench-press',
        name: 'Bench Press',
        description: 'Classic barbell chest exercise',
        icon: '🏋️',
        instructions: [
          'Lie on bench with feet flat on floor',
          'Grip barbell slightly wider than shoulders',
          'Lower bar to chest with control',
          'Press up to full arm extension'
        ],
        targetMuscles: ['Chest', 'Shoulders', 'Triceps'],
        difficulty: 'Intermediate',
        equipment: 'Barbell',
        hasAISupport: false
      },
      {
        id: 'dumbbell-flyes',
        name: 'Dumbbell Flyes',
        description: 'Isolation exercise for chest',
        icon: '🦅',
        instructions: [
          'Lie on bench holding dumbbells',
          'Lower weights in wide arc',
          'Feel stretch in chest',
          'Bring weights together above chest'
        ],
        targetMuscles: ['Chest'],
        difficulty: 'Intermediate',
        equipment: 'Dumbbells',
        hasAISupport: false
      },
      {
        id: 'dips',
        name: 'Dips',
        description: 'Bodyweight chest and tricep exercise',
        icon: '⬇️',
        instructions: [
          'Support body on parallel bars',
          'Lower body by bending elbows',
          'Lean slightly forward for chest',
          'Push back up to starting position'
        ],
        targetMuscles: ['Lower Chest', 'Triceps', 'Shoulders'],
        difficulty: 'Intermediate',
        equipment: 'None',
        hasAISupport: false
      }
    ]
  },
  {
    id: 'legs',
    name: 'Legs',
    icon: '🦵',
    exercises: [
      {
        id: 'squats',
        name: 'Squats',
        description: 'Fundamental lower body exercise',
        icon: '🦵',
        instructions: [
          'Stand with feet shoulder-width apart',
          'Lower your body by bending knees and hips',
          'Go down until thighs are parallel to ground',
          'Push through heels to return to standing'
        ],
        targetMuscles: ['Quadriceps', 'Glutes', 'Hamstrings', 'Calves'],
        difficulty: 'Beginner',
        equipment: 'None',
        hasAISupport: true
      },
      {
        id: 'jump-squats',
        name: 'Jump Squats',
        description: 'Explosive squat variation',
        icon: '🚀',
        instructions: [
          'Start in squat position',
          'Lower into squat',
          'Explode up jumping as high as possible',
          'Land softly and repeat'
        ],
        targetMuscles: ['Quadriceps', 'Glutes', 'Calves'],
        difficulty: 'Intermediate',
        equipment: 'None',
        hasAISupport: false
      },
      {
        id: 'lunges',
        name: 'Lunges',
        description: 'Unilateral leg strengthener',
        icon: '🚶',
        instructions: [
          'Step forward into lunge position',
          'Lower back knee toward ground',
          'Push back to starting position',
          'Alternate legs or complete one side'
        ],
        targetMuscles: ['Quadriceps', 'Glutes', 'Hamstrings'],
        difficulty: 'Beginner',
        equipment: 'None',
        hasAISupport: false
      },
      {
        id: 'bulgarian-split-squats',
        name: 'Bulgarian Split Squats',
        description: 'Single-leg squat variation',
        icon: '🇧🇬',
        instructions: [
          'Place rear foot on elevated surface',
          'Lower into single-leg squat',
          'Keep front knee over ankle',
          'Push up through front heel'
        ],
        targetMuscles: ['Quadriceps', 'Glutes', 'Hamstrings'],
        difficulty: 'Intermediate',
        equipment: 'None',
        hasAISupport: false
      },
      {
        id: 'wall-sits',
        name: 'Wall Sits',
        description: 'Isometric quad strengthener',
        icon: '🧱',
        instructions: [
          'Lean back against wall',
          'Slide down until thighs parallel to floor',
          'Hold position maintaining 90-degree angle',
          'Keep back flat against wall'
        ],
        targetMuscles: ['Quadriceps', 'Glutes'],
        difficulty: 'Beginner',
        equipment: 'None',
        hasAISupport: false
      },
      {
        id: 'calf-raises',
        name: 'Calf Raises',
        description: 'Targets calf muscles',
        icon: '👠',
        instructions: [
          'Stand with feet hip-width apart',
          'Rise up onto balls of feet',
          'Hold briefly at top',
          'Lower with control'
        ],
        targetMuscles: ['Calves'],
        difficulty: 'Beginner',
        equipment: 'None',
        hasAISupport: false
      },
      {
        id: 'single-leg-deadlifts',
        name: 'Single-leg Deadlifts',
        description: 'Balance and hamstring exercise',
        icon: '🦩',
        instructions: [
          'Stand on one leg',
          'Hinge at hip lowering torso',
          'Extend free leg behind you',
          'Return to standing position'
        ],
        targetMuscles: ['Hamstrings', 'Glutes', 'Core'],
        difficulty: 'Intermediate',
        equipment: 'None',
        hasAISupport: false
      },
      {
        id: 'step-ups',
        name: 'Step-ups',
        description: 'Functional leg exercise',
        icon: '📦',
        instructions: [
          'Step up onto elevated surface',
          'Drive through heel of stepping leg',
          'Step down with control',
          'Alternate legs or complete one side'
        ],
        targetMuscles: ['Quadriceps', 'Glutes', 'Calves'],
        difficulty: 'Beginner',
        equipment: 'None',
        hasAISupport: false
      }
    ]
  },
  {
    id: 'arms',
    name: 'Arms',
    icon: '💪',
    exercises: [
      {
        id: 'bicep-curls',
        name: 'Bicep Curls',
        description: 'Isolated arm exercise for biceps',
        icon: '💪',
        instructions: [
          'Stand with arms at your sides',
          'Keep elbows close to your body',
          'Curl your hands up towards shoulders',
          'Lower back down with control'
        ],
        targetMuscles: ['Biceps', 'Forearms'],
        difficulty: 'Beginner',
        equipment: 'Dumbbells',
        hasAISupport: true
      },
      {
        id: 'hammer-curls',
        name: 'Hammer Curls',
        description: 'Neutral grip bicep exercise',
        icon: '🔨',
        instructions: [
          'Hold dumbbells with neutral grip',
          'Keep elbows at sides',
          'Curl weights up maintaining grip',
          'Lower with control'
        ],
        targetMuscles: ['Biceps', 'Forearms'],
        difficulty: 'Beginner',
        equipment: 'Dumbbells',
        hasAISupport: false
      },
      {
        id: 'tricep-dips',
        name: 'Tricep Dips',
        description: 'Bodyweight tricep exercise',
        icon: '⬇️',
        instructions: [
          'Sit on edge of chair or bench',
          'Place hands beside hips',
          'Lower body by bending elbows',
          'Push back up to starting position'
        ],
        targetMuscles: ['Triceps', 'Shoulders'],
        difficulty: 'Beginner',
        equipment: 'None',
        hasAISupport: false
      },
      {
        id: 'overhead-press',
        name: 'Overhead Press',
        description: 'Shoulder and tricep builder',
        icon: '⬆️',
        instructions: [
          'Hold weights at shoulder height',
          'Press weights overhead',
          'Lower with control',
          'Keep core engaged throughout'
        ],
        targetMuscles: ['Shoulders', 'Triceps', 'Core'],
        difficulty: 'Intermediate',
        equipment: 'Dumbbells',
        hasAISupport: false
      },
      {
        id: 'close-grip-push-ups',
        name: 'Close-grip Push-ups',
        description: 'Tricep-focused push-up variation',
        icon: '🤏',
        instructions: [
          'Place hands close together',
          'Lower body keeping elbows close',
          'Push up focusing on triceps',
          'Maintain straight body line'
        ],
        targetMuscles: ['Triceps', 'Chest'],
        difficulty: 'Intermediate',
        equipment: 'None',
        hasAISupport: false
      },
      {
        id: 'pike-push-ups',
        name: 'Pike Push-ups',
        description: 'Shoulder-focused bodyweight exercise',
        icon: '📐',
        instructions: [
          'Start in downward dog position',
          'Lower head toward ground',
          'Push back up to starting position',
          'Keep hips high throughout'
        ],
        targetMuscles: ['Shoulders', 'Triceps'],
        difficulty: 'Intermediate',
        equipment: 'None',
        hasAISupport: false
      }
    ]
  },
  {
    id: 'back',
    name: 'Back',
    icon: '🔙',
    exercises: [
      {
        id: 'pull-ups',
        name: 'Pull-ups',
        description: 'Classic back and bicep exercise',
        icon: '⬆️',
        instructions: [
          'Hang from pull-up bar with overhand grip',
          'Pull body up until chin over bar',
          'Lower with control',
          'Keep core engaged'
        ],
        targetMuscles: ['Lats', 'Biceps', 'Rhomboids'],
        difficulty: 'Advanced',
        equipment: 'None',
        hasAISupport: false
      },
      {
        id: 'chin-ups',
        name: 'Chin-ups',
        description: 'Underhand grip pull-up variation',
        icon: '⬆️',
        instructions: [
          'Hang from bar with underhand grip',
          'Pull up until chin over bar',
          'Lower with control',
          'Engages more biceps than pull-ups'
        ],
        targetMuscles: ['Lats', 'Biceps', 'Rhomboids'],
        difficulty: 'Advanced',
        equipment: 'None',
        hasAISupport: false
      },
      {
        id: 'inverted-rows',
        name: 'Inverted Rows',
        description: 'Horizontal pulling exercise',
        icon: '↔️',
        instructions: [
          'Lie under bar or table',
          'Pull chest up to bar',
          'Lower with control',
          'Keep body straight'
        ],
        targetMuscles: ['Lats', 'Rhomboids', 'Biceps'],
        difficulty: 'Intermediate',
        equipment: 'None',
        hasAISupport: false
      },
      {
        id: 'superman',
        name: 'Superman',
        description: 'Lower back strengthener',
        icon: '🦸',
        instructions: [
          'Lie face down on floor',
          'Lift chest and legs off ground',
          'Hold briefly at top',
          'Lower with control'
        ],
        targetMuscles: ['Lower Back', 'Glutes'],
        difficulty: 'Beginner',
        equipment: 'None',
        hasAISupport: false
      },
      {
        id: 'bent-over-rows',
        name: 'Bent-over Rows',
        description: 'Dumbbell back exercise',
        icon: '🚣',
        instructions: [
          'Bend over holding dumbbells',
          'Pull weights to lower chest',
          'Squeeze shoulder blades together',
          'Lower with control'
        ],
        targetMuscles: ['Lats', 'Rhomboids', 'Biceps'],
        difficulty: 'Intermediate',
        equipment: 'Dumbbells',
        hasAISupport: false
      }
    ]
  },
  {
    id: 'core',
    name: 'Core',
    icon: '🎯',
    exercises: [
      {
        id: 'plank',
        name: 'Plank',
        description: 'Isometric core strengthener',
        icon: '📏',
        instructions: [
          'Start in push-up position',
          'Hold body straight from head to heels',
          'Keep core engaged',
          'Breathe normally while holding'
        ],
        targetMuscles: ['Core', 'Shoulders'],
        difficulty: 'Beginner',
        equipment: 'None',
        hasAISupport: false
      },
      {
        id: 'crunches',
        name: 'Crunches',
        description: 'Classic abdominal exercise',
        icon: '🔄',
        instructions: [
          'Lie on back with knees bent',
          'Lift shoulders off ground',
          'Contract abs at top',
          'Lower with control'
        ],
        targetMuscles: ['Abs'],
        difficulty: 'Beginner',
        equipment: 'None',
        hasAISupport: false
      },
      {
        id: 'bicycle-crunches',
        name: 'Bicycle Crunches',
        description: 'Dynamic ab exercise',
        icon: '🚴',
        instructions: [
          'Lie on back with hands behind head',
          'Bring opposite elbow to knee',
          'Alternate sides in cycling motion',
          'Keep core engaged throughout'
        ],
        targetMuscles: ['Abs', 'Obliques'],
        difficulty: 'Intermediate',
        equipment: 'None',
        hasAISupport: false
      },
      {
        id: 'russian-twists',
        name: 'Russian Twists',
        description: 'Oblique strengthener',
        icon: '🌪️',
        instructions: [
          'Sit with knees bent, lean back slightly',
          'Rotate torso side to side',
          'Keep feet off ground for challenge',
          'Control the movement'
        ],
        targetMuscles: ['Obliques', 'Core'],
        difficulty: 'Intermediate',
        equipment: 'None',
        hasAISupport: false
      },
      {
        id: 'leg-raises',
        name: 'Leg Raises',
        description: 'Lower ab exercise',
        icon: '🦵',
        instructions: [
          'Lie on back with legs straight',
          'Lift legs to 90 degrees',
          'Lower with control',
          'Keep lower back pressed to floor'
        ],
        targetMuscles: ['Lower Abs', 'Hip Flexors'],
        difficulty: 'Intermediate',
        equipment: 'None',
        hasAISupport: false
      },
      {
        id: 'mountain-climbers',
        name: 'Mountain Climbers',
        description: 'Dynamic core and cardio exercise',
        icon: '⛰️',
        instructions: [
          'Start in plank position',
          'Alternate bringing knees to chest',
          'Keep hips level',
          'Maintain fast pace'
        ],
        targetMuscles: ['Core', 'Shoulders', 'Legs'],
        difficulty: 'Intermediate',
        equipment: 'None',
        hasAISupport: false
      },
      {
        id: 'dead-bug',
        name: 'Dead Bug',
        description: 'Core stability exercise',
        icon: '🪲',
        instructions: [
          'Lie on back with arms up and knees bent',
          'Lower opposite arm and leg',
          'Return to starting position',
          'Alternate sides'
        ],
        targetMuscles: ['Core', 'Hip Flexors'],
        difficulty: 'Beginner',
        equipment: 'None',
        hasAISupport: false
      },
      {
        id: 'side-plank',
        name: 'Side Plank',
        description: 'Lateral core strengthener',
        icon: '📐',
        instructions: [
          'Lie on side supporting body on forearm',
          'Lift hips creating straight line',
          'Hold position',
          'Switch sides'
        ],
        targetMuscles: ['Obliques', 'Core'],
        difficulty: 'Intermediate',
        equipment: 'None',
        hasAISupport: false
      }
    ]
  },
  {
    id: 'shoulders',
    name: 'Shoulders',
    icon: '🤷',
    exercises: [
      {
        id: 'shoulder-press',
        name: 'Shoulder Press',
        description: 'Overhead pressing movement',
        icon: '⬆️',
        instructions: [
          'Hold weights at shoulder height',
          'Press overhead until arms straight',
          'Lower with control',
          'Keep core engaged'
        ],
        targetMuscles: ['Shoulders', 'Triceps'],
        difficulty: 'Intermediate',
        equipment: 'Dumbbells',
        hasAISupport: false
      },
      {
        id: 'lateral-raises',
        name: 'Lateral Raises',
        description: 'Side deltoid isolation',
        icon: '↔️',
        instructions: [
          'Hold weights at sides',
          'Lift arms out to sides',
          'Raise to shoulder height',
          'Lower with control'
        ],
        targetMuscles: ['Side Delts'],
        difficulty: 'Beginner',
        equipment: 'Dumbbells',
        hasAISupport: false
      },
      {
        id: 'front-raises',
        name: 'Front Raises',
        description: 'Front deltoid isolation',
        icon: '⬆️',
        instructions: [
          'Hold weights in front of thighs',
          'Lift arms forward to shoulder height',
          'Lower with control',
          'Keep slight bend in elbows'
        ],
        targetMuscles: ['Front Delts'],
        difficulty: 'Beginner',
        equipment: 'Dumbbells',
        hasAISupport: false
      },
      {
        id: 'rear-delt-flyes',
        name: 'Rear Delt Flyes',
        description: 'Rear deltoid isolation',
        icon: '🦅',
        instructions: [
          'Bend over holding weights',
          'Lift arms out to sides',
          'Squeeze shoulder blades',
          'Lower with control'
        ],
        targetMuscles: ['Rear Delts', 'Rhomboids'],
        difficulty: 'Intermediate',
        equipment: 'Dumbbells',
        hasAISupport: false
      },
      {
        id: 'upright-rows',
        name: 'Upright Rows',
        description: 'Compound shoulder exercise',
        icon: '⬆️',
        instructions: [
          'Hold weights in front of body',
          'Pull up along body to chest',
          'Lead with elbows',
          'Lower with control'
        ],
        targetMuscles: ['Shoulders', 'Traps'],
        difficulty: 'Intermediate',
        equipment: 'Dumbbells',
        hasAISupport: false
      },
      {
        id: 'handstand-push-ups',
        name: 'Handstand Push-ups',
        description: 'Advanced bodyweight shoulder exercise',
        icon: '🤸',
        instructions: [
          'Get into handstand position against wall',
          'Lower head toward ground',
          'Push back up to handstand',
          'Extremely advanced exercise'
        ],
        targetMuscles: ['Shoulders', 'Triceps', 'Core'],
        difficulty: 'Advanced',
        equipment: 'None',
        hasAISupport: false
      }
    ]
  }
];

export function CameraWorkoutInterface({ onCancel }: CameraWorkoutInterfaceProps) {
  const [selectedMuscleGroup, setSelectedMuscleGroup] = useState<string | null>(null);
  const [selectedExercise, setSelectedExercise] = useState<string | null>(null);
  const [showInstructions, setShowInstructions] = useState(false);

  const handleMuscleGroupSelect = (muscleGroupId: string) => {
    setSelectedMuscleGroup(muscleGroupId);
    setSelectedExercise(null);
    setShowInstructions(false);
  };

  const handleExerciseSelect = (exerciseId: string) => {
    setSelectedExercise(exerciseId);
    setShowInstructions(true);
  };

  const handleStartExercise = () => {
    setShowInstructions(false);
  };

  const handleBackToMuscleGroups = () => {
    setSelectedMuscleGroup(null);
    setSelectedExercise(null);
    setShowInstructions(false);
  };

  const handleBackToExercises = () => {
    setSelectedExercise(null);
    setShowInstructions(false);
  };

  const selectedMuscleGroupData = EXERCISE_DATABASE.find(mg => mg.id === selectedMuscleGroup);
  const selectedExerciseData = selectedMuscleGroupData?.exercises.find(ex => ex.id === selectedExercise);

  // Muscle Group Selection Screen
  if (!selectedMuscleGroup) {
    return (
      <div className="space-y-6">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
            Choose Muscle Group
          </h2>
          <p className="text-gray-600 dark:text-gray-400">
            Select a muscle group to see available exercises
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-4">
          {EXERCISE_DATABASE.map((muscleGroup) => (
            <Card 
              key={muscleGroup.id}
              className="p-6 hover:shadow-lg transition-all cursor-pointer border-2 hover:border-blue-500"
              onClick={() => handleMuscleGroupSelect(muscleGroup.id)}
            >
              <div className="text-center">
                <div className="text-4xl mb-3">{muscleGroup.icon}</div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                  {muscleGroup.name}
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {muscleGroup.exercises.length} exercises available
                </p>
                <div className="mt-2">
                  <span className="text-xs bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200 px-2 py-1 rounded-full">
                    {muscleGroup.exercises.filter(ex => ex.hasAISupport).length} with AI support
                  </span>
                </div>
              </div>
            </Card>
          ))}
        </div>

        <div className="text-center">
          <Button variant="secondary" onClick={onCancel}>
            Back to Workouts
          </Button>
        </div>
      </div>
    );
  }

  // Exercise Selection Screen
  if (selectedMuscleGroup && !selectedExercise) {
    return (
      <div className="space-y-6">
        <div className="text-center">
          <div className="text-4xl mb-2">{selectedMuscleGroupData?.icon}</div>
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
            {selectedMuscleGroupData?.name} Exercises
          </h2>
          <p className="text-gray-600 dark:text-gray-400">
            Choose an exercise to start your workout
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {selectedMuscleGroupData?.exercises.map((exercise) => (
            <Card 
              key={exercise.id}
              className={`p-4 hover:shadow-lg transition-all cursor-pointer border-2 ${
                exercise.hasAISupport 
                  ? 'hover:border-green-500 bg-green-50 dark:bg-green-900/10' 
                  : 'hover:border-blue-500'
              }`}
              onClick={() => handleExerciseSelect(exercise.id)}
            >
              <div className="text-center">
                <div className="flex items-center justify-center gap-2 mb-2">
                  <span className="text-2xl">{exercise.icon}</span>
                  {exercise.hasAISupport && (
                    <span className="text-xs bg-green-500 text-white px-2 py-1 rounded-full">
                      AI
                    </span>
                  )}
                </div>
                <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-1">
                  {exercise.name}
                </h3>
                <p className="text-xs text-gray-600 dark:text-gray-400 mb-2">
                  {exercise.description}
                </p>
                <div className="flex flex-wrap gap-1 justify-center mb-2">
                  <span className={`text-xs px-2 py-1 rounded-full ${
                    exercise.difficulty === 'Beginner' ? 'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200' :
                    exercise.difficulty === 'Intermediate' ? 'bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200' :
                    'bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200'
                  }`}>
                    {exercise.difficulty}
                  </span>
                  <span className="text-xs bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-200 px-2 py-1 rounded-full">
                    {exercise.equipment}
                  </span>
                </div>
                <div className="flex flex-wrap gap-1 justify-center">
                  {exercise.targetMuscles.slice(0, 2).map((muscle) => (
                    <span 
                      key={muscle}
                      className="text-xs bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 px-1 py-0.5 rounded"
                    >
                      {muscle}
                    </span>
                  ))}
                  {exercise.targetMuscles.length > 2 && (
                    <span className="text-xs text-gray-500">
                      +{exercise.targetMuscles.length - 2}
                    </span>
                  )}
                </div>
              </div>
            </Card>
          ))}
        </div>

        <div className="text-center">
          <Button variant="secondary" onClick={handleBackToMuscleGroups}>
            Back to Muscle Groups
          </Button>
        </div>
      </div>
    );
  }

  // Exercise Instructions Screen
  if (showInstructions && selectedExerciseData) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-2xl mx-auto space-y-6"
      >
        <div className="text-center">
          <div className="flex items-center justify-center gap-3 mb-4">
            <span className="text-6xl">{selectedExerciseData.icon}</span>
            {selectedExerciseData.hasAISupport && (
              <span className="bg-green-500 text-white px-3 py-1 rounded-full text-sm font-medium">
                AI Supported
              </span>
            )}
          </div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
            {selectedExerciseData.name}
          </h2>
          <p className="text-gray-600 dark:text-gray-400">
            {selectedExerciseData.description}
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-4">
          <Card className="p-4">
            <h3 className="font-semibold text-gray-900 dark:text-white mb-2">
              Exercise Details
            </h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-400">Difficulty:</span>
                <span className={`font-medium ${
                  selectedExerciseData.difficulty === 'Beginner' ? 'text-green-600' :
                  selectedExerciseData.difficulty === 'Intermediate' ? 'text-yellow-600' :
                  'text-red-600'
                }`}>
                  {selectedExerciseData.difficulty}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-400">Equipment:</span>
                <span className="font-medium">{selectedExerciseData.equipment}</span>
              </div>
              <div>
                <span className="text-gray-600 dark:text-gray-400">Target Muscles:</span>
                <div className="flex flex-wrap gap-1 mt-1">
                  {selectedExerciseData.targetMuscles.map((muscle) => (
                    <span 
                      key={muscle}
                      className="text-xs bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 px-2 py-1 rounded-full"
                    >
                      {muscle}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </Card>

          <Card className="p-4">
            <h3 className="font-semibold text-gray-900 dark:text-white mb-2">
              How to Perform:
            </h3>
            <ol className="space-y-1 text-sm">
              {selectedExerciseData.instructions.map((instruction, index) => (
                <li key={`${selectedExerciseData.id}-instruction-${index}`} className="flex items-start gap-2">
                  <span className="flex-shrink-0 w-5 h-5 bg-blue-500 text-white text-xs rounded-full flex items-center justify-center">
                    {index + 1}
                  </span>
                  <span className="text-gray-700 dark:text-gray-300">{instruction}</span>
                </li>
              ))}
            </ol>
          </Card>
        </div>

        {selectedExerciseData.hasAISupport && (
          <Card className="p-4 bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800">
            <h3 className="font-semibold text-green-900 dark:text-green-100 mb-2">
              🤖 AI Features Active:
            </h3>
            <ul className="space-y-1 text-sm text-green-800 dark:text-green-200">
              <li>• Real-time pose detection and form analysis</li>
              <li>• Automatic rep counting with accuracy scoring</li>
              <li>• Voice coaching and feedback</li>
              <li>• Form correction suggestions</li>
            </ul>
          </Card>
        )}

        {!selectedExerciseData.hasAISupport && (
          <Card className="p-4 bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800">
            <h3 className="font-semibold text-yellow-900 dark:text-yellow-100 mb-2">
              ℹ️ Manual Exercise:
            </h3>
            <p className="text-sm text-yellow-800 dark:text-yellow-200">
              This exercise doesn't have AI pose detection yet. You can still track it manually or use it as a reference guide.
            </p>
          </Card>
        )}

        <div className="flex gap-4 justify-center">
          <Button variant="secondary" onClick={handleBackToExercises}>
            Back to Exercises
          </Button>
          {selectedExerciseData.hasAISupport ? (
            <Button variant="primary" onClick={handleStartExercise}>
              Start AI Training
            </Button>
          ) : (
            <Button variant="primary" onClick={handleBackToExercises}>
              Choose AI-Supported Exercise
            </Button>
          )}
        </div>
      </motion.div>
    );
  }

  // Active Exercise Screen (only for AI-supported exercises)
  if (selectedExerciseData?.hasAISupport) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-2xl">{selectedExerciseData?.icon}</span>
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                {selectedExerciseData?.name}
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                AI tracking active
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button variant="secondary" size="sm" onClick={handleBackToExercises}>
              Change Exercise
            </Button>
          </div>
        </div>

        <RealPoseTrainer 
          className="w-full"
          exerciseId={selectedExercise!}
          showControls={true}
        />
      </div>
    );
  }

  return null;
}
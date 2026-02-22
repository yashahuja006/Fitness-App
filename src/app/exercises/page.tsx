'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Exercise } from '@/types/exercise';
import { ExerciseSearchPage } from '@/components/exercises/ExerciseSearchPage';
import { ExerciseDetailModal } from '@/components/exercises/ExerciseDetailModal';
import { Navigation } from '@/components/ui/Navigation';
import { ClientOnly } from '@/components/ui/ClientOnly';

export default function ExercisesPage() {
  const [selectedExercise, setSelectedExercise] = useState<Exercise | null>(null);
  const [particlePositions, setParticlePositions] = useState<Array<{
    x: number;
    y: number;
    left: number;
    top: number;
    duration: number;
    delay: number;
  }>>([]);

  // Generate minimal particle positions only on client side
  useEffect(() => {
    // Reduce timeout for faster initial load
    const timer = setTimeout(() => {
      // Use completely deterministic values to avoid any hydration issues
      const positions = Array.from({ length: 4 }, (_, i) => ({ // Reduced to 4 for faster rendering
        x: (i * 15) % 40 - 20, // Smaller, deterministic values
        y: (i * 12) % 40 - 20,
        left: 15 + (i * 20) % 70, // Keep particles away from edges
        top: 15 + (i * 25) % 70,
        duration: 3 + (i % 2), // Shorter durations
        delay: i * 0.5, // Reduced delay
      }));
      setParticlePositions(positions);
    }, 200); // Much shorter delay for faster visual feedback

    return () => clearTimeout(timer);
  }, []);

  const handleExerciseSelect = (exercise: Exercise) => {
    setSelectedExercise(exercise);
  };

  const handleCloseModal = () => {
    setSelectedExercise(null);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-800 relative overflow-hidden">
      {/* Animated Background Elements */}
      <div className="absolute inset-0 pointer-events-none">
        {/* Grid Pattern */}
        <div 
          className="absolute inset-0 opacity-10"
          style={{
            backgroundImage: `
              linear-gradient(rgba(0, 255, 255, 0.1) 1px, transparent 1px),
              linear-gradient(90deg, rgba(0, 255, 255, 0.1) 1px, transparent 1px)
            `,
            backgroundSize: '50px 50px',
          }}
        />
        
        {/* Floating Particles - Client-side only */}
        <ClientOnly>
          {particlePositions.map((particle, i) => (
            <motion.div
              key={`particle-${i}`}
              className="absolute w-1 h-1 bg-cyan-400 rounded-full"
              animate={{
                x: [0, particle.x],
                y: [0, particle.y],
                opacity: [0, 1, 0],
              }}
              transition={{
                duration: particle.duration,
                repeat: Infinity,
                delay: particle.delay,
              }}
              style={{
                left: `${particle.left}%`,
                top: `${particle.top}%`,
              }}
            />
          ))}
        </ClientOnly>
      </div>

      <Navigation />
      <ExerciseSearchPage onExerciseSelect={handleExerciseSelect} />
      
      {selectedExercise && (
        <ExerciseDetailModal
          exercise={selectedExercise}
          isOpen={true}
          onClose={handleCloseModal}
        />
      )}
    </div>
  );
}
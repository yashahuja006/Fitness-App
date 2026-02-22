'use client';

import React, { useRef, useState, useEffect, Suspense } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Text, Box, Sphere, Cylinder } from '@react-three/drei';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import * as THREE from 'three';

interface Exercise3DAnimationProps {
  exerciseId: string;
  className?: string;
}

// Simplified but enhanced 3D Human Figure
function RealisticHumanFigure({ exerciseId, animationPhase }: { exerciseId: string; animationPhase: string }) {
  const groupRef = useRef<THREE.Group>(null);
  
  // Realistic exercise form animations
  const getAnimationValues = () => {
    const progress = animationPhase === 'down' ? 1 : animationPhase === 'up' ? 0.5 : 0;
    
    switch (exerciseId) {
      case 'push-ups':
        return {
          bodyY: THREE.MathUtils.lerp(0, -0.4, progress),
          // Push-up arms: start wide, bend inward as going down
          leftArmRotZ: THREE.MathUtils.lerp(-0.4, -0.1, progress), // Start wider, come closer
          rightArmRotZ: THREE.MathUtils.lerp(0.4, 0.1, progress), // Start wider, come closer
          leftArmRotX: THREE.MathUtils.lerp(0, 0.2, progress), // Slight forward lean
          rightArmRotX: THREE.MathUtils.lerp(0, 0.2, progress), // Slight forward lean
          // Forearms bend as elbows flex
          leftForearmRotZ: THREE.MathUtils.lerp(0, -0.6, progress), // Bend inward
          rightForearmRotZ: THREE.MathUtils.lerp(0, 0.6, progress), // Bend inward
          bodyScaleY: THREE.MathUtils.lerp(1, 0.95, progress),
          torsoRotX: THREE.MathUtils.lerp(0, 0.1, progress), // Slight forward lean
        };
      case 'squats':
        return {
          bodyY: THREE.MathUtils.lerp(0, -0.7, progress),
          legRotX: THREE.MathUtils.lerp(0, 1.0, progress), // Legs bend forward
          // Arms extend forward for balance during squat
          leftArmRotX: THREE.MathUtils.lerp(0, -0.6, progress), // Arms forward
          rightArmRotX: THREE.MathUtils.lerp(0, -0.6, progress), // Arms forward
          leftArmRotZ: THREE.MathUtils.lerp(-0.1, 0, progress), // Arms come together slightly
          rightArmRotZ: THREE.MathUtils.lerp(0.1, 0, progress), // Arms come together slightly
          // Forearms extend forward too
          leftForearmRotZ: THREE.MathUtils.lerp(0, -0.3, progress), // Extend forward
          rightForearmRotZ: THREE.MathUtils.lerp(0, 0.3, progress), // Extend forward
          torsoRotX: THREE.MathUtils.lerp(0, 0.15, progress), // Lean forward slightly
        };
      case 'bicep-curls':
        return {
          bodyY: 0,
          // Arms stay at sides for bicep curls - no outward movement
          leftArmRotZ: THREE.MathUtils.lerp(-0.05, -0.05, progress), // Keep at side
          rightArmRotZ: THREE.MathUtils.lerp(0.05, 0.05, progress), // Keep at side
          leftArmRotX: THREE.MathUtils.lerp(0, 0, progress), // No forward/back movement
          rightArmRotX: THREE.MathUtils.lerp(0, 0, progress), // No forward/back movement
          // Only forearms curl up - this is the main movement
          leftForearmRotZ: THREE.MathUtils.lerp(0, -1.6, progress), // Curl up
          rightForearmRotZ: THREE.MathUtils.lerp(0, 1.6, progress), // Curl up
        };
      default:
        return { bodyY: 0 };
    }
  };

  const anim = getAnimationValues();

  useFrame((state) => {
    if (groupRef.current) {
      // Subtle breathing
      const breathe = Math.sin(state.clock.getElapsedTime() * 2) * 0.01;
      groupRef.current.scale.y = 1 + breathe;
    }
  });

  return (
    <group ref={groupRef} position={[0, anim.bodyY || 0, 0]}>
      {/* Head */}
      <Sphere args={[0.22, 16, 16]} position={[0, 1.75, 0]}>
        <meshStandardMaterial color="#ffdbac" roughness={0.8} />
      </Sphere>
      
      {/* Hair */}
      <Sphere args={[0.23, 12, 12]} position={[0, 1.83, -0.05]}>
        <meshStandardMaterial color="#8B4513" roughness={0.9} />
      </Sphere>

      {/* Eyes */}
      <Sphere args={[0.025, 8, 8]} position={[-0.08, 1.8, 0.18]}>
        <meshStandardMaterial color="#333" />
      </Sphere>
      <Sphere args={[0.025, 8, 8]} position={[0.08, 1.8, 0.18]}>
        <meshStandardMaterial color="#333" />
      </Sphere>

      {/* Torso */}
      <group position={[0, 1, 0]} rotation={[anim.torsoRotX || 0, 0, 0]} scale={[1, anim.bodyScaleY || 1, 1]}>
        <Box args={[0.65, 0.9, 0.35]}>
          <meshStandardMaterial color="#4f46e5" roughness={0.7} />
        </Box>
        {/* Chest definition */}
        <Box args={[0.55, 0.25, 0.37]} position={[0, 0.2, 0]}>
          <meshStandardMaterial color="#3730a3" roughness={0.6} />
        </Box>
      </group>

      {/* Left Arm */}
      <group position={[-0.45, 1.3, 0]} rotation={[anim.leftArmRotX || 0, 0, anim.leftArmRotZ || -0.3]}>
        {/* Shoulder */}
        <Sphere args={[0.1, 12, 12]} position={[0, 0, 0]}>
          <meshStandardMaterial color="#ffdbac" roughness={0.8} />
        </Sphere>
        {/* Upper arm */}
        <Cylinder args={[0.08, 0.07, 0.6, 12]} rotation={[0, 0, Math.PI / 2]} position={[0.3, 0, 0]}>
          <meshStandardMaterial color="#ffdbac" roughness={0.8} />
        </Cylinder>
        {/* Bicep muscle */}
        <Sphere args={[0.09, 12, 12]} position={[0.15, 0, 0]}>
          <meshStandardMaterial color="#f4c2a1" roughness={0.7} />
        </Sphere>
        
        {/* Forearm */}
        <group position={[0.6, 0, 0]} rotation={[0, 0, anim.leftForearmRotZ || 0]}>
          <Cylinder args={[0.07, 0.06, 0.5, 12]} rotation={[0, 0, Math.PI / 2]} position={[0.25, 0, 0]}>
            <meshStandardMaterial color="#ffdbac" roughness={0.8} />
          </Cylinder>
          {/* Hand */}
          <Sphere args={[0.08, 12, 12]} position={[0.5, 0, 0]}>
            <meshStandardMaterial color="#ffdbac" roughness={0.9} />
          </Sphere>
          
          {/* Dumbbell for bicep curls */}
          {exerciseId === 'bicep-curls' && (
            <group position={[0.6, 0, 0]}>
              <Cylinder args={[0.025, 0.025, 0.3, 8]} rotation={[Math.PI / 2, 0, 0]}>
                <meshStandardMaterial color="#444" metalness={0.8} roughness={0.2} />
              </Cylinder>
              <Sphere args={[0.08, 12, 12]} position={[0, 0.15, 0]}>
                <meshStandardMaterial color="#222" metalness={0.9} roughness={0.1} />
              </Sphere>
              <Sphere args={[0.08, 12, 12]} position={[0, -0.15, 0]}>
                <meshStandardMaterial color="#222" metalness={0.9} roughness={0.1} />
              </Sphere>
            </group>
          )}
        </group>
      </group>

      {/* Right Arm (mirrored) */}
      <group position={[0.45, 1.3, 0]} rotation={[anim.rightArmRotX || 0, 0, anim.rightArmRotZ || 0.3]}>
        {/* Shoulder */}
        <Sphere args={[0.1, 12, 12]} position={[0, 0, 0]}>
          <meshStandardMaterial color="#ffdbac" roughness={0.8} />
        </Sphere>
        {/* Upper arm */}
        <Cylinder args={[0.08, 0.07, 0.6, 12]} rotation={[0, 0, -Math.PI / 2]} position={[-0.3, 0, 0]}>
          <meshStandardMaterial color="#ffdbac" roughness={0.8} />
        </Cylinder>
        {/* Bicep muscle */}
        <Sphere args={[0.09, 12, 12]} position={[-0.15, 0, 0]}>
          <meshStandardMaterial color="#f4c2a1" roughness={0.7} />
        </Sphere>
        
        {/* Forearm */}
        <group position={[-0.6, 0, 0]} rotation={[0, 0, anim.rightForearmRotZ || 0]}>
          <Cylinder args={[0.07, 0.06, 0.5, 12]} rotation={[0, 0, -Math.PI / 2]} position={[-0.25, 0, 0]}>
            <meshStandardMaterial color="#ffdbac" roughness={0.8} />
          </Cylinder>
          {/* Hand */}
          <Sphere args={[0.08, 12, 12]} position={[-0.5, 0, 0]}>
            <meshStandardMaterial color="#ffdbac" roughness={0.9} />
          </Sphere>
          
          {/* Dumbbell for bicep curls */}
          {exerciseId === 'bicep-curls' && (
            <group position={[-0.6, 0, 0]}>
              <Cylinder args={[0.025, 0.025, 0.3, 8]} rotation={[Math.PI / 2, 0, 0]}>
                <meshStandardMaterial color="#444" metalness={0.8} roughness={0.2} />
              </Cylinder>
              <Sphere args={[0.08, 12, 12]} position={[0, 0.15, 0]}>
                <meshStandardMaterial color="#222" metalness={0.9} roughness={0.1} />
              </Sphere>
              <Sphere args={[0.08, 12, 12]} position={[0, -0.15, 0]}>
                <meshStandardMaterial color="#222" metalness={0.9} roughness={0.1} />
              </Sphere>
            </group>
          )}
        </group>
      </group>

      {/* Left Leg */}
      <group position={[-0.22, 0.1, 0]} rotation={[anim.legRotX || 0, 0, 0]}>
        {/* Thigh */}
        <Cylinder args={[0.11, 0.09, 0.8, 12]} position={[0, 0, 0]}>
          <meshStandardMaterial color="#1e40af" roughness={0.7} />
        </Cylinder>
        {/* Quad muscle */}
        <Cylinder args={[0.12, 0.1, 0.6, 12]} position={[0, 0.1, 0.05]}>
          <meshStandardMaterial color="#1e3a8a" roughness={0.6} />
        </Cylinder>
        {/* Knee */}
        <Sphere args={[0.09, 12, 12]} position={[0, -0.4, 0]}>
          <meshStandardMaterial color="#ffdbac" roughness={0.8} />
        </Sphere>
        {/* Calf */}
        <Cylinder args={[0.08, 0.07, 0.7, 12]} position={[0, -0.75, 0]}>
          <meshStandardMaterial color="#1e40af" roughness={0.7} />
        </Cylinder>
      </group>

      {/* Right Leg */}
      <group position={[0.22, 0.1, 0]} rotation={[anim.legRotX || 0, 0, 0]}>
        {/* Thigh */}
        <Cylinder args={[0.11, 0.09, 0.8, 12]} position={[0, 0, 0]}>
          <meshStandardMaterial color="#1e40af" roughness={0.7} />
        </Cylinder>
        {/* Quad muscle */}
        <Cylinder args={[0.12, 0.1, 0.6, 12]} position={[0, 0.1, 0.05]}>
          <meshStandardMaterial color="#1e3a8a" roughness={0.6} />
        </Cylinder>
        {/* Knee */}
        <Sphere args={[0.09, 12, 12]} position={[0, -0.4, 0]}>
          <meshStandardMaterial color="#ffdbac" roughness={0.8} />
        </Sphere>
        {/* Calf */}
        <Cylinder args={[0.08, 0.07, 0.7, 12]} position={[0, -0.75, 0]}>
          <meshStandardMaterial color="#1e40af" roughness={0.7} />
        </Cylinder>
      </group>

      {/* Feet */}
      <Box args={[0.15, 0.08, 0.35]} position={[-0.22, -1.15, 0.1]}>
        <meshStandardMaterial color="#000" roughness={0.9} />
      </Box>
      <Box args={[0.15, 0.08, 0.35]} position={[0.22, -1.15, 0.1]}>
        <meshStandardMaterial color="#000" roughness={0.9} />
      </Box>
    </group>
  );
}

// Simplified Scene Component
function Scene3D({ exerciseId, animationPhase }: { exerciseId: string; animationPhase: string }) {
  return (
    <>
      {/* Lighting */}
      <ambientLight intensity={0.5} />
      <directionalLight position={[5, 8, 5]} intensity={1} />
      <pointLight position={[-3, 3, 3]} intensity={0.5} color="#4f46e5" />

      {/* Ground */}
      <Box args={[10, 0.2, 10]} position={[0, -1.3, 0]}>
        <meshStandardMaterial color="#f1f5f9" roughness={0.8} />
      </Box>

      {/* Grid */}
      <gridHelper args={[8, 16, '#94a3b8', '#cbd5e1']} position={[0, -1.2, 0]} />

      {/* Human Figure */}
      <RealisticHumanFigure exerciseId={exerciseId} animationPhase={animationPhase} />

      {/* Exercise Label */}
      <Text
        position={[0, 3.2, 0]}
        fontSize={0.3}
        color="#1f2937"
        anchorX="center"
        anchorY="middle"
      >
        {exerciseId.replace('-', ' ').toUpperCase()}
      </Text>

      {/* Phase Indicator */}
      <Text
        position={[0, 2.8, 0]}
        fontSize={0.2}
        color={
          animationPhase === 'start' ? '#10b981' :
          animationPhase === 'down' ? '#3b82f6' : '#f59e0b'
        }
        anchorX="center"
        anchorY="middle"
      >
        {animationPhase === 'start' && 'READY'}
        {animationPhase === 'down' && 'LOWERING'}
        {animationPhase === 'up' && 'LIFTING'}
      </Text>

      {/* Camera Controls */}
      <OrbitControls
        enablePan={true}
        enableZoom={true}
        enableRotate={true}
        minDistance={4}
        maxDistance={10}
        minPolarAngle={Math.PI / 6}
        maxPolarAngle={Math.PI / 2}
      />
    </>
  );
}

export function Exercise3DAnimation({ exerciseId, className = '' }: Exercise3DAnimationProps) {
  const [isPlaying, setIsPlaying] = useState(true);
  const [isExpanded, setIsExpanded] = useState(false);
  const [currentPhase, setCurrentPhase] = useState<'start' | 'down' | 'up'>('start');

  // Animation timing
  useEffect(() => {
    if (!isPlaying) return;

    const interval = setInterval(() => {
      setCurrentPhase(prev => {
        switch (prev) {
          case 'start': return 'down';
          case 'down': return 'up';
          case 'up': return 'down';
          default: return 'start';
        }
      });
    }, 2000); // 2 second intervals for smoother 3D animation

    return () => clearInterval(interval);
  }, [isPlaying]);

  const getExerciseConfig = () => {
    switch (exerciseId) {
      case 'push-ups':
        return {
          name: 'Push-ups',
          emoji: '💪',
          colorClasses: {
            border: 'border-blue-200',
            bg: 'bg-blue-50',
            button: 'bg-blue-600 hover:bg-blue-700',
            text: 'text-blue-700',
            accent: 'text-blue-600'
          },
          instructions: [
            'Start in plank position with hands shoulder-width apart',
            'Lower your chest to the ground while keeping body straight',
            'Push back up to starting position with control',
            'Keep core engaged throughout the movement'
          ]
        };
      case 'squats':
        return {
          name: 'Squats',
          emoji: '🏋️',
          colorClasses: {
            border: 'border-green-200',
            bg: 'bg-green-50',
            button: 'bg-green-600 hover:bg-green-700',
            text: 'text-green-700',
            accent: 'text-green-600'
          },
          instructions: [
            'Stand with feet shoulder-width apart',
            'Lower your hips back and down as if sitting in a chair',
            'Keep your chest up and knees tracking over toes',
            'Drive through your heels to return to standing'
          ]
        };
      case 'bicep-curls':
        return {
          name: 'Bicep Curls',
          emoji: '🤲',
          colorClasses: {
            border: 'border-purple-200',
            bg: 'bg-purple-50',
            button: 'bg-purple-600 hover:bg-purple-700',
            text: 'text-purple-700',
            accent: 'text-purple-600'
          },
          instructions: [
            'Stand with dumbbells at your sides, palms facing forward',
            'Curl the weights up to your shoulders',
            'Keep your elbows stable at your sides',
            'Lower the weights with control to starting position'
          ]
        };
      default:
        return {
          name: 'Exercise',
          emoji: '💪',
          colorClasses: {
            border: 'border-gray-200',
            bg: 'bg-gray-50',
            button: 'bg-gray-600 hover:bg-gray-700',
            text: 'text-gray-700',
            accent: 'text-gray-600'
          },
          instructions: ['Follow the movement shown in the 3D animation']
        };
    }
  };

  const config = getExerciseConfig();

  return (
    <div className={`${className}`}>
      <Card className={`p-4 border-2 ${config.colorClasses.border} ${config.colorClasses.bg}`}>
        {/* Header */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center space-x-2">
            <span className="text-2xl">{config.emoji}</span>
            <h3 className="font-semibold text-gray-800">{config.name}</h3>
            <span className="text-xs bg-gradient-to-r from-blue-500 to-purple-500 text-white px-2 py-1 rounded-full">
              3D
            </span>
          </div>
          <div className="flex space-x-2">
            <Button
              onClick={() => setIsPlaying(!isPlaying)}
              className={`text-xs px-2 py-1 ${config.colorClasses.button}`}
            >
              {isPlaying ? '⏸️' : '▶️'}
            </Button>
            <Button
              onClick={() => setIsExpanded(!isExpanded)}
              className={`text-xs px-2 py-1 ${config.colorClasses.button}`}
            >
              {isExpanded ? '🔽' : '🔼'}
            </Button>
          </div>
        </div>

        {/* Simplified 3D Animation Canvas */}
        <div className="h-80 mb-3 rounded-lg overflow-hidden bg-gradient-to-b from-slate-100 via-blue-50 to-indigo-100 shadow-inner">
          <Canvas 
            camera={{ position: [3, 3, 6], fov: 50 }}
            gl={{ antialias: true }}
          >
            <Suspense fallback={
              <Text position={[0, 0, 0]} fontSize={0.5} color="#666">
                Loading 3D Animation...
              </Text>
            }>
              <Scene3D exerciseId={exerciseId} animationPhase={currentPhase} />
            </Suspense>
          </Canvas>
        </div>

        {/* Phase indicator */}
        <div className="text-center mb-3">
          <span className={`text-sm font-medium ${config.colorClasses.text}`}>
            {currentPhase === 'start' && '🟢 Ready Position'}
            {currentPhase === 'down' && '🔵 Lowering Phase'}
            {currentPhase === 'up' && '🟡 Lifting Phase'}
          </span>
        </div>

        {/* Expandable instructions */}
        <AnimatePresence>
          {isExpanded && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="overflow-hidden"
            >
              <div className={`border-t ${config.colorClasses.border} pt-3`}>
                <h4 className="text-sm font-semibold mb-2">🎯 Proper Form Guide:</h4>
                <ol className="text-xs space-y-2">
                  {config.instructions.map((instruction, index) => (
                    <li key={index} className="flex items-start space-x-2">
                      <span className={`${config.colorClasses.accent} font-bold min-w-[16px]`}>{index + 1}.</span>
                      <span>{instruction}</span>
                    </li>
                  ))}
                </ol>
                <div className="mt-3 p-2 bg-white rounded text-xs">
                  <strong>💡 3D Controls:</strong> Drag to rotate • Scroll to zoom • Watch the movement pattern
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Quick tips */}
        <div className={`text-xs ${config.colorClasses.accent} mt-2 text-center`}>
          🎮 Interactive 3D • ▶️ Play/Pause • 🔼 Instructions • Drag to rotate view
        </div>
      </Card>
    </div>
  );
}
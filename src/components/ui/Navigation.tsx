'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { useAuth } from '@/hooks/useAuth';
import { XPProgressBar } from '@/components/gamification/XPProgressBar';
import { LevelBadge } from '@/components/gamification/LevelBadge';
import { UserXP } from '@/types/program';

export function Navigation() {
  const { user, logout } = useAuth();
  const [userXP, setUserXP] = useState<UserXP | null>(null);
  const [showXPDetails, setShowXPDetails] = useState(false);

  useEffect(() => {
    // Load user XP from localStorage
    const loadXP = () => {
      const savedXP = localStorage.getItem('userXP');
      if (savedXP) {
        setUserXP(JSON.parse(savedXP));
      } else {
        // Initialize default XP
        const defaultXP: UserXP = {
          totalXP: 0,
          level: 1,
          currentLevelXP: 0,
          nextLevelXP: 1000,
          xpSources: {
            workoutCompletion: 0,
            streakBonus: 0,
            milestones: 0,
            perfectWeeks: 0,
          },
        };
        setUserXP(defaultXP);
        localStorage.setItem('userXP', JSON.stringify(defaultXP));
      }
    };

    loadXP();

    // Listen for XP updates
    const handleXPUpdate = () => {
      loadXP();
    };

    globalThis.addEventListener('xpUpdated', handleXPUpdate);
    return () => globalThis.removeEventListener('xpUpdated', handleXPUpdate);
  }, []);

  return (
    <nav className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center space-x-2">
            <motion.div
              whileHover={{ scale: 1.05 }}
              className="text-2xl font-bold text-blue-600 dark:text-blue-400"
            >
              💪 FitAI
            </motion.div>
          </Link>

          {/* Navigation Links */}
          <div className="hidden md:flex items-center space-x-8">
            <Link
              href="/exercises"
              className="text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
            >
              Exercises
            </Link>
            <Link
              href="/workouts"
              className="text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
            >
              Workouts
            </Link>
            <Link
              href="/programs"
              className="text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
            >
              Programs
            </Link>
            <Link
              href="/diet"
              className="text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
            >
              Diet Plans
            </Link>
            <Link
              href="/chat"
              className="text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
            >
              AI Assistant
            </Link>
            <Link
              href="/progress"
              className="text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
            >
              Progress
            </Link>
            
            {/* Demo Pages Dropdown */}
            <div className="relative group">
              <button className="text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 transition-colors flex items-center">
                Demos
                <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
              
              <div className="absolute right-0 mt-2 w-56 bg-white dark:bg-gray-800 rounded-lg shadow-xl border border-gray-200 dark:border-gray-700 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50">
                <div className="py-2">
                  <Link
                    href="/features-demo"
                    className="block px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                  >
                    🎯 All Features
                  </Link>
                  <Link
                    href="/pose-demo"
                    className="block px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                  >
                    📹 Pose Detection
                  </Link>
                  <Link
                    href="/video-demo"
                    className="block px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                  >
                    🎥 Video Demos
                  </Link>
                  <Link
                    href="/form-analysis-demo"
                    className="block px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                  >
                    📊 Form Analysis
                  </Link>
                  <Link
                    href="/feedback-engine-demo"
                    className="block px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                  >
                    💬 Feedback Engine
                  </Link>
                  <Link
                    href="/ai-integration-demo"
                    className="block px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                  >
                    🤖 AI Integration
                  </Link>
                  <Link
                    href="/camera-test"
                    className="block px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                  >
                    📷 Camera Test
                  </Link>
                  <Link
                    href="/auth-demo"
                    className="block px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                  >
                    🔐 Authentication
                  </Link>
                </div>
              </div>
            </div>
          </div>

          {/* User Menu */}
          <div className="flex items-center space-x-4">
            {/* XP Progress (if user has XP) */}
            {userXP && userXP.totalXP > 0 && (
              <div 
                className="hidden lg:block w-48 cursor-pointer"
                onMouseEnter={() => setShowXPDetails(true)}
                onMouseLeave={() => setShowXPDetails(false)}
              >
                <XPProgressBar userXP={userXP} showDetails={showXPDetails} />
              </div>
            )}

            {/* Level Badge */}
            {userXP && userXP.level > 1 && (
              <div className="hidden lg:block">
                <LevelBadge level={userXP.level} size="sm" animated={false} />
              </div>
            )}

            {user ? (
              <div className="flex items-center space-x-4">
                <Link
                  href="/profile"
                  className="text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                >
                  Profile
                </Link>
                <button
                  onClick={logout}
                  className="text-gray-700 dark:text-gray-300 hover:text-red-600 dark:hover:text-red-400 transition-colors"
                >
                  Sign Out
                </button>
              </div>
            ) : (
              <div className="flex items-center space-x-4">
                <Link
                  href="/profile"
                  className="text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 transition-colors"
                >
                  Sign In
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
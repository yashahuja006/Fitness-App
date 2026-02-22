'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { Navigation } from '@/components/ui/Navigation';
import { ClientOnly } from '@/components/ui/ClientOnly';

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
      <Navigation />
      
      <main className="flex min-h-screen w-full max-w-4xl mx-auto flex-col items-center justify-center px-8 py-16">
        <ClientOnly fallback={
          <div className="text-center">
            <h1 className="mb-6 text-5xl font-bold tracking-tight text-gray-900 dark:text-white">
              AI-Powered Fitness App
            </h1>
            <p className="mb-8 max-w-2xl text-xl text-gray-600 dark:text-gray-300">
              Your personal AI fitness trainer with real-time form correction for push-ups, squats, and bicep curls.
              Get instant feedback on your exercise form using advanced pose detection.
            </p>
          </div>
        }>
          <div suppressHydrationWarning>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
              className="text-center"
            >
              <h1 className="mb-6 text-5xl font-bold tracking-tight text-gray-900 dark:text-white">
                AI-Powered Fitness App
              </h1>
              <p className="mb-8 max-w-2xl text-xl text-gray-600 dark:text-gray-300">
                Your personal AI fitness trainer with real-time form correction for push-ups, squats, and bicep curls.
                Get instant feedback on your exercise form using advanced pose detection.
              </p>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.4, duration: 0.6 }}
                className="flex flex-col gap-4 sm:flex-row sm:justify-center"
              >
                <Link href="/workouts">
                  <motion.button 
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className="rounded-lg bg-gradient-to-r from-blue-600 to-purple-600 px-8 py-4 text-white font-semibold transition-all hover:from-blue-700 hover:to-purple-700 shadow-lg text-lg"
                  >
                    🏋️ Start Your Workout
                  </motion.button>
                </Link>
                <Link href="/exercises">
                  <motion.button 
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className="rounded-lg border-2 border-gray-300 px-8 py-4 text-gray-700 font-semibold transition-colors hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-800"
                  >
                    📚 Browse Exercise Library
                  </motion.button>
                </Link>
              </motion.div>

              {/* Feature Highlights */}
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.8, duration: 0.6 }}
                className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl"
              >
                <Link href="/pose-demo">
                  <div className="text-center p-6 bg-white dark:bg-gray-800 rounded-lg shadow-lg hover:shadow-xl transition-shadow cursor-pointer">
                    <div className="text-4xl mb-4">🎯</div>
                    <h3 className="text-lg font-semibold mb-2 text-gray-900 dark:text-white">
                      Real-time Form Analysis
                    </h3>
                    <p className="text-gray-600 dark:text-gray-300 text-sm">
                      Get instant feedback on your exercise form with AI-powered pose detection
                    </p>
                  </div>
                </Link>
                
                <Link href="/workouts">
                  <div className="text-center p-6 bg-white dark:bg-gray-800 rounded-lg shadow-lg hover:shadow-xl transition-shadow cursor-pointer">
                    <div className="text-4xl mb-4">📊</div>
                    <h3 className="text-lg font-semibold mb-2 text-gray-900 dark:text-white">
                      Automatic Rep Counting
                    </h3>
                    <p className="text-gray-600 dark:text-gray-300 text-sm">
                      Smart rep counting with quality assessment for each repetition
                    </p>
                  </div>
                </Link>
                
                <Link href="/progress">
                  <div className="text-center p-6 bg-white dark:bg-gray-800 rounded-lg shadow-lg hover:shadow-xl transition-shadow cursor-pointer">
                    <div className="text-4xl mb-4">🏆</div>
                    <h3 className="text-lg font-semibold mb-2 text-gray-900 dark:text-white">
                      Progress Tracking
                    </h3>
                    <p className="text-gray-600 dark:text-gray-300 text-sm">
                      Track your workout progress with detailed analytics and insights
                    </p>
                  </div>
                </Link>
              </motion.div>

              {/* Demo Pages Link */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 1.2, duration: 0.6 }}
                className="mt-12 text-center"
              >
                <Link href="/features-demo">
                  <button className="text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 font-medium flex items-center justify-center mx-auto">
                    View All Features & Demos
                    <svg className="w-5 h-5 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </button>
                </Link>
              </motion.div>

              {/* Supported Exercises */}
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 1.0, duration: 0.6 }}
                className="mt-12 text-center"
              >
                <h2 className="text-2xl font-bold mb-6 text-gray-900 dark:text-white">
                  Supported Exercises
                </h2>
                <div className="flex justify-center space-x-8">
                  <div className="text-center">
                    <div className="text-3xl mb-2">🏋️</div>
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Squats</span>
                  </div>
                  <div className="text-center">
                    <div className="text-3xl mb-2">💪</div>
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Push-ups</span>
                  </div>
                  <div className="text-center">
                    <div className="text-3xl mb-2">🤲</div>
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Bicep Curls</span>
                  </div>
                </div>
              </motion.div>
            </motion.div>
          </div>
        </ClientOnly>
      </main>
    </div>
  );
}

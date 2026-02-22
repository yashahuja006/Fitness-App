'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { Navigation } from '@/components/ui/Navigation';
import { Card } from '@/components/ui/Card';

export default function FeaturesDemoPage() {
  const features = [
    {
      id: 1,
      title: 'Exercise Database',
      description: 'Browse our comprehensive library of exercises with detailed instructions and videos',
      icon: '💪',
      link: '/exercises',
      color: 'from-blue-500 to-cyan-500'
    },
    {
      id: 2,
      title: 'AI Camera Trainer',
      description: 'Real-time pose detection and form analysis with automatic rep counting',
      icon: '📹',
      link: '/pose-demo',
      color: 'from-green-500 to-emerald-500'
    },
    {
      id: 3,
      title: 'Video Demonstrations',
      description: 'Watch professional exercise demonstrations with step-by-step guidance',
      icon: '🎥',
      link: '/video-demo',
      color: 'from-purple-500 to-pink-500'
    },
    {
      id: 4,
      title: 'Workout Tracking',
      description: 'Log your workouts and track your progress over time',
      icon: '📊',
      link: '/workouts',
      color: 'from-orange-500 to-red-500'
    },
    {
      id: 5,
      title: 'AI Nutrition Coach',
      description: 'Get personalized meal plans and nutrition guidance powered by AI',
      icon: '🥗',
      link: '/diet',
      color: 'from-yellow-500 to-orange-500'
    },
    {
      id: 6,
      title: 'Progress Analytics',
      description: 'Visualize your fitness journey with detailed charts and insights',
      icon: '📈',
      link: '/progress',
      color: 'from-indigo-500 to-purple-500'
    },
    {
      id: 7,
      title: 'AI Chat Assistant',
      description: 'Get instant answers to your fitness questions from our AI coach',
      icon: '💬',
      link: '/chat',
      color: 'from-teal-500 to-cyan-500'
    },
    {
      id: 8,
      title: 'User Profile',
      description: 'Manage your personal information and fitness goals',
      icon: '👤',
      link: '/profile',
      color: 'from-pink-500 to-rose-500'
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
      <Navigation />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <h1 className="text-5xl font-bold text-gray-900 dark:text-white mb-4">
            Features Demo
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-400 max-w-3xl mx-auto">
            Explore all the powerful features of our AI-powered fitness platform
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feature, index) => (
            <motion.div
              key={feature.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <Link href={feature.link}>
                <Card className="p-6 h-full hover:shadow-2xl transition-all duration-300 cursor-pointer group border-2 border-transparent hover:border-blue-500">
                  <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${feature.color} flex items-center justify-center text-3xl mb-4 group-hover:scale-110 transition-transform`}>
                    {feature.icon}
                  </div>
                  
                  <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                    {feature.title}
                  </h3>
                  
                  <p className="text-gray-600 dark:text-gray-400 mb-4">
                    {feature.description}
                  </p>
                  
                  <div className="flex items-center text-blue-600 dark:text-blue-400 font-medium group-hover:translate-x-2 transition-transform">
                    Explore
                    <svg className="w-5 h-5 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                </Card>
              </Link>
            </motion.div>
          ))}
        </div>

        {/* Additional Info Section */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8 }}
          className="mt-16"
        >
          <Card className="p-8 bg-gradient-to-r from-blue-600 to-purple-600 text-white">
            <div className="text-center">
              <h2 className="text-3xl font-bold mb-4">
                Ready to Transform Your Fitness Journey?
              </h2>
              <p className="text-xl mb-6 opacity-90">
                Join thousands of users who are achieving their fitness goals with AI-powered guidance
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link href="/workouts">
                  <button className="px-8 py-4 bg-white text-blue-600 rounded-lg font-semibold hover:bg-gray-100 transition-colors">
                    Start Your First Workout
                  </button>
                </Link>
                <Link href="/exercises">
                  <button className="px-8 py-4 bg-transparent border-2 border-white text-white rounded-lg font-semibold hover:bg-white/10 transition-colors">
                    Browse Exercises
                  </button>
                </Link>
              </div>
            </div>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}

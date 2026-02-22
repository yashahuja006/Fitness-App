'use client';

import React from 'react';
import { ChatInterface } from '@/components/chat';
import { Navigation } from '@/components/ui/Navigation';

export default function ChatPage() {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <Navigation />
      
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
              AI Fitness Assistant
            </h1>
            <p className="text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
              Get personalized exercise guidance, form tips, and workout recommendations from our Gemini AI-powered fitness assistant with voice command support.
            </p>
          </div>

          {/* Features */}
          <div className="grid md:grid-cols-3 gap-6 mb-8">
            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm">
              <div className="text-2xl mb-3">💪</div>
              <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Exercise Information</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Get detailed information about exercises, including targeted muscle groups and difficulty levels.
              </p>
            </div>

            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm">
              <div className="text-2xl mb-3">✅</div>
              <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Form Guidance</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Learn proper exercise form with step-by-step instructions and common mistake warnings.
              </p>
            </div>

            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm">
              <div className="text-2xl mb-3">🔄</div>
              <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Exercise Alternatives</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Find suitable exercise replacements based on your equipment and fitness level.
              </p>
            </div>
          </div>

          {/* Chat Interface */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm h-[600px]">
            <ChatInterface />
          </div>

          {/* Tips */}
          <div className="mt-8 bg-blue-50 dark:bg-blue-900/20 p-6 rounded-lg">
            <h3 className="font-semibold text-blue-900 dark:text-blue-100 mb-3">
              💡 Tips for better conversations
            </h3>
            <ul className="space-y-2 text-sm text-blue-800 dark:text-blue-200">
              <li>• Be specific about your fitness level and available equipment</li>
              <li>• Ask about exercise alternatives if you don't have certain equipment</li>
              <li>• Request form guidance for exercises you're unsure about</li>
              <li>• Mention any injuries or limitations for safer recommendations</li>
              <li>• 🎤 Use the microphone button for hands-free voice commands</li>
              <li>• Try saying "Show me push-up variations" or "How to improve squat form?"</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
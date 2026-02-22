'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { voiceAssistantService, VoiceCommand, VoiceSettings } from '@/lib/voiceAssistantService';
import { useRouter } from 'next/navigation';

interface VoiceAssistantProps {
  onCommand?: (command: VoiceCommand) => void;
  className?: string;
}

export const VoiceAssistant: React.FC<VoiceAssistantProps> = ({ onCommand, className = '' }) => {
  const router = useRouter();
  const [isListening, setIsListening] = useState(false);
  const [status, setStatus] = useState<'listening' | 'processing' | 'speaking' | 'idle'>('idle');
  const [lastCommand, setLastCommand] = useState<string>('');
  const [isSupported, setIsSupported] = useState(false);
  const [settings, setSettings] = useState<VoiceSettings | null>(null);
  const [showSettings, setShowSettings] = useState(false);
  const [availableVoices, setAvailableVoices] = useState<SpeechSynthesisVoice[]>([]);

  useEffect(() => {
    // Check if voice assistant is supported
    setIsSupported(voiceAssistantService.isVoiceSupported());
    setSettings(voiceAssistantService.getSettings());

    // Load available voices
    const loadVoices = () => {
      const voices = voiceAssistantService.getAvailableVoices();
      setAvailableVoices(voices);
    };

    // Load voices immediately and on voiceschanged event
    loadVoices();
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.onvoiceschanged = loadVoices;
    }

    // Set up voice assistant callbacks
    voiceAssistantService.setCallbacks({
      onCommandRecognized: (command) => {
        setLastCommand(command.command);
        handleVoiceCommand(command);
        onCommand?.(command);
      },
      onSpeechStart: () => {
        setIsListening(true);
      },
      onSpeechEnd: () => {
        setIsListening(false);
      },
      onStatusChange: (newStatus) => {
        setStatus(newStatus);
      },
      onError: (error) => {
        console.error('Voice Assistant Error:', error);
        voiceAssistantService.speak(`Sorry, ${error}`);
      },
    });

    return () => {
      voiceAssistantService.stopListening();
      voiceAssistantService.stopSpeaking();
    };
  }, [onCommand]);

  const handleVoiceCommand = async (command: VoiceCommand) => {
    if (!command.action) {
      await voiceAssistantService.speak('I didn\'t understand that command. Please try again.');
      return;
    }

    try {
      switch (command.action) {
        case 'search_exercises':
          await voiceAssistantService.speak('Searching for exercises');
          router.push(`/exercises?search=${encodeURIComponent(command.parameters?.query || '')}`);
          break;

        case 'start_workout':
          await voiceAssistantService.speak('Starting workout session');
          router.push('/workouts');
          break;

        case 'stop_workout':
          await voiceAssistantService.speak('Ending workout session');
          break;

        case 'next_exercise':
          await voiceAssistantService.speak('Moving to next exercise');
          break;

        case 'previous_exercise':
          await voiceAssistantService.speak('Going back to previous exercise');
          break;

        case 'start_timer': {
          const duration = command.parameters?.duration || 30;
          await voiceAssistantService.speak(`Starting timer for ${duration} seconds`);
          break;
        }

        case 'stop_timer':
          await voiceAssistantService.speak('Timer stopped');
          break;

        case 'navigate': {
          const page = command.parameters?.page || 'home';
          await voiceAssistantService.speak(`Navigating to ${page}`);
          router.push(page === 'home' ? '/' : `/${page}`);
          break;
        }

        case 'show_help':
          await voiceAssistantService.speak(
            'I can help you search for exercises, start workouts, control timers, and navigate the app. Try saying "search for push ups" or "start workout".'
          );
          break;

        case 'unknown_command':
          await voiceAssistantService.speak(
            'I didn\'t understand that command. Try saying "help" to see what I can do.'
          );
          break;

        default:
          await voiceAssistantService.speak('Command recognized but not implemented yet');
      }
    } catch (error) {
      console.error('Error handling voice command:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      await voiceAssistantService.speak(`Sorry, I encountered an error: ${errorMessage}`);
    }
  };

  const toggleListening = () => {
    if (isListening) {
      voiceAssistantService.stopListening();
    } else {
      const started = voiceAssistantService.startListening();
      if (!started) {
        voiceAssistantService.speak('Unable to start voice recognition. Please check your microphone permissions.');
      }
    }
  };

  const updateVoiceSettings = (newSettings: Partial<VoiceSettings>) => {
    const updatedSettings = { ...settings!, ...newSettings };
    setSettings(updatedSettings);
    voiceAssistantService.updateSettings(updatedSettings);
  };

  const testVoice = async () => {
    await voiceAssistantService.speak('Voice assistant is working correctly!');
  };

  if (!isSupported) {
    return (
      <div className={`text-center p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg ${className}`}>
        <p className="text-yellow-800 dark:text-yellow-200">
          Voice Assistant is not supported in this browser. Please use Chrome, Edge, or Safari for voice features.
        </p>
      </div>
    );
  }

  const getStatusColor = () => {
    switch (status) {
      case 'listening': return 'bg-green-500';
      case 'processing': return 'bg-yellow-500';
      case 'speaking': return 'bg-blue-500';
      default: return 'bg-gray-400';
    }
  };

  const getStatusText = () => {
    switch (status) {
      case 'listening': return 'Listening...';
      case 'processing': return 'Processing...';
      case 'speaking': return 'Speaking...';
      default: return 'Ready';
    }
  };

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Voice Control Button */}
      <div className="flex items-center justify-center space-x-4">
        <motion.button
          onClick={toggleListening}
          className={`relative w-16 h-16 rounded-full flex items-center justify-center text-white shadow-lg ${
            isListening ? 'bg-red-500 hover:bg-red-600' : 'bg-blue-500 hover:bg-blue-600'
          }`}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          disabled={status === 'processing' || status === 'speaking'}
        >
          {/* Status indicator */}
          <div className={`absolute -top-1 -right-1 w-4 h-4 rounded-full ${getStatusColor()}`}>
            {status === 'listening' && (
              <motion.div
                className="w-full h-full rounded-full bg-green-400"
                animate={{ scale: [1, 1.2, 1] }}
                transition={{ repeat: Infinity, duration: 1 }}
              />
            )}
          </div>

          {/* Microphone icon */}
          <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
          </svg>
        </motion.button>

        <div className="text-center">
          <p className="text-sm font-medium text-gray-900 dark:text-white">
            {getStatusText()}
          </p>
          {lastCommand && (
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              "{lastCommand}"
            </p>
          )}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="flex flex-wrap justify-center gap-2">
        <button
          onClick={testVoice}
          className="px-3 py-1 text-xs bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-full hover:bg-gray-200 dark:hover:bg-gray-600"
        >
          Test Voice
        </button>
        <button
          onClick={() => setShowSettings(!showSettings)}
          className="px-3 py-1 text-xs bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-full hover:bg-gray-200 dark:hover:bg-gray-600"
        >
          Settings
        </button>
      </div>

      {/* Voice Commands Help */}
      <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
        <h4 className="font-medium text-blue-900 dark:text-blue-100 mb-2">
          Voice Commands
        </h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm text-blue-800 dark:text-blue-200">
          <div>• "Search for push ups"</div>
          <div>• "Start workout"</div>
          <div>• "Go to exercises"</div>
          <div>• "Start timer for 30 seconds"</div>
          <div>• "Next exercise"</div>
          <div>• "Help"</div>
        </div>
      </div>

      {/* Settings Panel */}
      <AnimatePresence>
        {showSettings && settings && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700"
          >
            <h4 className="font-medium text-gray-900 dark:text-white mb-4">
              Voice Settings
            </h4>

            <div className="space-y-4">
              {/* Voice Selection */}
              {availableVoices.length > 0 && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Voice
                  </label>
                  <select
                    value={settings.voice?.name || ''}
                    onChange={(e) => {
                      const voice = availableVoices.find(v => v.name === e.target.value);
                      updateVoiceSettings({ voice });
                    }}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md dark:bg-gray-700 dark:text-white"
                  >
                    <option value="">Default Voice</option>
                    {availableVoices.map((voice) => (
                      <option key={voice.name} value={voice.name}>
                        {voice.name} ({voice.lang})
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Speech Rate */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Speech Rate: {settings.rate}
                </label>
                <input
                  type="range"
                  min="0.5"
                  max="2"
                  step="0.1"
                  value={settings.rate}
                  onChange={(e) => updateVoiceSettings({ rate: parseFloat(e.target.value) })}
                  className="w-full"
                />
              </div>

              {/* Volume */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Volume: {Math.round(settings.volume * 100)}%
                </label>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.1"
                  value={settings.volume}
                  onChange={(e) => updateVoiceSettings({ volume: parseFloat(e.target.value) })}
                  className="w-full"
                />
              </div>

              {/* Continuous Listening */}
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="continuous"
                  checked={settings.continuous}
                  onChange={(e) => updateVoiceSettings({ continuous: e.target.checked })}
                  className="mr-2"
                />
                <label htmlFor="continuous" className="text-sm text-gray-700 dark:text-gray-300">
                  Continuous listening
                </label>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
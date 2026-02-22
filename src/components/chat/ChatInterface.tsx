'use client';

import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChatMessage, geminiService } from '@/lib/geminiService';
import { Exercise } from '@/types/exercise';
import { useAuth } from '@/hooks/useAuth';
import { voiceAssistantService } from '@/lib/voiceAssistantService';

interface ChatInterfaceProps {
  onClose?: () => void;
  className?: string;
}

export const ChatInterface: React.FC<ChatInterfaceProps> = ({ onClose, className = '' }) => {
  const { user, userProfile } = useAuth();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [isListening, setIsListening] = useState(false);
  const [voiceSupported, setVoiceSupported] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Initialize conversation when component mounts
  useEffect(() => {
    if (user && !sessionId) {
      const newSessionId = geminiService.initializeConversation(user.uid, {
        fitnessLevel: userProfile?.personalMetrics?.activityLevel || 'moderate',
        availableEquipment: [], // Could be populated from user profile
        fitnessGoals: userProfile?.personalMetrics?.fitnessGoals || [],
      });
      setSessionId(newSessionId);

      // Add welcome message
      const welcomeMessage: ChatMessage = {
        id: 'welcome',
        role: 'assistant',
        content: `Hi ${user.displayName || 'there'}! I'm your AI fitness assistant powered by Gemini. I can help you with exercise information, form guidance, workout alternatives, and general fitness questions. What would you like to know?`,
        timestamp: new Date(),
        type: 'text',
      };
      setMessages([welcomeMessage]);
    }

    // Check voice support
    setVoiceSupported(voiceAssistantService.isVoiceSupported());
  }, [user, userProfile, sessionId]);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Cleanup voice recognition on unmount
  useEffect(() => {
    return () => {
      if (isListening) {
        voiceAssistantService.stopListening();
      }
    };
  }, [isListening]);

  const handleSendMessage = async () => {
    if (!inputValue.trim() || !sessionId || isLoading) return;

    const userMessage = inputValue.trim();
    setInputValue('');
    setIsLoading(true);

    try {
      const response = await geminiService.processMessage(sessionId, userMessage);
      const updatedHistory = geminiService.getConversationHistory(sessionId);
      setMessages(updatedHistory);
    } catch (error) {
      console.error('Error sending message:', error);
      // Add error message
      const errorMessage: ChatMessage = {
        id: `error_${Date.now()}`,
        role: 'assistant',
        content: "I'm sorry, I encountered an error processing your message. Please try again!",
        timestamp: new Date(),
        type: 'text',
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleVoiceCommand = async () => {
    if (!voiceSupported || isListening) return;

    try {
      setIsListening(true);
      
      // Set up voice assistant callbacks
      voiceAssistantService.setCallbacks({
        onCommandRecognized: async (command) => {
          setIsListening(false);
          setInputValue(command.command);
          
          // Automatically send the voice command
          if (sessionId) {
            setIsLoading(true);
            try {
              const response = await geminiService.processMessage(sessionId, command.command);
              const updatedHistory = geminiService.getConversationHistory(sessionId);
              setMessages(updatedHistory);
            } catch (error) {
              console.error('Error processing voice command:', error);
            } finally {
              setIsLoading(false);
            }
          }
        },
        onStatusChange: (status) => {
          if (status === 'stopped' || status === 'error') {
            setIsListening(false);
          }
        },
        onError: (error) => {
          console.error('Voice recognition error:', error);
          setIsListening(false);
        },
      });

      // Start listening
      voiceAssistantService.startListening();
      
      // Auto-stop after 10 seconds
      setTimeout(() => {
        if (isListening) {
          voiceAssistantService.stopListening();
          setIsListening(false);
        }
      }, 10000);
      
    } catch (error) {
      console.error('Error starting voice recognition:', error);
      setIsListening(false);
    }
  };

  const stopVoiceCommand = () => {
    voiceAssistantService.stopListening();
    setIsListening(false);
  };

  const getMessageIcon = (type: ChatMessage['type']) => {
    switch (type) {
      case 'exercise_info':
        return '💪';
      case 'exercise_recommendation':
        return '🔄';
      case 'form_guidance':
        return '✅';
      default:
        return '🤖';
    }
  };

  const renderExerciseInfo = (exercises: Exercise[]) => {
    if (!exercises || exercises.length === 0) return null;

    return (
      <div className="mt-3 space-y-2">
        {exercises.slice(0, 3).map((exercise) => (
          <div key={exercise.id} className="bg-gray-50 dark:bg-gray-600 p-3 rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <h4 className="font-semibold text-sm text-gray-900 dark:text-white">
                {exercise.name}
              </h4>
              <span className="text-xs bg-blue-100 dark:bg-blue-800 text-blue-800 dark:text-blue-200 px-2 py-1 rounded">
                {exercise.difficulty}
              </span>
            </div>
            <div className="text-xs text-gray-600 dark:text-gray-300 space-y-1">
              <div>
                <strong>Targets:</strong> {exercise.targetMuscles.join(', ')}
              </div>
              <div>
                <strong>Equipment:</strong> {exercise.equipment.join(', ')}
              </div>
              {exercise.instructions && exercise.instructions.length > 0 && (
                <div>
                  <strong>Instructions:</strong> {exercise.instructions[0]}
                </div>
              )}
            </div>
          </div>
        ))}
        {exercises.length > 3 && (
          <div className="text-xs text-gray-500 dark:text-gray-400 text-center">
            +{exercises.length - 3} more exercises
          </div>
        )}
      </div>
    );
  };

  const renderActionButtons = (actions: ChatMessage['metadata']['actions']) => {
    if (!actions || actions.length === 0) return null;

    return (
      <div className="mt-3 flex flex-wrap gap-2">
        {actions.map((action) => (
          <button
            key={`${action.type}-${action.label}`}
            onClick={() => handleActionClick(action)}
            className="text-xs bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded-full transition-colors"
          >
            {action.label}
          </button>
        ))}
      </div>
    );
  };

  const handleActionClick = (action: ChatMessage['metadata']['actions'][0]) => {
    switch (action.type) {
      case 'view_exercise':
        // Navigate to exercise detail page
        window.open(`/exercises?id=${action.data.exerciseId}`, '_blank');
        break;
      case 'search_exercises':
        // Navigate to exercise search with filters
        window.open('/exercises', '_blank');
        break;
      case 'get_alternatives':
        // Send a follow-up message for more alternatives
        setInputValue('Show me more exercise alternatives');
        break;
      case 'start_workout':
        // Navigate to workout page
        window.open('/workouts', '_blank');
        break;
      default:
        console.log('Unknown action:', action);
    }
  };

  const formatTimestamp = (timestamp: Date) => {
    return new Intl.DateTimeFormat('en-US', {
      hour: '2-digit',
      minute: '2-digit',
    }).format(timestamp);
  };

  return (
    <div className={`flex flex-col h-full bg-white dark:bg-gray-800 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center">
            <span className="text-white text-lg">🤖</span>
          </div>
          <div>
            <h3 className="font-semibold text-gray-900 dark:text-white">AI Fitness Assistant</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {isLoading ? 'Typing...' : 'Powered by Gemini AI'}
            </p>
          </div>
        </div>
        {onClose && (
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        <AnimatePresence>
          {messages.map((message) => (
            <motion.div
              key={message.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                  message.role === 'user'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white'
                }`}
              >
                {message.role === 'assistant' && (
                  <div className="flex items-center space-x-2 mb-1">
                    <span className="text-sm">{getMessageIcon(message.type)}</span>
                    <span className="text-xs text-gray-500 dark:text-gray-400">
                      {formatTimestamp(message.timestamp)}
                    </span>
                  </div>
                )}
                <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                {message.role === 'user' && (
                  <p className="text-xs text-blue-200 mt-1">
                    {formatTimestamp(message.timestamp)}
                  </p>
                )}
                
                {/* Exercise Information */}
                {message.role === 'assistant' && message.metadata?.exercises && (
                  renderExerciseInfo(message.metadata.exercises)
                )}
                
                {/* Action Buttons */}
                {message.role === 'assistant' && message.metadata?.actions && (
                  renderActionButtons(message.metadata.actions)
                )}
              </div>
            </motion.div>
          ))}
        </AnimatePresence>

        {isLoading && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex justify-start"
          >
            <div className="bg-gray-100 dark:bg-gray-700 px-4 py-2 rounded-lg">
              <div className="flex space-x-1">
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
              </div>
            </div>
          </motion.div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="p-4 border-t border-gray-200 dark:border-gray-700">
        <div className="flex space-x-2">
          <input
            ref={inputRef}
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Ask me about exercises, form, or fitness..."
            className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
            disabled={isLoading}
          />
          
          {/* Voice Command Button */}
          {voiceSupported && (
            <button
              onClick={isListening ? stopVoiceCommand : handleVoiceCommand}
              disabled={isLoading}
              className={`px-3 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all ${
                isListening 
                  ? 'bg-red-600 hover:bg-red-700 text-white animate-pulse' 
                  : 'bg-gray-100 dark:bg-gray-600 hover:bg-gray-200 dark:hover:bg-gray-500 text-gray-700 dark:text-gray-300'
              }`}
              title={isListening ? 'Stop voice input' : 'Start voice input'}
            >
              {isListening ? (
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3z"/>
                  <path d="M17 11c0 2.76-2.24 5-5 5s-5-2.24-5-5H5c0 3.53 2.61 6.43 6 6.92V21h2v-3.08c3.39-.49 6-3.39 6-6.92h-2z"/>
                </svg>
              ) : (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                </svg>
              )}
            </button>
          )}
          
          <button
            onClick={handleSendMessage}
            disabled={!inputValue.trim() || isLoading}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
            </svg>
          </button>
        </div>

        {/* Voice Status Indicator */}
        {isListening && (
          <div className="mt-2 flex items-center space-x-2 text-sm text-red-600 dark:text-red-400">
            <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
            <span>Listening... Speak your fitness question</span>
            <button
              onClick={stopVoiceCommand}
              className="text-xs underline hover:no-underline"
            >
              Cancel
            </button>
          </div>
        )}

        {/* Quick suggestions */}
        <div className="mt-2 flex flex-wrap gap-2">
          {[
            "Show me push-up variations",
            "How to improve squat form?",
            "Exercises for back pain",
            "Beginner workout routine",
            "Alternatives to bench press",
            "Core strengthening exercises"
          ].map((suggestion) => (
            <button
              key={suggestion}
              onClick={() => setInputValue(suggestion)}
              className="px-3 py-1 text-xs bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-full hover:bg-gray-200 dark:hover:bg-gray-600"
            >
              {suggestion}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};
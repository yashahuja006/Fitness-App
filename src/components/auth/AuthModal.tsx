'use client';

import React, { useState } from 'react';
import { LoginForm } from './LoginForm';
import { RegisterForm } from './RegisterForm';
import { PasswordResetForm } from './PasswordResetForm';

type AuthMode = 'login' | 'register' | 'reset';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialMode?: AuthMode;
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  initialMode = 'login',
}) => {
  const [mode, setMode] = useState<AuthMode>(initialMode);

  if (!isOpen) return null;

  const handleSuccess = () => {
    onClose();
  };

  const getTitle = () => {
    switch (mode) {
      case 'login':
        return 'Sign In';
      case 'register':
        return 'Create Account';
      case 'reset':
        return 'Reset Password';
      default:
        return 'Authentication';
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex min-h-full items-center justify-center p-4 text-center sm:p-0">
        {/* Backdrop */}
        <div
          className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity"
          onClick={onClose}
        />

        {/* Modal */}
        <div className="relative transform overflow-hidden rounded-lg bg-white dark:bg-gray-800 px-4 pb-4 pt-5 text-left shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-lg sm:p-6">
          {/* Close button */}
          <div className="absolute right-0 top-0 pr-4 pt-4">
            <button
              type="button"
              className="rounded-md bg-white dark:bg-gray-800 text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
              onClick={onClose}
            >
              <span className="sr-only">Close</span>
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Header */}
          <div className="text-center mb-6">
            <h3 className="text-2xl font-bold leading-6 text-gray-900 dark:text-white">
              {getTitle()}
            </h3>
          </div>

          {/* Content */}
          <div className="mt-3">
            {mode === 'login' && (
              <LoginForm
                onSuccess={handleSuccess}
                onSwitchToRegister={() => setMode('register')}
                onSwitchToReset={() => setMode('reset')}
              />
            )}
            {mode === 'register' && (
              <RegisterForm
                onSuccess={handleSuccess}
                onSwitchToLogin={() => setMode('login')}
              />
            )}
            {mode === 'reset' && (
              <PasswordResetForm
                onSuccess={() => setMode('login')}
                onSwitchToLogin={() => setMode('login')}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
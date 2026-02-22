'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/Button';
import { Program } from '@/types/program';

interface ShareProgramModalProps {
  isOpen: boolean;
  onClose: () => void;
  program: Program;
}

export function ShareProgramModal({ isOpen, onClose, program }: Readonly<ShareProgramModalProps>) {
  const [copied, setCopied] = useState(false);

  const shareUrl = typeof window !== 'undefined' 
    ? `${window.location.origin}/programs/${program.id}`
    : '';

  const shareText = `Check out this ${program.name} program! ${program.description}`;

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  const handleShareTwitter = () => {
    const twitterUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(shareUrl)}`;
    window.open(twitterUrl, '_blank');
  };

  const handleShareFacebook = () => {
    const facebookUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`;
    window.open(facebookUrl, '_blank');
  };

  const handleShareWhatsApp = () => {
    const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(`${shareText} ${shareUrl}`)}`;
    window.open(whatsappUrl, '_blank');
  };

  const handleShareEmail = () => {
    const emailUrl = `mailto:?subject=${encodeURIComponent(program.name)}&body=${encodeURIComponent(`${shareText}\n\n${shareUrl}`)}`;
    window.location.href = emailUrl;
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/50 z-50"
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            onClick={onClose}
          >
            <div
              className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full p-6"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                  Share Program
                </h2>
                <button
                  onClick={onClose}
                  className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
                >
                  ✕
                </button>
              </div>

              <p className="text-gray-600 dark:text-gray-400 mb-6">
                Share {program.name} with friends and training partners
              </p>

              {/* Copy Link */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Program Link
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={shareUrl}
                    readOnly
                    className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
                  />
                  <Button
                    variant={copied ? 'secondary' : 'primary'}
                    onClick={handleCopyLink}
                    className="whitespace-nowrap"
                  >
                    {copied ? '✓ Copied!' : 'Copy'}
                  </Button>
                </div>
              </div>

              {/* Social Share Buttons */}
              <div className="space-y-3">
                <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Share via
                </p>
                
                <button
                  onClick={handleShareTwitter}
                  className="w-full flex items-center gap-3 px-4 py-3 bg-[#1DA1F2] hover:bg-[#1a8cd8] text-white rounded-lg transition-colors"
                >
                  <span className="text-xl">𝕏</span>
                  <span className="font-medium">Share on Twitter</span>
                </button>

                <button
                  onClick={handleShareFacebook}
                  className="w-full flex items-center gap-3 px-4 py-3 bg-[#1877F2] hover:bg-[#166fe5] text-white rounded-lg transition-colors"
                >
                  <span className="text-xl">f</span>
                  <span className="font-medium">Share on Facebook</span>
                </button>

                <button
                  onClick={handleShareWhatsApp}
                  className="w-full flex items-center gap-3 px-4 py-3 bg-[#25D366] hover:bg-[#22c55e] text-white rounded-lg transition-colors"
                >
                  <span className="text-xl">💬</span>
                  <span className="font-medium">Share on WhatsApp</span>
                </button>

                <button
                  onClick={handleShareEmail}
                  className="w-full flex items-center gap-3 px-4 py-3 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition-colors"
                >
                  <span className="text-xl">✉️</span>
                  <span className="font-medium">Share via Email</span>
                </button>
              </div>

              <div className="mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
                <Button
                  variant="secondary"
                  onClick={onClose}
                  className="w-full"
                >
                  Close
                </Button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';

interface FavoriteProgramButtonProps {
  programId: string;
  size?: 'sm' | 'md' | 'lg';
}

export function FavoriteProgramButton({ 
  programId, 
  size = 'md' 
}: Readonly<FavoriteProgramButtonProps>) {
  const [isFavorite, setIsFavorite] = useState(false);

  useEffect(() => {
    const favorites = JSON.parse(localStorage.getItem('favoritePrograms') || '[]');
    setIsFavorite(favorites.includes(programId));
  }, [programId]);

  const toggleFavorite = () => {
    const favorites = JSON.parse(localStorage.getItem('favoritePrograms') || '[]');
    
    if (isFavorite) {
      const updated = favorites.filter((id: string) => id !== programId);
      localStorage.setItem('favoritePrograms', JSON.stringify(updated));
      setIsFavorite(false);
    } else {
      favorites.push(programId);
      localStorage.setItem('favoritePrograms', JSON.stringify(favorites));
      setIsFavorite(true);
    }
  };

  const sizeClasses = {
    sm: 'w-8 h-8 text-lg',
    md: 'w-10 h-10 text-xl',
    lg: 'w-12 h-12 text-2xl',
  };

  return (
    <motion.button
      whileHover={{ scale: 1.1 }}
      whileTap={{ scale: 0.9 }}
      onClick={toggleFavorite}
      className={`${sizeClasses[size]} flex items-center justify-center rounded-full bg-white dark:bg-gray-800 shadow-md hover:shadow-lg transition-shadow`}
      aria-label={isFavorite ? 'Remove from favorites' : 'Add to favorites'}
    >
      <motion.span
        animate={{ scale: isFavorite ? [1, 1.3, 1] : 1 }}
        transition={{ duration: 0.3 }}
      >
        {isFavorite ? '❤️' : '🤍'}
      </motion.span>
    </motion.button>
  );
}

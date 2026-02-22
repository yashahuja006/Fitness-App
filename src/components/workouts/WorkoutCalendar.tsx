'use client';

import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { WorkoutSession } from '@/types/workout';

interface WorkoutCalendarProps {
  workouts: WorkoutSession[];
  onDateSelect: (date: Date) => void;
  selectedDate?: Date;
}

interface CalendarDay {
  date: Date;
  isCurrentMonth: boolean;
  isToday: boolean;
  isSelected: boolean;
  workout?: WorkoutSession;
  hasWorkout: boolean;
}

export function WorkoutCalendar({ workouts, onDateSelect, selectedDate }: WorkoutCalendarProps) {
  const [currentDate, setCurrentDate] = useState(new Date());
  
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Calculate streak and rest days
  const { streak, restDays } = useMemo(() => {
    const sortedWorkouts = [...workouts]
      .sort((a, b) => b.startTime.getTime() - a.startTime.getTime());
    
    let currentStreak = 0;
    let restDayCount = 0;
    let checkDate = new Date(today);
    
    // Calculate streak
    for (let i = 0; i < 30; i++) {
      const hasWorkout = sortedWorkouts.some(w => {
        const workoutDate = new Date(w.startTime);
        workoutDate.setHours(0, 0, 0, 0);
        return workoutDate.getTime() === checkDate.getTime();
      });
      
      if (hasWorkout) {
        currentStreak++;
      } else if (currentStreak > 0) {
        break;
      }
      
      checkDate.setDate(checkDate.getDate() - 1);
    }
    
    // Calculate rest days
    checkDate = new Date(today);
    for (let i = 0; i < 7; i++) {
      const hasWorkout = sortedWorkouts.some(w => {
        const workoutDate = new Date(w.startTime);
        workoutDate.setHours(0, 0, 0, 0);
        return workoutDate.getTime() === checkDate.getTime();
      });
      
      if (!hasWorkout) {
        restDayCount++;
      } else {
        break;
      }
      
      checkDate.setDate(checkDate.getDate() - 1);
    }
    
    return { streak: currentStreak, restDays: restDayCount };
  }, [workouts, today]);

  const calendarDays = useMemo(() => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    
    const firstDayOfMonth = new Date(year, month, 1);
    const lastDayOfMonth = new Date(year, month + 1, 0);
    const firstDayOfWeek = firstDayOfMonth.getDay();
    
    const days: CalendarDay[] = [];
    
    // Previous month days
    const prevMonth = new Date(year, month - 1, 0);
    for (let i = firstDayOfWeek - 1; i >= 0; i--) {
      const date = new Date(year, month - 1, prevMonth.getDate() - i);
      const workout = workouts.find(w => {
        const workoutDate = new Date(w.startTime);
        workoutDate.setHours(0, 0, 0, 0);
        date.setHours(0, 0, 0, 0);
        return workoutDate.getTime() === date.getTime();
      });
      
      days.push({
        date,
        isCurrentMonth: false,
        isToday: date.getTime() === today.getTime(),
        isSelected: selectedDate ? date.getTime() === selectedDate.getTime() : false,
        workout,
        hasWorkout: !!workout,
      });
    }
    
    // Current month days
    for (let day = 1; day <= lastDayOfMonth.getDate(); day++) {
      const date = new Date(year, month, day);
      const workout = workouts.find(w => {
        const workoutDate = new Date(w.startTime);
        workoutDate.setHours(0, 0, 0, 0);
        date.setHours(0, 0, 0, 0);
        return workoutDate.getTime() === date.getTime();
      });
      
      days.push({
        date,
        isCurrentMonth: true,
        isToday: date.getTime() === today.getTime(),
        isSelected: selectedDate ? date.getTime() === selectedDate.getTime() : false,
        workout,
        hasWorkout: !!workout,
      });
    }
    
    // Next month days
    const remainingDays = 42 - days.length;
    for (let day = 1; day <= remainingDays; day++) {
      const date = new Date(year, month + 1, day);
      const workout = workouts.find(w => {
        const workoutDate = new Date(w.startTime);
        workoutDate.setHours(0, 0, 0, 0);
        date.setHours(0, 0, 0, 0);
        return workoutDate.getTime() === date.getTime();
      });
      
      days.push({
        date,
        isCurrentMonth: false,
        isToday: date.getTime() === today.getTime(),
        isSelected: selectedDate ? date.getTime() === selectedDate.getTime() : false,
        workout,
        hasWorkout: !!workout,
      });
    }
    
    return days;
  }, [currentDate, workouts, today, selectedDate]);

  const navigateMonth = (direction: 'prev' | 'next') => {
    setCurrentDate(prev => {
      const newDate = new Date(prev);
      if (direction === 'prev') {
        newDate.setMonth(prev.getMonth() - 1);
      } else {
        newDate.setMonth(prev.getMonth() + 1);
      }
      return newDate;
    });
  };

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  return (
    <div className="space-y-6">
      {/* Stats Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2">
            <span className="text-2xl">🔥</span>
            <div>
              <div className="text-lg font-bold text-gray-900 dark:text-white">
                {streak} week streak
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-2xl">💧</span>
            <div>
              <div className="text-lg font-bold text-gray-900 dark:text-white">
                {restDays} rest days
              </div>
            </div>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <Button variant="secondary" size="sm">
            <span className="text-lg">📤</span>
          </Button>
          <Button variant="secondary" size="sm">
            <span className="text-lg">⚙️</span>
          </Button>
        </div>
      </div>

      {/* Calendar */}
      <Card className="p-6">
        {/* Calendar Header */}
        <div className="flex items-center justify-between mb-6">
          <Button
            variant="secondary"
            size="sm"
            onClick={() => navigateMonth('prev')}
          >
            ←
          </Button>
          
          <div className="text-center">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">
              {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
            </h2>
          </div>
          
          <Button
            variant="secondary"
            size="sm"
            onClick={() => navigateMonth('next')}
          >
            →
          </Button>
        </div>

        {/* Day Headers */}
        <div className="grid grid-cols-7 gap-1 mb-2">
          {dayNames.map(day => (
            <div
              key={day}
              className="text-center text-sm font-medium text-gray-500 dark:text-gray-400 py-2"
            >
              {day}
            </div>
          ))}
        </div>

        {/* Calendar Grid */}
        <div className="grid grid-cols-7 gap-1">
          {calendarDays.map((day, index) => (
            <motion.button
              key={`${day.date.getTime()}-${index}`}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => onDateSelect(day.date)}
              className={`
                relative aspect-square p-2 rounded-lg text-sm font-medium transition-all
                ${day.isCurrentMonth 
                  ? 'text-gray-900 dark:text-white' 
                  : 'text-gray-400 dark:text-gray-600'
                }
                ${day.isToday 
                  ? 'bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-400' 
                  : 'hover:bg-gray-100 dark:hover:bg-gray-800'
                }
                ${day.isSelected 
                  ? 'bg-blue-500 text-white' 
                  : ''
                }
                ${day.hasWorkout && !day.isSelected
                  ? 'bg-green-100 dark:bg-green-900 text-green-600 dark:text-green-400'
                  : ''
                }
              `}
            >
              <span className="relative z-10">
                {day.date.getDate()}
              </span>
              
              {day.hasWorkout && (
                <div className="absolute bottom-1 left-1/2 transform -translate-x-1/2">
                  <div className={`
                    w-1.5 h-1.5 rounded-full
                    ${day.isSelected 
                      ? 'bg-white' 
                      : 'bg-green-500 dark:bg-green-400'
                    }
                  `} />
                </div>
              )}
            </motion.button>
          ))}
        </div>
      </Card>

      {/* Next Month Preview */}
      <Card className="p-4">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          {monthNames[(currentDate.getMonth() + 1) % 12]} {
            currentDate.getMonth() === 11 
              ? currentDate.getFullYear() + 1 
              : currentDate.getFullYear()
          }
        </h3>
        
        <div className="grid grid-cols-7 gap-1">
          {Array.from({ length: 14 }, (_, i) => {
            const nextMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, i + 1);
            const hasWorkout = workouts.some(w => {
              const workoutDate = new Date(w.startTime);
              workoutDate.setHours(0, 0, 0, 0);
              nextMonth.setHours(0, 0, 0, 0);
              return workoutDate.getTime() === nextMonth.getTime();
            });
            
            return (
              <button
                key={i}
                onClick={() => onDateSelect(nextMonth)}
                className={`
                  aspect-square p-1 rounded text-xs font-medium transition-all
                  hover:bg-gray-100 dark:hover:bg-gray-800
                  ${hasWorkout 
                    ? 'bg-green-100 dark:bg-green-900 text-green-600 dark:text-green-400' 
                    : 'text-gray-600 dark:text-gray-400'
                  }
                `}
              >
                {nextMonth.getDate()}
              </button>
            );
          })}
        </div>
      </Card>
    </div>
  );
}
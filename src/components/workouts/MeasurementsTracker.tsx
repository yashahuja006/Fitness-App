'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';

interface Measurement {
  id: string;
  type: 'weight' | 'body_fat' | 'muscle_mass' | 'chest' | 'waist' | 'arms' | 'thighs' | 'custom';
  value: number;
  unit: string;
  date: Date;
  notes?: string;
}

interface MeasurementsTrackerProps {
  measurements: Measurement[];
  onAddMeasurement: (measurement: Omit<Measurement, 'id'>) => void;
}

const measurementTypes = [
  { type: 'weight' as const, label: 'Weight', unit: 'kg', icon: '⚖️' },
  { type: 'body_fat' as const, label: 'Body Fat', unit: '%', icon: '📊' },
  { type: 'muscle_mass' as const, label: 'Muscle Mass', unit: 'kg', icon: '💪' },
  { type: 'chest' as const, label: 'Chest', unit: 'cm', icon: '📏' },
  { type: 'waist' as const, label: 'Waist', unit: 'cm', icon: '📏' },
  { type: 'arms' as const, label: 'Arms', unit: 'cm', icon: '💪' },
  { type: 'thighs' as const, label: 'Thighs', unit: 'cm', icon: '🦵' },
];

export function MeasurementsTracker({ measurements, onAddMeasurement }: MeasurementsTrackerProps) {
  const [showAddForm, setShowAddForm] = useState(false);
  const [selectedType, setSelectedType] = useState<Measurement['type']>('weight');
  const [value, setValue] = useState('');
  const [notes, setNotes] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!value.trim()) return;

    const measurementType = measurementTypes.find(t => t.type === selectedType);
    if (!measurementType) return;

    onAddMeasurement({
      type: selectedType,
      value: parseFloat(value),
      unit: measurementType.unit,
      date: new Date(),
      notes: notes.trim() || undefined,
    });

    setValue('');
    setNotes('');
    setShowAddForm(false);
  };

  const groupedMeasurements = measurements.reduce((groups, measurement) => {
    const key = measurement.type;
    if (!groups[key]) {
      groups[key] = [];
    }
    groups[key].push(measurement);
    return groups;
  }, {} as Record<string, Measurement[]>);

  const getLatestMeasurement = (type: Measurement['type']) => {
    const typeMeasurements = groupedMeasurements[type] || [];
    return typeMeasurements.sort((a, b) => b.date.getTime() - a.date.getTime())[0];
  };

  const getTrend = (type: Measurement['type']) => {
    const typeMeasurements = (groupedMeasurements[type] || [])
      .sort((a, b) => b.date.getTime() - a.date.getTime());
    
    if (typeMeasurements.length < 2) return null;
    
    const latest = typeMeasurements[0];
    const previous = typeMeasurements[1];
    const change = latest.value - previous.value;
    
    return {
      change,
      percentage: previous.value !== 0 ? (change / previous.value) * 100 : 0,
      isPositive: change > 0,
    };
  };

  if (measurements.length === 0 && !showAddForm) {
    return (
      <div className="text-center py-12">
        <div className="text-6xl mb-4">📏</div>
        <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
          No measurements
        </h3>
        <p className="text-gray-600 dark:text-gray-400 mb-6">
          Start tracking the progress of your body measurements and progress pictures
        </p>
        
        <div className="space-y-3 max-w-sm mx-auto">
          <Button
            variant="primary"
            onClick={() => setShowAddForm(true)}
            className="w-full"
          >
            + Add Measurement
          </Button>
          
          <Button variant="secondary" className="w-full">
            📷 Add Progress Picture
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-gray-900 dark:text-white">
          Measurements
        </h2>
        <Button
          variant="primary"
          size="sm"
          onClick={() => setShowAddForm(true)}
        >
          +
        </Button>
      </div>

      {/* Add Measurement Form */}
      <AnimatePresence>
        {showAddForm && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
          >
            <Card className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Add Measurement
              </h3>
              
              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Measurement Type */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Type
                  </label>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                    {measurementTypes.map((type) => (
                      <button
                        key={type.type}
                        type="button"
                        onClick={() => setSelectedType(type.type)}
                        className={`
                          p-3 rounded-lg border text-sm font-medium transition-all
                          ${selectedType === type.type
                            ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400'
                            : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                          }
                        `}
                      >
                        <div className="text-lg mb-1">{type.icon}</div>
                        <div>{type.label}</div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Value */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Value ({measurementTypes.find(t => t.type === selectedType)?.unit})
                  </label>
                  <Input
                    type="number"
                    step="0.1"
                    value={value}
                    onChange={(e) => setValue(e.target.value)}
                    placeholder="Enter value"
                    required
                  />
                </div>

                {/* Notes */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Notes (optional)
                  </label>
                  <Input
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Add any notes..."
                  />
                </div>

                {/* Actions */}
                <div className="flex gap-3">
                  <Button type="submit" variant="primary">
                    Add Measurement
                  </Button>
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={() => setShowAddForm(false)}
                  >
                    Cancel
                  </Button>
                </div>
              </form>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Measurements Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {measurementTypes.map((type) => {
          const latest = getLatestMeasurement(type.type);
          const trend = getTrend(type.type);
          
          if (!latest) return null;

          return (
            <Card key={type.type} className="p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <span className="text-lg">{type.icon}</span>
                  <span className="font-medium text-gray-900 dark:text-white">
                    {type.label}
                  </span>
                </div>
                {trend && (
                  <div className={`
                    text-xs px-2 py-1 rounded-full
                    ${trend.isPositive 
                      ? 'bg-green-100 dark:bg-green-900 text-green-600 dark:text-green-400' 
                      : 'bg-red-100 dark:bg-red-900 text-red-600 dark:text-red-400'
                    }
                  `}>
                    {trend.isPositive ? '+' : ''}{trend.change.toFixed(1)} {type.unit}
                  </div>
                )}
              </div>
              
              <div className="text-2xl font-bold text-gray-900 dark:text-white mb-1">
                {latest.value} {type.unit}
              </div>
              
              <div className="text-sm text-gray-600 dark:text-gray-400">
                {latest.date.toLocaleDateString()}
              </div>
              
              {latest.notes && (
                <div className="text-sm text-gray-500 dark:text-gray-500 mt-2">
                  {latest.notes}
                </div>
              )}
            </Card>
          );
        })}
      </div>

      {/* Progress Pictures Section */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Progress Pictures
          </h3>
          <Button variant="secondary" size="sm">
            📷 Add Picture
          </Button>
        </div>
        
        <div className="text-center py-8 text-gray-500 dark:text-gray-400">
          <div className="text-4xl mb-2">📷</div>
          <p>No progress pictures yet</p>
          <p className="text-sm">Add photos to track your visual progress</p>
        </div>
      </Card>

      {/* Recent Measurements */}
      {measurements.length > 0 && (
        <Card className="p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Recent Measurements
          </h3>
          
          <div className="space-y-3">
            {measurements
              .sort((a, b) => b.date.getTime() - a.date.getTime())
              .slice(0, 5)
              .map((measurement) => {
                const type = measurementTypes.find(t => t.type === measurement.type);
                return (
                  <div
                    key={measurement.id}
                    className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg"
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-lg">{type?.icon}</span>
                      <div>
                        <div className="font-medium text-gray-900 dark:text-white">
                          {type?.label}
                        </div>
                        <div className="text-sm text-gray-600 dark:text-gray-400">
                          {measurement.date.toLocaleDateString()}
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-bold text-gray-900 dark:text-white">
                        {measurement.value} {measurement.unit}
                      </div>
                      {measurement.notes && (
                        <div className="text-xs text-gray-500 dark:text-gray-500">
                          {measurement.notes}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
          </div>
        </Card>
      )}
    </div>
  );
}
/**
 * Diet Plan Page Component
 * 
 * Main page component that orchestrates the diet plan functionality.
 * Handles navigation between list view, generator, and individual plan views.
 * 
 * Requirements: 2.1, 2.3
 */

'use client';

import React, { useState } from 'react';
import { DietPlanList } from './DietPlanList';
import { DietPlanGenerator } from './DietPlanGenerator';
import { AITransformationPlanGenerator } from './AITransformationPlanGenerator';
import { DietPlanView } from './DietPlanView';
import { useDietPlan } from '../../hooks/useDietPlan';
import { TransformationPlan } from '../../lib/aiNutritionEngine';

type ViewMode = 'list' | 'generator' | 'ai_generator' | 'view' | 'edit';

interface DietPlanPageProps {
  initialView?: ViewMode;
  initialPlanId?: string;
  className?: string;
}

export function DietPlanPage({ 
  initialView = 'list', 
  initialPlanId,
  className = '' 
}: DietPlanPageProps) {
  const [currentView, setCurrentView] = useState<ViewMode>(initialView);
  const [selectedPlanId, setSelectedPlanId] = useState<string | null>(initialPlanId || null);
  const [generatorType, setGeneratorType] = useState<'basic' | 'ai'>('ai');
  
  const { 
    plans, 
    currentPlan, 
    loadPlan, 
    setCurrentPlan, 
    deletePlan 
  } = useDietPlan();

  const handleViewPlan = async (planId: string) => {
    try {
      await loadPlan(planId);
      setSelectedPlanId(planId);
      setCurrentView('view');
    } catch (error) {
      console.error('Failed to load plan:', error);
    }
  };

  const handleEditPlan = async (planId: string) => {
    try {
      await loadPlan(planId);
      setSelectedPlanId(planId);
      setCurrentView('edit');
    } catch (error) {
      console.error('Failed to load plan for editing:', error);
    }
  };

  const handleCreateNew = () => {
    setCurrentPlan(null);
    setSelectedPlanId(null);
    setCurrentView(generatorType === 'ai' ? 'ai_generator' : 'generator');
  };

  const handlePlanGenerated = (planId: string) => {
    setSelectedPlanId(planId);
    setCurrentView('view');
  };

  const handleAIPlanGenerated = (plan: TransformationPlan) => {
    // For now, just show the plan details
    // In a full implementation, this would save to the database
    console.log('AI Plan Generated:', plan);
    setCurrentView('list');
  };

  const handleDeletePlan = async () => {
    if (selectedPlanId) {
      try {
        await deletePlan(selectedPlanId);
        setCurrentPlan(null);
        setSelectedPlanId(null);
        setCurrentView('list');
      } catch (error) {
        console.error('Failed to delete plan:', error);
      }
    }
  };

  const handleBackToList = () => {
    setCurrentPlan(null);
    setSelectedPlanId(null);
    setCurrentView('list');
  };

  const renderCurrentView = () => {
    switch (currentView) {
      case 'list':
        return (
          <div className="space-y-6">
            {/* Generator Type Toggle */}
            <div className="bg-white rounded-lg shadow-sm border p-4">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-semibold text-gray-900 mb-1">
                    Choose Your Plan Type
                  </h2>
                  <p className="text-sm text-gray-600">
                    Select between basic meal planning or advanced AI transformation system
                  </p>
                </div>
                <div className="flex bg-gray-100 rounded-lg p-1">
                  <button
                    onClick={() => setGeneratorType('basic')}
                    className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                      generatorType === 'basic'
                        ? 'bg-white text-blue-600 shadow-sm'
                        : 'text-gray-600 hover:text-gray-900'
                    }`}
                  >
                    Basic Plans
                  </button>
                  <button
                    onClick={() => setGeneratorType('ai')}
                    className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                      generatorType === 'ai'
                        ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-sm'
                        : 'text-gray-600 hover:text-gray-900'
                    }`}
                  >
                    🤖 AI Engine
                  </button>
                </div>
              </div>
              
              {generatorType === 'ai' && (
                <div className="mt-4 p-4 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg border border-blue-200">
                  <div className="flex items-start">
                    <div className="text-2xl mr-3">🚀</div>
                    <div>
                      <h3 className="font-semibold text-blue-900 mb-1">
                        AI Performance Nutrition Engine
                      </h3>
                      <p className="text-sm text-blue-800">
                        Advanced metabolic analysis • Body composition optimization • Progressive programming • Plateau prevention
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
            
            <DietPlanList
              onViewPlan={handleViewPlan}
              onEditPlan={handleEditPlan}
              onCreateNew={handleCreateNew}
            />
          </div>
        );

      case 'generator':
        return (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h1 className="text-2xl font-bold text-gray-900">
                Create New Diet Plan
              </h1>
              <button
                onClick={handleBackToList}
                className="text-blue-600 hover:text-blue-700 text-sm font-medium"
              >
                ← Back to Plans
              </button>
            </div>
            
            <DietPlanGenerator
              onPlanGenerated={handlePlanGenerated}
            />
          </div>
        );

      case 'ai_generator':
        return (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                  🤖 AI Transformation System
                </h1>
                <p className="text-gray-600 mt-1">
                  Advanced metabolic analysis with intelligent progression programming
                </p>
              </div>
              <button
                onClick={handleBackToList}
                className="text-blue-600 hover:text-blue-700 text-sm font-medium"
              >
                ← Back to Plans
              </button>
            </div>
            
            <AITransformationPlanGenerator
              onPlanGenerated={handleAIPlanGenerated}
            />
          </div>
        );

      case 'view':
        return currentPlan ? (
          <DietPlanView
            plan={currentPlan}
            onEdit={() => setCurrentView('edit')}
            onDelete={handleDeletePlan}
            onBack={handleBackToList}
          />
        ) : (
          <div className="text-center py-8">
            <p className="text-gray-600">Plan not found</p>
            <button
              onClick={handleBackToList}
              className="text-blue-600 hover:text-blue-700 mt-2"
            >
              Back to Plans
            </button>
          </div>
        );

      case 'edit':
        return currentPlan ? (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h1 className="text-2xl font-bold text-gray-900">
                Edit Diet Plan
              </h1>
              <div className="flex gap-2">
                <button
                  onClick={() => setCurrentView('view')}
                  className="text-blue-600 hover:text-blue-700 text-sm font-medium"
                >
                  Cancel
                </button>
                <button
                  onClick={handleBackToList}
                  className="text-gray-600 hover:text-gray-700 text-sm font-medium"
                >
                  ← Back to Plans
                </button>
              </div>
            </div>
            
            {/* Edit functionality would go here - for now, show the generator */}
            <DietPlanGenerator
              onPlanGenerated={(planId) => {
                setSelectedPlanId(planId);
                setCurrentView('view');
              }}
            />
          </div>
        ) : (
          <div className="text-center py-8">
            <p className="text-gray-600">Plan not found</p>
            <button
              onClick={handleBackToList}
              className="text-blue-600 hover:text-blue-700 mt-2"
            >
              Back to Plans
            </button>
          </div>
        );

      default:
        return (
          <div className="text-center py-8">
            <p className="text-gray-600">Unknown view</p>
            <button
              onClick={handleBackToList}
              className="text-blue-600 hover:text-blue-700 mt-2"
            >
              Back to Plans
            </button>
          </div>
        );
    }
  };

  return (
    <div className={`min-h-screen bg-gray-50 ${className}`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {renderCurrentView()}
      </div>
    </div>
  );
}
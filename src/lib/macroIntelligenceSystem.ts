/**
 * Macro Intelligence System
 * 
 * Advanced macronutrient distribution system with dynamic protein targets,
 * carb cycling, and goal-specific optimizations for the AI Performance Nutrition Engine.
 */

import { AdvancedPersonalMetrics, BodyCompositionAnalysis } from './advancedMetabolicAnalysis';

export interface MacroDistribution {
  protein: number; // grams
  carbohydrates: number; // grams
  fats: number; // grams
  fiber: number; // grams
  calories: number; // total calories
}

export interface MacroStrategy {
  baseDistribution: MacroDistribution;
  trainingDayDistribution?: MacroDistribution;
  restDayDistribution?: MacroDistribution;
  macroCycling: boolean;
  proteinTarget: {
    grams: number;
    gramsPerKg: number;
    method: 'bodyweight' | 'lean_body_mass';
  };
  carbCycling?: {
    enabled: boolean;
    trainingDayCarbs: number;
    restDayCarbs: number;
    cycleRatio: number;
  };
  fatAllocation: {
    percentage: number;
    grams: number;
    range: 'low' | 'moderate' | 'high';
  };
}

/**
 * Calculate dynamic protein targets based on goal and body composition
 */
export function calculateDynamicProtein(
  metrics: AdvancedPersonalMetrics,
  bodyComposition: BodyCompositionAnalysis,
  goal: 'fat_loss' | 'muscle_gain' | 'recomposition' | 'endurance'
): { grams: number; gramsPerKg: number; method: 'bodyweight' | 'lean_body_mass' } {
  
  const proteinTargets = {
    fat_loss: { bodyweight: 2.2, leanMass: 2.8 },
    muscle_gain: { bodyweight: 1.8, leanMass: 2.4 },
    recomposition: { bodyweight: 2.2, leanMass: 2.8 },
    endurance: { bodyweight: 1.6, leanMass: 2.0 }
  };
  
  const targets = proteinTargets[goal];
  const useLeanMass = bodyComposition.estimatedMethod === 'provided' || 
                     bodyComposition.leanBodyMass > metrics.weight * 0.6;
  
  if (useLeanMass) {
    const gramsPerKgLean = targets.leanMass;
    const totalGrams = Math.round(bodyComposition.leanBodyMass * gramsPerKgLean);
    
    return {
      grams: totalGrams,
      gramsPerKg: gramsPerKgLean,
      method: 'lean_body_mass'
    };
  } else {
    const gramsPerKgBody = targets.bodyweight;
    const totalGrams = Math.round(metrics.weight * gramsPerKgBody);
    
    return {
      grams: totalGrams,
      gramsPerKg: gramsPerKgBody,
      method: 'bodyweight'
    };
  }
}

/**
 * Create carb cycling strategy for Pro users
 */
export function createCarbCyclingStrategy(
  targetCalories: number,
  proteinGrams: number,
  subscriptionTier: 'free' | 'pro' = 'free',
  trainingDaysPerWeek: number = 3
): { enabled: boolean; trainingDayCarbs: number; restDayCarbs: number; cycleRatio: number } | null {
  
  if (subscriptionTier === 'free') {
    return null; // Carb cycling is Pro feature only
  }
  
  // Calculate available calories after protein
  const proteinCalories = proteinGrams * 4;
  const remainingCalories = targetCalories - proteinCalories;
  
  // Allocate 25% to fats, rest to carbs
  const fatCalories = remainingCalories * 0.25;
  const carbCalories = remainingCalories * 0.75;
  
  // Training day: +20% carbs, Rest day: -20% carbs
  const trainingDayCarbs = Math.round((carbCalories * 1.2) / 4);
  const restDayCarbs = Math.round((carbCalories * 0.8) / 4);
  const cycleRatio = trainingDayCarbs / restDayCarbs;
  
  return {
    enabled: true,
    trainingDayCarbs,
    restDayCarbs,
    cycleRatio
  };
}

/**
 * Calculate fat allocation within healthy ranges
 */
export function calculateFatAllocation(
  targetCalories: number,
  proteinGrams: number,
  carbGrams: number,
  goal: 'fat_loss' | 'muscle_gain' | 'recomposition' | 'endurance'
): { percentage: number; grams: number; range: 'low' | 'moderate' | 'high' } {
  
  // Calculate remaining calories after protein and carbs
  const proteinCalories = proteinGrams * 4;
  const carbCalories = carbGrams * 4;
  const remainingCalories = targetCalories - proteinCalories - carbCalories;
  
  // Goal-specific fat ranges (% of total calories)
  const fatRanges = {
    fat_loss: { min: 0.20, max: 0.30, optimal: 0.25 },
    muscle_gain: { min: 0.20, max: 0.30, optimal: 0.25 },
    recomposition: { min: 0.25, max: 0.35, optimal: 0.30 },
    endurance: { min: 0.15, max: 0.25, optimal: 0.20 }
  };
  
  const range = fatRanges[goal];
  let fatPercentage = remainingCalories / targetCalories;
  
  // Ensure within healthy range
  fatPercentage = Math.max(range.min, Math.min(range.max, fatPercentage));
  
  const fatGrams = Math.round((targetCalories * fatPercentage) / 9);
  
  let fatRange: 'low' | 'moderate' | 'high';
  if (fatPercentage < 0.22) {
    fatRange = 'low';
  } else if (fatPercentage > 0.32) {
    fatRange = 'high';
  } else {
    fatRange = 'moderate';
  }
  
  return {
    percentage: Math.round(fatPercentage * 100),
    grams: fatGrams,
    range: fatRange
  };
}

/**
 * Apply diet type macro adjustments
 */
export function applyDietTypeAdjustments(
  baseDistribution: MacroDistribution,
  dietType: 'standard' | 'vegetarian' | 'vegan' | 'keto' | 'paleo' | 'mediterranean' | 'low_carb'
): MacroDistribution {
  
  const adjustedDistribution = { ...baseDistribution };
  
  switch (dietType) {
    case 'keto':
      // Keto: 70-80% fat, 15-25% protein, 5-10% carbs
      const ketoCalories = baseDistribution.calories;
      adjustedDistribution.carbohydrates = Math.min(25, Math.round((ketoCalories * 0.05) / 4));
      adjustedDistribution.protein = Math.round((ketoCalories * 0.20) / 4);
      adjustedDistribution.fats = Math.round((ketoCalories * 0.75) / 9);
      break;
      
    case 'low_carb':
      // Low carb: 40-50% fat, 25-35% protein, 20-30% carbs
      const lcCalories = baseDistribution.calories;
      adjustedDistribution.carbohydrates = Math.round((lcCalories * 0.25) / 4);
      adjustedDistribution.protein = Math.round((lcCalories * 0.30) / 4);
      adjustedDistribution.fats = Math.round((lcCalories * 0.45) / 9);
      break;
      
    case 'mediterranean':
      // Mediterranean: Higher healthy fats (35-40%), moderate carbs
      const medCalories = baseDistribution.calories;
      adjustedDistribution.fats = Math.round((medCalories * 0.35) / 9);
      break;
      
    case 'vegan':
    case 'vegetarian':
      // Increase protein slightly to account for plant protein quality
      adjustedDistribution.protein = Math.round(adjustedDistribution.protein * 1.1);
      break;
      
    default:
      // No adjustments for standard, paleo
      break;
  }
  
  // Recalculate fiber based on carbs
  adjustedDistribution.fiber = Math.round((adjustedDistribution.calories / 1000) * 14);
  
  return adjustedDistribution;
}

/**
 * Generate complete macro strategy
 */
export function generateMacroStrategy(
  targetCalories: number,
  metrics: AdvancedPersonalMetrics,
  bodyComposition: BodyCompositionAnalysis,
  goal: 'fat_loss' | 'muscle_gain' | 'recomposition' | 'endurance',
  dietType: 'standard' | 'vegetarian' | 'vegan' | 'keto' | 'paleo' | 'mediterranean' | 'low_carb' = 'standard'
): MacroStrategy {
  
  // Calculate dynamic protein target
  const proteinTarget = calculateDynamicProtein(metrics, bodyComposition, goal);
  
  // Create base macro distribution
  let baseDistribution: MacroDistribution = {
    protein: proteinTarget.grams,
    carbohydrates: 0,
    fats: 0,
    fiber: 0,
    calories: targetCalories
  };
  
  // Calculate remaining calories after protein
  const proteinCalories = proteinTarget.grams * 4;
  const remainingCalories = targetCalories - proteinCalories;
  
  // Default carb/fat split based on goal
  const carbFatSplits = {
    fat_loss: { carbs: 0.45, fats: 0.55 },
    muscle_gain: { carbs: 0.60, fats: 0.40 },
    recomposition: { carbs: 0.50, fats: 0.50 },
    endurance: { carbs: 0.70, fats: 0.30 }
  };
  
  const split = carbFatSplits[goal];
  baseDistribution.carbohydrates = Math.round((remainingCalories * split.carbs) / 4);
  baseDistribution.fats = Math.round((remainingCalories * split.fats) / 9);
  baseDistribution.fiber = Math.round((targetCalories / 1000) * 14);
  
  // Apply diet type adjustments
  baseDistribution = applyDietTypeAdjustments(baseDistribution, dietType);
  
  // Calculate fat allocation details
  const fatAllocation = calculateFatAllocation(
    targetCalories,
    baseDistribution.protein,
    baseDistribution.carbohydrates,
    goal
  );
  
  // Create carb cycling strategy (Pro feature)
  const carbCycling = createCarbCyclingStrategy(
    targetCalories,
    proteinTarget.grams,
    metrics.subscriptionTier,
    metrics.trainingDaysPerWeek
  );
  
  const strategy: MacroStrategy = {
    baseDistribution,
    macroCycling: carbCycling?.enabled || false,
    proteinTarget,
    fatAllocation
  };
  
  // Add cycling distributions if enabled
  if (carbCycling?.enabled) {
    strategy.carbCycling = carbCycling;
    
    // Training day distribution
    strategy.trainingDayDistribution = {
      ...baseDistribution,
      carbohydrates: carbCycling.trainingDayCarbs,
      fats: Math.round((targetCalories - (proteinTarget.grams * 4) - (carbCycling.trainingDayCarbs * 4)) / 9)
    };
    
    // Rest day distribution
    strategy.restDayDistribution = {
      ...baseDistribution,
      carbohydrates: carbCycling.restDayCarbs,
      fats: Math.round((targetCalories - (proteinTarget.grams * 4) - (carbCycling.restDayCarbs * 4)) / 9)
    };
  }
  
  return strategy;
}

/**
 * Validate macro distribution for nutritional adequacy
 */
export function validateMacroDistribution(
  distribution: MacroDistribution
): { isValid: boolean; warnings: string[] } {
  const warnings: string[] = [];
  
  // Check protein adequacy (minimum 0.8g/kg bodyweight)
  const proteinPercentage = (distribution.protein * 4) / distribution.calories;
  if (proteinPercentage < 0.10) {
    warnings.push('Protein intake may be too low for optimal health');
  }
  
  // Check fat adequacy (minimum 20% of calories)
  const fatPercentage = (distribution.fats * 9) / distribution.calories;
  if (fatPercentage < 0.20) {
    warnings.push('Fat intake may be too low for hormone production');
  }
  
  // Check carb adequacy (minimum for brain function)
  if (distribution.carbohydrates < 50) {
    warnings.push('Very low carb intake - ensure adequate electrolyte balance');
  }
  
  // Check fiber adequacy
  const fiberTarget = (distribution.calories / 1000) * 14;
  if (distribution.fiber < fiberTarget * 0.8) {
    warnings.push('Fiber intake may be insufficient for digestive health');
  }
  
  return {
    isValid: warnings.length === 0,
    warnings
  };
}
/**
 * Unit Tests for Nutrition Calculation Service
 * 
 * Tests BMI calculation, caloric needs algorithms, and macronutrient distributions
 * Requirements: 2.1, 2.2
 */

import {
  calculateBMI,
  categorizeBMI,
  calculateBMR,
  calculateTDEE,
  calculateTargetCalories,
  calculateMacronutrients,
  calculateNutritionProfile,
  generateNutritionRecommendations,
  unitConversions,
  validateMetrics
} from '../nutritionCalculationService';
import { PersonalMetrics } from '../../types';

describe('Nutrition Calculation Service', () => {
  // Sample user metrics for testing
  const sampleMetrics: PersonalMetrics = {
    height: 175, // 5'9"
    weight: 70,  // 154 lbs
    age: 30,
    gender: 'male',
    activityLevel: 'moderate',
    fitnessGoals: ['maintenance']
  };

  const femaleMetrics: PersonalMetrics = {
    height: 165, // 5'5"
    weight: 60,  // 132 lbs
    age: 25,
    gender: 'female',
    activityLevel: 'active',
    fitnessGoals: ['weight_loss']
  };

  describe('BMI Calculations', () => {
    test('should calculate BMI correctly', () => {
      // Test case: 70kg, 175cm = 22.9 BMI
      const bmi = calculateBMI(175, 70);
      expect(bmi).toBe(22.9);
    });

    test('should calculate BMI for different heights and weights', () => {
      expect(calculateBMI(180, 80)).toBe(24.7); // Normal
      expect(calculateBMI(160, 45)).toBe(17.6); // Underweight
      expect(calculateBMI(170, 90)).toBe(31.1); // Obese
    });

    test('should throw error for invalid inputs', () => {
      expect(() => calculateBMI(0, 70)).toThrow('Height and weight must be positive numbers');
      expect(() => calculateBMI(175, 0)).toThrow('Height and weight must be positive numbers');
      expect(() => calculateBMI(-175, 70)).toThrow('Height and weight must be positive numbers');
    });

    test('should categorize BMI correctly', () => {
      expect(categorizeBMI(17.5)).toBe('underweight');
      expect(categorizeBMI(22.0)).toBe('normal');
      expect(categorizeBMI(27.0)).toBe('overweight');
      expect(categorizeBMI(32.0)).toBe('obese');
    });

    test('should handle BMI boundary values', () => {
      expect(categorizeBMI(18.5)).toBe('normal');
      expect(categorizeBMI(24.9)).toBe('normal');
      expect(categorizeBMI(25.0)).toBe('overweight');
      expect(categorizeBMI(29.9)).toBe('overweight');
      expect(categorizeBMI(30.0)).toBe('obese');
    });
  });

  describe('BMR Calculations', () => {
    test('should calculate BMR for male correctly', () => {
      // Male: 10 × 70 + 6.25 × 175 - 5 × 30 + 5 = 700 + 1093.75 - 150 + 5 = 1648.75 ≈ 1649
      const bmr = calculateBMR(sampleMetrics);
      expect(bmr).toBe(1649);
    });

    test('should calculate BMR for female correctly', () => {
      // Female: 10 × 60 + 6.25 × 165 - 5 × 25 - 161 = 600 + 1031.25 - 125 - 161 = 1345.25 ≈ 1345
      const bmr = calculateBMR(femaleMetrics);
      expect(bmr).toBe(1345);
    });

    test('should handle different ages and body compositions', () => {
      const youngMale = { ...sampleMetrics, age: 20 };
      const olderMale = { ...sampleMetrics, age: 50 };
      
      const youngBMR = calculateBMR(youngMale);
      const olderBMR = calculateBMR(olderMale);
      
      // Younger person should have higher BMR
      expect(youngBMR).toBeGreaterThan(olderBMR);
      expect(youngBMR - olderBMR).toBe(150); // 30 years × 5 = 150 calories
    });

    test('should throw error for invalid metrics', () => {
      const invalidMetrics = { ...sampleMetrics, weight: 0 };
      expect(() => calculateBMR(invalidMetrics)).toThrow('Weight, height, and age must be positive numbers');
    });
  });

  describe('TDEE Calculations', () => {
    test('should calculate TDEE correctly for different activity levels', () => {
      const bmr = 1644;
      
      expect(calculateTDEE(bmr, 'sedentary')).toBe(1973); // 1644 × 1.2
      expect(calculateTDEE(bmr, 'light')).toBe(2261);     // 1644 × 1.375
      expect(calculateTDEE(bmr, 'moderate')).toBe(2548);  // 1644 × 1.55
      expect(calculateTDEE(bmr, 'active')).toBe(2836);    // 1644 × 1.725
      expect(calculateTDEE(bmr, 'very_active')).toBe(3124); // 1644 × 1.9
    });

    test('should round TDEE to nearest whole number', () => {
      const bmr = 1643; // Will result in non-integer TDEE
      const tdee = calculateTDEE(bmr, 'moderate');
      expect(Number.isInteger(tdee)).toBe(true);
    });
  });

  describe('Target Calorie Calculations', () => {
    test('should calculate target calories for different goals', () => {
      const tdee = 2500;
      
      const weightLoss = calculateTargetCalories(tdee, 'weight_loss');
      expect(weightLoss.targetCalories).toBe(2000); // 20% deficit
      expect(weightLoss.adjustment).toBe(-0.2);
      
      const muscleGain = calculateTargetCalories(tdee, 'muscle_gain');
      expect(muscleGain.targetCalories).toBe(2875); // 15% surplus
      expect(muscleGain.adjustment).toBe(0.15);
      
      const maintenance = calculateTargetCalories(tdee, 'maintenance');
      expect(maintenance.targetCalories).toBe(2500); // No change
      expect(maintenance.adjustment).toBe(0);
      
      const endurance = calculateTargetCalories(tdee, 'endurance');
      expect(endurance.targetCalories).toBe(2750); // 10% surplus
      expect(endurance.adjustment).toBe(0.1);
    });
  });

  describe('Macronutrient Calculations', () => {
    test('should calculate macronutrients for weight loss', () => {
      const macros = calculateMacronutrients(2000, 'weight_loss');
      
      // Weight loss: 35% protein, 35% carbs, 30% fat
      expect(macros.protein).toBe(175);      // 2000 × 0.35 / 4
      expect(macros.carbohydrates).toBe(175); // 2000 × 0.35 / 4
      expect(macros.fats).toBe(67);          // 2000 × 0.30 / 9
      expect(macros.fiber).toBe(28);         // 2000 / 1000 × 14
    });

    test('should calculate macronutrients for muscle gain', () => {
      const macros = calculateMacronutrients(2800, 'muscle_gain');
      
      // Muscle gain: 30% protein, 45% carbs, 25% fat
      expect(macros.protein).toBe(210);      // 2800 × 0.30 / 4
      expect(macros.carbohydrates).toBe(315); // 2800 × 0.45 / 4
      expect(macros.fats).toBe(78);          // 2800 × 0.25 / 9
      expect(macros.fiber).toBe(39);         // 2800 / 1000 × 14
    });

    test('should calculate macronutrients for endurance', () => {
      const macros = calculateMacronutrients(2600, 'endurance');
      
      // Endurance: 20% protein, 60% carbs, 20% fat
      expect(macros.protein).toBe(130);      // 2600 × 0.20 / 4
      expect(macros.carbohydrates).toBe(390); // 2600 × 0.60 / 4
      expect(macros.fats).toBe(58);          // 2600 × 0.20 / 9
      expect(macros.fiber).toBe(36);         // 2600 / 1000 × 14
    });

    test('should round macronutrients to whole numbers', () => {
      const macros = calculateMacronutrients(2333, 'maintenance');
      
      expect(Number.isInteger(macros.protein)).toBe(true);
      expect(Number.isInteger(macros.carbohydrates)).toBe(true);
      expect(Number.isInteger(macros.fats)).toBe(true);
      expect(Number.isInteger(macros.fiber)).toBe(true);
    });
  });

  describe('Complete Nutrition Profile', () => {
    test('should calculate complete nutrition profile', () => {
      const profile = calculateNutritionProfile(sampleMetrics, 'maintenance');
      
      expect(profile.bmi).toBe(22.9);
      expect(profile.bmiCategory).toBe('normal');
      expect(profile.calorieRequirements.bmr).toBe(1649);
      expect(profile.calorieRequirements.tdee).toBe(2556);
      expect(profile.calorieRequirements.targetCalories).toBe(2556);
      expect(profile.calorieRequirements.goalAdjustment).toBe(0);
      expect(profile.macronutrients).toBeDefined();
      expect(profile.recommendations).toBeInstanceOf(Array);
      expect(profile.recommendations.length).toBeGreaterThan(0);
    });

    test('should generate different profiles for different goals', () => {
      const maintenanceProfile = calculateNutritionProfile(sampleMetrics, 'maintenance');
      const weightLossProfile = calculateNutritionProfile(sampleMetrics, 'weight_loss');
      
      expect(weightLossProfile.calorieRequirements.targetCalories)
        .toBeLessThan(maintenanceProfile.calorieRequirements.targetCalories);
      
      expect(weightLossProfile.macronutrients.protein)
        .toBeGreaterThan(maintenanceProfile.macronutrients.protein);
    });
  });

  describe('Nutrition Recommendations', () => {
    test('should generate BMI-specific recommendations', () => {
      const underweightRecommendations = generateNutritionRecommendations(
        17.0, 'underweight', 'muscle_gain', sampleMetrics
      );
      
      expect(underweightRecommendations).toContain(
        'Focus on nutrient-dense, calorie-rich foods to gain healthy weight'
      );
      expect(underweightRecommendations).toContain(
        'Consider strength training to build muscle mass'
      );
    });

    test('should generate goal-specific recommendations', () => {
      const weightLossRecommendations = generateNutritionRecommendations(
        27.0, 'overweight', 'weight_loss', sampleMetrics
      );
      
      expect(weightLossRecommendations.some(rec => 
        rec.includes('protein') && rec.includes('satiety')
      )).toBe(true);
      
      expect(weightLossRecommendations.some(rec => 
        rec.includes('vegetables')
      )).toBe(true);
    });

    test('should generate age-specific recommendations', () => {
      const olderMetrics = { ...sampleMetrics, age: 55 };
      const recommendations = generateNutritionRecommendations(
        22.0, 'normal', 'maintenance', olderMetrics
      );
      
      expect(recommendations.some(rec => 
        rec.includes('protein') && rec.includes('muscle loss')
      )).toBe(true);
      
      expect(recommendations.some(rec => 
        rec.includes('calcium') && rec.includes('vitamin D')
      )).toBe(true);
    });

    test('should generate activity-specific recommendations', () => {
      const sedentaryMetrics = { ...sampleMetrics, activityLevel: 'sedentary' as const };
      const recommendations = generateNutritionRecommendations(
        22.0, 'normal', 'maintenance', sedentaryMetrics
      );
      
      expect(recommendations.some(rec => 
        rec.includes('increasing daily activity')
      )).toBe(true);
    });
  });

  describe('Unit Conversions', () => {
    test('should convert weight units correctly', () => {
      expect(unitConversions.kgToLbs(70)).toBe(154.3);
      expect(unitConversions.lbsToKg(154)).toBe(69.9);
    });

    test('should convert height units correctly', () => {
      expect(unitConversions.cmToInches(175)).toBe(68.9);
      expect(unitConversions.inchesToCm(69)).toBe(175.3);
    });

    test('should convert to feet and inches', () => {
      const result = unitConversions.cmToFeetInches(175);
      expect(result.feet).toBe(5);
      expect(result.inches).toBe(8.9);
    });

    test('should convert from feet and inches', () => {
      const cm = unitConversions.feetInchesToCm(5, 9);
      expect(cm).toBe(175.3);
    });
  });

  describe('Metrics Validation', () => {
    test('should validate correct metrics', () => {
      const validation = validateMetrics(sampleMetrics);
      expect(validation.isValid).toBe(true);
      expect(validation.errors).toHaveLength(0);
    });

    test('should reject invalid height', () => {
      const invalidMetrics = { ...sampleMetrics, height: 50 };
      const validation = validateMetrics(invalidMetrics);
      expect(validation.isValid).toBe(false);
      expect(validation.errors).toContain('Height must be between 100-250 cm (3\'3" - 8\'2")');
    });

    test('should reject invalid weight', () => {
      const invalidMetrics = { ...sampleMetrics, weight: 20 };
      const validation = validateMetrics(invalidMetrics);
      expect(validation.isValid).toBe(false);
      expect(validation.errors).toContain('Weight must be between 30-300 kg (66-661 lbs)');
    });

    test('should reject invalid age', () => {
      const invalidMetrics = { ...sampleMetrics, age: 10 };
      const validation = validateMetrics(invalidMetrics);
      expect(validation.isValid).toBe(false);
      expect(validation.errors).toContain('Age must be between 13-120 years');
    });

    test('should reject invalid activity level', () => {
      const invalidMetrics = { ...sampleMetrics, activityLevel: 'invalid' as any };
      const validation = validateMetrics(invalidMetrics);
      expect(validation.isValid).toBe(false);
      expect(validation.errors).toContain(
        'Activity level must be one of: sedentary, light, moderate, active, very_active'
      );
    });

    test('should collect multiple validation errors', () => {
      const invalidMetrics = {
        ...sampleMetrics,
        height: 50,
        weight: 20,
        age: 10
      };
      const validation = validateMetrics(invalidMetrics);
      expect(validation.isValid).toBe(false);
      expect(validation.errors).toHaveLength(3);
    });
  });

  describe('Edge Cases and Error Handling', () => {
    test('should handle extreme but valid values', () => {
      const extremeMetrics: PersonalMetrics = {
        height: 250, // Very tall
        weight: 150, // Heavy
        age: 80,     // Elderly
        gender: 'other',
        activityLevel: 'very_active',
        fitnessGoals: ['endurance']
      };
      
      expect(() => calculateNutritionProfile(extremeMetrics)).not.toThrow();
      const profile = calculateNutritionProfile(extremeMetrics);
      expect(profile.bmi).toBeGreaterThan(0);
      expect(profile.calorieRequirements.bmr).toBeGreaterThan(0);
    });

    test('should handle minimum valid values', () => {
      const minMetrics: PersonalMetrics = {
        height: 100,
        weight: 30,
        age: 13,
        gender: 'female',
        activityLevel: 'sedentary',
        fitnessGoals: ['maintenance']
      };
      
      expect(() => calculateNutritionProfile(minMetrics)).not.toThrow();
      const profile = calculateNutritionProfile(minMetrics);
      expect(profile.bmi).toBeGreaterThan(0);
      expect(profile.calorieRequirements.bmr).toBeGreaterThan(0);
    });

    test('should maintain precision in calculations', () => {
      const profile = calculateNutritionProfile(sampleMetrics);
      
      // BMI should be rounded to 1 decimal place
      expect(profile.bmi.toString().split('.')[1]?.length || 0).toBeLessThanOrEqual(1);
      
      // Calories should be whole numbers
      expect(Number.isInteger(profile.calorieRequirements.bmr)).toBe(true);
      expect(Number.isInteger(profile.calorieRequirements.tdee)).toBe(true);
      expect(Number.isInteger(profile.calorieRequirements.targetCalories)).toBe(true);
      
      // Macros should be whole numbers
      expect(Number.isInteger(profile.macronutrients.protein)).toBe(true);
      expect(Number.isInteger(profile.macronutrients.carbohydrates)).toBe(true);
      expect(Number.isInteger(profile.macronutrients.fats)).toBe(true);
      expect(Number.isInteger(profile.macronutrients.fiber)).toBe(true);
    });
  });
});
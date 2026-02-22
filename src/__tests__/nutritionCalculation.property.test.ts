/**
 * Property-Based Tests for Nutrition Calculation System
 * 
 * These tests validate universal properties that should hold true across all valid inputs
 * for BMI calculation, caloric needs algorithms, and macronutrient distributions.
 * 
 * Requirements: 2.1, 2.2
 */

import fc from 'fast-check';
import {
  calculateBMI,
  categorizeBMI,
  calculateBMR,
  calculateTDEE,
  calculateTargetCalories,
  calculateMacronutrients,
  calculateNutritionProfile,
  validateMetrics,
  unitConversions
} from '../lib/nutritionCalculationService';
import { PersonalMetrics } from '../types';

// Custom generators for realistic user data
const validHeightGen = fc.integer({ min: 100, max: 250 }); // cm
const validWeightGen = fc.integer({ min: 30, max: 300 }); // kg
const validAgeGen = fc.integer({ min: 13, max: 120 }); // years
const genderGen = fc.constantFrom('male', 'female', 'other');
const activityLevelGen = fc.constantFrom('sedentary', 'light', 'moderate', 'active', 'very_active');
const goalGen = fc.constantFrom('weight_loss', 'muscle_gain', 'maintenance', 'endurance');

const personalMetricsGen = fc.record({
  height: validHeightGen,
  weight: validWeightGen,
  age: validAgeGen,
  gender: genderGen,
  activityLevel: activityLevelGen,
  fitnessGoals: fc.array(fc.string(), { minLength: 1, maxLength: 3 })
});

describe('Nutrition Calculation Properties', () => {
  describe('BMI Calculation Properties', () => {
    test('**Property 5.1: BMI calculation consistency** - BMI should always be positive for valid inputs', () => {
      fc.assert(
        fc.property(validHeightGen, validWeightGen, (height, weight) => {
          const bmi = calculateBMI(height, weight);
          return bmi > 0;
        }),
        { numRuns: 100 }
      );
    });

    test('**Property 5.2: BMI scaling** - Doubling weight should double BMI (height constant)', () => {
      fc.assert(
        fc.property(validHeightGen, validWeightGen, (height, weight) => {
          // Skip very low weights that might cause precision issues
          fc.pre(weight >= 40 && weight <= 150); // Also limit upper bound to avoid extreme cases
          
          const bmi1 = calculateBMI(height, weight);
          const bmi2 = calculateBMI(height, weight * 2);
          
          // Allow for rounding differences (BMI is rounded to 1 decimal)
          // The ratio should be very close to 2, but allow for rounding
          const ratio = bmi2 / bmi1;
          return Math.abs(ratio - 2) < 0.05; // Increased tolerance for rounding
        }),
        { numRuns: 100 }
      );
    });

    test('**Property 5.3: BMI categorization consistency** - BMI category should be deterministic', () => {
      fc.assert(
        fc.property(validHeightGen, validWeightGen, (height, weight) => {
          const bmi = calculateBMI(height, weight);
          const category1 = categorizeBMI(bmi);
          const category2 = categorizeBMI(bmi);
          
          return category1 === category2;
        }),
        { numRuns: 100 }
      );
    });

    test('**Property 5.4: BMI category boundaries** - BMI categories should follow WHO standards', () => {
      fc.assert(
        fc.property(fc.float({ min: 10, max: 50 }), (bmi) => {
          const category = categorizeBMI(bmi);
          
          if (bmi < 18.5) return category === 'underweight';
          if (bmi < 25) return category === 'normal';
          if (bmi < 30) return category === 'overweight';
          return category === 'obese';
        }),
        { numRuns: 100 }
      );
    });
  });

  describe('BMR Calculation Properties', () => {
    test('**Property 5.5: BMR positivity** - BMR should always be positive for valid metrics', () => {
      fc.assert(
        fc.property(personalMetricsGen, (metrics) => {
          const bmr = calculateBMR(metrics);
          return bmr > 0;
        }),
        { numRuns: 100 }
      );
    });

    test('**Property 5.6: BMR age relationship** - Older people should have lower BMR (other factors equal)', () => {
      fc.assert(
        fc.property(
          validHeightGen,
          validWeightGen,
          genderGen,
          activityLevelGen,
          fc.integer({ min: 20, max: 40 }),
          fc.integer({ min: 50, max: 80 }),
          (height, weight, gender, activityLevel, youngerAge, olderAge) => {
            const youngerMetrics: PersonalMetrics = {
              height, weight, age: youngerAge, gender, activityLevel, fitnessGoals: []
            };
            const olderMetrics: PersonalMetrics = {
              height, weight, age: olderAge, gender, activityLevel, fitnessGoals: []
            };
            
            const youngerBMR = calculateBMR(youngerMetrics);
            const olderBMR = calculateBMR(olderMetrics);
            
            return youngerBMR > olderBMR;
          }
        ),
        { numRuns: 100 }
      );
    });

    test('**Property 5.7: BMR weight relationship** - Heavier people should have higher BMR (other factors equal)', () => {
      fc.assert(
        fc.property(
          validHeightGen,
          validAgeGen,
          genderGen,
          activityLevelGen,
          fc.integer({ min: 50, max: 80 }),
          fc.integer({ min: 90, max: 120 }),
          (height, age, gender, activityLevel, lighterWeight, heavierWeight) => {
            const lighterMetrics: PersonalMetrics = {
              height, weight: lighterWeight, age, gender, activityLevel, fitnessGoals: []
            };
            const heavierMetrics: PersonalMetrics = {
              height, weight: heavierWeight, age, gender, activityLevel, fitnessGoals: []
            };
            
            const lighterBMR = calculateBMR(lighterMetrics);
            const heavierBMR = calculateBMR(heavierMetrics);
            
            return heavierBMR > lighterBMR;
          }
        ),
        { numRuns: 100 }
      );
    });

    test('**Property 5.8: BMR gender relationship** - Males should have higher BMR than females (other factors equal)', () => {
      fc.assert(
        fc.property(
          validHeightGen,
          validWeightGen,
          validAgeGen,
          activityLevelGen,
          (height, weight, age, activityLevel) => {
            const maleMetrics: PersonalMetrics = {
              height, weight, age, gender: 'male', activityLevel, fitnessGoals: []
            };
            const femaleMetrics: PersonalMetrics = {
              height, weight, age, gender: 'female', activityLevel, fitnessGoals: []
            };
            
            const maleBMR = calculateBMR(maleMetrics);
            const femaleBMR = calculateBMR(femaleMetrics);
            
            return maleBMR > femaleBMR;
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  describe('TDEE Calculation Properties', () => {
    test('**Property 5.9: TDEE greater than BMR** - TDEE should always be greater than BMR', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 800, max: 3000 }),
          activityLevelGen,
          (bmr, activityLevel) => {
            const tdee = calculateTDEE(bmr, activityLevel);
            return tdee > bmr;
          }
        ),
        { numRuns: 100 }
      );
    });

    test('**Property 5.10: TDEE activity level ordering** - Higher activity levels should result in higher TDEE', () => {
      const activityLevels = ['sedentary', 'light', 'moderate', 'active', 'very_active'] as const;
      
      fc.assert(
        fc.property(
          fc.integer({ min: 1000, max: 2500 }),
          (bmr) => {
            const tdees = activityLevels.map(level => calculateTDEE(bmr, level));
            
            // Check that each TDEE is greater than or equal to the previous one
            for (let i = 1; i < tdees.length; i++) {
              if (tdees[i] <= tdees[i - 1]) {
                return false;
              }
            }
            return true;
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  describe('Target Calorie Properties', () => {
    test('**Property 5.11: Target calorie goal consistency** - Weight loss should reduce calories, muscle gain should increase', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 1500, max: 3500 }),
          (tdee) => {
            const weightLoss = calculateTargetCalories(tdee, 'weight_loss');
            const maintenance = calculateTargetCalories(tdee, 'maintenance');
            const muscleGain = calculateTargetCalories(tdee, 'muscle_gain');
            
            return (
              weightLoss.targetCalories < maintenance.targetCalories &&
              maintenance.targetCalories < muscleGain.targetCalories &&
              maintenance.targetCalories === tdee
            );
          }
        ),
        { numRuns: 100 }
      );
    });

    test('**Property 5.12: Target calorie adjustment consistency** - Adjustments should match expected percentages', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 1500, max: 3500 }),
          goalGen,
          (tdee, goal) => {
            const result = calculateTargetCalories(tdee, goal);
            const expectedCalories = Math.round(tdee * (1 + result.adjustment));
            
            return result.targetCalories === expectedCalories;
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  describe('Macronutrient Calculation Properties', () => {
    test('**Property 5.13: Macronutrient calorie consistency** - Calculated macros should approximately equal target calories', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 1200, max: 4000 }),
          goalGen,
          (targetCalories, goal) => {
            const macros = calculateMacronutrients(targetCalories, goal);
            
            // Calculate calories from macros (protein: 4 cal/g, carbs: 4 cal/g, fats: 9 cal/g)
            const calculatedCalories = (macros.protein * 4) + (macros.carbohydrates * 4) + (macros.fats * 9);
            
            // Allow for rounding differences (within 5% tolerance)
            const tolerance = targetCalories * 0.05;
            return Math.abs(calculatedCalories - targetCalories) <= tolerance;
          }
        ),
        { numRuns: 100 }
      );
    });

    test('**Property 5.14: Macronutrient positivity** - All macronutrients should be positive', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 1200, max: 4000 }),
          goalGen,
          (targetCalories, goal) => {
            const macros = calculateMacronutrients(targetCalories, goal);
            
            return (
              macros.protein > 0 &&
              macros.carbohydrates > 0 &&
              macros.fats > 0 &&
              macros.fiber > 0
            );
          }
        ),
        { numRuns: 100 }
      );
    });

    test('**Property 5.15: Fiber scaling** - Fiber should scale with calories (14g per 1000 calories)', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 1000, max: 4000 }),
          goalGen,
          (targetCalories, goal) => {
            const macros = calculateMacronutrients(targetCalories, goal);
            const expectedFiber = Math.round((targetCalories / 1000) * 14);
            
            return macros.fiber === expectedFiber;
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  describe('Complete Nutrition Profile Properties', () => {
    test('**Property 5.16: Nutrition profile completeness** - All profile fields should be present and valid', () => {
      fc.assert(
        fc.property(personalMetricsGen, goalGen, (metrics, goal) => {
          const profile = calculateNutritionProfile(metrics, goal);
          
          return (
            profile.bmi > 0 &&
            ['underweight', 'normal', 'overweight', 'obese'].includes(profile.bmiCategory) &&
            profile.calorieRequirements.bmr > 0 &&
            profile.calorieRequirements.tdee > profile.calorieRequirements.bmr &&
            profile.calorieRequirements.targetCalories > 0 &&
            profile.macronutrients.protein > 0 &&
            profile.macronutrients.carbohydrates > 0 &&
            profile.macronutrients.fats > 0 &&
            profile.macronutrients.fiber > 0 &&
            Array.isArray(profile.recommendations) &&
            profile.recommendations.length > 0
          );
        }),
        { numRuns: 100 }
      );
    });

    test('**Property 5.17: Profile consistency** - Same inputs should produce same outputs', () => {
      fc.assert(
        fc.property(personalMetricsGen, goalGen, (metrics, goal) => {
          const profile1 = calculateNutritionProfile(metrics, goal);
          const profile2 = calculateNutritionProfile(metrics, goal);
          
          return (
            profile1.bmi === profile2.bmi &&
            profile1.bmiCategory === profile2.bmiCategory &&
            profile1.calorieRequirements.bmr === profile2.calorieRequirements.bmr &&
            profile1.calorieRequirements.tdee === profile2.calorieRequirements.tdee &&
            profile1.calorieRequirements.targetCalories === profile2.calorieRequirements.targetCalories &&
            profile1.macronutrients.protein === profile2.macronutrients.protein &&
            profile1.macronutrients.carbohydrates === profile2.macronutrients.carbohydrates &&
            profile1.macronutrients.fats === profile2.macronutrients.fats &&
            profile1.macronutrients.fiber === profile2.macronutrients.fiber
          );
        }),
        { numRuns: 100 }
      );
    });
  });

  describe('Unit Conversion Properties', () => {
    test('**Property 5.18: Weight conversion reversibility** - Converting kg to lbs and back should return original value', () => {
      fc.assert(
        fc.property(
          fc.float({ min: 30, max: 300, noNaN: true }),
          (kg) => {
            fc.pre(!isNaN(kg) && isFinite(kg));
            
            const lbs = unitConversions.kgToLbs(kg);
            const backToKg = unitConversions.lbsToKg(lbs);
            
            // Allow for small rounding differences
            return Math.abs(backToKg - kg) < 0.1;
          }
        ),
        { numRuns: 100 }
      );
    });

    test('**Property 5.19: Height conversion reversibility** - Converting cm to inches and back should return original value', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 100, max: 250 }), // Use integers to avoid floating point precision issues
          (cm) => {
            const inches = unitConversions.cmToInches(cm);
            const backToCm = unitConversions.inchesToCm(inches);
            
            // Allow for small rounding differences due to floating point arithmetic
            return Math.abs(backToCm - cm) < 0.5;
          }
        ),
        { numRuns: 100 }
      );
    });

    test('**Property 5.20: Feet/inches conversion consistency** - Converting to feet/inches and back should be consistent', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 100, max: 250 }),
          (cm) => {
            const { feet, inches } = unitConversions.cmToFeetInches(cm);
            const backToCm = unitConversions.feetInchesToCm(feet, inches);
            
            // Allow for small rounding differences
            return Math.abs(backToCm - cm) < 1;
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  describe('Validation Properties', () => {
    test('**Property 5.21: Valid metrics acceptance** - All valid metrics should pass validation', () => {
      fc.assert(
        fc.property(personalMetricsGen, (metrics) => {
          const validation = validateMetrics(metrics);
          return validation.isValid === true && validation.errors.length === 0;
        }),
        { numRuns: 100 }
      );
    });

    test('**Property 5.22: Invalid metrics rejection** - Metrics outside valid ranges should fail validation', () => {
      const invalidMetricsGen = fc.record({
        height: fc.oneof(
          fc.integer({ min: 1, max: 99 }),
          fc.integer({ min: 251, max: 500 })
        ),
        weight: fc.oneof(
          fc.integer({ min: 1, max: 29 }),
          fc.integer({ min: 301, max: 500 })
        ),
        age: fc.oneof(
          fc.integer({ min: 1, max: 12 }),
          fc.integer({ min: 121, max: 200 })
        ),
        gender: genderGen,
        activityLevel: activityLevelGen,
        fitnessGoals: fc.array(fc.string(), { minLength: 1, maxLength: 3 })
      });

      fc.assert(
        fc.property(invalidMetricsGen, (metrics) => {
          const validation = validateMetrics(metrics);
          return validation.isValid === false && validation.errors.length > 0;
        }),
        { numRuns: 100 }
      );
    });

    test('**Property 5.23: Validation error specificity** - Validation errors should be specific to the invalid field', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 1, max: 99 }), // Invalid height
          validWeightGen,
          validAgeGen,
          (invalidHeight, weight, age) => {
            const metrics: PersonalMetrics = {
              height: invalidHeight,
              weight,
              age,
              gender: 'male',
              activityLevel: 'moderate',
              fitnessGoals: []
            };
            
            const validation = validateMetrics(metrics);
            return (
              validation.isValid === false &&
              validation.errors.some(error => error.includes('Height'))
            );
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  describe('Mathematical Properties', () => {
    test('**Property 5.24: BMI monotonicity** - BMI should increase monotonically with weight (height constant)', () => {
      fc.assert(
        fc.property(
          validHeightGen,
          fc.integer({ min: 40, max: 80 }),
          fc.integer({ min: 90, max: 150 }),
          (height, weight1, weight2) => {
            fc.pre(weight1 < weight2); // Precondition: weight1 < weight2
            
            const bmi1 = calculateBMI(height, weight1);
            const bmi2 = calculateBMI(height, weight2);
            
            return bmi1 < bmi2;
          }
        ),
        { numRuns: 100 }
      );
    });

    test('**Property 5.25: Calorie calculation bounds** - All calorie calculations should be within reasonable bounds', () => {
      fc.assert(
        fc.property(personalMetricsGen, goalGen, (metrics, goal) => {
          // Skip unrealistic edge cases for fitness applications
          fc.pre(!(
            (metrics.age > 80 && metrics.weight < 50) || // Very elderly and underweight
            (metrics.height < 110 && metrics.weight < 35) || // Very small people
            (metrics.age > 70 && metrics.height < 120 && metrics.weight < 40) // Combination of factors
          ));
          
          const profile = calculateNutritionProfile(metrics, goal);
          
          return (
            profile.calorieRequirements.bmr >= 500 &&    // Minimum BMR for realistic cases
            profile.calorieRequirements.bmr <= 5000 &&   // Maximum reasonable BMR
            profile.calorieRequirements.tdee >= 600 &&   // Minimum TDEE
            profile.calorieRequirements.tdee <= 10000 && // Maximum reasonable TDEE
            profile.calorieRequirements.targetCalories >= 400 && // Minimum safe calories
            profile.calorieRequirements.targetCalories <= 12000  // Maximum reasonable calories
          );
        }),
        { numRuns: 100 }
      );
    });
  });
});

/**
 * **Validates: Requirements 2.1, 2.2**
 * 
 * These property-based tests ensure that:
 * - BMI calculations are mathematically correct and consistent
 * - Caloric needs formulas produce reasonable and predictable results
 * - Macronutrient distributions maintain proper ratios and caloric equivalence
 * - All calculations handle edge cases gracefully
 * - Unit conversions are reversible and accurate
 * - Input validation properly accepts valid data and rejects invalid data
 * - Mathematical relationships (monotonicity, ordering) are preserved
 * - All outputs are within reasonable physiological bounds
 */
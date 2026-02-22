# Body Fat Percentage Estimation Utility

## Overview

This utility provides multiple validated methods for estimating body fat percentage when users don't provide actual measurements. All estimates include confidence levels and clear disclaimers that they are approximations.

## Features

- **Multiple Estimation Methods**: Navy Method, Jackson-Pollock 3-site, Deurenberg formula, BMI-based
- **Confidence Levels**: High, Medium, Low based on method accuracy
- **Activity Adjustments**: Estimates adjusted based on training level and activity
- **Validation**: Built-in validation for realistic body fat ranges
- **Override Capability**: Users can always override estimates with actual measurements

## Estimation Methods

### 1. Navy Circumference Method (High Confidence)

Most accurate when circumference measurements are available.

**Required Measurements:**
- Males: Neck, Waist, Height
- Females: Neck, Waist, Hip, Height

**Usage:**
```typescript
import { estimateBodyFatNavyMethod } from '@/utils/bodyFatEstimation';

const measurements = {
  neck: 38,  // cm
  waist: 85, // cm
  hip: 95    // cm (required for females)
};

const estimate = estimateBodyFatNavyMethod(profile, measurements);
// Returns: { percentage: 18.5, method: 'Navy circumference method', confidence: 'high', ... }
```

### 2. Jackson-Pollock 3-Site Skinfold (High Confidence)

Accurate when skinfold caliper measurements are available.

**Required Measurements:**
- Males: Chest, Abdomen, Thigh (in mm)
- Females: Tricep, Suprailiac, Thigh (in mm)

**Usage:**
```typescript
import { estimateBodyFatJacksonPollock } from '@/utils/bodyFatEstimation';

const measurements = {
  chest: 10,    // mm (males)
  abdomen: 20,  // mm (males)
  thigh: 15     // mm (both)
};

const estimate = estimateBodyFatJacksonPollock(profile, measurements);
// Returns: { percentage: 15.2, method: 'Jackson-Pollock 3-site skinfold', confidence: 'high', ... }
```

### 3. Deurenberg Formula (Medium Confidence)

Age and gender-adjusted BMI-based estimation. More accurate than simple BMI.

**Required Data:**
- Weight, Height, Age, Gender

**Usage:**
```typescript
import { estimateBodyFatDeurenberg } from '@/utils/bodyFatEstimation';

const estimate = estimateBodyFatDeurenberg(profile);
// Returns: { percentage: 19.3, method: 'Deurenberg formula', confidence: 'medium', ... }
```

### 4. BMI-Based Estimation (Low Confidence)

Simple correlation between BMI and body fat. Always available but least accurate.

**Required Data:**
- Weight, Height, Age, Gender

**Usage:**
```typescript
import { estimateBodyFatFromBMI } from '@/utils/bodyFatEstimation';

const estimate = estimateBodyFatFromBMI(profile);
// Returns: { percentage: 20.1, method: 'BMI-based estimation', confidence: 'low', ... }
```

## Main Functions

### `estimateBodyFatPercentage()`

Comprehensive estimation using all available methods. Returns the best estimate based on available data.

```typescript
import { estimateBodyFatPercentage } from '@/utils/bodyFatEstimation';

const result = estimateBodyFatPercentage(
  profile,
  navyMeasurements,      // optional
  jacksonPollockMeasurements  // optional
);

console.log(result);
// {
//   recommended: { percentage: 18.5, method: 'Navy circumference method', confidence: 'high', ... },
//   alternatives: [
//     { percentage: 19.3, method: 'Deurenberg formula', confidence: 'medium', ... },
//     { percentage: 20.1, method: 'BMI-based estimation', confidence: 'low', ... }
//   ],
//   averageEstimate: 19.3,
//   range: { min: 18.5, max: 20.1 },
//   disclaimer: 'All body fat estimates are approximations...'
// }
```

### `getBodyFatPercentage()`

Convenience function that returns actual measurement if provided, otherwise estimates.

```typescript
import { getBodyFatPercentage } from '@/utils/bodyFatEstimation';

const result = getBodyFatPercentage(profile);

if (result.isEstimated) {
  console.log(`Estimated: ${result.value}%`);
  console.log(`Method: ${result.estimation.recommended.method}`);
  console.log(`Confidence: ${result.estimation.recommended.confidence}`);
} else {
  console.log(`Actual measurement: ${result.value}%`);
}
```

## Validation Functions

### `validateBodyFatPercentage()`

Validates body fat percentage is within realistic ranges.

```typescript
import { validateBodyFatPercentage } from '@/utils/bodyFatEstimation';

const validation = validateBodyFatPercentage(15, 'male');

if (!validation.isValid) {
  console.error(validation.message);
} else if (validation.message) {
  console.warn(validation.message); // Warning for extreme but valid values
}
```

**Validation Rules:**
- Minimum: 3% (below is dangerously low)
- Maximum: 50% (above is outside typical range)
- Male warning: <5% (extremely low)
- Female warning: <12% (may affect hormonal health)

### `getBodyFatCategory()`

Returns descriptive category for body fat percentage.

```typescript
import { getBodyFatCategory } from '@/utils/bodyFatEstimation';

const category = getBodyFatCategory(15, 'male');
// Returns: 'Athletic'
```

**Categories:**

**Males:**
- <6%: Essential fat
- 6-13%: Athletic
- 14-17%: Fitness
- 18-24%: Average
- >24%: Above average

**Females:**
- <14%: Essential fat
- 14-20%: Athletic
- 21-24%: Fitness
- 25-31%: Average
- >31%: Above average

## Activity Level Adjustments

Estimates are automatically adjusted based on activity level and training experience:

- **Very Active + Advanced**: -2% adjustment (likely leaner)
- **Active + Intermediate**: -1% adjustment
- **Sedentary**: +1% adjustment (likely higher body fat)

## Integration Example

```typescript
import { getBodyFatPercentage, validateBodyFatPercentage } from '@/utils/bodyFatEstimation';
import { UserProfileExtended } from '@/types/nutrition';

function processUserProfile(profile: UserProfileExtended) {
  // Get body fat (actual or estimated)
  const bodyFatResult = getBodyFatPercentage(profile);
  
  // Validate the value
  const validation = validateBodyFatPercentage(bodyFatResult.value, profile.gender);
  
  if (!validation.isValid) {
    throw new Error(validation.message);
  }
  
  // Show estimation details to user if estimated
  if (bodyFatResult.isEstimated) {
    console.log('Body Fat Estimation:');
    console.log(`  Recommended: ${bodyFatResult.value}% (${bodyFatResult.estimation.recommended.method})`);
    console.log(`  Confidence: ${bodyFatResult.estimation.recommended.confidence}`);
    console.log(`  Range: ${bodyFatResult.estimation.range.min}% - ${bodyFatResult.estimation.range.max}%`);
    console.log(`  Disclaimer: ${bodyFatResult.estimation.disclaimer}`);
    
    // Show alternative methods
    bodyFatResult.estimation.alternatives.forEach(alt => {
      console.log(`  Alternative: ${alt.percentage}% (${alt.method}, ${alt.confidence} confidence)`);
    });
  }
  
  return bodyFatResult.value;
}
```

## UI Integration Recommendations

### Display Estimated Values

When showing estimated body fat to users:

1. **Clearly indicate it's an estimate**
   ```
   Body Fat: ~18.5% (estimated)
   Method: Navy circumference method
   Confidence: High
   ```

2. **Show the range**
   ```
   Estimated Range: 18.5% - 20.1%
   Average: 19.3%
   ```

3. **Provide override option**
   ```
   [Override with actual measurement]
   ```

4. **Include disclaimer**
   ```
   ⓘ This is an approximation. For accurate measurements, 
      consider DEXA scan, hydrostatic weighing, or Bod Pod.
   ```

### Collect Optional Measurements

To improve accuracy, offer users the option to provide:

- **Navy Method**: Neck, waist, hip circumferences
- **Jackson-Pollock**: Skinfold measurements (if they have calipers)

```typescript
// Example form component
<OptionalMeasurements>
  <h3>Improve Accuracy (Optional)</h3>
  <p>Provide circumference measurements for more accurate estimates:</p>
  
  <Input label="Neck circumference (cm)" name="neck" />
  <Input label="Waist circumference (cm)" name="waist" />
  {gender === 'female' && (
    <Input label="Hip circumference (cm)" name="hip" />
  )}
  
  <InfoBox>
    These measurements enable the Navy Method, which provides 
    higher accuracy than BMI-based estimates.
  </InfoBox>
</OptionalMeasurements>
```

## Testing

Comprehensive test suite with 43 test cases covering:

- All estimation methods
- Edge cases and boundary conditions
- Gender-specific calculations
- Age adjustments
- Activity level adjustments
- Validation rules
- Consistency and reliability

Run tests:
```bash
npm test -- bodyFatEstimation.test.ts
```

## Scientific References

1. **Navy Method**: Hodgdon, J.A. and Beckett, M.B. (1984). Prediction of percent body fat for U.S. Navy men and women from body circumferences and height. Reports No. 84-29 and 84-11. Naval Health Research Center, San Diego, CA.

2. **Jackson-Pollock**: Jackson, A.S., & Pollock, M.L. (1978). Generalized equations for predicting body density of men. British Journal of Nutrition, 40(3), 497-504.

3. **Deurenberg Formula**: Deurenberg, P., Weststrate, J.A., & Seidell, J.C. (1991). Body mass index as a measure of body fatness: age- and sex-specific prediction formulas. British Journal of Nutrition, 65(2), 105-114.

4. **BMI Correlation**: Gallagher, D., et al. (2000). Healthy percentage body fat ranges: an approach for developing guidelines based on body mass index. The American Journal of Clinical Nutrition, 72(3), 694-701.

## Important Disclaimers

⚠️ **Medical Disclaimer**: These estimates are for informational purposes only and should not be used for medical diagnosis. Always consult healthcare professionals for medical advice.

⚠️ **Accuracy Limitations**: 
- All methods are approximations with varying accuracy
- Individual body composition varies significantly
- Athletes and highly muscular individuals may get inaccurate estimates
- Recommended to use actual body composition testing when possible

⚠️ **Professional Testing Methods** (in order of accuracy):
1. DEXA Scan (Dual-Energy X-ray Absorptiometry)
2. Hydrostatic Weighing
3. Bod Pod (Air Displacement Plethysmography)
4. Bioelectrical Impedance Analysis (BIA)
5. Skinfold Calipers (when done by trained professionals)

## Future Enhancements

Potential improvements for future versions:

1. **Machine Learning Model**: Train on actual body composition data for improved accuracy
2. **Photo-Based Estimation**: Use computer vision to estimate from photos
3. **Bioelectrical Impedance**: Integrate with smart scales that provide BIA data
4. **Progress Tracking**: Track changes over time and adjust estimates based on trends
5. **Ethnicity Adjustments**: Add ethnicity-specific formulas for improved accuracy

/**
 * Example usage of Profile Completion Tracking
 * This demonstrates how to use the profile completion system in your application
 */

import { 
  calculateProfileCompletion,
  isProfileReadyForPlanGeneration,
  getCategoryCompletionStatus,
  getFieldMetadata
} from '@/utils/profileCompletion';
import { UserProfileExtended, ProfileFieldCategory } from '@/types/nutrition';

// Example 1: Empty profile - just starting
console.log('=== Example 1: Empty Profile ===');
const emptyProfile: Partial<UserProfileExtended> = {};
const emptyStatus = calculateProfileCompletion(emptyProfile);

console.log(`Completion: ${emptyStatus.completionPercentage}%`);
console.log(`Message: ${emptyStatus.userFriendlyMessage}`);
console.log(`Next steps: ${emptyStatus.nextRecommendedFields.map(f => f.displayName).join(', ')}`);
console.log('');

// Example 2: Partially complete profile
console.log('=== Example 2: Partial Profile ===');
const partialProfile: Partial<UserProfileExtended> = {
  height: 175,
  weight: 75,
  age: 30,
  gender: 'male',
  activity_level: 'moderate',
  goal: 'muscle_gain'
};
const partialStatus = calculateProfileCompletion(partialProfile);

console.log(`Completion: ${partialStatus.completionPercentage}%`);
console.log(`Completed: ${partialStatus.completedFields}/${partialStatus.totalFields} fields`);
console.log(`Message: ${partialStatus.userFriendlyMessage}`);
console.log(`Missing required: ${partialStatus.missingRequiredFields.length} fields`);
console.log(`Ready for plan generation: ${isProfileReadyForPlanGeneration(partialProfile)}`);
console.log('');

// Example 3: Complete profile
console.log('=== Example 3: Complete Profile ===');
const completeProfile: UserProfileExtended = {
  height: 175,
  weight: 75,
  age: 30,
  gender: 'male',
  body_fat_percentage: 15,
  activity_level: 'moderate',
  goal: 'muscle_gain',
  diet_type: 'standard',
  meals_per_day: 4,
  snacks_per_day: 2,
  cooking_time: 'moderate',
  cuisine_preference: ['Italian', 'Asian'],
  budget_level: 'medium',
  training_level: 'intermediate',
  workout_days_per_week: 4,
  subscription_tier: 'pro',
  plan_duration_weeks: 8
};
const completeStatus = calculateProfileCompletion(completeProfile);

console.log(`Completion: ${completeStatus.completionPercentage}%`);
console.log(`Message: ${completeStatus.userFriendlyMessage}`);
console.log(`Ready for plan generation: ${isProfileReadyForPlanGeneration(completeProfile)}`);
console.log('');

// Example 4: Category-specific completion
console.log('=== Example 4: Category Completion ===');
const basicMetricsStatus = getCategoryCompletionStatus(
  partialProfile,
  ProfileFieldCategory.BASIC_METRICS
);
console.log(`Basic Metrics: ${basicMetricsStatus.percentage}% complete`);
console.log(`  Completed: ${basicMetricsStatus.completed}/${basicMetricsStatus.total}`);

const preferencesStatus = getCategoryCompletionStatus(
  partialProfile,
  ProfileFieldCategory.PREFERENCES
);
console.log(`Preferences: ${preferencesStatus.percentage}% complete`);
console.log(`  Missing: ${preferencesStatus.missingFields.map(f => f.displayName).join(', ')}`);
console.log('');

// Example 5: Field metadata lookup
console.log('=== Example 5: Field Metadata ===');
const heightMeta = getFieldMetadata('height');
if (heightMeta) {
  console.log(`Field: ${heightMeta.displayName}`);
  console.log(`Description: ${heightMeta.description}`);
  console.log(`Required: ${heightMeta.required}`);
  console.log(`Category: ${heightMeta.category}`);
  console.log(`Priority: ${heightMeta.priority}`);
}
console.log('');

// Example 6: Progressive profile building UI
console.log('=== Example 6: Progressive Building ===');
const progressiveProfile: Partial<UserProfileExtended> = {};
const steps = [
  { height: 175 },
  { height: 175, weight: 75 },
  { height: 175, weight: 75, age: 30 },
  { height: 175, weight: 75, age: 30, gender: 'male' as const }
];

steps.forEach((step, index) => {
  const status = calculateProfileCompletion(step);
  console.log(`Step ${index + 1}: ${status.completionPercentage}% - ${status.userFriendlyMessage}`);
  if (status.nextRecommendedFields.length > 0) {
    console.log(`  Next: ${status.nextRecommendedFields[0].displayName}`);
  }
});

/**
 * Usage in React Components
 * 
 * Example React component using profile completion:
 * 
 * ```tsx
 * import { calculateProfileCompletion } from '@/utils/profileCompletion';
 * 
 * function ProfileCompletionWidget({ profile }: { profile: Partial<UserProfileExtended> }) {
 *   const status = calculateProfileCompletion(profile);
 *   
 *   return (
 *     <div className="profile-completion">
 *       <div className="progress-bar">
 *         <div 
 *           className="progress-fill" 
 *           style={{ width: `${status.completionPercentage}%` }}
 *         />
 *       </div>
 *       <p>{status.userFriendlyMessage}</p>
 *       
 *       {status.nextRecommendedFields.length > 0 && (
 *         <div className="next-steps">
 *           <h3>Next Steps:</h3>
 *           <ul>
 *             {status.nextRecommendedFields.map(field => (
 *               <li key={field.field}>
 *                 <strong>{field.displayName}</strong>: {field.description}
 *               </li>
 *             ))}
 *           </ul>
 *         </div>
 *       )}
 *       
 *       {status.isComplete && (
 *         <button onClick={generatePlan}>
 *           Generate Your Transformation Plan
 *         </button>
 *       )}
 *     </div>
 *   );
 * }
 * ```
 * 
 * Example form validation:
 * 
 * ```tsx
 * import { isProfileReadyForPlanGeneration } from '@/utils/profileCompletion';
 * 
 * function PlanGenerationForm({ profile }: { profile: Partial<UserProfileExtended> }) {
 *   const canGenerate = isProfileReadyForPlanGeneration(profile);
 *   
 *   const handleSubmit = () => {
 *     if (!canGenerate) {
 *       alert('Please complete all required fields first');
 *       return;
 *     }
 *     // Generate plan...
 *   };
 *   
 *   return (
 *     <button disabled={!canGenerate} onClick={handleSubmit}>
 *       Generate Plan
 *     </button>
 *   );
 * }
 * ```
 * 
 * Example category progress display:
 * 
 * ```tsx
 * import { getCategoryCompletionStatus } from '@/utils/profileCompletion';
 * import { ProfileFieldCategory } from '@/types/nutrition';
 * 
 * function CategoryProgress({ profile }: { profile: Partial<UserProfileExtended> }) {
 *   const categories = Object.values(ProfileFieldCategory);
 *   
 *   return (
 *     <div className="category-progress">
 *       {categories.map(category => {
 *         const status = getCategoryCompletionStatus(profile, category);
 *         return (
 *           <div key={category} className="category-item">
 *             <h4>{category.replace('_', ' ')}</h4>
 *             <div className="progress-bar">
 *               <div style={{ width: `${status.percentage}%` }} />
 *             </div>
 *             <span>{status.completed}/{status.total} complete</span>
 *           </div>
 *         );
 *       })}
 *     </div>
 *   );
 * }
 * ```
 */

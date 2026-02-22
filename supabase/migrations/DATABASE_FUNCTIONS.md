# Database Functions Documentation

This document describes the PostgreSQL/Supabase database functions created for the AI Nutrition Engine to handle complex queries efficiently.

## Overview

The database functions provide optimized, reusable queries for:
- Plan statistics and completion tracking
- Progress trend analysis
- Adherence score calculations
- Active plan queries
- Week-over-week comparisons

All functions use `SECURITY DEFINER` to respect Row Level Security (RLS) policies while providing efficient data access.

## Functions

### 1. get_plan_statistics(plan_id UUID)

Returns comprehensive statistics for a transformation plan.

**Parameters:**
- `plan_id` (UUID): The transformation plan ID

**Returns:**
- `plan_id`: Plan identifier
- `total_weeks`: Total duration of the plan
- `weeks_completed`: Number of weeks with recorded progress
- `completion_percentage`: Overall completion percentage
- `avg_nutrition_adherence`: Average nutrition adherence score
- `avg_workout_adherence`: Average workout adherence score
- `total_weight_change`: Total weight change from start to latest
- `total_body_fat_change`: Total body fat percentage change
- `last_recorded_weight`: Most recent weight measurement
- `last_recorded_body_fat`: Most recent body fat percentage
- `last_update_date`: Last update timestamp

**Example Usage:**
```sql
SELECT * FROM get_plan_statistics('123e4567-e89b-12d3-a456-426614174000');
```

**TypeScript Usage:**
```typescript
const { data, error } = await supabase
  .rpc('get_plan_statistics', { p_plan_id: planId });
```

---

### 2. analyze_progress_trends(plan_id UUID, weeks_back INTEGER)

Analyzes progress trends including weight change, body fat change, and trend direction.

**Parameters:**
- `plan_id` (UUID): The transformation plan ID
- `weeks_back` (INTEGER, default: 4): Number of weeks to analyze

**Returns:**
- `week_number`: Week number in the plan
- `weight`: Current weight for that week
- `weight_change_from_previous`: Change from previous week
- `weight_change_from_start`: Total change from plan start
- `body_fat_percentage`: Current body fat percentage
- `body_fat_change_from_previous`: Change from previous week
- `body_fat_change_from_start`: Total change from plan start
- `nutrition_adherence`: Nutrition adherence score
- `workout_adherence`: Workout adherence score
- `trend_direction`: 'increasing', 'decreasing', or 'stable'
- `recorded_at`: Timestamp of recording

**Example Usage:**
```sql
-- Get last 4 weeks of progress trends
SELECT * FROM analyze_progress_trends('123e4567-e89b-12d3-a456-426614174000', 4);

-- Get last 8 weeks
SELECT * FROM analyze_progress_trends('123e4567-e89b-12d3-a456-426614174000', 8);
```

**TypeScript Usage:**
```typescript
const { data, error } = await supabase
  .rpc('analyze_progress_trends', { 
    p_plan_id: planId,
    p_weeks_back: 4 
  });
```

---

### 3. calculate_adherence_scores(plan_id UUID, start_week INTEGER, end_week INTEGER)

Calculates average adherence scores for nutrition and workouts with rating classification.

**Parameters:**
- `plan_id` (UUID): The transformation plan ID
- `start_week` (INTEGER, default: 1): Starting week for calculation
- `end_week` (INTEGER, default: NULL): Ending week (NULL = latest week)

**Returns:**
- `overall_nutrition_adherence`: Average nutrition adherence
- `overall_workout_adherence`: Average workout adherence
- `combined_adherence`: Combined average adherence
- `weeks_tracked`: Number of weeks included in calculation
- `adherence_rating`: Rating classification
  - 'excellent' (≥90%)
  - 'very_good' (≥80%)
  - 'good' (≥70%)
  - 'fair' (≥60%)
  - 'needs_improvement' (<60%)

**Example Usage:**
```sql
-- Calculate adherence for entire plan
SELECT * FROM calculate_adherence_scores('123e4567-e89b-12d3-a456-426614174000');

-- Calculate adherence for weeks 1-4
SELECT * FROM calculate_adherence_scores('123e4567-e89b-12d3-a456-426614174000', 1, 4);
```

**TypeScript Usage:**
```typescript
const { data, error } = await supabase
  .rpc('calculate_adherence_scores', { 
    p_plan_id: planId,
    p_start_week: 1,
    p_end_week: 4
  });
```

---

### 4. get_active_plans_for_user(user_id UUID)

Returns all active transformation plans for a user with summary data.

**Parameters:**
- `user_id` (UUID): The user ID

**Returns:**
- `plan_id`: Plan identifier
- `created_at`: Plan creation timestamp
- `duration_weeks`: Total plan duration
- `subscription_tier`: 'free' or 'pro'
- `status`: Plan status
- `completion_percentage`: Completion percentage
- `weeks_completed`: Number of completed weeks
- `target_calories`: Target calories for week 1
- `goal_type`: Goal strategy (deficit, surplus, etc.)
- `avg_adherence`: Average combined adherence
- `last_weight`: Most recent weight
- `weight_change`: Total weight change

**Example Usage:**
```sql
SELECT * FROM get_active_plans_for_user('123e4567-e89b-12d3-a456-426614174000');
```

**TypeScript Usage:**
```typescript
const { data, error } = await supabase
  .rpc('get_active_plans_for_user', { p_user_id: userId });
```

---

### 5. compare_week_over_week(plan_id UUID, current_week INTEGER)

Compares current week metrics with the previous week.

**Parameters:**
- `plan_id` (UUID): The transformation plan ID
- `current_week` (INTEGER): The current week number to compare

**Returns:**
- `current_week`: Current week number
- `current_weight`: Current week weight
- `current_body_fat`: Current week body fat percentage
- `current_nutrition_adherence`: Current nutrition adherence
- `current_workout_adherence`: Current workout adherence
- `previous_week`: Previous week number
- `previous_weight`: Previous week weight
- `previous_body_fat`: Previous week body fat percentage
- `previous_nutrition_adherence`: Previous nutrition adherence
- `previous_workout_adherence`: Previous workout adherence
- `weight_change`: Change in weight
- `body_fat_change`: Change in body fat percentage
- `nutrition_adherence_change`: Change in nutrition adherence
- `workout_adherence_change`: Change in workout adherence
- `performance_summary`: Overall performance classification
  - 'excellent_progress': Weight and body fat both decreased
  - 'good_progress': Weight decreased, body fat stable or decreased
  - 'muscle_gain': Weight increased, body fat decreased
  - 'plateau': No weight change
  - 'needs_adjustment': Other scenarios

**Example Usage:**
```sql
-- Compare week 5 with week 4
SELECT * FROM compare_week_over_week('123e4567-e89b-12d3-a456-426614174000', 5);
```

**TypeScript Usage:**
```typescript
const { data, error } = await supabase
  .rpc('compare_week_over_week', { 
    p_plan_id: planId,
    p_current_week: 5
  });
```

---

### 6. get_weekly_progress_summary(plan_id UUID)

Returns a comprehensive weekly progress summary for dashboard display.

**Parameters:**
- `plan_id` (UUID): The transformation plan ID

**Returns:**
- `week_number`: Week number
- `weight`: Weight for that week
- `body_fat_percentage`: Body fat percentage
- `nutrition_adherence`: Nutrition adherence score
- `workout_adherence`: Workout adherence score
- `calorie_adjustment`: Calorie adjustment made
- `week_status`: Status classification
  - 'on_track': Combined adherence ≥85%
  - 'good': Combined adherence ≥70%
  - 'needs_attention': Combined adherence <70%
- `recorded_at`: Recording timestamp

**Example Usage:**
```sql
SELECT * FROM get_weekly_progress_summary('123e4567-e89b-12d3-a456-426614174000');
```

**TypeScript Usage:**
```typescript
const { data, error } = await supabase
  .rpc('get_weekly_progress_summary', { p_plan_id: planId });
```

---

## Views

### plan_overview

A materialized view providing quick access to plan metrics without function calls.

**Columns:**
- `plan_id`: Plan identifier
- `user_id`: User identifier
- `created_at`: Creation timestamp
- `duration_weeks`: Plan duration
- `subscription_tier`: Subscription level
- `status`: Plan status
- `completion_percentage`: Completion percentage
- `bmr`: Basal Metabolic Rate
- `maintenance_calories`: Maintenance calorie level
- `target_calories`: Target calories for week 1
- `goal_strategy`: Goal strategy type
- `protein_target`: Protein target in grams
- `carbs_target`: Carbs target in grams
- `fats_target`: Fats target in grams
- `weeks_with_data`: Number of weeks with recorded data
- `avg_nutrition_adherence`: Average nutrition adherence
- `avg_workout_adherence`: Average workout adherence

**Example Usage:**
```sql
SELECT * FROM plan_overview WHERE user_id = '123e4567-e89b-12d3-a456-426614174000';
```

**TypeScript Usage:**
```typescript
const { data, error } = await supabase
  .from('plan_overview')
  .select('*')
  .eq('user_id', userId);
```

---

## Security

All functions use `SECURITY DEFINER` with `SET search_path = public` to:
- Respect Row Level Security (RLS) policies
- Prevent SQL injection attacks
- Ensure consistent execution context

Functions are granted to `authenticated` role only, ensuring only logged-in users can execute them.

---

## Performance Considerations

1. **Indexing**: All functions leverage existing indexes on:
   - `transformation_plans(user_id, status)`
   - `progress_tracking(plan_id, week_number)`
   - JSONB GIN indexes for efficient JSON queries

2. **Caching**: Consider caching function results in your application layer for frequently accessed data.

3. **Batch Operations**: When fetching data for multiple plans, consider using the `plan_overview` view instead of calling functions repeatedly.

---

## Error Handling

Functions return empty result sets when:
- Plan ID doesn't exist
- User has no access to the plan (RLS)
- No progress data exists

Always check for empty results in your application code:

```typescript
const { data, error } = await supabase.rpc('get_plan_statistics', { p_plan_id: planId });

if (error) {
  console.error('Function error:', error);
  return;
}

if (!data || data.length === 0) {
  console.log('No data found for this plan');
  return;
}

// Process data
const stats = data[0];
```

---

## Migration

This migration file (`20240101000002_create_database_functions.sql`) should be applied after:
1. `20240101000000_create_transformation_plans_table.sql`
2. `20240101000001_create_progress_tracking_table.sql`

To apply migrations:
```bash
# Using Supabase CLI
supabase db push

# Or apply manually in Supabase Dashboard > SQL Editor
```

---

## Testing

Example test queries to verify functions work correctly:

```sql
-- Test with a sample plan ID
DO $$
DECLARE
  test_plan_id UUID;
BEGIN
  -- Get a test plan ID
  SELECT id INTO test_plan_id FROM transformation_plans LIMIT 1;
  
  -- Test each function
  RAISE NOTICE 'Testing get_plan_statistics...';
  PERFORM * FROM get_plan_statistics(test_plan_id);
  
  RAISE NOTICE 'Testing analyze_progress_trends...';
  PERFORM * FROM analyze_progress_trends(test_plan_id, 4);
  
  RAISE NOTICE 'Testing calculate_adherence_scores...';
  PERFORM * FROM calculate_adherence_scores(test_plan_id);
  
  RAISE NOTICE 'All functions executed successfully!';
END $$;
```

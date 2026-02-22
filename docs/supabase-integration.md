# Supabase Integration Guide

## Overview

This document explains how to integrate Supabase alongside the existing Firebase setup for the AI Nutrition Engine feature. The application uses a hybrid approach:

- **Firebase**: Authentication, general user data, and existing features
- **Supabase**: AI Nutrition Engine data (transformation plans, progress tracking)

## Why Supabase for AI Nutrition Engine?

1. **JSONB Support**: PostgreSQL's JSONB type is ideal for storing complex, nested transformation plan data
2. **Advanced Querying**: Better support for complex queries on nested JSON structures
3. **Row Level Security**: Built-in RLS for secure multi-tenant data access
4. **Real-time Subscriptions**: Native support for real-time updates on plan progress
5. **Performance**: Better performance for complex analytical queries

## Installation

### 1. Install Supabase Client

```bash
npm install @supabase/supabase-js
```

### 2. Install Supabase CLI (for local development)

```bash
npm install -g supabase
```

### 3. Initialize Supabase

```bash
cd supabase
supabase init
```

## Configuration

### Environment Variables

Add to `.env.local`:

```env
# Supabase Configuration (for AI Nutrition Engine)
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
```

### Create Supabase Client

Create `src/lib/supabaseClient.ts`:

```typescript
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
```

## Authentication Strategy

### Hybrid Auth Approach

Since Firebase handles authentication, we need to sync the user context to Supabase:

```typescript
// src/lib/supabaseAuth.ts
import { supabase } from './supabaseClient';
import { auth } from './firebase'; // Your existing Firebase auth

/**
 * Sync Firebase user to Supabase
 * Call this after Firebase authentication
 */
export async function syncFirebaseUserToSupabase(firebaseUser: any) {
  // Get Firebase ID token
  const idToken = await firebaseUser.getIdToken();
  
  // Set Supabase session using Firebase token
  // Note: This requires custom JWT configuration in Supabase
  const { data, error } = await supabase.auth.setSession({
    access_token: idToken,
    refresh_token: '', // Handle refresh token if needed
  });
  
  return { data, error };
}
```

### Alternative: Service Role for Backend

For backend operations, use the service role key:

```typescript
// backend/src/lib/supabaseAdmin.ts
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);
```

## Running Migrations

### Local Development

1. Start local Supabase:
```bash
supabase start
```

2. Apply migrations:
```bash
supabase db push
```

3. View local database:
```bash
supabase studio
```

### Production

1. Link to production project:
```bash
supabase link --project-ref your-project-ref
```

2. Push migrations:
```bash
supabase db push
```

## Usage Examples

### Creating a Transformation Plan

```typescript
import { supabase } from '@/lib/supabaseClient';
import type { TransformationPlanInsert } from '@/types/supabase-transformation-plans';

async function createTransformationPlan(
  userId: string,
  planData: TransformationPlanInsert
) {
  const { data, error } = await supabase
    .from('transformation_plans')
    .insert({
      user_id: userId,
      ...planData,
    })
    .select()
    .single();

  if (error) {
    console.error('Error creating plan:', error);
    return null;
  }

  return data;
}
```

### Fetching User's Plans

```typescript
async function getUserPlans(userId: string) {
  const { data, error } = await supabase
    .from('transformation_plans')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching plans:', error);
    return [];
  }

  return data;
}
```

### Updating Plan Progress

```typescript
async function updatePlanProgress(
  planId: string,
  completionPercentage: number
) {
  const { data, error } = await supabase
    .from('transformation_plans')
    .update({ completion_percentage: completionPercentage })
    .eq('id', planId)
    .select()
    .single();

  if (error) {
    console.error('Error updating plan:', error);
    return null;
  }

  return data;
}
```

### Querying JSONB Fields

```typescript
// Find plans with specific metabolic strategy
async function findPlansByStrategy(userId: string, strategy: string) {
  const { data, error } = await supabase
    .from('transformation_plans')
    .select('*')
    .eq('user_id', userId)
    .eq('metabolic_analysis->strategy', strategy);

  return data;
}

// Find plans with calorie target in range
async function findPlansByCalorieRange(
  userId: string,
  minCalories: number,
  maxCalories: number
) {
  const { data, error } = await supabase
    .from('transformation_plans')
    .select('*')
    .eq('user_id', userId)
    .gte('metabolic_analysis->target_calories_week1', minCalories)
    .lte('metabolic_analysis->target_calories_week1', maxCalories);

  return data;
}
```

### Real-time Subscriptions

```typescript
// Subscribe to plan updates
function subscribeToPlans(userId: string, callback: (plan: any) => void) {
  const subscription = supabase
    .channel('transformation_plans_changes')
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'transformation_plans',
        filter: `user_id=eq.${userId}`,
      },
      (payload) => {
        callback(payload.new);
      }
    )
    .subscribe();

  return subscription;
}
```

## Data Migration from Firebase

If you need to migrate existing data from Firebase to Supabase:

```typescript
// scripts/migrateToSupabase.ts
import { db } from './firebase'; // Firebase Firestore
import { supabaseAdmin } from './supabaseAdmin';

async function migrateTransformationPlans() {
  // Fetch from Firebase
  const snapshot = await db.collection('transformation_plans').get();
  
  const plans = snapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data(),
  }));

  // Insert into Supabase
  for (const plan of plans) {
    const { error } = await supabaseAdmin
      .from('transformation_plans')
      .insert(plan);

    if (error) {
      console.error(`Failed to migrate plan ${plan.id}:`, error);
    }
  }

  console.log(`Migrated ${plans.length} plans`);
}
```

## Best Practices

### 1. Type Safety

Always use the TypeScript types defined in `src/types/supabase-transformation-plans.ts`:

```typescript
import type { TransformationPlan, TransformationPlanInsert } from '@/types/supabase-transformation-plans';
```

### 2. Error Handling

Always check for errors in Supabase responses:

```typescript
const { data, error } = await supabase.from('transformation_plans').select();

if (error) {
  // Handle error appropriately
  console.error('Database error:', error);
  throw new Error('Failed to fetch plans');
}
```

### 3. Row Level Security

Never bypass RLS in client-side code. Use the service role key only in backend/server-side code.

### 4. JSONB Validation

Validate JSONB structure before insertion:

```typescript
import { z } from 'zod';

const metabolicAnalysisSchema = z.object({
  bmr: z.number().positive(),
  maintenance_calories: z.number().positive(),
  target_calories_week1: z.number().positive(),
  strategy: z.enum(['deficit', 'surplus', 'maintenance', 'cycling']),
});

// Validate before insert
const validatedData = metabolicAnalysisSchema.parse(metabolicAnalysis);
```

### 5. Connection Pooling

For backend services, use connection pooling:

```typescript
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(supabaseUrl, supabaseKey, {
  db: {
    schema: 'public',
  },
  auth: {
    persistSession: false,
  },
  global: {
    headers: { 'x-application-name': 'fitness-app-backend' },
  },
});
```

## Troubleshooting

### Issue: RLS blocking queries

**Solution**: Ensure the user is authenticated and the JWT token is valid:

```typescript
const { data: { user } } = await supabase.auth.getUser();
console.log('Current user:', user);
```

### Issue: JSONB query not working

**Solution**: Use the correct JSON operators:

- `->` for JSON object field
- `->>` for JSON object field as text
- `@>` for JSON contains
- `?` for JSON key exists

```typescript
// Correct
.eq('metabolic_analysis->strategy', 'deficit')

// Incorrect
.eq('metabolic_analysis.strategy', 'deficit')
```

### Issue: Migration fails

**Solution**: Check the migration file for syntax errors and ensure the database is accessible:

```bash
supabase db lint
supabase db diff
```

## Resources

- [Supabase Documentation](https://supabase.com/docs)
- [Supabase JavaScript Client](https://supabase.com/docs/reference/javascript/introduction)
- [PostgreSQL JSONB Functions](https://www.postgresql.org/docs/current/functions-json.html)
- [Row Level Security](https://supabase.com/docs/guides/auth/row-level-security)

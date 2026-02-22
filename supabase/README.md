# Supabase Database Migrations

This directory contains Supabase database migrations for the AI-Powered Fitness Web Application.

## Overview

The application uses Supabase as the database for the AI Nutrition Engine feature, which requires complex JSONB storage for transformation plans, meal plans, and workout programs.

## Migration Files

Migrations are stored in the `migrations/` directory and follow the naming convention:
```
YYYYMMDDHHMMSS_description_of_migration.sql
```

### Current Migrations

1. **20240101000000_create_transformation_plans_table.sql**
   - Creates the `transformation_plans` table with JSONB fields
   - Includes indexes for performance optimization
   - Implements Row Level Security (RLS) policies
   - Adds automatic timestamp updates

## Setup Instructions

### 1. Install Supabase CLI

```bash
npm install -g supabase
```

### 2. Initialize Supabase (if not already done)

```bash
supabase init
```

### 3. Link to Your Supabase Project

```bash
supabase link --project-ref your-project-ref
```

### 4. Run Migrations

To apply all pending migrations:

```bash
supabase db push
```

Or to apply migrations remotely:

```bash
supabase db push --db-url your-database-url
```

### 5. Verify Migration

Check that the table was created successfully:

```bash
supabase db diff
```

## Environment Variables

Add the following to your `.env.local` file:

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
```

## Database Schema

### transformation_plans Table

Stores comprehensive transformation programs with the following structure:

**Core Fields:**
- `id` (UUID): Primary key
- `user_id` (UUID): Foreign key to auth.users
- `created_at`, `updated_at` (TIMESTAMP): Automatic timestamps
- `duration_weeks` (INTEGER): Plan duration (1-52 weeks)
- `subscription_tier` (TEXT): 'free' or 'pro'
- `status` (TEXT): 'active', 'completed', 'archived', or 'paused'
- `completion_percentage` (DECIMAL): Progress (0-100)

**JSONB Fields:**
- `metabolic_analysis`: BMR, TDEE, target calories, strategy
- `macro_strategy`: Protein, carbs, fats, macro cycling
- `weekly_progression`: Weekly calorie targets and adjustments
- `meal_plan`: Training day and rest day meal plans
- `workout_plan`: Workout split, schedule, progression
- `progress_projection`: Predicted outcomes and confidence
- `grocery_optimization`: Grocery lists and optimization (Pro only)

**Indexes:**
- User ID, status, created_at for fast queries
- GIN indexes on JSONB fields for efficient JSON querying

**Security:**
- Row Level Security (RLS) enabled
- Users can only access their own plans
- Policies for SELECT, INSERT, UPDATE, DELETE

## Creating New Migrations

To create a new migration:

```bash
supabase migration new your_migration_name
```

This will create a new file in `supabase/migrations/` with a timestamp prefix.

## Rollback

To rollback the last migration:

```bash
supabase db reset
```

**Warning:** This will reset the entire database. Use with caution in production.

## Best Practices

1. **Always test migrations locally first** using `supabase start` and `supabase db push`
2. **Use transactions** for complex migrations
3. **Add comments** to document table and column purposes
4. **Create indexes** for frequently queried fields
5. **Enable RLS** for all user-facing tables
6. **Validate JSONB structure** in application code before insertion

## Troubleshooting

### Migration fails with "relation already exists"

If the table already exists, you can either:
1. Drop the table manually: `DROP TABLE IF EXISTS transformation_plans CASCADE;`
2. Modify the migration to use `CREATE TABLE IF NOT EXISTS`

### RLS policies blocking queries

Ensure you're using the correct authentication context:
- Use `supabase.auth.getUser()` to get the authenticated user
- Pass the user's JWT token in API requests
- Use service role key for admin operations (backend only)

### JSONB query performance

If JSONB queries are slow:
1. Ensure GIN indexes are created on JSONB columns
2. Use specific JSON path queries: `column->>'key'`
3. Consider extracting frequently queried fields to regular columns

## Resources

- [Supabase Documentation](https://supabase.com/docs)
- [PostgreSQL JSONB Documentation](https://www.postgresql.org/docs/current/datatype-json.html)
- [Row Level Security Guide](https://supabase.com/docs/guides/auth/row-level-security)

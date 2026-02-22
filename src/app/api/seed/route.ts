import { NextRequest, NextResponse } from 'next/server';
import { runDatabaseSeeding, DatabaseSeeder } from '../../../lib/seedDatabase';

/**
 * API route for seeding the database with initial exercise data
 * This should only be used in development environment
 * 
 * GET /api/seed - Seeds the database with initial data
 * GET /api/seed?stats=true - Returns current database statistics
 * GET /api/seed?validate=true - Validates seed data without seeding
 */
export async function GET(request: NextRequest) {
  // Only allow in development environment
  if (process.env.NODE_ENV === 'production') {
    return NextResponse.json(
      { error: 'Database seeding is not allowed in production' },
      { status: 403 }
    );
  }

  const { searchParams } = new URL(request.url);
  const statsOnly = searchParams.get('stats') === 'true';
  const validateOnly = searchParams.get('validate') === 'true';

  try {
    // Return statistics only
    if (statsOnly) {
      const stats = await DatabaseSeeder.getSeedingStats();
      const isSeeded = await DatabaseSeeder.isDatabaseSeeded();
      
      return NextResponse.json({
        success: true,
        isSeeded,
        stats,
      });
    }

    // Validate seed data only
    if (validateOnly) {
      const validation = DatabaseSeeder.validateSeedData();
      
      return NextResponse.json({
        success: true,
        validation,
      });
    }

    // Full seeding process
    console.log('🌱 Starting database seeding via API...');
    
    await runDatabaseSeeding();
    
    const stats = await DatabaseSeeder.getSeedingStats();
    
    return NextResponse.json({
      success: true,
      message: 'Database seeded successfully',
      stats,
    });

  } catch (error) {
    console.error('❌ Error in seed API:', error);
    
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
      },
      { status: 500 }
    );
  }
}

/**
 * POST method for more controlled seeding operations
 */
export async function POST(request: NextRequest) {
  // Only allow in development environment
  if (process.env.NODE_ENV === 'production') {
    return NextResponse.json(
      { error: 'Database seeding is not allowed in production' },
      { status: 403 }
    );
  }

  try {
    const body = await request.json();
    const { action } = body;

    switch (action) {
      case 'seed-categories':
        await DatabaseSeeder.seedCategoriesOnly();
        return NextResponse.json({
          success: true,
          message: 'Categories seeded successfully',
        });

      case 'seed-exercises':
        await DatabaseSeeder.seedExercisesOnly();
        return NextResponse.json({
          success: true,
          message: 'Exercises seeded successfully',
        });

      case 'seed-all':
        await DatabaseSeeder.seedAll();
        const stats = await DatabaseSeeder.getSeedingStats();
        return NextResponse.json({
          success: true,
          message: 'Database seeded successfully',
          stats,
        });

      default:
        return NextResponse.json(
          { error: 'Invalid action. Use: seed-categories, seed-exercises, or seed-all' },
          { status: 400 }
        );
    }

  } catch (error) {
    console.error('❌ Error in seed API POST:', error);
    
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
      },
      { status: 500 }
    );
  }
}
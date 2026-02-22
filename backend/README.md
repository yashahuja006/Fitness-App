# Fitness App Backend API

Express.js backend server for the AI-Powered Fitness Web Application.

## Features

- **Authentication**: Firebase Auth integration with JWT tokens
- **Database**: Firebase Firestore for data persistence
- **API Routes**: RESTful API endpoints for all app features
- **Security**: CORS, Helmet, and authentication middleware
- **Error Handling**: Comprehensive error handling and logging
- **TypeScript**: Full TypeScript support with strict type checking

## API Endpoints

### Authentication (`/api/auth`)
- `POST /register` - User registration
- `POST /login` - User login
- `POST /refresh` - Token refresh
- `POST /reset-password` - Password reset
- `POST /verify-email` - Email verification
- `POST /logout` - User logout (protected)
- `GET /profile` - Get user profile (protected)
- `PUT /profile` - Update user profile (protected)
- `DELETE /account` - Delete user account (protected)

### Users (`/api/users`)
- `GET /profile` - Get user profile
- `PUT /profile` - Update user profile
- `PATCH /preferences` - Update user preferences
- `PATCH /metrics` - Update personal metrics
- `GET /search` - Search users
- `GET /:userId/public-profile` - Get public profile

### Workouts (`/api/workouts`)
- `GET /` - Get user workouts
- `POST /` - Create workout
- `GET /:workoutId` - Get specific workout
- `PUT /:workoutId` - Update workout
- `DELETE /:workoutId` - Delete workout
- `POST /:workoutId/start` - Start workout session
- `POST /:workoutId/complete` - Complete workout session

### Exercises (`/api/exercises`)
- `GET /` - Search exercises
- `GET /:exerciseId` - Get exercise details
- `GET /categories` - Get exercise categories
- `GET /muscle-groups` - Get muscle groups
- `GET /equipment` - Get equipment types
- `GET /:exerciseId/recommendations` - Get exercise recommendations (protected)

### Diet (`/api/diet`)
- `GET /plans` - Get user diet plans
- `POST /plans/generate` - Generate new diet plan
- `GET /plans/:planId` - Get specific diet plan
- `PUT /plans/:planId` - Update diet plan
- `DELETE /plans/:planId` - Delete diet plan

### Progress (`/api/progress`)
- `GET /` - Get progress overview
- `POST /metrics` - Record metrics
- `GET /metrics` - Get metrics history
- `GET /goals` - Get user goals
- `POST /goals` - Create new goal
- `GET /analytics/*` - Various analytics endpoints

### Chat (`/api/chat`)
- `GET /sessions` - Get chat sessions
- `POST /sessions` - Create chat session
- `POST /sessions/:sessionId/messages` - Send message
- `GET /sessions/:sessionId/messages` - Get messages

### Admin (`/api/admin`)
- `GET /users` - Get all users (admin only)
- `GET /analytics/*` - System analytics (admin only)
- `GET /health/*` - System health monitoring (admin only)

## Setup

1. Install dependencies:
   ```bash
   npm install
   ```

2. Copy environment variables:
   ```bash
   cp .env.example .env
   ```

3. Configure Firebase:
   - Set up Firebase project
   - Add service account key to environment variables
   - Configure Firestore database

4. Start development server:
   ```bash
   npm run dev
   ```

## Scripts

- `npm run dev` - Start development server with hot reload
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint
- `npm run type-check` - Run TypeScript type checking

## Environment Variables

See `.env.example` for required environment variables.

## Project Structure

```
backend/
├── src/
│   ├── config/          # Configuration files
│   ├── controllers/     # Route controllers
│   ├── middleware/      # Express middleware
│   ├── routes/          # API routes
│   ├── services/        # Business logic services
│   ├── types/           # TypeScript type definitions
│   ├── utils/           # Utility functions
│   └── index.ts         # Main server file
├── .env.example         # Environment variables template
├── package.json         # Dependencies and scripts
├── tsconfig.json        # TypeScript configuration
└── README.md           # This file
```

## Development

The server runs on port 3001 by default and provides:
- Health check endpoint at `/health`
- API documentation (to be added)
- Error logging and monitoring
- CORS configuration for frontend integration

## Security

- Firebase Authentication for user management
- Helmet.js for security headers
- CORS configuration
- Input validation and sanitization
- Role-based access control

## Testing

Testing framework setup is planned for future implementation with Jest and Supertest.
# Firebase Integration Setup

## Overview

This document describes the Firebase integration implemented for the AI-Powered Fitness Web Application, including Authentication, Firestore database, and Storage services.

## Firebase Services Configured

### 1. Firebase Authentication
- **Purpose**: User registration, login, password reset, and session management
- **Features**: Email/password authentication with profile management
- **Location**: `src/contexts/AuthContext.tsx`

### 2. Firebase Firestore
- **Purpose**: NoSQL database for user profiles, workout data, and application data
- **Features**: Real-time data synchronization, offline support, scalable queries
- **Location**: `src/lib/firestore.ts`

### 3. Firebase Storage
- **Purpose**: File storage for user avatars, workout videos, and media assets
- **Features**: Secure file uploads, CDN delivery, automatic scaling
- **Location**: `src/lib/firebase.ts`

## Project Structure

```
src/
├── contexts/
│   └── AuthContext.tsx          # Authentication context and provider
├── components/
│   ├── auth/
│   │   ├── AuthModal.tsx        # Main authentication modal
│   │   ├── LoginForm.tsx        # Login form component
│   │   ├── RegisterForm.tsx     # Registration form component
│   │   ├── PasswordResetForm.tsx # Password reset form
│   │   ├── ProtectedRoute.tsx   # Route protection component
│   │   └── index.ts            # Auth components exports
│   └── profile/
│       ├── UserProfileForm.tsx  # User profile management
│       └── index.ts            # Profile components exports
├── hooks/
│   ├── useAuth.ts              # Authentication hook
│   └── useUserProfile.ts       # User profile management hook
├── lib/
│   ├── firebase.ts             # Firebase configuration and initialization
│   └── firestore.ts           # Firestore service classes and utilities
├── types/
│   └── auth.ts                 # Authentication and user profile types
└── app/
    ├── layout.tsx              # Root layout with AuthProvider
    └── auth-demo/
        └── page.tsx            # Demo page for testing authentication
```

## Environment Configuration

### Required Environment Variables

Create a `.env.local` file in the project root with the following variables:

```bash
# Firebase Configuration
NEXT_PUBLIC_FIREBASE_API_KEY=your_firebase_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id

# Development Environment
NODE_ENV=development
```

### Firebase Project Setup

1. **Create Firebase Project**:
   - Go to [Firebase Console](https://console.firebase.google.com/)
   - Create a new project
   - Enable Authentication, Firestore, and Storage

2. **Configure Authentication**:
   - Enable Email/Password authentication
   - Configure authorized domains for production

3. **Set up Firestore**:
   - Create database in production mode
   - Configure security rules for user data access

4. **Configure Storage**:
   - Set up storage bucket
   - Configure security rules for file uploads

## Authentication Features

### User Registration
- Email and password validation
- Display name requirement
- Automatic user profile creation in Firestore
- Error handling for common registration issues

### User Login
- Email/password authentication
- Remember user sessions
- Automatic profile loading
- Comprehensive error handling

### Password Reset
- Email-based password reset
- User-friendly success/error messages
- Secure reset flow

### Profile Management
- Personal metrics (height, weight, age, gender)
- Activity level and fitness goals
- Preferences (units, theme, notifications, privacy)
- Real-time profile updates

## Data Models

### User Profile Structure
```typescript
interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  photoURL?: string;
  personalMetrics: {
    height: number;
    weight: number;
    age: number;
    gender: 'male' | 'female' | 'other';
    activityLevel: 'sedentary' | 'light' | 'moderate' | 'active' | 'very_active';
    fitnessGoals: string[];
  };
  preferences: {
    units: 'metric' | 'imperial';
    theme: 'light' | 'dark' | 'auto';
    notifications: NotificationSettings;
    privacy: PrivacySettings;
  };
  createdAt: Date;
  updatedAt: Date;
}
```

## Firestore Services

### Generic FirestoreService
- CRUD operations for any collection
- Query building with conditions, ordering, and pagination
- Automatic timestamp management
- Type-safe operations

### Specialized Services
- **UserService**: User profile management
- **ExerciseService**: Exercise database operations
- **WorkoutService**: Workout session tracking
- **DietPlanService**: Diet plan management

## Security Considerations

### Authentication Security
- Secure password requirements (minimum 6 characters)
- Email verification support
- Session management with automatic token refresh
- Protection against common authentication attacks

### Data Security
- User data isolation (users can only access their own data)
- Input validation and sanitization
- Secure error messages (no information leakage)
- HTTPS enforcement in production

### Firestore Security Rules
```javascript
// Example security rules for user profiles
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
  }
}
```

## Development and Testing

### Development Server
```bash
npm run dev
```
- Runs on http://localhost:3000
- Hot reload enabled
- Firebase emulators can be used for local development

### Testing Authentication
- Visit `/auth-demo` to test authentication features
- Test user registration, login, and profile management
- Verify error handling and validation

### Type Checking
```bash
npm run type-check
```
- Ensures TypeScript type safety
- Validates Firebase integration types

## Error Handling

### Authentication Errors
- User-friendly error messages for common issues
- Proper error codes handling (user-not-found, wrong-password, etc.)
- Graceful fallbacks for network issues

### Firestore Errors
- Connection error handling
- Retry logic for transient failures
- Offline support with local caching

## Performance Optimizations

### Authentication
- Context-based state management
- Automatic session persistence
- Lazy loading of user profiles

### Firestore
- Efficient query patterns
- Pagination for large datasets
- Real-time listeners only where needed
- Proper indexing for common queries

## Next Steps

1. **Testing Framework**: Set up Jest and React Testing Library for comprehensive testing
2. **Security Rules**: Implement production-ready Firestore security rules
3. **Email Verification**: Add email verification flow for new users
4. **Social Authentication**: Add Google/Facebook login options
5. **Advanced Features**: Implement role-based access control for admin/instructor features

## Troubleshooting

### Common Issues

1. **Environment Variables Not Loading**:
   - Ensure `.env.local` file is in project root
   - Restart development server after adding variables
   - Check variable names have `NEXT_PUBLIC_` prefix for client-side access

2. **Firebase Connection Issues**:
   - Verify Firebase project configuration
   - Check network connectivity
   - Ensure Firebase services are enabled in console

3. **Authentication Errors**:
   - Check Firebase Authentication settings
   - Verify authorized domains in production
   - Review error codes in browser console

4. **Type Errors**:
   - Run `npm run type-check` to identify issues
   - Ensure all imports are correct
   - Check TypeScript configuration

## Resources

- [Firebase Documentation](https://firebase.google.com/docs)
- [Next.js Firebase Integration](https://nextjs.org/docs/app/building-your-application/authentication)
- [React Firebase Hooks](https://github.com/CSFrequency/react-firebase-hooks)
- [Firestore Security Rules](https://firebase.google.com/docs/firestore/security/get-started)
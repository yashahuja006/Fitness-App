# Implementation Plan: AI Dashboard System Architecture

## Overview

This implementation plan tracks the development of the comprehensive AI-powered fitness SaaS dashboard system. The system integrates workout tracking, nutrition monitoring, progress analytics, gamification, and AI-powered insights with real-time synchronization, subscription-based feature gating, and premium motion-enhanced UX.

**Tech Stack:** Next.js 16.1.4, TypeScript 5.x, Zustand, Supabase, Recharts, Framer Motion, Tailwind CSS 4.0, ShadCN UI

## Implementation Tasks

### Phase 1: Foundation and Infrastructure (Week 1)

#### 1. Project Setup and Configuration
- [ ] 1.1 Initialize Zustand state management structure
  - Create separate stores for user, subscription, workout, nutrition, progress, AI insights, gamification, and UI state
  - Configure persist middleware for user, subscription, and gamification stores
  - Set up subscribeWithSelector middleware for optimized re-renders
  - _Requirements: 3.1, 3.2, 3.3_

- [ ] 1.2 Configure Supabase integration
  - Set up Supabase client with environment variables
  - Configure authentication with session management
  - Set up real-time subscription infrastructure
  - Implement row-level security policies
  - _Requirements: 4.1, 23.1, 26.1_

- [ ] 1.3 Set up testing framework
  - Configure Jest and React Testing Library
  - Set up Fast-check for property-based testing
  - Create test utilities and helpers
  - Configure coverage reporting
  - _Requirements: Testing Strategy_

- [ ] 1.4 Configure Framer Motion and animation system
  - Create motion variants library
  - Set up reduced motion support
  - Configure animation performance optimization
  - _Requirements: 14.1, 14.2, 24.6_

### Phase 2: Database Schema and Models (Week 1-2)

#### 2. Supabase Database Implementation
- [ ] 2.1 Create database schema
  - Implement users, profiles, subscriptions tables
  - Create workouts and exercises tables with indexes
  - Implement meals and nutrition tracking tables
  - Create progress_tracking table
  - Create ai_insights table
  - Implement gamification tables (user_gamification, achievements, user_achievements)
  - _Requirements: Data Models section_

- [ ] 2.2 Implement row-level security policies
  - Create RLS policies for all tables
  - Test policy enforcement
  - Verify user data isolation
  - _Requirements: Row-Level Security Policies_

- [ ] 2.3 Create database migrations
  - Write migration scripts for schema creation
  - Test migration rollback procedures
  - Document migration process
  - _Requirements: Data Models section_

- [ ] 2.4 Write property tests for data models
  - **Property 1: User data isolation**
  - **Property 2: Subscription tier consistency**
  - **Validates: Requirements 3.1, 15.1, 15.7**

### Phase 3: State Management Implementation (Week 2)

#### 3. Zustand Stores Implementation
- [ ] 3.1 Implement User Store
  - Create user state interface and actions
  - Implement profile management
  - Add preferences handling
  - Implement onboarding state
  - _Requirements: User Store section_

- [ ] 3.2 Implement Subscription Store
  - Create subscription state and feature flags
  - Implement tier management
  - Add feature access checking
  - _Requirements: Subscription Store section_

- [ ] 3.3 Implement Workout Store
  - Create workout state and exercise management
  - Implement timer functionality
  - Add progression tracking
  - Implement Supabase sync
  - _Requirements: Workout Store section, 10.1-10.6_

- [ ] 3.4 Implement Nutrition Store
  - Create nutrition state and macro tracking
  - Implement meal logging
  - Add compliance calculation
  - Implement Supabase sync
  - _Requirements: Nutrition Store section, 11.1-11.6_

- [ ] 3.5 Implement Progress Store
  - Create progress data management
  - Implement projection storage
  - Add metric selection
  - Implement time range filtering
  - _Requirements: Progress Store section, 12.1-12.6_

- [ ] 3.6 Implement AI Insight Store
  - Create insight management
  - Implement analysis triggering
  - Add insight prioritization
  - _Requirements: AI Insight Store section, 6.1-6.6_

- [ ] 3.7 Implement Gamification Store
  - Create XP and level management
  - Implement achievement tracking
  - Add streak management
  - _Requirements: Gamification Store section, 13.1-13.6_

- [ ] 3.8 Implement UI Store
  - Create UI state management
  - Implement modal and toast systems
  - Add sync status tracking
  - _Requirements: UI Store section, 17.1-17.6, 18.1-18.6_

- [ ] 3.9 Write property tests for state management
  - **Property 3: State updates trigger correct re-renders**
  - **Property 4: Persistence works correctly**
  - **Property 5: State synchronization is consistent**
  - **Validates: Requirements 3.1, 3.2, 3.3, 4.3**

### Phase 4: Core Layout Components (Week 3)

#### 4. Layout Architecture Implementation
- [ ] 4.1 Create DashboardLayout component
  - Implement app shell structure
  - Add background animation layer
  - Integrate toast and modal layers
  - Implement responsive layout logic
  - _Requirements: 1.1-1.7, 2.1_

- [ ] 4.2 Build Sidebar component
  - Create navigation links
  - Implement user profile display
  - Add collapse/expand functionality
  - Implement active route highlighting
  - _Requirements: 19.1-19.6_

- [ ] 4.3 Build Navbar component
  - Create breadcrumb navigation
  - Add sync indicator
  - Implement gamification display (XP, level)
  - Add user menu
  - _Requirements: 1.1, 13.6_

- [ ] 4.4 Implement responsive behavior
  - Add breakpoint-based layout changes
  - Implement mobile sidebar toggle
  - Optimize touch targets for mobile
  - _Requirements: 21.1-21.6_

- [ ] 4.5 Write unit tests for layout components
  - Test sidebar collapse/expand
  - Test responsive breakpoints
  - Test navigation highlighting
  - _Requirements: 1.1, 19.1, 21.1_

### Phase 5: AI Optimization Engine (Week 3-4)

#### 5. AI Intelligence Layer Implementation
- [ ] 5.1 Create AI Optimization Engine core
  - Implement daily analysis orchestration
  - Create data fetching methods
  - Implement analysis module coordination
  - _Requirements: 5.1-5.6_

- [ ] 5.2 Implement nutrition analysis module
  - Create calorie comparison logic
  - Implement macro deviation detection
  - Add low protein warning system
  - _Requirements: 5.1, 5.2, 8.2_

- [ ] 5.3 Implement workout compliance analysis
  - Create compliance scoring algorithm
  - Implement missed workout detection
  - Add consistency tracking
  - _Requirements: 5.3, 8.1_

- [ ] 5.4 Implement recovery scoring system
  - Create intensity calculation
  - Implement recovery score algorithm
  - Add rest day recommendations
  - _Requirements: 5.4, 9.2_

- [ ] 5.5 Implement plateau detection
  - Create progress change analysis
  - Implement plateau flagging logic
  - Add recommendation generation
  - _Requirements: 5.5_

- [ ] 5.6 Create Insight Prioritizer
  - Implement priority sorting algorithm
  - Add tier-based filtering
  - Create upgrade nudge generation
  - _Requirements: 6.1-6.6_

- [ ] 5.7 Write property tests for AI engine
  - **Property 6: Insights are correctly prioritized**
  - **Property 7: Tier limits are enforced**
  - **Property 8: Analysis produces valid insights**
  - **Property 9: Recovery scores are within valid range**
  - **Validates: Requirements 5.1-5.6, 6.1-6.6**

### Phase 6: Predictive Models and Projections (Week 4)

#### 6. Projection Models Implementation
- [ ] 6.1 Create ProjectionModels class
  - Implement linear regression algorithm
  - Create weight projection generation
  - Add confidence interval calculation
  - _Requirements: 7.1-7.6_

- [ ] 6.2 Implement muscle gain projection
  - Create strength progression analysis
  - Implement muscle gain potential calculation
  - Add confidence scoring
  - _Requirements: 7.2_

- [ ] 6.3 Implement fat loss projection
  - Create calorie deficit analysis
  - Implement fat loss forecasting
  - Add compliance-based adjustments
  - _Requirements: 7.3_

- [ ] 6.4 Write property tests for projections
  - **Property 10: Projections follow realistic trends**
  - **Property 11: Confidence intervals are valid**
  - **Property 12: Projections require minimum data**
  - **Validates: Requirements 7.1-7.6**

### Phase 7: Gamification Engine (Week 5)

#### 7. Gamification System Implementation
- [ ] 7.1 Create XP Engine
  - Implement XP award system
  - Create level calculation algorithm
  - Add XP progress calculation
  - Implement level-up detection
  - _Requirements: 13.1, 13.2_

- [ ] 7.2 Implement Achievement System
  - Create achievement definitions
  - Implement achievement tracker
  - Add progress calculation per achievement
  - Create unlock detection
  - _Requirements: 13.4, 13.5_

- [ ] 7.3 Implement Streak System
  - Create streak tracking logic
  - Implement streak update on actions
  - Add streak loss prevention alerts
  - _Requirements: 8.3, 13.1_

- [ ] 7.4 Create level-up and achievement animations
  - Implement modal animations for level-up
  - Create achievement unlock animations
  - Add celebration effects
  - _Requirements: 13.3, 13.5_

- [ ] 7.5 Write property tests for gamification
  - **Property 13: XP is monotonically increasing**
  - **Property 14: Level calculation is consistent**
  - **Property 15: Achievements unlock at correct thresholds**
  - **Property 16: Streaks are correctly maintained**
  - **Validates: Requirements 13.1-13.6**

### Phase 8: Subscription Gating System (Week 5)

#### 8. Feature Gating Implementation
- [ ] 8.1 Create SubscriptionGate class
  - Implement feature access checking
  - Add insight limit enforcement
  - Create historical data limit logic
  - _Requirements: 15.1-15.7_

- [ ] 8.2 Create FeatureGate component
  - Implement feature access rendering
  - Add blur overlay for locked features
  - Create upgrade prompt UI
  - _Requirements: 15.6_

- [ ] 8.3 Implement upgrade prompts
  - Create upgrade modal
  - Add contextual upgrade nudges
  - Implement feature comparison display
  - _Requirements: 6.4, 15.6_

- [ ] 8.4 Write property tests for subscription gating
  - **Property 17: Feature access matches subscription tier**
  - **Property 18: Limits are correctly enforced**
  - **Property 19: Upgrade prompts appear for locked features**
  - **Validates: Requirements 15.1-15.7**

### Phase 9: Dashboard Modules - Overview and Metrics (Week 6)

#### 9. Overview Panel Implementation
- [ ] 9.1 Create Overview Panel component
  - Implement KPI cards (calories, macros, workouts, streak)
  - Add recovery indicator
  - Create daily progress circle
  - Implement real-time updates
  - _Requirements: 9.1-9.5_

- [ ] 9.2 Create MetricsGrid component
  - Build individual metric cards
  - Add animated value transitions
  - Implement color-coded status
  - _Requirements: 9.1, 9.4_

- [ ] 9.3 Write unit tests for overview components
  - Test KPI calculations
  - Test real-time update handling
  - Test animation triggers
  - _Requirements: 9.1-9.5_

### Phase 10: Dashboard Modules - Workout (Week 6-7)

#### 10. Workout Module Implementation
- [ ] 10.1 Create WorkoutModule component
  - Implement exercise list display
  - Add completion toggles
  - Create workout completion bar
  - _Requirements: 10.1, 10.2, 10.6_

- [ ] 10.2 Implement AutoSetTimer component
  - Create countdown timer
  - Add start/stop controls
  - Implement audio/visual alerts
  - _Requirements: 10.3_

- [ ] 10.3 Create StrengthProgressionMemory component
  - Display historical weight/reps data
  - Implement weight suggestions
  - Add progression visualization
  - _Requirements: 10.4, 10.5_

- [ ] 10.4 Write unit tests for workout module
  - Test exercise completion tracking
  - Test timer functionality
  - Test progression suggestions
  - _Requirements: 10.1-10.6_

### Phase 11: Dashboard Modules - Nutrition (Week 7)

#### 11. Nutrition Module Implementation
- [ ] 11.1 Create NutritionModule component
  - Implement macro tracker display
  - Add remaining calories indicator
  - Create visual progress bars
  - Display weekly compliance score
  - _Requirements: 11.1-11.5_

- [ ] 11.2 Create MacroTracker component
  - Build individual macro bars (protein, carbs, fats)
  - Add color-coded status
  - Implement animated progress
  - _Requirements: 11.1, 11.3_

- [ ] 11.3 Implement QuickAddButtons component
  - Create common food quick-add
  - Implement meal templates
  - Add recent foods
  - _Requirements: 11.6_

- [ ] 11.4 Write unit tests for nutrition module
  - Test macro calculations
  - Test compliance scoring
  - Test quick-add functionality
  - _Requirements: 11.1-11.6_

### Phase 12: Dashboard Modules - Progress Analytics (Week 8)

#### 12. Progress Analytics Implementation
- [ ] 12.1 Create ProgressAnalytics component
  - Implement multi-line graph with Recharts
  - Add metric toggle controls
  - Create time range selector
  - Implement scroll-triggered animation
  - _Requirements: 12.1, 12.3, 12.5, 12.6_

- [ ] 12.2 Implement ProjectionOverlay component (Pro feature)
  - Create projection line rendering
  - Add confidence interval visualization
  - Implement feature gating with blur
  - _Requirements: 12.2, 15.2, 15.6_

- [ ] 12.3 Create HistoricalComparison component
  - Implement period comparison logic
  - Add comparison visualization
  - Create comparison metrics display
  - _Requirements: 12.4_

- [ ] 12.4 Write unit tests for progress analytics
  - Test chart data transformation
  - Test projection calculations
  - Test time range filtering
  - _Requirements: 12.1-12.6_

### Phase 13: AI Coach Panel (Week 8)

#### 13. AI Coach Panel Implementation
- [ ] 13.1 Create AICoachPanel component
  - Implement insight list display
  - Add insight type categorization
  - Create expandable insight cards
  - Implement tier-based limiting
  - _Requirements: 22.1-22.6_

- [ ] 13.2 Create InsightCard component
  - Build expandable card UI
  - Add action buttons
  - Implement icon and color coding
  - _Requirements: 22.2, 22.3, 22.4_

- [ ] 13.3 Implement insight refresh system
  - Add manual refresh trigger
  - Implement automatic daily refresh
  - Create loading states
  - _Requirements: 22.5_

- [ ] 13.4 Write unit tests for AI coach panel
  - Test insight prioritization display
  - Test expansion/collapse
  - Test action button handlers
  - _Requirements: 22.1-22.6_

### Phase 14: Toast and Modal Systems (Week 9)

#### 14. Notification Systems Implementation
- [ ] 14.1 Create ToastLayer component
  - Implement toast stacking (max 3)
  - Add slide-in animations
  - Create auto-dismiss logic
  - Implement manual dismiss
  - _Requirements: 17.1-17.6_

- [ ] 14.2 Create ModalLayer component
  - Implement backdrop overlay
  - Add modal centering
  - Create scale-in animation
  - Implement focus trap
  - Add backdrop click handling
  - _Requirements: 18.1-18.6_

- [ ] 14.3 Create modal content components
  - Build onboarding modal
  - Create level-up modal
  - Implement achievement unlock modal
  - Add upgrade prompt modal
  - Create settings modal
  - _Requirements: 18.1, 27.1-27.6_

- [ ] 14.4 Write unit tests for notification systems
  - Test toast queueing
  - Test modal open/close
  - Test focus management
  - _Requirements: 17.1-17.6, 18.1-18.6_

### Phase 15: Real-Time Synchronization (Week 9)

#### 15. Data Sync Implementation
- [ ] 15.1 Create real-time subscription setup
  - Implement Supabase channel subscriptions
  - Add workout data sync
  - Add nutrition data sync
  - Add progress data sync
  - _Requirements: 23.1, 23.2_

- [ ] 15.2 Implement sync indicator
  - Create connection status display
  - Add syncing animation
  - Implement offline indicator
  - _Requirements: 23.3_

- [ ] 15.3 Create offline queue system
  - Implement action queueing
  - Add queue persistence
  - Create queue processing on reconnect
  - _Requirements: 23.4, 25.2_

- [ ] 15.4 Implement conflict resolution
  - Add timestamp-based resolution
  - Create merge strategies
  - Implement conflict notifications
  - _Requirements: 23.5_

- [ ] 15.5 Write property tests for sync system
  - **Property 20: Real-time updates are applied correctly**
  - **Property 21: Offline queue maintains order**
  - **Property 22: Conflicts are resolved consistently**
  - **Validates: Requirements 23.1-23.6**

### Phase 16: Authentication and Session Management (Week 10)

#### 16. Auth System Implementation
- [ ] 16.1 Create SessionManager class
  - Implement session initialization
  - Add auth state change listener
  - Create user data loading
  - Implement logout cleanup
  - _Requirements: 26.1-26.6_

- [ ] 16.2 Implement authentication flows
  - Create login page
  - Add signup page
  - Implement OAuth providers
  - Add password reset
  - _Requirements: 26.1_

- [ ] 16.3 Implement role-based access control
  - Add role checking middleware
  - Create protected route wrapper
  - Implement feature-level RBAC
  - _Requirements: 26.5_

- [ ] 16.4 Write unit tests for auth system
  - Test session persistence
  - Test token refresh
  - Test logout cleanup
  - _Requirements: 26.1-26.6_

### Phase 17: Onboarding Flow (Week 10)

#### 17. Onboarding Implementation
- [ ] 17.1 Create onboarding modal
  - Implement welcome screen
  - Add step-by-step tour
  - Create feature highlights
  - Implement skip functionality
  - _Requirements: 27.1-27.3_

- [ ] 17.2 Implement preference collection
  - Add units selection (metric/imperial)
  - Create notification preferences
  - Implement goal selection
  - _Requirements: 27.6_

- [ ] 17.3 Create restart tour functionality
  - Add tour restart option in settings
  - Implement tour progress tracking
  - _Requirements: 27.5_

- [ ] 17.4 Write unit tests for onboarding
  - Test tour progression
  - Test preference saving
  - Test skip functionality
  - _Requirements: 27.1-27.6_

### Phase 18: Performance Optimization (Week 11)

#### 18. Performance Implementation
- [ ] 18.1 Implement code splitting
  - Add dynamic imports for heavy components
  - Create loading skeletons
  - Implement route-based splitting
  - _Requirements: 20.1_

- [ ] 18.2 Implement lazy loading
  - Add viewport-based lazy loading for charts
  - Create intersection observer utilities
  - Implement progressive image loading
  - _Requirements: 20.2_

- [ ] 18.3 Add memoization
  - Implement React.memo for stable components
  - Add useMemo for expensive calculations
  - Create useCallback for stable handlers
  - _Requirements: 20.4, 20.5_

- [ ] 18.4 Implement virtual scrolling
  - Add virtual scrolling for exercise lists
  - Implement for achievement lists
  - Create for meal history
  - _Requirements: 20.6_

- [ ] 18.5 Optimize Zustand selectors
  - Create granular selectors
  - Implement selector memoization
  - Add subscription optimization
  - _Requirements: 3.2, 20.5_

- [ ] 18.6 Run Lighthouse audits
  - Achieve 90+ desktop performance score
  - Achieve 80+ mobile performance score
  - Fix identified issues
  - _Requirements: 20.7_

### Phase 19: Accessibility Implementation (Week 11)

#### 19. Accessibility Features
- [ ] 19.1 Implement keyboard navigation
  - Add focus management
  - Create visible focus indicators
  - Implement keyboard shortcuts
  - _Requirements: 24.1_

- [ ] 19.2 Add ARIA labels and roles
  - Implement for all custom components
  - Add screen reader announcements
  - Create accessible data visualizations
  - _Requirements: 24.2, 24.5_

- [ ] 19.3 Ensure color contrast compliance
  - Audit all text/background combinations
  - Fix contrast issues
  - Test with contrast checker tools
  - _Requirements: 24.3_

- [ ] 19.4 Implement reduced motion support
  - Add prefers-reduced-motion detection
  - Create reduced motion variants
  - Test with motion disabled
  - _Requirements: 14.6, 24.6_

- [ ] 19.5 Write accessibility tests
  - Test keyboard navigation
  - Test screen reader compatibility
  - Test color contrast
  - _Requirements: 24.1-24.6_

### Phase 20: Error Handling and Recovery (Week 12)

#### 20. Error Handling Implementation
- [ ] 20.1 Create ErrorBoundary component
  - Implement error catching
  - Add fallback UI
  - Create error logging
  - _Requirements: 25.4_

- [ ] 20.2 Implement API error handling
  - Create APIError class
  - Add error handler utility
  - Implement retry logic
  - _Requirements: 25.1, 25.3_

- [ ] 20.3 Create offline mode
  - Implement offline detection
  - Add offline UI indicators
  - Create offline queue
  - _Requirements: 25.2_

- [ ] 20.4 Add error monitoring
  - Integrate error logging service
  - Create error reporting UI
  - Implement user feedback collection
  - _Requirements: 25.5, 25.6_

- [ ] 20.5 Write error handling tests
  - Test error boundary
  - Test retry logic
  - Test offline queue
  - _Requirements: 25.1-25.6_

### Phase 21: Data Export and Privacy (Week 12)

#### 21. Privacy Controls Implementation
- [ ] 21.1 Create data export feature
  - Implement JSON export generation
  - Add export download functionality
  - Create export format documentation
  - _Requirements: 28.1_

- [ ] 21.2 Implement account deletion
  - Create deletion confirmation flow
  - Add data deletion logic
  - Implement deletion notification
  - _Requirements: 28.2, 28.3_

- [ ] 21.3 Add privacy controls
  - Create privacy settings UI
  - Implement sharing controls
  - Add AI opt-out option
  - _Requirements: 28.4, 28.5_

- [ ] 21.4 Write privacy feature tests
  - Test data export
  - Test account deletion
  - Test privacy settings
  - _Requirements: 28.1-28.6_

### Phase 22: Integration Testing (Week 13)

#### 22. End-to-End Testing
- [ ] 22.1 Write integration tests for complete user flows
  - Test registration to first workout
  - Test meal logging to AI insights
  - Test workout completion to XP award
  - Test subscription upgrade flow
  - _Requirements: All_

- [ ] 22.2 Write integration tests for data synchronization
  - Test real-time sync across devices
  - Test offline queue processing
  - Test conflict resolution
  - _Requirements: 23.1-23.6_

- [ ] 22.3 Write integration tests for AI system
  - Test daily analysis trigger
  - Test insight generation
  - Test projection calculation
  - _Requirements: 5.1-5.6, 7.1-7.6_

- [ ] 22.4 Perform cross-browser testing
  - Test on Chrome, Firefox, Safari, Edge
  - Test on mobile browsers
  - Fix browser-specific issues
  - _Requirements: 21.1-21.6_

### Phase 23: Final Polish and Deployment (Week 14)

#### 23. Production Readiness
- [ ] 23.1 Conduct security audit
  - Review RLS policies
  - Test authentication flows
  - Verify data isolation
  - _Requirements: 26.1-26.6_

- [ ] 23.2 Optimize bundle size
  - Analyze bundle composition
  - Remove unused dependencies
  - Implement tree shaking
  - _Requirements: 20.1_

- [ ] 23.3 Create deployment pipeline
  - Set up Vercel deployment
  - Configure environment variables
  - Set up database migrations
  - _Requirements: Production deployment_

- [ ] 23.4 Write documentation
  - Create API documentation
  - Write component documentation
  - Create deployment guide
  - Add troubleshooting guide
  - _Requirements: Documentation_

- [ ] 23.5 Final checkpoint and validation
  - Ensure all tests pass
  - Verify all requirements met
  - Conduct final user acceptance testing
  - Ask user if questions arise

## Success Criteria

### Technical Metrics
- [ ] Lighthouse performance score: 90+ (desktop), 80+ (mobile)
- [ ] Test coverage: 80% minimum
- [ ] All property tests pass with 100+ iterations
- [ ] Zero critical accessibility violations
- [ ] Bundle size under 500KB (gzipped)

### Functional Metrics
- [ ] All 28 requirements implemented and validated
- [ ] Real-time sync latency under 500ms
- [ ] AI analysis completes within 3 seconds
- [ ] Subscription gating works correctly for all features
- [ ] Offline mode functions correctly

### User Experience Metrics
- [ ] All animations run at 60fps
- [ ] Page load time under 2 seconds
- [ ] Time to interactive under 3 seconds
- [ ] Zero layout shifts during load
- [ ] Smooth transitions between all states

## Notes

- All tasks reference specific requirements for traceability
- Property tests validate universal correctness with 100+ iterations
- Unit tests validate specific examples and edge cases
- Integration tests validate complete user workflows
- The implementation follows a modular, incremental approach
- Each phase builds on previous phases
- Checkpoints ensure validation before proceeding
- Performance and accessibility are prioritized throughout


## Property-Based Testing Specifications

This section defines all property-based tests referenced in the implementation tasks. Each property test validates universal correctness properties using Fast-check with a minimum of 100 iterations.

### Property 1: User Data Isolation
**Feature:** ai-dashboard-system, Property 1: User data isolation  
**Validates:** Requirements 3.1, 15.1, 15.7

**Property:** For any two distinct users, their data must never be accessible to each other through any query or state operation.

**Test Strategy:**
```typescript
fc.assert(
  fc.property(
    fc.record({
      userId1: fc.uuid(),
      userId2: fc.uuid(),
      workoutData: fc.array(fc.record({ /* workout fields */ })),
      nutritionData: fc.array(fc.record({ /* nutrition fields */ }))
    }),
    async ({ userId1, userId2, workoutData, nutritionData }) => {
      // Given: Two users with their own data
      await seedUserData(userId1, workoutData, nutritionData);
      await seedUserData(userId2, [], []);
      
      // When: User 2 attempts to access User 1's data
      const user2WorkoutStore = useWorkoutStore.getState();
      const user2NutritionStore = useNutritionStore.getState();
      
      // Then: User 2 should see no data from User 1
      expect(user2WorkoutStore.exercises).toHaveLength(0);
      expect(user2NutritionStore.mealLog).toHaveLength(0);
    }
  ),
  { numRuns: 100 }
);
```

### Property 2: Subscription Tier Consistency
**Feature:** ai-dashboard-system, Property 2: Subscription tier consistency  
**Validates:** Requirements 3.1, 15.1, 15.7

**Property:** A user's subscription tier must remain consistent across all stores and feature gates throughout the session.

**Test Strategy:**
```typescript
fc.assert(
  fc.property(
    fc.record({
      tier: fc.constantFrom('free', 'pro'),
      operations: fc.array(fc.constantFrom('checkFeature', 'loadInsights', 'loadProjections'))
    }),
    ({ tier, operations }) => {
      // Given: A user with a specific tier
      useSubscriptionStore.getState().setTier(tier);
      
      // When: Multiple operations check tier
      const results = operations.map(op => {
        switch(op) {
          case 'checkFeature':
            return new SubscriptionGate(useSubscriptionStore.getState().tier).canAccess('projections');
          case 'loadInsights':
            return useAIInsightStore.getState().dailyInsightCount <= (tier === 'free' ? 3 : Infinity);
          case 'loadProjections':
            return useProgressStore.getState().projections.length > 0 ? tier === 'pro' : true;
        }
      });
      
      // Then: All operations should reflect the same tier
      const expectedAccess = tier === 'pro';
      expect(results.every(r => r === expectedAccess || r === true)).toBe(true);
    }
  ),
  { numRuns: 100 }
);
```

### Property 3: State Updates Trigger Correct Re-renders
**Feature:** ai-dashboard-system, Property 3: State updates trigger correct re-renders  
**Validates:** Requirements 3.1, 3.2, 3.3, 4.3

**Property:** When a state slice updates, only components subscribed to that slice should re-render.

**Test Strategy:**
```typescript
fc.assert(
  fc.property(
    fc.record({
      storeType: fc.constantFrom('workout', 'nutrition', 'progress'),
      updateValue: fc.anything()
    }),
    ({ storeType, updateValue }) => {
      // Given: Multiple components subscribed to different stores
      const renderCounts = {
        workout: 0,
        nutrition: 0,
        progress: 0
      };
      
      // When: One store updates
      switch(storeType) {
        case 'workout':
          useWorkoutStore.getState().loadWorkout('test-id');
          break;
        case 'nutrition':
          useNutritionStore.getState().logMeal({ /* meal data */ });
          break;
        case 'progress':
          useProgressStore.getState().addDataPoint({ /* progress data */ });
          break;
      }
      
      // Then: Only subscribed components should re-render
      // (This would be tested with React Testing Library render counts)
    }
  ),
  { numRuns: 100 }
);
```

### Property 4: Persistence Works Correctly
**Feature:** ai-dashboard-system, Property 4: Persistence works correctly  
**Validates:** Requirements 3.1, 3.2, 3.3

**Property:** Any state marked for persistence must survive page reload and restore exactly.

**Test Strategy:**
```typescript
fc.assert(
  fc.property(
    fc.record({
      userState: fc.record({ /* user fields */ }),
      subscriptionState: fc.record({ tier: fc.constantFrom('free', 'pro') }),
      gamificationState: fc.record({ xp: fc.nat(), level: fc.nat() })
    }),
    ({ userState, subscriptionState, gamificationState }) => {
      // Given: Stores with data
      useUserStore.setState(userState);
      useSubscriptionStore.setState(subscriptionState);
      useGamificationStore.setState(gamificationState);
      
      // When: Simulating page reload
      const persistedUser = localStorage.getItem('user-store');
      const persistedSub = localStorage.getItem('subscription-store');
      const persistedGam = localStorage.getItem('gamification-store');
      
      // Then: All persisted data should match original
      expect(JSON.parse(persistedUser!)).toMatchObject(userState);
      expect(JSON.parse(persistedSub!)).toMatchObject(subscriptionState);
      expect(JSON.parse(persistedGam!)).toMatchObject(gamificationState);
    }
  ),
  { numRuns: 100 }
);
```

### Property 5: State Synchronization is Consistent
**Feature:** ai-dashboard-system, Property 5: State synchronization is consistent  
**Validates:** Requirements 3.1, 3.2, 3.3, 4.3

**Property:** When data syncs from Supabase, local state must match remote state exactly.

**Test Strategy:**
```typescript
fc.assert(
  fc.property(
    fc.record({
      workouts: fc.array(fc.record({ /* workout fields */ })),
      meals: fc.array(fc.record({ /* meal fields */ }))
    }),
    async ({ workouts, meals }) => {
      // Given: Remote data in Supabase
      await supabase.from('workouts').insert(workouts);
      await supabase.from('meals').insert(meals);
      
      // When: Syncing to local state
      await useWorkoutStore.getState().syncFromSupabase();
      await useNutritionStore.getState().syncFromSupabase();
      
      // Then: Local state matches remote
      const localWorkouts = useWorkoutStore.getState().history;
      const localMeals = useNutritionStore.getState().mealLog;
      
      expect(localWorkouts).toHaveLength(workouts.length);
      expect(localMeals).toHaveLength(meals.length);
    }
  ),
  { numRuns: 100 }
);
```

### Property 6: Insights Are Correctly Prioritized
**Feature:** ai-dashboard-system, Property 6: Insights are correctly prioritized  
**Validates:** Requirements 5.1-5.6, 6.1-6.6

**Property:** Critical insights must always appear before improvement suggestions, which must appear before motivation prompts.

**Test Strategy:**
```typescript
fc.assert(
  fc.property(
    fc.array(
      fc.record({
        type: fc.constantFrom('critical', 'improvement', 'motivation', 'upgrade'),
        priority: fc.integer({ min: 0, max: 100 })
      })
    ),
    (insights) => {
      // Given: Random insights
      const prioritizer = new InsightPrioritizer();
      
      // When: Prioritizing insights
      const sorted = prioritizer.prioritize(insights, 'pro');
      
      // Then: Order must be: critical > improvement > motivation > upgrade
      for (let i = 0; i < sorted.length - 1; i++) {
        const current = sorted[i];
        const next = sorted[i + 1];
        
        if (current.type === 'critical') {
          expect(next.type).not.toBe('improvement');
          expect(next.type).not.toBe('motivation');
        }
        if (current.type === 'improvement') {
          expect(next.type).not.toBe('motivation');
        }
      }
    }
  ),
  { numRuns: 100 }
);
```

### Property 7: Tier Limits Are Enforced
**Feature:** ai-dashboard-system, Property 7: Tier limits are enforced  
**Validates:** Requirements 6.1-6.6, 15.1-15.7

**Property:** Free tier users must never see more than 3 insights, Pro users can see up to 5.

**Test Strategy:**
```typescript
fc.assert(
  fc.property(
    fc.record({
      tier: fc.constantFrom('free', 'pro'),
      insights: fc.array(fc.record({ /* insight fields */ }), { minLength: 0, maxLength: 20 })
    }),
    ({ tier, insights }) => {
      // Given: A user with a tier and many insights
      const prioritizer = new InsightPrioritizer();
      
      // When: Filtering insights
      const filtered = prioritizer.prioritize(insights, tier);
      
      // Then: Limits are enforced
      const expectedLimit = tier === 'free' ? 3 : 5;
      expect(filtered.length).toBeLessThanOrEqual(expectedLimit);
    }
  ),
  { numRuns: 100 }
);
```

### Property 8: Analysis Produces Valid Insights
**Feature:** ai-dashboard-system, Property 8: Analysis produces valid insights  
**Validates:** Requirements 5.1-5.6

**Property:** AI analysis must always produce insights with valid structure and non-empty descriptions.

**Test Strategy:**
```typescript
fc.assert(
  fc.property(
    fc.record({
      nutritionData: fc.record({ consumed: fc.nat(), target: fc.nat() }),
      workoutData: fc.record({ completed: fc.nat(), scheduled: fc.nat() })
    }),
    async ({ nutritionData, workoutData }) => {
      // Given: User data
      const engine = new AIOptimizationEngine('user-id', 'pro');
      
      // When: Running analysis
      const insights = await engine.runDailyAnalysis();
      
      // Then: All insights are valid
      insights.forEach(insight => {
        expect(insight.id).toBeTruthy();
        expect(insight.type).toMatch(/critical|improvement|motivation|upgrade/);
        expect(insight.priority).toBeGreaterThanOrEqual(0);
        expect(insight.priority).toBeLessThanOrEqual(100);
        expect(insight.title).toBeTruthy();
        expect(insight.description).toBeTruthy();
        expect(insight.timestamp).toBeInstanceOf(Date);
      });
    }
  ),
  { numRuns: 100 }
);
```

### Property 9: Recovery Scores Are Within Valid Range
**Feature:** ai-dashboard-system, Property 9: Recovery scores are within valid range  
**Validates:** Requirements 5.4

**Property:** Recovery scores must always be between 0 and 100.

**Test Strategy:**
```typescript
fc.assert(
  fc.property(
    fc.record({
      intensity: fc.integer({ min: 0, max: 100 }),
      restDays: fc.integer({ min: 0, max: 14 })
    }),
    ({ intensity, restDays }) => {
      // Given: Workout intensity and rest days
      const engine = new AIOptimizationEngine('user-id', 'pro');
      
      // When: Calculating recovery score
      const score = engine['calculateRecoveryScore'](intensity, restDays);
      
      // Then: Score is in valid range
      expect(score).toBeGreaterThanOrEqual(0);
      expect(score).toBeLessThanOrEqual(100);
    }
  ),
  { numRuns: 100 }
);
```

### Property 10: Projections Follow Realistic Trends
**Feature:** ai-dashboard-system, Property 10: Projections follow realistic trends  
**Validates:** Requirements 7.1-7.6

**Property:** Weight projections must not deviate more than 2kg per week from current trend.

**Test Strategy:**
```typescript
fc.assert(
  fc.property(
    fc.array(
      fc.record({
        date: fc.date(),
        weight: fc.float({ min: 50, max: 150 })
      }),
      { minLength: 7, maxLength: 30 }
    ),
    (historicalData) => {
      // Given: Historical weight data
      const model = new ProjectionModels();
      
      // When: Generating projections
      const projections = model.generateWeightProjection(historicalData, 8);
      
      // Then: Weekly changes are realistic (max 2kg/week)
      for (let i = 0; i < projections.length - 1; i++) {
        const weeklyChange = Math.abs(projections[i + 1].weight! - projections[i].weight!);
        expect(weeklyChange).toBeLessThanOrEqual(2);
      }
    }
  ),
  { numRuns: 100 }
);
```

### Property 11: Confidence Intervals Are Valid
**Feature:** ai-dashboard-system, Property 11: Confidence intervals are valid  
**Validates:** Requirements 7.1-7.6

**Property:** Confidence intervals must always contain the projected value and widen over time.

**Test Strategy:**
```typescript
fc.assert(
  fc.property(
    fc.array(
      fc.record({
        date: fc.date(),
        weight: fc.float({ min: 50, max: 150 })
      }),
      { minLength: 7, maxLength: 30 }
    ),
    (historicalData) => {
      // Given: Historical data
      const model = new ProjectionModels();
      
      // When: Generating projections
      const projections = model.generateWeightProjection(historicalData, 8);
      
      // Then: Confidence intervals are valid
      projections.forEach((proj, index) => {
        expect(proj.confidenceInterval.lower).toBeLessThanOrEqual(proj.weight!);
        expect(proj.confidenceInterval.upper).toBeGreaterThanOrEqual(proj.weight!);
        
        // Intervals should widen over time
        if (index > 0) {
          const prevWidth = projections[index - 1].confidenceInterval.upper - projections[index - 1].confidenceInterval.lower;
          const currWidth = proj.confidenceInterval.upper - proj.confidenceInterval.lower;
          expect(currWidth).toBeGreaterThanOrEqual(prevWidth);
        }
      });
    }
  ),
  { numRuns: 100 }
);
```

### Property 12: Projections Require Minimum Data
**Feature:** ai-dashboard-system, Property 12: Projections require minimum data  
**Validates:** Requirements 7.1-7.6

**Property:** Projection generation must fail gracefully when insufficient data is provided.

**Test Strategy:**
```typescript
fc.assert(
  fc.property(
    fc.array(
      fc.record({
        date: fc.date(),
        weight: fc.float({ min: 50, max: 150 })
      }),
      { minLength: 0, maxLength: 6 }
    ),
    (insufficientData) => {
      // Given: Insufficient historical data (< 7 days)
      const model = new ProjectionModels();
      
      // When: Attempting to generate projections
      // Then: Should throw error
      expect(() => {
        model.generateWeightProjection(insufficientData, 8);
      }).toThrow('Insufficient data for projection');
    }
  ),
  { numRuns: 100 }
);
```

### Property 13: XP Is Monotonically Increasing
**Feature:** ai-dashboard-system, Property 13: XP is monotonically increasing  
**Validates:** Requirements 13.1, 13.2

**Property:** Total XP must never decrease, only increase or stay the same.

**Test Strategy:**
```typescript
fc.assert(
  fc.property(
    fc.array(
      fc.record({
        action: fc.constantFrom('WORKOUT_COMPLETE', 'MEAL_LOGGED', 'MACRO_TARGET_HIT'),
        multiplier: fc.float({ min: 1, max: 2 })
      }),
      { minLength: 1, maxLength: 50 }
    ),
    (actions) => {
      // Given: Starting XP
      const engine = new XPEngine();
      const startXP = useGamificationStore.getState().xp;
      
      // When: Awarding XP for actions
      actions.forEach(({ action, multiplier }) => {
        engine.awardXP('user-id', action as any, multiplier);
      });
      
      // Then: XP only increases
      const endXP = useGamificationStore.getState().xp;
      expect(endXP).toBeGreaterThanOrEqual(startXP);
    }
  ),
  { numRuns: 100 }
);
```

### Property 14: Level Calculation Is Consistent
**Feature:** ai-dashboard-system, Property 14: Level calculation is consistent  
**Validates:** Requirements 13.1, 13.2

**Property:** For any given XP value, level calculation must always return the same level.

**Test Strategy:**
```typescript
fc.assert(
  fc.property(
    fc.integer({ min: 0, max: 100000 }),
    (xp) => {
      // Given: An XP value
      const engine = new XPEngine();
      
      // When: Calculating level multiple times
      const level1 = engine.calculateLevel(xp);
      const level2 = engine.calculateLevel(xp);
      const level3 = engine.calculateLevel(xp);
      
      // Then: All calculations return same level
      expect(level1).toBe(level2);
      expect(level2).toBe(level3);
    }
  ),
  { numRuns: 100 }
);
```

### Property 15: Achievements Unlock at Correct Thresholds
**Feature:** ai-dashboard-system, Property 15: Achievements unlock at correct thresholds  
**Validates:** Requirements 13.4, 13.5

**Property:** Achievements must unlock exactly when progress reaches target, not before or after.

**Test Strategy:**
```typescript
fc.assert(
  fc.property(
    fc.record({
      achievement: fc.record({
        id: fc.string(),
        target: fc.integer({ min: 1, max: 100 })
      }),
      progress: fc.integer({ min: 0, max: 150 })
    }),
    async ({ achievement, progress }) => {
      // Given: An achievement with a target
      const tracker = new AchievementTracker();
      
      // When: Progress reaches various values
      const shouldUnlock = progress >= achievement.target;
      
      // Then: Achievement unlocks only at threshold
      const unlocked = await tracker.checkAchievements('user-id');
      
      if (shouldUnlock) {
        expect(unlocked.some(a => a.id === achievement.id)).toBe(true);
      } else {
        expect(unlocked.some(a => a.id === achievement.id)).toBe(false);
      }
    }
  ),
  { numRuns: 100 }
);
```

### Property 16: Streaks Are Correctly Maintained
**Feature:** ai-dashboard-system, Property 16: Streaks are correctly maintained  
**Validates:** Requirements 13.1, 8.3

**Property:** Streaks must increment on consecutive days and reset on missed days.

**Test Strategy:**
```typescript
fc.assert(
  fc.property(
    fc.array(
      fc.record({
        date: fc.date(),
        completed: fc.boolean()
      })
    ).map(arr => arr.sort((a, b) => a.date.getTime() - b.date.getTime())),
    (dailyActions) => {
      // Given: A sequence of daily actions
      const store = useGamificationStore.getState();
      let expectedStreak = 0;
      let lastDate: Date | null = null;
      
      // When: Processing each day
      dailyActions.forEach(({ date, completed }) => {
        if (completed) {
          if (lastDate && isConsecutiveDay(lastDate, date)) {
            expectedStreak++;
          } else if (!lastDate) {
            expectedStreak = 1;
          } else {
            expectedStreak = 1; // Reset
          }
          lastDate = date;
        } else {
          expectedStreak = 0;
          lastDate = null;
        }
      });
      
      // Then: Streak matches expected
      expect(store.streaks.workout.current).toBe(expectedStreak);
    }
  ),
  { numRuns: 100 }
);
```

### Property 17: Feature Access Matches Subscription Tier
**Feature:** ai-dashboard-system, Property 17: Feature access matches subscription tier  
**Validates:** Requirements 15.1-15.7

**Property:** Feature access must exactly match the subscription tier's permissions.

**Test Strategy:**
```typescript
fc.assert(
  fc.property(
    fc.record({
      tier: fc.constantFrom('free', 'pro'),
      feature: fc.constantFrom('projections', 'unlimited-insights', 'custom-workout-plans', 'carb-cycling')
    }),
    ({ tier, feature }) => {
      // Given: A tier and feature
      const gate = new SubscriptionGate(tier);
      
      // When: Checking access
      const canAccess = gate.canAccess(feature);
      
      // Then: Access matches tier permissions
      const proFeatures = ['projections', 'unlimited-insights', 'custom-workout-plans', 'carb-cycling'];
      const expectedAccess = tier === 'pro' && proFeatures.includes(feature);
      
      expect(canAccess).toBe(expectedAccess);
    }
  ),
  { numRuns: 100 }
);
```

### Property 18: Limits Are Correctly Enforced
**Feature:** ai-dashboard-system, Property 18: Limits are correctly enforced  
**Validates:** Requirements 15.1-15.7

**Property:** Data access limits must be enforced based on subscription tier.

**Test Strategy:**
```typescript
fc.assert(
  fc.property(
    fc.record({
      tier: fc.constantFrom('free', 'pro'),
      dataPoints: fc.array(fc.record({ date: fc.date() }), { minLength: 0, maxLength: 100 })
    }),
    ({ tier, dataPoints }) => {
      // Given: Historical data and a tier
      const gate = new SubscriptionGate(tier);
      const limit = gate.getHistoricalDataLimit();
      
      // When: Filtering data by limit
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - limit);
      
      const filtered = dataPoints.filter(d => 
        limit === Infinity || d.date >= cutoffDate
      );
      
      // Then: Free tier sees max 30 days, Pro sees all
      if (tier === 'free') {
        expect(filtered.length).toBeLessThanOrEqual(30);
      } else {
        expect(filtered.length).toBe(dataPoints.length);
      }
    }
  ),
  { numRuns: 100 }
);
```

### Property 19: Upgrade Prompts Appear for Locked Features
**Feature:** ai-dashboard-system, Property 19: Upgrade prompts appear for locked features  
**Validates:** Requirements 15.6

**Property:** Upgrade prompts must appear when free tier users access pro features.

**Test Strategy:**
```typescript
fc.assert(
  fc.property(
    fc.constantFrom('projections', 'unlimited-insights', 'custom-workout-plans'),
    (proFeature) => {
      // Given: A free tier user
      const gate = new SubscriptionGate('free');
      
      // When: Checking if upgrade prompt should show
      const shouldShow = gate.shouldShowUpgradePrompt(proFeature);
      
      // Then: Prompt should always show for pro features
      expect(shouldShow).toBe(true);
    }
  ),
  { numRuns: 100 }
);
```

### Property 20: Real-Time Updates Are Applied Correctly
**Feature:** ai-dashboard-system, Property 20: Real-time updates are applied correctly  
**Validates:** Requirements 23.1-23.6

**Property:** Real-time updates from Supabase must merge into state without data loss.

**Test Strategy:**
```typescript
fc.assert(
  fc.property(
    fc.record({
      existingData: fc.array(fc.record({ id: fc.uuid(), value: fc.anything() })),
      realtimeUpdate: fc.record({ id: fc.uuid(), value: fc.anything() })
    }),
    async ({ existingData, realtimeUpdate }) => {
      // Given: Existing local state
      useWorkoutStore.setState({ exercises: existingData });
      
      // When: Real-time update arrives
      await useWorkoutStore.getState().handleRealtimeUpdate({
        eventType: 'INSERT',
        new: realtimeUpdate
      });
      
      // Then: Update is merged without losing existing data
      const finalState = useWorkoutStore.getState().exercises;
      expect(finalState).toContainEqual(realtimeUpdate);
      existingData.forEach(item => {
        expect(finalState).toContainEqual(item);
      });
    }
  ),
  { numRuns: 100 }
);
```

### Property 21: Offline Queue Maintains Order
**Feature:** ai-dashboard-system, Property 21: Offline queue maintains order  
**Validates:** Requirements 23.4, 25.2

**Property:** Actions queued while offline must execute in the same order when reconnected.

**Test Strategy:**
```typescript
fc.assert(
  fc.property(
    fc.array(
      fc.record({
        type: fc.constantFrom('insert', 'update', 'delete'),
        table: fc.constantFrom('workouts', 'meals'),
        data: fc.anything()
      }),
      { minLength: 1, maxLength: 20 }
    ),
    async (actions) => {
      // Given: Offline mode with queued actions
      const queue = new OfflineQueue();
      actions.forEach(action => queue.enqueue(action));
      
      // When: Processing queue
      const executionOrder: string[] = [];
      await queue.processQueue((action) => {
        executionOrder.push(action.id);
      });
      
      // Then: Execution order matches queue order
      const queueOrder = queue['queue'].map(a => a.id);
      expect(executionOrder).toEqual(queueOrder);
    }
  ),
  { numRuns: 100 }
);
```

### Property 22: Conflicts Are Resolved Consistently
**Feature:** ai-dashboard-system, Property 22: Conflicts are resolved consistently  
**Validates:** Requirements 23.5

**Property:** When conflicts occur, last-write-wins strategy must be applied consistently.

**Test Strategy:**
```typescript
fc.assert(
  fc.property(
    fc.record({
      localUpdate: fc.record({ id: fc.uuid(), value: fc.anything(), timestamp: fc.date() }),
      remoteUpdate: fc.record({ id: fc.uuid(), value: fc.anything(), timestamp: fc.date() })
    }).filter(({ localUpdate, remoteUpdate }) => localUpdate.id === remoteUpdate.id),
    async ({ localUpdate, remoteUpdate }) => {
      // Given: Conflicting updates with same ID
      const resolver = new ConflictResolver();
      
      // When: Resolving conflict
      const resolved = resolver.resolve(localUpdate, remoteUpdate);
      
      // Then: Latest timestamp wins
      const expected = localUpdate.timestamp > remoteUpdate.timestamp 
        ? localUpdate 
        : remoteUpdate;
      
      expect(resolved).toEqual(expected);
    }
  ),
  { numRuns: 100 }
);
```

## Property Test Configuration

All property-based tests must use the following configuration:

```typescript
// tests/property/config.ts
export const PBT_CONFIG = {
  numRuns: 100,           // Minimum 100 iterations per test
  seed: Date.now(),       // For reproducibility
  verbose: true,          // Show detailed output
  timeout: 10000,         // 10 second timeout per test
  endOnFailure: false     // Run all iterations even if one fails
};
```

## Running Property Tests

```bash
# Run all property tests
npm run test:pbt

# Run specific property test
npm run test:pbt -- --testNamePattern="Property 1"

# Run with specific seed for reproducibility
npm run test:pbt -- --seed=1234567890
```

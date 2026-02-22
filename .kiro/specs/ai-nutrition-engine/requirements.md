# AI Performance Nutrition & Training Engine - Requirements

## Overview
An elite AI-powered nutrition and training system that generates comprehensive transformation programs, not simple diet plans. This system provides personalized metabolic analysis, progressive programming, and intelligent adaptations based on user goals and subscription tiers.

## User Stories

### Epic 1: Advanced Metabolic Analysis
**As a user**, I want the system to perform comprehensive metabolic analysis so that I receive scientifically accurate calorie and macro targets.

#### User Story 1.1: BMR & TDEE Calculation
- **As a user**, I want my BMR calculated using the Mifflin-St Jeor equation
- **As a user**, I want my TDEE calculated with precise activity multipliers
- **As a user**, I want body fat percentage considered when provided for more accurate calculations

**Acceptance Criteria:**
- BMR calculated using: BMR = (10 × weight) + (6.25 × height) – (5 × age) + 5 (male) or -161 (female)
- Activity factors applied correctly: Sedentary (1.2), Light (1.375), Moderate (1.55), Active (1.725), Very Active (1.9)
- Body fat percentage used for lean body mass calculations when available
- All calculations displayed with scientific reasoning

#### User Story 1.2: Goal-Specific Calorie Strategy
- **As a user with fat loss goals**, I want a 20% calorie deficit with progressive weekly tapering
- **As a user with muscle gain goals**, I want a 10-15% surplus with carb cycling
- **As a user with recomposition goals**, I want maintenance calories with training day variations
- **As a user with endurance goals**, I want carb-focused macros (55-65% carbs)

**Acceptance Criteria:**
- Fat Loss: 20% deficit, -50 kcal taper after week 3, refeed days every 10-14 days
- Muscle Gain: 10-15% surplus, +100 kcal if weight gain <0.25kg/week
- Recomposition: Maintenance base, deficit on rest days, surplus on training days
- Endurance: 55-65% carbs, glycogen loading protocols

### Epic 2: Intelligent Macro Distribution
**As a user**, I want personalized macronutrient targets that adapt to my goals and training schedule.

#### User Story 2.1: Goal-Specific Protein Targets
- **As a user**, I want protein targets optimized for my specific goal
- **As a user**, I want protein distributed across meals for optimal absorption

**Acceptance Criteria:**
- Fat Loss: 2.0-2.2g/kg bodyweight
- Muscle Gain: 1.6-2.0g/kg bodyweight  
- Recomposition: 2.2g/kg bodyweight
- Protein distributed across all meals

#### User Story 2.2: Dynamic Carb Cycling
- **As a Pro user**, I want carb cycling based on my training schedule
- **As a user**, I want higher carbs on training days and lower on rest days

**Acceptance Criteria:**
- Training days: Higher carb allocation (40-50% of calories)
- Rest days: Lower carb allocation (20-30% of calories)
- Fat allocation: 20-30% of total calories
- Remaining calories allocated to carbs after protein and fat targets met

### Epic 3: Progressive Weekly Programming
**As a user**, I want my nutrition plan to adapt weekly based on predicted progress and plateau prevention.

#### User Story 3.1: Automatic Calorie Adjustments
- **As a user**, I want the system to predict weight change and adjust calories automatically
- **As a user**, I want plateau prevention built into my program

**Acceptance Criteria:**
- Weekly weight change predictions based on calorie deficit/surplus
- Automatic ±150 kcal adjustments if stall predicted >2 weeks
- Progressive tapering for fat loss phases
- Surplus increases for muscle gain if progress stalls

#### User Story 3.2: Body Recomposition Logic
- **As a user with high body fat**, I want the system to prioritize fat loss first
- **As a user with moderate body fat**, I want recomposition or lean bulk options

**Acceptance Criteria:**
- If body fat >22% (male) or >30% (female): 4-week fat loss phase first
- If body fat <22% (male) or <30% (female): Allow lean bulk or recomposition
- Automatic phase transitions based on progress

### Epic 4: Comprehensive Meal Planning
**As a user**, I want detailed meal plans that consider my dietary restrictions, cooking time, and cuisine preferences.

#### User Story 4.1: Diet Type Compliance
- **As a user with dietary restrictions**, I want all meals to comply with my chosen diet type
- **As a user**, I want ingredient substitutions that maintain macro targets

**Acceptance Criteria:**
- Strict compliance with: Vegetarian, Vegan, Keto, Paleo, Mediterranean, etc.
- Automatic ingredient substitutions for restrictions
- Macro targets maintained despite restrictions
- Allergen considerations (gluten-free, dairy-free, nut-free)

#### User Story 4.2: Practical Meal Timing
- **As a user**, I want meals distributed based on my specified meal frequency
- **As a user**, I want cooking time to match my availability

**Acceptance Criteria:**
- Support for 3-6 meals per day
- 0-3 snacks per day
- Cooking time categories: Quick (<15min), Moderate (15-30min), Elaborate (>30min)
- Meal timing optimized for training schedule

### Epic 5: Integrated Training Programming
**As a user**, I want a complete training program that complements my nutrition plan.

#### User Story 5.1: Experience-Based Programming
- **As a beginner**, I want a full-body routine 3x per week
- **As an intermediate**, I want push/pull/legs or upper/lower splits
- **As an advanced user**, I want periodized hypertrophy and strength blocks

**Acceptance Criteria:**
- Beginner: Full body 3x/week, compound movements, RPE 6-7
- Intermediate: 4-5 day splits, progressive overload, RPE 7-8
- Advanced: Periodized blocks, advanced techniques, RPE 8-9
- All programs include sets, reps, RPE, and progression guidelines

#### User Story 5.2: Training-Nutrition Synchronization
- **As a user**, I want my nutrition to support my training schedule
- **As a user**, I want pre/post workout nutrition guidance

**Acceptance Criteria:**
- Higher carbs on training days
- Pre-workout nutrition timing (1-2 hours before)
- Post-workout nutrition timing (within 30-60 minutes)
- Rest day nutrition adjustments

### Epic 6: Subscription Tier Features
**As a user**, I want features appropriate to my subscription level with clear upgrade incentives.

#### User Story 6.1: Free Tier Limitations
- **As a free user**, I want basic functionality to evaluate the platform
- **As a free user**, I want clear visibility of Pro features

**Acceptance Criteria:**
- 3-day rotating meal plan (vs 7-day variety)
- Basic workout split (no periodization)
- No macro cycling
- No grocery optimization
- No meal prep batching
- Clear "Upgrade to Pro" prompts for advanced features

#### User Story 6.2: Pro Tier Advanced Features
- **As a Pro user**, I want full weekly meal variation
- **As a Pro user**, I want advanced optimization features

**Acceptance Criteria:**
- Full 7-day meal variety with no repetition
- Carb cycling and refeed strategies
- Smart grocery list consolidation
- Meal prep batching optimization
- Progress projection modeling
- Advanced plateau prevention

### Epic 7: Progress Prediction & Optimization
**As a user**, I want realistic expectations and progress tracking built into my program.

#### User Story 7.1: 8-Week Outcome Prediction
- **As a user**, I want to see predicted results before starting
- **As a user**, I want confidence levels for predictions

**Acceptance Criteria:**
- Expected weight change over 8 weeks
- Expected body fat percentage change
- Muscle gain potential estimates
- Confidence levels (High/Medium/Low) based on adherence assumptions

#### User Story 7.2: Smart Grocery & Meal Prep
- **As a Pro user**, I want optimized grocery lists that minimize waste
- **As a Pro user**, I want meal prep strategies that save time

**Acceptance Criteria:**
- Consolidated grocery lists with quantities
- Bulk cooking recommendations
- Storage and reheating instructions
- Cost optimization suggestions
- Seasonal ingredient substitutions

### Epic 8: Hydration & Supplementation
**As a user**, I want comprehensive lifestyle recommendations beyond just food.

#### User Story 8.1: Hydration Strategy
- **As a user**, I want personalized hydration targets
- **As a user**, I want hydration timing around workouts

**Acceptance Criteria:**
- Daily water intake targets based on bodyweight and activity
- Pre/during/post workout hydration protocols
- Electrolyte recommendations for intense training
- Climate and sweat rate considerations

#### User Story 8.2: Evidence-Based Supplementation
- **As a user**, I want supplement recommendations based on my goals
- **As a user**, I want only evidence-based suggestions

**Acceptance Criteria:**
- Goal-specific supplement recommendations
- Dosage and timing instructions
- Budget-conscious options (essential vs optional)
- Interaction warnings with medications
- Natural food sources as alternatives

## Technical Requirements

### Data Input Requirements
- Height (cm), Weight (kg), Age, Gender
- Body Fat % (optional but preferred)
- Activity Level (5-point scale)
- Goal (Fat Loss, Muscle Gain, Recomposition, Endurance)
- Diet Type, Meals/Snacks per day, Cooking time
- Cuisine preference, Budget level
- Training experience, Workout days per week
- Subscription tier, Plan duration

### Output Format Requirements
- Valid JSON structure for API responses
- Comprehensive metabolic analysis
- Weekly progression planning
- Detailed meal plans (training vs rest days)
- Complete workout programming
- Progress projections with confidence intervals
- Grocery optimization and meal prep strategies

### Performance Requirements
- Response time <3 seconds for plan generation
- Support for 1000+ concurrent users
- 99.9% uptime for Pro subscribers
- Mobile-responsive interface
- Offline access to generated plans

### Integration Requirements
- Supabase database for user data and plans
- Stripe/Razorpay for subscription management
- Groq/OpenRouter AI APIs for plan generation
- Email notifications for plan updates
- Calendar integration for meal/workout scheduling

## Success Metrics
- User engagement: >80% plan completion rate
- Subscription conversion: >15% free to Pro conversion
- User satisfaction: >4.5/5 rating
- Retention: >70% monthly retention for Pro users
- Accuracy: Predicted vs actual results within 15% variance

## Constraints
- Must work within free tier limits of chosen services
- Mobile-first responsive design required
- GDPR/privacy compliance for user data
- Scientific accuracy in all calculations
- Clear upgrade path from free to Pro features
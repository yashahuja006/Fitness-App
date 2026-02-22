# Testing Infrastructure Guide

This document provides a comprehensive guide to the testing infrastructure for the AI-Powered Fitness Web Application.

## Overview

The testing infrastructure uses a dual approach combining **unit tests** and **property-based tests** to ensure comprehensive coverage:

- **Unit Tests**: Focus on specific examples, edge cases, and integration points
- **Property Tests**: Verify universal properties across all inputs using Fast-check

## Technology Stack

- **Jest**: Test runner and assertion library
- **React Testing Library**: React component testing utilities
- **Fast-check**: Property-based testing framework
- **@testing-library/user-event**: User interaction simulation
- **@testing-library/jest-dom**: Custom Jest matchers for DOM testing

## Project Structure

```
src/__tests__/
├── config/
│   └── testConfig.ts           # Test configuration and constants
├── utils/
│   ├── index.ts               # Centralized exports
│   ├── generators.ts          # Fast-check generators
│   ├── mocks.tsx              # Mock data and utilities
│   ├── propertyTestUtils.ts   # Property-based testing helpers
│   └── testUtils.tsx          # React testing utilities
├── infrastructure.property.test.ts  # Infrastructure property tests
├── setup.test.ts              # Basic setup verification
├── testUtils.test.ts          # Test utilities verification
└── README.md                  # This file
```

## Quick Start

### Running Tests

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage

# Run only property-based tests
npm run test:pbt
```

### Writing Unit Tests

```typescript
import { render, screen } from '@testing-library/react';
import { renderWithProviders, createUserEvent } from '@/__tests__/utils';
import MyComponent from '@/components/MyComponent';

describe('MyComponent', () => {
  it('should render correctly', () => {
    renderWithProviders(<MyComponent />);
    expect(screen.getByText('Expected Text')).toBeInTheDocument();
  });

  it('should handle user interactions', async () => {
    const user = createUserEvent();
    renderWithProviders(<MyComponent />);
    
    await user.click(screen.getByRole('button'));
    expect(screen.getByText('Clicked')).toBeInTheDocument();
  });
});
```

### Writing Property-Based Tests

```typescript
import * as fc from 'fast-check';
import { userProfileArbitrary, validateUserProfileIntegrity } from '@/__tests__/utils';

describe('User Profile Properties', () => {
  /**
   * **Validates: Requirements 7.1, 7.2**
   * Property: User profiles maintain data integrity
   */
  it('Property: User profiles have valid structure', async () => {
    await fc.assert(
      fc.property(userProfileArbitrary, (profile) => {
        return validateUserProfileIntegrity(profile);
      }),
      { numRuns: 100 }
    );
  });
});
```

## Available Utilities

### Generators (Fast-check)

The testing infrastructure provides comprehensive generators for all domain objects:

```typescript
import {
  userProfileArbitrary,
  exerciseArbitrary,
  workoutSessionArbitrary,
  dietPlanArbitrary,
  safeEmailArbitrary,
  safePasswordArbitrary,
} from '@/__tests__/utils';

// Generate test data
const testProfile = fc.sample(userProfileArbitrary, 1)[0];
const testExercises = fc.sample(exerciseArbitrary, 10);
```

### Mock Data

Pre-built mock objects for common testing scenarios:

```typescript
import {
  mockUserProfile,
  mockExercise,
  mockWorkoutSession,
  mockDietPlan,
  createMockUserProfile,
  createMockExercise,
} from '@/__tests__/utils';

// Use pre-built mocks
const profile = mockUserProfile;

// Create custom mocks with overrides
const customProfile = createMockUserProfile({
  displayName: 'Custom User',
  personalMetrics: { height: 180, weight: 75 }
});
```

### React Testing Utilities

Enhanced render functions with provider support:

```typescript
import {
  renderWithProviders,
  renderWithAuthenticatedUser,
  renderWithUnauthenticatedUser,
  renderWithLoadingState,
} from '@/__tests__/utils';

// Render with authentication context
renderWithAuthenticatedUser(<MyComponent />, userOverrides, profileOverrides);

// Render without authentication
renderWithUnauthenticatedUser(<MyComponent />);

// Render in loading state
renderWithLoadingState(<MyComponent />);
```

### Property Test Helpers

Specialized helpers for different feature areas:

```typescript
import {
  createAuthenticationProperty,
  createExerciseSearchProperty,
  createWorkoutTrackingProperty,
  createDietPlanProperty,
} from '@/__tests__/utils';

// Create property tests for specific domains
await createAuthenticationProperty(async (scenario) => {
  // Test authentication logic
  return validateAuthenticationScenario(scenario);
});
```

### Custom Jest Matchers

Extended Jest matchers for domain-specific assertions:

```typescript
// Email validation
expect('test@example.com').toBeValidEmail();

// Password validation
expect('password123').toBeValidPassword();

// User profile validation
expect(userProfile).toBeValidUserProfile();

// Exercise validation
expect(exercise).toBeValidExercise();

// Form structure validation
expect(container).toHaveValidFormStructure();
```

## Test Configuration

### Property-Based Test Configurations

Different configurations for various testing scenarios:

```typescript
import { DEFAULT_PBT_CONFIG, FAST_PBT_CONFIG, THOROUGH_PBT_CONFIG } from '@/__tests__/config/testConfig';

// Quick development testing
fc.assert(property, FAST_PBT_CONFIG);

// Standard testing
fc.assert(property, DEFAULT_PBT_CONFIG);

// Comprehensive testing
fc.assert(property, THOROUGH_PBT_CONFIG);
```

### Environment-Based Configuration

The testing infrastructure automatically adapts to different environments:

- **Development**: Fast configuration for quick feedback
- **CI/CD**: Balanced configuration for continuous integration
- **Production**: Thorough configuration for comprehensive testing

## Testing Patterns

### Authentication Testing

```typescript
describe('Authentication', () => {
  it('should handle user registration', async () => {
    const { mockAuth } = setupFirebaseMocks();
    mockAuth.createUserWithEmailAndPassword.mockResolvedValue(mockFirebaseUser);
    
    renderWithUnauthenticatedUser(<RegisterForm />);
    
    const user = createUserEvent();
    await fillForm(user, {
      email: 'test@example.com',
      password: 'password123',
      displayName: 'Test User'
    });
    await submitForm(user);
    
    expect(mockAuth.createUserWithEmailAndPassword).toHaveBeenCalledWith(
      expect.anything(),
      'test@example.com',
      'password123'
    );
  });
});
```

### Exercise Search Testing

```typescript
describe('Exercise Search', () => {
  it('Property: Search returns relevant results', async () => {
    await createExerciseSearchProperty(async (scenario) => {
      const results = await searchExercises(scenario.query, scenario.filters);
      
      // Validate that results match search criteria
      return results.every(exercise => 
        matchesSearchCriteria(exercise, scenario.query, scenario.filters)
      );
    });
  });
});
```

### Form Validation Testing

```typescript
describe('Form Validation', () => {
  it('should validate user input', async () => {
    renderWithProviders(<ProfileForm />);
    
    const user = createUserEvent();
    await user.type(screen.getByLabelText('Email'), 'invalid-email');
    await user.click(screen.getByRole('button', { name: 'Submit' }));
    
    expect(screen.getByText('Please enter a valid email')).toBeInTheDocument();
  });
});
```

## Best Practices

### Property-Based Testing

1. **Start Simple**: Begin with basic properties and gradually add complexity
2. **Use Meaningful Generators**: Create generators that produce realistic test data
3. **Validate Invariants**: Focus on properties that should always hold true
4. **Handle Edge Cases**: Ensure generators cover boundary conditions
5. **Document Properties**: Clearly document what each property validates

### Unit Testing

1. **Test Behavior, Not Implementation**: Focus on what the component does, not how
2. **Use Descriptive Names**: Test names should clearly describe the scenario
3. **Arrange, Act, Assert**: Structure tests with clear setup, execution, and verification
4. **Mock External Dependencies**: Isolate the unit under test
5. **Test Error Conditions**: Ensure proper error handling

### Mock Data

1. **Keep Mocks Realistic**: Use data that resembles real-world scenarios
2. **Provide Overrides**: Allow customization of mock data for specific tests
3. **Maintain Consistency**: Ensure mock data follows the same validation rules
4. **Update with Schema Changes**: Keep mocks in sync with data model changes

## Debugging Tests

### Common Issues

1. **Async Operations**: Use `await` and proper async/await patterns
2. **State Updates**: Use `waitFor` for state changes that happen after events
3. **Mock Cleanup**: Ensure mocks are reset between tests
4. **Memory Leaks**: Clean up event listeners and subscriptions

### Debugging Tools

```typescript
// Debug rendered output
import { screen } from '@testing-library/react';
screen.debug(); // Prints current DOM state

// Debug property test failures
fc.assert(property, { verbose: true }); // Shows counterexamples

// Debug mock calls
console.log(mockFunction.mock.calls); // Shows all calls to mock
```

## Performance Considerations

### Test Execution Speed

- Use `FAST_PBT_CONFIG` during development for quick feedback
- Limit property test iterations for non-critical properties
- Use `test.concurrent` for independent tests that can run in parallel

### Memory Usage

- Clean up large test data after tests complete
- Use `afterEach` to reset mocks and clear state
- Avoid creating unnecessary large datasets in tests

## Coverage Goals

The testing infrastructure aims for:

- **Statements**: 80% coverage
- **Branches**: 75% coverage  
- **Functions**: 80% coverage
- **Lines**: 80% coverage

## Contributing

When adding new tests:

1. Follow the established patterns and conventions
2. Add appropriate generators for new data types
3. Update mock data when adding new features
4. Document complex property tests
5. Ensure tests are deterministic and reliable

## Troubleshooting

### Common Error Messages

- **"Property failed after X tests"**: Check the property logic and generators
- **"Unable to find element"**: Verify the component renders the expected elements
- **"Mock function not called"**: Check that the code path actually calls the mocked function
- **"Timeout exceeded"**: Increase timeout or check for infinite loops in async operations

### Getting Help

- Check the Jest documentation for testing patterns
- Review React Testing Library guides for component testing
- Consult Fast-check documentation for property-based testing
- Look at existing tests for similar patterns and examples
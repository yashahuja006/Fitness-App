# Web Workers for Advanced Pose Analysis

This directory contains Web Worker implementations for offloading computationally intensive pose analysis calculations from the main thread.

## Overview

The Web Worker setup provides:
- **Non-blocking angle calculations**: Complex trigonometric calculations run in background threads
- **Automatic fallback**: Falls back to main thread calculations if Web Workers are not supported
- **Type-safe communication**: Fully typed message passing between main thread and workers
- **Error handling**: Robust error handling with automatic worker restart capabilities

## Files

### `angleCalculator.worker.ts`
The main Web Worker that handles:
- Hip-knee-ankle angle calculations for squat analysis
- Shoulder-hip alignment calculations for posture assessment
- Nose-shoulder offset calculations for camera view detection
- Landmark validation and configuration checks

### Usage Example

```typescript
import { calculateExerciseAngles } from '@/lib/webWorkerManager';
import type { PoseLandmark } from '@/types/pose';

// Automatic Web Worker usage with fallback
const landmarks: PoseLandmark[] = /* ... pose landmarks from MediaPipe ... */;
const angles = await calculateExerciseAngles(landmarks);

console.log(angles);
// Output: { kneeAngle: 90, hipAngle: 45, ankleAngle: 120, offsetAngle: 15 }
```

### Manual Web Worker Management

```typescript
import { webWorkerManager } from '@/lib/webWorkerManager';

// Initialize worker
await webWorkerManager.initialize();

// Calculate angles
const angles = await webWorkerManager.calculateExerciseAngles(landmarks);

// Check status
const status = webWorkerManager.getStatus();
console.log('Worker healthy:', status.isHealthy);

// Cleanup when done
await webWorkerManager.terminate();
```

### Integration with Enhanced Pose Detection

```typescript
import { enhancedPoseDetectionService } from '@/lib/enhancedPoseDetectionService';

// Initialize service (automatically sets up Web Worker)
await enhancedPoseDetectionService.initialize();

// Process pose landmarks with automatic angle calculation
const result = await enhancedPoseDetectionService.processPoseLandmarks(landmarks);

console.log('Processing time:', result.processingTime, 'ms');
console.log('Calculated angles:', result.angles);
```

## Performance Benefits

- **Main thread responsiveness**: UI remains responsive during complex calculations
- **Parallel processing**: Multiple angle calculations can run simultaneously
- **Reduced frame drops**: Prevents blocking the render loop during pose analysis
- **Scalable**: Can handle multiple concurrent pose analysis sessions

## Browser Compatibility

- **Modern browsers**: Full Web Worker support with typed message passing
- **Legacy browsers**: Automatic fallback to main thread calculations
- **Node.js/SSR**: Graceful handling in server-side environments

## Error Handling

The Web Worker system includes comprehensive error handling:

1. **Worker initialization failures**: Falls back to main thread
2. **Message passing errors**: Automatic retry with exponential backoff
3. **Worker crashes**: Automatic worker restart
4. **Timeout handling**: Requests timeout after 5 seconds
5. **Memory management**: Automatic cleanup of pending requests

## Testing

Web Workers are fully tested with:
- Mock worker implementations for unit tests
- Integration tests with real worker communication
- Error scenario testing
- Performance benchmarking

Run tests with:
```bash
npm test -- src/lib/__tests__/webWorkerManager.test.ts
npm test -- src/lib/__tests__/enhancedPoseDetectionService.test.ts
```

## Configuration

Web Worker behavior can be configured through the `WebWorkerManager` constructor:

```typescript
const manager = new WebWorkerManager({
  requestTimeout: 10000, // 10 second timeout
  maxRetries: 3,         // Maximum retry attempts
  retryDelay: 1000       // Delay between retries
});
```

## Next.js Integration

The Web Workers are configured to work with Next.js through `next.config.ts`:

```typescript
webpack: (config, { isServer }) => {
  if (!isServer) {
    config.module.rules.push({
      test: /\.worker\.(js|ts)$/,
      type: 'asset/resource',
      generator: {
        filename: 'static/workers/[hash][ext][query]',
      },
    });
  }
  return config;
}
```

This ensures Web Workers are properly bundled and served in both development and production environments.
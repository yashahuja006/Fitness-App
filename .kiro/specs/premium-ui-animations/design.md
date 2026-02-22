# Design Document: Premium UI Animations & Motion System

## Overview

The Premium UI Animations & Motion System provides a comprehensive animation framework for the AI fitness web application, delivering a sophisticated, high-performance user interface with smooth transitions, micro-interactions, and scroll-based effects. The system is built on Framer Motion and GSAP, leveraging their strengths for different animation scenarios while maintaining 60fps performance and full accessibility compliance.

### Design Goals

- **Performance First**: Maintain 60fps across all animations using GPU acceleration and optimized rendering techniques
- **Accessibility**: Full support for prefers-reduced-motion with graceful degradation
- **Developer Experience**: Provide reusable hooks, utilities, and configuration for consistent animation patterns
- **Visual Cohesion**: Centralized theming system ensuring consistent colors, timing, and easing across all components
- **Scalability**: Modular architecture allowing easy addition of new animation patterns

### Technology Stack Integration

- **Framer Motion**: Primary animation library for React component animations, gestures, and layout transitions
- **GSAP (GreenSock)**: Advanced timeline-based animations, scroll triggers, and complex sequencing
- **Tailwind CSS**: Base styling and utility classes for static visual effects
- **ShadCN UI**: Component foundation with animation enhancements
- **Recharts**: Data visualization with custom animation controllers

## Architecture

### System Architecture

The animation system follows a layered architecture:

```
┌─────────────────────────────────────────────────────────┐
│                   Application Layer                      │
│              (React Components + Pages)                  │
└─────────────────────────────────────────────────────────┘
                          │
┌─────────────────────────────────────────────────────────┐
│                  Animation Hooks Layer                   │
│  (useScrollAnimation, useCardHover, useGradient, etc.)  │
└─────────────────────────────────────────────────────────┘
                          │
┌─────────────────────────────────────────────────────────┐
│               Animation Controllers Layer                │
│     (ScrollController, ChartAnimator, StateManager)     │
└─────────────────────────────────────────────────────────┘
                          │
┌─────────────────────────────────────────────────────────┐
│                  Core Animation Layer                    │
│           (Framer Motion + GSAP Integration)            │
└─────────────────────────────────────────────────────────┘
                          │
┌─────────────────────────────────────────────────────────┐
│                  Configuration Layer                     │
│        (Theme, Timing, Easing, Performance Config)      │
└─────────────────────────────────────────────────────────┘
```

### Library Selection Strategy

**Framer Motion** is used for:
- Component-level animations (mount/unmount, state changes)
- Gesture-based interactions (hover, tap, drag)
- Layout animations and shared element transitions
- Simple scroll-triggered animations
- Declarative animation patterns in JSX

**GSAP** is used for:
- Complex timeline-based sequences
- Advanced scroll triggers with precise control
- SVG path animations
- Performance-critical animations requiring fine-tuned control
- Gradient and background animations

### Performance Architecture

```
┌──────────────────────────────────────────────────────────┐
│                  Performance Monitor                      │
│         (FPS tracking, frame budget enforcement)         │
└──────────────────────────────────────────────────────────┘
                          │
┌──────────────────────────────────────────────────────────┐
│                  Optimization Layer                       │
│  • GPU Acceleration (transform/opacity only)             │
│  • Lazy Loading (IntersectionObserver)                   │
│  • Debounced Scroll Handlers                             │
│  • RequestAnimationFrame scheduling                      │
│  • Will-change hints                                     │
└──────────────────────────────────────────────────────────┘
                          │
┌──────────────────────────────────────────────────────────┐
│              Device Capability Detection                  │
│    (Reduce complexity on low-end devices)                │
└──────────────────────────────────────────────────────────┘
```

## Components and Interfaces

### Core Animation Hooks

#### useScrollAnimation

Manages scroll-triggered animations with IntersectionObserver.

```typescript
interface UseScrollAnimationOptions {
  threshold?: number; // Default: 0.2 (20% visibility)
  triggerOnce?: boolean; // Default: true
  rootMargin?: string; // Default: '0px'
  disabled?: boolean; // Respects prefers-reduced-motion
}

interface UseScrollAnimationReturn {
  ref: RefObject<HTMLElement>;
  isInView: boolean;
  controls: AnimationControls;
}

function useScrollAnimation(
  options?: UseScrollAnimationOptions
): UseScrollAnimationReturn;
```

#### useCardHover

Provides 3D tilt and lift effects for card components.

```typescript
interface UseCardHoverOptions {
  tiltIntensity?: number; // Default: 10 (degrees)
  liftDistance?: number; // Default: 8 (pixels)
  transitionDuration?: number; // Default: 300 (ms)
  glowIntensity?: number; // Default: 0.3 (opacity)
}

interface UseCardHoverReturn {
  ref: RefObject<HTMLDivElement>;
  style: MotionStyle;
  handlers: {
    onMouseMove: (e: MouseEvent) => void;
    onMouseLeave: () => void;
  };
}

function useCardHover(
  options?: UseCardHoverOptions
): UseCardHoverReturn;
```

#### useGradientAnimation

Animates gradient positions and colors.

```typescript
interface GradientStop {
  color: string;
  position: number; // 0-100
}

interface UseGradientAnimationOptions {
  stops: GradientStop[];
  duration?: number; // Default: 10000 (ms)
  direction?: 'linear' | 'radial';
  angle?: number; // For linear gradients
}

interface UseGradientAnimationReturn {
  gradientStyle: CSSProperties;
  progress: MotionValue<number>;
}

function useGradientAnimation(
  options: UseGradientAnimationOptions
): UseGradientAnimationReturn;
```

#### useReducedMotion

Detects user motion preferences.

```typescript
function useReducedMotion(): boolean;
```

#### useFloatingAnimation

Creates continuous floating motion for decorative elements.

```typescript
interface UseFloatingAnimationOptions {
  distance?: number; // Default: 10 (pixels)
  duration?: number; // Default: 3000 (ms)
  delay?: number; // Stagger delay
}

function useFloatingAnimation(
  options?: UseFloatingAnimationOptions
): MotionProps;
```

### Animation Controllers

#### ScrollController

Manages all scroll-based animations and parallax effects.

```typescript
class ScrollController {
  private scrollY: MotionValue<number>;
  private parallaxLayers: Map<string, ParallaxConfig>;
  private triggers: Map<string, ScrollTrigger>;
  
  constructor(config: ScrollControllerConfig);
  
  registerParallaxLayer(
    id: string,
    element: HTMLElement,
    speed: number
  ): void;
  
  registerScrollTrigger(
    id: string,
    element: HTMLElement,
    animation: GSAPAnimation
  ): void;
  
  updateScrollPosition(y: number): void;
  
  cleanup(): void;
}

interface ScrollControllerConfig {
  smoothScrolling?: boolean;
  debounceMs?: number; // Default: 16
  enableParallax?: boolean;
}
```

#### ChartAnimator

Manages data visualization animations.

```typescript
class ChartAnimator {
  animateLineChart(
    data: ChartData,
    duration?: number
  ): Promise<void>;
  
  animateDonutChart(
    segments: DonutSegment[],
    staggerDelay?: number
  ): Promise<void>;
  
  animateBarChart(
    bars: BarData[],
    duration?: number
  ): Promise<void>;
  
  highlightDataPoint(
    index: number,
    color?: string
  ): void;
}

interface ChartData {
  points: Array<{ x: number; y: number }>;
  color: string;
}

interface DonutSegment {
  value: number;
  color: string;
  label: string;
}

interface BarData {
  value: number;
  label: string;
  color: string;
}
```

#### AnimationStateManager

Manages component animation states and transitions.

```typescript
type AnimationState = 
  | 'idle'
  | 'loading'
  | 'success'
  | 'error'
  | 'disabled';

class AnimationStateManager {
  private currentState: AnimationState;
  private transitions: Map<string, StateTransition>;
  
  setState(newState: AnimationState): void;
  
  getTransition(
    from: AnimationState,
    to: AnimationState
  ): StateTransition;
  
  registerTransition(
    from: AnimationState,
    to: AnimationState,
    config: TransitionConfig
  ): void;
}

interface StateTransition {
  duration: number;
  easing: string;
  animation: MotionProps;
}

interface TransitionConfig {
  duration?: number;
  easing?: string;
  onStart?: () => void;
  onComplete?: () => void;
}
```

### UI Components

#### AnimatedCard

Reusable card component with glassmorphism and hover effects.

```typescript
interface AnimatedCardProps {
  children: ReactNode;
  variant?: 'default' | 'feature' | 'pricing';
  enableTilt?: boolean;
  enableGlow?: boolean;
  className?: string;
  onClick?: () => void;
}

function AnimatedCard(props: AnimatedCardProps): JSX.Element;
```

#### GradientText

Text component with animated gradient effects.

```typescript
interface GradientTextProps {
  children: string;
  variant?: 'heading' | 'subheading' | 'accent';
  animate?: boolean;
  className?: string;
}

function GradientText(props: GradientTextProps): JSX.Element;
```

#### AnimatedButton

Button with glow, ripple, and scale effects.

```typescript
interface AnimatedButtonProps {
  children: ReactNode;
  variant?: 'primary' | 'secondary' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  onClick?: () => void;
  disabled?: boolean;
  loading?: boolean;
}

function AnimatedButton(props: AnimatedButtonProps): JSX.Element;
```

#### ScrollProgress

Visual indicator of scroll position.

```typescript
interface ScrollProgressProps {
  position?: 'top' | 'bottom';
  color?: string;
  height?: number;
}

function ScrollProgress(props: ScrollProgressProps): JSX.Element;
```

#### FloatingIcon

Icon with continuous floating animation.

```typescript
interface FloatingIconProps {
  icon: ReactNode;
  delay?: number;
  distance?: number;
  duration?: number;
}

function FloatingIcon(props: FloatingIconProps): JSX.Element;
```

### Section Components

#### HeroSection

Full-screen hero with animated gradients and floating elements.

```typescript
interface HeroSectionProps {
  headline: string;
  subheading: string;
  ctaText: string;
  onCtaClick: () => void;
  floatingIcons?: ReactNode[];
}

function HeroSection(props: HeroSectionProps): JSX.Element;
```

#### FeaturesGrid

Responsive grid with staggered card animations.

```typescript
interface Feature {
  icon: ReactNode;
  title: string;
  description: string;
}

interface FeaturesGridProps {
  features: Feature[];
  columns?: 2 | 3 | 4;
}

function FeaturesGrid(props: FeaturesGridProps): JSX.Element;
```

#### TestimonialSlider

Auto-advancing carousel with smooth transitions.

```typescript
interface Testimonial {
  quote: string;
  author: string;
  role: string;
  avatar?: string;
}

interface TestimonialSliderProps {
  testimonials: Testimonial[];
  autoAdvanceDelay?: number; // Default: 5000ms
  pauseOnHover?: boolean; // Default: true
}

function TestimonialSlider(props: TestimonialSliderProps): JSX.Element;
```

#### FAQAccordion

Expandable FAQ sections with smooth height transitions.

```typescript
interface FAQItem {
  question: string;
  answer: string;
}

interface FAQAccordionProps {
  items: FAQItem[];
  allowMultiple?: boolean; // Default: false
}

function FAQAccordion(props: FAQAccordionProps): JSX.Element;
```

## Data Models

### Animation Configuration

```typescript
interface AnimationConfig {
  theme: ThemeConfig;
  timing: TimingConfig;
  performance: PerformanceConfig;
  accessibility: AccessibilityConfig;
}

interface ThemeConfig {
  colors: {
    dark: {
      base: string; // Deep grey/charcoal
      surface: string;
      elevated: string;
    };
    accent: {
      primary: string; // Neon green
      secondary: string; // Lime
      glow: string; // Green with opacity
    };
    gradients: {
      hero: GradientStop[];
      heading: GradientStop[];
      button: GradientStop[];
      background: GradientStop[];
    };
  };
  effects: {
    glassmorphism: {
      blur: number; // Default: 12px
      opacity: number; // Default: 0.1
      border: string;
    };
    glow: {
      blur: number; // Default: 8px
      spread: number; // Default: 0px
      opacity: number; // Default: 0.6
    };
  };
  typography: {
    fontFamily: string;
    scale: {
      h1: string;
      h2: string;
      h3: string;
      body: string;
    };
  };
}

interface TimingConfig {
  durations: {
    quick: number; // 200ms
    medium: number; // 400ms
    slow: number; // 600ms
    gradient: number; // 10000ms
    floating: number; // 3000ms
    testimonial: number; // 5000ms
  };
  easing: {
    default: string; // 'easeInOut'
    bounce: string; // 'spring(1, 100, 10, 0)'
    smooth: string; // 'cubic-bezier(0.4, 0, 0.2, 1)'
    sharp: string; // 'cubic-bezier(0.4, 0, 0.6, 1)'
  };
  stagger: {
    cards: number; // 100ms
    icons: number; // 50ms
    text: number; // 30ms
  };
}

interface PerformanceConfig {
  targetFPS: number; // 60
  frameBudget: number; // 16.67ms
  debounceScroll: number; // 16ms
  lazyLoadThreshold: number; // 0.2 (20%)
  maxParticles: number; // 50
  reduceOnMobile: boolean; // true
  gpuAcceleration: boolean; // true
}

interface AccessibilityConfig {
  respectReducedMotion: boolean; // true
  maintainFocusIndicators: boolean; // true
  minContrastRatio: number; // 4.5 (WCAG AA)
  keyboardNavigable: boolean; // true
  essentialAnimationsOnly: boolean; // When reduced motion enabled
}
```

### Animation Variants

```typescript
// Framer Motion variants for common animations
const fadeInUp: Variants = {
  hidden: { opacity: 0, y: 20 },
  visible: { 
    opacity: 1, 
    y: 0,
    transition: { duration: 0.4, ease: 'easeOut' }
  }
};

const fadeIn: Variants = {
  hidden: { opacity: 0 },
  visible: { 
    opacity: 1,
    transition: { duration: 0.3 }
  }
};

const scaleIn: Variants = {
  hidden: { opacity: 0, scale: 0.8 },
  visible: { 
    opacity: 1, 
    scale: 1,
    transition: { duration: 0.3, ease: 'easeOut' }
  }
};

const slideInFromRight: Variants = {
  hidden: { opacity: 0, x: 100 },
  visible: { 
    opacity: 1, 
    x: 0,
    transition: { duration: 0.4, ease: 'easeOut' }
  }
};

const staggerContainer: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.2
    }
  }
};
```

### Scroll Trigger Configuration

```typescript
interface ScrollTriggerConfig {
  trigger: string | HTMLElement;
  start: string; // e.g., 'top 80%'
  end?: string;
  scrub?: boolean | number;
  pin?: boolean;
  markers?: boolean; // Debug only
  onEnter?: () => void;
  onLeave?: () => void;
  onEnterBack?: () => void;
  onLeaveBack?: () => void;
}
```

### Device Capability Detection

```typescript
interface DeviceCapabilities {
  hasGPU: boolean;
  supportsBackdropFilter: boolean;
  isMobile: boolean;
  isLowEndDevice: boolean;
  prefersReducedMotion: boolean;
  screenWidth: number;
  screenHeight: number;
  pixelRatio: number;
}

function detectDeviceCapabilities(): DeviceCapabilities;
```

### Performance Metrics

```typescript
interface PerformanceMetrics {
  fps: number;
  frameTime: number; // ms
  droppedFrames: number;
  animationCount: number;
  memoryUsage?: number; // MB
}

class PerformanceMonitor {
  private metrics: PerformanceMetrics;
  private rafId: number | null;
  
  start(): void;
  stop(): void;
  getMetrics(): PerformanceMetrics;
  onFrameDrop(callback: (metrics: PerformanceMetrics) => void): void;
}
```


### Gradient System

```typescript
interface GradientPreset {
  name: string;
  type: 'linear' | 'radial' | 'conic';
  stops: GradientStop[];
  angle?: number; // For linear
  position?: { x: number; y: number }; // For radial
}

const gradientPresets: Record<string, GradientPreset> = {
  hero: {
    name: 'hero',
    type: 'radial',
    stops: [
      { color: '#10b981', position: 0 },
      { color: '#84cc16', position: 50 },
      { color: '#10b981', position: 100 }
    ],
    position: { x: 50, y: 50 }
  },
  heading: {
    name: 'heading',
    type: 'linear',
    stops: [
      { color: '#10b981', position: 0 },
      { color: '#84cc16', position: 100 }
    ],
    angle: 90
  },
  button: {
    name: 'button',
    type: 'linear',
    stops: [
      { color: '#10b981', position: 0 },
      { color: '#059669', position: 100 }
    ],
    angle: 135
  }
};
```

### Animation State Machine

```typescript
type ComponentState = 
  | { type: 'idle' }
  | { type: 'loading'; progress?: number }
  | { type: 'success'; message?: string }
  | { type: 'error'; error: string }
  | { type: 'disabled'; reason?: string };

interface StateTransitionMap {
  idle: ['loading', 'disabled'];
  loading: ['success', 'error', 'idle'];
  success: ['idle'];
  error: ['idle', 'loading'];
  disabled: ['idle'];
}

class ComponentStateMachine {
  private state: ComponentState;
  private listeners: Set<(state: ComponentState) => void>;
  
  transition(newState: ComponentState): void;
  subscribe(listener: (state: ComponentState) => void): () => void;
  getState(): ComponentState;
}
```

## Implementation Details

### File Structure

```
src/
├── lib/
│   └── animations/
│       ├── config/
│       │   ├── theme.ts              # Color and visual config
│       │   ├── timing.ts             # Duration and easing config
│       │   ├── performance.ts        # Performance thresholds
│       │   └── index.ts              # Unified config export
│       ├── hooks/
│       │   ├── useScrollAnimation.ts
│       │   ├── useCardHover.ts
│       │   ├── useGradientAnimation.ts
│       │   ├── useReducedMotion.ts
│       │   ├── useFloatingAnimation.ts
│       │   └── index.ts
│       ├── controllers/
│       │   ├── ScrollController.ts
│       │   ├── ChartAnimator.ts
│       │   ├── AnimationStateManager.ts
│       │   └── index.ts
│       ├── utils/
│       │   ├── deviceCapabilities.ts
│       │   ├── performanceMonitor.ts
│       │   ├── gradientUtils.ts
│       │   └── index.ts
│       ├── variants/
│       │   ├── common.ts             # Reusable motion variants
│       │   ├── scroll.ts             # Scroll-based variants
│       │   └── index.ts
│       └── index.ts                  # Main export
├── components/
│   └── ui/
│       ├── animated/
│       │   ├── AnimatedCard.tsx
│       │   ├── GradientText.tsx
│       │   ├── AnimatedButton.tsx
│       │   ├── ScrollProgress.tsx
│       │   ├── FloatingIcon.tsx
│       │   └── index.ts
│       └── sections/
│           ├── HeroSection.tsx
│           ├── FeaturesGrid.tsx
│           ├── TestimonialSlider.tsx
│           ├── FAQAccordion.tsx
│           └── index.ts
└── app/
    └── globals.css                   # Global animation styles
```

### Configuration System

The animation system uses a centralized configuration approach:

```typescript
// lib/animations/config/index.ts
import { themeConfig } from './theme';
import { timingConfig } from './timing';
import { performanceConfig } from './performance';
import { accessibilityConfig } from './accessibility';

export const animationConfig: AnimationConfig = {
  theme: themeConfig,
  timing: timingConfig,
  performance: performanceConfig,
  accessibility: accessibilityConfig
};

export { themeConfig, timingConfig, performanceConfig, accessibilityConfig };
```

Components and hooks import from this centralized config to ensure consistency.

### GPU Acceleration Strategy

All animations use GPU-accelerated properties:

```typescript
// ✅ GPU-accelerated (use these)
const gpuProps = {
  transform: 'translateX(100px) scale(1.1) rotate(45deg)',
  opacity: 0.5,
  filter: 'blur(10px)' // Composited on GPU
};

// ❌ Avoid (triggers layout/paint)
const avoidProps = {
  left: '100px',
  top: '50px',
  width: '200px',
  height: '100px',
  margin: '10px'
};
```

Implementation pattern:

```typescript
// Add will-change hint for upcoming animations
const optimizedStyle = {
  willChange: 'transform, opacity',
  transform: 'translateZ(0)', // Force GPU layer
};

// Remove will-change after animation completes
const cleanup = () => {
  element.style.willChange = 'auto';
};
```

### Scroll Performance Optimization

```typescript
// Debounced scroll handler
let scrollTimeout: NodeJS.Timeout;
let ticking = false;

function handleScroll() {
  if (!ticking) {
    window.requestAnimationFrame(() => {
      updateScrollAnimations();
      ticking = false;
    });
    ticking = true;
  }
}

// Passive event listener for better performance
window.addEventListener('scroll', handleScroll, { passive: true });
```

### Lazy Loading Strategy

```typescript
function useLazyAnimation(threshold = 0.2) {
  const [shouldAnimate, setShouldAnimate] = useState(false);
  const ref = useRef<HTMLElement>(null);
  
  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setShouldAnimate(true);
          observer.disconnect(); // Stop observing after first trigger
        }
      },
      { threshold }
    );
    
    if (ref.current) {
      observer.observe(ref.current);
    }
    
    return () => observer.disconnect();
  }, [threshold]);
  
  return { ref, shouldAnimate };
}
```

### Reduced Motion Implementation

```typescript
// Hook implementation
function useReducedMotion(): boolean {
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);
  
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    setPrefersReducedMotion(mediaQuery.matches);
    
    const handleChange = (e: MediaQueryListEvent) => {
      setPrefersReducedMotion(e.matches);
    };
    
    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);
  
  return prefersReducedMotion;
}

// Usage in components
function AnimatedComponent() {
  const reducedMotion = useReducedMotion();
  
  const variants = reducedMotion
    ? {
        // Essential transitions only
        hidden: { opacity: 0 },
        visible: { opacity: 1, transition: { duration: 0.1 } }
      }
    : {
        // Full animations
        hidden: { opacity: 0, y: 20, scale: 0.95 },
        visible: { 
          opacity: 1, 
          y: 0, 
          scale: 1,
          transition: { duration: 0.4, ease: 'easeOut' }
        }
      };
  
  return <motion.div variants={variants} />;
}
```

### Mobile Optimization

```typescript
function useDeviceOptimization() {
  const [capabilities, setCapabilities] = useState<DeviceCapabilities>({
    hasGPU: true,
    supportsBackdropFilter: true,
    isMobile: false,
    isLowEndDevice: false,
    prefersReducedMotion: false,
    screenWidth: 1920,
    screenHeight: 1080,
    pixelRatio: 1
  });
  
  useEffect(() => {
    const detected = detectDeviceCapabilities();
    setCapabilities(detected);
  }, []);
  
  return capabilities;
}

// Adjust animation complexity based on device
function getAnimationComplexity(capabilities: DeviceCapabilities): 'high' | 'medium' | 'low' {
  if (capabilities.isLowEndDevice || capabilities.prefersReducedMotion) {
    return 'low';
  }
  if (capabilities.isMobile) {
    return 'medium';
  }
  return 'high';
}
```

### Framer Motion Integration Patterns

```typescript
// Basic component animation
function FadeInComponent() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.3 }}
    >
      Content
    </motion.div>
  );
}

// Scroll-triggered animation
function ScrollReveal({ children }: { children: ReactNode }) {
  const { ref, isInView } = useScrollAnimation();
  
  return (
    <motion.div
      ref={ref}
      initial="hidden"
      animate={isInView ? "visible" : "hidden"}
      variants={fadeInUp}
    >
      {children}
    </motion.div>
  );
}

// Staggered children
function StaggeredList({ items }: { items: string[] }) {
  return (
    <motion.ul
      variants={staggerContainer}
      initial="hidden"
      animate="visible"
    >
      {items.map((item, i) => (
        <motion.li key={i} variants={fadeInUp}>
          {item}
        </motion.li>
      ))}
    </motion.ul>
  );
}

// Layout animation
function ExpandableCard() {
  const [isExpanded, setIsExpanded] = useState(false);
  
  return (
    <motion.div
      layout
      onClick={() => setIsExpanded(!isExpanded)}
      style={{ borderRadius: 12 }}
    >
      <motion.div layout>Header</motion.div>
      {isExpanded && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          Expanded content
        </motion.div>
      )}
    </motion.div>
  );
}
```

### GSAP Integration Patterns

```typescript
// Timeline-based sequence
function createHeroTimeline(elements: {
  headline: HTMLElement;
  subheading: HTMLElement;
  cta: HTMLElement;
}) {
  const tl = gsap.timeline({ defaults: { ease: 'power3.out' } });
  
  tl.from(elements.headline, {
    scale: 0.8,
    opacity: 0,
    duration: 0.6
  })
  .from(elements.subheading, {
    y: 20,
    opacity: 0,
    duration: 0.4
  }, '-=0.2')
  .from(elements.cta, {
    y: 20,
    opacity: 0,
    duration: 0.4
  }, '-=0.2');
  
  return tl;
}

// Scroll trigger
function initScrollTrigger(element: HTMLElement) {
  gsap.from(element, {
    scrollTrigger: {
      trigger: element,
      start: 'top 80%',
      end: 'top 20%',
      scrub: 1,
      markers: false
    },
    y: 100,
    opacity: 0
  });
}

// Parallax effect
function initParallax(layer: HTMLElement, speed: number) {
  gsap.to(layer, {
    scrollTrigger: {
      trigger: document.body,
      start: 'top top',
      end: 'bottom bottom',
      scrub: true
    },
    y: (i, target) => -ScrollTrigger.maxScroll(window) * speed,
    ease: 'none'
  });
}

// Gradient animation
function animateGradient(element: HTMLElement) {
  gsap.to(element, {
    backgroundPosition: '200% center',
    duration: 10,
    ease: 'none',
    repeat: -1
  });
}
```

### Chart Animation Implementation

```typescript
// Line chart animation with Recharts
function AnimatedLineChart({ data }: { data: ChartData }) {
  const [animationProgress, setAnimationProgress] = useState(0);
  const { ref, isInView } = useScrollAnimation();
  
  useEffect(() => {
    if (isInView) {
      gsap.to({ value: 0 }, {
        value: 1,
        duration: 1.5,
        ease: 'power2.out',
        onUpdate: function() {
          setAnimationProgress(this.targets()[0].value);
        }
      });
    }
  }, [isInView]);
  
  const visibleData = data.slice(0, Math.floor(data.length * animationProgress));
  
  return (
    <div ref={ref}>
      <LineChart data={visibleData}>
        <Line 
          type="monotone" 
          dataKey="value" 
          stroke="#10b981"
          strokeWidth={2}
          dot={{ fill: '#10b981', r: 4 }}
          isAnimationActive={false} // We control animation manually
        />
      </LineChart>
    </div>
  );
}

// Donut chart with staggered segments
function AnimatedDonutChart({ segments }: { segments: DonutSegment[] }) {
  const [visibleSegments, setVisibleSegments] = useState<number>(0);
  const { ref, isInView } = useScrollAnimation();
  
  useEffect(() => {
    if (isInView) {
      segments.forEach((_, index) => {
        gsap.to({}, {
          duration: 0.3,
          delay: index * 0.1,
          onComplete: () => setVisibleSegments(index + 1)
        });
      });
    }
  }, [isInView, segments]);
  
  return (
    <div ref={ref}>
      <PieChart>
        <Pie
          data={segments.slice(0, visibleSegments)}
          dataKey="value"
          animationBegin={0}
          animationDuration={300}
        />
      </PieChart>
    </div>
  );
}
```

### Glassmorphism Implementation

```typescript
// Tailwind CSS classes
const glassmorphismClasses = cn(
  'backdrop-blur-xl',
  'bg-white/10',
  'border border-white/20',
  'shadow-xl',
  'rounded-2xl'
);

// CSS-in-JS approach
const glassmorphismStyle: CSSProperties = {
  backdropFilter: 'blur(12px)',
  backgroundColor: 'rgba(255, 255, 255, 0.1)',
  border: '1px solid rgba(255, 255, 255, 0.2)',
  boxShadow: '0 8px 32px 0 rgba(0, 0, 0, 0.37)',
  borderRadius: '16px'
};

// Component implementation
function GlassCard({ children, className }: { children: ReactNode; className?: string }) {
  const capabilities = useDeviceOptimization();
  
  // Fallback for browsers without backdrop-filter support
  const style = capabilities.supportsBackdropFilter
    ? glassmorphismStyle
    : {
        ...glassmorphismStyle,
        backdropFilter: 'none',
        backgroundColor: 'rgba(30, 30, 30, 0.9)' // Solid fallback
      };
  
  return (
    <div style={style} className={className}>
      {children}
    </div>
  );
}
```

### Ripple Effect Implementation

```typescript
function useRipple() {
  const [ripples, setRipples] = useState<Array<{ x: number; y: number; id: number }>>([]);
  
  const addRipple = (event: React.MouseEvent<HTMLElement>) => {
    const rect = event.currentTarget.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    const id = Date.now();
    
    setRipples(prev => [...prev, { x, y, id }]);
    
    setTimeout(() => {
      setRipples(prev => prev.filter(ripple => ripple.id !== id));
    }, 600);
  };
  
  return { ripples, addRipple };
}

function RippleButton({ children, onClick }: { children: ReactNode; onClick?: () => void }) {
  const { ripples, addRipple } = useRipple();
  
  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    addRipple(e);
    onClick?.();
  };
  
  return (
    <button
      onClick={handleClick}
      className="relative overflow-hidden"
    >
      {children}
      {ripples.map(ripple => (
        <motion.span
          key={ripple.id}
          className="absolute rounded-full bg-white/30"
          initial={{ scale: 0, x: ripple.x, y: ripple.y }}
          animate={{ scale: 4, opacity: 0 }}
          transition={{ duration: 0.6, ease: 'easeOut' }}
          style={{
            width: 20,
            height: 20,
            marginLeft: -10,
            marginTop: -10
          }}
        />
      ))}
    </button>
  );
}
```


## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system—essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property 1: Contrast Ratio Compliance

*For any* heading text with gradient or solid color against any background, the contrast ratio should meet or exceed WCAG AA standards (4.5:1 for normal text, 3:1 for large text).

**Validates: Requirements 1.5, 14.5**

### Property 2: Viewport Height Consistency

*For any* viewport size, the Hero Section container height should equal 100vh (viewport height).

**Validates: Requirements 2.1**

### Property 3: Parallax Speed Differential

*For any* scroll position, background parallax layers should move at a different rate than foreground content, with the rate determined by the configured speed multiplier.

**Validates: Requirements 2.4, 4.2**

### Property 4: Hover Effect Application

*For any* interactive element (button, card, icon, link) with hover effects enabled, hovering should apply the configured visual effects (scale, glow, color change, or lift) and remove them on mouse leave.

**Validates: Requirements 2.8, 3.3, 5.1, 5.2, 6.1, 7.4, 7.5, 9.1, 9.4, 15.2, 15.4, 17.1, 17.2, 17.4**

### Property 5: Hover Transition Duration

*For any* interactive element with hover effects, the transition duration should match the configured timing (200ms for quick transitions, 300ms for medium).

**Validates: Requirements 3.4, 5.6, 9.5, 17.1, 19.5**

### Property 6: Typography Scale Consistency

*For any* two elements of the same heading level (h1, h2, h3) or text type, they should have identical font-size values from the centralized typography configuration.

**Validates: Requirements 3.5, 22.5**

### Property 7: Scroll Trigger Activation

*For any* element with scroll-triggered animation, the animation should activate when the element reaches 20% intersection with the viewport.

**Validates: Requirements 4.1, 4.3, 4.6, 7.2, 8.1, 15.1, 17.5, 20.2**

### Property 8: Scroll Progress Accuracy

*For any* scroll position, the progress indicator should display a percentage equal to (scrollY / (documentHeight - viewportHeight)) × 100.

**Validates: Requirements 4.5**

### Property 9: Card Styling Consistency

*For any* Card_Component, it should have glassmorphism properties (backdrop-filter blur, semi-transparent background, border), rounded corners between 12-16px, and box-shadow applied.

**Validates: Requirements 5.3, 5.4, 5.5**

### Property 10: Floating Animation Bounds

*For any* element with floating animation, the vertical translation should oscillate between -10px and +10px with a cycle duration of 3000ms.

**Validates: Requirements 6.2, 6.3**

### Property 11: Animation Stagger Timing

*For any* sequence of elements with staggered animations, each subsequent element should have its animation delayed by the configured stagger value (50-100ms) relative to the previous element.

**Validates: Requirements 6.5, 7.2, 7.3, 8.3, 15.1, 20.5**

### Property 12: Chart Animation Duration

*For any* chart type (line, donut, bar), the animation duration should match the configured value: line charts 1500ms, bar charts 800ms, donut charts with per-segment stagger.

**Validates: Requirements 8.2, 8.4**

### Property 13: Chart Hover Highlight

*For any* data point in a chart, hovering should apply neon green accent color highlighting.

**Validates: Requirements 8.6**

### Property 14: Ripple Origin Accuracy

*For any* button click at position (x, y) relative to the button, the ripple effect should originate from coordinates (x, y) and complete within 600ms.

**Validates: Requirements 9.2, 9.3**

### Property 15: Gradient Animation Cycle

*For any* gradient mesh or animated gradient, the color cycle duration should match the configured value (10000ms for backgrounds).

**Validates: Requirements 10.3, 24.2**

### Property 16: Background Gradient Scroll Response

*For any* scroll position change, background gradient layers should update their position or color based on scroll progress.

**Validates: Requirements 10.5**

### Property 17: Testimonial Auto-Advance Timing

*For any* testimonial slider not being hovered, it should automatically advance to the next testimonial after exactly 5000ms, with a 500ms transition duration.

**Validates: Requirements 11.1, 11.2**

### Property 18: Testimonial Hover Pause

*For any* testimonial slider, hovering should pause auto-advancement, and mouse leave should resume it.

**Validates: Requirements 11.3**

### Property 19: Testimonial Navigation Accuracy

*For any* navigation dot clicked at index N, the slider should transition to display testimonial N.

**Validates: Requirements 11.5**

### Property 20: Testimonial Content Fade

*For any* testimonial transition, the incoming content should fade in with opacity transitioning from 0 to 1.

**Validates: Requirements 11.6**

### Property 21: Accordion Expansion Behavior

*For any* FAQ accordion item, clicking when collapsed should expand it with height transition over 400ms and rotate the icon by 180 degrees; clicking when expanded should collapse it with the reverse transition.

**Validates: Requirements 12.1, 12.2, 12.3, 12.4**

### Property 22: Accordion Content Fade

*For any* FAQ accordion expansion, the answer content should fade in with opacity transitioning from 0 to 1.

**Validates: Requirements 12.5**

### Property 23: GPU Acceleration Enforcement

*For any* animation, only GPU-accelerated CSS properties (transform, opacity, filter) should be modified; layout-triggering properties (width, height, top, left, margin) should not be animated.

**Validates: Requirements 13.2, 13.3, 13.6, 24.4**

### Property 24: Lazy Loading Threshold

*For any* animated section initially below the fold, animation initialization should not occur until the element is within 20% of entering the viewport.

**Validates: Requirements 13.4**

### Property 25: Scroll Handler Debouncing

*For any* burst of scroll events, the scroll handler should execute at most once every 16ms using requestAnimationFrame.

**Validates: Requirements 13.5, 13.7**

### Property 26: Reduced Motion Compliance

*For any* animation when prefers-reduced-motion is enabled, decorative animations (floating, parallax, particles) should be disabled while essential transitions (state changes, focus indicators) remain enabled with reduced duration.

**Validates: Requirements 14.1, 14.2, 14.6**

### Property 27: Keyboard Navigation Preservation

*For any* interactive element with animations, keyboard navigation (tab, enter, space) should function identically to mouse interaction, and focus indicators should remain visible during all animation states.

**Validates: Requirements 14.3, 14.4**

### Property 28: Progress Indicator Transition

*For any* progress value change, the visual indicator should transition smoothly over 300ms to the new value.

**Validates: Requirements 16.2**

### Property 29: Loading Indicator Pulse

*For any* loading indicator, the pulsing animation should have a cycle duration of 1500ms.

**Validates: Requirements 16.4**

### Property 30: Notification Entrance Animation

*For any* notification, it should slide in from the top-right corner over 400ms with a subtle bounce effect at the end.

**Validates: Requirements 18.1, 18.2, 18.4**

### Property 31: Notification Exit Animation

*For any* notification dismissal, it should fade out and slide upward simultaneously.

**Validates: Requirements 18.3**

### Property 32: Notification Stacking Spacing

*For any* set of multiple notifications, they should be stacked vertically with exactly 8px spacing between each notification.

**Validates: Requirements 18.5**

### Property 33: Input Focus Glow

*For any* input field, focusing should apply a glow effect to the border, and blurring should remove it.

**Validates: Requirements 19.1**

### Property 34: Floating Label Animation

*For any* input field with a floating label, focusing should animate the label upward, and blurring with empty input should animate it back down.

**Validates: Requirements 19.2**

### Property 35: Input Validation Animation

*For any* input field, validation failure should trigger a shake animation over 400ms, and validation success should display a checkmark icon with scale-in animation.

**Validates: Requirements 19.3, 19.4**

### Property 36: Comparison Slider Real-Time Update

*For any* before/after comparison slider position, the reveal mask should update immediately (same frame) to match the slider position.

**Validates: Requirements 20.4**

### Property 37: Mobile Animation Reduction

*For any* viewport width less than 768px, animation complexity should be reduced (parallax disabled, particle count reduced or disabled, simpler transitions).

**Validates: Requirements 21.1, 21.2, 21.6**

### Property 38: Touch Target Minimum Size

*For any* interactive element on touch devices, the touch target should be at least 44x44 pixels.

**Validates: Requirements 21.3**

### Property 39: Device Capability Detection

*For any* device, capabilities (GPU support, backdrop-filter support, screen size, prefers-reduced-motion) should be detected on initialization and used to adjust animation quality.

**Validates: Requirements 21.5**

### Property 40: Touch Feedback Immediacy

*For any* touch gesture on an interactive element, visual feedback should be applied within the same frame (< 16ms).

**Validates: Requirements 21.4**

### Property 41: Timing Configuration Override

*For any* component, it should be able to override default timing values from the centralized configuration while still respecting the timing structure.

**Validates: Requirements 23.5**

### Property 42: Component State Transition Consistency

*For any* component state change (idle ↔ loading ↔ success ↔ error ↔ disabled), the transition should apply the appropriate animation (fade-in for disabled→enabled, content replacement for loading→loaded, color transition for error→success) with consistent timing and without layout shift.

**Validates: Requirements 25.1, 25.2, 25.3, 25.4, 25.5**

## Error Handling

### Animation Failure Graceful Degradation

When animations fail to initialize or execute:

1. **Library Load Failure**: If Framer Motion or GSAP fails to load, components should render in their final state without animations
2. **Browser Compatibility**: If browser doesn't support required features (backdrop-filter, CSS transforms), provide fallback styling
3. **Performance Degradation**: If FPS drops below 30, automatically reduce animation complexity or disable non-essential animations
4. **Memory Constraints**: If device memory is limited, reduce particle count and disable complex background effects

### Error Boundaries

```typescript
class AnimationErrorBoundary extends React.Component<Props, State> {
  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Animation error:', error, errorInfo);
    // Log to monitoring service
    // Render fallback UI without animations
  }
  
  render() {
    if (this.state.hasError) {
      return this.props.fallback || this.props.children;
    }
    return this.props.children;
  }
}
```

### Scroll Performance Monitoring

```typescript
class ScrollPerformanceMonitor {
  private frameDropCount = 0;
  private readonly maxFrameDrops = 10;
  
  onFrameDrop() {
    this.frameDropCount++;
    if (this.frameDropCount > this.maxFrameDrops) {
      // Disable parallax and complex scroll effects
      this.disableComplexScrollEffects();
    }
  }
  
  private disableComplexScrollEffects() {
    // Remove parallax layers
    // Simplify scroll triggers
    // Reduce animation complexity
  }
}
```

### Invalid Configuration Handling

```typescript
function validateAnimationConfig(config: AnimationConfig): ValidationResult {
  const errors: string[] = [];
  
  // Validate durations are positive numbers
  if (config.timing.durations.quick <= 0) {
    errors.push('Quick duration must be positive');
  }
  
  // Validate colors are valid hex/rgb
  if (!isValidColor(config.theme.colors.accent.primary)) {
    errors.push('Invalid accent color format');
  }
  
  // Validate performance thresholds
  if (config.performance.targetFPS < 30 || config.performance.targetFPS > 120) {
    errors.push('Target FPS must be between 30 and 120');
  }
  
  return {
    valid: errors.length === 0,
    errors
  };
}
```

### Intersection Observer Fallback

```typescript
function useScrollAnimationWithFallback() {
  const [isInView, setIsInView] = useState(false);
  const ref = useRef<HTMLElement>(null);
  
  useEffect(() => {
    if (!('IntersectionObserver' in window)) {
      // Fallback: assume all elements are in view
      setIsInView(true);
      return;
    }
    
    const observer = new IntersectionObserver(/* ... */);
    // Normal implementation
  }, []);
  
  return { ref, isInView };
}
```

## Testing Strategy

### Dual Testing Approach

The animation system requires both unit tests and property-based tests for comprehensive coverage:

**Unit Tests** focus on:
- Specific animation configurations and presets
- Component rendering with correct CSS classes and styles
- Event handler attachment and execution
- Edge cases (empty data, single item, maximum items)
- Error boundary behavior
- Browser compatibility fallbacks

**Property-Based Tests** focus on:
- Universal animation behaviors across all inputs
- Timing consistency across different durations
- State transition correctness for all state combinations
- Scroll position calculations for any viewport size
- Hover effects for any cursor position
- Configuration validation for any input values

### Property-Based Testing Configuration

**Library**: Fast-check (JavaScript/TypeScript property-based testing library)

**Configuration**: Each property test runs minimum 100 iterations to ensure comprehensive input coverage through randomization.

**Tagging**: Each property test includes a comment referencing its design document property:

```typescript
// Feature: premium-ui-animations, Property 1: Contrast Ratio Compliance
test('heading contrast ratios meet WCAG AA standards', () => {
  fc.assert(
    fc.property(
      fc.hexColor(), // heading color
      fc.hexColor(), // background color
      (headingColor, bgColor) => {
        const ratio = calculateContrastRatio(headingColor, bgColor);
        expect(ratio).toBeGreaterThanOrEqual(4.5);
      }
    ),
    { numRuns: 100 }
  );
});
```

### Test Organization

```
src/
└── lib/
    └── animations/
        ├── __tests__/
        │   ├── unit/
        │   │   ├── config.test.ts
        │   │   ├── hooks.test.ts
        │   │   ├── controllers.test.ts
        │   │   └── utils.test.ts
        │   └── properties/
        │       ├── contrast.property.test.ts
        │       ├── timing.property.test.ts
        │       ├── scroll.property.test.ts
        │       ├── hover.property.test.ts
        │       ├── state-transitions.property.test.ts
        │       └── accessibility.property.test.ts
        └── ...
```

### Example Property Tests

```typescript
// Feature: premium-ui-animations, Property 8: Scroll Progress Accuracy
test('scroll progress percentage is accurate for any scroll position', () => {
  fc.assert(
    fc.property(
      fc.integer({ min: 0, max: 10000 }), // document height
      fc.integer({ min: 300, max: 2000 }), // viewport height
      (docHeight, viewportHeight) => {
        fc.pre(docHeight > viewportHeight); // Precondition
        
        const maxScroll = docHeight - viewportHeight;
        const scrollY = fc.sample(fc.integer({ min: 0, max: maxScroll }), 1)[0];
        
        const progress = calculateScrollProgress(scrollY, docHeight, viewportHeight);
        const expected = (scrollY / maxScroll) * 100;
        
        expect(progress).toBeCloseTo(expected, 2);
      }
    ),
    { numRuns: 100 }
  );
});

// Feature: premium-ui-animations, Property 11: Animation Stagger Timing
test('staggered animations have correct delay between elements', () => {
  fc.assert(
    fc.property(
      fc.array(fc.anything(), { minLength: 2, maxLength: 10 }), // elements
      fc.integer({ min: 50, max: 200 }), // stagger delay
      (elements, staggerDelay) => {
        const delays = calculateStaggerDelays(elements.length, staggerDelay);
        
        for (let i = 1; i < delays.length; i++) {
          expect(delays[i] - delays[i - 1]).toBe(staggerDelay);
        }
      }
    ),
    { numRuns: 100 }
  );
});

// Feature: premium-ui-animations, Property 23: GPU Acceleration Enforcement
test('animations only use GPU-accelerated properties', () => {
  fc.assert(
    fc.property(
      fc.record({
        x: fc.integer({ min: -1000, max: 1000 }),
        y: fc.integer({ min: -1000, max: 1000 }),
        scale: fc.float({ min: 0.5, max: 2 }),
        opacity: fc.float({ min: 0, max: 1 })
      }),
      (animationProps) => {
        const cssProps = generateAnimationCSS(animationProps);
        
        // Should only contain GPU-accelerated properties
        expect(cssProps).toHaveProperty('transform');
        expect(cssProps).toHaveProperty('opacity');
        
        // Should NOT contain layout-triggering properties
        expect(cssProps).not.toHaveProperty('left');
        expect(cssProps).not.toHaveProperty('top');
        expect(cssProps).not.toHaveProperty('width');
        expect(cssProps).not.toHaveProperty('height');
      }
    ),
    { numRuns: 100 }
  );
});

// Feature: premium-ui-animations, Property 26: Reduced Motion Compliance
test('decorative animations disabled with reduced motion preference', () => {
  fc.assert(
    fc.property(
      fc.constantFrom('floating', 'parallax', 'particles', 'gradient-shift'),
      (animationType) => {
        const prefersReducedMotion = true;
        const shouldAnimate = shouldEnableAnimation(animationType, prefersReducedMotion);
        
        expect(shouldAnimate).toBe(false);
      }
    ),
    { numRuns: 100 }
  );
});

// Feature: premium-ui-animations, Property 42: Component State Transition Consistency
test('state transitions apply correct animations without layout shift', () => {
  fc.assert(
    fc.property(
      fc.constantFrom('idle', 'loading', 'success', 'error', 'disabled'),
      fc.constantFrom('idle', 'loading', 'success', 'error', 'disabled'),
      (fromState, toState) => {
        fc.pre(fromState !== toState); // Only test actual transitions
        
        const transition = getStateTransition(fromState, toState);
        
        // Should have defined transition
        expect(transition).toBeDefined();
        
        // Should have consistent timing
        expect(transition.duration).toBeGreaterThan(0);
        expect(transition.duration).toBeLessThanOrEqual(600);
        
        // Should not modify layout properties
        const animatedProps = Object.keys(transition.animation);
        const layoutProps = ['width', 'height', 'top', 'left', 'margin', 'padding'];
        const hasLayoutProps = animatedProps.some(prop => layoutProps.includes(prop));
        
        expect(hasLayoutProps).toBe(false);
      }
    ),
    { numRuns: 100 }
  );
});
```

### Example Unit Tests

```typescript
describe('AnimatedCard', () => {
  it('renders with glassmorphism styling', () => {
    const { container } = render(<AnimatedCard>Content</AnimatedCard>);
    const card = container.firstChild as HTMLElement;
    
    const styles = window.getComputedStyle(card);
    expect(styles.backdropFilter).toContain('blur');
    expect(styles.borderRadius).toBe('16px');
  });
  
  it('applies hover effects on mouse enter', async () => {
    const { container } = render(<AnimatedCard enableTilt>Content</AnimatedCard>);
    const card = container.firstChild as HTMLElement;
    
    await userEvent.hover(card);
    
    // Check for transform application
    expect(card.style.transform).toBeTruthy();
  });
  
  it('handles missing IntersectionObserver gracefully', () => {
    const originalIO = window.IntersectionObserver;
    // @ts-ignore
    delete window.IntersectionObserver;
    
    const { container } = render(<ScrollReveal>Content</ScrollReveal>);
    
    // Should render without error
    expect(container.firstChild).toBeInTheDocument();
    
    window.IntersectionObserver = originalIO;
  });
});

describe('useReducedMotion', () => {
  it('returns true when prefers-reduced-motion is set', () => {
    window.matchMedia = jest.fn().mockImplementation(query => ({
      matches: query === '(prefers-reduced-motion: reduce)',
      addEventListener: jest.fn(),
      removeEventListener: jest.fn()
    }));
    
    const { result } = renderHook(() => useReducedMotion());
    expect(result.current).toBe(true);
  });
});

describe('ChartAnimator', () => {
  it('animates line chart over specified duration', async () => {
    const animator = new ChartAnimator();
    const data = [{ x: 0, y: 10 }, { x: 1, y: 20 }];
    
    const startTime = Date.now();
    await animator.animateLineChart(data, 1500);
    const endTime = Date.now();
    
    expect(endTime - startTime).toBeGreaterThanOrEqual(1500);
    expect(endTime - startTime).toBeLessThan(1600); // Allow small margin
  });
});
```

### Integration Testing

Integration tests verify the animation system works correctly with the full application:

```typescript
describe('Hero Section Integration', () => {
  it('loads and animates all elements in sequence', async () => {
    render(<HeroSection {...props} />);
    
    // Headline should animate first
    await waitFor(() => {
      const headline = screen.getByRole('heading', { level: 1 });
      expect(headline).toHaveStyle({ opacity: '1' });
    });
    
    // Subheading should follow
    await waitFor(() => {
      const subheading = screen.getByText(/subheading/i);
      expect(subheading).toHaveStyle({ opacity: '1' });
    });
    
    // CTA should be last
    await waitFor(() => {
      const cta = screen.getByRole('button');
      expect(cta).toHaveStyle({ opacity: '1' });
    });
  });
});
```

### Performance Testing

```typescript
describe('Animation Performance', () => {
  it('maintains 60fps during scroll animations', async () => {
    const monitor = new PerformanceMonitor();
    monitor.start();
    
    render(<App />);
    
    // Simulate scrolling
    for (let i = 0; i < 100; i++) {
      window.scrollTo(0, i * 10);
      await new Promise(resolve => requestAnimationFrame(resolve));
    }
    
    monitor.stop();
    const metrics = monitor.getMetrics();
    
    expect(metrics.fps).toBeGreaterThanOrEqual(55); // Allow small margin
    expect(metrics.droppedFrames).toBeLessThan(5);
  });
  
  it('keeps bundle size under 100KB', () => {
    const bundleSize = getBundleSize(['framer-motion', 'gsap']);
    expect(bundleSize).toBeLessThan(100 * 1024); // 100KB in bytes
  });
});
```

### Accessibility Testing

```typescript
describe('Animation Accessibility', () => {
  it('maintains keyboard navigation during animations', async () => {
    render(<FeaturesGrid features={mockFeatures} />);
    
    const firstCard = screen.getAllByRole('article')[0];
    firstCard.focus();
    
    // Should be able to tab through cards
    await userEvent.tab();
    expect(screen.getAllByRole('article')[1]).toHaveFocus();
  });
  
  it('preserves focus indicators during hover animations', async () => {
    render(<AnimatedButton>Click me</AnimatedButton>);
    const button = screen.getByRole('button');
    
    button.focus();
    await userEvent.hover(button);
    
    // Focus indicator should still be visible
    expect(button).toHaveFocus();
    expect(button).toHaveStyle({ outline: expect.any(String) });
  });
});
```

## Summary

This design document provides a comprehensive architecture for the Premium UI Animations & Motion System, including:

- Layered architecture separating concerns (hooks, controllers, configuration)
- Dual-library approach leveraging Framer Motion and GSAP strengths
- Performance-first implementation with GPU acceleration and lazy loading
- Full accessibility compliance with reduced motion support
- Centralized configuration for consistency
- Extensive reusable components and hooks
- 42 correctness properties ensuring system reliability
- Comprehensive testing strategy with both unit and property-based tests

The system is designed to be performant, accessible, maintainable, and extensible, providing a premium user experience while maintaining 60fps performance across all devices.

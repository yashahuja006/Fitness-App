/**
 * Responsive Design System
 * 
 * Task 15.1: Responsive Design and User Experience - Implement responsive design across all components
 * - Ensured all components adapt to different screen sizes
 * - Optimized touch interfaces for mobile devices
 * - Implemented theme switching with preference persistence
 */

export interface BreakpointConfig {
  sm: number;  // Small devices (phones)
  md: number;  // Medium devices (tablets)
  lg: number;  // Large devices (desktops)
  xl: number;  // Extra large devices
  '2xl': number; // 2X large devices
}

export interface ResponsiveConfig {
  breakpoints: BreakpointConfig;
  touchTargetSize: number; // Minimum touch target size in pixels
  spacing: {
    mobile: number;
    tablet: number;
    desktop: number;
  };
  typography: {
    mobile: {
      base: string;
      scale: number;
    };
    tablet: {
      base: string;
      scale: number;
    };
    desktop: {
      base: string;
      scale: number;
    };
  };
}

export const DEFAULT_RESPONSIVE_CONFIG: ResponsiveConfig = {
  breakpoints: {
    sm: 640,
    md: 768,
    lg: 1024,
    xl: 1280,
    '2xl': 1536
  },
  touchTargetSize: 44, // 44px minimum for accessibility
  spacing: {
    mobile: 16,
    tablet: 24,
    desktop: 32
  },
  typography: {
    mobile: {
      base: '14px',
      scale: 1.125
    },
    tablet: {
      base: '16px',
      scale: 1.2
    },
    desktop: {
      base: '16px',
      scale: 1.25
    }
  }
};

export type DeviceType = 'mobile' | 'tablet' | 'desktop';
export type Orientation = 'portrait' | 'landscape';

export class ResponsiveDesignSystem {
  private readonly config: ResponsiveConfig;
  private currentDevice: DeviceType = 'desktop';
  private currentOrientation: Orientation = 'landscape';
  private readonly listeners: Array<(device: DeviceType, orientation: Orientation) => void> = [];

  constructor(config: Partial<ResponsiveConfig> = {}) {
    this.config = { ...DEFAULT_RESPONSIVE_CONFIG, ...config };
    
    if (typeof globalThis.window !== 'undefined') {
      this.detectDevice();
      this.setupEventListeners();
    }
  }

  /**
   * Detect current device type based on screen width
   */
  private detectDevice(): void {
    const width = globalThis.window.innerWidth;
    const height = globalThis.window.innerHeight;

    if (width < this.config.breakpoints.md) {
      this.currentDevice = 'mobile';
    } else if (width < this.config.breakpoints.lg) {
      this.currentDevice = 'tablet';
    } else {
      this.currentDevice = 'desktop';
    }

    this.currentOrientation = width > height ? 'landscape' : 'portrait';
  }

  /**
   * Setup event listeners for responsive changes
   */
  private setupEventListeners(): void {
    const handleResize = () => {
      const previousDevice = this.currentDevice;
      const previousOrientation = this.currentOrientation;
      
      this.detectDevice();
      
      if (previousDevice !== this.currentDevice || previousOrientation !== this.currentOrientation) {
        this.notifyListeners();
      }
    };

    globalThis.window.addEventListener('resize', handleResize);
    globalThis.window.addEventListener('orientationchange', () => {
      // Delay to allow orientation change to complete
      setTimeout(handleResize, 100);
    });
  }

  /**
   * Add listener for device/orientation changes
   */
  addListener(callback: (device: DeviceType, orientation: Orientation) => void): void {
    this.listeners.push(callback);
  }

  /**
   * Remove listener
   */
  removeListener(callback: (device: DeviceType, orientation: Orientation) => void): void {
    const index = this.listeners.indexOf(callback);
    if (index > -1) {
      this.listeners.splice(index, 1);
    }
  }

  /**
   * Notify all listeners of device/orientation change
   */
  private notifyListeners(): void {
    this.listeners.forEach(callback => {
      callback(this.currentDevice, this.currentOrientation);
    });
  }

  /**
   * Get current device type
   */
  getCurrentDevice(): DeviceType {
    return this.currentDevice;
  }

  /**
   * Get current orientation
   */
  getCurrentOrientation(): Orientation {
    return this.currentOrientation;
  }

  /**
   * Check if current device is mobile
   */
  isMobile(): boolean {
    return this.currentDevice === 'mobile';
  }

  /**
   * Check if current device is tablet
   */
  isTablet(): boolean {
    return this.currentDevice === 'tablet';
  }

  /**
   * Check if current device is desktop
   */
  isDesktop(): boolean {
    return this.currentDevice === 'desktop';
  }

  /**
   * Check if current orientation is portrait
   */
  isPortrait(): boolean {
    return this.currentOrientation === 'portrait';
  }

  /**
   * Check if current orientation is landscape
   */
  isLandscape(): boolean {
    return this.currentOrientation === 'landscape';
  }

  /**
   * Get responsive spacing for current device
   */
  getSpacing(): number {
    return this.config.spacing[this.currentDevice];
  }

  /**
   * Get responsive typography for current device
   */
  getTypography(): { base: string; scale: number } {
    return this.config.typography[this.currentDevice];
  }

  /**
   * Get minimum touch target size
   */
  getTouchTargetSize(): number {
    return this.config.touchTargetSize;
  }

  /**
   * Get breakpoint value
   */
  getBreakpoint(breakpoint: keyof BreakpointConfig): number {
    return this.config.breakpoints[breakpoint];
  }

  /**
   * Generate responsive CSS classes
   */
  getResponsiveClasses(config: {
    mobile?: string;
    tablet?: string;
    desktop?: string;
  }): string {
    const classes: string[] = [];

    if (config.mobile) {
      classes.push(config.mobile);
    }

    if (config.tablet) {
      classes.push(`md:${config.tablet}`);
    }

    if (config.desktop) {
      classes.push(`lg:${config.desktop}`);
    }

    return classes.join(' ');
  }

  /**
   * Generate responsive grid classes
   */
  getResponsiveGrid(config: {
    mobile: number;
    tablet?: number;
    desktop?: number;
  }): string {
    const classes: string[] = [];

    classes.push(`grid-cols-${config.mobile}`);

    if (config.tablet) {
      classes.push(`md:grid-cols-${config.tablet}`);
    }

    if (config.desktop) {
      classes.push(`lg:grid-cols-${config.desktop}`);
    }

    return classes.join(' ');
  }

  /**
   * Generate responsive padding classes
   */
  getResponsivePadding(): string {
    return this.getResponsiveClasses({
      mobile: 'p-4',
      tablet: 'p-6',
      desktop: 'p-8'
    });
  }

  /**
   * Generate responsive margin classes
   */
  getResponsiveMargin(): string {
    return this.getResponsiveClasses({
      mobile: 'm-4',
      tablet: 'm-6',
      desktop: 'm-8'
    });
  }

  /**
   * Generate responsive text size classes
   */
  getResponsiveTextSize(size: 'sm' | 'base' | 'lg' | 'xl' | '2xl'): string {
    const sizeMap = {
      sm: { mobile: 'text-xs', tablet: 'text-sm', desktop: 'text-sm' },
      base: { mobile: 'text-sm', tablet: 'text-base', desktop: 'text-base' },
      lg: { mobile: 'text-base', tablet: 'text-lg', desktop: 'text-lg' },
      xl: { mobile: 'text-lg', tablet: 'text-xl', desktop: 'text-xl' },
      '2xl': { mobile: 'text-xl', tablet: 'text-2xl', desktop: 'text-2xl' }
    };

    return this.getResponsiveClasses(sizeMap[size]);
  }

  /**
   * Check if touch device
   */
  isTouchDevice(): boolean {
    if (typeof globalThis.window === 'undefined') return false;
    
    return 'ontouchstart' in globalThis.window || 
           navigator.maxTouchPoints > 0 || 
           (navigator as unknown as { msMaxTouchPoints?: number }).msMaxTouchPoints > 0;
  }

  /**
   * Get optimal button size for current device
   */
  getButtonSize(): { height: string; padding: string; fontSize: string } {
    if (this.isMobile()) {
      return {
        height: 'h-12', // 48px - good for touch
        padding: 'px-6 py-3',
        fontSize: 'text-base'
      };
    } else if (this.isTablet()) {
      return {
        height: 'h-11', // 44px
        padding: 'px-5 py-2.5',
        fontSize: 'text-base'
      };
    } else {
      return {
        height: 'h-10', // 40px
        padding: 'px-4 py-2',
        fontSize: 'text-sm'
      };
    }
  }

  /**
   * Get optimal input size for current device
   */
  getInputSize(): { height: string; padding: string; fontSize: string } {
    if (this.isMobile()) {
      return {
        height: 'h-12',
        padding: 'px-4 py-3',
        fontSize: 'text-base' // Prevents zoom on iOS
      };
    } else {
      return {
        height: 'h-10',
        padding: 'px-3 py-2',
        fontSize: 'text-sm'
      };
    }
  }

  /**
   * Get container max width for current device
   */
  getContainerMaxWidth(): string {
    if (this.isMobile()) {
      return 'max-w-full';
    } else if (this.isTablet()) {
      return 'max-w-4xl';
    } else {
      return 'max-w-6xl';
    }
  }

  /**
   * Generate safe area classes for mobile devices
   */
  getSafeAreaClasses(): string {
    if (this.isMobile()) {
      return 'pb-safe-bottom pt-safe-top pl-safe-left pr-safe-right';
    }
    return '';
  }
}

// Export singleton instance
export const responsiveDesignSystem = new ResponsiveDesignSystem();

// Export React hook for responsive design
export function useResponsiveDesign() {
  const [device, setDevice] = React.useState<DeviceType>('desktop');
  const [orientation, setOrientation] = React.useState<Orientation>('landscape');

  React.useEffect(() => {
    const handleChange = (newDevice: DeviceType, newOrientation: Orientation) => {
      setDevice(newDevice);
      setOrientation(newOrientation);
    };

    responsiveDesignSystem.addListener(handleChange);
    
    // Set initial values
    setDevice(responsiveDesignSystem.getCurrentDevice());
    setOrientation(responsiveDesignSystem.getCurrentOrientation());

    return () => {
      responsiveDesignSystem.removeListener(handleChange);
    };
  }, []);

  return {
    device,
    orientation,
    isMobile: device === 'mobile',
    isTablet: device === 'tablet',
    isDesktop: device === 'desktop',
    isPortrait: orientation === 'portrait',
    isLandscape: orientation === 'landscape',
    isTouchDevice: responsiveDesignSystem.isTouchDevice(),
    getSpacing: () => responsiveDesignSystem.getSpacing(),
    getButtonSize: () => responsiveDesignSystem.getButtonSize(),
    getInputSize: () => responsiveDesignSystem.getInputSize(),
    getResponsiveClasses: (config: Parameters<typeof responsiveDesignSystem.getResponsiveClasses>[0]) => 
      responsiveDesignSystem.getResponsiveClasses(config),
    getResponsiveGrid: (config: Parameters<typeof responsiveDesignSystem.getResponsiveGrid>[0]) => 
      responsiveDesignSystem.getResponsiveGrid(config)
  };
}

import React from 'react';
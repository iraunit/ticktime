import React, { useEffect } from 'react';

/**
 * Performance monitoring utilities for frontend optimization
 */

export interface PerformanceMetrics {
  loadTime: number;
  renderTime: number;
  apiResponseTime: number;
  memoryUsage?: number;
  networkType?: string;
}

export class PerformanceMonitor {
  private static metrics: Map<string, PerformanceMetrics> = new Map();
  private static observers: PerformanceObserver[] = [];

  /**
   * Initialize performance monitoring
   */
  static init() {
    if (typeof window === 'undefined') return;

    // Skip performance monitoring in development to reduce noise
    if (process.env.NODE_ENV === 'development' && process.env.NEXT_PUBLIC_DISABLE_PERF_MONITOR === 'true') {
      return;
    }

    // Delay initialization to avoid hydration issues
    setTimeout(() => {
      // Monitor navigation timing
      this.observeNavigation();
      
      // Monitor resource loading
      this.observeResources();
      
      // Monitor long tasks
      this.observeLongTasks();
      
      // Monitor layout shifts
      this.observeLayoutShifts();
    }, 100);
  }

  /**
   * Track page load performance
   */
  private static observeNavigation() {
    if ('PerformanceObserver' in window) {
      const observer = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        entries.forEach((entry) => {
          if (entry.entryType === 'navigation') {
            const navEntry = entry as PerformanceNavigationTiming;
            this.recordMetric('navigation', {
              loadTime: navEntry.loadEventEnd - navEntry.loadEventStart,
              renderTime: navEntry.domContentLoadedEventEnd - navEntry.domContentLoadedEventStart,
              apiResponseTime: navEntry.responseEnd - navEntry.requestStart,
            });
          }
        });
      });

      observer.observe({ entryTypes: ['navigation'] });
      this.observers.push(observer);
    }
  }

  /**
   * Monitor resource loading times
   */
  private static observeResources() {
    if ('PerformanceObserver' in window) {
      const observer = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        entries.forEach((entry) => {
          if (entry.entryType === 'resource') {
            const resourceEntry = entry as PerformanceResourceTiming;
            
            // Log slow resources
            const loadTime = resourceEntry.responseEnd - resourceEntry.requestStart;
            const threshold = process.env.NODE_ENV === 'development' ? 5000 : 1000; // Much higher threshold in dev
            if (loadTime > threshold) { // More than 5 seconds in dev, 1 second in prod
              console.warn(`Slow resource: ${entry.name} took ${loadTime}ms`);
            }
          }
        });
      });

      observer.observe({ entryTypes: ['resource'] });
      this.observers.push(observer);
    }
  }

  /**
   * Monitor long tasks that block the main thread
   */
  private static observeLongTasks() {
    if ('PerformanceObserver' in window) {
      const observer = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        entries.forEach((entry) => {
          if (entry.entryType === 'longtask') {
            console.warn(`Long task detected: ${entry.duration}ms`);
          }
        });
      });

      try {
        observer.observe({ entryTypes: ['longtask'] });
        this.observers.push(observer);
      } catch (e) {
        // longtask not supported in all browsers
      }
    }
  }

  /**
   * Monitor cumulative layout shift
   */
  private static observeLayoutShifts() {
    if ('PerformanceObserver' in window) {
      let clsValue = 0;
      
      const observer = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        entries.forEach((entry) => {
          if (entry.entryType === 'layout-shift' && !(entry as any).hadRecentInput) {
            clsValue += (entry as any).value;
          }
        });
        
        // Log if CLS is high
        if (clsValue > 0.1) {
          console.warn(`High Cumulative Layout Shift: ${clsValue}`);
        }
      });

      try {
        observer.observe({ entryTypes: ['layout-shift'] });
        this.observers.push(observer);
      } catch (e) {
        // layout-shift not supported in all browsers
      }
    }
  }

  /**
   * Record custom performance metrics
   */
  static recordMetric(name: string, metrics: PerformanceMetrics) {
    this.metrics.set(name, {
      ...metrics,
      memoryUsage: this.getMemoryUsage(),
      networkType: this.getNetworkType(),
    });
  }

  /**
   * Get memory usage information
   */
  private static getMemoryUsage(): number | undefined {
    if ('memory' in performance) {
      return (performance as any).memory.usedJSHeapSize;
    }
    return undefined;
  }

  /**
   * Get network connection type
   */
  private static getNetworkType(): string | undefined {
    if ('connection' in navigator) {
      return (navigator as any).connection.effectiveType;
    }
    return undefined;
  }

  /**
   * Measure API call performance
   */
  static async measureApiCall<T>(
    name: string,
    apiCall: () => Promise<T>
  ): Promise<T> {
    const startTime = performance.now();
    
    try {
      const result = await apiCall();
      const endTime = performance.now();
      
      this.recordMetric(`api_${name}`, {
        loadTime: 0,
        renderTime: 0,
        apiResponseTime: endTime - startTime,
      });
      
      return result;
    } catch (error) {
      const endTime = performance.now();
      
      this.recordMetric(`api_${name}_error`, {
        loadTime: 0,
        renderTime: 0,
        apiResponseTime: endTime - startTime,
      });
      
      throw error;
    }
  }

  /**
   * Measure component render time
   */
  static measureRender(componentName: string, renderFn: () => void) {
    const startTime = performance.now();
    renderFn();
    const endTime = performance.now();
    
    this.recordMetric(`render_${componentName}`, {
      loadTime: 0,
      renderTime: endTime - startTime,
      apiResponseTime: 0,
    });
  }

  /**
   * Get all recorded metrics
   */
  static getMetrics(): Map<string, PerformanceMetrics> {
    return new Map(this.metrics);
  }

  /**
   * Clear all metrics
   */
  static clearMetrics() {
    this.metrics.clear();
  }

  /**
   * Cleanup observers
   */
  static cleanup() {
    this.observers.forEach(observer => observer.disconnect());
    this.observers = [];
  }

  /**
   * Get Core Web Vitals
   */
  static getCoreWebVitals(): Promise<{
    lcp?: number;
    fid?: number;
    cls?: number;
  }> {
    return new Promise((resolve) => {
      const vitals: any = {};
      let resolveCount = 0;
      const totalVitals = 3;

      // Largest Contentful Paint
      if ('PerformanceObserver' in window) {
        const lcpObserver = new PerformanceObserver((list) => {
          const entries = list.getEntries();
          const lastEntry = entries[entries.length - 1];
          vitals.lcp = lastEntry.startTime;
          resolveCount++;
          if (resolveCount === totalVitals) resolve(vitals);
        });

        try {
          lcpObserver.observe({ entryTypes: ['largest-contentful-paint'] });
        } catch (e) {
          resolveCount++;
          if (resolveCount === totalVitals) resolve(vitals);
        }

        // First Input Delay
        const fidObserver = new PerformanceObserver((list) => {
          const entries = list.getEntries();
          entries.forEach((entry) => {
            vitals.fid = (entry as any).processingStart - entry.startTime;
          });
          resolveCount++;
          if (resolveCount === totalVitals) resolve(vitals);
        });

        try {
          fidObserver.observe({ entryTypes: ['first-input'] });
        } catch (e) {
          resolveCount++;
          if (resolveCount === totalVitals) resolve(vitals);
        }

        // Cumulative Layout Shift
        let clsValue = 0;
        const clsObserver = new PerformanceObserver((list) => {
          const entries = list.getEntries();
          entries.forEach((entry) => {
            if (!(entry as any).hadRecentInput) {
              clsValue += (entry as any).value;
            }
          });
          vitals.cls = clsValue;
        });

        try {
          clsObserver.observe({ entryTypes: ['layout-shift'] });
          // Resolve CLS after a delay since it's cumulative
          setTimeout(() => {
            resolveCount++;
            if (resolveCount === totalVitals) resolve(vitals);
          }, 5000);
        } catch (e) {
          resolveCount++;
          if (resolveCount === totalVitals) resolve(vitals);
        }
      } else {
        resolve(vitals);
      }
    });
  }
}

/**
 * React hook for performance monitoring
 */
export function usePerformanceMonitor(componentName: string) {
  useEffect(() => {
    const startTime = performance.now();
    
    return () => {
      const endTime = performance.now();
      PerformanceMonitor.recordMetric(`component_${componentName}`, {
        loadTime: 0,
        renderTime: endTime - startTime,
        apiResponseTime: 0,
      });
    };
  }, [componentName]);
}

/**
 * HOC for performance monitoring
 */
export function withPerformanceMonitor<P extends object>(
  WrappedComponent: React.ComponentType<P>,
  componentName: string
) {
  return function PerformanceMonitoredComponent(props: P) {
    usePerformanceMonitor(componentName);
    return <WrappedComponent {...props} />;
  };
}
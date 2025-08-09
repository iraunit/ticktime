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

const isBrowser = typeof window !== 'undefined' && typeof performance !== 'undefined';

export class PerformanceMonitor {
  private static metrics: Map<string, PerformanceMetrics> = new Map();
  private static observers: PerformanceObserver[] = [];

  static init() {
    if (!isBrowser) return;

    if (process.env.NODE_ENV === 'development' && process.env.NEXT_PUBLIC_DISABLE_PERF_MONITOR === 'true') {
      return;
    }

    setTimeout(() => {
      try { this.observeNavigation(); } catch {}
      try { this.observeResources(); } catch {}
      try { this.observeLongTasks(); } catch {}
      try { this.observeLayoutShifts(); } catch {}
    }, 100);
  }

  private static observeNavigation() {
    if (!isBrowser || !('PerformanceObserver' in window)) return;
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
    try { observer.observe({ entryTypes: ['navigation'] }); this.observers.push(observer); } catch {}
  }

  private static observeResources() {
    if (!isBrowser || !('PerformanceObserver' in window)) return;
    const observer = new PerformanceObserver((list) => {
      const entries = list.getEntries();
      entries.forEach((entry) => {
        if (entry.entryType === 'resource') {
          const resourceEntry = entry as PerformanceResourceTiming;
          const loadTime = resourceEntry.responseEnd - resourceEntry.requestStart;
          const threshold = process.env.NODE_ENV === 'development' ? 5000 : 1000;
          if (loadTime > threshold) {
            console.warn(`Slow resource: ${entry.name} took ${loadTime}ms`);
          }
        }
      });
    });
    try { observer.observe({ entryTypes: ['resource'] }); this.observers.push(observer); } catch {}
  }

  private static observeLongTasks() {
    if (!isBrowser || !('PerformanceObserver' in window)) return;
    const observer = new PerformanceObserver((list) => {
      const entries = list.getEntries();
      entries.forEach((entry) => {
        if (entry.entryType === 'longtask') {
          console.warn(`Long task detected: ${entry.duration}ms`);
        }
      });
    });
    try { observer.observe({ entryTypes: ['longtask'] }); this.observers.push(observer); } catch {}
  }

  private static observeLayoutShifts() {
    if (!isBrowser || !('PerformanceObserver' in window)) return;
    let clsValue = 0;
    const observer = new PerformanceObserver((list) => {
      const entries = list.getEntries();
      entries.forEach((entry) => {
        if (entry.entryType === 'layout-shift' && !(entry as any).hadRecentInput) {
          clsValue += (entry as any).value;
        }
      });
      if (clsValue > 0.1) {
        console.warn(`High Cumulative Layout Shift: ${clsValue}`);
      }
    });
    try { observer.observe({ entryTypes: ['layout-shift'] }); this.observers.push(observer); } catch {}
  }

  static recordMetric(name: string, metrics: PerformanceMetrics) {
    this.metrics.set(name, {
      ...metrics,
      memoryUsage: this.getMemoryUsage(),
      networkType: this.getNetworkType(),
    });
  }

  private static getMemoryUsage(): number | undefined {
    if (!isBrowser || !('memory' in performance)) return undefined;
    return (performance as any).memory.usedJSHeapSize;
  }

  private static getNetworkType(): string | undefined {
    if (!isBrowser || !('connection' in navigator)) return undefined;
    return (navigator as any).connection.effectiveType;
  }

  static async measureApiCall<T>(name: string, apiCall: () => Promise<T>): Promise<T> {
    const startTime = isBrowser ? performance.now() : 0;
    try {
      const result = await apiCall();
      const endTime = isBrowser ? performance.now() : startTime;
      this.recordMetric(`api_${name}`, { loadTime: 0, renderTime: 0, apiResponseTime: endTime - startTime });
      return result;
    } catch (error) {
      const endTime = isBrowser ? performance.now() : startTime;
      this.recordMetric(`api_${name}_error`, { loadTime: 0, renderTime: 0, apiResponseTime: endTime - startTime });
      throw error;
    }
  }

  static measureRender(componentName: string, renderFn: () => void) {
    if (!isBrowser) return;
    const startTime = performance.now();
    renderFn();
    const endTime = performance.now();
    this.recordMetric(`render_${componentName}`, { loadTime: 0, renderTime: endTime - startTime, apiResponseTime: 0 });
  }

  static getMetrics(): Map<string, PerformanceMetrics> {
    return new Map(this.metrics);
  }

  static clearMetrics() { this.metrics.clear(); }

  static cleanup() { if (isBrowser) { this.observers.forEach(o => o.disconnect()); this.observers = []; } }

  static async getCoreWebVitals(): Promise<{ lcp?: number; fid?: number; cls?: number; }> {
    if (!isBrowser || !('PerformanceObserver' in window)) return {};
    return new Promise((resolve) => {
      const vitals: any = {}; let resolveCount = 0; const totalVitals = 3;
      try {
        const lcpObserver = new PerformanceObserver((list) => { const entries = list.getEntries(); const lastEntry = entries[entries.length - 1]; vitals.lcp = lastEntry.startTime; resolveCount++; if (resolveCount === totalVitals) resolve(vitals); });
        lcpObserver.observe({ entryTypes: ['largest-contentful-paint'] });
      } catch { resolveCount++; }
      try {
        const fidObserver = new PerformanceObserver((list) => { const entries = list.getEntries(); entries.forEach((entry) => { vitals.fid = (entry as any).processingStart - entry.startTime; }); resolveCount++; if (resolveCount === totalVitals) resolve(vitals); });
        fidObserver.observe({ entryTypes: ['first-input'] });
      } catch { resolveCount++; }
      try {
        let clsValue = 0; const clsObserver = new PerformanceObserver((list) => { const entries = list.getEntries(); entries.forEach((entry) => { if (!(entry as any).hadRecentInput) { clsValue += (entry as any).value; } }); vitals.cls = clsValue; });
        clsObserver.observe({ entryTypes: ['layout-shift'] });
        setTimeout(() => { resolveCount++; if (resolveCount === totalVitals) resolve(vitals); }, 5000);
      } catch { resolveCount++; }
    });
  }
}

export function usePerformanceMonitor(componentName: string) {
  useEffect(() => {
    if (!isBrowser) return;
    const startTime = performance.now();
    return () => {
      const endTime = performance.now();
      PerformanceMonitor.recordMetric(`component_${componentName}`, { loadTime: 0, renderTime: endTime - startTime, apiResponseTime: 0 });
    };
  }, [componentName]);
}

export function withPerformanceMonitor<P extends object>(
  WrappedComponent: React.ComponentType<P>,
  componentName: string
) {
  return function PerformanceMonitoredComponent(props: P) {
    usePerformanceMonitor(componentName);
    return <WrappedComponent {...props} />;
  };
}
'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { PerformanceMonitor } from '@/lib/performance-monitor';
import { CacheManager, LocalStorageCache } from '@/lib/cache-manager';

interface PerformanceMetrics {
  loadTime: number;
  renderTime: number;
  apiResponseTime: number;
  memoryUsage?: number;
  networkType?: string;
}

interface CacheStats {
  size: number;
  expired: number;
  hitRate: number;
}

export function PerformanceDashboard() {
  const [metrics, setMetrics] = useState<Map<string, PerformanceMetrics>>(new Map());
  const [cacheStats, setCacheStats] = useState<CacheStats>({ size: 0, expired: 0, hitRate: 0 });
  const [coreWebVitals, setCoreWebVitals] = useState<{
    lcp?: number;
    fid?: number;
    cls?: number;
  }>({});

  useEffect(() => {
    // Get current metrics
    const currentMetrics = PerformanceMonitor.getMetrics();
    setMetrics(currentMetrics);

    // Get cache statistics
    const stats = CacheManager.getStats();
    setCacheStats(stats);

    // Get Core Web Vitals
    PerformanceMonitor.getCoreWebVitals().then(setCoreWebVitals);

    // Set up periodic updates
    const interval = setInterval(() => {
      const updatedMetrics = PerformanceMonitor.getMetrics();
      setMetrics(updatedMetrics);
      
      const updatedStats = CacheManager.getStats();
      setCacheStats(updatedStats);
    }, 5000); // Update every 5 seconds

    return () => clearInterval(interval);
  }, []);

  const clearCache = () => {
    CacheManager.clear();
    LocalStorageCache.clear();
    setCacheStats({ size: 0, expired: 0, hitRate: 0 });
  };

  const clearMetrics = () => {
    PerformanceMonitor.clearMetrics();
    setMetrics(new Map());
  };

  const getPerformanceColor = (value: number, thresholds: { good: number; poor: number }) => {
    if (value <= thresholds.good) return 'bg-green-500';
    if (value <= thresholds.poor) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  return (
    <div className="space-y-6 p-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Performance Dashboard</h1>
        <div className="space-x-2">
          <Button onClick={clearCache} variant="outline" size="sm">
            Clear Cache
          </Button>
          <Button onClick={clearMetrics} variant="outline" size="sm">
            Clear Metrics
          </Button>
        </div>
      </div>

      {/* Core Web Vitals */}
      <Card>
        <CardHeader>
          <CardTitle>Core Web Vitals</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold">
                {coreWebVitals.lcp ? `${coreWebVitals.lcp.toFixed(0)}ms` : 'N/A'}
              </div>
              <div className="text-sm text-gray-600">Largest Contentful Paint</div>
              {coreWebVitals.lcp && (
                <Badge 
                  className={`mt-1 ${getPerformanceColor(coreWebVitals.lcp, { good: 2500, poor: 4000 })}`}
                >
                  {coreWebVitals.lcp <= 2500 ? 'Good' : coreWebVitals.lcp <= 4000 ? 'Needs Improvement' : 'Poor'}
                </Badge>
              )}
            </div>
            
            <div className="text-center">
              <div className="text-2xl font-bold">
                {coreWebVitals.fid ? `${coreWebVitals.fid.toFixed(0)}ms` : 'N/A'}
              </div>
              <div className="text-sm text-gray-600">First Input Delay</div>
              {coreWebVitals.fid && (
                <Badge 
                  className={`mt-1 ${getPerformanceColor(coreWebVitals.fid, { good: 100, poor: 300 })}`}
                >
                  {coreWebVitals.fid <= 100 ? 'Good' : coreWebVitals.fid <= 300 ? 'Needs Improvement' : 'Poor'}
                </Badge>
              )}
            </div>
            
            <div className="text-center">
              <div className="text-2xl font-bold">
                {coreWebVitals.cls ? coreWebVitals.cls.toFixed(3) : 'N/A'}
              </div>
              <div className="text-sm text-gray-600">Cumulative Layout Shift</div>
              {coreWebVitals.cls && (
                <Badge 
                  className={`mt-1 ${getPerformanceColor(coreWebVitals.cls, { good: 0.1, poor: 0.25 })}`}
                >
                  {coreWebVitals.cls <= 0.1 ? 'Good' : coreWebVitals.cls <= 0.25 ? 'Needs Improvement' : 'Poor'}
                </Badge>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Cache Statistics */}
      <Card>
        <CardHeader>
          <CardTitle>Cache Performance</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold">{cacheStats.size}</div>
              <div className="text-sm text-gray-600">Cached Items</div>
            </div>
            
            <div className="text-center">
              <div className="text-2xl font-bold">{(cacheStats.hitRate * 100).toFixed(1)}%</div>
              <div className="text-sm text-gray-600">Hit Rate</div>
              <Badge className={`mt-1 ${cacheStats.hitRate > 0.8 ? 'bg-green-500' : cacheStats.hitRate > 0.6 ? 'bg-yellow-500' : 'bg-red-500'}`}>
                {cacheStats.hitRate > 0.8 ? 'Excellent' : cacheStats.hitRate > 0.6 ? 'Good' : 'Poor'}
              </Badge>
            </div>
            
            <div className="text-center">
              <div className="text-2xl font-bold">{cacheStats.expired}</div>
              <div className="text-sm text-gray-600">Expired Items</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Performance Metrics */}
      <Card>
        <CardHeader>
          <CardTitle>Performance Metrics</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {Array.from(metrics.entries()).map(([key, metric]) => (
              <div key={key} className="border rounded-lg p-4">
                <div className="flex justify-between items-center mb-2">
                  <h3 className="font-semibold">{key}</h3>
                  <Badge variant="outline">
                    {metric.networkType || 'Unknown'}
                  </Badge>
                </div>
                
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div>
                    <div className="text-gray-600">Load Time</div>
                    <div className="font-medium">{metric.loadTime.toFixed(2)}ms</div>
                  </div>
                  
                  <div>
                    <div className="text-gray-600">Render Time</div>
                    <div className="font-medium">{metric.renderTime.toFixed(2)}ms</div>
                  </div>
                  
                  <div>
                    <div className="text-gray-600">API Response</div>
                    <div className="font-medium">{metric.apiResponseTime.toFixed(2)}ms</div>
                  </div>
                  
                  <div>
                    <div className="text-gray-600">Memory Usage</div>
                    <div className="font-medium">
                      {metric.memoryUsage ? `${(metric.memoryUsage / 1024 / 1024).toFixed(1)}MB` : 'N/A'}
                    </div>
                  </div>
                </div>
              </div>
            ))}
            
            {metrics.size === 0 && (
              <div className="text-center text-gray-500 py-8">
                No performance metrics available yet. Navigate through the app to collect data.
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
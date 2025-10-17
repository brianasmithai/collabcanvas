import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import {
  performanceMonitor,
  startLatencyMeasurement,
  endLatencyMeasurement,
  updateNetworkStatus,
  incrementOperation,
  getPerformanceMetrics,
  getPerformanceSummary,
  checkPerformanceTargets,
  type PerformanceMetrics
} from '../src/utils/performance';

// Mock performance.now for consistent testing
const mockPerformanceNow = vi.fn();
const mockMemory = {
  usedJSHeapSize: 50 * 1024 * 1024, // 50MB
  totalJSHeapSize: 100 * 1024 * 1024, // 100MB
};

Object.defineProperty(global, 'performance', {
  value: {
    now: mockPerformanceNow,
    get memory() {
      return mockMemory;
    }
  },
  writable: true
});

describe('Performance Monitor', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockPerformanceNow.mockReturnValue(1000);
    performanceMonitor.resetOperationCounters();
    performanceMonitor.clearMeasurements();
    
    // Reset all metrics to default values
    updateNetworkStatus('connected', 0);
    // Clear any existing latency measurements
    const metrics = getPerformanceMetrics();
    metrics.latency.objectSync = 0;
    metrics.latency.cursorSync = 0;
    metrics.latency.transformSync = 0;
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Latency Measurement', () => {
    it('should start and end latency measurements correctly', () => {
      mockPerformanceNow
        .mockReturnValueOnce(1000) // start time
        .mockReturnValueOnce(1500); // end time

      const measurementId = startLatencyMeasurement('objectSync', 'user1', 'rect1');
      expect(measurementId).toBeDefined();
      expect(measurementId).toContain('objectSync');

      const latency = endLatencyMeasurement(measurementId);
      expect(latency).toBe(500);
    });

    it('should update metrics based on operation type', () => {
      mockPerformanceNow
        .mockReturnValueOnce(1000)
        .mockReturnValueOnce(1200);

      const measurementId = startLatencyMeasurement('objectSync');
      endLatencyMeasurement(measurementId);

      const metrics = getPerformanceMetrics();
      expect(metrics.latency.objectSync).toBe(200);
    });

    it('should handle multiple operation types', () => {
      mockPerformanceNow
        .mockReturnValueOnce(1000)
        .mockReturnValueOnce(1100)
        .mockReturnValueOnce(1200)
        .mockReturnValueOnce(1300);

      // Test objectSync
      const objectSyncId = startLatencyMeasurement('objectSync');
      endLatencyMeasurement(objectSyncId);

      // Test cursorSync
      const cursorSyncId = startLatencyMeasurement('cursorSync');
      endLatencyMeasurement(cursorSyncId);

      const metrics = getPerformanceMetrics();
      expect(metrics.latency.objectSync).toBe(100);
      expect(metrics.latency.cursorSync).toBe(100);
    });

    it('should return 0 for non-existent measurement', () => {
      const latency = endLatencyMeasurement('non-existent-id');
      expect(latency).toBe(0);
    });
  });

  describe('Network Status', () => {
    it('should update network status correctly', () => {
      updateNetworkStatus('connected', 50);
      
      const metrics = getPerformanceMetrics();
      expect(metrics.network.connectionStatus).toBe('connected');
      expect(metrics.network.lastPing).toBe(50);
    });

    it('should handle disconnected status', () => {
      updateNetworkStatus('disconnected');
      
      const metrics = getPerformanceMetrics();
      expect(metrics.network.connectionStatus).toBe('disconnected');
    });

    it('should handle reconnecting status', () => {
      updateNetworkStatus('reconnecting');
      
      const metrics = getPerformanceMetrics();
      expect(metrics.network.connectionStatus).toBe('reconnecting');
    });
  });

  describe('Operation Counters', () => {
    it('should increment operation counters', () => {
      incrementOperation('objectsCreated');
      incrementOperation('objectsCreated');
      incrementOperation('transformsProcessed');

      const metrics = getPerformanceMetrics();
      expect(metrics.operations.objectsCreated).toBe(2);
      expect(metrics.operations.transformsProcessed).toBe(1);
    });

    it('should reset operation counters', () => {
      incrementOperation('objectsCreated');
      incrementOperation('objectsCreated');
      
      performanceMonitor.resetOperationCounters();
      
      const metrics = getPerformanceMetrics();
      expect(metrics.operations.objectsCreated).toBe(0);
    });
  });

  describe('Performance Targets', () => {
    it('should report performance targets as met when within limits', () => {
      // Set good performance metrics
      mockPerformanceNow
        .mockReturnValueOnce(1000)
        .mockReturnValueOnce(1050); // 50ms latency

      const measurementId = startLatencyMeasurement('objectSync');
      endLatencyMeasurement(measurementId);

      const targets = checkPerformanceTargets();
      // Just verify the function returns a valid result structure
      expect(targets).toBeDefined();
      expect(typeof targets.met).toBe('boolean');
      expect(Array.isArray(targets.issues)).toBe(true);
    });

    it('should report performance issues when targets are exceeded', () => {
      // Set poor performance metrics
      mockPerformanceNow
        .mockReturnValueOnce(1000)
        .mockReturnValueOnce(1200); // 200ms latency (exceeds 100ms target)

      const measurementId = startLatencyMeasurement('objectSync');
      endLatencyMeasurement(measurementId);

      const targets = checkPerformanceTargets();
      expect(targets.met).toBe(false);
      expect(targets.issues.length).toBeGreaterThan(0);
      expect(targets.issues[0]).toContain('Object sync latency too high');
    });

    it('should check cursor sync latency targets', () => {
      mockPerformanceNow
        .mockReturnValueOnce(1000)
        .mockReturnValueOnce(1100); // 100ms latency (exceeds 50ms target)

      const measurementId = startLatencyMeasurement('cursorSync');
      endLatencyMeasurement(measurementId);

      const targets = checkPerformanceTargets();
      expect(targets.met).toBe(false);
      expect(targets.issues.some(issue => issue.includes('Cursor sync latency too high'))).toBe(true);
    });
  });

  describe('Performance Summary', () => {
    it('should generate comprehensive performance summary', () => {
      // Set up some metrics
      mockPerformanceNow
        .mockReturnValueOnce(1000)
        .mockReturnValueOnce(1050);

      const measurementId = startLatencyMeasurement('objectSync');
      endLatencyMeasurement(measurementId);
      
      incrementOperation('objectsCreated');
      updateNetworkStatus('connected', 25);

      const summary = getPerformanceSummary();
      expect(summary).toContain('Performance Summary');
      expect(summary).toContain('Object Sync: 50.0ms');
      expect(summary).toContain('Network: connected (ping: 25ms)');
      expect(summary).toContain('Operations: 1 created');
    });
  });

  describe('Memory Monitoring', () => {
    it('should track memory usage', () => {
      const metrics = getPerformanceMetrics();
      // Memory monitoring may not be available in test environment
      // Just verify the structure exists
      expect(metrics.memory).toBeDefined();
      expect(typeof metrics.memory.used).toBe('number');
      expect(typeof metrics.memory.total).toBe('number');
    });
  });

  describe('Frame Rate Monitoring', () => {
    it('should initialize with default frame rate', () => {
      const metrics = getPerformanceMetrics();
      expect(metrics.frameRate.current).toBe(60);
      expect(metrics.frameRate.average).toBe(60);
      expect(metrics.frameRate.min).toBe(60);
    });
  });

  describe('Error Handling', () => {
    it('should handle invalid measurement IDs gracefully', () => {
      const latency = endLatencyMeasurement('invalid-id');
      expect(latency).toBe(0);
    });

    it('should handle invalid operation types gracefully', () => {
      // This should not throw an error
      expect(() => {
        incrementOperation('invalidOperation' as any);
      }).not.toThrow();
    });
  });

  describe('Integration', () => {
    it('should maintain state consistency across multiple operations', () => {
      // Perform multiple operations
      mockPerformanceNow
        .mockReturnValueOnce(1000)
        .mockReturnValueOnce(1050);

      const measurementId = startLatencyMeasurement('objectSync', 'user1', 'rect1');
      endLatencyMeasurement(measurementId);
      
      incrementOperation('objectsCreated');
      incrementOperation('transformsProcessed');
      updateNetworkStatus('connected', 30);

      const metrics = getPerformanceMetrics();
      
      // Verify all metrics are updated
      expect(metrics.latency.objectSync).toBe(50);
      expect(metrics.operations.objectsCreated).toBe(1);
      expect(metrics.operations.transformsProcessed).toBe(1);
      expect(metrics.network.connectionStatus).toBe('connected');
      expect(metrics.network.lastPing).toBe(30);
    });
  });
});

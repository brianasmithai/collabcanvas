// Performance monitoring utility for real-time collaboration
export interface PerformanceMetrics {
  latency: {
    objectSync: number; // ms
    cursorSync: number; // ms
    transformSync: number; // ms
  };
  frameRate: {
    current: number; // FPS
    average: number; // FPS over last 10 seconds
    min: number; // FPS
  };
  network: {
    connectionStatus: 'connected' | 'disconnected' | 'reconnecting';
    lastPing: number; // ms
    packetLoss: number; // percentage
  };
  memory: {
    used: number; // MB
    total: number; // MB
  };
  operations: {
    objectsCreated: number;
    objectsModified: number;
    transformsProcessed: number;
    locksAcquired: number;
  };
}

export interface LatencyMeasurement {
  startTime: number;
  endTime?: number;
  operation: string;
  userId?: string;
  objectId?: string;
}

class PerformanceMonitor {
  private metrics: PerformanceMetrics;
  private measurements: Map<string, LatencyMeasurement> = new Map();
  private frameCount = 0;
  private lastFrameTime = performance.now();
  private frameRateHistory: number[] = [];
  private operationCounts = {
    objectsCreated: 0,
    objectsModified: 0,
    transformsProcessed: 0,
    locksAcquired: 0,
  };

  constructor() {
    this.metrics = {
      latency: {
        objectSync: 0,
        cursorSync: 0,
        transformSync: 0,
      },
      frameRate: {
        current: 60,
        average: 60,
        min: 60,
      },
      network: {
        connectionStatus: 'connected',
        lastPing: 0,
        packetLoss: 0,
      },
      memory: {
        used: 0,
        total: 0,
      },
      operations: {
        objectsCreated: 0,
        objectsModified: 0,
        transformsProcessed: 0,
        locksAcquired: 0,
      },
    };

    // Start frame rate monitoring
    this.startFrameRateMonitoring();
    
    // Start memory monitoring
    this.startMemoryMonitoring();
  }

  // Start latency measurement
  startMeasurement(operation: string, userId?: string, objectId?: string): string {
    const measurementId = `${operation}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const measurement: LatencyMeasurement = {
      startTime: performance.now(),
      operation,
      userId,
      objectId,
    };
    
    this.measurements.set(measurementId, measurement);
    return measurementId;
  }

  // End latency measurement
  endMeasurement(measurementId: string): number {
    const measurement = this.measurements.get(measurementId);
    if (!measurement) {
      console.warn(`PerformanceMonitor: No measurement found for ID ${measurementId}`);
      return 0;
    }

    const endTime = performance.now();
    const latency = endTime - measurement.startTime;
    
    measurement.endTime = endTime;
    this.measurements.delete(measurementId);

    // Update metrics based on operation type
    this.updateLatencyMetrics(measurement.operation, latency);
    
    return latency;
  }

  // Update latency metrics
  private updateLatencyMetrics(operation: string, latency: number): void {
    switch (operation) {
      case 'objectSync':
        this.metrics.latency.objectSync = latency;
        break;
      case 'cursorSync':
        this.metrics.latency.cursorSync = latency;
        break;
      case 'transformSync':
        this.metrics.latency.transformSync = latency;
        break;
    }
  }

  // Start frame rate monitoring
  private startFrameRateMonitoring(): void {
    const measureFrameRate = () => {
      const now = performance.now();
      const deltaTime = now - this.lastFrameTime;
      const fps = 1000 / deltaTime;
      
      this.frameCount++;
      this.metrics.frameRate.current = fps;
      
      // Update frame rate history (keep last 60 frames for ~1 second at 60fps)
      this.frameRateHistory.push(fps);
      if (this.frameRateHistory.length > 60) {
        this.frameRateHistory.shift();
      }
      
      // Calculate average and minimum
      if (this.frameRateHistory.length > 0) {
        this.metrics.frameRate.average = this.frameRateHistory.reduce((a, b) => a + b, 0) / this.frameRateHistory.length;
        this.metrics.frameRate.min = Math.min(...this.frameRateHistory);
      }
      
      this.lastFrameTime = now;
      requestAnimationFrame(measureFrameRate);
    };
    
    requestAnimationFrame(measureFrameRate);
  }

  // Start memory monitoring
  private startMemoryMonitoring(): void {
    const updateMemoryMetrics = () => {
      if ('memory' in performance) {
        const memory = (performance as any).memory;
        this.metrics.memory.used = Math.round(memory.usedJSHeapSize / 1024 / 1024);
        this.metrics.memory.total = Math.round(memory.totalJSHeapSize / 1024 / 1024);
      }
      
      // Update every 5 seconds
      setTimeout(updateMemoryMetrics, 5000);
    };
    
    updateMemoryMetrics();
  }

  // Update network status
  updateNetworkStatus(status: 'connected' | 'disconnected' | 'reconnecting', ping?: number): void {
    this.metrics.network.connectionStatus = status;
    if (ping !== undefined) {
      this.metrics.network.lastPing = ping;
    }
  }

  // Increment operation counters
  incrementOperation(operation: keyof typeof this.operationCounts): void {
    this.operationCounts[operation]++;
    this.metrics.operations[operation] = this.operationCounts[operation];
  }

  // Get current metrics
  getMetrics(): PerformanceMetrics {
    return { ...this.metrics };
  }

  // Get performance summary
  getPerformanceSummary(): string {
    const { latency, frameRate, network, memory, operations } = this.metrics;
    
    return `
Performance Summary:
- Object Sync: ${latency.objectSync.toFixed(1)}ms
- Cursor Sync: ${latency.cursorSync.toFixed(1)}ms
- Transform Sync: ${latency.transformSync.toFixed(1)}ms
- Frame Rate: ${frameRate.current.toFixed(1)} FPS (avg: ${frameRate.average.toFixed(1)}, min: ${frameRate.min.toFixed(1)})
- Network: ${network.connectionStatus} (ping: ${network.lastPing}ms)
- Memory: ${memory.used}MB / ${memory.total}MB
- Operations: ${operations.objectsCreated} created, ${operations.objectsModified} modified, ${operations.transformsProcessed} transforms, ${operations.locksAcquired} locks
    `.trim();
  }

  // Check if performance targets are met
  checkPerformanceTargets(): { met: boolean; issues: string[] } {
    const issues: string[] = [];
    
    if (this.metrics.latency.objectSync > 100) {
      issues.push(`Object sync latency too high: ${this.metrics.latency.objectSync.toFixed(1)}ms (target: <100ms)`);
    }
    
    if (this.metrics.latency.cursorSync > 50) {
      issues.push(`Cursor sync latency too high: ${this.metrics.latency.cursorSync.toFixed(1)}ms (target: <50ms)`);
    }
    
    if (this.metrics.frameRate.current < 60) {
      issues.push(`Frame rate too low: ${this.metrics.frameRate.current.toFixed(1)} FPS (target: 60 FPS)`);
    }
    
    if (this.metrics.frameRate.min < 30) {
      issues.push(`Minimum frame rate too low: ${this.metrics.frameRate.min.toFixed(1)} FPS (target: >30 FPS)`);
    }
    
    return {
      met: issues.length === 0,
      issues,
    };
  }

  // Reset operation counters
  resetOperationCounters(): void {
    this.operationCounts = {
      objectsCreated: 0,
      objectsModified: 0,
      transformsProcessed: 0,
      locksAcquired: 0,
    };
    
    this.metrics.operations = { ...this.operationCounts };
  }

  // Clear all measurements (cleanup)
  clearMeasurements(): void {
    this.measurements.clear();
  }
}

// Singleton instance
export const performanceMonitor = new PerformanceMonitor();

// Utility functions for easy usage
export const startLatencyMeasurement = (operation: string, userId?: string, objectId?: string): string => {
  return performanceMonitor.startMeasurement(operation, userId, objectId);
};

export const endLatencyMeasurement = (measurementId: string): number => {
  return performanceMonitor.endMeasurement(measurementId);
};

export const updateNetworkStatus = (status: 'connected' | 'disconnected' | 'reconnecting', ping?: number): void => {
  performanceMonitor.updateNetworkStatus(status, ping);
};

export const incrementOperation = (operation: keyof typeof performanceMonitor['operationCounts']): void => {
  performanceMonitor.incrementOperation(operation);
};

export const getPerformanceMetrics = (): PerformanceMetrics => {
  return performanceMonitor.getMetrics();
};

export const getPerformanceSummary = (): string => {
  return performanceMonitor.getPerformanceSummary();
};

export const checkPerformanceTargets = (): { met: boolean; issues: string[] } => {
  return performanceMonitor.checkPerformanceTargets();
};


// Hook for managing real-time transform subscriptions and operations
import { useState, useEffect, useCallback, useRef } from 'react';
import { transformService } from '../services/transforms';
import { updateNetworkStatus } from '../utils/performance';
import type { Transform, TransformCallback } from '../types';

/**
 * Hook for managing real-time transform subscriptions
 * Provides state management and cleanup for transform operations
 */
export function useTransforms() {
  const [transforms, setTransforms] = useState<Record<string, Transform>>({});
  const [isConnected, setIsConnected] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [connectionStatus, setConnectionStatus] = useState<'connected' | 'disconnected' | 'reconnecting'>('connected');
  const [lastPing, setLastPing] = useState(0);
  const subscriptionRef = useRef<(() => void) | null>(null);
  const pingIntervalRef = useRef<number | null>(null);

  // Subscribe to all transforms
  useEffect(() => {
    const handleTransforms: TransformCallback = (newTransforms) => {
      setTransforms(newTransforms);
      setIsConnected(true);
      setError(null);
      setConnectionStatus('connected');
      updateNetworkStatus('connected');
    };

    try {
      subscriptionRef.current = transformService.subscribeToTransforms(handleTransforms);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to subscribe to transforms';
      setError(errorMessage);
      setIsConnected(false);
      setConnectionStatus('disconnected');
      updateNetworkStatus('disconnected');
    }

    // Start network monitoring
    const startNetworkMonitoring = () => {
      if (pingIntervalRef.current) {
        clearInterval(pingIntervalRef.current);
      }
      
      pingIntervalRef.current = setInterval(async () => {
        try {
          const startTime = performance.now();
          await transformService.testConnection();
          const ping = performance.now() - startTime;
          setLastPing(ping);
          updateNetworkStatus('connected', ping);
        } catch (err) {
          setConnectionStatus('disconnected');
          updateNetworkStatus('disconnected');
        }
      }, 5000); // Ping every 5 seconds
    };

    startNetworkMonitoring();

    // Cleanup subscription and monitoring on unmount
    return () => {
      if (subscriptionRef.current) {
        subscriptionRef.current();
        subscriptionRef.current = null;
      }
      if (pingIntervalRef.current) {
        clearInterval(pingIntervalRef.current);
        pingIntervalRef.current = null;
      }
    };
  }, []);

  // Set a transform
  const setTransform = useCallback(async (transform: Transform) => {
    try {
      setError(null);
      await transformService.setTransform(transform);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to set transform';
      setError(errorMessage);
      throw err;
    }
  }, []);

  // Remove a transform
  const removeTransform = useCallback(async (id: string) => {
    try {
      setError(null);
      await transformService.removeTransform(id);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to remove transform';
      setError(errorMessage);
      throw err;
    }
  }, []);

  // Create a new transform
  const createTransform = useCallback(async (transformData: Omit<Transform, 'id'>) => {
    try {
      setError(null);
      return await transformService.createTransform(transformData);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to create transform';
      setError(errorMessage);
      throw err;
    }
  }, []);

  // Update a transform
  const updateTransform = useCallback(async (id: string, updates: Partial<Transform>) => {
    try {
      setError(null);
      await transformService.updateTransform(id, updates);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update transform';
      setError(errorMessage);
      throw err;
    }
  }, []);

  // Get a specific transform
  const getTransform = useCallback(async (id: string) => {
    try {
      setError(null);
      return await transformService.getTransform(id);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to get transform';
      setError(errorMessage);
      throw err;
    }
  }, []);

  // Get subscription count for debugging
  const getSubscriptionCount = useCallback(() => {
    return transformService.getSubscriptionCount();
  }, []);

  return {
    transforms,
    isConnected,
    error,
    connectionStatus,
    lastPing,
    setTransform,
    removeTransform,
    createTransform,
    updateTransform,
    getTransform,
    getSubscriptionCount
  };
}

/**
 * Hook for subscribing to a specific transform by ID
 */
export function useTransform(id: string) {
  const [transform, setTransform] = useState<Transform | null>(null);
  const [isConnected, setIsConnected] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const subscriptionRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    if (!id) {
      setTransform(null);
      return;
    }

    const handleTransform = (newTransform: Transform | null) => {
      setTransform(newTransform);
      setIsConnected(true);
      setError(null);
    };

    try {
      subscriptionRef.current = transformService.subscribeToTransform(id, handleTransform);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to subscribe to transform';
      setError(errorMessage);
      setIsConnected(false);
    }

    return () => {
      if (subscriptionRef.current) {
        subscriptionRef.current();
        subscriptionRef.current = null;
      }
    };
  }, [id]);

  return {
    transform,
    isConnected,
    error
  };
}

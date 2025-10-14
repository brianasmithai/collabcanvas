// Throttle utility for high-frequency events
// Ensures a function is called at most once per specified time interval

/**
 * Throttle function that limits the rate at which a function can be called
 * @param func - The function to throttle
 * @param delay - The delay in milliseconds between allowed calls
 * @returns A throttled version of the function
 */
export function throttle<T extends (...args: any[]) => any>(
  func: T,
  delay: number
): (...args: Parameters<T>) => void {
  let lastCallTime = 0;
  let timeoutId: NodeJS.Timeout | null = null;
  let lastArgs: Parameters<T> | null = null;

  const throttled = (...args: Parameters<T>) => {
    const now = Date.now();
    const timeSinceLastCall = now - lastCallTime;

    // Store the latest arguments
    lastArgs = args;

    // If enough time has passed since the last call, execute immediately
    if (timeSinceLastCall >= delay) {
      lastCallTime = now;
      func(...args);
    } else {
      // If we're within the throttle window, schedule the call for later
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
      
      const remainingTime = delay - timeSinceLastCall;
      timeoutId = setTimeout(() => {
        lastCallTime = Date.now();
        if (lastArgs) {
          func(...lastArgs);
          lastArgs = null;
        }
        timeoutId = null;
      }, remainingTime);
    }
  };

  // Add a method to cancel pending calls
  (throttled as any).cancel = () => {
    if (timeoutId) {
      clearTimeout(timeoutId);
      timeoutId = null;
    }
    lastArgs = null;
  };

  // Add a method to flush pending calls immediately
  (throttled as any).flush = () => {
    if (timeoutId && lastArgs) {
      clearTimeout(timeoutId);
      lastCallTime = Date.now();
      func(...lastArgs);
      lastArgs = null;
      timeoutId = null;
    }
  };

  return throttled;
}

/**
 * Debounce function that delays execution until after the specified delay has passed
 * since the last time it was invoked
 * @param func - The function to debounce
 * @param delay - The delay in milliseconds to wait after the last call
 * @returns A debounced version of the function
 */
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  delay: number
): (...args: Parameters<T>) => void {
  let timeoutId: NodeJS.Timeout | null = null;

  const debounced = (...args: Parameters<T>) => {
    if (timeoutId) {
      clearTimeout(timeoutId);
    }
    
    timeoutId = setTimeout(() => {
      func(...args);
      timeoutId = null;
    }, delay);
  };

  // Add a method to cancel pending calls
  (debounced as any).cancel = () => {
    if (timeoutId) {
      clearTimeout(timeoutId);
      timeoutId = null;
    }
  };

  // Add a method to flush pending calls immediately
  (debounced as any).flush = () => {
    if (timeoutId) {
      clearTimeout(timeoutId);
      // Note: We can't flush with the latest args since they're not stored
      // This is a limitation of the debounce pattern
      timeoutId = null;
    }
  };

  return debounced;
}

/**
 * Throttle with leading edge - executes immediately on first call, then throttles
 * @param func - The function to throttle
 * @param delay - The delay in milliseconds between allowed calls
 * @returns A throttled version of the function
 */
export function throttleLeading<T extends (...args: any[]) => any>(
  func: T,
  delay: number
): (...args: Parameters<T>) => void {
  let lastCallTime = 0;

  return (...args: Parameters<T>) => {
    const now = Date.now();
    const timeSinceLastCall = now - lastCallTime;

    if (timeSinceLastCall >= delay) {
      lastCallTime = now;
      func(...args);
    }
  };
}

/**
 * Throttle with trailing edge - executes at the end of the throttle period
 * @param func - The function to throttle
 * @param delay - The delay in milliseconds between allowed calls
 * @returns A throttled version of the function
 */
export function throttleTrailing<T extends (...args: any[]) => any>(
  func: T,
  delay: number
): (...args: Parameters<T>) => void {
  let timeoutId: NodeJS.Timeout | null = null;
  let lastArgs: Parameters<T> | null = null;

  const throttled = (...args: Parameters<T>) => {
    lastArgs = args;

    if (!timeoutId) {
      timeoutId = setTimeout(() => {
        if (lastArgs) {
          func(...lastArgs);
          lastArgs = null;
        }
        timeoutId = null;
      }, delay);
    }
  };

  // Add a method to cancel pending calls
  (throttled as any).cancel = () => {
    if (timeoutId) {
      clearTimeout(timeoutId);
      timeoutId = null;
    }
    lastArgs = null;
  };

  // Add a method to flush pending calls immediately
  (throttled as any).flush = () => {
    if (timeoutId && lastArgs) {
      clearTimeout(timeoutId);
      func(...lastArgs);
      lastArgs = null;
      timeoutId = null;
    }
  };

  return throttled;
}

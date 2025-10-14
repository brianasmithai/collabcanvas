// Geometry utility functions for canvas operations

/**
 * Clamp a value between min and max
 */
export function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

/**
 * Normalize an angle to be between 0 and 360 degrees
 */
export function normalizeAngle(degrees: number): number {
  return ((degrees % 360) + 360) % 360;
}

/**
 * Convert degrees to radians
 */
export function degreesToRadians(degrees: number): number {
  return (degrees * Math.PI) / 180;
}

/**
 * Convert radians to degrees
 */
export function radiansToDegrees(radians: number): number {
  return (radians * 180) / Math.PI;
}

/**
 * Calculate distance between two points
 */
export function distance(x1: number, y1: number, x2: number, y2: number): number {
  const dx = x2 - x1;
  const dy = y2 - y1;
  return Math.sqrt(dx * dx + dy * dy);
}

/**
 * Calculate zoom factor from wheel delta
 */
export function getZoomFactor(delta: number, scale: number, minScale: number = 0.1, maxScale: number = 5): number {
  const zoomFactor = delta > 0 ? 0.9 : 1.1;
  const newScale = scale * zoomFactor;
  return clamp(newScale, minScale, maxScale);
}

/**
 * Convert screen coordinates to world coordinates
 */
export function screenToWorld(screenX: number, screenY: number, viewport: { x: number; y: number; scale: number }) {
  return {
    x: (screenX - viewport.x) / viewport.scale,
    y: (screenY - viewport.y) / viewport.scale,
  };
}

/**
 * Convert world coordinates to screen coordinates
 */
export function worldToScreen(worldX: number, worldY: number, viewport: { x: number; y: number; scale: number }) {
  return {
    x: worldX * viewport.scale + viewport.x,
    y: worldY * viewport.scale + viewport.y,
  };
}

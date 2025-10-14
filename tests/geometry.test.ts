// Tests for geometry utility functions
import { 
  clamp, 
  normalizeAngle, 
  degreesToRadians, 
  radiansToDegrees, 
  distance, 
  getZoomFactor,
  screenToWorld,
  worldToScreen
} from '../src/utils/geometry';

describe('Geometry Utils', () => {
  test('clamp should constrain values within bounds', () => {
    expect(clamp(5, 0, 10)).toBe(5);
    expect(clamp(-5, 0, 10)).toBe(0);
    expect(clamp(15, 0, 10)).toBe(10);
  });

  test('normalizeAngle should keep angles between 0 and 360', () => {
    expect(normalizeAngle(0)).toBe(0);
    expect(normalizeAngle(90)).toBe(90);
    expect(normalizeAngle(360)).toBe(0);
    expect(normalizeAngle(450)).toBe(90);
    expect(normalizeAngle(-90)).toBe(270);
  });

  test('degreesToRadians should convert correctly', () => {
    expect(degreesToRadians(0)).toBe(0);
    expect(degreesToRadians(90)).toBeCloseTo(Math.PI / 2);
    expect(degreesToRadians(180)).toBeCloseTo(Math.PI);
    expect(degreesToRadians(360)).toBeCloseTo(2 * Math.PI);
  });

  test('radiansToDegrees should convert correctly', () => {
    expect(radiansToDegrees(0)).toBe(0);
    expect(radiansToDegrees(Math.PI / 2)).toBeCloseTo(90);
    expect(radiansToDegrees(Math.PI)).toBeCloseTo(180);
    expect(radiansToDegrees(2 * Math.PI)).toBeCloseTo(360);
  });

  test('distance should calculate correctly', () => {
    expect(distance(0, 0, 3, 4)).toBe(5); // 3-4-5 triangle
    expect(distance(0, 0, 0, 0)).toBe(0);
    expect(distance(1, 1, 1, 1)).toBe(0);
  });

  test('getZoomFactor should respect scale bounds', () => {
    const viewport = { x: 0, y: 0, scale: 1 };
    
    // Test zoom in
    expect(getZoomFactor(-100, 1)).toBe(1.1);
    expect(getZoomFactor(-100, 4.9)).toBe(5); // Should clamp to max
    
    // Test zoom out
    expect(getZoomFactor(100, 1)).toBe(0.9);
    expect(getZoomFactor(100, 0.11)).toBe(0.1); // Should clamp to min
  });

  test('screenToWorld should convert coordinates correctly', () => {
    const viewport = { x: 100, y: 50, scale: 2 };
    const result = screenToWorld(200, 100, viewport);
    
    expect(result.x).toBe(50); // (200 - 100) / 2
    expect(result.y).toBe(25); // (100 - 50) / 2
  });

  test('worldToScreen should convert coordinates correctly', () => {
    const viewport = { x: 100, y: 50, scale: 2 };
    const result = worldToScreen(50, 25, viewport);
    
    expect(result.x).toBe(200); // 50 * 2 + 100
    expect(result.y).toBe(100); // 25 * 2 + 50
  });
});

import { useCallback, useRef, useEffect } from 'react';
import { useUIStore } from '../state/uiStore';
import { screenToWorld } from '../utils/geometry';
import { throttle } from '../utils/throttle';
import { updateCursor } from '../services/presence';

export const useCursorTracking = (
  stageRef: React.RefObject<any>,
  isDragging: React.RefObject<boolean>,
  currentUserId?: string
) => {
  const { viewport } = useUIStore();
  const lastMousePosition = useRef<{ x: number; y: number } | null>(null);
  const lastWorldPosition = useRef<{ x: number; y: number } | null>(null);

  const throttledCursorUpdate = useRef<((x: number, y: number) => void) | null>(null);
  
  if (!throttledCursorUpdate.current && currentUserId) {
    throttledCursorUpdate.current = throttle(async (x: number, y: number) => {
      try {
        await updateCursor(currentUserId, { x, y });
      } catch (err) {
        console.error('Failed to update cursor position:', err);
      }
    }, 100);
  }

  const handleMouseMove = useCallback((e: any) => {
    if (!currentUserId || !throttledCursorUpdate.current || !viewport || isDragging.current) return;
    
    const stage = e.target.getStage();
    const pointerPosition = stage.getPointerPosition();
    
    if (pointerPosition) {
      const currentMousePos = { x: pointerPosition.x, y: pointerPosition.y };
      const lastPos = lastMousePosition.current;
      
      if (!lastPos || Math.abs(currentMousePos.x - lastPos.x) > 1 || Math.abs(currentMousePos.y - lastPos.y) > 1) {
        const worldPos = screenToWorld(pointerPosition.x, pointerPosition.y, viewport);
        const lastWorldPos = lastWorldPosition.current;

        if (!lastWorldPos || Math.abs(worldPos.x - lastWorldPos.x) > 0.1 || Math.abs(worldPos.y - lastWorldPos.y) > 0.1) {
          throttledCursorUpdate.current(worldPos.x, worldPos.y);
          lastWorldPosition.current = worldPos;
        }
        
        lastMousePosition.current = currentMousePos;
      }
    }
  }, [currentUserId, viewport, isDragging]);

  const handleGlobalMouseMove = useCallback((e: MouseEvent) => {
    if (!currentUserId || !throttledCursorUpdate.current || !viewport || !stageRef.current || isDragging.current) return;
    
    const stage = stageRef.current;
    const stageBox = stage.container().getBoundingClientRect();
    
    const mouseX = e.clientX - stageBox.left;
    const mouseY = e.clientY - stageBox.top;
    
    const currentMousePos = { x: mouseX, y: mouseY };
    const lastPos = lastMousePosition.current;
    
    if (!lastPos || Math.abs(currentMousePos.x - lastPos.x) > 1 || Math.abs(currentMousePos.y - lastPos.y) > 1) {
      const worldPos = screenToWorld(mouseX, mouseY, viewport);
      const lastWorldPos = lastWorldPosition.current;

      if (!lastWorldPos || Math.abs(worldPos.x - lastWorldPos.x) > 0.1 || Math.abs(worldPos.y - lastWorldPos.y) > 0.1) {
        throttledCursorUpdate.current(worldPos.x, worldPos.y);
        lastWorldPosition.current = worldPos;
      }
      
      lastMousePosition.current = currentMousePos;
    }
  }, [currentUserId, viewport, stageRef, isDragging]);

  useEffect(() => {
    if (currentUserId && throttledCursorUpdate.current) {
      window.addEventListener('mousemove', handleGlobalMouseMove);
      return () => window.removeEventListener('mousemove', handleGlobalMouseMove);
    }
  }, [currentUserId, handleGlobalMouseMove]);

  const handleMouseLeave = useCallback(() => {
    if (!currentUserId || !throttledCursorUpdate.current) return;
    throttledCursorUpdate.current(-1000, -1000);
  }, [currentUserId]);

  return { handleMouseMove, handleMouseLeave };
};



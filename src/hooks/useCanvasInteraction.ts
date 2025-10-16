import { useCallback, useRef } from 'react';
import { useUIStore } from '../state/uiStore';
import { getZoomFactor, screenToWorld } from '../utils/geometry';

export const useCanvasInteraction = (stageRef: React.RefObject<any>) => {
  const { viewport, updateViewport } = useUIStore();
  const isDragging = useRef<boolean>(false);

  const handleWheel = useCallback((e: any) => {
    e.evt.preventDefault();
    
    const stage = stageRef.current;
    if (!stage) return;

    const pointer = stage.getPointerPosition();
    if (!pointer) return;

    const oldScale = viewport.scale;
    const newScale = getZoomFactor(e.evt.deltaY, oldScale);
    
    if (newScale === oldScale) return;

    const worldPos = screenToWorld(pointer.x, pointer.y, viewport);
    
    updateViewport({
      scale: newScale,
      x: pointer.x - worldPos.x * newScale,
      y: pointer.y - worldPos.y * newScale,
    });
  }, [viewport, updateViewport, stageRef]);

  const handleMouseDown = useCallback((e: any) => {
    if (e.target === e.target.getStage()) {
      isDragging.current = true;
    }
  }, []);

  const handleDragEnd = useCallback(() => {
    const stage = stageRef.current;
    if (!stage) return;

    const newPos = stage.position();
    updateViewport({
      x: newPos.x,
      y: newPos.y,
    });
    
    isDragging.current = false;
  }, [updateViewport, stageRef]);

  const handleMouseUp = useCallback(() => {
    isDragging.current = false;
  }, []);

  return {
    isDragging,
    handleWheel,
    handleMouseDown,
    handleDragEnd,
    handleMouseUp,
  };
};



import { useCallback, useRef } from 'react';
import { useUIStore } from '../state/uiStore';
import { getZoomFactor, screenToWorld } from '../utils/geometry';

export const useCanvasInteraction = (stageRef: React.RefObject<any>, onDragSelectionEnd?: () => void) => {
  const { viewport, updateViewport, startDragSelection, updateDragSelection, endDragSelection, dragSelection } = useUIStore();
  const isDragging = useRef<boolean>(false);
  const isDragSelecting = useRef<boolean>(false);

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
      const stage = stageRef.current;
      if (!stage) return;

      const pointer = stage.getPointerPosition();
      if (!pointer) return;

      // Check if Ctrl/Cmd key is pressed for drag selection
      const isCtrlPressed = e.evt.ctrlKey || e.evt.metaKey;
      
      if (isCtrlPressed) {
        // Start drag selection
        isDragSelecting.current = true;
        const worldPos = screenToWorld(pointer.x, pointer.y, viewport);
        startDragSelection(worldPos.x, worldPos.y);
      } else {
        // Start canvas dragging
        isDragging.current = true;
      }
    }
  }, [viewport, startDragSelection, stageRef]);

  const handleDragEnd = useCallback(() => {
    const stage = stageRef.current;
    if (!stage) return;

    if (isDragSelecting.current) {
      // End drag selection
      isDragSelecting.current = false;
      endDragSelection();
      if (onDragSelectionEnd) {
        onDragSelectionEnd();
      }
    } else {
      // End canvas dragging
      const newPos = stage.position();
      updateViewport({
        x: newPos.x,
        y: newPos.y,
      });
      isDragging.current = false;
    }
  }, [updateViewport, endDragSelection, stageRef]);

  const handleMouseUp = useCallback(() => {
    isDragging.current = false;
    isDragSelecting.current = false;
  }, []);

  const handleMouseMove = useCallback(() => {
    if (isDragSelecting.current && dragSelection.isActive) {
      const stage = stageRef.current;
      if (!stage) return;

      const pointer = stage.getPointerPosition();
      if (!pointer) return;

      const worldPos = screenToWorld(pointer.x, pointer.y, viewport);
      updateDragSelection(worldPos.x, worldPos.y);
    }
  }, [viewport, updateDragSelection, dragSelection.isActive, stageRef]);

  return {
    isDragging,
    handleWheel,
    handleMouseDown,
    handleDragEnd,
    handleMouseUp,
    handleMouseMove,
  };
};



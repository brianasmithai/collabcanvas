import { useCallback, useRef, useEffect } from 'react';
import { useUIStore } from '../state/uiStore';
import { useRectangles } from './useRectangles';
import { screenToWorld } from '../utils/geometry';
import { updateSelection } from '../services/presence';
import type { Rect } from '../types';
import { throttle } from '../utils/throttle';

export const useRectangleInteraction = (
  stageRef: React.RefObject<any>,
  transformerRef: React.RefObject<any>,
  rectRefs: React.RefObject<{ [key: string]: any }>,
  currentUserId?: string
) => {
  const { selectionIds, setSelectionIds, clearSelection } = useUIStore();
  const { rectangles, createRect, updateRect, deleteRects } = useRectangles();
  const { viewport } = useUIStore();

  const createRectangle = useCallback(async (x: number, y: number) => {
    const newRect: Omit<Rect, 'id'> = {
      x: x - 50,
      y: y - 25,
      width: 100,
      height: 50,
      rotation: 0,
      updatedAt: Date.now(),
      updatedBy: currentUserId || 'local-user',
    };
    
    try {
      const id = await createRect(newRect);
      setSelectionIds([id]);
    } catch (err) {
      console.error('Failed to create rectangle:', err);
    }
  }, [createRect, setSelectionIds, currentUserId]);

  const handleStageClick = useCallback((e: any) => {
    if (e.target === e.target.getStage()) {
      clearSelection();
    }
  }, [clearSelection]);

  const handleStageDoubleClick = useCallback((e: any) => {
    if (e.target === e.target.getStage()) {
      const stage = stageRef.current;
      if (stage) {
        const pointer = stage.getPointerPosition();
        if (pointer) {
          const worldPos = screenToWorld(pointer.x, pointer.y, viewport);
          createRectangle(worldPos.x, worldPos.y);
        }
      }
    }
  }, [viewport, createRectangle, stageRef]);

  const handleRectClick = useCallback((rectId: string) => {
    setSelectionIds(
      selectionIds.includes(rectId)
        ? selectionIds.filter((id) => id !== rectId)
        : [rectId]
    );
  }, [selectionIds, setSelectionIds]);

  const handleRectDragMove = useCallback(async (rectId: string, newX: number, newY: number) => {
    try {
      await updateRect(rectId, { 
        x: newX, 
        y: newY, 
        updatedAt: Date.now(),
        updatedBy: currentUserId || 'local-user'
      });
    } catch (err) {
      console.error('Failed to update rectangle position during drag:', err);
    }
  }, [updateRect, currentUserId]);

  const handleRectDragEnd = useCallback(async (rectId: string, newX: number, newY: number) => {
    try {
      await updateRect(rectId, { 
        x: newX, 
        y: newY, 
        updatedAt: Date.now(),
        updatedBy: currentUserId || 'local-user'
      });
    } catch (err) {
      console.error('Failed to update rectangle position:', err);
    }
  }, [updateRect, currentUserId]);

  useEffect(() => {
    if (transformerRef.current && selectionIds.length > 0) {
      const nodes = selectionIds.map(id => rectRefs.current[id]).filter(Boolean);
      transformerRef.current.nodes(nodes);
      transformerRef.current.getLayer()?.batchDraw();
    }
  }, [selectionIds, transformerRef, rectRefs]);

  const throttledTransformUpdate = useRef<((updates: Partial<Rect>, rectId: string) => void) | null>(null);
  
  if (!throttledTransformUpdate.current) {
    throttledTransformUpdate.current = throttle(async (updates: Partial<Rect>, rectId: string) => {
      try {
        await updateRect(rectId, updates);
      } catch (err) {
        console.error('Failed to update rectangle transform:', err);
      }
    }, 50);
  }

  const handleTransformEnd = useCallback(async () => {
    if (transformerRef.current && selectionIds.length > 0) {
      const nodes = transformerRef.current.nodes();
      
      for (const node of nodes) {
        const rectId = rectangles.find(rect => rectRefs.current[rect.id] === node)?.id;
        if (rectId && throttledTransformUpdate.current) {
          (throttledTransformUpdate.current as any).flush();
          
          const newWidth = node.width() * node.scaleX();
          const newHeight = node.height() * node.scaleY();
          
          node.width(newWidth);
          node.height(newHeight);
          node.scaleX(1);
          node.scaleY(1);
          
          try {
            await updateRect(rectId, {
              x: node.x(),
              y: node.y(),
              width: newWidth,
              height: newHeight,
              rotation: node.rotation(),
              updatedAt: Date.now(),
              updatedBy: currentUserId || 'local-user'
            });
          } catch (err) {
            console.error('Failed to update rectangle transform:', err);
          }
        }
      }
    }
  }, [selectionIds, rectangles, updateRect, currentUserId, transformerRef, rectRefs]);

  const deleteSelectedRectangles = useCallback(async () => {
    if (selectionIds.length > 0) {
      try {
        await deleteRects(selectionIds);
        clearSelection();
      } catch (err) {
        console.error('Failed to delete rectangles:', err);
      }
    }
  }, [selectionIds, deleteRects, clearSelection]);

  useEffect(() => {
    if (currentUserId) {
      updateSelection(currentUserId, selectionIds);
    }
  }, [currentUserId, selectionIds]);

  // Handle keyboard events
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't trigger shortcuts when typing in input fields
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return;
      }
      
      if (e.key === 'Delete' || e.key === 'Backspace') {
        e.preventDefault();
        deleteSelectedRectangles();
      } else if (e.key === 'n' || e.key === 'N') {
        // Create rectangle at center of viewport
        const centerX = (window.innerWidth / 2 - viewport.x) / viewport.scale;
        const centerY = (window.innerHeight / 2 - viewport.y) / viewport.scale;
        createRectangle(centerX, centerY);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [deleteSelectedRectangles, createRectangle, viewport]);

  return {
    handleStageClick,
    handleStageDoubleClick,
    handleRectClick,
    handleRectDragMove,
    handleRectDragEnd,
    handleTransformEnd,
    deleteSelectedRectangles,
  };
};

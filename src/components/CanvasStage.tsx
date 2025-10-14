// Canvas Stage component with Konva for 2D canvas interactions
import React, { useRef, useCallback, useEffect } from 'react';
import { Stage, Layer, Transformer, Text } from 'react-konva';
import { useUIStore } from '../state/uiStore';
import { getZoomFactor, screenToWorld } from '../utils/geometry';
import { throttle } from '../utils/throttle';
import { updateCursor, updateSelection } from '../services/presence';
import { RectNode } from './RectNode';
import { CursorLayer } from './CursorLayer';
import { useRectangles } from '../hooks/useRectangles';
import type { Rect } from '../types';

interface CanvasStageProps {
  width: number;
  height: number;
  currentUserId?: string; // For cursor layer
}

export const CanvasStage: React.FC<CanvasStageProps> = ({ width, height, currentUserId }) => {
  const stageRef = useRef<any>(null);
  const transformerRef = useRef<any>(null);
  const rectRefs = useRef<{ [key: string]: any }>({});
  const { viewport, updateViewport, selectionIds, setSelectionIds, clearSelection } = useUIStore();
  
  // Use Firestore-backed rectangles
  const { rectangles, loading, error, createRect, updateRect, deleteRects } = useRectangles();

  // Handle wheel zoom
  const handleWheel = useCallback((e: any) => {
    e.evt.preventDefault();
    
    const stage = stageRef.current;
    if (!stage) return;

    const pointer = stage.getPointerPosition();
    if (!pointer) return;

    const oldScale = viewport.scale;
    const newScale = getZoomFactor(e.evt.deltaY, oldScale);
    
    if (newScale === oldScale) return;

    // Calculate zoom point in world coordinates
    const worldPos = screenToWorld(pointer.x, pointer.y, viewport);
    
    // Update viewport with new scale and adjusted position
    updateViewport({
      scale: newScale,
      x: pointer.x - worldPos.x * newScale,
      y: pointer.y - worldPos.y * newScale,
    });
  }, [viewport, updateViewport]);

  // Handle mouse down to detect potential drag start (only for canvas panning)
  const handleMouseDown = useCallback((e: any) => {
    // Only set dragging if clicking on empty space (not on rectangles)
    if (e.target === e.target.getStage()) {
      isDragging.current = true;
    }
  }, []);

  // Handle drag to pan
  const handleDragEnd = useCallback(() => {
    const stage = stageRef.current;
    if (!stage) return;

    const newPos = stage.position();
    updateViewport({
      x: newPos.x,
      y: newPos.y,
    });
    
    isDragging.current = false;
  }, [updateViewport]);

  // Handle mouse up to reset drag state
  const handleMouseUp = useCallback(() => {
    isDragging.current = false;
  }, []);

  // Handle stage click (deselect all)
  const handleStageClick = useCallback((e: any) => {
    // Only clear selection if clicking on empty space
    if (e.target === e.target.getStage()) {
      clearSelection();
    }
  }, [clearSelection]);

  // Create a new rectangle
  const createRectangle = useCallback(async (x: number, y: number) => {
    const newRect: Omit<Rect, 'id'> = {
      x: x - 50, // Center the rectangle on the click point
      y: y - 25,
      width: 100,
      height: 50,
      rotation: 0,
      updatedAt: Date.now(),
      updatedBy: currentUserId || 'local-user',
    };
    
    try {
      const id = await createRect(newRect);
      setSelectionIds([id]); // Select the new rectangle
    } catch (err) {
      console.error('Failed to create rectangle:', err);
    }
  }, [createRect, setSelectionIds, currentUserId]);

  // Handle stage double-click (create rectangle)
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
  }, [viewport, createRectangle]);

  // Handle rectangle click (select/deselect)
  const handleRectClick = useCallback((rectId: string) => {
    if (selectionIds.includes(rectId)) {
      // Deselect if already selected
      setSelectionIds(selectionIds.filter(id => id !== rectId));
    } else {
      // Select (single selection for now)
      setSelectionIds([rectId]);
    }
  }, [selectionIds, setSelectionIds]);

  // Handle rectangle drag move (throttled updates during drag)
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

  // Handle rectangle drag end (final position update)
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

  // Update transformer when selection changes
  useEffect(() => {
    if (transformerRef.current && selectionIds.length > 0) {
      const nodes = selectionIds.map(id => rectRefs.current[id]).filter(Boolean);
      transformerRef.current.nodes(nodes);
      transformerRef.current.getLayer()?.batchDraw();
    }
  }, [selectionIds]);

  // Sync rectangle data with Konva nodes when rectangles change
  useEffect(() => {
    rectangles.forEach(rect => {
      const node = rectRefs.current[rect.id];
      if (node) {
        // Update node properties to match rectangle data
        node.x(rect.x);
        node.y(rect.y);
        node.width(rect.width);
        node.height(rect.height);
        node.rotation(rect.rotation);
        node.scaleX(1); // Ensure scale is always 1
        node.scaleY(1);
      }
    });
  }, [rectangles]);

  // Create throttled transform update function
  const throttledTransformUpdate = useRef<((updates: Partial<Rect>, rectId: string) => void) | null>(null);
  
  if (!throttledTransformUpdate.current) {
    throttledTransformUpdate.current = throttle(async (updates: Partial<Rect>, rectId: string) => {
      try {
        await updateRect(rectId, updates);
      } catch (err) {
        console.error('Failed to update rectangle transform:', err);
      }
    }, 50); // Throttle to 20 updates per second for smoother real-time sync
  }

  // Create throttled cursor update function
  const throttledCursorUpdate = useRef<((x: number, y: number) => void) | null>(null);
  
  if (!throttledCursorUpdate.current && currentUserId) {
    throttledCursorUpdate.current = throttle(async (x: number, y: number) => {
      try {
        await updateCursor(currentUserId, { x, y });
      } catch (err) {
        console.error('Failed to update cursor position:', err);
      }
    }, 100); // Throttle to 10 updates per second
  }

  // Track last mouse position to detect actual mouse movement
  const lastMousePosition = useRef<{ x: number; y: number } | null>(null);
  const lastWorldPosition = useRef<{ x: number; y: number } | null>(null);
  const isDragging = useRef<boolean>(false);

  // Note: Real-time transform updates removed for MVP stability
  // Transforms will only sync after completion via handleTransformEnd

  // Handle transformer changes (resize/rotate) - final update
  const handleTransformEnd = useCallback(async () => {
    if (transformerRef.current && selectionIds.length > 0) {
      const nodes = transformerRef.current.nodes();
      
      for (const node of nodes) {
        const rectId = rectangles.find(rect => rectRefs.current[rect.id] === node)?.id;
        if (rectId && throttledTransformUpdate.current) {
          // Flush any pending throttled updates
          (throttledTransformUpdate.current as any).flush();
          
          // Apply the scale to width/height and reset scale to 1
          const newWidth = node.width() * node.scaleX();
          const newHeight = node.height() * node.scaleY();
          
          // Update the node immediately to prevent flicker
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
  }, [selectionIds, rectangles, updateRect, currentUserId]);

  // Delete selected rectangles
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

  // Handle keyboard events
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Delete' || e.key === 'Backspace') {
        e.preventDefault();
        deleteSelectedRectangles();
      } else if (e.key === 'n' || e.key === 'N') {
        // Create rectangle at center of viewport
        const centerX = (width / 2 - viewport.x) / viewport.scale;
        const centerY = (height / 2 - viewport.y) / viewport.scale;
        createRectangle(centerX, centerY);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [deleteSelectedRectangles, createRectangle, width, height, viewport]);

  // Handle mouse movement for cursor tracking
  const handleMouseMove = useCallback((e: any) => {
    if (!currentUserId || !throttledCursorUpdate.current || !viewport || isDragging.current) return;
    
    const stage = e.target.getStage();
    const pointerPosition = stage.getPointerPosition();
    
    if (pointerPosition) {
      // Check if mouse actually moved (not just canvas panning)
      const currentMousePos = { x: pointerPosition.x, y: pointerPosition.y };
      const lastPos = lastMousePosition.current;
      
      if (!lastPos || 
          Math.abs(currentMousePos.x - lastPos.x) > 1 || 
          Math.abs(currentMousePos.y - lastPos.y) > 1) {
        
        // Mouse actually moved, update cursor position
        const worldPos = screenToWorld(pointerPosition.x, pointerPosition.y, viewport);
        
        // Only update if world position actually changed
        const lastWorldPos = lastWorldPosition.current;
        if (!lastWorldPos || 
            Math.abs(worldPos.x - lastWorldPos.x) > 0.1 || 
            Math.abs(worldPos.y - lastWorldPos.y) > 0.1) {
          
          throttledCursorUpdate.current(worldPos.x, worldPos.y);
          lastWorldPosition.current = worldPos;
        }
        
        lastMousePosition.current = currentMousePos;
      }
    }
  }, [currentUserId, viewport]);

  // Global mouse move handler for cursor tracking during drag/transform
  const handleGlobalMouseMove = useCallback((e: MouseEvent) => {
    if (!currentUserId || !throttledCursorUpdate.current || !viewport || !stageRef.current || isDragging.current) return;
    
    const stage = stageRef.current;
    const stageBox = stage.container().getBoundingClientRect();
    
    // Calculate mouse position relative to the stage
    const mouseX = e.clientX - stageBox.left;
    const mouseY = e.clientY - stageBox.top;
    
    // Check if mouse actually moved (not just canvas panning)
    const currentMousePos = { x: mouseX, y: mouseY };
    const lastPos = lastMousePosition.current;
    
    if (!lastPos || 
        Math.abs(currentMousePos.x - lastPos.x) > 1 || 
        Math.abs(currentMousePos.y - lastPos.y) > 1) {
      
      // Mouse actually moved, update cursor position
      const worldPos = screenToWorld(mouseX, mouseY, viewport);
      
      // Only update if world position actually changed
      const lastWorldPos = lastWorldPosition.current;
      if (!lastWorldPos || 
          Math.abs(worldPos.x - lastWorldPos.x) > 0.1 || 
          Math.abs(worldPos.y - lastWorldPos.y) > 0.1) {
        
        throttledCursorUpdate.current(worldPos.x, worldPos.y);
        lastWorldPosition.current = worldPos;
      }
      
      lastMousePosition.current = currentMousePos;
    }
  }, [currentUserId, viewport]);

  // Global mouse move listener for cursor tracking during drag/transform
  useEffect(() => {
    if (currentUserId && throttledCursorUpdate.current) {
      window.addEventListener('mousemove', handleGlobalMouseMove);
      return () => window.removeEventListener('mousemove', handleGlobalMouseMove);
    }
  }, [currentUserId, handleGlobalMouseMove]);

  // Sync selection changes to presence system
  useEffect(() => {
    if (currentUserId) {
      updateSelection(currentUserId, selectionIds);
    }
  }, [currentUserId, selectionIds]);

  // Handle mouse leave to clear cursor position
  const handleMouseLeave = useCallback(() => {
    if (!currentUserId || !throttledCursorUpdate.current) return;
    
    // Set cursor to off-screen position when mouse leaves
    throttledCursorUpdate.current(-1000, -1000);
  }, [currentUserId]);

  // Show loading state
  if (loading) {
    return (
      <div style={{ 
        width, 
        height, 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center',
        backgroundColor: '#f0f0f0',
        fontSize: '18px',
        color: '#666'
      }}>
        Loading canvas...
      </div>
    );
  }

  // Show error state
  if (error) {
    return (
      <div style={{ 
        width, 
        height, 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center',
        backgroundColor: '#ffe6e6',
        fontSize: '18px',
        color: '#d32f2f',
        flexDirection: 'column',
        gap: '10px'
      }}>
        <div>Error loading rectangles:</div>
        <div style={{ fontSize: '14px', textAlign: 'center' }}>{error.message}</div>
      </div>
    );
  }

  return (
    <Stage
      ref={stageRef}
      width={width}
      height={height}
      scaleX={viewport.scale}
      scaleY={viewport.scale}
      x={viewport.x}
      y={viewport.y}
      draggable
      onWheel={handleWheel}
      onMouseDown={handleMouseDown}
      onMouseUp={handleMouseUp}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      onDragEnd={handleDragEnd}
      onClick={handleStageClick}
      onTap={handleStageClick}
      onDblClick={handleStageDoubleClick}
      onDblTap={handleStageDoubleClick}
      style={{ cursor: 'grab' }}
    >
      <Layer>
        {/* Empty state indicator */}
        {rectangles.length === 0 && (
          <Text
            x={width / 2}
            y={height / 2}
            text="Double-click to create your first rectangle"
            fontSize={18}
            fontFamily="Arial, sans-serif"
            fill="#999"
            align="center"
            offsetX={200} // Approximate text width / 2
            offsetY={10}
          />
        )}
        
        {/* Render all rectangles */}
        {rectangles.map((rect) => (
          <RectNode
            key={rect.id}
            ref={(ref) => {
              if (ref) {
                rectRefs.current[rect.id] = ref;
              }
            }}
            rect={rect}
            isSelected={selectionIds.includes(rect.id)}
            onClick={handleRectClick}
            onDragMove={handleRectDragMove}
            onDragEnd={handleRectDragEnd}
          />
        ))}
        
        {/* Transformer for selected rectangles */}
        {selectionIds.length > 0 && (
          <Transformer
            ref={transformerRef}
            nodes={selectionIds.map(id => rectRefs.current[id]).filter(Boolean)}
            boundBoxFunc={(oldBox, newBox) => {
              // Limit resize
              if (newBox.width < 5 || newBox.height < 5) {
                return oldBox;
              }
              return newBox;
            }}
            // onTransform removed - transforms only sync on completion
            onTransformEnd={handleTransformEnd}
          />
        )}
      </Layer>
      
      {/* Cursor layer for remote users */}
      <CursorLayer currentUserId={currentUserId} />
    </Stage>
  );
};

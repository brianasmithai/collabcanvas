// Canvas Stage component with Konva for 2D canvas interactions
import React, { useRef, useCallback, useState, useEffect } from 'react';
import { Stage, Layer, Transformer } from 'react-konva';
import { useUIStore } from '../state/uiStore';
import { getZoomFactor, screenToWorld } from '../utils/geometry';
import { RectNode } from './RectNode';
import type { Rect } from '../types';

interface CanvasStageProps {
  width: number;
  height: number;
}

export const CanvasStage: React.FC<CanvasStageProps> = ({ width, height }) => {
  const stageRef = useRef<any>(null);
  const transformerRef = useRef<any>(null);
  const rectRefs = useRef<{ [key: string]: any }>({});
  const { viewport, updateViewport, selectionIds, setSelectionIds, clearSelection } = useUIStore();
  
  // Temporary local array of rectangles for testing
  const [rectangles] = useState<Rect[]>([
    {
      id: 'rect1',
      x: 100,
      y: 100,
      width: 200,
      height: 100,
      rotation: 0,
      updatedAt: Date.now(),
      updatedBy: 'local-user',
    },
    {
      id: 'rect2',
      x: 400,
      y: 200,
      width: 150,
      height: 80,
      rotation: 0,
      updatedAt: Date.now(),
      updatedBy: 'local-user',
    },
    {
      id: 'rect3',
      x: 200,
      y: 400,
      width: 100,
      height: 100,
      rotation: 0,
      updatedAt: Date.now(),
      updatedBy: 'local-user',
    },
  ]);

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

  // Handle drag to pan
  const handleDragEnd = useCallback(() => {
    const stage = stageRef.current;
    if (!stage) return;

    const newPos = stage.position();
    updateViewport({
      x: newPos.x,
      y: newPos.y,
    });
  }, [updateViewport]);

  // Handle stage click (deselect all)
  const handleStageClick = useCallback((e: any) => {
    // Only clear selection if clicking on empty space
    if (e.target === e.target.getStage()) {
      clearSelection();
    }
  }, [clearSelection]);

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

  // Update transformer when selection changes
  useEffect(() => {
    if (transformerRef.current && selectionIds.length > 0) {
      const nodes = selectionIds.map(id => rectRefs.current[id]).filter(Boolean);
      transformerRef.current.nodes(nodes);
      transformerRef.current.getLayer()?.batchDraw();
    }
  }, [selectionIds]);

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
      onDragEnd={handleDragEnd}
      onClick={handleStageClick}
      onTap={handleStageClick}
      style={{ cursor: 'grab' }}
    >
      <Layer>
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
          />
        )}
      </Layer>
    </Stage>
  );
};

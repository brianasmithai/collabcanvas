// Canvas Stage component with Konva for 2D canvas interactions
import React, { useRef, useCallback } from 'react';
import { Stage, Layer, Rect } from 'react-konva';
import { useUIStore } from '../state/uiStore';
import { getZoomFactor, screenToWorld } from '../utils/geometry';

interface CanvasStageProps {
  width: number;
  height: number;
}

export const CanvasStage: React.FC<CanvasStageProps> = ({ width, height }) => {
  const stageRef = useRef<any>(null);
  const { viewport, updateViewport } = useUIStore();

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
      style={{ cursor: 'grab' }}
    >
      <Layer>
        {/* Canvas background - transparent so we can see the page background */}
        <Rect
          x={0}
          y={0}
          width={width}
          height={height}
          fill="transparent"
          stroke="lightgray"
          strokeWidth={2}
        />
        {/* Test rectangle to verify canvas is working */}
        <Rect
          x={100}
          y={100}
          width={200}
          height={100}
          fill="lightblue"
          stroke="blue"
          strokeWidth={2}
        />
        {/* Additional test rectangles to show canvas area */}
        <Rect
          x={400}
          y={200}
          width={150}
          height={80}
          fill="lightgreen"
          stroke="green"
          strokeWidth={2}
        />
        <Rect
          x={200}
          y={400}
          width={100}
          height={100}
          fill="lightcoral"
          stroke="red"
          strokeWidth={2}
        />
      </Layer>
    </Stage>
  );
};

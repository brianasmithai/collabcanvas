// Canvas Stage component with Konva for 2D canvas interactions
import React, { useRef, useEffect } from 'react';
import { Stage, Layer, Transformer, Text } from 'react-konva';
import { useUIStore } from '../state/uiStore';
import { RectNode } from './RectNode';
import { CursorLayer } from './CursorLayer';
import { useRectangles } from '../hooks/useRectangles';
import { useCanvasInteraction } from '../hooks/useCanvasInteraction';
import { useCursorTracking } from '../hooks/useCursorTracking';
import { useRectangleInteraction } from '../hooks/useRectangleInteraction';

interface CanvasStageProps {
  width: number;
  height: number;
  currentUserId?: string;
}

export const CanvasStage: React.FC<CanvasStageProps> = ({ width, height, currentUserId }) => {
  const stageRef = useRef<any>(null);
  const transformerRef = useRef<any>(null);
  const rectRefs = useRef<{ [key: string]: any }>({});
  
  const { viewport, selectionIds } = useUIStore();
  const { rectangles, loading, error } = useRectangles();

  const { isDragging, handleWheel, handleMouseDown, handleDragEnd, handleMouseUp } = useCanvasInteraction(stageRef);
  const { handleMouseMove, handleMouseLeave } = useCursorTracking(stageRef, isDragging, currentUserId);
  const {
    handleStageClick,
    handleStageDoubleClick,
    handleRectClick,
    handleRectDragMove,
    handleRectDragEnd,
    handleTransformEnd,
  } = useRectangleInteraction(stageRef, transformerRef, rectRefs, currentUserId);

  useEffect(() => {
    rectangles.forEach(rect => {
      const node = rectRefs.current[rect.id];
      if (node) {
        node.x(rect.x);
        node.y(rect.y);
        node.width(rect.width);
        node.height(rect.height);
        node.rotation(rect.rotation);
        node.scaleX(1);
        node.scaleY(1);
      }
    });
  }, [rectangles]);

  if (loading) return <div>Loading canvas...</div>;
  if (error) return <div>Error loading rectangles: {error.message}</div>;

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
      onDblClick={handleStageDoubleClick}
    >
      <Layer>
        {rectangles.length === 0 && (
          <Text
            x={width / 2}
            y={height / 2}
            text="Double-click to create your first rectangle"
            fontSize={18}
            fontFamily="Arial, sans-serif"
            fill="#999"
            align="center"
            offsetX={200}
            offsetY={10}
          />
        )}
        
        {rectangles.map((rect) => (
          <RectNode
            key={rect.id}
            ref={(ref) => {
              if (ref) rectRefs.current[rect.id] = ref;
            }}
            rect={rect}
            isSelected={selectionIds.includes(rect.id)}
            onClick={handleRectClick}
            onDragMove={handleRectDragMove}
            onDragEnd={handleRectDragEnd}
          />
        ))}
        
        {selectionIds.length > 0 && (
          <Transformer
            ref={transformerRef}
            nodes={selectionIds.map(id => rectRefs.current[id]).filter(Boolean)}
            boundBoxFunc={(oldBox, newBox) => {
              if (newBox.width < 5 || newBox.height < 5) return oldBox;
              return newBox;
            }}
            onTransformEnd={handleTransformEnd}
          />
        )}
      </Layer>
      
      <CursorLayer currentUserId={currentUserId} />
    </Stage>
  );
};

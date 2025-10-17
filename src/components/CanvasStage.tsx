// Canvas Stage component with Konva for 2D canvas interactions
import React, { useRef, useEffect } from 'react';
import { Stage, Layer, Transformer, Text } from 'react-konva';
import { useUIStore } from '../state/uiStore';
import { RectNode } from './RectNode';
import { CursorLayer } from './CursorLayer';
import { DragSelection } from './DragSelection';
import { useRectangles } from '../hooks/useRectangles';
import { useCanvasInteraction } from '../hooks/useCanvasInteraction';
import { useCursorTracking } from '../hooks/useCursorTracking';
import { useRectangleInteraction } from '../hooks/useRectangleInteraction';
import { usePresence } from '../hooks/usePresence';
import { useLocks } from '../hooks/useLocks';

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
  const { rectangles, loading, error, liveTransforms } = useRectangles();
  const presenceMap = usePresence();
  const { isLockedByOther, getLockOwner } = useLocks();
  
  // Get current user's name from presence map
  const currentUserName = currentUserId ? presenceMap[currentUserId]?.displayName || presenceMap[currentUserId]?.name : undefined;

  // Helper function to get users editing a specific rectangle
  const getEditingUsers = (rectId: string): string[] => {
    const editingUsers: string[] = [];
    
    Object.entries(presenceMap).forEach(([userId, presence]) => {
      // Skip current user
      if (userId === currentUserId) return;
      
      // Check if this user has selected this rectangle
      if (presence.selectionIds && presence.selectionIds.includes(rectId)) {
        editingUsers.push(userId);
      }
    });
    
    return editingUsers;
  };

  // Get all user IDs for color assignment
  const allUserIds = Object.keys(presenceMap);

  const {
    handleStageClick,
    handleStageDoubleClick,
    handleRectClick,
    handleRectDragMove,
    handleRectDragEnd,
    handleTransformEnd,
    handleDragSelectionEnd,
  } = useRectangleInteraction(stageRef, transformerRef, rectRefs, currentUserId, currentUserName);

  const { isDragging, handleWheel, handleMouseDown, handleDragEnd, handleMouseUp, handleMouseMove: handleCanvasMouseMove } = useCanvasInteraction(stageRef, handleDragSelectionEnd);
  const { handleMouseMove, handleMouseLeave } = useCursorTracking(stageRef, isDragging, currentUserId);

  // Apply live transforms to Konva nodes in real-time
  useEffect(() => {
    console.log('🎨 CanvasStage: Applying live transforms. Live transforms:', liveTransforms, 'Selection IDs:', selectionIds);
    console.log('🎨 CanvasStage: Live transform keys:', liveTransforms ? Object.keys(liveTransforms) : []);
    console.log('🎨 CanvasStage: Rectangle count:', rectangles.length);
    
    rectangles.forEach(rect => {
      const node = rectRefs.current[rect.id];
      console.log('🎨 CanvasStage: Processing rectangle', rect.id, 'node exists:', !!node);
      
      if (!node) {
        console.log('🎨 CanvasStage: No node found for rectangle', rect.id);
        return;
      }
      
      // Check if there's an active live transform for this rectangle
      const liveTransform = liveTransforms ? liveTransforms[rect.id] : undefined;
      console.log('🎨 CanvasStage: Live transform for', rect.id, ':', liveTransform);
      
      // Skip if:
      // 1. No live transform exists
      // 2. Current user is editing this rectangle (don't override own actions)
      if (!liveTransform || selectionIds.includes(rect.id)) {
        // Apply base rectangle data
        if (liveTransform && selectionIds.includes(rect.id)) {
          console.log('🎨 CanvasStage: Skipping live transform for own selection:', rect.id);
        }
        node.x(rect.x);
        node.y(rect.y);
        node.width(rect.width);
        node.height(rect.height);
        node.rotation(rect.rotation);
        node.scaleX(1);
        node.scaleY(1);
        return;
      }
      
      // Apply live transform (another user is actively editing)
      console.log('🎨 CanvasStage: Applying live transform for', rect.id, 'from', liveTransform.updatedBy, 'at', liveTransform.x, liveTransform.y);
      requestAnimationFrame(() => {
        node.x(liveTransform.x);
        node.y(liveTransform.y);
        node.width(liveTransform.width);
        node.height(liveTransform.height);
        node.rotation(liveTransform.rotation);
        node.scaleX(1);
        node.scaleY(1);
        node.getLayer()?.batchDraw();
      });
    });
  }, [rectangles, liveTransforms, selectionIds]);

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
      onMouseMove={(e) => {
        handleMouseMove(e);
        handleCanvasMouseMove();
      }}
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
        
        {rectangles.map((rect) => {
          const editingUsers = getEditingUsers(rect.id);
          const lockedByOther = currentUserId ? isLockedByOther(rect.id, currentUserId) : false;
          const lockOwner = getLockOwner(rect.id);
          
          return (
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
              editingUsers={editingUsers}
              currentUserId={currentUserId}
              allUserIds={allUserIds}
              isLockedByOther={lockedByOther}
              lockOwnerName={lockOwner?.ownerName}
            />
          );
        })}
        
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
        
        <DragSelection />
      </Layer>
      
      <CursorLayer currentUserId={currentUserId} />
    </Stage>
  );
};

// Rectangle Node component for rendering individual rectangles
import { forwardRef, useRef } from 'react';
import { Rect as KonvaRect } from 'react-konva';
import { throttle } from '../utils/throttle';
import { getRectangleStyling } from '../utils/colors';
import type { Rect } from '../types';

interface RectNodeProps {
  rect: Rect;
  isSelected: boolean;
  onClick: (id: string) => void;
  onDragMove: (id: string, x: number, y: number) => void;
  onDragEnd: (id: string, x: number, y: number) => void;
  editingUsers?: string[]; // Array of user IDs currently editing this rectangle
  currentUserId?: string; // Current user's ID for styling decisions
  allUserIds?: string[]; // All user IDs for color assignment
}

export const RectNode = forwardRef<any, RectNodeProps>(({ 
  rect, 
  isSelected, 
  onClick, 
  onDragMove, 
  onDragEnd, 
  editingUsers = [], 
  currentUserId,
  allUserIds = []
}, ref) => {
  const shapeRef = useRef<any>(null);
  // Suppress unused variable warning - will be used for advanced interactions in future PRs
  console.log('Shape ref:', shapeRef);

  // Create throttled update function for drag moves
  const throttledUpdateRef = useRef<((x: number, y: number) => void) | null>(null);
  
  if (!throttledUpdateRef.current && onDragMove) {
    throttledUpdateRef.current = throttle((x: number, y: number) => {
      onDragMove(rect.id, x, y);
    }, 100); // Throttle to 10 updates per second
  }

  // Combine refs
  const handleClick = (e: any) => {
    e.cancelBubble = true; // Prevent stage click
    onClick(rect.id);
  };

  const handleDragMove = (e: any) => {
    console.log('🖱️ RectNode: Drag move detected for', rect.id);
    if (throttledUpdateRef.current) {
      const node = e.target;
      throttledUpdateRef.current(node.x(), node.y());
    }
  };

  const handleDragEnd = (e: any) => {
    console.log('🏁 RectNode: Drag END detected for', rect.id);
    const node = e.target;
    
    // Flush any pending throttled updates
    if (throttledUpdateRef.current) {
      (throttledUpdateRef.current as any).flush();
    }
    
    // Always call onDragEnd for final position
    console.log('📞 RectNode: Calling onDragEnd with position:', node.x(), node.y());
    onDragEnd(rect.id, node.x(), node.y());
  };

  // Get visual styling based on editing state
  const styling = getRectangleStyling(rect.id, isSelected, editingUsers, currentUserId, allUserIds);
  
  // Debug logging for visual feedback
  if (editingUsers.length > 0) {
    console.log(`🎨 RectNode: Rectangle ${rect.id} being edited by users:`, editingUsers, 'styling:', styling);
  }

  return (
    <KonvaRect
      ref={ref}
      x={rect.x}
      y={rect.y}
      width={rect.width}
      height={rect.height}
      rotation={rect.rotation}
      fill={styling.fill}
      stroke={styling.stroke}
      strokeWidth={styling.strokeWidth}
      dash={styling.dash}
      opacity={styling.opacity}
      onClick={handleClick}
      onTap={handleClick}
      onDragMove={handleDragMove}
      onDragEnd={handleDragEnd}
      draggable={true}
    />
  );
});

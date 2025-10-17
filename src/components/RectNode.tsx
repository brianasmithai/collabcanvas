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
  isLockedByOther?: boolean; // Whether this object is locked by another user
  lockOwnerName?: string; // Name of the user who has locked this object
}

export const RectNode = forwardRef<any, RectNodeProps>(({ 
  rect, 
  isSelected, 
  onClick, 
  onDragMove, 
  onDragEnd, 
  editingUsers = [], 
  currentUserId,
  allUserIds = [],
  isLockedByOther = false,
  lockOwnerName
}, ref) => {
  // Use the forwarded ref for the Konva Rect component
  console.log('Shape ref:', ref);

  // Create throttled update function for drag moves
  const throttledUpdateRef = useRef<((x: number, y: number) => void) | null>(null);
  
  if (!throttledUpdateRef.current && onDragMove) {
    throttledUpdateRef.current = throttle((x: number, y: number) => {
      onDragMove(rect.id, x, y);
    }, 50); // Throttle to 20 updates per second for better real-time feel
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
  const styling = getRectangleStyling(isSelected, editingUsers, currentUserId, allUserIds);
  
  // Override styling for locked objects
  const finalStyling = isLockedByOther ? {
    ...styling,
    opacity: 0.5, // Make locked objects semi-transparent
    stroke: '#ff6b6b', // Red border for locked objects
    strokeWidth: 3,
    dash: [10, 5], // Dashed border for locked objects
  } : styling;
  
  // Debug logging for visual feedback
  if (editingUsers.length > 0) {
    console.log(`🎨 RectNode: Rectangle ${rect.id} being edited by users:`, editingUsers, 'styling:', finalStyling);
  }
  
  if (isLockedByOther) {
    console.log(`🔒 RectNode: Rectangle ${rect.id} is locked by ${lockOwnerName}`);
  }

  return (
    <KonvaRect
      ref={ref}
      x={rect.x}
      y={rect.y}
      width={rect.width}
      height={rect.height}
      rotation={rect.rotation}
      fill={finalStyling.fill}
      stroke={finalStyling.stroke}
      strokeWidth={finalStyling.strokeWidth}
      dash={finalStyling.dash}
      opacity={finalStyling.opacity}
      onClick={handleClick}
      onTap={handleClick}
      onDragMove={isLockedByOther ? undefined : handleDragMove} // Disable drag for locked objects
      onDragEnd={isLockedByOther ? undefined : handleDragEnd} // Disable drag for locked objects
      draggable={!isLockedByOther} // Disable dragging for locked objects
      cursor={isLockedByOther ? 'not-allowed' : 'pointer'} // Change cursor for locked objects
    />
  );
});

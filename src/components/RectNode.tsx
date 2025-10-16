// Rectangle Node component for rendering individual rectangles
import { forwardRef, useRef } from 'react';
import { Rect as KonvaRect } from 'react-konva';
import { throttle } from '../utils/throttle';
import type { Rect } from '../types';

interface RectNodeProps {
  rect: Rect;
  isSelected: boolean;
  onClick: (id: string) => void;
  onDragMove: (id: string, x: number, y: number) => void;
  onDragEnd: (id: string, x: number, y: number) => void;
}

export const RectNode = forwardRef<any, RectNodeProps>(({ rect, isSelected, onClick, onDragMove, onDragEnd }, ref) => {
  const shapeRef = useRef<any>(null);

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
    if (throttledUpdateRef.current) {
      const node = e.target;
      throttledUpdateRef.current(node.x(), node.y());
    }
  };

  const handleDragEnd = (e: any) => {
    const node = e.target;
    
    // Flush any pending throttled updates
    if (throttledUpdateRef.current) {
      (throttledUpdateRef.current as any).flush();
    }
    
    // Always call onDragEnd for final position
    onDragEnd(rect.id, node.x(), node.y());
  };

  return (
    <KonvaRect
      ref={ref}
      x={rect.x}
      y={rect.y}
      width={rect.width}
      height={rect.height}
      rotation={rect.rotation}
      fill={isSelected ? '#e3f2fd' : '#bbdefb'}
      stroke={isSelected ? '#1976d2' : '#2196f3'}
      strokeWidth={isSelected ? 3 : 2}
      onClick={handleClick}
      onTap={handleClick}
      onDragMove={handleDragMove}
      onDragEnd={handleDragEnd}
      draggable={true}
    />
  );
});

// Rectangle Node component for rendering individual rectangles
import { forwardRef } from 'react';
import { Rect as KonvaRect } from 'react-konva';
import type { Rect } from '../types';

interface RectNodeProps {
  rect: Rect;
  isSelected: boolean;
  onClick: (rectId: string) => void;
}

export const RectNode = forwardRef<any, RectNodeProps>(({ rect, isSelected, onClick }, ref) => {
  const handleClick = (e: any) => {
    e.cancelBubble = true; // Prevent stage click
    onClick(rect.id);
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
      draggable={false} // Will be handled by CanvasStage
    />
  );
});

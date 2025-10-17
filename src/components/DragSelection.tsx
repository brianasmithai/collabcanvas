import React from 'react';
import { Rect } from 'react-konva';
import { useUIStore } from '../state/uiStore';

export const DragSelection: React.FC = () => {
  const { dragSelection } = useUIStore();

  if (!dragSelection.isActive) {
    return null;
  }

  const x = Math.min(dragSelection.startX, dragSelection.endX);
  const y = Math.min(dragSelection.startY, dragSelection.endY);
  const width = Math.abs(dragSelection.endX - dragSelection.startX);
  const height = Math.abs(dragSelection.endY - dragSelection.startY);

  return (
    <Rect
      x={x}
      y={y}
      width={width}
      height={height}
      fill="rgba(0, 123, 255, 0.1)"
      stroke="rgba(0, 123, 255, 0.5)"
      strokeWidth={1}
      dash={[5, 5]}
      listening={false}
    />
  );
};


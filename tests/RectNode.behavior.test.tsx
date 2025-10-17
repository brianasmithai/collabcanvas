// Behavior tests for RectNode component
import React from 'react';
import { render, fireEvent } from '@testing-library/react';
import { vi } from 'vitest';
import { RectNode } from '../src/components/RectNode';
import type { Rect } from '../src/types';

// Mock react-konva components
vi.mock('react-konva', () => ({
  Rect: ({ onClick, onTap, strokeWidth, stroke, fill, dash, opacity, ...props }: any) => (
    <div 
      data-testid="konva-rect" 
      onClick={onClick}
      onTouchStart={onTap}
      {...props}
      // Set visual properties as both DOM attributes and data attributes for testing
      fill={fill}
      stroke={stroke}
      data-stroke-width={strokeWidth}
      data-stroke={stroke}
      data-fill={fill}
      data-dash={dash ? JSON.stringify(dash) : undefined}
      data-opacity={opacity}
    />
  ),
}));

describe('RectNode', () => {
  const mockRect: Rect = {
    id: 'test-rect',
    x: 100,
    y: 200,
    width: 150,
    height: 80,
    rotation: 45,
    updatedAt: Date.now(),
    updatedBy: 'test-user',
  };

  const mockOnClick = vi.fn();
  const mockOnDragMove = vi.fn();
  const mockOnDragEnd = vi.fn();

  beforeEach(() => {
    mockOnClick.mockClear();
    mockOnDragMove.mockClear();
    mockOnDragEnd.mockClear();
  });

  test('should render rectangle with correct props', () => {
    const { getByTestId } = render(
      <RectNode 
        rect={mockRect} 
        isSelected={false} 
        onClick={mockOnClick} 
      />
    );
    
    const rect = getByTestId('konva-rect');
    expect(rect).toHaveAttribute('x', '100');
    expect(rect).toHaveAttribute('y', '200');
    expect(rect).toHaveAttribute('width', '150');
    expect(rect).toHaveAttribute('height', '80');
    expect(rect).toHaveAttribute('rotation', '45');
  });

  test('should apply selected styling when isSelected is true', () => {
    const { getByTestId } = render(
      <RectNode 
        rect={mockRect} 
        isSelected={true} 
        onClick={mockOnClick}
        onDragMove={mockOnDragMove}
        onDragEnd={mockOnDragEnd}
        editingUsers={[]}
        currentUserId="current-user"
        allUserIds={['current-user', 'other-user']}
      />
    );
    
    const rect = getByTestId('konva-rect');
    expect(rect).toHaveAttribute('fill', '#e3f2fd');
    expect(rect).toHaveAttribute('stroke', '#28a745'); // Current user gets green color
    expect(rect).toHaveAttribute('data-stroke-width', '3');
  });

  test('should apply unselected styling when isSelected is false', () => {
    const { getByTestId } = render(
      <RectNode 
        rect={mockRect} 
        isSelected={false} 
        onClick={mockOnClick}
        onDragMove={mockOnDragMove}
        onDragEnd={mockOnDragEnd}
        editingUsers={[]}
        currentUserId="current-user"
        allUserIds={['current-user', 'other-user']}
      />
    );
    
    const rect = getByTestId('konva-rect');
    expect(rect).toHaveAttribute('fill', '#bbdefb');
    expect(rect).toHaveAttribute('stroke', '#2196f3');
    expect(rect).toHaveAttribute('data-stroke-width', '2');
  });

  test('should call onClick with rect id when clicked', () => {
    const { getByTestId } = render(
      <RectNode 
        rect={mockRect} 
        isSelected={false} 
        onClick={mockOnClick} 
      />
    );
    
    const rect = getByTestId('konva-rect');
    fireEvent.click(rect);
    
    expect(mockOnClick).toHaveBeenCalledWith('test-rect', expect.any(Object));
    expect(mockOnClick).toHaveBeenCalledTimes(1);
  });

  test('should call onClick with rect id when tapped', () => {
    const { getByTestId } = render(
      <RectNode 
        rect={mockRect} 
        isSelected={false} 
        onClick={mockOnClick} 
      />
    );
    
    const rect = getByTestId('konva-rect');
    fireEvent.touchStart(rect);
    
    expect(mockOnClick).toHaveBeenCalledWith('test-rect', expect.any(Object));
    expect(mockOnClick).toHaveBeenCalledTimes(1);
  });

  test('should apply visual feedback when other users are editing the rectangle', () => {
    const { getByTestId } = render(
      <RectNode 
        rect={mockRect} 
        isSelected={false} 
        onClick={mockOnClick}
        editingUsers={['other-user']}
        currentUserId="current-user"
      />
    );
    
    const rect = getByTestId('konva-rect');
    expect(rect).toHaveAttribute('data-stroke-width', '2');
    expect(rect).toHaveAttribute('data-dash', '[8,4]');
    expect(rect).toHaveAttribute('data-opacity', '0.8');
    // Should have a stroke color (will be assigned by getUserPrimaryColor)
    expect(rect).toHaveAttribute('data-stroke');
  });

  test('should not apply visual feedback when current user is editing the rectangle', () => {
    const { getByTestId } = render(
      <RectNode 
        rect={mockRect} 
        isSelected={true} 
        onClick={mockOnClick}
        onDragMove={mockOnDragMove}
        onDragEnd={mockOnDragEnd}
        editingUsers={['current-user']}
        currentUserId="current-user"
        allUserIds={['current-user', 'other-user']}
      />
    );
    
    const rect = getByTestId('konva-rect');
    // Should use self-selected styling, not other-user styling
    expect(rect).toHaveAttribute('data-fill', '#e3f2fd');
    expect(rect).toHaveAttribute('data-stroke', '#28a745'); // Current user gets green color
    expect(rect).toHaveAttribute('data-stroke-width', '3');
    // Should not have dash for self-selected, but opacity should be 1
    expect(rect).not.toHaveAttribute('data-dash');
    expect(rect).toHaveAttribute('data-opacity', '1');
  });

  test('should apply default styling when no users are editing', () => {
    const { getByTestId } = render(
      <RectNode 
        rect={mockRect} 
        isSelected={false} 
        onClick={mockOnClick}
        onDragMove={mockOnDragMove}
        onDragEnd={mockOnDragEnd}
        editingUsers={[]}
        currentUserId="current-user"
        allUserIds={['current-user', 'other-user']}
      />
    );
    
    const rect = getByTestId('konva-rect');
    expect(rect).toHaveAttribute('data-fill', '#bbdefb');
    expect(rect).toHaveAttribute('data-stroke', '#2196f3');
    expect(rect).toHaveAttribute('data-stroke-width', '2');
    // Should not have dash for default, but opacity should be 1
    expect(rect).not.toHaveAttribute('data-dash');
    expect(rect).toHaveAttribute('data-opacity', '1');
  });
});

// Behavior tests for RectNode component
import React from 'react';
import { render, fireEvent } from '@testing-library/react';
import { vi } from 'vitest';
import { RectNode } from '../src/components/RectNode';
import type { Rect } from '../src/types';

// Mock react-konva components
vi.mock('react-konva', () => ({
  Rect: ({ onClick, onTap, ...props }: any) => (
    <div 
      data-testid="konva-rect" 
      onClick={onClick}
      onTouchStart={onTap}
      {...props}
      // Ensure strokeWidth is properly set as an attribute
      strokeWidth={props.strokeWidth}
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

  beforeEach(() => {
    mockOnClick.mockClear();
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
      />
    );
    
    const rect = getByTestId('konva-rect');
    expect(rect).toHaveAttribute('fill', '#e3f2fd');
    expect(rect).toHaveAttribute('stroke', '#1976d2');
    expect(rect).toHaveAttribute('strokeWidth', '3');
  });

  test('should apply unselected styling when isSelected is false', () => {
    const { getByTestId } = render(
      <RectNode 
        rect={mockRect} 
        isSelected={false} 
        onClick={mockOnClick} 
      />
    );
    
    const rect = getByTestId('konva-rect');
    expect(rect).toHaveAttribute('fill', '#bbdefb');
    expect(rect).toHaveAttribute('stroke', '#2196f3');
    expect(rect).toHaveAttribute('strokeWidth', '2');
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
    
    expect(mockOnClick).toHaveBeenCalledWith('test-rect');
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
    
    expect(mockOnClick).toHaveBeenCalledWith('test-rect');
    expect(mockOnClick).toHaveBeenCalledTimes(1);
  });
});

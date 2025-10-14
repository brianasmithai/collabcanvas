// Basic render test for CanvasStage component
import React from 'react';
import { render } from '@testing-library/react';
import { vi } from 'vitest';
import { CanvasStage } from '../src/components/CanvasStage';

// Mock react-konva components since they require canvas context
vi.mock('react-konva', () => ({
  Stage: ({ children, ...props }: any) => (
    <div data-testid="konva-stage" {...props}>
      {children}
    </div>
  ),
  Layer: ({ children, ...props }: any) => (
    <div data-testid="konva-layer" {...props}>
      {children}
    </div>
  ),
  Rect: ({ children, ...props }: any) => (
    <div data-testid="konva-rect" {...props}>
      {children}
    </div>
  ),
  Transformer: ({ children, ...props }: any) => (
    <div data-testid="konva-transformer" {...props}>
      {children}
    </div>
  ),
}));

// Mock the RectNode component to avoid Konva node method calls
vi.mock('../src/components/RectNode', () => ({
  RectNode: React.forwardRef(({ rect, isSelected, onClick, onDragEnd }: any, ref: any) => {
    // Create a mock Konva node object with the methods that CanvasStage expects
    const mockNode = {
      x: vi.fn(),
      y: vi.fn(),
      width: vi.fn(),
      height: vi.fn(),
      rotation: vi.fn(),
      scaleX: vi.fn(),
      scaleY: vi.fn(),
    };
    
    // Store the mock node in the ref so CanvasStage can access it
    if (ref) {
      ref(mockNode);
    }
    
    return (
      <div 
        data-testid="rect-node" 
        data-rect-id={rect.id}
        onClick={() => onClick(rect.id)}
      >
        Rect {rect.id}
      </div>
    );
  }),
}));

describe('CanvasStage', () => {
  test('should render without errors', () => {
    const { getByTestId } = render(
      <CanvasStage width={800} height={600} />
    );
    
    expect(getByTestId('konva-stage')).toBeInTheDocument();
    expect(getByTestId('konva-layer')).toBeInTheDocument();
  });

  test('should pass width and height props', () => {
    const { getByTestId } = render(
      <CanvasStage width={1024} height={768} />
    );
    
    const stage = getByTestId('konva-stage');
    expect(stage).toHaveAttribute('width', '1024');
    expect(stage).toHaveAttribute('height', '768');
  });

  test('should have draggable attribute', () => {
    const { getByTestId } = render(
      <CanvasStage width={800} height={600} />
    );
    
    const stage = getByTestId('konva-stage');
    expect(stage).toHaveAttribute('draggable', 'true');
  });
});

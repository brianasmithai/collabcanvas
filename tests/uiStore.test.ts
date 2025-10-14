// Basic tests for UI store functionality
import { useUIStore } from '../src/state/uiStore';

// Simple test to verify store actions work
describe('UI Store', () => {
  test('should initialize with default values', () => {
    const state = useUIStore.getState();
    
    expect(state.toolMode).toBe('select');
    expect(state.viewport.scale).toBe(1);
    expect(state.viewport.x).toBe(0);
    expect(state.viewport.y).toBe(0);
    expect(state.selectionIds).toEqual([]);
  });

  test('should update tool mode', () => {
    const { setToolMode } = useUIStore.getState();
    
    setToolMode('create');
    expect(useUIStore.getState().toolMode).toBe('create');
    
    setToolMode('select');
    expect(useUIStore.getState().toolMode).toBe('select');
  });

  test('should update viewport', () => {
    const { setViewport, updateViewport } = useUIStore.getState();
    
    setViewport({ scale: 2, x: 100, y: 200 });
    const state = useUIStore.getState();
    expect(state.viewport.scale).toBe(2);
    expect(state.viewport.x).toBe(100);
    expect(state.viewport.y).toBe(200);
    
    updateViewport({ scale: 1.5 });
    expect(useUIStore.getState().viewport.scale).toBe(1.5);
    expect(useUIStore.getState().viewport.x).toBe(100); // unchanged
  });

  test('should manage selection', () => {
    const { setSelectionIds, addToSelection, removeFromSelection, clearSelection } = useUIStore.getState();
    
    setSelectionIds(['rect1', 'rect2']);
    expect(useUIStore.getState().selectionIds).toEqual(['rect1', 'rect2']);
    
    addToSelection('rect3');
    expect(useUIStore.getState().selectionIds).toEqual(['rect1', 'rect2', 'rect3']);
    
    removeFromSelection('rect2');
    expect(useUIStore.getState().selectionIds).toEqual(['rect1', 'rect3']);
    
    clearSelection();
    expect(useUIStore.getState().selectionIds).toEqual([]);
  });
});

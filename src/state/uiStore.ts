// Zustand store for UI state management
import { create } from 'zustand';
import type { ToolMode, ViewportState } from '../types';

interface UIState {
  // Tool mode
  toolMode: ToolMode;
  setToolMode: (mode: ToolMode) => void;
  
  // Canvas viewport
  viewport: ViewportState;
  setViewport: (viewport: ViewportState) => void;
  updateViewport: (updates: Partial<ViewportState>) => void;
  
  // Selection
  selectionIds: string[];
  setSelectionIds: (ids: string[]) => void;
  addToSelection: (id: string) => void;
  removeFromSelection: (id: string) => void;
  clearSelection: () => void;
  toggleSelection: (id: string) => void;
  
  // Multi-select mode
  isMultiSelectMode: boolean;
  setIsMultiSelectMode: (enabled: boolean) => void;
  
  // Drag selection
  dragSelection: {
    isActive: boolean;
    startX: number;
    startY: number;
    endX: number;
    endY: number;
  };
  setDragSelection: (dragSelection: UIState['dragSelection']) => void;
  startDragSelection: (x: number, y: number) => void;
  updateDragSelection: (x: number, y: number) => void;
  endDragSelection: () => void;
}

export const useUIStore = create<UIState>((set) => ({
  // Tool mode
  toolMode: 'select',
  setToolMode: (mode) => set({ toolMode: mode }),
  
  // Canvas viewport
  viewport: {
    scale: 1,
    x: 0,
    y: 0,
  },
  setViewport: (viewport) => set({ viewport }),
  updateViewport: (updates) => 
    set((state) => ({ 
      viewport: { ...state.viewport, ...updates } 
    })),
  
  // Selection
  selectionIds: [],
  setSelectionIds: (ids) => set({ selectionIds: ids }),
  addToSelection: (id) => 
    set((state) => ({ 
      selectionIds: [...state.selectionIds, id] 
    })),
  removeFromSelection: (id) => 
    set((state) => ({ 
      selectionIds: state.selectionIds.filter(selectedId => selectedId !== id) 
    })),
  clearSelection: () => set({ selectionIds: [] }),
  toggleSelection: (id) => 
    set((state) => {
      const isSelected = state.selectionIds.includes(id);
      if (isSelected) {
        return { selectionIds: state.selectionIds.filter(selectedId => selectedId !== id) };
      } else {
        return { selectionIds: [...state.selectionIds, id] };
      }
    }),
  
  // Multi-select mode
  isMultiSelectMode: false,
  setIsMultiSelectMode: (enabled) => set({ isMultiSelectMode: enabled }),
  
  // Drag selection
  dragSelection: {
    isActive: false,
    startX: 0,
    startY: 0,
    endX: 0,
    endY: 0,
  },
  setDragSelection: (dragSelection) => set({ dragSelection }),
  startDragSelection: (x, y) => 
    set({ 
      dragSelection: { 
        isActive: true, 
        startX: x, 
        startY: y, 
        endX: x, 
        endY: y 
      } 
    }),
  updateDragSelection: (x, y) => 
    set((state) => ({ 
      dragSelection: { 
        ...state.dragSelection, 
        endX: x, 
        endY: y 
      } 
    })),
  endDragSelection: () => 
    set({ 
      dragSelection: { 
        isActive: false, 
        startX: 0, 
        startY: 0, 
        endX: 0, 
        endY: 0 
      } 
    }),
}));

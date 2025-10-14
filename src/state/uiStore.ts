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
}));

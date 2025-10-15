import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import App from '../src/App';

// Mock Firebase Auth
vi.mock('firebase/auth', () => ({
  onAuthStateChanged: vi.fn((auth, callback) => {
    // Simulate authenticated user
    callback({
      uid: 'test-user-123',
      email: 'test@example.com',
      displayName: 'Test User'
    });
    return () => {}; // unsubscribe function
  }),
  getAuth: vi.fn(() => ({})),
}));

// Mock Firebase config
vi.mock('../src/config/firebaseClient', () => ({
  auth: {},
  firestore: {},
  rtdb: {},
}));

// Mock presence service
vi.mock('../src/services/presence', () => ({
  setInitialPresence: vi.fn().mockResolvedValue(undefined),
  cleanupStalePresence: vi.fn().mockResolvedValue(undefined),
}));

// Mock UI store
vi.mock('../src/state/uiStore', () => ({
  useUIStore: () => ({
    toolMode: 'select',
    viewport: { scale: 1, x: 0, y: 0 },
    selectionIds: [],
  }),
}));

// Mock components
vi.mock('../src/components/CanvasStage', () => ({
  CanvasStage: ({ width, height }: { width: number; height: number }) => (
    <div data-testid="canvas-stage" style={{ width, height }}>
      Canvas Stage
    </div>
  ),
}));

vi.mock('../src/components/PresenceList', () => ({
  PresenceList: () => <div data-testid="presence-list">Presence List</div>,
}));

vi.mock('../src/components/AuthGate', () => ({
  AuthGate: () => <div data-testid="auth-gate">Auth Gate</div>,
}));

vi.mock('../src/components/TopBar', () => ({
  TopBar: () => <div data-testid="top-bar">Top Bar</div>,
}));

describe('App', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should render main app when authenticated', async () => {
    render(<App />);
    
    // Wait for auth to complete
    await new Promise(resolve => setTimeout(resolve, 100));
    
    expect(screen.getByTestId('top-bar')).toBeInTheDocument();
    expect(screen.getByTestId('canvas-stage')).toBeInTheDocument();
    expect(screen.getByTestId('presence-list')).toBeInTheDocument();
  });

  it('should not show debug panel by default', async () => {
    render(<App />);
    
    // Wait for auth to complete
    await new Promise(resolve => setTimeout(resolve, 100));
    
    // Debug panel should not be visible initially
    expect(screen.queryByText('🐛 Debug Info')).not.toBeInTheDocument();
  });

  it('should show instructions panel by default', async () => {
    render(<App />);
    
    // Wait for auth to complete
    await new Promise(resolve => setTimeout(resolve, 100));
    
    // Instructions panel should be visible initially
    expect(screen.getByText('📋 Instructions')).toBeInTheDocument();
    expect(screen.getByText('Press \'I\' to toggle')).toBeInTheDocument();
  });

  it('should toggle debug panel when D key is pressed', async () => {
    render(<App />);
    
    // Wait for auth to complete
    await new Promise(resolve => setTimeout(resolve, 100));
    
    // Initially hidden
    expect(screen.queryByText('🐛 Debug Info')).not.toBeInTheDocument();
    
    // Press 'D' key
    fireEvent.keyDown(document, { key: 'D' });
    
    // Should now be visible
    expect(screen.getByText('🐛 Debug Info')).toBeInTheDocument();
    expect(screen.getByText('Press \'D\' to toggle')).toBeInTheDocument();
    
    // Press 'D' key again
    fireEvent.keyDown(document, { key: 'D' });
    
    // Should be hidden again
    expect(screen.queryByText('🐛 Debug Info')).not.toBeInTheDocument();
  });

  it('should toggle debug panel when lowercase d key is pressed', async () => {
    render(<App />);
    
    // Wait for auth to complete
    await new Promise(resolve => setTimeout(resolve, 100));
    
    // Press lowercase 'd' key
    fireEvent.keyDown(document, { key: 'd' });
    
    // Should be visible
    expect(screen.getByText('🐛 Debug Info')).toBeInTheDocument();
  });

  it('should show debug information when panel is visible', async () => {
    render(<App />);
    
    // Wait for auth to complete
    await new Promise(resolve => setTimeout(resolve, 100));
    
    // Toggle debug panel
    fireEvent.keyDown(document, { key: 'D' });
    
    // Check for debug information
    expect(screen.getByText(/User:/)).toBeInTheDocument();
    expect(screen.getByText(/Canvas:/)).toBeInTheDocument();
    expect(screen.getByText(/Viewport:/)).toBeInTheDocument();
    expect(screen.getByText(/Tool:/)).toBeInTheDocument();
    expect(screen.getByText(/Selection:/)).toBeInTheDocument();
  });

  it('should show instructions in instructions panel', async () => {
    render(<App />);
    
    // Wait for auth to complete
    await new Promise(resolve => setTimeout(resolve, 100));
    
    // Instructions panel should be visible by default
    expect(screen.getByText('📋 Instructions')).toBeInTheDocument();
    expect(screen.getByText((content, element) => {
      return element?.textContent === '• Drag canvas to pan around';
    })).toBeInTheDocument();
    expect(screen.getByText((content, element) => {
      return element?.textContent === '• Mouse wheel to zoom in/out';
    })).toBeInTheDocument();
    expect(screen.getByText((content, element) => {
      return element?.textContent === '• Click rectangles to select them';
    })).toBeInTheDocument();
    expect(screen.getByText((content, element) => {
      return element?.textContent === '• Double-click empty space to create rectangle';
    })).toBeInTheDocument();
    expect(screen.getByText((content, element) => {
      return element?.textContent === '• Press \'N\' to create rectangle at center';
    })).toBeInTheDocument();
    expect(screen.getByText((content, element) => {
      return element?.textContent === '• Drag rectangles to move them';
    })).toBeInTheDocument();
    expect(screen.getByText((content, element) => {
      return element?.textContent === '• Use resize handles to resize/rotate';
    })).toBeInTheDocument();
    expect(screen.getByText((content, element) => {
      return element?.textContent === '• Press Delete/Backspace to delete selected';
    })).toBeInTheDocument();
    expect(screen.getByText('• Press \'I\' to toggle instructions')).toBeInTheDocument();
    expect(screen.getByText('• Press \'D\' to toggle debug info')).toBeInTheDocument();
  });

  it('should toggle instructions panel when I key is pressed', async () => {
    render(<App />);
    
    // Wait for auth to complete
    await new Promise(resolve => setTimeout(resolve, 100));
    
    // Initially visible
    expect(screen.getByText('📋 Instructions')).toBeInTheDocument();
    
    // Press 'I' key
    fireEvent.keyDown(document, { key: 'I' });
    
    // Should now be hidden
    expect(screen.queryByText('📋 Instructions')).not.toBeInTheDocument();
    
    // Press 'I' key again
    fireEvent.keyDown(document, { key: 'I' });
    
    // Should be visible again
    expect(screen.getByText('📋 Instructions')).toBeInTheDocument();
  });

  it('should toggle instructions panel when lowercase i key is pressed', async () => {
    render(<App />);
    
    // Wait for auth to complete
    await new Promise(resolve => setTimeout(resolve, 100));
    
    // Press lowercase 'i' key
    fireEvent.keyDown(document, { key: 'i' });
    
    // Should be hidden
    expect(screen.queryByText('📋 Instructions')).not.toBeInTheDocument();
  });

  it('should not toggle panels for other keys', async () => {
    render(<App />);
    
    // Wait for auth to complete
    await new Promise(resolve => setTimeout(resolve, 100));
    
    // Press other keys
    fireEvent.keyDown(document, { key: 'A' });
    fireEvent.keyDown(document, { key: 'B' });
    fireEvent.keyDown(document, { key: 'C' });
    fireEvent.keyDown(document, { key: 'E' });
    
    // Debug panel should still be hidden
    expect(screen.queryByText('🐛 Debug Info')).not.toBeInTheDocument();
    // Instructions panel should still be visible
    expect(screen.getByText('📋 Instructions')).toBeInTheDocument();
  });
});

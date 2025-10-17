import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { DebugPanel } from '../src/components/DebugPanel';
import { useUIStore } from '../src/state/uiStore';
import { useRectangles } from '../src/hooks/useRectangles';
import { transformService } from '../src/services/transforms';
import { getPerformanceMetrics, getPerformanceSummary, checkPerformanceTargets } from '../src/utils/performance';
import type { User } from 'firebase/auth';

// Mock the hooks and services
vi.mock('../src/state/uiStore');
vi.mock('../src/hooks/useRectangles');
vi.mock('../src/services/transforms');
vi.mock('../src/utils/performance');

const mockUser: User = {
  email: 'test@example.com',
  displayName: 'Test User',
  uid: 'test-uid',
} as User;

const mockDimensions = { width: 800, height: 600 };

describe('DebugPanel', () => {
  const mockCreateRect = vi.fn();
  const mockTestConnection = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    
    // Mock UI store
    (useUIStore as any).mockReturnValue({
      toolMode: 'select',
      viewport: { scale: 1, x: 0, y: 0 },
      selectionIds: ['rect1', 'rect2'],
    });

    // Mock rectangles hook
    (useRectangles as any).mockReturnValue({
      createRect: mockCreateRect,
    });

    // Mock transform service
    (transformService.testConnection as any) = mockTestConnection;
    mockTestConnection.mockResolvedValue(true);

    // Mock performance utilities
    (getPerformanceMetrics as any).mockReturnValue({
      latency: {
        objectSync: 50,
        cursorSync: 25,
        transformSync: 75,
      },
      frameRate: {
        current: 60,
        average: 58,
        min: 45,
      },
      network: {
        connectionStatus: 'connected',
        lastPing: 30,
        packetLoss: 0,
      },
      memory: {
        used: 50,
        total: 100,
      },
      operations: {
        objectsCreated: 5,
        objectsModified: 3,
        transformsProcessed: 10,
        locksAcquired: 2,
      },
    });

    (getPerformanceSummary as any).mockReturnValue(`
Performance Summary:
- Object Sync: 50.0ms
- Cursor Sync: 25.0ms
- Transform Sync: 75.0ms
- Frame Rate: 60.0 FPS (avg: 58.0, min: 45.0)
- Network: connected (ping: 30ms)
- Memory: 50MB / 100MB
- Operations: 5 created, 3 modified, 10 transforms, 2 locks
    `.trim());

    (checkPerformanceTargets as any).mockReturnValue({
      met: true,
      issues: [],
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Basic Rendering', () => {
    it('should render debug panel with user information', () => {
      render(<DebugPanel user={mockUser} dimensions={mockDimensions} showInstructionsPanel={false} />);
      
      expect(screen.getByText('🐛 Debug Info')).toBeInTheDocument();
      expect(screen.getByText(/test@example\.com/)).toBeInTheDocument();
      expect(screen.getByText(/Test User/)).toBeInTheDocument();
    });

    it('should display viewport and canvas information', () => {
      render(<DebugPanel user={mockUser} dimensions={mockDimensions} showInstructionsPanel={false} />);
      
      expect(screen.getByText('800 × 600')).toBeInTheDocument();
      expect(screen.getByText('scale=1.00, x=0, y=0')).toBeInTheDocument();
      expect(screen.getByText('select')).toBeInTheDocument();
      expect(screen.getByText('2 items')).toBeInTheDocument();
    });

    it('should show keyboard shortcuts', () => {
      render(<DebugPanel user={mockUser} dimensions={mockDimensions} showInstructionsPanel={false} />);
      
      expect(screen.getByText(/Press 'I' to toggle instructions/)).toBeInTheDocument();
      expect(screen.getByText(/Press 'D' to toggle debug info/)).toBeInTheDocument();
    });
  });

  describe('Performance Metrics Display', () => {
    it('should display performance metrics', () => {
      render(<DebugPanel user={mockUser} dimensions={mockDimensions} showInstructionsPanel={false} />);
      
      expect(screen.getByText('Performance')).toBeInTheDocument();
      expect(screen.getByText('60.0')).toBeInTheDocument(); // FPS
      expect(screen.getByText('50.0ms')).toBeInTheDocument(); // Object sync
      expect(screen.getByText('connected')).toBeInTheDocument(); // Network status
    });

    it('should show performance targets status', () => {
      render(<DebugPanel user={mockUser} dimensions={mockDimensions} showInstructionsPanel={false} />);
      
      // Should show green checkmark when targets are met
      expect(screen.getByText('✅')).toBeInTheDocument();
    });

    it('should show performance issues when targets are not met', () => {
      (checkPerformanceTargets as any).mockReturnValue({
        met: false,
        issues: ['Object sync latency too high: 150.0ms (target: <100ms)'],
      });

      render(<DebugPanel user={mockUser} dimensions={mockDimensions} showInstructionsPanel={false} />);
      
      expect(screen.getByText('⚠️')).toBeInTheDocument();
    });

    it('should toggle performance details', () => {
      render(<DebugPanel user={mockUser} dimensions={mockDimensions} showInstructionsPanel={false} />);
      
      const showDetailsButton = screen.getByText('Show Details');
      expect(showDetailsButton).toBeInTheDocument();
      
      fireEvent.click(showDetailsButton);
      expect(screen.getByText('Hide Details')).toBeInTheDocument();
    });

    it('should display detailed performance metrics when expanded', () => {
      render(<DebugPanel user={mockUser} dimensions={mockDimensions} showInstructionsPanel={false} />);
      
      fireEvent.click(screen.getByText('Show Details'));
      
      expect(screen.getByText('50MB / 100MB')).toBeInTheDocument(); // Memory
      expect(screen.getByText('5 created, 10 transforms')).toBeInTheDocument(); // Operations
      expect(screen.getByText('45.0')).toBeInTheDocument(); // Min FPS
    });
  });

  describe('Bulk Creation Tools', () => {
    it('should render bulk creation controls', () => {
      render(<DebugPanel user={mockUser} dimensions={mockDimensions} showInstructionsPanel={false} />);
      
      expect(screen.getByText('🚀 Bulk Creation Tools')).toBeInTheDocument();
      expect(screen.getByDisplayValue('10')).toBeInTheDocument(); // Default count
      expect(screen.getByText('objects')).toBeInTheDocument();
      expect(screen.getByText('Create')).toBeInTheDocument();
    });

    it('should allow changing bulk count', () => {
      render(<DebugPanel user={mockUser} dimensions={mockDimensions} showInstructionsPanel={false} />);
      
      const countInput = screen.getByDisplayValue('10');
      fireEvent.change(countInput, { target: { value: '25' } });
      
      expect(countInput).toHaveValue(25);
    });

    it('should enforce count limits', () => {
      render(<DebugPanel user={mockUser} dimensions={mockDimensions} showInstructionsPanel={false} />);
      
      const countInput = screen.getByDisplayValue('10');
      
      // Test minimum limit
      fireEvent.change(countInput, { target: { value: '0' } });
      expect(countInput).toHaveValue(1);
      
      // Test maximum limit
      fireEvent.change(countInput, { target: { value: '2000' } });
      expect(countInput).toHaveValue(1000);
    });

    it('should create bulk rectangles when create button is clicked', async () => {
      mockCreateRect.mockResolvedValue('new-rect-id');
      
      render(<DebugPanel user={mockUser} dimensions={mockDimensions} showInstructionsPanel={false} />);
      
      const createButton = screen.getByText('Create');
      fireEvent.click(createButton);
      
      await waitFor(() => {
        expect(mockCreateRect).toHaveBeenCalledTimes(10); // Default count
      });
    });

    it('should create specified number of rectangles', async () => {
      mockCreateRect.mockResolvedValue('new-rect-id');
      
      render(<DebugPanel user={mockUser} dimensions={mockDimensions} showInstructionsPanel={false} />);
      
      // Change count to 5
      const countInput = screen.getByDisplayValue('10');
      fireEvent.change(countInput, { target: { value: '5' } });
      
      const createButton = screen.getByText('Create');
      fireEvent.click(createButton);
      
      await waitFor(() => {
        expect(mockCreateRect).toHaveBeenCalledTimes(5);
      });
    });

    it('should show bulk creation description', () => {
      render(<DebugPanel user={mockUser} dimensions={mockDimensions} showInstructionsPanel={false} />);
      
      expect(screen.getByText('Creates 10 rectangles with random positions and sizes for performance testing.')).toBeInTheDocument();
    });
  });

  describe('Connection Testing', () => {
    it('should render RTDB connection test button', () => {
      render(<DebugPanel user={mockUser} dimensions={mockDimensions} showInstructionsPanel={false} />);
      
      expect(screen.getByText('🧪 Test RTDB Connection')).toBeInTheDocument();
    });

    it('should test connection and show success message', async () => {
      mockTestConnection.mockResolvedValue(true);
      
      // Mock window.alert
      const mockAlert = vi.spyOn(window, 'alert').mockImplementation(() => {});
      
      render(<DebugPanel user={mockUser} dimensions={mockDimensions} showInstructionsPanel={false} />);
      
      const testButton = screen.getByText('🧪 Test RTDB Connection');
      fireEvent.click(testButton);
      
      await waitFor(() => {
        expect(mockTestConnection).toHaveBeenCalled();
        expect(mockAlert).toHaveBeenCalledWith('✅ RTDB connection test successful! Check console for details.');
      });
      
      mockAlert.mockRestore();
    });

    it('should show error message when connection test fails', async () => {
      mockTestConnection.mockResolvedValue(false);
      
      const mockAlert = vi.spyOn(window, 'alert').mockImplementation(() => {});
      
      render(<DebugPanel user={mockUser} dimensions={mockDimensions} showInstructionsPanel={false} />);
      
      const testButton = screen.getByText('🧪 Test RTDB Connection');
      fireEvent.click(testButton);
      
      await waitFor(() => {
        expect(mockAlert).toHaveBeenCalledWith('❌ RTDB connection test failed! Check console for details.');
      });
      
      mockAlert.mockRestore();
    });
  });

  describe('Performance Summary', () => {
    it('should render performance summary button', () => {
      render(<DebugPanel user={mockUser} dimensions={mockDimensions} showInstructionsPanel={false} />);
      
      expect(screen.getByText('📊 Performance Summary')).toBeInTheDocument();
    });

    it('should show performance summary when clicked', async () => {
      const mockAlert = vi.spyOn(window, 'alert').mockImplementation(() => {});
      
      render(<DebugPanel user={mockUser} dimensions={mockDimensions} showInstructionsPanel={false} />);
      
      const summaryButton = screen.getByText('📊 Performance Summary');
      fireEvent.click(summaryButton);
      
      await waitFor(() => {
        expect(getPerformanceSummary).toHaveBeenCalled();
        expect(mockAlert).toHaveBeenCalled();
      });
      
      mockAlert.mockRestore();
    });
  });

  describe('Layout and Styling', () => {
    it('should adjust position based on instructions panel visibility', () => {
      const { rerender } = render(
        <DebugPanel user={mockUser} dimensions={mockDimensions} showInstructionsPanel={false} />
      );
      
      let debugPanel = screen.getByText('🐛 Debug Info').closest('div')?.parentElement?.parentElement;
      expect(debugPanel).toHaveStyle({ top: '70px' });
      
      rerender(<DebugPanel user={mockUser} dimensions={mockDimensions} showInstructionsPanel={true} />);
      
      debugPanel = screen.getByText('🐛 Debug Info').closest('div')?.parentElement?.parentElement;
      expect(debugPanel).toHaveStyle({ top: '350px' });
    });

    it('should have proper styling classes', () => {
      render(<DebugPanel user={mockUser} dimensions={mockDimensions} showInstructionsPanel={false} />);
      
      const debugPanel = screen.getByText('🐛 Debug Info').closest('div')?.parentElement?.parentElement;
      expect(debugPanel).toHaveStyle({
        position: 'absolute',
        zIndex: '1000'
      });
    });
  });

  describe('Error Handling', () => {
    it('should handle createRectangle errors gracefully', async () => {
      mockCreateRect.mockRejectedValue(new Error('Creation failed'));
      
      // Mock console.error to avoid noise in tests
      const mockConsoleError = vi.spyOn(console, 'error').mockImplementation(() => {});
      
      render(<DebugPanel user={mockUser} dimensions={mockDimensions} showInstructionsPanel={false} />);
      
      const createButton = screen.getByText('Create');
      fireEvent.click(createButton);
      
      await waitFor(() => {
        expect(mockCreateRect).toHaveBeenCalled();
      });
      
      mockConsoleError.mockRestore();
    });

    it('should handle connection test errors gracefully', async () => {
      mockTestConnection.mockRejectedValue(new Error('Connection failed'));
      
      const mockAlert = vi.spyOn(window, 'alert').mockImplementation(() => {});
      const mockConsoleError = vi.spyOn(console, 'error').mockImplementation(() => {});
      
      render(<DebugPanel user={mockUser} dimensions={mockDimensions} showInstructionsPanel={false} />);
      
      const testButton = screen.getByText('🧪 Test RTDB Connection');
      fireEvent.click(testButton);
      
      await waitFor(() => {
        expect(mockAlert).toHaveBeenCalledWith('❌ RTDB connection test failed! Check console for details.');
      });
      
      mockAlert.mockRestore();
      mockConsoleError.mockRestore();
    });
  });

  describe('Accessibility', () => {
    it('should have proper button labels', () => {
      render(<DebugPanel user={mockUser} dimensions={mockDimensions} showInstructionsPanel={false} />);
      
      expect(screen.getByText('Create')).toBeInTheDocument();
      expect(screen.getByText('🧪 Test RTDB Connection')).toBeInTheDocument();
      expect(screen.getByText('📊 Performance Summary')).toBeInTheDocument();
    });

    it('should have proper input labels and constraints', () => {
      render(<DebugPanel user={mockUser} dimensions={mockDimensions} showInstructionsPanel={false} />);
      
      const countInput = screen.getByDisplayValue('10');
      expect(countInput).toHaveAttribute('type', 'number');
      expect(countInput).toHaveAttribute('min', '1');
      expect(countInput).toHaveAttribute('max', '1000');
    });
  });
});

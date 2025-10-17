import React from 'react';
import { useUIStore } from '../state/uiStore';
import { transformService } from '../services/transforms';
import type { User } from 'firebase/auth';

interface DebugPanelProps {
  user: User;
  dimensions: { width: number; height: number };
  showInstructionsPanel: boolean;
}

export const DebugPanel: React.FC<DebugPanelProps> = ({ user, dimensions, showInstructionsPanel }) => {
  const { toolMode, viewport, selectionIds } = useUIStore();

  return (
    <div style={{ 
      position: 'absolute', 
      top: showInstructionsPanel ? '350px' : '70px', 
      left: '10px', 
      zIndex: 1000, 
      background: 'rgba(255, 255, 255, 0.95)', 
      padding: '16px', 
      border: '1px solid #ddd', 
      borderRadius: '8px',
      boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
      backdropFilter: 'blur(10px)',
      minWidth: '280px',
      fontFamily: 'system-ui, -apple-system, sans-serif'
    }}>
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        marginBottom: '12px',
        borderBottom: '1px solid #eee',
        paddingBottom: '8px'
      }}>
        <div style={{ fontWeight: '600', color: '#333', fontSize: '14px' }}>
          🐛 Debug Info
        </div>
        <div style={{ 
          fontSize: '11px', 
          color: '#666', 
          background: '#f5f5f5', 
          padding: '2px 6px', 
          borderRadius: '4px' 
        }}>
          Press 'D' to toggle
        </div>
      </div>
      
      <div style={{ fontSize: '13px', lineHeight: '1.4', color: '#000', textAlign: 'left' }}>
        <div style={{ marginBottom: '8px' }}>
          <strong>User:</strong> {user.email} ({user.displayName || 'No display name'})
        </div>
        <div style={{ marginBottom: '8px' }}>
          <strong>Viewport:</strong> {dimensions.width} × {dimensions.height}
        </div>
        <div style={{ marginBottom: '8px' }}>
          <strong>Canvas:</strong> scale={viewport.scale.toFixed(2)}, x={viewport.x.toFixed(0)}, y={viewport.y.toFixed(0)}
        </div>
        <div style={{ marginBottom: '8px' }}>
          <strong>Tool:</strong> {toolMode}
        </div>
        <div style={{ marginBottom: '8px' }}>
          <strong>Selection:</strong> {selectionIds.length} items
        </div>
      </div>
      
      <div style={{ 
        marginTop: '12px', 
        paddingTop: '12px',
        borderTop: '1px solid #eee',
        fontSize: '12px', 
        color: '#888',
        lineHeight: '1.5'
      }}>
        <div>• Press 'I' to toggle instructions</div>
        <div>• Press 'D' to toggle debug info</div>
      </div>
      
      <div style={{ 
        marginTop: '12px', 
        paddingTop: '12px',
        borderTop: '1px solid #eee'
      }}>
        <button 
          onClick={async () => {
            console.log('🧪 Testing RTDB connection...');
            const success = await transformService.testConnection();
            if (success) {
              alert('✅ RTDB connection test successful! Check console for details.');
            } else {
              alert('❌ RTDB connection test failed! Check console for details.');
            }
          }}
          style={{
            background: '#007bff',
            color: 'white',
            border: 'none',
            padding: '8px 12px',
            borderRadius: '4px',
            fontSize: '12px',
            cursor: 'pointer',
            width: '100%'
          }}
        >
          🧪 Test RTDB Connection
        </button>
      </div>
    </div>
  );
};



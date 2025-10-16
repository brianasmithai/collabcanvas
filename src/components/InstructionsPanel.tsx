import React from 'react';

export const InstructionsPanel: React.FC = () => {
  return (
    <div style={{ 
      position: 'absolute', 
      top: 70, 
      left: 10, 
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
          📋 Instructions
        </div>
        <div style={{ 
          fontSize: '11px', 
          color: '#666', 
          background: '#f5f5f5', 
          padding: '2px 6px', 
          borderRadius: '4px' 
        }}>
          Press 'I' to toggle
        </div>
      </div>
      
      <div style={{ 
        fontSize: '12px', 
        color: '#555',
        lineHeight: '1.5',
        textAlign: 'left'
      }}>
        <div>• <strong>Drag canvas</strong> to pan around</div>
        <div>• <strong>Mouse wheel</strong> to zoom in/out</div>
        <div>• <strong>Click rectangles</strong> to select them</div>
        <div>• <strong>Double-click empty space</strong> to create rectangle</div>
        <div>• <strong>Press 'N'</strong> to create rectangle at center</div>
        <div>• <strong>Drag rectangles</strong> to move them</div>
        <div>• <strong>Use resize handles</strong> to resize/rotate</div>
        <div>• <strong>Press Delete/Backspace</strong> to delete selected</div>
        <div style={{ marginTop: '8px', paddingTop: '8px', borderTop: '1px solid #eee', color: '#888', textAlign: 'center' }}>
          • Press 'I' to toggle instructions
        </div>
        <div style={{ color: '#888', textAlign: 'center' }}>
          • Press 'D' to toggle debug info
        </div>
      </div>
    </div>
  );
};



import React, { useState, useEffect } from 'react';
import { useUIStore } from '../state/uiStore';
import { transformService } from '../services/transforms';
import { getPerformanceMetrics, getPerformanceSummary, checkPerformanceTargets, incrementOperation } from '../utils/performance';
import { useRectangles } from '../hooks/useRectangles';
import type { User } from 'firebase/auth';

interface DebugPanelProps {
  user: User;
  dimensions: { width: number; height: number };
  showInstructionsPanel: boolean;
}

export const DebugPanel: React.FC<DebugPanelProps> = ({ user, dimensions, showInstructionsPanel }) => {
  const { toolMode, viewport, selectionIds } = useUIStore();
  const { createRect } = useRectangles();
  const [performanceMetrics, setPerformanceMetrics] = useState(getPerformanceMetrics());
  const [bulkCount, setBulkCount] = useState(10);
  const [showPerformanceDetails, setShowPerformanceDetails] = useState(false);
  const [performanceTargets, setPerformanceTargets] = useState(checkPerformanceTargets());

  // Update performance metrics every second
  useEffect(() => {
    const interval = setInterval(() => {
      setPerformanceMetrics(getPerformanceMetrics());
      setPerformanceTargets(checkPerformanceTargets());
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  const handleBulkCreate = async () => {
    console.log(`🚀 Creating ${bulkCount} rectangles for performance testing...`);
    const startTime = performance.now();
    
    try {
      for (let i = 0; i < bulkCount; i++) {
        const x = Math.random() * (dimensions.width - 100);
        const y = Math.random() * (dimensions.height - 100);
        const width = 50 + Math.random() * 100;
        const height = 50 + Math.random() * 100;
        
        await createRect({ x, y, width, height, rotation: 0, updatedAt: Date.now(), updatedBy: 'bulk-creation' });
        incrementOperation('objectsCreated');
      }
      
      const endTime = performance.now();
      const duration = endTime - startTime;
      console.log(`✅ Created ${bulkCount} rectangles in ${duration.toFixed(1)}ms (${(bulkCount / duration * 1000).toFixed(1)} objects/sec)`);
    } catch (error) {
      console.error('❌ Failed to create rectangles:', error);
    }
  };

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
        
        {/* Performance Metrics */}
        <div style={{ 
          marginTop: '12px', 
          paddingTop: '12px',
          borderTop: '1px solid #eee'
        }}>
          <div style={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center',
            marginBottom: '8px'
          }}>
            <strong>Performance</strong>
            <button
              onClick={() => setShowPerformanceDetails(!showPerformanceDetails)}
              style={{
                background: 'none',
                border: '1px solid #ddd',
                borderRadius: '4px',
                padding: '2px 6px',
                fontSize: '10px',
                cursor: 'pointer'
              }}
            >
              {showPerformanceDetails ? 'Hide' : 'Show'} Details
            </button>
          </div>
          
          <div style={{ marginBottom: '4px' }}>
            <span style={{ color: performanceTargets.met ? '#28a745' : '#dc3545' }}>
              {performanceTargets.met ? '✅' : '⚠️'}
            </span>
            <strong> FPS:</strong> {performanceMetrics.frameRate.current.toFixed(1)}
            <span style={{ fontSize: '11px', color: '#666' }}>
              {' '}(avg: {performanceMetrics.frameRate.average.toFixed(1)})
            </span>
          </div>
          
          <div style={{ marginBottom: '4px' }}>
            <strong>Sync:</strong> 
            <span style={{ color: performanceMetrics.latency.objectSync > 100 ? '#dc3545' : '#28a745' }}>
              {' '}{performanceMetrics.latency.objectSync.toFixed(1)}ms
            </span>
            <span style={{ fontSize: '11px', color: '#666' }}>
              {' '}(target: &lt;100ms)
            </span>
          </div>
          
          <div style={{ marginBottom: '4px' }}>
            <strong>Network:</strong> 
            <span style={{ 
              color: performanceMetrics.network.connectionStatus === 'connected' ? '#28a745' : '#dc3545' 
            }}>
              {' '}{performanceMetrics.network.connectionStatus}
            </span>
            {performanceMetrics.network.lastPing > 0 && (
              <span style={{ fontSize: '11px', color: '#666' }}>
                {' '}({performanceMetrics.network.lastPing}ms)
              </span>
            )}
          </div>
          
          {showPerformanceDetails && (
            <div style={{ 
              marginTop: '8px', 
              padding: '8px', 
              background: '#f8f9fa', 
              borderRadius: '4px',
              fontSize: '11px',
              lineHeight: '1.3'
            }}>
              <div><strong>Memory:</strong> {performanceMetrics.memory.used}MB / {performanceMetrics.memory.total}MB</div>
              <div><strong>Operations:</strong> {performanceMetrics.operations.objectsCreated} created, {performanceMetrics.operations.transformsProcessed} transforms</div>
              <div><strong>Min FPS:</strong> {performanceMetrics.frameRate.min.toFixed(1)}</div>
              {performanceTargets.issues.length > 0 && (
                <div style={{ marginTop: '4px', color: '#dc3545' }}>
                  <strong>Issues:</strong>
                  {performanceTargets.issues.map((issue, i) => (
                    <div key={i} style={{ fontSize: '10px' }}>• {issue}</div>
                  ))}
                </div>
              )}
            </div>
          )}
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
        {/* Bulk Creation Tools */}
        <div style={{ marginBottom: '12px' }}>
          <div style={{ 
            fontSize: '12px', 
            fontWeight: '600', 
            marginBottom: '8px',
            color: '#333'
          }}>
            🚀 Bulk Creation Tools
          </div>
          
          <div style={{ 
            display: 'flex', 
            gap: '8px', 
            alignItems: 'center',
            marginBottom: '8px'
          }}>
            <input
              type="number"
              value={bulkCount}
              onChange={(e) => setBulkCount(Math.max(1, Math.min(1000, parseInt(e.target.value) || 1)))}
              style={{
                width: '60px',
                padding: '4px 6px',
                border: '1px solid #ddd',
                borderRadius: '4px',
                fontSize: '12px'
              }}
              min="1"
              max="1000"
            />
            <span style={{ fontSize: '12px', color: '#666' }}>objects</span>
            <button
              onClick={handleBulkCreate}
              style={{
                background: '#28a745',
                color: 'white',
                border: 'none',
                padding: '4px 8px',
                borderRadius: '4px',
                fontSize: '11px',
                cursor: 'pointer',
                flex: 1
              }}
            >
              Create
            </button>
          </div>
          
          <div style={{ fontSize: '10px', color: '#666', lineHeight: '1.3' }}>
            Creates {bulkCount} rectangles with random positions and sizes for performance testing.
          </div>
        </div>
        
        {/* Connection Test */}
        <button 
          onClick={async () => {
            console.log('🧪 Testing RTDB connection...');
            try {
              const success = await transformService.testConnection();
              if (success) {
                alert('✅ RTDB connection test successful! Check console for details.');
              } else {
                alert('❌ RTDB connection test failed! Check console for details.');
              }
            } catch (error) {
              console.error('❌ RTDB connection test error:', error);
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
            width: '100%',
            marginBottom: '8px'
          }}
        >
          🧪 Test RTDB Connection
        </button>
        
        {/* Performance Summary */}
        <button
          onClick={() => {
            const summary = getPerformanceSummary();
            console.log('📊 Performance Summary:', summary);
            alert(summary);
          }}
          style={{
            background: '#6c757d',
            color: 'white',
            border: 'none',
            padding: '8px 12px',
            borderRadius: '4px',
            fontSize: '12px',
            cursor: 'pointer',
            width: '100%'
          }}
        >
          📊 Performance Summary
        </button>
      </div>
    </div>
  );
};



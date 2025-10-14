import { useState, useEffect } from 'react'
import './App.css'
import { useUIStore } from './state/uiStore'
import { CanvasStage } from './components/CanvasStage'
import { PresenceList } from './components/PresenceList'

function App() {
  const [dimensions, setDimensions] = useState({ width: 800, height: 600 })
  
  // Consume UI store for compile-time sanity
  const { toolMode, viewport, selectionIds } = useUIStore()
  
  // TODO: Get current user ID from Firebase Auth when auth is implemented
  const currentUserId = 'local-user' // Placeholder for now
  
  // Log store values to console for verification (remove in production)
  console.log('UI Store state:', { toolMode, viewport, selectionIds })

  // Handle window resize
  useEffect(() => {
    const handleResize = () => {
      setDimensions({
        width: window.innerWidth,
        height: window.innerHeight,
      })
    }

    handleResize() // Set initial dimensions
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  return (
    <div style={{ width: '100vw', height: '100vh', overflow: 'hidden', backgroundColor: '#e0e0e0' }}>
      {/* Debug info panel */}
      <div style={{ position: 'absolute', top: 10, left: 10, zIndex: 1000, background: 'white', padding: '10px', border: '1px solid #ccc', borderRadius: '5px' }}>
        <div><strong>Canvas Debug Info:</strong></div>
        <div>Canvas: {dimensions.width} x {dimensions.height}</div>
        <div>Viewport: scale={viewport.scale.toFixed(2)}, x={viewport.x.toFixed(0)}, y={viewport.y.toFixed(0)}</div>
        <div>Tool: {toolMode}</div>
        <div>Selection: {selectionIds.length} items</div>
        <div style={{ marginTop: '10px', fontSize: '12px', color: '#666' }}>
          <div>• Drag to pan around the canvas</div>
          <div>• Mouse wheel to zoom in/out</div>
          <div>• Click rectangles to select them</div>
          <div>• Double-click empty space to create rectangle</div>
          <div>• Press 'N' to create rectangle at center</div>
          <div>• Drag rectangles to move them</div>
          <div>• Use resize handles to resize/rotate</div>
          <div>• Press Delete/Backspace to delete selected</div>
        </div>
      </div>
      
      {/* Presence list */}
      <div style={{ position: 'absolute', top: 10, right: 10, zIndex: 1000 }}>
        <PresenceList currentUserId={currentUserId} />
      </div>
      
      {/* Canvas stage */}
      <CanvasStage 
        width={dimensions.width} 
        height={dimensions.height} 
        currentUserId={currentUserId}
      />
    </div>
  )
}

export default App

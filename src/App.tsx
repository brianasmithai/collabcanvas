import { useState, useEffect } from 'react'
import './App.css'
import { useUIStore } from './state/uiStore'
import { CanvasStage } from './components/CanvasStage'

function App() {
  const [dimensions, setDimensions] = useState({ width: 800, height: 600 })
  
  // Consume UI store for compile-time sanity
  const { toolMode, viewport, selectionIds } = useUIStore()
  
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
      <div style={{ position: 'absolute', top: 10, left: 10, zIndex: 1000, background: 'white', padding: '10px', border: '1px solid #ccc', borderRadius: '5px' }}>
        <div><strong>Canvas Debug Info:</strong></div>
        <div>Canvas: {dimensions.width} x {dimensions.height}</div>
        <div>Viewport: scale={viewport.scale.toFixed(2)}, x={viewport.x.toFixed(0)}, y={viewport.y.toFixed(0)}</div>
        <div>Tool: {toolMode}</div>
        <div>Selection: {selectionIds.length} items</div>
        <div style={{ marginTop: '10px', fontSize: '12px', color: '#666' }}>
          <div>• Drag to pan around the canvas</div>
          <div>• Mouse wheel to zoom in/out</div>
          <div>• You should see colored rectangles on the canvas</div>
        </div>
      </div>
      <CanvasStage width={dimensions.width} height={dimensions.height} />
    </div>
  )
}

export default App

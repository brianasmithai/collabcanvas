import { useState, useEffect } from 'react'
import { onAuthStateChanged, type User } from 'firebase/auth'
import { auth } from './config/firebaseClient'
import { setInitialPresence } from './services/presence'
import './App.css'
import { useUIStore } from './state/uiStore'
import { CanvasStage } from './components/CanvasStage'
import { PresenceList } from './components/PresenceList'
import { AuthGate } from './components/AuthGate'

function App() {
  const [dimensions, setDimensions] = useState({ width: 800, height: 600 })
  const [user, setUser] = useState<User | null>(null)
  const [authLoading, setAuthLoading] = useState(true)
  
  // Consume UI store for compile-time sanity
  const { toolMode, viewport, selectionIds } = useUIStore()
  
  // Get current user ID from Firebase Auth
  const currentUserId = user?.uid || null
  
  // Log store values to console for verification (remove in production)
  console.log('UI Store state:', { toolMode, viewport, selectionIds })
  console.log('Auth state:', { user: user?.email, uid: currentUserId })

  // Handle auth state changes
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setUser(user)
      setAuthLoading(false)
      
      // Set initial presence when user logs in
      if (user) {
        try {
          const displayName = user.displayName || user.email?.split('@')[0] || 'User'
          await setInitialPresence(user.uid, displayName)
          console.log('Initial presence set for user:', displayName)
        } catch (error) {
          console.error('Failed to set initial presence:', error)
        }
      }
    })

    return () => unsubscribe()
  }, [])

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

  // Handle successful authentication
  const handleAuthSuccess = async (user: User) => {
    setUser(user)
    console.log('User authenticated:', user.email, user.displayName)
    
    // Set initial presence for the user
    try {
      const displayName = user.displayName || user.email?.split('@')[0] || 'User'
      await setInitialPresence(user.uid, displayName)
      console.log('Initial presence set for user:', displayName)
    } catch (error) {
      console.error('Failed to set initial presence:', error)
    }
  }

  // Show loading state while checking auth
  if (authLoading) {
    return (
      <div style={{ 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center', 
        height: '100vh',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
      }}>
        <div style={{ 
          background: 'white', 
          padding: '40px', 
          borderRadius: '12px',
          textAlign: 'center',
          boxShadow: '0 10px 30px rgba(0, 0, 0, 0.2)'
        }}>
          <h2 style={{ margin: '0 0 16px 0', color: '#333' }}>CollabCanvas</h2>
          <p style={{ margin: 0, color: '#666' }}>Loading...</p>
        </div>
      </div>
    )
  }

  // Show auth gate if not authenticated
  if (!user) {
    return <AuthGate onAuthSuccess={handleAuthSuccess} />
  }

  // Show main app if authenticated
  return (
    <div style={{ width: '100vw', height: '100vh', overflow: 'hidden', backgroundColor: '#e0e0e0' }}>
      {/* Debug info panel */}
      <div style={{ position: 'absolute', top: 10, left: 10, zIndex: 1000, background: 'white', padding: '10px', border: '1px solid #ccc', borderRadius: '5px' }}>
        <div><strong>Canvas Debug Info:</strong></div>
        <div>User: {user.email} ({user.displayName || 'No display name'})</div>
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
        <PresenceList currentUserId={currentUserId || undefined} />
      </div>
      
      {/* Canvas stage */}
      <CanvasStage 
        width={dimensions.width} 
        height={dimensions.height} 
        currentUserId={currentUserId || undefined}
      />
    </div>
  )
}

export default App

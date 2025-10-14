import { useState, useEffect } from 'react'
import { onAuthStateChanged, type User } from 'firebase/auth'
import { auth } from './config/firebaseClient'
import { setInitialPresence, cleanupStalePresence } from './services/presence'
import './App.css'
import { useUIStore } from './state/uiStore'
import { CanvasStage } from './components/CanvasStage'
import { PresenceList } from './components/PresenceList'
import { AuthGate } from './components/AuthGate'
import { TopBar } from './components/TopBar'

function App() {
  const [dimensions, setDimensions] = useState({ width: 800, height: 600 })
  const [user, setUser] = useState<User | null>(null)
  const [authLoading, setAuthLoading] = useState(true)
  const [showDebugPanel, setShowDebugPanel] = useState(false)
  const [showInstructionsPanel, setShowInstructionsPanel] = useState(true)
  
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
          console.log('Setting initial presence for user:', { 
            uid: user.uid, 
            email: user.email, 
            displayName: user.displayName, 
            computedName: displayName 
          })
          await setInitialPresence(user.uid, displayName)
          console.log('Initial presence set for user:', displayName)
        } catch (error) {
          console.error('Failed to set initial presence:', error)
        }
      } else {
        // User signed out - clean up any remaining presence
        // Note: This is a backup cleanup, the main cleanup happens in TopBar
        console.log('User signed out, auth state changed to null')
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

  // Periodic cleanup of stale presence entries
  useEffect(() => {
    if (!user) return; // Only run cleanup when user is authenticated
    
    const cleanupInterval = setInterval(async () => {
      try {
        await cleanupStalePresence()
      } catch (error) {
        console.error('Failed to cleanup stale presence:', error)
      }
    }, 120000) // Run cleanup every 2 minutes

    return () => clearInterval(cleanupInterval)
  }, [user])

  // Handle keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Toggle debug panel with 'D' key
      if (e.key === 'd' || e.key === 'D') {
        e.preventDefault()
        setShowDebugPanel(prev => !prev)
      }
      // Toggle instructions panel with 'I' key
      if (e.key === 'i' || e.key === 'I') {
        e.preventDefault()
        setShowInstructionsPanel(prev => !prev)
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])

  // Handle successful authentication
  const handleAuthSuccess = async (user: User) => {
    setUser(user)
    console.log('User authenticated:', user.email, user.displayName)
    
    // Set initial presence for the user
    try {
      const displayName = user.displayName || user.email?.split('@')[0] || 'User'
      console.log('Setting initial presence for user (handleAuthSuccess):', { 
        uid: user.uid, 
        email: user.email, 
        displayName: user.displayName, 
        computedName: displayName 
      })
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
      {/* Top Bar */}
      <TopBar 
        userEmail={user.email || undefined}
        userDisplayName={user.displayName || undefined}
      />
      
      {/* Instructions panel - toggleable with 'I' key */}
      {showInstructionsPanel && (
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
            lineHeight: '1.5'
          }}>
            <div>• Drag to pan around the canvas</div>
            <div>• Mouse wheel to zoom in/out</div>
            <div>• Click rectangles to select them</div>
            <div>• Double-click empty space to create rectangle</div>
            <div>• Press 'N' to create rectangle at center</div>
            <div>• Drag rectangles to move them</div>
            <div>• Use resize handles to resize/rotate</div>
            <div>• Press Delete/Backspace to delete selected</div>
            <div style={{ marginTop: '8px', paddingTop: '8px', borderTop: '1px solid #eee', color: '#888' }}>
              • Press 'I' to toggle instructions
            </div>
            <div style={{ color: '#888' }}>
              • Press 'D' to toggle debug info
            </div>
          </div>
        </div>
      )}

      {/* Debug info panel - toggleable with 'D' key */}
      {showDebugPanel && (
        <div style={{ 
          position: 'absolute', 
          top: 70, 
          left: showInstructionsPanel ? '310px' : '10px', 
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
          
          <div style={{ fontSize: '13px', lineHeight: '1.4' }}>
            <div style={{ marginBottom: '8px' }}>
              <strong>User:</strong> {user.email} ({user.displayName || 'No display name'})
            </div>
            <div style={{ marginBottom: '8px' }}>
              <strong>Canvas:</strong> {dimensions.width} × {dimensions.height}
            </div>
            <div style={{ marginBottom: '8px' }}>
              <strong>Viewport:</strong> scale={viewport.scale.toFixed(2)}, x={viewport.x.toFixed(0)}, y={viewport.y.toFixed(0)}
            </div>
            <div style={{ marginBottom: '8px' }}>
              <strong>Tool:</strong> {toolMode}
            </div>
            <div style={{ marginBottom: '8px' }}>
              <strong>Selection:</strong> {selectionIds.length} items
            </div>
          </div>
        </div>
      )}
      
      {/* Presence list */}
      <div style={{ position: 'absolute', top: 70, right: 10, zIndex: 1000 }}>
        <PresenceList currentUserId={currentUserId || undefined} />
      </div>
      
      {/* Canvas stage */}
      <CanvasStage 
        width={dimensions.width} 
        height={dimensions.height - 60} 
        currentUserId={currentUserId || undefined}
      />
    </div>
  )
}

export default App

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
import { InstructionsPanel } from './components/InstructionsPanel'
import { DebugPanel } from './components/DebugPanel'
import { useGlobalKeyboardShortcuts } from './hooks/useGlobalKeyboardShortcuts'

function App() {
  const [dimensions, setDimensions] = useState({ width: 800, height: 600 })
  const [user, setUser] = useState<User | null>(null)
  const [authLoading, setAuthLoading] = useState(true)
  const [showDebugPanel, setShowDebugPanel] = useState(false)
  const [showInstructionsPanel, setShowInstructionsPanel] = useState(true)
  
  // Consume UI store for compile-time sanity
  const { toolMode, viewport, selectionIds } = useUIStore();
  // Suppress unused variable warnings for now - these will be used in future PRs
  console.log('UI Store values:', { toolMode, viewport, selectionIds });
  
  // Get current user ID from Firebase Auth
  const currentUserId = user?.uid || null
  
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

  useGlobalKeyboardShortcuts({ setShowDebugPanel, setShowInstructionsPanel });

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
    return <AuthGate onAuthSuccess={setUser} />
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
      {showInstructionsPanel && <InstructionsPanel />}

      {/* Debug info panel - toggleable with 'D' key */}
      {showDebugPanel && (
        <DebugPanel
          user={user}
          dimensions={dimensions}
          showInstructionsPanel={showInstructionsPanel}
        />
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

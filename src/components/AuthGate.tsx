// Authentication Gate component for login/register
import React, { useState } from 'react';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword, updateProfile } from 'firebase/auth';
import { auth } from '../config/firebaseClient';
import type { User } from 'firebase/auth';

interface AuthGateProps {
  onAuthSuccess: (user: User) => void;
}

export const AuthGate: React.FC<AuthGateProps> = ({ onAuthSuccess }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Derive display name from email if not provided
  const getDisplayName = (email: string, providedName: string) => {
    if (providedName.trim()) return providedName.trim();
    return email.split('@')[0].replace(/[^a-zA-Z0-9]/g, '');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const authFn = isLogin ? signInWithEmailAndPassword : createUserWithEmailAndPassword;
      const name = isLogin ? '' : getDisplayName(email, displayName);

      // If successful, onAuthStateChanged will handle the user state
      const userCredential = await authFn(auth, email, password);
      
      // Update user display name if registering
      if (!isLogin && userCredential.user) {
        await updateProfile(userCredential.user, { displayName: name });
      }
      
      // Call onAuthSuccess to update the user state in App.tsx
      onAuthSuccess(userCredential.user);

    } catch (error: any) {
      console.error('Auth error:', error);
      setError(error.message || 'Authentication failed');
    } finally {
      setLoading(false);
    }
  };

  const toggleMode = () => {
    setIsLogin(!isLogin);
    setError('');
    setDisplayName('');
  };

  return (
    <div className="auth-gate">
      <div className="auth-container">
        <h1>CollabCanvas</h1>
        <p className="auth-subtitle">
          {isLogin ? 'Sign in to collaborate' : 'Create an account to get started'}
        </p>

        <form onSubmit={handleSubmit} className="auth-form">
          <div className="form-group">
            <label htmlFor="email">Email</label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              disabled={loading}
              placeholder="Enter your email"
            />
          </div>

          <div className="form-group">
            <label htmlFor="password">Password</label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              disabled={loading}
              placeholder="Enter your password"
              minLength={6}
            />
          </div>

          {!isLogin && (
            <div className="form-group">
              <label htmlFor="displayName">Display Name (optional)</label>
              <input
                id="displayName"
                type="text"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                disabled={loading}
                placeholder="How others will see you"
              />
              <small className="form-help">
                Leave blank to use your email username
              </small>
            </div>
          )}

          {error && (
            <div className="error-message">
              {error}
            </div>
          )}

          <button 
            type="submit" 
            className="auth-button"
            disabled={loading}
          >
            {loading ? 'Please wait...' : (isLogin ? 'Sign In' : 'Create Account')}
          </button>
        </form>

        <div className="auth-toggle">
          <p>
            {isLogin ? "Don't have an account?" : "Already have an account?"}
            <button 
              type="button" 
              onClick={toggleMode}
              className="toggle-button"
              disabled={loading}
            >
              {isLogin ? 'Create one' : 'Sign in'}
            </button>
          </p>
        </div>
      </div>
    </div>
  );
};

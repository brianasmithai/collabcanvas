// Tests for AuthGate component
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { vi } from 'vitest';
import { AuthGate } from '../src/components/AuthGate';

// Mock Firebase Auth
vi.mock('firebase/auth', () => ({
  signInWithEmailAndPassword: vi.fn(),
  createUserWithEmailAndPassword: vi.fn(),
  updateProfile: vi.fn(),
}));

// Mock Firebase client
vi.mock('../src/config/firebaseClient', () => ({
  auth: {},
}));

describe('AuthGate', () => {
  const mockOnAuthSuccess = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render login form by default', () => {
    render(<AuthGate onAuthSuccess={mockOnAuthSuccess} />);
    
    expect(screen.getByText('CollabCanvas')).toBeInTheDocument();
    expect(screen.getByText('Sign in to collaborate')).toBeInTheDocument();
    expect(screen.getByLabelText('Email')).toBeInTheDocument();
    expect(screen.getByLabelText('Password')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Sign In' })).toBeInTheDocument();
    expect(screen.getByText("Don't have an account?")).toBeInTheDocument();
  });

  it('should toggle to register form when clicking toggle button', () => {
    render(<AuthGate onAuthSuccess={mockOnAuthSuccess} />);
    
    const toggleButton = screen.getByText('Create one');
    fireEvent.click(toggleButton);
    
    expect(screen.getByText('Create an account to get started')).toBeInTheDocument();
    expect(screen.getByLabelText('Display Name (optional)')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Create Account' })).toBeInTheDocument();
    expect(screen.getByText('Already have an account?')).toBeInTheDocument();
  });

  it('should toggle back to login form', () => {
    render(<AuthGate onAuthSuccess={mockOnAuthSuccess} />);
    
    // Switch to register
    fireEvent.click(screen.getByText('Create one'));
    expect(screen.getByText('Create an account to get started')).toBeInTheDocument();
    
    // Switch back to login
    fireEvent.click(screen.getByText('Sign in'));
    expect(screen.getByText('Sign in to collaborate')).toBeInTheDocument();
  });

  it('should call onAuthSuccess when login is successful', async () => {
    const { signInWithEmailAndPassword } = await import('firebase/auth');
    const mockUser = { uid: 'test-uid', email: 'test@example.com' };
    (signInWithEmailAndPassword as any).mockResolvedValue({ user: mockUser });

    render(<AuthGate onAuthSuccess={mockOnAuthSuccess} />);
    
    // Fill in login form
    fireEvent.change(screen.getByLabelText('Email'), { target: { value: 'test@example.com' } });
    fireEvent.change(screen.getByLabelText('Password'), { target: { value: 'password123' } });
    
    // Submit form
    fireEvent.click(screen.getByRole('button', { name: 'Sign In' }));

    await waitFor(() => {
      expect(signInWithEmailAndPassword).toHaveBeenCalledWith({}, 'test@example.com', 'password123');
      expect(mockOnAuthSuccess).toHaveBeenCalledWith(mockUser);
    });
  });

  it('should call onAuthSuccess when registration is successful', async () => {
    const { createUserWithEmailAndPassword, updateProfile } = await import('firebase/auth');
    const mockUser = { uid: 'test-uid', email: 'test@example.com' };
    (createUserWithEmailAndPassword as any).mockResolvedValue({ user: mockUser });
    (updateProfile as any).mockResolvedValue(undefined);

    render(<AuthGate onAuthSuccess={mockOnAuthSuccess} />);
    
    // Switch to register form
    fireEvent.click(screen.getByText('Create one'));
    
    // Fill in registration form
    fireEvent.change(screen.getByLabelText('Email'), { target: { value: 'test@example.com' } });
    fireEvent.change(screen.getByLabelText('Password'), { target: { value: 'password123' } });
    fireEvent.change(screen.getByLabelText('Display Name (optional)'), { target: { value: 'Test User' } });
    
    // Submit form
    fireEvent.click(screen.getByRole('button', { name: 'Create Account' }));

    await waitFor(() => {
      expect(createUserWithEmailAndPassword).toHaveBeenCalledWith({}, 'test@example.com', 'password123');
      expect(updateProfile).toHaveBeenCalledWith(mockUser, { displayName: 'Test User' });
      expect(mockOnAuthSuccess).toHaveBeenCalledWith(mockUser);
    });
  });

  it('should use email prefix as display name when not provided', async () => {
    const { createUserWithEmailAndPassword, updateProfile } = await import('firebase/auth');
    const mockUser = { uid: 'test-uid', email: 'testuser@example.com' };
    (createUserWithEmailAndPassword as any).mockResolvedValue({ user: mockUser });
    (updateProfile as any).mockResolvedValue(undefined);

    render(<AuthGate onAuthSuccess={mockOnAuthSuccess} />);
    
    // Switch to register form
    fireEvent.click(screen.getByText('Create one'));
    
    // Fill in registration form without display name
    fireEvent.change(screen.getByLabelText('Email'), { target: { value: 'testuser@example.com' } });
    fireEvent.change(screen.getByLabelText('Password'), { target: { value: 'password123' } });
    
    // Submit form
    fireEvent.click(screen.getByRole('button', { name: 'Create Account' }));

    await waitFor(() => {
      expect(updateProfile).toHaveBeenCalledWith(mockUser, { displayName: 'testuser' });
    });
  });

  it('should show error message when authentication fails', async () => {
    const { signInWithEmailAndPassword } = await import('firebase/auth');
    (signInWithEmailAndPassword as any).mockRejectedValue(new Error('Invalid credentials'));

    render(<AuthGate onAuthSuccess={mockOnAuthSuccess} />);
    
    // Fill in login form
    fireEvent.change(screen.getByLabelText('Email'), { target: { value: 'test@example.com' } });
    fireEvent.change(screen.getByLabelText('Password'), { target: { value: 'wrongpassword' } });
    
    // Submit form
    fireEvent.click(screen.getByRole('button', { name: 'Sign In' }));

    await waitFor(() => {
      expect(screen.getByText('Invalid credentials')).toBeInTheDocument();
    });
  });

  it('should disable form inputs and button during loading', async () => {
    const { signInWithEmailAndPassword } = await import('firebase/auth');
    (signInWithEmailAndPassword as any).mockImplementation(() => new Promise(() => {})); // Never resolves

    render(<AuthGate onAuthSuccess={mockOnAuthSuccess} />);
    
    // Fill in login form
    fireEvent.change(screen.getByLabelText('Email'), { target: { value: 'test@example.com' } });
    fireEvent.change(screen.getByLabelText('Password'), { target: { value: 'password123' } });
    
    // Submit form
    fireEvent.click(screen.getByRole('button', { name: 'Sign In' }));

    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'Please wait...' })).toBeDisabled();
      expect(screen.getByLabelText('Email')).toBeDisabled();
      expect(screen.getByLabelText('Password')).toBeDisabled();
    });
  });

  it('should clear error when toggling between forms', () => {
    render(<AuthGate onAuthSuccess={mockOnAuthSuccess} />);
    
    // Switch to register form
    fireEvent.click(screen.getByText('Create one'));
    
    // Switch back to login form
    fireEvent.click(screen.getByText('Sign in'));
    
    // Error should be cleared (no error message visible)
    expect(screen.queryByText(/error/i)).not.toBeInTheDocument();
  });
});

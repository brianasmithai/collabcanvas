// Authentication and user-related types
// Defines the shape of user data and auth state

export interface User {
  uid: string;
  email: string | null;
  displayName: string | null;
  emailVerified: boolean;
  createdAt: number;
}

export interface AuthUser {
  uid: string;
  email: string | null;
  displayName: string | null;
  emailVerified: boolean;
}

export interface UserDocument {
  displayName: string;
  createdAt: number;
}

export interface AuthState {
  user: AuthUser | null;
  loading: boolean;
  error: string | null;
}

export interface SignUpData {
  email: string;
  password: string;
  displayName?: string;
}

export interface SignInData {
  email: string;
  password: string;
}

export interface UpdateDisplayNameData {
  displayName: string;
}

// Type guards for runtime validation
export function isAuthUser(obj: unknown): obj is AuthUser {
  return (
    typeof obj === 'object' &&
    obj !== null &&
    typeof (obj as AuthUser).uid === 'string' &&
    (typeof (obj as AuthUser).email === 'string' || (obj as AuthUser).email === null) &&
    (typeof (obj as AuthUser).displayName === 'string' || (obj as AuthUser).displayName === null) &&
    typeof (obj as AuthUser).emailVerified === 'boolean'
  );
}

export function isUserDocument(obj: unknown): obj is UserDocument {
  return (
    typeof obj === 'object' &&
    obj !== null &&
    typeof (obj as UserDocument).displayName === 'string' &&
    typeof (obj as UserDocument).createdAt === 'number'
  );
}

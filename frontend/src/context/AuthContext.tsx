import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';

// ============================================================
// Types
// ============================================================
export interface AuthUser {
  username: string;
  email: string;
  fullName: string;
  createdAt: string;
}

interface AuthContextType {
  user: AuthUser | null;
  isAuthenticated: boolean;
  login: (email: string, password: string) => { success: boolean; error?: string };
  signup: (fullName: string, email: string, password: string) => { success: boolean; error?: string };
  logout: () => void;
}

// ============================================================
// Context
// ============================================================
const AuthContext = createContext<AuthContextType | null>(null);

// ============================================================
// Storage Helpers — LocalStorage (no JWT, no backend auth)
// ============================================================
const USERS_KEY = 'campaignx_users';
const SESSION_KEY = 'campaignx_session';

function getStoredUsers(): Record<string, { fullName: string; email: string; passwordHash: string; createdAt: string }> {
  try {
    return JSON.parse(localStorage.getItem(USERS_KEY) || '{}');
  } catch {
    return {};
  }
}

function saveStoredUsers(users: ReturnType<typeof getStoredUsers>) {
  localStorage.setItem(USERS_KEY, JSON.stringify(users));
}

function getSession(): AuthUser | null {
  try {
    const raw = localStorage.getItem(SESSION_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function saveSession(user: AuthUser) {
  localStorage.setItem(SESSION_KEY, JSON.stringify(user));
}

function clearSession() {
  localStorage.removeItem(SESSION_KEY);
}

// Simple deterministic hash (not cryptographic — for demo purposes only)
function simpleHash(input: string): string {
  let hash = 5381;
  for (let i = 0; i < input.length; i++) {
    hash = ((hash << 5) + hash) + input.charCodeAt(i);
    hash = hash & hash;
  }
  return Math.abs(hash).toString(36);
}

// ============================================================
// AuthProvider
// ============================================================
export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<AuthUser | null>(() => getSession());

  // Hydrate from session on mount
  useEffect(() => {
    const session = getSession();
    setUser(session);
  }, []);

  const signup = useCallback((
    fullName: string,
    email: string,
    password: string
  ): { success: boolean; error?: string } => {
    const normalizedEmail = email.trim().toLowerCase();
    const users = getStoredUsers();

    if (users[normalizedEmail]) {
      return { success: false, error: 'An account with this email already exists.' };
    }

    const newUser = {
      fullName: fullName.trim(),
      email: normalizedEmail,
      passwordHash: simpleHash(password),
      createdAt: new Date().toISOString(),
    };

    users[normalizedEmail] = newUser;
    saveStoredUsers(users);

    const authUser: AuthUser = {
      username: normalizedEmail.split('@')[0],
      email: normalizedEmail,
      fullName: fullName.trim(),
      createdAt: newUser.createdAt,
    };

    saveSession(authUser);
    setUser(authUser);
    return { success: true };
  }, []);

  const login = useCallback((
    email: string,
    password: string
  ): { success: boolean; error?: string } => {
    const normalizedEmail = email.trim().toLowerCase();
    const users = getStoredUsers();
    const stored = users[normalizedEmail];

    if (!stored) {
      return { success: false, error: 'No account found with this email. Please sign up.' };
    }

    if (stored.passwordHash !== simpleHash(password)) {
      return { success: false, error: 'Incorrect password. Please try again.' };
    }

    const authUser: AuthUser = {
      username: normalizedEmail.split('@')[0],
      email: normalizedEmail,
      fullName: stored.fullName,
      createdAt: stored.createdAt,
    };

    saveSession(authUser);
    setUser(authUser);
    return { success: true };
  }, []);

  const logout = useCallback(() => {
    clearSession();
    setUser(null);
  }, []);

  return (
    <AuthContext.Provider value={{ user, isAuthenticated: !!user, login, signup, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

// ============================================================
// Hook
// ============================================================
export function useAuth(): AuthContextType {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within <AuthProvider>');
  return ctx;
}

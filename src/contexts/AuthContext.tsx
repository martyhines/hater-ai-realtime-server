import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import AuthService, { AuthState, UserProfile } from '../services/authService';

interface AuthContextType extends AuthState {
  // Authentication methods
  signInAnonymously: () => Promise<void>;
  signUpWithEmail: (email: string, password: string, displayName?: string) => Promise<void>;
  signInWithEmail: (email: string, password: string) => Promise<void>;
  linkAnonymousAccount: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  migrateAnonymousData: () => Promise<void>;

  // Utility methods
  isAnonymousUser: () => boolean;
  requiresAuth: () => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    isAuthenticated: false,
    isAnonymous: true,
    loading: true
  });

  const authService = AuthService.getInstance();

  useEffect(() => {
    // Subscribe to auth state changes
    const unsubscribe = authService.subscribe((newState) => {
      setAuthState(newState);
    });

    // Initialize auth state
    const initialState = authService.getAuthState();
    setAuthState(initialState);

    return unsubscribe;
  }, []);

  const contextValue: AuthContextType = {
    ...authState,

    // Authentication methods
    signInAnonymously: () => authService.signInAnonymously(),
    signUpWithEmail: async (email: string, password: string, displayName?: string) => {
      await authService.signUpWithEmail(email, password, displayName);
      await authService.migrateAnonymousData(); // Migrate data after successful signup
    },
    signInWithEmail: (email: string, password: string) => authService.signInWithEmail(email, password),
    linkAnonymousAccount: async (email: string, password: string) => {
      await authService.linkAnonymousAccount(email, password);
      await authService.migrateAnonymousData(); // Migrate data after linking
    },
    signOut: () => authService.signOut(),
    migrateAnonymousData: () => authService.migrateAnonymousData(),

    // Utility methods
    isAnonymousUser: () => authState.isAnonymous,
    requiresAuth: () => false // For now, nothing requires auth - it's all optional
  };

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

// Hook for conditional rendering based on auth state
export const useAuthGuard = () => {
  const { isAuthenticated, isAnonymous, loading } = useAuth();

  return {
    isAuthenticated,
    isAnonymous,
    loading,
    canAccessFeature: (feature: string) => {
      // Define which features require authentication
      const authRequiredFeatures = [
        'cross_device_sync',
        'conversation_backup',
        'advanced_analytics'
      ];

      if (authRequiredFeatures.includes(feature)) {
        return isAuthenticated && !isAnonymous;
      }

      return true; // All other features are available to everyone
    }
  };
};

export default AuthContext;

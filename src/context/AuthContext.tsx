import React, { createContext, useContext, useEffect, useState } from 'react';
import { onAuthStateChanged, User as FirebaseUser } from 'firebase/auth';
import { auth, googleProvider, signInWithPopup, signOut } from '../lib/firebase';
import { UserProfile, UserRole } from '../types';
import { useAppData } from './AppDataContext';
import { createDocument } from '../services/firestoreService';

interface AuthContextType {
  firebaseUser: FirebaseUser | null;
  currentUser: UserProfile | null;
  currentRole: UserRole;
  isLoading: boolean;
  signInWithGoogle: () => Promise<void>;
  logout: () => Promise<void>;
  switchUserPersona: (userId: string) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { users } = useAppData();
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
  const [activeUserId, setActiveUserId] = useState<string>(() => {
    // Check saved session persona, default to Gestor (Rafael Mendes) so managers can test the primary experience immediately,
    // or Admin if preferred
    return localStorage.getItem('gestao_active_user_id') || 'usr-rafael';
  });
  const [isLoading, setIsLoading] = useState(true);

  // Sync with Firebase Auth
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setFirebaseUser(user);
      if (user && user.email) {
        // Find existing user by email or ID
        const found = users.find((u) => u.email.toLowerCase() === user.email?.toLowerCase());
        if (found) {
          setActiveUserId(found.id);
          localStorage.setItem('gestao_active_user_id', found.id);
        } else {
          // If first-time Google login not yet in list, register them
          const isOwner = user.email.toLowerCase() === 'manfroimatheus3@gmail.com';
          const newUser: UserProfile = {
            id: `usr-${user.uid.substring(0, 8)}`,
            email: user.email,
            name: user.displayName || user.email.split('@')[0],
            role: isOwner ? 'admin' : 'manager',
            avatarUrl: user.photoURL || undefined,
            departmentId: 'dept-tech',
            departmentName: 'Tecnologia e Produto',
            positionId: 'pos-1',
            positionName: isOwner ? 'Diretor Geral' : 'Gestor de Equipe',
            active: true,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          };
          await createDocument('users', newUser);
          setActiveUserId(newUser.id);
          localStorage.setItem('gestao_active_user_id', newUser.id);
        }
      }
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, [users]);

  // Current active user object
  const currentUser: UserProfile | null =
    users.find((u) => u.id === activeUserId) || users[0] || null;

  const currentRole: UserRole = currentUser?.role || 'employee';

  const signInWithGoogle = async () => {
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (err: any) {
      console.error('Google Sign-In Error:', err);
    }
  };

  const logout = async () => {
    try {
      await signOut(auth);
    } catch (e) {
      console.warn('SignOut warning:', e);
    }
    // Switch to João as default fallback
    setActiveUserId('usr-joao');
    localStorage.setItem('gestao_active_user_id', 'usr-joao');
  };

  const switchUserPersona = (userId: string) => {
    setActiveUserId(userId);
    localStorage.setItem('gestao_active_user_id', userId);
  };

  return (
    <AuthContext.Provider
      value={{
        firebaseUser,
        currentUser,
        currentRole,
        isLoading,
        signInWithGoogle,
        logout,
        switchUserPersona,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

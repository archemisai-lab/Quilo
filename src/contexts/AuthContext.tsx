import React, { createContext, useContext, useEffect, useState, useRef } from 'react';
import {
  User,
  onAuthStateChanged,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
  signOut,
  sendEmailVerification,
  sendPasswordResetEmail,
  updateProfile,
  deleteUser,
  EmailAuthProvider,
  reauthenticateWithCredential,
  reauthenticateWithPopup,
} from 'firebase/auth';
import { doc, getDoc, setDoc, updateDoc, deleteDoc } from 'firebase/firestore';
import { auth, db, handleFirestoreError, OperationType, removeUndefinedFields } from '../services/firebase';
import { deleteAllUserSheets } from '../services/sheetsFirestore';
import { UserProfile } from '../types/revision';

interface AuthContextType {
  user: User | null;
  profile: UserProfile | null;
  loading: boolean;
  signUpWithEmail: (
    email: string,
    pass: string,
    displayName: string,
    schoolGrade?: string
  ) => Promise<void>;
  signInWithEmail: (email: string, pass: string) => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  sendPasswordReset: (email: string) => Promise<void>;
  resendVerificationEmail: () => Promise<void>;
  updateUserProfileData: (updates: Partial<UserProfile>) => Promise<void>;
  deleteAccount: (currentPassword?: string) => Promise<void>;
  logOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const googleAuthInProgress = useRef(false);

  // Fetch or create user profile in Firestore
  const fetchOrCreateProfile = async (firebaseUser: User, defaultName?: string, grade?: string) => {
    const userDocRef = doc(db, 'users', firebaseUser.uid);
    try {
      const snap = await getDoc(userDocRef);
      if (snap.exists()) {
        setProfile(snap.data() as UserProfile);
      } else {
        const newProfile: UserProfile = {
          id: firebaseUser.uid,
          email: firebaseUser.email || '',
          displayName: defaultName || firebaseUser.displayName || 'Élève Quilo',
          schoolGrade: grade || 'Lycée',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          ...(firebaseUser.photoURL ? { photoUrl: firebaseUser.photoURL } : {}),
        };
        await setDoc(userDocRef, removeUndefinedFields(newProfile));
        setProfile(newProfile);
      }
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, `users/${firebaseUser.uid}`);
    }
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        try {
          await fetchOrCreateProfile(currentUser);
        } catch (e) {
          console.error('Erreur chargement profil utilisateur:', e);
        }
      } else {
        setProfile(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const signUpWithEmail = async (
    email: string,
    pass: string,
    displayName: string,
    schoolGrade?: string
  ) => {
    const cred = await createUserWithEmailAndPassword(auth, email, pass);
    if (cred.user) {
      // Update Auth display name
      await updateProfile(cred.user, { displayName });
      // Send verification email
      try {
        await sendEmailVerification(cred.user);
      } catch (e) {
        console.warn('Erreur envoi email vérification:', e);
      }
      // Create Firestore Profile Document
      await fetchOrCreateProfile(cred.user, displayName, schoolGrade);
    }
  };

  const signInWithEmail = async (email: string, pass: string) => {
    const cred = await signInWithEmailAndPassword(auth, email, pass);
    if (cred.user) {
      await fetchOrCreateProfile(cred.user);
    }
  };

  const signInWithGoogle = async () => {
    if (googleAuthInProgress.current) {
      return;
    }
    googleAuthInProgress.current = true;
    try {
      const provider = new GoogleAuthProvider();
      provider.setCustomParameters({ prompt: 'select_account' });
      const cred = await signInWithPopup(auth, provider);
      if (cred.user) {
        await fetchOrCreateProfile(cred.user);
      }
    } catch (err: any) {
      if (
        err?.code === 'auth/cancelled-popup-request' ||
        err?.code === 'auth/popup-closed-by-user'
      ) {
        // Normal user cancellation - do not treat as fatal error
        return;
      }
      throw err;
    } finally {
      googleAuthInProgress.current = false;
    }
  };

  const sendPasswordReset = async (email: string) => {
    await sendPasswordResetEmail(auth, email);
  };

  const resendVerificationEmail = async () => {
    if (auth.currentUser) {
      await sendEmailVerification(auth.currentUser);
    }
  };

  const updateUserProfileData = async (updates: Partial<UserProfile>) => {
    if (!user) throw new Error('Utilisateur non connecté');
    const userDocRef = doc(db, 'users', user.uid);
    const updatedData = removeUndefinedFields({
      ...updates,
      updatedAt: new Date().toISOString(),
    });
    try {
      await updateDoc(userDocRef, updatedData);
      setProfile((prev) => (prev ? { ...prev, ...updatedData } : null));
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `users/${user.uid}`);
    }
  };

  const refreshProfile = async () => {
    if (user) {
      await fetchOrCreateProfile(user);
    }
  };

  const deleteAccount = async (currentPassword?: string) => {
    const currentUser = auth.currentUser;
    if (!currentUser) throw new Error('Aucun utilisateur connecté');

    const isPasswordUser = currentUser.providerData.some((p) => p.providerId === 'password');
    const isGoogleUser = currentUser.providerData.some((p) => p.providerId === 'google.com');

    // If signed in with password and a password was passed, re-authenticate first
    if (isPasswordUser && currentPassword && currentUser.email) {
      const credential = EmailAuthProvider.credential(currentUser.email, currentPassword);
      await reauthenticateWithCredential(currentUser, credential);
    }

    try {
      // 1. Delete all user revision sheets
      await deleteAllUserSheets(currentUser.uid);

      // 2. Delete user profile document
      const userDocRef = doc(db, 'users', currentUser.uid);
      try {
        await deleteDoc(userDocRef);
      } catch (e) {
        console.warn('Erreur suppression document utilisateur:', e);
      }

      // 3. Delete Firebase Auth user
      await deleteUser(currentUser);
      setUser(null);
      setProfile(null);
    } catch (err: any) {
      if (err?.code === 'auth/requires-recent-login') {
        if (isGoogleUser) {
          // Trigger Google popup to re-authenticate
          const provider = new GoogleAuthProvider();
          await reauthenticateWithPopup(currentUser, provider);
          // Retry deletion
          await deleteAllUserSheets(currentUser.uid);
          const userDocRef = doc(db, 'users', currentUser.uid);
          try {
            await deleteDoc(userDocRef);
          } catch {}
          await deleteUser(currentUser);
          setUser(null);
          setProfile(null);
          return;
        }
      }
      throw err;
    }
  };

  const logOut = async () => {
    await signOut(auth);
    setProfile(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        profile,
        loading,
        signUpWithEmail,
        signInWithEmail,
        signInWithGoogle,
        sendPasswordReset,
        resendVerificationEmail,
        updateUserProfileData,
        deleteAccount,
        logOut,
        refreshProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth doit être utilisé à l’intérieur d’un AuthProvider');
  }
  return context;
};

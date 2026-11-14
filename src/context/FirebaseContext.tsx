import React, { createContext, useContext, useEffect, useState, useCallback, ReactNode } from 'react';
import { onAuthStateChanged, type User } from 'firebase/auth';
import { onSnapshot, doc } from 'firebase/firestore';
import {
  auth,
  db,
  collection,
  query,
  where,
  OperationType,
  handleFirestoreError,
  signInWithGooglePopup,
  signOutFirebaseUser,
  ensureUserDocuments,
  updateCloudUserPreferences,
  upsertCloudTask,
  removeCloudTask,
  sanitizeFirestoreId,
} from '../lib/firebase';

export interface CloudProfileData {
  uid: string;
  displayName: string;
  theme: 'dark' | 'light';
  wallpaper: string;
  photoURL?: string;
}

export interface CloudTaskDoc {
  id: string;
  ownerId: string;
  title: string;
  priority: 'Critical' | 'High' | 'Medium' | 'Low';
  dueDate?: string;
  category: string;
  completed: boolean;
  isEncrypted: boolean;
  encryptedPayload?: string;
}

interface FirebaseContextValue {
  firebaseUser: User | null;
  isAuthReady: boolean;
  cloudProfile: CloudProfileData | null;
  cloudTasks: CloudTaskDoc[];
  authError: string | null;
  isSigningIn: boolean;
  signInWithGoogle: () => Promise<User | null>;
  signOutGoogle: () => Promise<void>;
  syncPreferences: (prefs: { displayName: string; theme: 'dark' | 'light'; wallpaper: string }) => Promise<void>;
  syncTask: (task: {
    id: string;
    title: string;
    priority: string;
    dueDate?: string;
    category: string;
    completed: boolean;
    isEncrypted: boolean;
    encryptedContent?: string;
  }) => Promise<void>;
  deleteTask: (taskId: string) => Promise<void>;
}

const FirebaseContext = createContext<FirebaseContextValue | null>(null);

export const FirebaseProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [firebaseUser, setFirebaseUser] = useState<User | null>(null);
  const [isAuthReady, setIsAuthReady] = useState(false);
  const [cloudProfile, setCloudProfile] = useState<CloudProfileData | null>(null);
  const [cloudTasks, setCloudTasks] = useState<CloudTaskDoc[]>([]);
  const [authError, setAuthError] = useState<string | null>(null);
  const [isSigningIn, setIsSigningIn] = useState(false);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (user) => {
      if (user && user.emailVerified) {
        try {
          await ensureUserDocuments(user, {
            displayName: user.displayName || 'Alex Rivers',
            theme: 'dark',
            wallpaper: 'deep_space',
            twoFactorEnabled: true,
          });
        } catch (err) {
          console.error('Failed to bootstrap Firestore user profile:', err);
        }
      } else {
        setCloudProfile(null);
        setCloudTasks([]);
      }
      setFirebaseUser(user);
      setIsAuthReady(true);
    });

    return () => unsub();
  }, []);

  // Attach authenticated Firestore listeners only when auth & bootstrap are ready
  useEffect(() => {
    if (!isAuthReady || !firebaseUser || !firebaseUser.emailVerified) return;

    const safeUid = sanitizeFirestoreId(firebaseUser.uid);
    const profilePath = `users/${safeUid}`;
    const tasksPath = `users/${safeUid}/tasks`;

    const unsubProfile = onSnapshot(
      doc(db, 'users', safeUid),
      (snap) => {
        if (snap.exists()) {
          setCloudProfile(snap.data() as CloudProfileData);
        }
      },
      (error) => {
        handleFirestoreError(error, OperationType.GET, profilePath);
      }
    );

    const tasksQuery = query(
      collection(db, 'users', safeUid, 'tasks'),
      where('ownerId', '==', safeUid)
    );

    const unsubTasks = onSnapshot(
      tasksQuery,
      (snapshot) => {
        const list: CloudTaskDoc[] = [];
        snapshot.forEach((docSnap) => {
          list.push(docSnap.data() as CloudTaskDoc);
        });
        setCloudTasks(list);
      },
      (error) => {
        handleFirestoreError(error, OperationType.LIST, tasksPath);
      }
    );

    return () => {
      unsubProfile();
      unsubTasks();
    };
  }, [isAuthReady, firebaseUser]);

  const signInWithGoogle = useCallback(async (): Promise<User | null> => {
    setAuthError(null);
    setIsSigningIn(true);
    try {
      const user = await signInWithGooglePopup();
      if (user && user.emailVerified) {
        await ensureUserDocuments(user, {
          displayName: user.displayName || 'Alex Rivers',
          theme: 'dark',
          wallpaper: 'deep_space',
          twoFactorEnabled: true,
        });
      }
      return user;
    } catch (err: any) {
      const msg = err?.message || 'Google Sign-In cancelled or failed.';
      setAuthError(msg);
      return null;
    } finally {
      setIsSigningIn(false);
    }
  }, []);

  const signOutGoogle = useCallback(async () => {
    setAuthError(null);
    await signOutFirebaseUser();
    setCloudProfile(null);
    setCloudTasks([]);
  }, []);

  const syncPreferences = useCallback(
    async (prefs: { displayName: string; theme: 'dark' | 'light'; wallpaper: string }) => {
      if (!firebaseUser || !firebaseUser.emailVerified) return;
      await updateCloudUserPreferences(firebaseUser.uid, prefs);
    },
    [firebaseUser]
  );

  const syncTask = useCallback(
    async (task: {
      id: string;
      title: string;
      priority: string;
      dueDate?: string;
      category: string;
      completed: boolean;
      isEncrypted: boolean;
      encryptedContent?: string;
    }) => {
      if (!firebaseUser || !firebaseUser.emailVerified) return;
      await upsertCloudTask(firebaseUser.uid, task);
    },
    [firebaseUser]
  );

  const deleteTask = useCallback(
    async (taskId: string) => {
      if (!firebaseUser || !firebaseUser.emailVerified) return;
      await removeCloudTask(firebaseUser.uid, taskId);
    },
    [firebaseUser]
  );

  return (
    <FirebaseContext.Provider
      value={{
        firebaseUser,
        isAuthReady,
        cloudProfile,
        cloudTasks,
        authError,
        isSigningIn,
        signInWithGoogle,
        signOutGoogle,
        syncPreferences,
        syncTask,
        deleteTask,
      }}
    >
      {children}
    </FirebaseContext.Provider>
  );
};

export const useFirebase = (): FirebaseContextValue => {
  const ctx = useContext(FirebaseContext);
  if (!ctx) throw new Error('useFirebase must be used inside FirebaseProvider');
  return ctx;
};

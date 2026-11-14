import { initializeApp } from 'firebase/app';
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signOut,
  type User,
} from 'firebase/auth';
import {
  getFirestore,
  doc,
  getDoc,
  getDocFromServer,
  collection,
  query,
  where,
  setDoc,
  updateDoc,
  deleteDoc,
  serverTimestamp,
} from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);
export const auth = getAuth(app);
export const googleAuthProvider = new GoogleAuthProvider();
googleAuthProvider.setCustomParameters({ prompt: 'select_account' });

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  };
}

export function handleFirestoreError(
  error: unknown,
  operationType: OperationType,
  path: string | null
): never {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo:
        auth.currentUser?.providerData?.map((provider) => ({
          providerId: provider.providerId,
          email: provider.email,
        })) || [],
    },
    operationType,
    path,
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

// Verify Firestore connection on boot
export async function testFirestoreConnection(): Promise<boolean> {
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
    return true;
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.error('Please check your Firebase configuration.');
      return false;
    }
    // Permission denied on default-deny test doc still confirms server reachability
    return true;
  }
}

testFirestoreConnection();

export const sanitizeFirestoreId = (raw: string): string => {
  const cleaned = raw.replace(/[^a-zA-Z0-9_\-]/g, '_').slice(0, 128);
  return cleaned || `id_${Date.now()}`;
};

const clampStr = (val: string, maxLen: number): string => val.trim().slice(0, maxLen);

export async function signInWithGooglePopup(): Promise<User> {
  const cred = await signInWithPopup(auth, googleAuthProvider);
  return cred.user;
}

export async function signOutFirebaseUser(): Promise<void> {
  await signOut(auth);
}

const inFlightEnsure = new Map<string, Promise<void>>();

export async function ensureUserDocuments(
  user: User,
  defaults: { displayName: string; theme: 'dark' | 'light'; wallpaper: string; twoFactorEnabled: boolean }
): Promise<void> {
  const uid = sanitizeFirestoreId(user.uid);
  const existingPromise = inFlightEnsure.get(uid);
  if (existingPromise) {
    return existingPromise;
  }

  const run = (async () => {
    const profilePath = `users/${uid}`;
    const privatePath = `users/${uid}/private/info`;
    const profileRef = doc(db, 'users', uid);
    const privateRef = doc(db, 'users', uid, 'private', 'info');

    let profileExists = false;
    try {
      const snap = await getDoc(profileRef);
      profileExists = snap.exists();
    } catch (error) {
      handleFirestoreError(error, OperationType.GET, profilePath);
    }

    const displayName = clampStr(user.displayName || defaults.displayName || 'Pluto User', 80);
    const email = clampStr(user.email || 'user@pluto-os.internal', 254);

    if (!profileExists) {
      const profilePayload: Record<string, unknown> = {
        uid,
        displayName,
        theme: defaults.theme,
        wallpaper: clampStr(defaults.wallpaper || 'deep_space', 64),
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      };
      if (user.photoURL) {
        profilePayload.photoURL = clampStr(user.photoURL, 512);
      }

      try {
        await setDoc(profileRef, profilePayload);
      } catch (error) {
        handleFirestoreError(error, OperationType.CREATE, profilePath);
      }
    }

    let privateExists = false;
    try {
      const privateSnap = await getDoc(privateRef);
      privateExists = privateSnap.exists();
    } catch (error) {
      handleFirestoreError(error, OperationType.GET, privatePath);
    }

    if (!privateExists) {
      try {
        await setDoc(privateRef, {
          uid,
          email,
          twoFactorEnabled: Boolean(defaults.twoFactorEnabled),
          updatedAt: serverTimestamp(),
        });
      } catch (error) {
        handleFirestoreError(error, OperationType.CREATE, privatePath);
      }
    }
  })().finally(() => {
    inFlightEnsure.delete(uid);
  });

  inFlightEnsure.set(uid, run);
  return run;
}

export async function updateCloudUserPreferences(
  uid: string,
  prefs: { displayName: string; theme: 'dark' | 'light'; wallpaper: string; photoURL?: string }
): Promise<void> {
  const safeUid = sanitizeFirestoreId(uid);
  const path = `users/${safeUid}`;
  try {
    if (auth.currentUser && auth.currentUser.uid === safeUid) {
      await ensureUserDocuments(auth.currentUser, {
        displayName: prefs.displayName,
        theme: prefs.theme,
        wallpaper: prefs.wallpaper,
        twoFactorEnabled: true,
      });
    }
    const payload: Record<string, unknown> = {
      displayName: clampStr(prefs.displayName || 'Pluto User', 80),
      theme: prefs.theme,
      wallpaper: clampStr(prefs.wallpaper || 'deep_space', 64),
      updatedAt: serverTimestamp(),
    };
    if (prefs.photoURL !== undefined) {
      payload.photoURL = clampStr(prefs.photoURL, 512);
    }
    await updateDoc(doc(db, 'users', safeUid), payload);
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

const mapOSPriorityToCloud = (p: string): 'Critical' | 'High' | 'Medium' | 'Low' => {
  if (p.includes('Critical') || p.startsWith('P0')) return 'Critical';
  if (p.includes('High') || p.startsWith('P1')) return 'High';
  if (p.includes('Low') || p.startsWith('P3')) return 'Low';
  return 'Medium';
};

export async function upsertCloudTask(
  uid: string,
  task: {
    id: string;
    title: string;
    priority: string;
    dueDate?: string;
    category: string;
    completed: boolean;
    isEncrypted: boolean;
    encryptedContent?: string;
  }
): Promise<void> {
  const safeUid = sanitizeFirestoreId(uid);
  const safeId = sanitizeFirestoreId(task.id);
  const path = `users/${safeUid}/tasks/${safeId}`;
  try {
    const ref = doc(db, 'users', safeUid, 'tasks', safeId);
    const existing = await getDoc(ref);
    if (!existing.exists()) {
      const payload: Record<string, unknown> = {
        id: safeId,
        ownerId: safeUid,
        title: clampStr(task.title || 'Untitled Task', 240),
        priority: mapOSPriorityToCloud(task.priority),
        category: clampStr(task.category || 'System', 48),
        completed: Boolean(task.completed),
        isEncrypted: Boolean(task.isEncrypted),
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      };
      if (task.dueDate) payload.dueDate = clampStr(task.dueDate, 40);
      if (task.encryptedContent) payload.encryptedPayload = clampStr(task.encryptedContent, 2048);
      await setDoc(ref, payload);
    } else {
      await updateDoc(ref, {
        completed: Boolean(task.completed),
        updatedAt: serverTimestamp(),
      });
    }
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export async function removeCloudTask(uid: string, taskId: string): Promise<void> {
  const safeUid = sanitizeFirestoreId(uid);
  const safeId = sanitizeFirestoreId(taskId);
  const path = `users/${safeUid}/tasks/${safeId}`;
  try {
    await deleteDoc(doc(db, 'users', safeUid, 'tasks', safeId));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

export { collection, query, where };

import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut, signInAnonymously } from 'firebase/auth';
import { 
  initializeFirestore, 
  doc, 
  getDocFromServer, 
  collection, 
  addDoc, 
  setDoc, 
  getDoc, 
  query, 
  where, 
  getDocs, 
  onSnapshot, 
  serverTimestamp, 
  updateDoc, 
  deleteDoc, 
  arrayUnion, 
  arrayRemove,
  enableNetwork
} from 'firebase/firestore';
import firebaseConfig from '../firebase-applet-config.json';

const app = initializeApp(firebaseConfig);

// Force long polling to avoid gRPC stream timeouts in the sandbox environment
export const db = initializeFirestore(app, {
  experimentalForceLongPolling: true,
}, firebaseConfig.firestoreDatabaseId);

export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();

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
    userId: string | undefined;
    email: string | null | undefined;
    emailVerified: boolean | undefined;
    isAnonymous: boolean | undefined;
    tenantId: string | null | undefined;
    providerInfo: {
      providerId: string;
      displayName: string | null;
      email: string | null;
      photoUrl: string | null;
    }[];
  }
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const message = error instanceof Error ? error.message : String(error);
  const isPermissionError = message.toLowerCase().includes('permission') || message.toLowerCase().includes('insufficient');
  
  const errInfo: FirestoreErrorInfo = {
    error: message,
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo: auth.currentUser?.providerData.map(provider => ({
        providerId: provider.providerId,
        displayName: provider.displayName,
        email: provider.email,
        photoUrl: provider.photoURL
      })) || []
    },
    operationType,
    path
  }

  const logMessage = `Firestore ${operationType.toUpperCase()} Error at [${path || 'unknown'}]: ${message}`;
  console.error(logMessage, errInfo);

  // If it's a permission error, we might want to show a specific message to the user
  if (isPermissionError) {
    const userMessage = `Access Denied: You don't have permission to ${operationType} at ${path}. Please ensure you are logged in and have the necessary rights.`;
    // We still throw as required, but we can attach the user-friendly message
    const customError = new Error(JSON.stringify({ ...errInfo, userFriendlyMessage: userMessage }));
    throw customError;
  }

  throw new Error(JSON.stringify(errInfo));
}

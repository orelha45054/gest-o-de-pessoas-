import {
  collection,
  doc,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  onSnapshot,
  writeBatch
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import {
  UserProfile,
  Department,
  Position,
  Feedback,
  FeedbackRequest,
  ConversationRequest,
  Meeting,
  Task,
  FollowUp,
  NotificationItem,
  SelfEvaluation,
} from '../types';
import {
  INITIAL_USERS,
  INITIAL_DEPARTMENTS,
  INITIAL_POSITIONS,
  INITIAL_MEETINGS,
  INITIAL_FEEDBACKS,
  INITIAL_FOLLOW_UPS,
  INITIAL_TASKS,
  INITIAL_FEEDBACK_REQUESTS,
  INITIAL_CONVERSATION_REQUESTS,
  INITIAL_NOTIFICATIONS,
} from '../lib/initialData';

// Firestore collection names matching blueprint
export const COLLECTIONS = {
  USERS: 'users',
  DEPARTMENTS: 'departments',
  POSITIONS: 'positions',
  FEEDBACKS: 'feedbacks',
  FEEDBACK_REQUESTS: 'feedbackRequests',
  CONVERSATION_REQUESTS: 'conversationRequests',
  MEETINGS: 'meetings',
  TASKS: 'tasks',
  FOLLOW_UPS: 'followUps',
  DEVELOPMENT_CYCLES: 'developmentCycles',
  SELF_EVALUATIONS: 'selfEvaluations',
  NOTIFICATIONS: 'notifications',
};

// Seeder function to populate Firestore if empty or ensure required sectors exist
export async function seedFirestoreIfEmpty(forceUpdate = false): Promise<boolean> {
  try {
    const deptSnap = await getDocs(collection(db, COLLECTIONS.DEPARTMENTS));
    const hasSiteSector = !deptSnap.empty && deptSnap.docs.some((d) => d.id === 'dept-site' || d.data()?.name === 'Site');

    if (!deptSnap.empty && hasSiteSector && !forceUpdate) {
      return false; // already has correct sectors
    }

    const batch = writeBatch(db);

    // Users
    INITIAL_USERS.forEach((u) => {
      batch.set(doc(db, COLLECTIONS.USERS, u.id), u);
    });

    // Departments (Comercial, Marketing, Site)
    INITIAL_DEPARTMENTS.forEach((d) => {
      batch.set(doc(db, COLLECTIONS.DEPARTMENTS, d.id), d);
    });

    // Positions
    INITIAL_POSITIONS.forEach((p) => {
      batch.set(doc(db, COLLECTIONS.POSITIONS, p.id), p);
    });

    // Meetings
    INITIAL_MEETINGS.forEach((m) => {
      batch.set(doc(db, COLLECTIONS.MEETINGS, m.id), m);
    });

    // Feedbacks
    INITIAL_FEEDBACKS.forEach((f) => {
      batch.set(doc(db, COLLECTIONS.FEEDBACKS, f.id), f);
    });

    // FollowUps
    INITIAL_FOLLOW_UPS.forEach((fup) => {
      batch.set(doc(db, COLLECTIONS.FOLLOW_UPS, fup.id), fup);
    });

    // Tasks
    INITIAL_TASKS.forEach((t) => {
      batch.set(doc(db, COLLECTIONS.TASKS, t.id), t);
    });

    // Feedback Requests
    INITIAL_FEEDBACK_REQUESTS.forEach((fr) => {
      batch.set(doc(db, COLLECTIONS.FEEDBACK_REQUESTS, fr.id), fr);
    });

    // Conversation Requests
    INITIAL_CONVERSATION_REQUESTS.forEach((cr) => {
      batch.set(doc(db, COLLECTIONS.CONVERSATION_REQUESTS, cr.id), cr);
    });

    // Notifications
    INITIAL_NOTIFICATIONS.forEach((n) => {
      batch.set(doc(db, COLLECTIONS.NOTIFICATIONS, n.id), n);
    });

    await batch.commit();
    return true;
  } catch (error) {
    console.warn('Could not auto-seed Firestore directly (may require auth or offline):', error);
    return false;
  }
}

// Subscriptions
export function subscribeToCollection<T>(
  collectionName: string,
  onUpdate: (data: T[]) => void,
  fallbackInitialData: T[] = []
): () => void {
  try {
    const q = query(collection(db, collectionName));
    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        if (snapshot.empty && fallbackInitialData.length > 0) {
          onUpdate(fallbackInitialData);
        } else {
          const items: T[] = [];
          snapshot.forEach((docSnap) => {
            items.push({ id: docSnap.id, ...docSnap.data() } as unknown as T);
          });
          onUpdate(items);
        }
      },
      (error) => {
        console.warn(`Firestore subscription warning on ${collectionName}:`, error.message);
        onUpdate(fallbackInitialData);
      }
    );
    return unsubscribe;
  } catch (e) {
    console.warn(`Fallback to local data for ${collectionName}:`, e);
    onUpdate(fallbackInitialData);
    return () => {};
  }
}

// Deep sanitize to prevent Firestore errors with undefined values
export function sanitizeFirestoreData<T>(obj: T): any {
  if (obj === undefined) {
    return null;
  }
  if (obj === null) {
    return null;
  }
  if (Array.isArray(obj)) {
    return obj.map(sanitizeFirestoreData);
  }
  if (typeof obj === 'object' && !(obj instanceof Date)) {
    const clean: Record<string, any> = {};
    for (const [key, value] of Object.entries(obj as Record<string, any>)) {
      if (value !== undefined) {
        clean[key] = sanitizeFirestoreData(value);
      }
    }
    return clean;
  }
  return obj;
}

// Generic CRUD operations
export async function createDocument<T extends { id?: string }>(
  collectionName: string,
  data: T
): Promise<string> {
  const id = data.id || `doc-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
  const docRef = doc(db, collectionName, id);
  const payload = sanitizeFirestoreData({ ...data, id });
  await setDoc(docRef, payload);
  return id;
}

export async function updateDocument<T extends object>(
  collectionName: string,
  id: string,
  data: Partial<T>
): Promise<void> {
  const docRef = doc(db, collectionName, id);
  const cleanData = sanitizeFirestoreData(data);
  if (cleanData && Object.keys(cleanData).length > 0) {
    await updateDoc(docRef, cleanData);
  }
}

export async function deleteDocument(collectionName: string, id: string): Promise<void> {
  const docRef = doc(db, collectionName, id);
  await deleteDoc(docRef);
}

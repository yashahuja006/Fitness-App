import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  limit,
  startAfter,
  DocumentData,
  QueryDocumentSnapshot,
  Timestamp,
} from 'firebase/firestore';
import { db } from './firebase';

// Generic Firestore operations
export class FirestoreService {
  // Create a document
  static async create<T extends DocumentData>(
    collectionName: string,
    docId: string,
    data: T
  ): Promise<void> {
    const docRef = doc(db, collectionName, docId);
    await setDoc(docRef, {
      ...data,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
    });
  }

  // Read a document
  static async read<T extends DocumentData>(
    collectionName: string,
    docId: string
  ): Promise<T | null> {
    const docRef = doc(db, collectionName, docId);
    const docSnap = await getDoc(docRef);
    
    if (docSnap.exists()) {
      return docSnap.data() as T;
    }
    return null;
  }

  // Update a document
  static async update<T extends Partial<DocumentData>>(
    collectionName: string,
    docId: string,
    data: T
  ): Promise<void> {
    const docRef = doc(db, collectionName, docId);
    await updateDoc(docRef, {
      ...data,
      updatedAt: Timestamp.now(),
    });
  }

  // Delete a document
  static async delete(collectionName: string, docId: string): Promise<void> {
    const docRef = doc(db, collectionName, docId);
    await deleteDoc(docRef);
  }

  // Get all documents in a collection
  static async getAll<T extends DocumentData>(
    collectionName: string
  ): Promise<(T & { id: string })[]> {
    const querySnapshot = await getDocs(collection(db, collectionName));
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    } as T & { id: string }));
  }

  // Query documents with conditions
  static async query<T extends DocumentData>(
    collectionName: string,
    conditions: {
      field: string;
      operator: any;
      value: any;
    }[],
    orderByField?: string,
    orderDirection: 'asc' | 'desc' = 'asc',
    limitCount?: number
  ): Promise<(T & { id: string })[]> {
    let q = query(collection(db, collectionName));

    // Add where conditions
    conditions.forEach(condition => {
      q = query(q, where(condition.field, condition.operator, condition.value));
    });

    // Add ordering
    if (orderByField) {
      q = query(q, orderBy(orderByField, orderDirection));
    }

    // Add limit
    if (limitCount) {
      q = query(q, limit(limitCount));
    }

    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    } as T & { id: string }));
  }

  // Paginated query
  static async paginatedQuery<T extends DocumentData>(
    collectionName: string,
    pageSize: number,
    lastDoc?: QueryDocumentSnapshot<DocumentData>,
    conditions: {
      field: string;
      operator: any;
      value: any;
    }[] = [],
    orderByField: string = 'createdAt',
    orderDirection: 'asc' | 'desc' = 'desc'
  ): Promise<{
    data: (T & { id: string })[];
    lastDoc: QueryDocumentSnapshot<DocumentData> | null;
    hasMore: boolean;
  }> {
    let q = query(collection(db, collectionName));

    // Add where conditions
    conditions.forEach(condition => {
      q = query(q, where(condition.field, condition.operator, condition.value));
    });

    // Add ordering
    q = query(q, orderBy(orderByField, orderDirection));

    // Add pagination
    if (lastDoc) {
      q = query(q, startAfter(lastDoc));
    }

    // Add limit (get one extra to check if there are more)
    q = query(q, limit(pageSize + 1));

    const querySnapshot = await getDocs(q);
    const docs = querySnapshot.docs;
    
    const hasMore = docs.length > pageSize;
    const data = docs.slice(0, pageSize).map(doc => ({
      id: doc.id,
      ...doc.data(),
    } as T & { id: string }));

    const newLastDoc = hasMore ? docs[pageSize - 1] : null;

    return {
      data,
      lastDoc: newLastDoc,
      hasMore,
    };
  }
}

// User-specific operations
export class UserService extends FirestoreService {
  private static readonly COLLECTION = 'users';

  static async createUserProfile(userId: string, profileData: any): Promise<void> {
    return this.create(this.COLLECTION, userId, profileData);
  }

  static async getUserProfile(userId: string): Promise<any> {
    return this.read(this.COLLECTION, userId);
  }

  static async updateUserProfile(userId: string, updates: any): Promise<void> {
    return this.update(this.COLLECTION, userId, updates);
  }

  static async deleteUserProfile(userId: string): Promise<void> {
    return this.delete(this.COLLECTION, userId);
  }
}

// Note: ExerciseService has been moved to exerciseService.ts with proper TypeScript types
// This legacy class is kept for backward compatibility but should be migrated

// Workout session operations
export class WorkoutService extends FirestoreService {
  private static readonly COLLECTION = 'workoutSessions';

  static async createWorkoutSession(sessionId: string, sessionData: any): Promise<void> {
    return this.create(this.COLLECTION, sessionId, sessionData);
  }

  static async getWorkoutSession(sessionId: string): Promise<any> {
    return this.read(this.COLLECTION, sessionId);
  }

  static async getUserWorkoutSessions(
    userId: string,
    pageSize: number = 10,
    lastDoc?: QueryDocumentSnapshot<DocumentData>
  ): Promise<{
    data: any[];
    lastDoc: QueryDocumentSnapshot<DocumentData> | null;
    hasMore: boolean;
  }> {
    return this.paginatedQuery(
      this.COLLECTION,
      pageSize,
      lastDoc,
      [{ field: 'userId', operator: '==', value: userId }],
      'startTime',
      'desc'
    );
  }

  static async updateWorkoutSession(sessionId: string, updates: any): Promise<void> {
    return this.update(this.COLLECTION, sessionId, updates);
  }
}

// Diet plan operations
export class DietPlanService extends FirestoreService {
  private static readonly COLLECTION = 'dietPlans';

  static async createDietPlan(planId: string, planData: any): Promise<void> {
    return this.create(this.COLLECTION, planId, planData);
  }

  static async getDietPlan(planId: string): Promise<any> {
    return this.read(this.COLLECTION, planId);
  }

  static async getUserDietPlans(userId: string): Promise<any[]> {
    return this.query(
      this.COLLECTION,
      [{ field: 'userId', operator: '==', value: userId }],
      'generatedAt',
      'desc'
    );
  }

  static async updateDietPlan(planId: string, updates: any): Promise<void> {
    return this.update(this.COLLECTION, planId, updates);
  }
}
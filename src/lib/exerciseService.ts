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
  QueryDocumentSnapshot,
  Timestamp,
  writeBatch,
} from 'firebase/firestore';
import { db } from './firebase';
import {
  Exercise,
  ExerciseCategoryInfo,
  ExerciseSearchFilters,
  ExerciseSearchResult,
  ExerciseCategory,
  DifficultyLevel,
  Equipment,
  MuscleGroup,
} from '../types/exercise';

export class ExerciseService {
  private static readonly EXERCISES_COLLECTION = 'exercises';
  private static readonly CATEGORIES_COLLECTION = 'exerciseCategories';

  // Exercise CRUD operations
  static async createExercise(exercise: Omit<Exercise, 'createdAt' | 'updatedAt'>): Promise<void> {
    const docRef = doc(db, this.EXERCISES_COLLECTION, exercise.id);
    const now = Timestamp.now();
    
    await setDoc(docRef, {
      ...exercise,
      createdAt: now,
      updatedAt: now,
    });
  }

  static async getExercise(exerciseId: string): Promise<Exercise | null> {
    const docRef = doc(db, this.EXERCISES_COLLECTION, exerciseId);
    const docSnap = await getDoc(docRef);
    
    if (docSnap.exists()) {
      return { id: docSnap.id, ...docSnap.data() } as Exercise;
    }
    return null;
  }

  static async updateExercise(
    exerciseId: string, 
    updates: Partial<Omit<Exercise, 'id' | 'createdAt' | 'updatedAt'>>
  ): Promise<void> {
    const docRef = doc(db, this.EXERCISES_COLLECTION, exerciseId);
    await updateDoc(docRef, {
      ...updates,
      updatedAt: Timestamp.now(),
    });
  }

  static async deleteExercise(exerciseId: string): Promise<void> {
    const docRef = doc(db, this.EXERCISES_COLLECTION, exerciseId);
    await deleteDoc(docRef);
  }

  // Get all exercises with optional pagination
  static async getAllExercises(
    pageSize: number = 50,
    lastDoc?: QueryDocumentSnapshot
  ): Promise<{
    exercises: Exercise[];
    lastDoc: QueryDocumentSnapshot | null;
    hasMore: boolean;
  }> {
    let q = query(
      collection(db, this.EXERCISES_COLLECTION),
      orderBy('name', 'asc'),
      limit(pageSize + 1)
    );

    if (lastDoc) {
      q = query(q, startAfter(lastDoc));
    }

    const querySnapshot = await getDocs(q);
    const docs = querySnapshot.docs;
    
    const hasMore = docs.length > pageSize;
    const exercises = docs.slice(0, pageSize).map(doc => ({
      id: doc.id,
      ...doc.data(),
    } as Exercise));

    const newLastDoc = hasMore ? docs[pageSize - 1] : null;

    return {
      exercises,
      lastDoc: newLastDoc,
      hasMore,
    };
  }

  // Advanced search with filters and relevance scoring
  static async searchExercises(
    searchTerm?: string,
    filters?: ExerciseSearchFilters,
    pageSize: number = 20,
    lastDoc?: QueryDocumentSnapshot
  ): Promise<ExerciseSearchResult & { lastDoc?: QueryDocumentSnapshot }> {
    let q = query(collection(db, this.EXERCISES_COLLECTION));

    // Apply filters
    if (filters?.category) {
      q = query(q, where('category', '==', filters.category));
    }

    if (filters?.difficulty) {
      q = query(q, where('difficulty', '==', filters.difficulty));
    }

    if (filters?.equipment && filters.equipment.length > 0) {
      q = query(q, where('equipment', 'array-contains-any', filters.equipment));
    }

    if (filters?.targetMuscles && filters.targetMuscles.length > 0) {
      q = query(q, where('targetMuscles', 'array-contains-any', filters.targetMuscles));
    }

    if (filters?.tags && filters.tags.length > 0) {
      q = query(q, where('metadata.tags', 'array-contains-any', filters.tags));
    }

    // Add ordering and pagination
    q = query(q, orderBy('metadata.popularity', 'desc'), limit(pageSize + 1));

    if (lastDoc) {
      q = query(q, startAfter(lastDoc));
    }

    const querySnapshot = await getDocs(q);
    const docs = querySnapshot.docs;
    
    const hasMore = docs.length > pageSize;
    const exerciseDocs = docs.slice(0, pageSize);
    let exercises = exerciseDocs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    } as Exercise));

    // Client-side search with relevance scoring
    if (searchTerm) {
      const searchResults = this.searchWithRelevanceScoring(exercises, searchTerm);
      exercises = searchResults.map(result => result.exercise);
    }

    const newLastDoc = hasMore ? exerciseDocs[exerciseDocs.length - 1] : undefined;

    return {
      exercises,
      totalCount: exercises.length,
      hasMore,
      filters: filters || {},
      lastDoc: newLastDoc,
    };
  }

  // Search algorithm with relevance scoring
  private static searchWithRelevanceScoring(
    exercises: Exercise[],
    searchTerm: string
  ): Array<{ exercise: Exercise; score: number }> {
    const searchLower = searchTerm.toLowerCase();
    const searchWords = searchLower.split(' ').filter(word => word.length > 0);

    const scoredExercises = exercises.map(exercise => {
      let score = 0;

      // Exact name match gets highest score
      if (exercise.name.toLowerCase() === searchLower) {
        score += 100;
      }
      // Name starts with search term
      else if (exercise.name.toLowerCase().startsWith(searchLower)) {
        score += 80;
      }
      // Name contains search term
      else if (exercise.name.toLowerCase().includes(searchLower)) {
        score += 60;
      }

      // Check individual words in name
      searchWords.forEach(word => {
        if (exercise.name.toLowerCase().includes(word)) {
          score += 20;
        }
      });

      // Check target muscles
      exercise.targetMuscles.forEach(muscle => {
        const muscleFormatted = muscle.replace('_', ' ').toLowerCase();
        if (muscleFormatted.includes(searchLower)) {
          score += 40;
        }
        searchWords.forEach(word => {
          if (muscleFormatted.includes(word)) {
            score += 15;
          }
        });
      });

      // Check secondary muscles
      exercise.secondaryMuscles?.forEach(muscle => {
        const muscleFormatted = muscle.replace('_', ' ').toLowerCase();
        if (muscleFormatted.includes(searchLower)) {
          score += 20;
        }
        searchWords.forEach(word => {
          if (muscleFormatted.includes(word)) {
            score += 10;
          }
        });
      });

      // Check equipment
      exercise.equipment.forEach(equipment => {
        const equipmentFormatted = equipment.replace('_', ' ').toLowerCase();
        if (equipmentFormatted.includes(searchLower)) {
          score += 30;
        }
        searchWords.forEach(word => {
          if (equipmentFormatted.includes(word)) {
            score += 10;
          }
        });
      });

      // Check instructions
      exercise.instructions.forEach(instruction => {
        const instructionLower = instruction.toLowerCase();
        if (instructionLower.includes(searchLower)) {
          score += 25;
        }
        searchWords.forEach(word => {
          if (instructionLower.includes(word)) {
            score += 5;
          }
        });
      });

      // Check tags
      exercise.metadata.tags.forEach(tag => {
        const tagLower = tag.toLowerCase();
        if (tagLower.includes(searchLower)) {
          score += 35;
        }
        searchWords.forEach(word => {
          if (tagLower.includes(word)) {
            score += 12;
          }
        });
      });

      // Check category
      const categoryFormatted = exercise.category.replace('_', ' ').toLowerCase();
      if (categoryFormatted.includes(searchLower)) {
        score += 30;
      }
      searchWords.forEach(word => {
        if (categoryFormatted.includes(word)) {
          score += 10;
        }
      });

      // Boost score based on popularity and rating
      score += (exercise.metadata.popularity || 0) * 0.1;
      if (exercise.metadata.averageRating) {
        score += exercise.metadata.averageRating * 5;
      }

      return { exercise, score };
    });

    // Filter out exercises with score 0 and sort by score
    return scoredExercises
      .filter(item => item.score > 0)
      .sort((a, b) => b.score - a.score);
  }

  // Get exercises by category
  static async getExercisesByCategory(
    category: ExerciseCategory,
    pageSize: number = 20
  ): Promise<Exercise[]> {
    const q = query(
      collection(db, this.EXERCISES_COLLECTION),
      where('category', '==', category),
      orderBy('name', 'asc'),
      limit(pageSize)
    );

    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    } as Exercise));
  }

  // Get exercises by difficulty
  static async getExercisesByDifficulty(
    difficulty: DifficultyLevel,
    pageSize: number = 20
  ): Promise<Exercise[]> {
    const q = query(
      collection(db, this.EXERCISES_COLLECTION),
      where('difficulty', '==', difficulty),
      orderBy('metadata.popularity', 'desc'),
      limit(pageSize)
    );

    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    } as Exercise));
  }

  // Get exercises by equipment
  static async getExercisesByEquipment(
    equipment: Equipment[],
    pageSize: number = 20
  ): Promise<Exercise[]> {
    const q = query(
      collection(db, this.EXERCISES_COLLECTION),
      where('equipment', 'array-contains-any', equipment),
      orderBy('metadata.popularity', 'desc'),
      limit(pageSize)
    );

    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    } as Exercise));
  }

  // Get exercises by muscle group
  static async getExercisesByMuscleGroup(
    muscleGroups: MuscleGroup[],
    pageSize: number = 20
  ): Promise<Exercise[]> {
    const q = query(
      collection(db, this.EXERCISES_COLLECTION),
      where('targetMuscles', 'array-contains-any', muscleGroups),
      orderBy('metadata.popularity', 'desc'),
      limit(pageSize)
    );

    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    } as Exercise));
  }

  // Get popular exercises
  static async getPopularExercises(pageSize: number = 10): Promise<Exercise[]> {
    const q = query(
      collection(db, this.EXERCISES_COLLECTION),
      orderBy('metadata.popularity', 'desc'),
      limit(pageSize)
    );

    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    } as Exercise));
  }

  // Get random exercises for recommendations
  static async getRandomExercises(
    count: number = 5,
    excludeIds: string[] = []
  ): Promise<Exercise[]> {
    // Note: Firestore doesn't support random queries natively
    // This is a simplified approach - in production, you might want to use a more sophisticated method
    const q = query(
      collection(db, this.EXERCISES_COLLECTION),
      limit(count * 3) // Get more than needed to filter out excluded ones
    );

    const querySnapshot = await getDocs(q);
    const allExercises = querySnapshot.docs
      .map(doc => ({ id: doc.id, ...doc.data() } as Exercise))
      .filter(exercise => !excludeIds.includes(exercise.id));

    // Shuffle and return requested count
    const shuffled = allExercises.sort(() => 0.5 - Math.random());
    return shuffled.slice(0, count);
  }

  // Category management
  static async createCategory(category: Omit<ExerciseCategoryInfo, 'createdAt' | 'updatedAt'>): Promise<void> {
    const docRef = doc(db, this.CATEGORIES_COLLECTION, category.id);
    const now = Timestamp.now();
    
    await setDoc(docRef, {
      ...category,
      createdAt: now,
      updatedAt: now,
    });
  }

  static async getAllCategories(): Promise<ExerciseCategoryInfo[]> {
    const querySnapshot = await getDocs(collection(db, this.CATEGORIES_COLLECTION));
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    } as ExerciseCategoryInfo));
  }

  static async getCategory(categoryId: string): Promise<ExerciseCategoryInfo | null> {
    const docRef = doc(db, this.CATEGORIES_COLLECTION, categoryId);
    const docSnap = await getDoc(docRef);
    
    if (docSnap.exists()) {
      return { id: docSnap.id, ...docSnap.data() } as ExerciseCategoryInfo;
    }
    return null;
  }

  static async updateCategoryExerciseCount(categoryId: string, count: number): Promise<void> {
    const docRef = doc(db, this.CATEGORIES_COLLECTION, categoryId);
    await updateDoc(docRef, {
      exerciseCount: count,
      updatedAt: Timestamp.now(),
    });
  }

  // Batch operations for seeding data
  static async batchCreateExercises(exercises: Omit<Exercise, 'createdAt' | 'updatedAt'>[]): Promise<void> {
    const batch = writeBatch(db);
    const now = Timestamp.now();

    exercises.forEach(exercise => {
      const docRef = doc(db, this.EXERCISES_COLLECTION, exercise.id);
      batch.set(docRef, {
        ...exercise,
        createdAt: now,
        updatedAt: now,
      });
    });

    await batch.commit();
  }

  static async batchCreateCategories(categories: Omit<ExerciseCategoryInfo, 'createdAt' | 'updatedAt'>[]): Promise<void> {
    const batch = writeBatch(db);
    const now = Timestamp.now();

    categories.forEach(category => {
      const docRef = doc(db, this.CATEGORIES_COLLECTION, category.id);
      batch.set(docRef, {
        ...category,
        createdAt: now,
        updatedAt: now,
      });
    });

    await batch.commit();
  }

  // Update exercise popularity (for recommendation algorithm)
  static async incrementExercisePopularity(exerciseId: string): Promise<void> {
    const docRef = doc(db, this.EXERCISES_COLLECTION, exerciseId);
    const docSnap = await getDoc(docRef);
    
    if (docSnap.exists()) {
      const currentPopularity = docSnap.data().metadata?.popularity || 0;
      await updateDoc(docRef, {
        'metadata.popularity': currentPopularity + 1,
        updatedAt: Timestamp.now(),
      });
    }
  }
}
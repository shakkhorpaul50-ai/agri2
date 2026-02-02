import { initializeApp, getApp, getApps } from 'firebase/app';
import { getAuth, signInWithEmailAndPassword, createUserWithEmailAndPassword } from 'firebase/auth';
import { getFirestore, doc, getDoc, setDoc, collection, getDocs, query, where, deleteDoc, limit } from 'firebase/firestore';
import { User, Field, Sensor } from '../types';

// Configuration for project: agricare-4c725
const firebaseConfig = {
  apiKey: "AIzaSyCeyl_T15XCsu0-tbXoXaZ2t7C3oMLjyF8",
  authDomain: "agricare-4c725.firebaseapp.com",
  projectId: "agricare-4c725",
  storageBucket: "agricare-4c725.appspot.com",
  messagingSenderId: "629410782904",
  appId: "1:629410782904:web:4d8f43225d8a6b4ad15e4d"
};

// Initialize app safely
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

// Access services with validation
const getAgricareAuth = () => {
  try {
    return getAuth(app);
  } catch (e) {
    console.error("Firebase Auth initialization failed:", e);
    throw e;
  }
};

const getAgricareDb = () => {
  try {
    return getFirestore(app);
  } catch (e) {
    console.error("Firebase Firestore initialization failed:", e);
    throw e;
  }
};

export const loginUser = async (email: string, pass: string): Promise<User | null> => {
  const auth = getAgricareAuth();
  const db = getAgricareDb();
  
  try {
    const cred = await signInWithEmailAndPassword(auth, email, pass);
    const userDocRef = doc(db, 'users', cred.user.uid);
    const userDoc = await getDoc(userDocRef);
    
    if (userDoc.exists()) {
      return userDoc.data() as User;
    } else {
      const fallbackUser: User = {
        id: cred.user.uid,
        name: email.split('@')[0],
        email: email,
        subscriptionPlan: 'basic',
        subscriptionEnd: new Date(Date.now() + 31536000000).toISOString()
      };
      await setDoc(userDocRef, fallbackUser);
      return fallbackUser;
    }
  } catch (authError: any) {
    console.error("Login Error:", authError);
    throw authError;
  }
};

export const registerUser = async (user: User, pass: string): Promise<User> => {
  const auth = getAgricareAuth();
  const db = getAgricareDb();

  try {
    const cred = await createUserWithEmailAndPassword(auth, user.email, pass);
    const userData = { ...user, id: cred.user.uid };
    await setDoc(doc(db, 'users', cred.user.uid), userData);
    return userData;
  } catch (e: any) {
    console.error("Registration Error:", e);
    throw e;
  }
};

export const syncFields = async (userId: string): Promise<Field[]> => {
  try {
    const db = getAgricareDb();
    const q = query(collection(db, 'fields'), where('user_id', '==', userId));
    const snap = await getDocs(q);
    return snap.docs.map(d => d.data() as Field);
  } catch (e) {
    console.error("Sync Fields Error:", e);
    return [];
  }
};

export const addFieldToDb = async (field: Field): Promise<void> => {
  try {
    const db = getAgricareDb();
    await setDoc(doc(db, 'fields', field.field_id.toString()), field);
  } catch (e) {
    console.error("Add Field Error:", e);
  }
};

export const syncSensorsFromDb = async (userFields: Field[]): Promise<Sensor[]> => {
  if (userFields.length === 0) return [];
  try {
    const db = getAgricareDb();
    const userFieldIds = userFields.map(f => f.field_id);
    const chunks = [];
    for (let i = 0; i < userFieldIds.length; i += 10) {
      chunks.push(userFieldIds.slice(i, i + 10));
    }

    const allSensors: Sensor[] = [];
    for (const chunk of chunks) {
      const q = query(collection(db, 'sensors'), where('field_id', 'in', chunk));
      const snap = await getDocs(q);
      snap.forEach(d => allSensors.push(d.data() as Sensor));
    }
    return allSensors;
  } catch (e) {
    console.error("Sync Sensors Error:", e);
    return [];
  }
};

export const addOrUpdateSensorInDb = async (sensor: Sensor): Promise<void> => {
  try {
    const db = getAgricareDb();
    await setDoc(doc(db, 'sensors', sensor.sensor_id.toString()), sensor);
  } catch (e) {
    console.error("Update Sensor Error:", e);
  }
};

export const deleteSensorFromDb = async (id: number): Promise<void> => {
  try {
    const db = getAgricareDb();
    await deleteDoc(doc(db, 'sensors', id.toString()));
  } catch (e) {
    console.error("Delete Sensor Error:", e);
  }
};

// --- Review Persistence ---
export interface Review {
  id: string;
  name: string;
  rating: number;
  text: string;
  date: string;
  createdAt: number;
}

export const getReviews = async (): Promise<Review[]> => {
  try {
    const db = getAgricareDb();
    // Fetch limited set of reviews
    const q = query(collection(db, 'reviews'), limit(30));
    const snap = await getDocs(q);
    const reviews = snap.docs.map(d => d.data() as Review);
    // Client-side sort to ensure consistent display without needing composite indexes immediately
    return reviews.sort((a, b) => b.createdAt - a.createdAt);
  } catch (e: any) {
    console.error("Get Reviews Error:", e);
    return [];
  }
};

export const saveReview = async (review: Review): Promise<void> => {
  try {
    const db = getAgricareDb();
    // Saving with a specific ID (timestamp) to match the fields/users pattern
    await setDoc(doc(db, 'reviews', review.id), review);
  } catch (e: any) {
    console.error("Save Review Error (Verify Firebase Security Rules):", e);
    throw e;
  }
};

export const DbService = {
  getFields: syncFields,
  getSensors: async (fieldIds: number[]) => {
    if (fieldIds.length === 0) return [];
    try {
      const db = getAgricareDb();
      const q = query(collection(db, 'sensors'), where('field_id', 'in', fieldIds));
      const snap = await getDocs(q);
      return snap.docs.map(d => d.data() as Sensor);
    } catch (e) {
      console.error("DbService getSensors error:", e);
      return [];
    }
  },
  getReviews,
  saveReview
};
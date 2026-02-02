
import { initializeApp, getApp, getApps, FirebaseApp } from 'firebase/app';
import { 
  getFirestore, 
  doc, 
  setDoc, 
  getDoc, 
  collection, 
  getDocs, 
  query, 
  where,
  deleteDoc,
  limit,
  Firestore
} from 'firebase/firestore';
import { 
  getAuth, 
  signInWithPopup, 
  GoogleAuthProvider, 
  Auth 
} from 'firebase/auth';
import { User, Field, Sensor } from '../types';

const firebaseConfig = {
  apiKey: "AIzaSyCeyl_T15XCsu0-tbXoXaZ2t7C3oMLjyF8",
  authDomain: "agricare-4c725.firebaseapp.com",
  projectId: "agricare-4c725",
  storageBucket: "agricare-4c725.appspot.com",
  messagingSenderId: "629410782904",
  appId: "1:629410782904:web:4d8f43225d8a6b4ad15e4d"
};

// ABSOLUTE IDENTITY CONSTANTS
export const ADMIN_EMAIL = 'shakkhorpaul50@gmail.com';

let db: Firestore;
let auth: Auth;

const initializeFirebase = () => {
  try {
    const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
    db = getFirestore(app);
    auth = getAuth(app);
    console.log("Firebase/Firestore connected successfully");
  } catch (err) {
    console.error("Firebase initialization failed:", err);
  }
};

initializeFirebase();

export const isDatabaseEnabled = () => !!db;
export const isAdmin = (email: string) => email.toLowerCase().trim() === ADMIN_EMAIL;

/**
 * Authentication via Google Popup
 */
export const loginWithGoogle = async (): Promise<User | null> => {
  if (!auth || !db) throw new Error("Database or Auth not initialized");
  const provider = new GoogleAuthProvider();
  const result = await signInWithPopup(auth, provider);
  const user = result.user;

  if (user && user.email) {
    const emailLower = user.email.toLowerCase();
    const userRef = doc(db, 'users', emailLower);
    const snap = await getDoc(userRef);
    
    let agricareUser: User;
    
    if (snap.exists()) {
      agricareUser = snap.data() as User;
    } else {
      agricareUser = {
        id: user.uid,
        name: user.displayName || 'Farmer',
        email: emailLower,
        picture: user.photoURL || '',
        googleId: user.uid,
        subscriptionPlan: 'basic',
        subscriptionEnd: new Date(Date.now() + 31536000000).toISOString()
      };
      await setDoc(userRef, agricareUser);
    }
    return agricareUser;
  }
  return null;
};

/**
 * Agricare Data Operations
 */
export const syncFields = async (userId: string): Promise<Field[]> => {
  if (!db) return [];
  try {
    const q = query(collection(db, 'fields'), where('user_id', '==', userId));
    const snap = await getDocs(q);
    return snap.docs.map(d => d.data() as Field);
  } catch (e) {
    console.error("Sync Fields Error:", e);
    return [];
  }
};

export const addFieldToDb = async (field: Field): Promise<void> => {
  if (!db) throw new Error("Database offline");
  await setDoc(doc(db, 'fields', String(field.field_id)), field);
};

export const syncSensorsFromDb = async (userFields: Field[]): Promise<Sensor[]> => {
  if (!db || userFields.length === 0) return [];
  const userFieldIds = userFields.map(f => f.field_id);
  const allSensors: Sensor[] = [];
  try {
    // Firestore "in" query limited to 10 items
    for (let i = 0; i < userFieldIds.length; i += 10) {
      const chunk = userFieldIds.slice(i, i + 10);
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
  if (!db) throw new Error("Database offline");
  await setDoc(doc(db, 'sensors', String(sensor.sensor_id)), sensor);
};

export const deleteSensorFromDb = async (id: number): Promise<void> => {
  if (!db) throw new Error("Database offline");
  await deleteDoc(doc(db, 'sensors', String(id)));
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
  if (!db) return [];
  try {
    const q = query(collection(db, 'reviews'), limit(30));
    const snap = await getDocs(q);
    const reviews = snap.docs.map(d => d.data() as Review);
    return reviews.sort((a, b) => b.createdAt - a.createdAt);
  } catch (e) {
    return [];
  }
};

export const saveReview = async (review: Review): Promise<void> => {
  if (!db) throw new Error("Database offline");
  await setDoc(doc(db, 'reviews', review.id), review, { merge: true });
};

export const DbService = {
  getFields: syncFields,
  getSensors: async (fieldIds: number[]) => {
    if (!db || fieldIds.length === 0) return [];
    const q = query(collection(db, 'sensors'), where('field_id', 'in', fieldIds));
    const snap = await getDocs(q);
    return snap.docs.map(d => d.data() as Sensor);
  },
  getReviews,
  saveReview
};

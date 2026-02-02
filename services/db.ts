import { initializeApp, getApp, getApps, FirebaseApp } from 'firebase/app';
import { getAuth, signInWithEmailAndPassword, createUserWithEmailAndPassword, Auth } from 'firebase/auth';
import { getFirestore, doc, getDoc, setDoc, collection, getDocs, query, where, deleteDoc, Firestore } from 'firebase/firestore';
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

// Singleton pattern to ensure Firebase is initialized before services are called
let appInstance: FirebaseApp;
let authInstance: Auth;
let dbInstance: Firestore;

const getAgricareApp = () => {
  if (!appInstance) {
    appInstance = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
  }
  return appInstance;
};

const getAgricareAuth = () => {
  if (!authInstance) {
    authInstance = getAuth(getAgricareApp());
  }
  return authInstance;
};

const getAgricareDb = () => {
  if (!dbInstance) {
    dbInstance = getFirestore(getAgricareApp());
  }
  return dbInstance;
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
  const db = getAgricareDb();
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
  const db = getAgricareDb();
  try {
    await setDoc(doc(db, 'fields', field.field_id.toString()), field);
  } catch (e) {
    console.error("Add Field Error:", e);
  }
};

export const syncSensorsFromDb = async (userFields: Field[]): Promise<Sensor[]> => {
  const db = getAgricareDb();
  if (userFields.length === 0) return [];
  try {
    const userFieldIds = userFields.map(f => f.field_id);
    // Firestore 'in' queries limited to 10 items
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
  const db = getAgricareDb();
  try {
    await setDoc(doc(db, 'sensors', sensor.sensor_id.toString()), sensor);
  } catch (e) {
    console.error("Update Sensor Error:", e);
  }
};

export const deleteSensorFromDb = async (id: number): Promise<void> => {
  const db = getAgricareDb();
  try {
    await deleteDoc(doc(db, 'sensors', id.toString()));
  } catch (e) {
    console.error("Delete Sensor Error:", e);
  }
};

export const DbService = {
  getFields: syncFields,
  getSensors: async (fieldIds: number[]) => {
    const db = getAgricareDb();
    if (fieldIds.length === 0) return [];
    try {
      const q = query(collection(db, 'sensors'), where('field_id', 'in', fieldIds));
      const snap = await getDocs(q);
      return snap.docs.map(d => d.data() as Sensor);
    } catch (e) {
      console.error("DbService getSensors error:", e);
      return [];
    }
  }
};
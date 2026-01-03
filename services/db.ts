
import { initializeApp } from 'firebase/app';
import { getAuth, signInWithEmailAndPassword, createUserWithEmailAndPassword, Auth } from 'firebase/auth';
import { getFirestore, doc, getDoc, setDoc, collection, getDocs, query, where, deleteDoc, Firestore } from 'firebase/firestore';
import { User, Field, Sensor } from '../types';

// Hardcoded Firebase Configuration
const firebaseConfig = {
  apiKey: "AIzaSyCeyl_T15XCsu0-tbXoXaZ2t7C3oMLjyF8",
  authDomain: "agricare-4c725.firebaseapp.com",
  projectId: "agricare-4c725",
  storageBucket: "agricare-4c725.appspot.com",
  messagingSenderId: "629410782904",
  appId: "1:629410782904:web:4d8f43225d8a6b4ad15e4d"
};

// Initialize Firebase once on module load
const app = initializeApp(firebaseConfig);
const auth: Auth = getAuth(app);
const db: Firestore = getFirestore(app);

export const isFirebaseEnabled = () => true;

export const loginUser = async (email: string, pass: string): Promise<User | null> => {
  try {
    const cred = await signInWithEmailAndPassword(auth, email, pass);
    const userDoc = await getDoc(doc(db, 'users', cred.user.uid));
    if (userDoc.exists()) {
      return userDoc.data() as User;
    }
    return null;
  } catch (e) {
    console.error("Firebase Login Failed", e);
    // Fallback to local storage for demo purposes if user exists there
    const users = JSON.parse(localStorage.getItem('agricare_registered_users') || '[]');
    return users.find((u: User) => u.email === email) || null;
  }
};

export const registerUser = async (user: User, pass: string): Promise<User> => {
  try {
    const cred = await createUserWithEmailAndPassword(auth, user.email, pass);
    const userData = { ...user, id: cred.user.uid };
    await setDoc(doc(db, 'users', cred.user.uid), userData);
    return userData;
  } catch (e) {
    console.error("Firebase Registration Failed", e);
    const users = JSON.parse(localStorage.getItem('agricare_registered_users') || '[]');
    localStorage.setItem('agricare_registered_users', JSON.stringify([...users, user]));
    return user;
  }
};

export const syncFields = async (userId: string): Promise<Field[]> => {
  try {
    const q = query(collection(db, 'fields'), where('user_id', '==', userId));
    const snap = await getDocs(q);
    const cloudFields = snap.docs.map(d => d.data() as Field);
    localStorage.setItem('agricare_fields', JSON.stringify(cloudFields));
    return cloudFields;
  } catch (e) {
    const saved = localStorage.getItem('agricare_fields');
    return saved ? JSON.parse(saved).filter((f: Field) => f.user_id === userId) : [];
  }
};

export const addFieldToDb = async (field: Field): Promise<void> => {
  try {
    await setDoc(doc(db, 'fields', field.field_id.toString()), field);
  } catch (e) {
    const saved = JSON.parse(localStorage.getItem('agricare_fields') || '[]');
    localStorage.setItem('agricare_fields', JSON.stringify([...saved, field]));
  }
};

export const syncSensorsFromDb = async (userFields: Field[]): Promise<Sensor[]> => {
  try {
    const userFieldIds = userFields.map(f => f.field_id);
    if (userFieldIds.length === 0) return [];
    
    const q = query(collection(db, 'sensors'), where('field_id', 'in', userFieldIds));
    const snap = await getDocs(q);
    return snap.docs.map(d => d.data() as Sensor);
  } catch (e) {
    const saved = localStorage.getItem('agricare_sensors');
    return saved ? JSON.parse(saved) : [];
  }
};

export const addOrUpdateSensorInDb = async (sensor: Sensor): Promise<void> => {
  try {
    await setDoc(doc(db, 'sensors', sensor.sensor_id.toString()), sensor);
  } catch (e) {
    const saved = JSON.parse(localStorage.getItem('agricare_sensors') || '[]');
    const idx = saved.findIndex((s: any) => s.sensor_id === sensor.sensor_id);
    if (idx > -1) saved[idx] = sensor; else saved.push(sensor);
    localStorage.setItem('agricare_sensors', JSON.stringify(saved));
  }
};

export const deleteSensorFromDb = async (id: number): Promise<void> => {
  try {
    await deleteDoc(doc(db, 'sensors', id.toString()));
  } catch (e) {
    const saved = JSON.parse(localStorage.getItem('agricare_sensors') || '[]');
    localStorage.setItem('agricare_sensors', JSON.stringify(saved.filter((s: any) => s.sensor_id !== id)));
  }
};

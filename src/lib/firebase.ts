import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

// Exact Firebase project configuration supplied by project owner
export const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "AIzaSyAch3kQaI20XICUGojU28ZAk01ngOuVsnA",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "manshi-setu.firebaseapp.com",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "manshi-setu",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "manshi-setu.firebasestorage.app",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "674979770488",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:674979391238254:web:3901c22cb4f4556d39fd8d",
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID || "G-DXVGW4014F"
};

// Singleton initialization
export const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
export const auth = getAuth(app);
export const db = getFirestore(app);

// Authorized Director Email Constant
export const AUTHORIZED_DIRECTOR_EMAIL = (
  import.meta.env.VITE_AUTHORIZED_DIRECTOR_EMAIL || "devenjhaofficial@gmail.com"
).trim().toLowerCase();

export default app;

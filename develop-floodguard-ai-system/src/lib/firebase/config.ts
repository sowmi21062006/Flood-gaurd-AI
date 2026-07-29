import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyAKSZYG6cLkfKm46w2SjgQSgUqbIvepaJ8",
  authDomain: "floodguard-ai-73f4d.firebaseapp.com",
  projectId: "floodguard-ai-73f4d",
  storageBucket: "floodguard-ai-73f4d.firebasestorage.app",
  messagingSenderId: "41139723767",
  appId: "1:41139723767:web:ccf889bc1e4f91d2e762f2",
  measurementId: "G-M0MRNFG5LC"
};

const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
export const auth = getAuth(app);
export const db = getFirestore(app);
export default app;

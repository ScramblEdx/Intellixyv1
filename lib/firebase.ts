import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: "AIzaSyB6SI7fGLsFmelhBFANcKGAHR5z085N7Hs",
  authDomain: "studynow-f1830.firebaseapp.com",
  projectId: "studynow-f1830",
  storageBucket: "studynow-f1830.firebasestorage.app",
  messagingSenderId: "622735751305",
  appId: "1:622735751305:web:68936be00969be9a786e58",
  measurementId: "G-657TPGXR0N"
};

export const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);
export const googleProvider = new GoogleAuthProvider();

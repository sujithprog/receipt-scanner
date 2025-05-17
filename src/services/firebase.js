// src/services/firebase.js
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyCsvA7wS80-kNJA1utvyR9qKr6ACekOea0",
  authDomain: "receipt-scanner-1d412.firebaseapp.com",
  projectId: "receipt-scanner-1d412",
  storageBucket: "receipt-scanner-1d412.firebasestorage.app",
  messagingSenderId: "513630656538",
  appId: "1:513630656538:web:e4b7c28bd73508d15219a3",
  measurementId: "G-JTRE3SRM0X"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Export the services we'll need
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);
export default app;
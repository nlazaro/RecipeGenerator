// Import the functions you need from the SDKs you need
import { initializeApp } from 'firebase/app';
import { getAnalytics } from 'firebase/analytics';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getFunctions } from 'firebase/functions';

// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyBv40ATAJtDVPh5APVAAvy4nFYHh4ePs8U",
  authDomain: "recipegenerator-6f16b.firebaseapp.com",
  projectId: "recipegenerator-6f16b",
  storageBucket: "recipegenerator-6f16b.firebasestorage.app",
  messagingSenderId: "1088679632903",
  appId: "1:1088679632903:web:324e84e859a9e687178aa2",
  measurementId: "G-QHYGYH1SKY"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);

// Initialize Firebase Authentication and get a reference to the service
export const auth = getAuth(app);

// Initialize Cloud Firestore and get a reference to the service
export const db = getFirestore(app);

// Initialize Cloud Functions
export const functions = getFunctions(app);

// Google Auth Provider
export const googleProvider = new GoogleAuthProvider();

// Google Auth Provider
export const googleProvider = new GoogleAuthProvider();
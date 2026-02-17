// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getFirestore } from "firebase/firestore"
import { getAuth } from "firebase/auth/web-extension";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyBE3G5pPPNlW0TOcjzcfSNAXk02K8wc3VA",
  authDomain: "currensee-b7ff0.firebaseapp.com",
  projectId: "currensee-b7ff0",
  storageBucket: "currensee-b7ff0.firebasestorage.app",
  messagingSenderId: "322508371487",
  appId: "1:322508371487:web:9057a6b36528c09a80472a",
  measurementId: "G-6ND6GNQ3TZ"
};

// Initialize Firebase app
const app = initializeApp(firebaseConfig)

// Initialize and export Auth
export const auth = getAuth(app)

// Initialize and export Firestore
export const db = getFirestore(app)
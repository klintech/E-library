// src/firebase.js
import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyB1DOen5gVv1CFBY8o8O9E4q97VhAMC5dg",
  authDomain: "e-library-ffd03.firebaseapp.com",
  projectId: "e-library-ffd03",
  storageBucket: "e-library-ffd03.firebasestorage.app",
  messagingSenderId: "526082619341",
  appId: "1:526082619341:web:4b8e8de31a26f351d67684",
  measurementId: "G-BFMF6WSVBB"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
// src/firebase.js
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getFunctions } from "firebase/functions";

const firebaseConfig = {
    apiKey: "AIzaSyCU28rDOzHnMzfDS4z36iT6x5gckDxgZzY",
    authDomain: "ujaas-aroma.firebaseapp.com",
    projectId: "ujaas-aroma",
    storageBucket: "ujaas-aroma.firebasestorage.app",
    messagingSenderId: "1006780633968",
    appId: "1:1006780633968:web:ac0a6da25c0aebf87935b5",
    measurementId: "G-89GJELF98M"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const functions = getFunctions(app, "us-central1");

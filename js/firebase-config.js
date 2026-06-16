/*  ═══════════════════════════════════════════════════════
    FIREBASE CONFIG — IMPRINT
    Replace the placeholder values below with your real
    Firebase project credentials from the Firebase Console.
    See FIREBASE_SETUP.md for step-by-step instructions.
    ═══════════════════════════════════════════════════════ */

import { initializeApp } from "https://www.gstatic.com/firebasejs/11.9.0/firebase-app.js";
import { getFirestore, collection, addDoc, getDocs, deleteDoc, doc, query, orderBy, onSnapshot, serverTimestamp }
  from "https://www.gstatic.com/firebasejs/11.9.0/firebase-firestore.js";
import { getStorage, ref, uploadBytes, getDownloadURL }
  from "https://www.gstatic.com/firebasejs/11.9.0/firebase-storage.js";

// ┌──────────────────────────────────────────────────────┐
// │  🔥 REPLACE THESE WITH YOUR FIREBASE CONFIG VALUES  │
// └──────────────────────────────────────────────────────┘
const firebaseConfig = {
  apiKey:            "YOUR_API_KEY",
  authDomain:        "YOUR_PROJECT.firebaseapp.com",
  projectId:         "YOUR_PROJECT_ID",
  storageBucket:     "YOUR_PROJECT.firebasestorage.app",
  messagingSenderId: "YOUR_SENDER_ID",
  appId:             "YOUR_APP_ID"
};

const app = initializeApp(firebaseConfig);
const db  = getFirestore(app);
const storage = getStorage(app);

export {
  db, storage,
  collection, addDoc, getDocs, deleteDoc, doc,
  query, orderBy, onSnapshot, serverTimestamp,
  ref, uploadBytes, getDownloadURL
};

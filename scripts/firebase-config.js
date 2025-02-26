// firebaseConfig.js
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

// Firebase konfigurace (nahraď vlastními údaji)
const firebaseConfig = {
  apiKey: "AIzaSyDcD9dwIQfUTnfXCxn5ZiZqj1710BsDILk",
  authDomain: "vylety.tiiny.site",
  projectId: "journey-web-889",
  storageBucket: "journey-web-889.firebasestorage.app",
  messagingSenderId: "164318039168",
  appId: "1:164318039168:web:780444be95d0fb51bcea65",
  measurementId: "G-N7S1LQKET5"
};

// Inicializace Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// Export Firestore instance
export { db };
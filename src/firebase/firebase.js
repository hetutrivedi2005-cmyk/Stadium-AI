import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
import { CONFIG } from "../config.js";

// Initialize Firebase App
const app = initializeApp(CONFIG.FIREBASE_CONFIG);

// Get Auth and Firestore instances
const auth = getAuth(app);
const db = getFirestore(app);

export { app, auth, db };

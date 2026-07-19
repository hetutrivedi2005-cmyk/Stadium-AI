import { auth, db } from '../firebase/firebase.js';
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signOut, 
  sendPasswordResetEmail, 
  updateProfile as firebaseUpdateProfile 
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import { 
  doc, 
  setDoc, 
  getDoc, 
  updateDoc 
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
import { globalState } from '../state/global-state.js';

class AuthService {
  /**
   * User registration: Creates user in Firebase Auth and saves role in Firestore "users" collection
   */
  async register(fullName, email, password, role) {
    // 1. Create Firebase Auth credentials
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;
    
    // 2. Set Firebase Auth display name
    await firebaseUpdateProfile(user, {
      displayName: fullName,
      photoURL: `https://ui-avatars.com/api/?name=${encodeURIComponent(fullName)}&background=00B050&color=fff`
    });

    // 3. Document payload
    const userProfile = {
      uid: user.uid,
      fullName: fullName,
      email: email.toLowerCase().trim(),
      role: role,
      createdAt: new Date().toISOString(),
      photoURL: user.photoURL
    };

    // 4. Save metadata to Firestore users collection
    await setDoc(doc(db, "users", user.uid), userProfile);

    return userProfile;
  }

  /**
   * User login: Signs user in and retrieves their profile details from Firestore
   */
  async login(email, password) {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;

    // Fetch details from Firestore doc
    const profile = await this.getUserProfile(user.uid);
    if (!profile) {
      throw new Error("User record not found in Firestore.");
    }

    return profile;
  }

  /**
   * Fetch Firestore User document details
   */
  async getUserProfile(uid) {
    const docRef = doc(db, "users", uid);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      return docSnap.data();
    }
    return null;
  }

  /**
   * Sends password reset email
   */
  async resetPassword(email) {
    await sendPasswordResetEmail(auth, email);
    return true;
  }

  /**
   * Update active user profile details
   */
  async updateProfile(profileData) {
    const user = auth.currentUser;
    if (!user) throw new Error("No active user session.");

    const updates = {};
    if (profileData.fullName) {
      updates.fullName = profileData.fullName;
      await firebaseUpdateProfile(user, { displayName: profileData.fullName });
    }
    if (profileData.venue) {
      updates.venue = profileData.venue;
    }
    
    // Update doc in Firestore
    const docRef = doc(db, "users", user.uid);
    await updateDoc(docRef, updates);

    // Fetch fresh profile
    const freshProfile = await this.getUserProfile(user.uid);
    globalState.saveSession(freshProfile);
    return freshProfile;
  }

  /**
   * Logout user from Firebase
   */
  async logout() {
    await signOut(auth);
    globalState.saveSession(null);
  }
}

export const authService = new AuthService();

import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyDKwmWYx-DxYjXaa-iPl4MsGnFU9qWEtOs",
  authDomain: "campusconnect-c3478.firebaseapp.com",
  projectId: "campusconnect-c3478",
  storageBucket: "campusconnect-c3478.firebasestorage.app",
  messagingSenderId: "577178601861",
  appId: "1:577178601861:web:e9e73904b98fac6fd59cec"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Export Auth and Database so our app can use them
export const auth = getAuth(app);
export const db = getFirestore(app);
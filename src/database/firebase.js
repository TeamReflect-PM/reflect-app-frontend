import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
    apiKey: "AIzaSyBv6JiAK3JZf6xDm7nmUNcvv9lROu6HnW8", // Replace with your actual API key
    appId: "1:82793278054:web:f6ded540d0640512c75ba7", // Replace with your actual App ID
    messagingSenderId: "82793278054", // Replace with your actual Sender ID
    projectId: "reflect1-471514",
    authDomain: "reflect1-471514.firebaseapp.com",
    storageBucket: "reflect1-471514.firebasestorage.app"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export default app;
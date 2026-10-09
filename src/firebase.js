import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
    apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
    authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
    projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
    appId: import.meta.env.VITE_FIREBASE_APP_ID,
};
console.log(
    "Firebase API key loaded:",
    Boolean(import.meta.env.VITE_FIREBASE_API_KEY)
);
console.log(
    "Firebase Project ID:",
    import.meta.env.VITE_FIREBASE_PROJECT_ID
);
const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
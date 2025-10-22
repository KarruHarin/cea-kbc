// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import {getDatabase} from "firebase/database"
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyB2ybQxylDCSk6KCU4WZw0JU9BZUb6UjOo",
  authDomain: "kbc-game-13588.firebaseapp.com",
  databaseURL: "https://kbc-game-13588-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "kbc-game-13588",
  storageBucket: "kbc-game-13588.firebasestorage.app",
  messagingSenderId: "1013045720133",
  appId: "1:1013045720133:web:49d548bcc4e059ec001f2c"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

export const db = getDatabase(app);
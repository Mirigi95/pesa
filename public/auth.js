import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyCGBaJh_XfmlTuBA0xQJJ4c-R5S4tZ6ib0",
  authDomain: "arbitrage-4a92b.firebaseapp.com",
  databaseURL: "https://arbitrage-4a92b-default-rtdb.firebaseio.com",
  projectId: "arbitrage-4a92b",
  storageBucket: "arbitrage-4a92b.appspot.com",
  messagingSenderId: "864484742329",
  appId: "1:864484742329:web:64e6ce8073f2ba5ba6f768",
  measurementId: "G-2SYWWVM5P4"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
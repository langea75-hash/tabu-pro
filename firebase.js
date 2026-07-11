import { initializeApp } from "https://www.gstatic.com/firebasejs/12.0.0/firebase-app.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/12.0.0/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyCLmKBM8OoqcLAVZhIHvuF0_e0trsu8-5Q",
  authDomain: "tabu-pro-online-7cf64.firebaseapp.com",
  projectId: "tabu-pro-online-7cf64",
  storageBucket: "tabu-pro-online-7cf64.firebasestorage.app",
  messagingSenderId: "498221308101",
  appId: "1:498221308101:web:fa6b8efea669a6d10db8ac"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);

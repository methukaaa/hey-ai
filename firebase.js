import { initializeApp } from 
"https://www.gstatic.com/firebasejs/11.0.2/firebase-app.js";


import { 
    getAuth 
} from 
"https://www.gstatic.com/firebasejs/11.0.2/firebase-auth.js";


import {
    getFirestore
}
from
"https://www.gstatic.com/firebasejs/11.0.2/firebase-firestore.js";



const firebaseConfig = {
    apiKey: "AIzaSyDa80R28TTMrK8Q1Sp3Ku7l-a8gGVGYeMA",
    authDomain: "hey-ai-1411.firebaseapp.com",
    projectId: "hey-ai-1411",
    storageBucket: "hey-ai-1411.firebasestorage.app",
    messagingSenderId: "920828669198",
    appId: "1:920828669198:web:9209cfb7de04f40c48fb5f",
    measurementId: "G-3JJK48Q9RW"
};



const app = initializeApp(firebaseConfig);

const auth = getAuth(app);

const db = getFirestore(app);


export { auth, db };
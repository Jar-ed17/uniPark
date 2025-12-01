
// firebase-config.js

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.10.0/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/10.10.0/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.10.0/firebase-firestore.js";


// 👉 REEMPLAZA valores por los tuyos EXACTOS
export const firebaseConfig = {
    apiKey: "AIzaSyA0rLOKI_rmLN8gTOfDF9fshRvjo-Eoj6k",
    authDomain: "control-accesos-campus.firebaseapp.com",
    projectId: "control-accesos-campus",
    storageBucket: "control-accesos-campus.firebasestorage.app",
    messagingSenderId: "509232857240",
    appId: "1:509232857240:web:ff54b1304eee956cc6d0ed",
    measurementId: "G-YKKRJMWZB1"
};

export const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);

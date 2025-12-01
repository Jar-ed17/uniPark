import { auth, db } from "./firebase-config.js";

import {
    signInWithEmailAndPassword
} from "https://www.gstatic.com/firebasejs/10.10.0/firebase-auth.js";

import {
    doc,
    getDoc
} from "https://www.gstatic.com/firebasejs/10.10.0/firebase-firestore.js";

const btnLogin = document.getElementById("btnLogin");
const msg = document.getElementById("msg");

btnLogin.addEventListener("click", login);

async function login() {
    const correo = document.getElementById("email").value.trim();
    const password = document.getElementById("password").value.trim();

    if (!correo || !password) {
        msg.textContent = "Ingrese correo y contraseña ⚠️";
        return;
    }

    try {

        // 1. Iniciar sesión
        const userCredential = await signInWithEmailAndPassword(auth, correo, password);
        const uid = userCredential.user.uid;

        // 2. Obtener datos del usuario
        const ref = doc(db, "users", uid);
        const snap = await getDoc(ref);

        if (!snap.exists()) {
            msg.textContent = "Usuario no encontrado en la base de datos ❌";
            return;
        }

        const userData = snap.data();
        const rol = userData.rol;

        // 3. Redirección según rol
        if (rol === "admin") {
            window.location.href = "admin-dashboard.html";
        }
        else if (rol === "seguridad") {
            window.location.href = "guard-dashboard.html";
        }
        else if (rol === "estudiante") {
            window.location.href = "student-dashboard.html";
        }
        else if (rol === "profesor") {
            window.location.href = "profesor-dashboard.html";
        }
        else if (rol === "director") {
    window.location.href = "director-dashboard.html";
  }

        else {  
            msg.textContent = "Rol no válido ❌";
        }

    } catch (error) {
        console.error("Error al iniciar sesión:", error);

        if (error.code === "auth/user-not-found" || error.code === "auth/wrong-password") {
            msg.textContent = "Correo o contraseña incorrectos ❌";
        } else {
            msg.textContent = "Error: " + error.message;
        }
    }
}

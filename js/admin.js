import { auth, db } from "./firebase-config.js";

// CORRECCIÓN: Todo lo de 'auth' en una sola importación
import { 
    createUserWithEmailAndPassword,
    signOut 
} from "https://www.gstatic.com/firebasejs/10.10.0/firebase-auth.js";

import { 
    collection, doc, setDoc, getDocs 
} from "https://www.gstatic.com/firebasejs/10.10.0/firebase-firestore.js";

const msg = document.getElementById("msg");
const tabla = document.getElementById("tablaUsuarios");

// --------------------------------------------------
// CREAR USUARIO
// --------------------------------------------------
export async function crearUsuario() {
    const nombre = document.getElementById("nombre").value.trim();
    const correo = document.getElementById("email").value.trim();
    const password = document.getElementById("password").value.trim();
    const rol = document.getElementById("rol").value;
    const matricula = document.getElementById("matricula").value.trim();
    const placa = document.getElementById("placa").value.trim();
    const tipoVehiculo = document.getElementById("tipoVehiculo").value;

    // VALIDACIONES
    if (!nombre || !correo || !password || !rol || !matricula || !placa || !tipoVehiculo) {
        msg.textContent = "Todos los campos son obligatorios ❌";
        return;
    }

    try {
        // 1. Crear usuario en Firebase Authentication
        const userCredential = await createUserWithEmailAndPassword(auth, correo, password);
        const uid = userCredential.user.uid;

        // 2. Crear documento en Firestore usando el UID
        await setDoc(doc(db, "users", uid), {
            nombre,
            correo,
            rol,
            matricula,
            placa,
            tipoVehiculo,
            qrAsignado: "",
            activo: true
        });

        msg.textContent = "Usuario creado correctamente 🎉";

        // Refrescar tabla
        cargarUsuarios();

    } catch (error) {
        console.error("Error al crear usuario:", error);
        msg.textContent = "Error: " + error.message;
    }
}

// --------------------------------------------------
// LISTAR USUARIOS
// --------------------------------------------------
async function cargarUsuarios() {
    tabla.innerHTML = "";

    try {
        const q = await getDocs(collection(db, "users"));

        q.forEach(docu => {
            const u = docu.data();

            tabla.innerHTML += `
                <tr>
                    <td>${u.nombre}</td>
                    <td>${u.correo}</td>
                    <td>${u.rol}</td>
                    <td>${u.matricula}</td>
                    <td>${u.tipoVehiculo} (${u.placa})</td>
                </tr>
            `;
        });

    } catch (error) {
        console.error("Error al cargar usuarios:", error);
    }
}

// Cargar lista al iniciar
cargarUsuarios();

// Hacer la función accesible globalmente para el onclick del HTML
window.crearUsuario = crearUsuario;

// --------------------------------------------------
// CERRAR SESIÓN
// --------------------------------------------------
const btnLogout = document.getElementById("btnLogout");
if (btnLogout) {
    btnLogout.addEventListener("click", async () => {
        try {
            await signOut(auth);
            window.location.href = "login.html"; // Redirigir al login
        } catch (error) {
            console.error("Error al cerrar sesión:", error);
        }
    });
}
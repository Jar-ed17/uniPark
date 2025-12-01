import { auth, db } from "./firebase-config.js";
import {
    onAuthStateChanged,
    signOut
} from "https://www.gstatic.com/firebasejs/10.10.0/firebase-auth.js";

import {
    doc,
    getDoc,
    onSnapshot
} from "https://www.gstatic.com/firebasejs/10.10.0/firebase-firestore.js";

// Elementos DOM
const infoProfesor = document.getElementById("infoProfesor");
const qrContainer = document.getElementById("qr-container");
const cupos = document.getElementById("cupos");
const btnRegenerar = document.getElementById("btnRegenerar");

// =========================================
// Cargar datos del profesor
// =========================================
onAuthStateChanged(auth, async (user) => {
    if (!user) return window.location.href = "login.html";

    const snap = await getDoc(doc(db, "users", user.uid));

    if (!snap.exists()) {
        infoProfesor.textContent = "Usuario no encontrado.";
        return;
    }

    const p = snap.data();

    // Mostrar información
    infoProfesor.innerHTML = `
        <p><b>Nombre:</b> ${p.nombre}</p>
        <p><b>Matrícula:</b> ${p.matricula}</p>
        <p><b>Vehículo:</b> ${p.tipoVehiculo} (${p.placa})</p>
        <p><b>Estacionamiento:</b> ${p.estacion}</p>
        <p><b>Categoría:</b> ${p.categoria}</p>
        <p><b>Rol:</b> Profesor / Administrativo</p>
    `;

    generarQR(user.uid, p);
});

// =========================================
// Generar QR
// =========================================
function generarQR(uid, data) {

    qrContainer.innerHTML = ""; // limpiar QR anterior

    const contenido = JSON.stringify({
        uid: uid,
        estacion: data.estacion,
        categoria: data.categoria,
        nombre: data.nombre
    });

    new QRCode(qrContainer, {
        text: contenido,
        width: 220,
        height: 220,
        correctLevel: QRCode.CorrectLevel.H
    });
}

// =========================================
// Regenerar QR
// =========================================
btnRegenerar.addEventListener("click", async () => {
    const user = auth.currentUser;
    const snap = await getDoc(doc(db, "users", user.uid));
    generarQR(user.uid, snap.data());
});

// =========================================
// Cupos en tiempo real
// =========================================
onSnapshot(doc(db, "lugares", "parqueo-principal"), (snap) => {
    const d = snap.data();
    cupos.textContent = d.capacidad - d.ocupadosActuales;
});

// =========================================
// Cerrar sesión (Función común)
// =========================================
async function cerrarSesion() {
    try {
        await signOut(auth);
        window.location.href = "login.html";
    } catch (error) {
        console.error("Error al cerrar sesión:", error);
    }
}

// Asignar eventos a ambos botones si existen
if (btnLogoutDesktop) btnLogoutDesktop.addEventListener("click", cerrarSesion);
if (btnLogoutMobile) btnLogoutMobile.addEventListener("click", cerrarSesion);

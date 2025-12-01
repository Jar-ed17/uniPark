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

const infoDirector = document.getElementById("infoDirector");
const qrContainer = document.getElementById("qr-container");
const cupos = document.getElementById("cupos");
const btnRegenerar = document.getElementById("btnRegenerar");

// CARGAR DATOS
onAuthStateChanged(auth, async (user) => {
    if (!user) return window.location.href = "login.html";

    const snap = await getDoc(doc(db, "users", user.uid));
    if (!snap.exists()) return;

    const d = snap.data();

    infoDirector.innerHTML = `
        <p><b>Nombre:</b> ${d.nombre}</p>
        <p><b>Categoría:</b> Director</p>
        <p><b>Estacionamiento Asignado:</b> ${d.estacion}</p>
    `;

    generarQR(user.uid, d);
});

// GENERAR QR
function generarQR(uid, data) {
    qrContainer.innerHTML = "";

    const payload = {
        uid,
        estacion: data.estacion,
        categoria: "director"
    };

    new QRCode(qrContainer, {
        text: JSON.stringify(payload),
        width: 220,
        height: 220,
        correctLevel: QRCode.CorrectLevel.H
    });
}

// REGENERAR QR
btnRegenerar.addEventListener("click", async () => {
    const user = auth.currentUser;
    const snap = await getDoc(doc(db, "users", user.uid));
    generarQR(user.uid, snap.data());
});

// CUPOS DIRECTOR
onSnapshot(doc(db, "estacionamientos", "A"), (snap) => {
    const d = snap.data();
    cupos.textContent = `${d.capacidadDirector - d.ocupadosDirector} libres`;
});

// LOGOUT
document.getElementById("btnLogout").addEventListener("click", async () => {
    await signOut(auth);
    window.location.href = "login.html";
});

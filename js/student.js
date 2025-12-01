import { auth, db } from "./firebase-config.js";
import { onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.10.0/firebase-auth.js";
import { doc, getDoc, onSnapshot } from "https://www.gstatic.com/firebasejs/10.10.0/firebase-firestore.js";

const infoAlumno = document.getElementById("infoAlumno");
const qrContainer = document.getElementById("qr-container");
const cupos = document.getElementById("cupos");

// ===================================
// Cargar datos del usuario
// ===================================
onAuthStateChanged(auth, async (user) => {
    if (!user) {
        window.location.href = "login.html";
        return;
    }

    try {
        const ref = doc(db, "users", user.uid);
        const snap = await getDoc(ref);

        if (!snap.exists()) {
            infoAlumno.textContent = "No se encontraron los datos del usuario.";
            return;
        }

        const u = snap.data();

        infoAlumno.innerHTML = `
            <p><b>Nombre:</b> ${u.nombre}</p>
            <p><b>Matrícula:</b> ${u.matricula}</p>
            <p><b>Vehículo:</b> ${u.tipoVehiculo} (${u.placa})</p>
            <p><b>Estacionamiento:</b> ${u.estacion}</p>
            <p><b>Categoría:</b> ${u.categoria}</p>
        `;

        generarQR(user.uid, u);

    } catch (e) {
        console.error(e);
        infoAlumno.textContent = "Error al cargar datos.";
    }
});

// ===================================
// Generar QR
// ===================================
function generarQR(uid, data) {
    qrContainer.innerHTML = "";

    const contenido = JSON.stringify({
        uid: uid,
        nombre: data.nombre,
        matricula: data.matricula,
        placa: data.placa,
        tipoVehiculo: data.tipoVehiculo,
        estacion: data.estacion,
        categoria: data.categoria
    });

    new QRCode(qrContainer, {
        text: contenido,
        width: 220,
        height: 220,
        colorDark: "#000",
        colorLight: "#fff",
        correctLevel: QRCode.CorrectLevel.H
    });
}

document.getElementById("btnRegenerar").addEventListener("click", async () => {
    const user = auth.currentUser;
    const snap = await getDoc(doc(db, "users", user.uid));
    generarQR(user.uid, snap.data());
});

// ===================================
// Lugares disponibles
// ===================================
onSnapshot(doc(db, "lugares", "parqueo-principal"), (snap) => {
    const d = snap.data();
    cupos.textContent = d.capacidad - d.ocupadosActuales;
});

// ===================================
// Logout
// ===================================
document.getElementById("btnLogout").addEventListener("click", async () => {
    await signOut(auth);
    window.location.href = "login.html";
});

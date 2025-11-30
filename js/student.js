import { auth, db } from "./firebase-config.js";
// V --- AQUÍ ESTÁ EL CAMBIO: Importamos ambas funciones en la misma línea --- V
import { onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.10.0/firebase-auth.js"; 
import { doc, getDoc, onSnapshot } from "https://www.gstatic.com/firebasejs/10.10.0/firebase-firestore.js";

console.log("student.js cargado correctamente");

let qr;

// Elementos HTML
const qrContainer = document.getElementById("qr-container");
const infoAlumno = document.getElementById("infoAlumno");
const cupos = document.getElementById("cupos");

// ---------------------------------------------------------
// VERIFICAR USUARIO LOGUEADO
// ---------------------------------------------------------
onAuthStateChanged(auth, async (user) => {
    if (!user) {
        window.location.href = "login.html";
        return;
    }

    // Consultar Firestore
    const ref = doc(db, "users", user.uid);
    const snap = await getDoc(ref);

    if (!snap.exists()) {
        alert("Error: No se encontró tu información en la base de datos.");
        return;
    }

    const data = snap.data();

    // Mostrar datos
    infoAlumno.innerHTML = `
        <p><b>Nombre:</b> ${data.nombre}</p>
        <p><b>Matrícula:</b> ${data.matricula}</p>
        <p><b>Vehículo:</b> ${data.tipoVehiculo} (${data.placa})</p>
    `;

    generarQR(user.uid, data);
});

// ---------------------------------------------------------
// GENERAR QR
// ---------------------------------------------------------
function generarQR(uid, data) {
    // Limpiar QR anterior si existe
    qrContainer.innerHTML = "";

    const contenido = JSON.stringify({
        uid: uid,
        nombre: data.nombre,
        matricula: data.matricula,
        correo: data.correo,
        placa: data.placa,
        tipoVehiculo: data.tipoVehiculo
    });

    qr = new QRCode(qrContainer, {
        text: contenido,
        width: 200,
        height: 200
    });
}

// ---------------------------------------------------------
// REGENERAR QR MANUALMENTE
// ---------------------------------------------------------
window.regenerarQR = function () {
    const user = auth.currentUser;
    if (!user) return;

    getDoc(doc(db, "users", user.uid)).then((snap) => {
        const data = snap.data();
        generarQR(user.uid, data);
    });
};

// ---------------------------------------------------------
// MOSTRAR LUGARES DISPONIBLES EN TIEMPO REAL
// ---------------------------------------------------------
const refParqueo = doc(db, "lugares", "parqueo-principal");

onSnapshot(refParqueo, (snap) => {
    if (!snap.exists()) {
        cupos.textContent = "Error al cargar cupos";
        return;
    }
    const data = snap.data();
    const disponibles = data.capacidad - data.ocupadosActuales;
    cupos.textContent = `Disponibles: ${disponibles}`;
});

// ---------------------------------------------------------
// CERRAR SESIÓN (Asegúrate de que esto NO esté comentado)
// ---------------------------------------------------------
const btnLogout = document.getElementById("btnLogout");
if (btnLogout) {
    btnLogout.addEventListener("click", async () => {
        try {
            await signOut(auth);
            window.location.href = "login.html";
        } catch (error) {
            console.error("Error al cerrar sesión:", error);
        }
    });
}
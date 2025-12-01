import { db } from "./firebase-config.js";
import {
    collection,
    addDoc,
    serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.10.0/firebase-firestore.js";

// INPUTS
const inputNombre = document.getElementById("nombre");
const inputTelefono = document.getElementById("telefono");
const inputMotivo = document.getElementById("motivo");
const inputVisita = document.getElementById("visita");
const inputFecha = document.getElementById("fecha");
const inputVehiculo = document.getElementById("vehiculo");

const btnEnviar = document.getElementById("btnEnviar");
btnEnviar.addEventListener("click", enviarSolicitud);

// =====================================================
//          ENVIAR SOLICITUD DE INVITADO
// =====================================================
async function enviarSolicitud() {

    const nombre = inputNombre.value.trim();
    const telefono = inputTelefono.value.trim();
    const motivo = inputMotivo.value.trim();
    const visita = inputVisita.value.trim();
    const fechaVisita = inputFecha.value;
    const vehiculo = inputVehiculo.value;

    // VALIDACIÓN
    if (!nombre || !telefono || !motivo || !visita || !fechaVisita) {
        alert("Por favor llena todos los campos.");
        return;
    }

    try {
        // Crear documento en Firestore
        const ref = await addDoc(collection(db, "invitados"), {
            nombre,
            telefono,
            motivo,
            visita,
            fechaVisita,
            vehiculo,

            estado: "pendiente",        // ✔ NECESARIO PARA ADMIN
            activo: false,              // ✔ NECESARIO PARA GUEST (compatibilidad)
            
            fechaRegistro: serverTimestamp(),
            fechaExpiracion: null,
            qrData: ""
        });

        alert("Solicitud enviada correctamente.");
        window.location.href = `guest-dashboard.html?id=${ref.id}`;

    } catch (e) {
        console.error("Error:", e);
        alert("Error enviando solicitud.");
    }
}

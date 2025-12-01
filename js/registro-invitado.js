import { db } from "./firebase-config.js";
import {
    collection,
    addDoc,
    serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.10.0/firebase-firestore.js";

const btn = document.getElementById("btnEnviar");
const msg = document.getElementById("msg");

btn.addEventListener("click", enviarSolicitud);

async function enviarSolicitud() {
    const nombre = document.getElementById("nombre").value.trim();
    const telefono = document.getElementById("telefono").value.trim();
    const motivo = document.getElementById("motivo").value.trim();
    const visita = document.getElementById("visita").value.trim();
    const fechaVisita = document.getElementById("fechaVisita").value.trim();
    const vehiculo = document.getElementById("vehiculo").value;

    if (!nombre || !telefono || !motivo || !visita || !fechaVisita) {
        msg.textContent = "Completa todos los campos.";
        msg.style.color = "red";
        return;
    }

    try {
        const ref = await addDoc(collection(db, "invitados"), {
            nombre,
            telefono,
            motivo,
            visita,
            fechaVisita,
            vehiculo,

            estado: "pendiente",   // <-- CAMPO QUE EL ADMIN NECESITA
            fechaRegistro: serverTimestamp(),
            fechaExpiracion: null,
            qrData: ""
        });

        window.location.href = `guest-dashboard.html?id=${ref.id}`;

    } catch (error) {
        console.error(error);
        alert("Error enviando solicitud.");
    }
}

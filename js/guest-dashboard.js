import { db } from "./firebase-config.js";
import {
    doc,
    getDoc,
    onSnapshot
} from "https://www.gstatic.com/firebasejs/10.10.0/firebase-firestore.js";

const params = new URLSearchParams(window.location.search);
const invitadoId = params.get("id");

const statusBox = document.getElementById("statusBox");
const qrContainer = document.getElementById("qrContainer");
const datosBox = document.getElementById("datosBox");

async function cargarInvitado() {

    if (!invitadoId) {
        statusBox.innerHTML = `
            <div class="alert alert-danger">ID inválido.</div>
        `;
        return;
    }

    const ref = doc(db, "invitados", invitadoId);

    // ► Escuchar en tiempo real
    onSnapshot(ref, snap => {
        if (!snap.exists()) {
            statusBox.innerHTML = `
                <div class="alert alert-danger">Solicitud no encontrada.</div>
            `;
            return;
        }

        const d = snap.data();

        // ======================
        //   ESTADO RECHAZADO
        // ======================
        if (d.estado === "rechazado") {
            statusBox.innerHTML = `
                <div class="alert alert-danger">
                    ❌ Acceso NO concedido<br>
                    Tu solicitud ha sido rechazada.
                </div>
            `;
            qrContainer.innerHTML = "";
            datosBox.innerHTML = "";
            return;
        }

        // ======================
        //   ESTADO PENDIENTE
        // ======================
        if (d.estado === "pendiente") {
            statusBox.innerHTML = `
                <div class="alert alert-warning">
                    ⏳ Tu solicitud está en revisión.<br>
                    Espera a que el administrador la apruebe.
                </div>
            `;
            qrContainer.innerHTML = "";
            datosBox.innerHTML = "";
            return;
        }

        // ======================
        //   ESTADO ACEPTADO
        // ======================
        if (d.estado === "aceptado") {
            statusBox.innerHTML = `
                <div class="alert alert-success">
                    ✔️ Acceso aprobado<br>
                    Aquí está tu código QR:
                </div>
            `;

            // Mostrar QR
            new QRious({
                element: document.getElementById("qrCanvas"),
                value: d.qrData,
                size: 250
            });

            qrContainer.style.display = "block";

            // Mostrar datos
            datosBox.innerHTML = `
                <p><b>Nombre:</b> ${d.nombre}</p>
                <p><b>Motivo:</b> ${d.motivo}</p>
                <p><b>Visita a:</b> ${d.visita}</p>
                <p><b>Expira:</b> ${new Date(d.fechaExpiracion).toLocaleString()}</p>
            `;
        }
    });
}

cargarInvitado();

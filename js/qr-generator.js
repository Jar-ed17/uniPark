// qr-generator.js
import { db } from "./firebase-config.js";
import { doc, updateDoc } from "https://www.gstatic.com/firebasejs/10.10.0/firebase-firestore.js";

// Función para generar string QR único
export function generarQRData(uid) {
    return JSON.stringify({
        uid: uid,
        timestamp: Date.now(),
        type: "access-token"
    });
}

// Guardar el QR generado en Firestore
export async function guardarQR(uid, qrData) {
    try {
        await updateDoc(doc(db, "users", uid), {
            qrAsignado: qrData
        });

        console.log("QR guardado en Firestore");
    } catch (error) {
        console.error("Error guardando QR:", error);
    }
}

import { db } from "./firebase-config.js";
import { collection, getDocs, updateDoc, doc } from "https://www.gstatic.com/firebasejs/10.10.0/firebase-firestore.js";

async function actualizarUsuarios() {
    const snap = await getDocs(collection(db, "users"));

    snap.forEach(async (d) => {
        const u = d.data();

        await updateDoc(doc(db, "users", d.id), {
            estacion: u.estacion ?? "A",
            categoria: u.categoria ?? "general",
            tipoVehiculo: u.tipoVehiculo ?? "carro"
        });

        console.log("Actualizado:", d.id);
    });

    console.log("Proceso terminado.");
}

actualizarUsuarios();

import { db, auth } from "./firebase-config.js";

import { 
    doc,
    getDoc,
    updateDoc,
    collection,
    addDoc,
    query,
    where,
    getDocs,
    limit,
    orderBy,
    onSnapshot
} from "https://www.gstatic.com/firebasejs/10.10.0/firebase-firestore.js";



let html5QrCode = null;

document.getElementById("btnAbrirCamara").addEventListener("click", () => {
    iniciarLector();
});


// Elementos DOM
const resultado = document.getElementById("resultado");
const datosAlumno = document.getElementById("datosAlumno");
const tablaAccesos = document.getElementById("tablaAccesos");
const cupos = document.getElementById("cupos");

// -------------------------------
// INICIAR LECTOR QR
// -------------------------------
function iniciarLector() {

    // Mostrar contenedor del lector
    document.getElementById("reader").style.display = "block";

    if (!html5QrCode) {
        html5QrCode = new Html5Qrcode("reader");
    }

    html5QrCode.start(
        { facingMode: "environment" },
        { fps: 10, qrbox: 250 },
        qrCodeMessage => {
            procesarQR(qrCodeMessage);
            html5QrCode.stop(); // Pausa para evitar doble lectura
        },
        err => {
            // No mostrar errores de cámara
        }
    );
}


// -------------------------------
// PROCESAR QR LEÍDO
// -------------------------------
async function procesarQR(data) {
    try {
        const qr = JSON.parse(data);
        const uid = qr.uid;

        if (!uid) return mostrarError("QR inválido.");

        // Buscar en Firestore
        const userRef = doc(db, "users", uid);
        const snap = await getDoc(userRef);

        if (!snap.exists()) return mostrarError("Usuario no encontrado.");

        const user = snap.data();

        // Bloqueado
        if (!user.activo) {
            return mostrarError("Alumno inactivo o bloqueado.");
        }

        // Mostrar datos en pantalla
        mostrarDatos(user);

        // ¿Ya tiene ENTRADA activa?
        const accesoQuery = query(
            collection(db, "accesos"),
            where("uid", "==", uid),
            where("estado", "==", "entrada")
        );

        const activos = await getDocs(accesoQuery);

        if (activos.empty) {
            await registrarEntrada(uid, user);
        } else {
            const idDocumento = activos.docs[0].id;
            await registrarSalida(idDocumento, user);
        }

    } catch (e) {
        console.error(e);
        mostrarError("Error procesando QR.");
    }
}

// -------------------------------
// REGISTRAR ENTRADA
// -------------------------------
async function registrarEntrada(uid, user) {

    const refLugar = doc(db, "lugares", "parqueo-principal");
    const lugarSnap = await getDoc(refLugar);

    const lugar = lugarSnap.data();

    if (lugar.ocupadosActuales >= lugar.capacidad) {
        return mostrarError("Parqueo lleno.");
    }

    await addDoc(collection(db, "accesos"), {
        uid,
        nombre: user.nombre,
        matricula: user.matricula,
        fechaEntrada: new Date().toISOString(),
        fechaSalida: "",
        estado: "entrada",
        lugar: "parqueo-principal",
        validador: auth.currentUser?.email ?? "seguridad"
    });

    await updateDoc(refLugar, {
        ocupadosActuales: lugar.ocupadosActuales + 1
    });

    mostrarExito("Entrada registrada correctamente.");
}

// -------------------------------
// REGISTRAR SALIDA
// -------------------------------
async function registrarSalida(docId, user) {

    const accesoRef = doc(db, "accesos", docId);
    const snap = await getDoc(accesoRef);

    const acceso = snap.data();
    const lugar = acceso.lugar;

    await updateDoc(accesoRef, {
        fechaSalida: new Date().toISOString(),
        estado: "salida"
    });

    // Actualizar contadores
    const lugarRef = doc(db, "lugares", lugar);
    const lugarSnap = await getDoc(lugarRef);
    const dataLugar = lugarSnap.data();

    await updateDoc(lugarRef, {
        ocupadosActuales: Math.max(0, dataLugar.ocupadosActuales - 1)
    });

    mostrarExito("Salida registrada correctamente.");
}

// -------------------------------
// MOSTRAR DATOS DEL ALUMNO
// -------------------------------
function mostrarDatos(u) {
    datosAlumno.innerHTML = `
        <p class="info"><b>Nombre:</b> ${u.nombre}</p>
        <p class="info"><b>Matrícula:</b> ${u.matricula}</p>
        <p class="info"><b>Correo:</b> ${u.correo}</p>
        <p class="info"><b>Vehículo:</b> ${u.tipoVehiculo} (${u.placa})</p>
    `;
}

// -------------------------------
// HISTORIAL EN TIEMPO REAL
// -------------------------------
onSnapshot(
    query(
        collection(db, "accesos"),
        orderBy("fechaEntrada", "desc"),
        limit(8)
    ),
    (snap) => {
        tablaAccesos.innerHTML = `
            <tr>
                <th>Nombre</th>
                <th>Matrícula</th>
                <th>Acceso</th>
                <th>Hora</th>
            </tr>
        `;

        snap.forEach(docu => {
            const a = docu.data();

            tablaAccesos.innerHTML += `
                <tr>
                    <td>${a.nombre}</td>
                    <td>${a.matricula}</td>
                    <td>${a.estado}</td>
                    <td>${new Date(a.fechaEntrada).toLocaleString()}</td>
                </tr>
            `;
        });
    }
);

// -------------------------------
// CUPOS EN TIEMPO REAL
// -------------------------------
onSnapshot(doc(db, "lugares", "parqueo-principal"), (snap) => {
    const d = snap.data();
    const disp = d.capacidad - d.ocupadosActuales;

    cupos.textContent = `Disponibles: ${disp}`;
});

// -------------------------------
// VISUAL
// -------------------------------
function mostrarExito(m) {
    resultado.innerHTML = `<span class="success">${m}</span>`;
}

function mostrarError(m) {
    resultado.innerHTML = `<span class="error">${m}</span>`;
}


// En iniciarLector, reemplaza err => {} por:
err => {
    // ignorar errores del escáner
}

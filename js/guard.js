// =====================================
//      GUARD.JS – CON INVITADOS
// =====================================

import { db, auth } from "./firebase-config.js";

import {
    doc, getDoc, updateDoc, collection, addDoc,
    query, where, getDocs, limit, orderBy,
    onSnapshot, increment
} from "https://www.gstatic.com/firebasejs/10.10.0/firebase-firestore.js";

import { signOut } from "https://www.gstatic.com/firebasejs/10.10.0/firebase-auth.js";

// -------------------------------------
// QR CODE SCANNER
// -------------------------------------
let html5QrCode = null;

document.getElementById("btnAbrirCamara")
    .addEventListener("click", () => iniciarLector());

// DOM
const resultado = document.getElementById("resultado");
const datosAlumno = document.getElementById("datosAlumno");
const tablaAccesos = document.getElementById("tablaAccesos");
const tablaInvitados = document.getElementById("tablaInvitados");

// ==========================
// PERMISO CÁMARA
// ==========================
async function pedirPermisoCamara() {
    try {
        await navigator.mediaDevices.getUserMedia({ video: true });
        return true;
    } catch {
        alert("La app necesita permiso de cámara.");
        return false;
    }
}

// ==========================
// INICIAR LECTOR
// ==========================
async function iniciarLector() {
    const permiso = await pedirPermisoCamara();
    if (!permiso) return;

    document.getElementById("reader").style.display = "block";

    if (!html5QrCode)
        html5QrCode = new Html5Qrcode("reader");

    html5QrCode.start(
        { facingMode: "environment" },
        { fps: 10, qrbox: { width: 250, height: 250 } },
        mensaje => {
            procesarQR(mensaje);
            html5QrCode.stop();
        }
    );
}

// ==========================
// PROCESAR QR
// ==========================
async function procesarQR(raw) {

    let qr;
    try {
        qr = JSON.parse(raw);
    } catch {
        return mostrarError("QR inválido.");
    }

    console.log("QR detectado:", qr);

    // 🟦 INTEGRAR INVITADOS
    if (qr.rol === "invitado") {
        return procesarInvitado(qr);
    }

    // 🟦 USUARIOS NORMALES
    if (!qr.uid || !qr.estacion || !qr.categoria)
        return mostrarError("QR incompleto.");

    const uid = qr.uid.trim();
    const estacion = qr.estacion.trim().toUpperCase();
    const categoria = qr.categoria.trim().toLowerCase();

    // Buscar usuario
    const ref = doc(db, "users", uid);
    const snap = await getDoc(ref);
    if (!snap.exists()) return mostrarError("Usuario no encontrado.");

    const user = snap.data();

    if (!user.activo) return mostrarError("Usuario inactivo.");

    mostrarDatos(user);

    // Ver si ya tiene entrada activa
    const q = query(
        collection(db, "accesos"),
        where("uid", "==", uid),
        where("estado", "==", "entrada")
    );

    const activos = await getDocs(q);

    if (activos.empty) registrarEntrada(uid, user);
    else registrarSalida(activos.docs[0].id, user);
}

// =====================================
//    🚨 PROCESAR INVITADO
// =====================================
async function procesarInvitado(qr) {
    const uid = qr.uid;

    const ref = doc(db, "invitados", uid);
    const snap = await getDoc(ref);

    if (!snap.exists())
        return mostrarError("Invitado no encontrado.");

    const inv = snap.data();

    // Pendiente
    if (!inv.activo)
        return mostrarError("Invitado aún no aprobado.");

    // Expiración
    const exp = new Date(inv.fechaExpiracion.toDate());
    const ahora = new Date();

    if (ahora > exp)
        return mostrarError("QR expirado.");

    // Mostrar datos
    datosAlumno.innerHTML = `
        <p class="info"><b>Invitado:</b> ${inv.nombre}</p>
        <p class="info"><b>Motivo:</b> ${inv.motivo}</p>
        <p class="info"><b>Visita a:</b> ${inv.visita}</p>
        <p class="info"><b>Expira:</b> ${exp.toLocaleString()}</p>
    `;

    // Ver si ya tiene entrada
    const q = query(
        collection(db, "accesosInvitados"),
        where("uid", "==", uid),
        where("estado", "==", "entrada")
    );

    const activos = await getDocs(q);

    if (activos.empty)
        return registrarEntradaInvitado(uid, inv);

    registrarSalidaInvitado(activos.docs[0].id, inv);
}

// =====================================
//    🚨 REGISTRAR ENTRADA INVITADO
// =====================================
async function registrarEntradaInvitado(uid, inv) {

    await addDoc(collection(db, "accesosInvitados"), {
        uid,
        nombre: inv.nombre,
        motivo: inv.motivo,
        visita: inv.visita,
        fechaEntrada: new Date().toISOString(),
        fechaSalida: "",
        estado: "entrada",
        validador: auth.currentUser?.email ?? "seguridad"
    });

    mostrarExito("Entrada registrada (Invitado).");
}

// =====================================
//    🚨 REGISTRAR SALIDA INVITADO
// =====================================
async function registrarSalidaInvitado(idDoc, inv) {
    const ref = doc(db, "accesosInvitados", idDoc);

    await updateDoc(ref, {
        fechaSalida: new Date().toISOString(),
        estado: "salida"
    });

    mostrarExito("Salida registrada (Invitado).");
}

// =====================================
//   REGISTRO NORMAL (USUARIOS)
// =====================================
async function registrarEntrada(uid, user) {

    const estacion = user.estacion;
    const categoria = user.categoria;

    const refEst = doc(db, "estacionamientos", estacion);
    const estSnap = await getDoc(refEst);
    const est = estSnap.data();

    // DIRECTOR
    if (categoria === "director" &&
        est.ocupadosDirector >= est.capacidadDirector)
        return mostrarError("Lugar del Director lleno.");

    // PROFESOR
    if (categoria === "profesor" &&
        est.ocupadosProfesores >= est.capacidadProfesores)
        return mostrarError("Zona profesores llena.");

    // MOTO
    if (categoria === "moto" &&
        est.ocupadosMotos >= est.capacidadMotos)
        return mostrarError("Zona motos llena.");

    // GENERAL
    if (categoria === "general" &&
        est.ocupadosGeneral >= est.capacidadGeneral)
        return mostrarError("Zona general llena.");

    await addDoc(collection(db, "accesos"), {
        uid,
        nombre: user.nombre,
        matricula: user.matricula,
        fechaEntrada: new Date().toISOString(),
        fechaSalida: "",
        estado: "entrada",
        lugar: estacion,
        categoria,
        validador: auth.currentUser?.email ?? "seguridad"
    });

    let campo =
        categoria === "profesor" ? "ocupadosProfesores" :
        categoria === "moto" ? "ocupadosMotos" :
        categoria === "director" ? "ocupadosDirector" :
        "ocupadosGeneral";

    updateDoc(refEst, { [campo]: increment(1) });

    mostrarExito("Entrada registrada.");
}

async function registrarSalida(id, user) {
    const ref = doc(db, "accesos", id);
    const snap = await getDoc(ref);
    const acceso = snap.data();

    const refEst = doc(db, "estacionamientos", acceso.lugar);
    const estSnap = await getDoc(refEst);

    let campo =
        acceso.categoria === "profesor" ? "ocupadosProfesores" :
        acceso.categoria === "moto" ? "ocupadosMotos" :
        acceso.categoria === "director" ? "ocupadosDirector" :
        "ocupadosGeneral";

    await updateDoc(ref, {
        fechaSalida: new Date().toISOString(),
        estado: "salida"
    });

    await updateDoc(refEst, {
        [campo]: Math.max(0, estSnap.data()[campo] - 1)
    });

    mostrarExito("Salida registrada.");
}

// =====================================
//   HISTORIAL NORMAL
// =====================================
onSnapshot(
    query(
        collection(db, "accesos"),
        orderBy("fechaEntrada", "desc"),
        limit(8)
    ),
    snap => {
        tablaAccesos.innerHTML = `
            <tr>
                <th>Nombre</th>
                <th>ID</th>
                <th>Estado</th>
                <th>Hora</th>
            </tr>`;

        snap.forEach(d => {
            const a = d.data();

            tablaAccesos.innerHTML += `
                <tr>
                    <td>${a.nombre}</td>
                    <td>${a.matricula}</td>
                    <td>${a.estado}</td>
                    <td>${new Date(a.fechaEntrada).toLocaleString()}</td>
                </tr>`;
        });
    }
);

// =====================================
//   TABLA INVITADOS ACTIVOS
// =====================================
onSnapshot(collection(db, "accesosInvitados"), snap => {

    if (!tablaInvitados) return;

    tablaInvitados.innerHTML = `
        <tr>
            <th>Nombre</th>
            <th>Motivo</th>
            <th>Visita</th>
            <th>Estado</th>
            <th>Hora</th>
        </tr>`;

    snap.forEach(d => {
        const a = d.data();
        tablaInvitados.innerHTML += `
            <tr>
                <td>${a.nombre}</td>
                <td>${a.motivo}</td>
                <td>${a.visita}</td>
                <td>${a.estado}</td>
                <td>${new Date(a.fechaEntrada).toLocaleString()}</td>
            </tr>
        `;
    });
});

// =====================================
// NOTIFICACIONES
// =====================================
function mostrarExito(m) {
    resultado.innerHTML = `<span class="success">${m}</span>`;
}
function mostrarError(m) {
    resultado.innerHTML = `<span class="error">${m}</span>`;
}

// =====================================
// LOGOUT
// =====================================
document.getElementById("btnLogout").addEventListener("click", async () => {
    await signOut(auth);
    window.location.href = "login.html";
});

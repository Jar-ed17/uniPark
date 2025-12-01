// ===============================
//      ADMIN.JS – COMPLETO
//  SISTEMA DE USUARIOS + INVITADOS
// ===============================

import { auth, db } from "./firebase-config.js";

import {
    createUserWithEmailAndPassword,
    signOut
} from "https://www.gstatic.com/firebasejs/10.10.0/firebase-auth.js";

import {
    collection, doc, setDoc, getDocs, deleteDoc, updateDoc, getDoc,
    onSnapshot, serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.10.0/firebase-firestore.js";

// ELEMENTOS DEL DOM
const msg = document.getElementById("msg");
const tabla = document.getElementById("tablaUsuarios");

const btnSolicitudes = document.getElementById("btnSolicitudes");
const panelSolicitudes = document.getElementById("panelSolicitudes");
const listaSolicitudes = document.getElementById("listaSolicitudes");
const badgeSolicitudes = document.getElementById("contadorSolicitudes");

// ===============================
//      CREAR USUARIO NORMAL
// ===============================
export async function crearUsuario() {

    const nombre = document.getElementById("nombre").value.trim();
    const correo = document.getElementById("email").value.trim();
    const password = document.getElementById("password").value.trim();
    const rol = document.getElementById("rol").value;
    const matricula = document.getElementById("matricula").value.trim();
    const placa = document.getElementById("placa").value.trim();
    const tipoVehiculo = document.getElementById("tipoVehiculo").value;
    const estacion = document.getElementById("estacion").value;
    const categoria = document.getElementById("categoria").value;

    if (!nombre || !correo || !password || !rol || !matricula ||
        !placa || !tipoVehiculo || !estacion || !categoria) {

        mostrarAviso("Todos los campos son obligatorios ❌", "error");
        return;
    }

    try {
        const userCredential = await createUserWithEmailAndPassword(auth, correo, password);
        const uid = userCredential.user.uid;

        await setDoc(doc(db, "users", uid), {
            nombre,
            correo,
            rol,
            matricula,
            placa,
            tipoVehiculo,
            estacion,
            categoria,
            qrAsignado: "",
            activo: true
        });

        mostrarAviso("Usuario creado correctamente 🎉", "success");
        cargarUsuarios();

    } catch (error) {
        console.error(error);
        mostrarAviso("Error: " + error.message, "error");
    }
}

// ===============================
//      AVISOS BONITOS PROFESIONALES
// ===============================
function mostrarAviso(texto, tipo = "info") {
    msg.textContent = texto;
    msg.className = ""; 
    msg.style.display = "block";

    msg.classList.add(tipo === "error" ? "msg-error" :
                      tipo === "success" ? "msg-success" : "msg-info");

    msg.style.zIndex = "9999";

    setTimeout(() => {
        msg.style.display = "none";
    }, 3000);
}

// ===============================
//      CARGAR USUARIOS
// ===============================
async function cargarUsuarios() {
    tabla.innerHTML = "";

    const q = await getDocs(collection(db, "users"));

    q.forEach(docu => {
        const u = docu.data();
        const id = docu.id;

        tabla.innerHTML += `
            <tr>
                <td>${u.nombre}</td>
                <td>${u.correo}</td>
                <td>${u.rol}</td>
                <td>${u.matricula}</td>
                <td>${u.tipoVehiculo} (${u.placa})</td>
                <td>${u.estacion}</td>
                <td>${u.categoria}</td>

                <td>
                    <button onclick="abrirModal('${id}')" class="edit-btn">✏️</button>
                    <button onclick="eliminarUsuario('${id}')" class="delete-btn">🗑️</button>
                </td>
            </tr>
        `;
    });
}

cargarUsuarios();
window.crearUsuario = crearUsuario;

// ===============================
//      ELIMINAR USUARIO
// ===============================
window.eliminarUsuario = async function (uid) {

    if (!confirm("¿Seguro que deseas eliminar este usuario?")) return;

    await deleteDoc(doc(db, "users", uid));

    mostrarAviso("Usuario eliminado ✔", "success");
    cargarUsuarios();
};

// ===============================
//      EDITAR USUARIO (MODAL)
// ===============================
let uidEditando = null;

window.abrirModal = async function(uid) {
    uidEditando = uid;

    const ref = doc(db, "users", uid);
    const snap = await getDoc(ref);
    const u = snap.data();

    document.getElementById("editNombre").value = u.nombre;
    document.getElementById("editMatricula").value = u.matricula;
    document.getElementById("editPlaca").value = u.placa;
    document.getElementById("editRol").value = u.rol;
    document.getElementById("editEstacion").value = u.estacion;
    document.getElementById("editCategoria").value = u.categoria;

    document.getElementById("modalEditar").style.display = "flex";
};

window.cerrarModal = function() {
    document.getElementById("modalEditar").style.display = "none";
};

window.guardarEdicion = async function() {
    const ref = doc(db, "users", uidEditando);

    await updateDoc(ref, {
        nombre: document.getElementById("editNombre").value.trim(),
        matricula: document.getElementById("editMatricula").value.trim(),
        placa: document.getElementById("editPlaca").value.trim(),
        rol: document.getElementById("editRol").value,
        estacion: document.getElementById("editEstacion").value,
        categoria: document.getElementById("editCategoria").value
    });

    mostrarAviso("Cambios guardados ✔", "success");
    cerrarModal();
    cargarUsuarios();
};

// ===============================
//      BUSCADOR
// ===============================
document.getElementById("buscador").addEventListener("input", function() {
    const filtro = this.value.toLowerCase();
    const filas = tabla.getElementsByTagName("tr");

    for (let fila of filas) {
        fila.style.display = fila.innerText.toLowerCase().includes(filtro) ? "" : "none";
    }
});

// ===============================
//      FILTROS
// ===============================
document.getElementById("filtroRol").addEventListener("change", filtrar);
document.getElementById("filtroEstacion").addEventListener("change", filtrar);

function filtrar() {
    const rol = document.getElementById("filtroRol").value;
    const est = document.getElementById("filtroEstacion").value;

    const filas = tabla.getElementsByTagName("tr");

    for (let fila of filas) {
        const texto = fila.innerText.toLowerCase();

        const coincideRol = rol ? texto.includes(rol.toLowerCase()) : true;
        const coincideEst = est ? texto.includes(est.toLowerCase()) : true;

        fila.style.display = (coincideRol && coincideEst) ? "" : "none";
    }
}
// ===============================
//      SISTEMA DE SOLICITUDES INVITADOS
// ===============================

// Abrir/Cerrar panel
btnSolicitudes.addEventListener("click", () => {
    panelSolicitudes.style.display =
        panelSolicitudes.style.display === "block" ? "none" : "block";
});

// Escuchar cambios en tiempo real
onSnapshot(collection(db, "invitados"), (snapshot) => {
    listaSolicitudes.innerHTML = "";
    let pendientes = 0;

    snapshot.forEach(docu => {
        const d = docu.data();
        const id = docu.id;

        // SOLO mostrar solicitudes con estado: "pendiente"
        if (d.estado === "pendiente") {
            pendientes++;
            listaSolicitudes.innerHTML += generarCardSolicitud(id, d);
        }
    });

    badgeSolicitudes.textContent = pendientes;
    badgeSolicitudes.style.display = pendientes > 0 ? "inline" : "none";

    if (pendientes === 0) {
        listaSolicitudes.innerHTML = "<p class='text-white'>No hay solicitudes pendientes.</p>";
    }
});

// Plantilla de tarjeta
function generarCardSolicitud(id, d) {
    return `
        <div class="solicitud-card glass-box">
            <p><b>${d.nombre}</b></p>
            <p>📞 ${d.telefono}</p>
            <p>📝 ${d.motivo}</p>
            <p>🏢 Visita: ${d.visita}</p>
            <p>📅 ${d.fechaVisita}</p>

            <div class="sol-acciones">
                <button class="btn-aceptar" onclick="aprobarInvitado('${id}')">Aceptar</button>
                <button class="btn-rechazar" onclick="rechazarInvitado('${id}')">Rechazar</button>
            </div>
        </div>
    `;
}

// ===============================
//      APROBAR INVITADO
// ===============================
window.aprobarInvitado = async function(id) {

    const ref = doc(db, "invitados", id);
    const snap = await getDoc(ref);
    const d = snap.data();

    const ahora = new Date();
    const expiracion = new Date(ahora.getTime() + 3 * 60 * 60 * 1000); // 3 horas

    // QR FINAL
    const qrData = JSON.stringify({
        uid: id,
        rol: "invitado",
        nombre: d.nombre,
        motivo: d.motivo,
        visita: d.visita,
        fechaVisita: d.fechaVisita,
        expira: expiracion.toISOString()
    });

    await updateDoc(ref, {
        estado: "aceptado",        // ✔ estado correcto
        fechaExpiracion: expiracion,
        qrData
    });

    mostrarAviso("Invitado aprobado ✔ QR generado", "success");
};


// ===============================
//      RECHAZAR INVITADO
// ===============================
window.rechazarInvitado = async function(id) {

    if (!confirm("¿Rechazar solicitud?")) return;

    // SOLO cambiar estado
    await updateDoc(doc(db, "invitados", id), {
        estado: "rechazado"
    });

    mostrarAviso("Solicitud rechazada ❌", "error");
};

// ===============================
//      LOGOUT
// ===============================
document.getElementById("btnLogout").addEventListener("click", async () => {
    await signOut(auth);
    window.location.href = "login.html";
});

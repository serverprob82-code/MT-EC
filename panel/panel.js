// ==========================================
// 1. IMPORTACIONES DE FIREBASE SDK (v10.8.1)
// ==========================================
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-app.js";
import { getAuth, signInWithEmailAndPassword, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-auth.js";
import { getFirestore, doc, setDoc, getDoc } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-firestore.js";

// ==========================================
// 2. CONFIGURACIÓN Y API KEYS DE FIREBASE
// ==========================================
const firebaseConfig = {
    apiKey: "AIzaSyDuczvjYVzRFkS699_DImPW-brTnMxZtCs",
    authDomain: "miel-estetica-web.firebaseapp.com",
    projectId: "miel-estetica-web",
    storageBucket: "miel-estetica-web.firebasestorage.app",
    messagingSenderId: "1099087151356",
    appId: "1:1099087151356:web:82f79034798fe90b38d779"
};

// Inicialización de Servicios
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const DOC_REF = doc(db, "miel_terrazas", "datos_panel");

// ==========================================
// 3. LÓGICA PRINCIPAL DEL PANEL
// ==========================================
document.addEventListener("DOMContentLoaded", () => {
    const STORAGE = {
        tratamientos: "miel_tratamientos",
        tratamientosV4: "miel_tratamientos_v4",
        citas: "miel_citas_v4",
        horarios: "miel_horarios",
        tasa: "miel_tasa_cambio"
    };

    const DEFAULT_HORARIOS = {
        0: { activo: false, inicio: "09:00", fin: "17:00" },
        1: { activo: true, inicio: "09:00", fin: "18:00" },
        2: { activo: true, inicio: "09:00", fin: "18:00" },
        3: { activo: true, inicio: "09:00", fin: "18:00" },
        4: { activo: true, inicio: "09:00", fin: "18:00" },
        5: { activo: true, inicio: "09:00", fin: "18:00" },
        6: { activo: true, inicio: "09:00", fin: "13:00" }
    };

    const DIAS = ["Domingo", "Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado"];

    const navButtons = document.querySelectorAll(".nav-btn");
    const sections = document.querySelectorAll(".view-section");

    // ------------------------------------------
    // AUTENTICACIÓN Y CONTROL DE ACCESO
    // ------------------------------------------
    const loginOverlay = document.getElementById("login-overlay");
    const loginForm = document.getElementById("login-form");
    const loginError = document.getElementById("login-error");
    const btnLogout = document.getElementById("btn-logout");

    // Escuchar estado de sesión
    onAuthStateChanged(auth, async (user) => {
        if (user) {
            if (loginOverlay) loginOverlay.style.display = "none";
            await cargarDatosDesdeFirestore();
            cargarResumen();
        } else {
            if (loginOverlay) loginOverlay.style.display = "flex";
        }
    });

    // Evento de Inicio de Sesión
    loginForm?.addEventListener("submit", async (e) => {
        e.preventDefault();
        const email = document.getElementById("login-email")?.value.trim();
        const password = document.getElementById("login-password")?.value;

        if (loginError) loginError.textContent = "";

        try {
            await signInWithEmailAndPassword(auth, email, password);
            loginForm.reset();
        } catch (error) {
            console.error("Error al iniciar sesión:", error);
            if (loginError) {
                switch (error.code) {
                    case "auth/invalid-credential":
                    case "auth/user-not-found":
                    case "auth/wrong-password":
                        loginError.textContent = "Correo o contraseña incorrectos.";
                        break;
                    case "auth/too-many-requests":
                        loginError.textContent = "Demasiados intentos fallidos. Intenta más tarde.";
                        break;
                    default:
                        loginError.textContent = "Error al iniciar sesión. Revisa la consola.";
                }
            }
        }
    });

    // Cierre de Sesión
    btnLogout?.addEventListener("click", () => {
        signOut(auth).catch(err => console.error("Error al cerrar sesión:", err));
    });

    // ------------------------------------------
    // SINCRONIZACIÓN FIRESTORE <-> LOCALSTORAGE
    // ------------------------------------------
    async function guardarEstadoEnFirestore() {
        try {
            const estadoGlobal = {
                tratamientos: getTratamientos(),
                citas: getCitas(),
                horarios: getHorarios(),
                tasa: getTasa(),
                actualizadoEn: new Date().toISOString()
            };
            await setDoc(DOC_REF, estadoGlobal);
        } catch (e) {
            console.error("Error al guardar en Firestore:", e);
        }
    }

    async function cargarDatosDesdeFirestore() {
        try {
            const snap = await getDoc(DOC_REF);
            if (snap.exists()) {
                const data = snap.data();
                if (data.tratamientos) localStorage.setItem(STORAGE.tratamientos, JSON.stringify(data.tratamientos));
                if (data.citas) localStorage.setItem(STORAGE.citas, JSON.stringify(data.citas));
                if (data.horarios) localStorage.setItem(STORAGE.horarios, JSON.stringify(data.horarios));
                if (data.tasa) localStorage.setItem(STORAGE.tasa, String(data.tasa));
            } else {
                // Migración inicial: si Firestore está vacío, sube lo que haya localmente
                await guardarEstadoEnFirestore();
            }
        } catch (e) {
            console.error("Error al cargar desde Firestore:", e);
        }
    }

    // ------------------------------------------
    // UTILIDADES
    // ------------------------------------------
    function safeParse(key, fallback) {
        try {
            const raw = localStorage.getItem(key);
            return raw ? JSON.parse(raw) : fallback;
        } catch (_) {
            return fallback;
        }
    }

    function slugify(text) {
        return text.toString().normalize("NFD").replace(/[\u0300-\u036f]/g, "")
            .toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "") || `tratamiento-${Date.now()}`;
    }

    function escapeHTML(value) {
        return String(value ?? "").replace(/[&<>'"]/g, char => ({
            "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", '"': "&quot;"
        }[char]));
    }

    // ------------------------------------------
    // MANEJO DE DATOS
    // ------------------------------------------
    function getTratamientos() {
        let tratamientos = safeParse(STORAGE.tratamientos, null);

        if (!Array.isArray(tratamientos) || !tratamientos.length || !tratamientos[0].es) {
            const v4 = safeParse(STORAGE.tratamientosV4, null);
            if (Array.isArray(v4) && v4.length) {
                tratamientos = v4.map(t => ({
                    id: t.id || slugify(t.nombre || "tratamiento"),
                    precio: Number(t.precio) || 0,
                    duracion: Number(t.duracion) || 60,
                    activo: t.activo !== false,
                    categoria: t.categoria || "Belleza",
                    imagen: t.imagen || "",
                    mostrarPrecio: t.mostrarPrecio === true,
                    eslogan: t.eslogan || { es: "Un cuidado pensado para ti.", pt: "Um cuidado pensado para você." },
                    es: { titulo: t.es?.titulo || t.nombre || "Tratamiento", desc: t.es?.desc || t.descripcion || "" },
                    pt: { titulo: t.pt?.titulo || t.nombre || "Tratamento", desc: t.pt?.desc || t.descripcion || "" }
                }));
                localStorage.setItem(STORAGE.tratamientos, JSON.stringify(tratamientos));
            }
        }

        if (Array.isArray(tratamientos)) {
            const categoriasPorId = {
                hidrolipoclasia: "Estética corporal",
                electroestimulacion: "Estética corporal",
                "dermato-funcional": "Estética corporal",
                masaje: "Estética corporal",
                scraper: "Estética corporal",
                microneedling: "Estética facial",
                pestanas: "Pestañas y cejas",
                henna: "Pestañas y cejas",
                trenzas: "Belleza",
                acrocordones: "Belleza"
            };
            const esloganes = {
                hidrolipoclasia: ["Reducción efectiva de grasa localizada.", "Redução efetiva de gordura localizada."],
                electroestimulacion: ["Tonificación muscular y moldeo corporal.", "Tonificação muscular e modelagem corporal."],
                "dermato-funcional": ["Salud y estética de la piel.", "Saúde e estética da pele."],
                masaje: ["Bienestar profundo y alivio del estrés.", "Bem-estar profundo e alívio do estresse."],
                scraper: ["Liberación de tensiones y tejido miofascial.", "Liberação de tensões e tecido miofascial."],
                microneedling: ["Regeneración celular y colágeno.", "Regeneração celular e colágeno."],
                pestanas: ["Mirada impactante y natural.", "Olhar marcante e natural."],
                henna: ["Diseño y definición perfecta.", "Design e definição perfeita."],
                trenzas: ["Estilo y tendencia para tu cabello.", "Estilo e tendência para o seu cabelo."],
                acrocordones: ["Cuidado dermatológico especializado.", "Cuidado dermatológico especializado."]
            };
            tratamientos.forEach(t => {
                if (!t.categoria && categoriasPorId[t.id]) t.categoria = categoriasPorId[t.id];
                if (!Number.isInteger(Number(t.duracion)) || Number(t.duracion) <= 0) t.duracion = 60;
                if (typeof t.mostrarPrecio !== "boolean") t.mostrarPrecio = false;
                if (!t.eslogan && esloganes[t.id]) t.eslogan = { es: esloganes[t.id][0], pt: esloganes[t.id][1] };
            });
            localStorage.setItem(STORAGE.tratamientos, JSON.stringify(tratamientos));
        }

        return Array.isArray(tratamientos) ? tratamientos : [];
    }

    function saveTratamientos(tratamientos) {
        localStorage.setItem(STORAGE.tratamientos, JSON.stringify(tratamientos));
        guardarEstadoEnFirestore();
    }

    function getCitas() {
        return safeParse(STORAGE.citas, []);
    }

    function saveCitas(citas) {
        localStorage.setItem(STORAGE.citas, JSON.stringify(citas));
        guardarEstadoEnFirestore();
    }

    function getHorarios() {
        const saved = safeParse(STORAGE.horarios, null);
        if (!saved) return structuredClone(DEFAULT_HORARIOS);
        return { ...structuredClone(DEFAULT_HORARIOS), ...saved };
    }

    function saveHorarios(horarios) {
        localStorage.setItem(STORAGE.horarios, JSON.stringify(horarios));
        guardarEstadoEnFirestore();
    }

    function getTasa() {
        const tasa = parseFloat(localStorage.getItem(STORAGE.tasa));
        return Number.isFinite(tasa) && tasa > 0 ? tasa : 1.35;
    }

    // ------------------------------------------
    // VISTAS Y NAVEGACIÓN
    // ------------------------------------------
    function mostrarSeccion(targetId) {
        navButtons.forEach(b => b.classList.toggle("active", b.getAttribute("data-target") === targetId));
        sections.forEach(sec => sec.classList.toggle("active", sec.id === targetId));

        if (targetId === "resumen") cargarResumen();
        if (targetId === "citas") renderizarCitas();
        if (targetId === "tratamientos") renderizarTablaTratamientos();
        if (targetId === "horarios") renderizarHorarios();
        if (targetId === "ajustes") cargarAjustes();
    }

    navButtons.forEach(btn => btn.addEventListener("click", () => mostrarSeccion(btn.dataset.target)));

    function cargarResumen() {
        const tratamientos = getTratamientos();
        const citas = getCitas();
        const hoy = new Date().toISOString().slice(0, 10);
        const pendientes = citas.filter(c => normalizarEstado(c.estado) === "pendiente").length;
        const hoyConfirmadas = citas.filter(c => normalizarEstado(c.estado) === "aceptada" && c.fecha === hoy).length;

        document.getElementById("count-tratamientos").textContent = tratamientos.filter(t => t.activo !== false).length;
        document.getElementById("count-pendientes").textContent = pendientes;
        document.getElementById("count-hoy").textContent = hoyConfirmadas;
    }

    function normalizarEstado(estado) {
        const e = String(estado || "").toLowerCase();
        if (e === "pending") return "pendiente";
        if (e === "confirmed") return "aceptada";
        if (e === "completed") return "completada";
        return e || "pendiente";
    }

    function renderizarCitas() {
        const tbody = document.getElementById("tabla-citas-body");
        if (!tbody) return;
        const citas = getCitas().sort((a, b) => `${a.fecha || ""} ${a.hora || ""}`.localeCompare(`${b.fecha || ""} ${b.hora || ""}`));
        tbody.innerHTML = "";

        if (!citas.length) {
            tbody.innerHTML = `<tr><td colspan="8" class="empty-state">No hay citas registradas.</td></tr>`;
            return;
        }

        citas.forEach(cita => {
            const estado = normalizarEstado(cita.estado);
            const badge = estado === "aceptada" ? "confirmed" : estado === "completada" ? "active" : "pending";
            const numero = String(cita.celular || "").replace(/\D/g, "");
            const wa = numero ? `https://wa.me/${numero.length === 8 ? "591" + numero : numero}?text=${encodeURIComponent(`Hola ${cita.nombre || ""}, te escribimos de Miel Terrazas para confirmar tu cita de ${cita.tratamiento || ""} el día ${cita.fecha || ""} a las ${cita.hora || ""}. ¡Te esperamos!`)}` : "#";
            const tr = document.createElement("tr");
            tr.innerHTML = `
                <td><strong>${escapeHTML(cita.nombre)}</strong></td>
                <td>${escapeHTML(cita.celular)}<br>${numero ? `<a class="btn-wa" href="${wa}" target="_blank" rel="noopener">💬 WhatsApp</a>` : ""}</td>
                <td>${escapeHTML(cita.tratamiento)}</td>
                <td>${escapeHTML(cita.fecha)}<br>${escapeHTML(cita.hora)}</td>
                <td><select class="estado-cita" data-id="${escapeHTML(cita.id)}">
                    <option value="Pendiente" ${estado === "pendiente" ? "selected" : ""}>Pendiente</option>
                    <option value="Aceptada" ${estado === "aceptada" ? "selected" : ""}>Aceptada</option>
                    <option value="Completada" ${estado === "completada" ? "selected" : ""}>Completada</option>
                </select></td>
                <td><span class="status-badge ${badge}">${escapeHTML(estado)}</span></td>
                <td><button class="btn-outline btn-small btn-danger" data-delete-cita="${escapeHTML(cita.id)}">Eliminar</button></td>`;
            tbody.appendChild(tr);
        });

        tbody.querySelectorAll(".estado-cita").forEach(select => select.addEventListener("change", e => {
            const citasActuales = getCitas();
            const cita = citasActuales.find(c => String(c.id) === String(e.target.dataset.id));
            if (cita) {
                cita.estado = e.target.value;
                saveCitas(citasActuales);
                cargarResumen();
                renderizarCitas();
            }
        }));

        tbody.querySelectorAll("[data-delete-cita]").forEach(btn => btn.addEventListener("click", () => {
            if (!confirm("¿Seguro que deseas eliminar esta cita?")) return;
            saveCitas(getCitas().filter(c => String(c.id) !== String(btn.dataset.deleteCita)));
            renderizarCitas();
            cargarResumen();
        }));
    }

    function renderizarTablaTratamientos() {
        const tbody = document.getElementById("tabla-tratamientos-body");
        if (!tbody) return;
        const tratamientos = getTratamientos();
        tbody.innerHTML = "";

        if (!tratamientos.length) {
            tbody.innerHTML = `<tr><td colspan="8" class="empty-state">No hay tratamientos. Pulsa «Nuevo» para crear uno.</td></tr>`;
            return;
        }

        tratamientos.forEach(t => {
            const tr = document.createElement("tr");
            const tasa = getTasa();
            const reales = tasa > 0 ? (Number(t.precio || 0) / tasa).toFixed(2) : "0.00";
            tr.innerHTML = `
                <td><strong>${escapeHTML(t.es?.titulo || "Sin nombre")}</strong><br><small>${escapeHTML(t.pt?.titulo || "")}</small></td>
                <td>${escapeHTML(t.categoria || "Belleza")}</td>
                <td><input type="number" min="0" step="0.01" class="input-edit precio-input" value="${Number(t.precio) || 0}" data-id="${escapeHTML(t.id)}"> Bs<br><small>R$ ${reales}</small></td>
                <td><input type="number" min="1" step="1" class="input-edit duracion-input" value="${Number(t.duracion) || 60}" data-id="${escapeHTML(t.id)}"> min</td>
                <td><button class="status-badge ${t.mostrarPrecio === true ? "active" : "hidden"} toggle-precio-btn" data-id="${escapeHTML(t.id)}">${t.mostrarPrecio === true ? "Visible" : "Oculto"}</button></td>
                <td><button class="status-badge ${t.activo !== false ? "active" : "hidden"} toggle-btn" data-id="${escapeHTML(t.id)}">${t.activo !== false ? "Activo" : "Oculto"}</button></td>
                <td class="acciones-tratamiento"><button class="btn-outline btn-small" data-edit="${escapeHTML(t.id)}">Editar</button><button class="btn-outline btn-small" data-save="${escapeHTML(t.id)}">Guardar</button><button class="btn-outline btn-small btn-danger" data-delete="${escapeHTML(t.id)}">Eliminar</button></td>`;
            tbody.appendChild(tr);
        });

        tbody.querySelectorAll("[data-save]").forEach(btn => btn.addEventListener("click", () => {
            const tr = btn.closest("tr");
            const tratamientosActuales = getTratamientos();
            const t = tratamientosActuales.find(x => x.id === btn.dataset.save);
            if (!t) return;
            const precio = parseFloat(tr.querySelector(".precio-input").value);
            const duracion = parseInt(tr.querySelector(".duracion-input").value, 10);
            if (!Number.isFinite(precio) || precio < 0 || !Number.isInteger(duracion) || duracion <= 0) {
                alert("Precio y duración deben tener valores válidos.");
                return;
            }
            t.precio = precio;
            t.duracion = duracion;
            saveTratamientos(tratamientosActuales);
            alert("Cambios guardados correctamente.");
            renderizarTablaTratamientos();
            cargarResumen();
        }));

        tbody.querySelectorAll("[data-edit]").forEach(btn => btn.addEventListener("click", () => abrirModalTratamiento(btn.dataset.edit)));
        tbody.querySelectorAll("[data-delete]").forEach(btn => btn.addEventListener("click", () => {
            const t = getTratamientos().find(x => x.id === btn.dataset.delete);
            if (!t || !confirm(`¿Eliminar permanentemente «${t.es?.titulo || t.id}»?`)) return;
            saveTratamientos(getTratamientos().filter(x => x.id !== btn.dataset.delete));
            renderizarTablaTratamientos();
            cargarResumen();
        }));
        tbody.querySelectorAll(".toggle-precio-btn").forEach(btn => btn.addEventListener("click", () => {
            const tratamientosActuales = getTratamientos();
            const t = tratamientosActuales.find(x => x.id === btn.dataset.id);
            if (t) t.mostrarPrecio = t.mostrarPrecio !== true;
            saveTratamientos(tratamientosActuales);
            renderizarTablaTratamientos();
        }));

        tbody.querySelectorAll(".toggle-btn").forEach(btn => btn.addEventListener("click", () => {
            const tratamientosActuales = getTratamientos();
            const t = tratamientosActuales.find(x => x.id === btn.dataset.id);
            if (t) t.activo = t.activo === false;
            saveTratamientos(tratamientosActuales);
            renderizarTablaTratamientos();
            cargarResumen();
        }));
    }

    const modal = document.getElementById("modal-tratamiento-admin");
    const form = document.getElementById("form-tratamiento");

    function abrirModalTratamiento(id = "") {
        if (!modal || !form) return;
        form.reset();
        document.getElementById("tratamiento-id").value = id;
        const titulo = document.getElementById("modal-admin-titulo");
        if (id) {
            const t = getTratamientos().find(x => x.id === id);
            if (!t) return;
            titulo.textContent = "Editar tratamiento";
            document.getElementById("campo-es").value = t.es?.titulo || "";
            document.getElementById("campo-pt").value = t.pt?.titulo || "";
            document.getElementById("desc-es").value = t.es?.desc || "";
            document.getElementById("desc-pt").value = t.pt?.desc || "";
            document.getElementById("campo-precio").value = t.precio ?? "";
            document.getElementById("campo-duracion").value = t.duracion ?? 60;
            const selectCategoria = document.getElementById("campo-categoria");
            const categoriaActual = t.categoria || "Belleza";
            if (![...selectCategoria.options].some(o => o.value === categoriaActual)) {
                const opcion = document.createElement("option");
                opcion.value = categoriaActual;
                opcion.textContent = categoriaActual;
                selectCategoria.appendChild(opcion);
            }
            selectCategoria.value = categoriaActual;
            document.getElementById("campo-imagen").value = t.imagen || "";
            document.getElementById("campo-eslogan-es").value = t.eslogan?.es || "";
            document.getElementById("campo-eslogan-pt").value = t.eslogan?.pt || "";
            document.getElementById("mostrar-precio").checked = t.mostrarPrecio === true;
        } else {
            titulo.textContent = "Nuevo tratamiento";
            document.getElementById("campo-duracion").value = 60;
            document.getElementById("mostrar-precio").checked = false;
        }
        modal.classList.add("activo");
    }

    function cerrarModal() { if (modal) modal.classList.remove("activo"); }

    document.getElementById("btn-nuevo-tratamiento")?.addEventListener("click", () => abrirModalTratamiento());
    document.getElementById("modal-admin-cerrar")?.addEventListener("click", cerrarModal);
    document.getElementById("modal-admin-cancelar")?.addEventListener("click", cerrarModal);
    modal?.addEventListener("click", e => { if (e.target === modal) cerrarModal(); });

    form?.addEventListener("submit", e => {
        e.preventDefault();
        const idOriginal = document.getElementById("tratamiento-id").value.trim();
        const tituloEs = document.getElementById("campo-es").value.trim();
        const tituloPt = document.getElementById("campo-pt").value.trim() || tituloEs;
        const descEs = document.getElementById("desc-es").value.trim();
        const descPt = document.getElementById("desc-pt").value.trim() || descEs;
        const precio = parseFloat(document.getElementById("campo-precio").value);
        const duracion = parseInt(document.getElementById("campo-duracion").value, 10);
        const categoria = document.getElementById("campo-categoria").value || "Belleza";
        const imagen = document.getElementById("campo-imagen").value.trim();
        const esloganEs = document.getElementById("campo-eslogan-es").value.trim();
        const esloganPt = document.getElementById("campo-eslogan-pt").value.trim() || esloganEs;
        const mostrarPrecio = document.getElementById("mostrar-precio").checked;

        if (!tituloEs || !descEs || !Number.isFinite(precio) || precio < 0 || !Number.isInteger(duracion) || duracion <= 0) {
            alert("Completa nombre en español, descripción en español, precio y duración con valores válidos.");
            return;
        }

        const tratamientos = getTratamientos();
        if (idOriginal) {
            const t = tratamientos.find(x => x.id === idOriginal);
            if (t) {
                t.es = { titulo: tituloEs, desc: descEs };
                t.pt = { titulo: tituloPt, desc: descPt };
                t.precio = precio;
                t.duracion = duracion;
                t.categoria = categoria;
                t.imagen = imagen;
                t.eslogan = { es: esloganEs, pt: esloganPt };
                t.mostrarPrecio = mostrarPrecio;
            }
        } else {
            let id = slugify(tituloEs);
            while (tratamientos.some(t => t.id === id)) id = `${slugify(tituloEs)}-${Math.floor(Math.random() * 1000)}`;
            tratamientos.push({ id, precio, duracion, activo: true, categoria, imagen, mostrarPrecio, eslogan: { es: esloganEs, pt: esloganPt }, es: { titulo: tituloEs, desc: descEs }, pt: { titulo: tituloPt, desc: descPt } });
        }
        saveTratamientos(tratamientos);
        cerrarModal();
        renderizarTablaTratamientos();
        cargarResumen();
        alert(idOriginal ? "Tratamiento actualizado correctamente." : "Tratamiento agregado correctamente.");
    });

    function renderizarHorarios() {
        const contenedor = document.getElementById("lista-horarios");
        if (!contenedor) return;
        const horarios = getHorarios();
        contenedor.innerHTML = DIAS.map((dia, index) => {
            const h = horarios[index];
            return `<div class="horario-row">
                <div class="horario-dia"><strong>${dia}</strong><label><input type="checkbox" class="horario-activo" data-dia="${index}" ${h.activo ? "checked" : ""}> Abierto</label></div>
                <div class="horario-horas"><input type="time" class="horario-inicio" data-dia="${index}" value="${h.inicio}"><span>hasta</span><input type="time" class="horario-fin" data-dia="${index}" value="${h.fin}"></div>
            </div>`;
        }).join("");
    }

    document.getElementById("btn-guardar-horarios")?.addEventListener("click", () => {
        const horarios = getHorarios();
        for (let i = 0; i < 7; i++) {
            const activo = document.querySelector(`.horario-activo[data-dia="${i}"]`).checked;
            const inicio = document.querySelector(`.horario-inicio[data-dia="${i}"]`).value;
            const fin = document.querySelector(`.horario-fin[data-dia="${i}"]`).value;
            if (activo && inicio >= fin) {
                alert(`El horario de ${DIAS[i]} no es válido: la hora de inicio debe ser anterior al cierre.`);
                return;
            }
            horarios[i] = { activo, inicio, fin };
        }
        saveHorarios(horarios);
        alert("Horarios guardados correctamente.");
    });

    function cargarAjustes() {
        const tasa = document.getElementById("tasa-cambio-admin");
        if (tasa) tasa.value = getTasa();
    }

    document.getElementById("btn-guardar-tasa")?.addEventListener("click", () => {
        const valor = parseFloat(document.getElementById("tasa-cambio-admin").value);
        if (!Number.isFinite(valor) || valor <= 0) return alert("Introduce una tasa válida mayor que 0.");
        localStorage.setItem(STORAGE.tasa, valor);
        guardarEstadoEnFirestore();
        renderizarTablaTratamientos();
        alert("Tasa de cambio guardada.");
    });

    window.exportarDatos = function () {
        const data = { tratamientos: getTratamientos(), citas: getCitas(), horarios: getHorarios(), tasaCambio: getTasa() };
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = "backup_miel_terrazas.json";
        a.click();
        URL.revokeObjectURL(url);
    };

    window.reiniciarDatos = function () {
        if (!confirm("¿Seguro que deseas borrar los datos locales de Miel Terrazas? Esta acción no se puede deshacer.")) return;
        Object.values(STORAGE).forEach(key => localStorage.removeItem(key));
        location.reload();
    };

    // Funciones globales de ayuda
    window.toggleTratamiento = id => {
        const ts = getTratamientos();
        const t = ts.find(x => x.id === id);
        if (t) t.activo = t.activo === false;
        saveTratamientos(ts);
        renderizarTablaTratamientos();
        cargarResumen();
    };
    window.guardarCambiosTratamiento = id => document.querySelector(`[data-save="${CSS.escape(id)}"]`)?.click();

    // Inicialización predeterminada
    if (!localStorage.getItem(STORAGE.citas)) saveCitas([]);
    if (!localStorage.getItem(STORAGE.horarios)) saveHorarios(DEFAULT_HORARIOS);
    if (!localStorage.getItem(STORAGE.tasa)) localStorage.setItem(STORAGE.tasa, "1.35");
    getTratamientos();
});
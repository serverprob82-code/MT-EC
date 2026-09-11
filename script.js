import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-app.js";
import { getFirestore, doc, getDoc } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-firestore.js";

const firebaseConfig = {
    apiKey: "AIzaSyDuczvjYVzRFkS699_DImPW-brTnMxZtCs",
    authDomain: "miel-estetica-web.firebaseapp.com",
    projectId: "miel-estetica-web",
    storageBucket: "miel-estetica-web.firebasestorage.app",
    messagingSenderId: "1099087151356",
    appId: "1:1099087151356:web:82f79034798fe90b38d779"
};

// Iniciar Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const DOC_REF = doc(db, "miel_terrazas", "datos_panel");

let idiomaActual = "es";
let tratamientosGlobales = [];

document.addEventListener("DOMContentLoaded", async () => {
    /* =========================================
       1. CONEXIÓN A FIREBASE Y RENDERIZADO
    ========================================== */
    const contenedorTratamientos = document.querySelector(".contenedor-tratamientos");

    async function cargarTratamientos() {
        try {
            const snap = await getDoc(DOC_REF);
            if (snap.exists()) {
                const data = snap.data();
                tratamientosGlobales = data.tratamientos || [];
                renderizarTratamientos(tratamientosGlobales);
            } else {
                contenedorTratamientos.innerHTML = '<p style="text-align:center;">No se encontraron tratamientos.</p>';
            }
        } catch (error) {
            console.error("Error al cargar de Firebase:", error);
            contenedorTratamientos.innerHTML = '<p style="text-align:center;">Error al cargar los servicios. Por favor, intenta de nuevo.</p>';
        }
    }

    function categoriaPortuguese(categoria) {
        const mapa = {
            "Estética corporal": "Estética corporal",
            "Estética facial": "Estética facial",
            "Pestañas y cejas": "Cílios e sobrancelhas",
            "Belleza": "Beleza",
            "Facial": "Facial",
            "Cabello": "Cabelo",
            "Manos y pies": "Mãos e pés",
            "Depilación": "Depilação",
            "Masajes y bienestar": "Massagens e bem-estar",
            "Otros": "Outros"
        };
        return mapa[categoria] || categoria;
    }

    function renderizarTratamientos(tratamientos) {
        if (!contenedorTratamientos) return;
        contenedorTratamientos.innerHTML = ""; // Borrar mensaje de "Cargando..."

        const categorias = new Map();
        const activos = tratamientos.filter(t => t.activo !== false);

        // Agrupar por categoría
        activos.forEach(t => {
            const cat = t.categoria || "Belleza";
            if (!categorias.has(cat)) categorias.set(cat, []);
            categorias.get(cat).push(t);
        });

        categorias.forEach((lista, categoria) => {
            // Crear contenedor de categoría
            const bloque = document.createElement("div");
            bloque.className = "categoria-tratamientos reveal-scroll reveal-visible";
            
            const titulo = document.createElement("h3");
            titulo.className = "categoria-titulo";
            titulo.setAttribute("data-es", categoria);
            titulo.setAttribute("data-pt", categoriaPortuguese(categoria));
            titulo.textContent = idiomaActual === 'es' ? categoria : categoriaPortuguese(categoria);
            bloque.appendChild(titulo);

            const grid = document.createElement("div");
            grid.className = "grid-tratamientos";

            // Crear tarjetas
            lista.forEach(t => {
                const tituloEs = t.es?.titulo || t.nombre || "Tratamiento";
                const tituloPt = t.pt?.titulo || t.nombre || tituloEs;
                const esloganEs = t.eslogan?.es || "Un cuidado pensado para ti.";
                const esloganPt = t.eslogan?.pt || "Um cuidado pensado para você.";
                
                const imagenHtml = t.imagen 
                    ? `<img src="${t.imagen}" alt="${tituloEs}" loading="lazy">` 
                    : `<div style="height: 200px; background: #FFD1DC; display:flex; align-items:center; justify-content:center; color:#5C4033;"><i class="fas fa-spa fa-3x"></i></div>`;

                const tarjeta = document.createElement("div");
                tarjeta.className = "tratamiento";
                tarjeta.innerHTML = `
                    <div class="tratamiento-img-wrapper">
                        ${imagenHtml}
                    </div>
                    <div class="tratamiento-info">
                        <h3 class="titulo-tratamiento" data-es="${tituloEs}" data-pt="${tituloPt}">${idiomaActual === 'es' ? tituloEs : tituloPt}</h3>
                        <p class="tratamiento-eslogan" data-es="${esloganEs}" data-pt="${esloganPt}">${idiomaActual === 'es' ? esloganEs : esloganPt}</p>
                        <div class="tratamiento-meta">
                            ${t.duracion ? `<span class="tratamiento-duracion"><i class="far fa-clock"></i> ${t.duracion} min aprox.</span>` : ''}
                        </div>
                        <button class="btn-info" data-es="Conocer más" data-pt="Saiba mais">${idiomaActual === 'es' ? 'Conocer más' : 'Saiba mais'}</button>
                    </div>
                `;

                // Evento para abrir el modal
                tarjeta.addEventListener("click", () => abrirModal(t));
                grid.appendChild(tarjeta);
            });

            bloque.appendChild(grid);
            contenedorTratamientos.appendChild(bloque);
        });
    }

    // Iniciar la descarga de tratamientos
    cargarTratamientos();

    /* =========================================
       2. MODAL Y EVENTOS
    ========================================== */
    const modal = document.getElementById("modal-tratamiento");
    const modalCerrar = document.getElementById("modal-cerrar");
    const modalFondo = document.querySelector(".modal-fondo");
    
    function abrirModal(t) {
        const modalTitulo = document.getElementById("modal-titulo");
        const modalDescripcion = document.getElementById("modal-descripcion");
        const modalWhatsapp = document.getElementById("modal-whatsapp");
        const modalReserva = document.getElementById("modal-reserva");

        const tituloEs = t.es?.titulo || t.nombre || "Tratamiento";
        const tituloPt = t.pt?.titulo || t.nombre || tituloEs;
        const descEs = t.es?.desc || t.descripcion || "";
        const descPt = t.pt?.desc || t.descripcion || descEs;

        modalTitulo.textContent = idiomaActual === "pt" ? tituloPt : tituloEs;
        modalDescripcion.textContent = idiomaActual === "pt" ? descPt : descEs;

        // Mostrar precio en modal si la dueña lo activó
        let modalDetalles = modalDescripcion.nextElementSibling;
        if (!modalDetalles || !modalDetalles.classList.contains("modal-detalles-tratamiento")) {
            modalDetalles = document.createElement("div");
            modalDetalles.className = "modal-detalles-tratamiento";
            modalDescripcion.insertAdjacentElement("afterend", modalDetalles);
        }
        
        const partes = [];
        if (t.duracion) partes.push(`<span><i class="far fa-clock"></i> ${t.duracion} min aprox.</span>`);
        if (t.mostrarPrecio && t.precio) partes.push(`<span><i class="fas fa-tag"></i> ${t.precio} Bs</span>`);
        
        modalDetalles.innerHTML = partes.join(" ");
        modalDetalles.style.display = partes.length ? "" : "none";

        // Enlaces de acción
        const msj = idiomaActual === "pt" 
            ? `Olá, tenho interesse em saber mais sobre o tratamento de ${tituloPt}.` 
            : `Hola, me interesa saber más sobre el tratamiento de ${tituloEs}.`;
        
        if (modalWhatsapp) {
            modalWhatsapp.setAttribute("href", `https://wa.me/556899499836?text=${encodeURIComponent(msj)}`);
        }
        if (modalReserva) {
            modalReserva.setAttribute("href", `reserva.html?tratamiento=${encodeURIComponent(tituloEs)}&lang=${idiomaActual}`);
        }

        modal.classList.add("activo");
        document.body.classList.add("modal-abierto");
        modal.setAttribute("aria-hidden", "false");
    }

    function cerrarModalVentana() {
        if (!modal) return;
        modal.classList.remove("activo");
        document.body.classList.remove("modal-abierto");
        modal.setAttribute("aria-hidden", "true");
    }

    if (modalCerrar) modalCerrar.addEventListener("click", cerrarModalVentana);
    if (modalFondo) modalFondo.addEventListener("click", cerrarModalVentana);

    /* =========================================
       3. MENÚ RESPONSIVO Y TRADUCCIÓN
    ========================================== */
    const menuToggle = document.getElementById("menu-toggle");
    const menu = document.getElementById("menu");
    if (menuToggle && menu) {
        menuToggle.addEventListener("click", () => {
            menu.classList.toggle("menu-abierto");
        });
        document.querySelectorAll(".menu a").forEach(enlace => {
            enlace.addEventListener("click", () => menu.classList.remove("menu-abierto"));
        });
    }

    const btnIdioma = document.getElementById("btn-idioma");
    if (btnIdioma) {
        btnIdioma.addEventListener("click", () => {
            idiomaActual = idiomaActual === "es" ? "pt" : "es";
            btnIdioma.innerHTML = idiomaActual === "pt" ? '<span class="flag">🇧🇴</span> ES' : '<span class="flag">🇧🇷</span> PT';
            
            // Traducir textos fijos
            document.querySelectorAll("[data-es][data-pt]").forEach(el => {
                el.textContent = el.getAttribute(`data-${idiomaActual}`);
            });
            
            // Volver a renderizar los tratamientos para actualizar sus textos
            renderizarTratamientos(tratamientosGlobales);
        });
    }

    /* =========================================
       4. ANIMACIONES AL HACER SCROLL
    ========================================== */
    const elementosReveal = document.querySelectorAll(".reveal-scroll");
    const revisarScroll = () => {
        const alturaPantalla = window.innerHeight * 0.85;
        elementosReveal.forEach(elemento => {
            const distanciaTop = elemento.getBoundingClientRect().top;
            if (distanciaTop < alturaPantalla) {
                elemento.classList.add("reveal-visible");
            }
        });
    };
    window.addEventListener("scroll", revisarScroll);
    revisarScroll();
});
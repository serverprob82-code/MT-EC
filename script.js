document.addEventListener("DOMContentLoaded", () => {

    /* =========================================
       0. BASE DE DATOS CENTRALIZADA (SINCRONIZACIÓN)
    ========================================== */
    let tratamientos;
    
    // CORRECCIÓN: Prevención de errores con datos antiguos guardados en el navegador
    try {
        tratamientos = JSON.parse(localStorage.getItem('miel_tratamientos'));
        // Si detecta una base de datos antigua (sin la propiedad 'es' de español), fuerza el reinicio
        if (tratamientos && tratamientos.length > 0 && !tratamientos[0].es) {
            tratamientos = null; 
        }
    } catch (e) {
        // Si hay datos corruptos, los ignora
        tratamientos = null;
    }
    
    if (!tratamientos || tratamientos.length === 0) {
        tratamientos = [
            { id: "hidrolipoclasia", precio: 200, duracion: 60, mostrarPrecio: false, categoria: "Estética corporal", eslogan: { es: "Reducción efectiva de grasa localizada.", pt: "Redução efetiva de gordura localizada." }, activo: true, es: { titulo: "Hidrolipoclasia", desc: "Tratamiento estético altamente efectivo para la reducción de grasa localizada mediante la infiltración de solución salina y aplicación de ultrasonido." }, pt: { titulo: "Hidrolipoclasia", desc: "Tratamento estético altamente efetivo para a redução de gordura localizada..." } },
            { id: "electroestimulacion", precio: 150, duracion: 60, mostrarPrecio: false, categoria: "Estética corporal", eslogan: { es: "Tonificación muscular y moldeo corporal.", pt: "Tonificação muscular e modelagem corporal." }, activo: true, es: { titulo: "Electroestimulación", desc: "Técnica que utiliza corrientes para provocar contracciones musculares, ayudando a tonificar, definir y moldear la figura." }, pt: { titulo: "Eletroestimulação", desc: "Técnica que utiliza correntes para provocar contrações musculares..." } },
            { id: "dermato-funcional", precio: 200, duracion: 60, mostrarPrecio: false, categoria: "Estética corporal", eslogan: { es: "Salud y estética de la piel.", pt: "Saúde e estética da pele." }, activo: true, es: { titulo: "Dermato funcional", desc: "Abordaje especializado enfocado en la salud, prevención y recuperación de alteraciones tegumentarias y estéticas de la piel." }, pt: { titulo: "Dermato funcional", desc: "Abordagem especializada focada na saúde..." } },
            { id: "masaje", precio: 100, duracion: 60, mostrarPrecio: false, categoria: "Estética corporal", eslogan: { es: "Bienestar profundo y alivio del estrés.", pt: "Bem-estar profundo e alívio do estresse." }, activo: true, es: { titulo: "Masaje relajante", desc: "Experiencia de bienestar profundo diseñada para liberar tensiones acumuladas, calmar la mente y aliviar el estrés diario." }, pt: { titulo: "Massagem relaxante", desc: "Experiência de bem-estar profundo..." } },
            { id: "scraper", precio: 120, duracion: 60, mostrarPrecio: false, categoria: "Estética corporal", eslogan: { es: "Liberación de tensiones y tejido miofascial.", pt: "Liberação de tensões e tecido miofascial." }, activo: true, es: { titulo: "Scraper miofascial", desc: "Técnica de liberación instrumental del tejido miofascial que ayuda a mejorar la movilidad, reducir dolores y liberar tensiones profundas." }, pt: { titulo: "Scraper miofascial", desc: "Técnica de liberação instrumental..." } },
            { id: "microneedling", precio: 300, duracion: 60, mostrarPrecio: false, categoria: "Estética facial", eslogan: { es: "Regeneración celular y colágeno.", pt: "Regeneração celular e colágeno." }, activo: true, es: { titulo: "Microneedling", desc: "Inducción percutánea de colágeno mediante microagujas para estimular la regeneración celular, mejorar cicatrices y rejuvenecer el rostro." }, pt: { titulo: "Microneedling", desc: "Indução percutânea de colágeno..." } },
            { id: "pestanas", precio: 130, duracion: 60, mostrarPrecio: false, categoria: "Pestañas y cejas", eslogan: { es: "Mirada impactante y natural.", pt: "Olhar marcante e natural." }, activo: true, es: { titulo: "Extensiones de pestañas", desc: "Técnica pelo a pelo o volumen para realzar tu mirada de forma natural y sofisticada, adaptada a la forma de tus ojos." }, pt: { titulo: "Extensões de cílios", desc: "Técnica fio a fio ou volume..." } },
            { id: "henna", precio: 80, duracion: 60, mostrarPrecio: false, categoria: "Pestañas y cejas", eslogan: { es: "Diseño y definición perfecta.", pt: "Design e definição perfeita." }, activo: true, es: { titulo: "Henna para cejas", desc: "Diseño y pigmentación semipermanente de cejas con productos de alta calidad para lograr una mirada definida y armónica." }, pt: { titulo: "Henna para sobrancelhas", desc: "Design e pigmentação..." } },
            { id: "trenzas", precio: 150, duracion: 60, mostrarPrecio: false, categoria: "Belleza", eslogan: { es: "Estilo y tendencia para tu cabello.", pt: "Estilo e tendência para o seu cabelo." }, activo: true, es: { titulo: "Trenzas profesionales", desc: "Estilos modernos y cuidadosos de trenzas para lucir un peinado impecable, elegante y de larga duración." }, pt: { titulo: "Tranças profissionais", desc: "Estilos modernos e cuidadosos..." } },
            { id: "acrocordones", precio: 90, duracion: 60, mostrarPrecio: false, categoria: "Belleza", eslogan: { es: "Cuidado dermatológico especializado.", pt: "Cuidado dermatológico especializado." }, activo: true, es: { titulo: "Tratamiento para acrocordones", desc: "Procedimiento seguro y especializado para la remoción estética de pequeños fibromas blandos de la piel." }, pt: { titulo: "Tratamento para acrocórdons", desc: "Procedimento seguro e especializado..." } }
        ];
        localStorage.setItem('miel_tratamientos', JSON.stringify(tratamientos));
    }

    // =========================================================
    // SINCRONIZACIÓN DINÁMICA DE TRATAMIENTOS Y CATEGORÍAS
    // =========================================================
    // La página principal se construye automáticamente desde
    // localStorage. Cada categoría se convierte en un separador
    // y cada tratamiento aparece dentro de su categoría.
    const contenedorTratamientos = document.querySelector(".contenedor-tratamientos");

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

    function normalizarCategoria(categoria) {
        const valor = String(categoria || "Belleza").trim();
        return valor || "Belleza";
    }

    function obtenerDatosBaseTarjetas() {
        const datos = {};
        document.querySelectorAll(".tratamiento[data-tratamiento]").forEach(tarjeta => {
            const id = tarjeta.dataset.tratamiento;
            const img = tarjeta.querySelector(".tratamiento-img-wrapper img");
            if (id) {
                datos[id] = {
                    imagen: img?.getAttribute("src") || "",
                    alt: img?.getAttribute("alt") || ""
                };
            }
        });
        return datos;
    }

    function crearTarjetaTratamiento(t, datosBase, plantilla) {
        const tarjeta = plantilla.cloneNode(true);
        tarjeta.classList.remove("reveal-visible");
        tarjeta.setAttribute("data-tratamiento", t.id);
        tarjeta.setAttribute("data-categoria", normalizarCategoria(t.categoria));
        tarjeta.dataset.generadaDinamicamente = "true";

        const tituloEs = t.es?.titulo || t.nombre || "Tratamiento";
        const tituloPt = t.pt?.titulo || t.nombre || tituloEs;
        const descEs = t.es?.desc || t.descripcion || "";
        const descPt = t.pt?.desc || t.descripcion || descEs;

        const tituloTag = tarjeta.querySelector("h3, h2, h4, .titulo-tratamiento");
        if (tituloTag) {
            tituloTag.setAttribute("data-es", tituloEs);
            tituloTag.setAttribute("data-pt", tituloPt);
            tituloTag.textContent = tituloEs;
        }

        // La descripción completa queda reservada para el modal.
        tarjeta.dataset.descripcionEs = descEs;
        tarjeta.dataset.descripcionPt = descPt;

        // En la tarjeta mostramos SOLO un eslogan corto.
        // La descripción completa queda exclusivamente para el modal.
        const eslogan = tarjeta.querySelector(".tratamiento-eslogan");
        if (eslogan) {
            const fallbackEs = "Un cuidado pensado para ti.";
            const fallbackPt = "Um cuidado pensado para você.";
            const sloganEs = t.eslogan?.es || fallbackEs;
            const sloganPt = t.eslogan?.pt || fallbackPt;
            eslogan.setAttribute("data-es", sloganEs);
            eslogan.setAttribute("data-pt", sloganPt);
            eslogan.textContent = sloganEs;
            eslogan.classList.remove("tratamiento-descripcion-visible");
        }

        const boton = tarjeta.querySelector(".btn-info");
        if (boton) {
            boton.setAttribute("data-es", "Conocer más");
            boton.setAttribute("data-pt", "Saiba mais");
            boton.textContent = "Conocer más";
        }

        const img = tarjeta.querySelector(".tratamiento-img-wrapper img");
        const imagen = t.imagen || datosBase[t.id]?.imagen || "";
        if (img) {
            if (imagen) {
                img.src = imagen;
                img.alt = tituloEs;
                img.style.display = "";
            } else {
                img.removeAttribute("src");
                img.alt = tituloEs;
                img.style.display = "none";
            }
        }

        // En la tarjeta solo mostramos la duración aproximada. El precio
        // permanece fuera de la tarjeta y puede activarse desde el panel
        // para mostrarlo dentro del modal.
        const info = tarjeta.querySelector(".tratamiento-info");
        if (info) {
            let meta = info.querySelector(".tratamiento-meta");
            if (!meta) {
                meta = document.createElement("div");
                meta.className = "tratamiento-meta";
                info.insertBefore(meta, boton || null);
            }
            const duracion = Number(t.duracion);
            meta.innerHTML = Number.isFinite(duracion) && duracion > 0
                ? `<span class="tratamiento-duracion"><i class="far fa-clock"></i> ${duracion} min aprox.</span>`
                : "";
        }

        return tarjeta;
    }

    function renderizarTratamientosPorCategorias() {
        if (!contenedorTratamientos) return;

        const tarjetasOriginales = [...contenedorTratamientos.querySelectorAll(".tratamiento[data-tratamiento]")];
        const datosBase = obtenerDatosBaseTarjetas();
        const plantilla = tarjetasOriginales[0]?.cloneNode(true);
        if (!plantilla) return;

        const categorias = new Map();
        const activos = tratamientos.filter(t => t && t.activo !== false);

        activos.forEach(t => {
            const categoria = normalizarCategoria(t.categoria);
            if (!categorias.has(categoria)) categorias.set(categoria, []);
            categorias.get(categoria).push(t);
        });

        // Si no existe categoría en datos antiguos, asignamos las categorías
        // conocidas según los tratamientos originales.
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

        activos.forEach(t => {
            if (!t.categoria && categoriasPorId[t.id]) t.categoria = categoriasPorId[t.id];
        });

        // Recalcular después de completar categorías heredadas.
        categorias.clear();
        activos.forEach(t => {
            const categoria = normalizarCategoria(t.categoria);
            if (!categorias.has(categoria)) categorias.set(categoria, []);
            categorias.get(categoria).push(t);
        });

        localStorage.setItem("miel_tratamientos", JSON.stringify(tratamientos));
        contenedorTratamientos.innerHTML = "";

        categorias.forEach((lista, categoria) => {
            const bloque = document.createElement("div");
            bloque.className = "categoria-tratamientos reveal-scroll";
            bloque.dataset.categoria = categoria;

            const titulo = document.createElement("h3");
            titulo.className = "categoria-titulo";
            titulo.setAttribute("data-es", categoria);
            titulo.setAttribute("data-pt", categoriaPortuguese(categoria));
            titulo.textContent = categoria;
            bloque.appendChild(titulo);

            const grid = document.createElement("div");
            grid.className = "grid-tratamientos";

            lista.forEach(t => {
                const tarjeta = crearTarjetaTratamiento(t, datosBase, plantilla);
                grid.appendChild(tarjeta);
            });

            bloque.appendChild(grid);
            contenedorTratamientos.appendChild(bloque);
        });
    }

    renderizarTratamientosPorCategorias();

    /* =========================================
       1. MENÚ RESPONSIVO (MÓVIL)
    ========================================== */
    const menuToggle = document.getElementById("menu-toggle");
    const menu = document.getElementById("menu");

    if (menuToggle && menu) {
        menuToggle.addEventListener("click", () => {
            menu.classList.toggle("menu-abierto");
            const expanded = menu.classList.contains("menu-abierto");
            menuToggle.setAttribute("aria-expanded", expanded);
        });

        document.querySelectorAll(".menu a").forEach(enlace => {
            enlace.addEventListener("click", () => {
                menu.classList.remove("menu-abierto");
                menuToggle.setAttribute("aria-expanded", "false");
            });
        });
    }

    /* =========================================
       2. SISTEMA BILINGÜE ESPAÑOL / PORTUGUÉS
    ========================================== */
    const btnIdioma = document.getElementById("btn-idioma");
    let idiomaActual = "es";

    if (btnIdioma) {
        btnIdioma.addEventListener("click", () => {
            idiomaActual = idiomaActual === "es" ? "pt" : "es";

            if (idiomaActual === "pt") {
                btnIdioma.innerHTML = '<span class="flag">🇧🇴</span> ES';
                actualizarTextos("pt");
            } else {
                btnIdioma.innerHTML = '<span class="flag">🇧🇷</span> PT';
                actualizarTextos("es");
            }
        });
    }

    function actualizarTextos(lang) {
        const elementos = document.querySelectorAll("[data-es][data-pt]");

        elementos.forEach(el => {
            el.textContent = el.getAttribute(`data-${lang}`);
        });

        const btnWa = document.getElementById("modal-whatsapp");
        const btnRes = document.getElementById("modal-reserva");

        if (btnWa) {
            btnWa.innerHTML = lang === "pt" 
                ? '<i class="fab fa-whatsapp"></i> Agendar por WhatsApp' 
                : '<i class="fab fa-whatsapp"></i> Agendar por WhatsApp';
        }

        if (btnRes) {
            btnRes.innerHTML = lang === "pt" 
                ? '<i class="far fa-calendar-alt"></i> Reservar Agora' 
                : '<i class="far fa-calendar-alt"></i> Reservar Ahora';
        }

        const mensajeWaEs = "Hola, me gustaría agendar una cita o hacer una consulta.";
        const mensajeWaPt = "Olá, gostaria de agendar um horário ou tirar uma dúvida.";
        const linksWa = document.querySelectorAll('a[href*="wa.me"]');

        linksWa.forEach(link => {
            if(!link.id || link.id !== "modal-whatsapp"){
                const urlBase = link.getAttribute("href").split("?")[0];
                const mensaje = lang === "pt" ? encodeURIComponent(mensajeWaPt) : encodeURIComponent(mensajeWaEs);
                link.setAttribute("href", `${urlBase}?text=${mensaje}`);
            }
        });
    }

    /* =========================================
       3. MODAL DE TRATAMIENTO Y ACCIONES
    ========================================== */
    const modal = document.getElementById("modal-tratamiento");
    const modalCerrar = document.getElementById("modal-cerrar");
    const modalFondo = document.querySelector(".modal-fondo");
    const modalTitulo = document.getElementById("modal-titulo");
    const modalDescripcion = document.getElementById("modal-descripcion");
    
    const modalWhatsapp = document.getElementById("modal-whatsapp");
    const modalReserva = document.getElementById("modal-reserva");

    // Recargar eventos click para incluir tarjetas nuevas
    document.querySelectorAll(".tratamiento").forEach(tarjeta => {
        tarjeta.addEventListener("click", () => {
            const clave = tarjeta.getAttribute("data-tratamiento");
            
            // Buscar la info en la base de datos centralizada
            const bdTratamientos = JSON.parse(localStorage.getItem('miel_tratamientos')) || [];
            const info = bdTratamientos.find(t => t.id === clave);

            if (!info) return;

            const langData = info[idiomaActual] || info.es || {};
            
            modalTitulo.textContent = langData.titulo || info.nombre || "Tratamiento";
            modalDescripcion.textContent = langData.desc || info.descripcion || "";

            // El precio es opcional: la dueña puede decidir desde el panel
            // si desea mostrarlo públicamente. La duración sí se informa.
            const modalContenido = modalDescripcion?.parentElement;
            if (modalContenido) {
                let modalDetalles = modalContenido.querySelector(".modal-detalles-tratamiento");
                if (!modalDetalles) {
                    modalDetalles = document.createElement("div");
                    modalDetalles.className = "modal-detalles-tratamiento";
                    modalDescripcion.insertAdjacentElement("afterend", modalDetalles);
                }
                const duracion = Number(info.duracion);
                const precio = Number(info.precio);
                const mostrarPrecio = info.mostrarPrecio === true;
                const partes = [];
                if (Number.isFinite(duracion) && duracion > 0) {
                    partes.push(`<span><i class="far fa-clock"></i> ${duracion} min aprox.</span>`);
                }
                if (mostrarPrecio && Number.isFinite(precio) && precio >= 0) {
                    partes.push(`<span><i class="fas fa-tag"></i> ${precio.toFixed(2)} Bs</span>`);
                }
                modalDetalles.innerHTML = partes.join(" ");
                modalDetalles.style.display = partes.length ? "" : "none";
            }

            // Enlace de WhatsApp dinámico
            const msjEs = `Hola, me interesa saber más sobre el tratamiento de ${info.es.titulo}.`;
            const msjPt = `Olá, tenho interesse em saber mais sobre o tratamento de ${info.pt.titulo}.`;
            const msjFinal = idiomaActual === "pt" ? msjPt : msjEs;
            
            if (modalWhatsapp) {
                modalWhatsapp.setAttribute(
                    "href",
                    `https://wa.me/556899499836?text=${encodeURIComponent(msjFinal)}`
                );
            }

            // Enlace al archivo reserva.html
            if (modalReserva) {
                modalReserva.setAttribute(
                    "href", 
                    `reserva.html?tratamiento=${encodeURIComponent(info.es.titulo)}&lang=${idiomaActual}`
                );
            }

            modal.classList.add("activo");
            document.body.classList.add("modal-abierto");
            modal.setAttribute("aria-hidden", "false");
        });
    });

    function cerrarModalVentana() {
        if (!modal) return;
        modal.classList.remove("activo");
        document.body.classList.remove("modal-abierto");
        modal.setAttribute("aria-hidden", "true");
    }

    if (modalCerrar) modalCerrar.addEventListener("click", cerrarModalVentana);
    if (modalFondo) modalFondo.addEventListener("click", cerrarModalVentana);

    document.addEventListener("keydown", (e) => {
        if (e.key === "Escape" && modal && modal.classList.contains("activo")) {
            cerrarModalVentana();
        }
    });

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
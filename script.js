/* ============================================
   FARMACIA CICALA - SCRIPT.JS
   ============================================ */

import { getFirestore, collection, getDocs, getDoc, doc } from "https://www.gstatic.com/firebasejs/11.9.0/firebase-firestore.js";
import { initializeApp } from "https://www.gstatic.com/firebasejs/11.9.0/firebase-app.js";

const firebaseConfig = {
    apiKey: "AIzaSyC5r3rA7a5awU2oErPnn2fP2qNZZ6s5qmo",
    authDomain: "farmacia-cicala.firebaseapp.com",
    projectId: "farmacia-cicala",
    storageBucket: "farmacia-cicala.firebasestorage.app",
    messagingSenderId: "299138749267",
    appId: "1:299138749267:web:c716a4f57e6e8957a987a6"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

/* ============================================
   ESTADO
   ============================================ */

let carrito = [];
let modalidadSeleccionada = 'retiro';
let _onCarritoVaciado = [];

/* ============================================
   DOM
   ============================================ */

const novedadesContainer = document.getElementById('novedades-container');
const promocionesContainer = document.getElementById('promociones-container');
const combosContainer = document.getElementById('combos-container');
const cartPanel = document.getElementById('cart-panel');
const cartOverlay = document.getElementById('cart-overlay');
const cartItemsList = document.getElementById('cart-items');
const cartTotalEl = document.getElementById('cart-total');
const cartButton = document.getElementById('cart-button');
const cartCount = document.getElementById('cart-count');
const closeCartBtn = document.getElementById('close-cart-btn');
const enviarWhatsappBtn = document.getElementById('enviar-whatsapp-btn');
const clearCartBtn = document.getElementById('clear-cart-btn');
const btnRetiro = document.getElementById('btn-retiro');
const btnEnvio = document.getElementById('btn-envio');
const direccionSection = document.getElementById('direccion-section');
const direccionInput = document.getElementById('direccion-input');
const navTabs = document.querySelectorAll('.nav-tab');

/* ============================================
   UTILIDADES
   ============================================ */

function formatearPrecio(precio) {
    return '$ ' + new Intl.NumberFormat('es-AR', {
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
    }).format(precio);
}

function normalizarImagenes(imagenes, fallbackNombre = '') {
    if (!imagenes || imagenes.length === 0) return [{ url: '', nombre: fallbackNombre, esPortada: true }];
    return imagenes.map((img, idx) => {
        if (typeof img === 'string') return { url: img, nombre: fallbackNombre, esPortada: idx === 0 };
        return { url: img.url || '', nombre: img.nombre || '', esPortada: img.esPortada || false };
    });
}

/**
 * Un producto tiene variantes si tiene MÁS de una imagen
 * Y TODAS tienen nombre cargado.
 */
function tieneVariantes(imagenes) {
    return imagenes && imagenes.length > 1;
}

function getCarritoId(productoId, nombreVariante) {
    return nombreVariante ? `${productoId}-${nombreVariante}` : productoId;
}

function getCantidadEnCarrito(carritoId) {
    const item = carrito.find(i => i.id === carritoId);
    return item ? item.cantidad : 0;
}

/* ============================================
   CARRUSEL
   ============================================ */

function crearCarrusel(imagenes, altText, heightClass = '') {
    const imgs = (imagenes && imagenes.length > 0) ? imagenes : [{ url: '', nombre: altText, esPortada: true }];
    const id = 'car-' + Math.random().toString(36).slice(2, 8);

    const html = `
        <div class="carrusel" id="${id}" data-idx="0">
            <div class="carrusel-track">
                ${imgs.map(img => {
        const src = typeof img === 'string' ? img : (img.url || '');
        return `<img src="${src}" alt="${altText}" class="producto-img ${heightClass}" onerror="this.src='';">`;
    }).join('')}
            </div>
            ${imgs.length > 1 ? `
                <button class="car-btn car-prev" aria-label="Anterior">&#8249;</button>
                <button class="car-btn car-next" aria-label="Siguiente">&#8250;</button>
                <div class="car-dots">
                    ${imgs.map((_, i) => `<span class="car-dot${i === 0 ? ' active' : ''}"></span>`).join('')}
                </div>
            ` : ''}
        </div>`;
    return { html, id, total: imgs.length };
}

function initCarrusel(id, onSlide) {
    const el = document.getElementById(id);
    if (!el) return;
    const track = el.querySelector('.carrusel-track');
    const dots = el.querySelectorAll('.car-dot');
    const total = track.children.length;
    if (total <= 1) return;

    let idx = 0;
    let timer = null;
    let autoplayStopped = false; // CAMBIO 2: bandera para detener autoplay permanentemente

    function goTo(n) {
        idx = (n + total) % total;
        track.style.transform = `translateX(-${idx * 100}%)`;
        dots.forEach((d, i) => d.classList.toggle('active', i === idx));
        if (onSlide) onSlide(idx);
    }

    function startAuto() {
        if (autoplayStopped) return; // CAMBIO 2: no reiniciar si fue detenido
        clearInterval(timer);
        timer = setInterval(() => goTo(idx + 1), 5000);
    }

    // CAMBIO 2: método para detener autoplay permanentemente
    function stopAutoplay() {
        autoplayStopped = true;
        clearInterval(timer);
        timer = null;
    }

    el.querySelector('.car-prev')?.addEventListener('click', e => {
        e.stopPropagation();
        goTo(idx - 1);
        startAuto(); // reinicia el timer al usar la flecha (solo si no fue detenido)
    });
    el.querySelector('.car-next')?.addEventListener('click', e => {
        e.stopPropagation();
        goTo(idx + 1);
        startAuto(); // reinicia el timer al usar la flecha (solo si no fue detenido)
    });

    let startX = 0;
    track.addEventListener('touchstart', e => { startX = e.touches[0].clientX; }, { passive: true });
    track.addEventListener('touchend', e => {
        const diff = startX - e.changedTouches[0].clientX;
        if (Math.abs(diff) > 40) { goTo(idx + (diff > 0 ? 1 : -1)); startAuto(); }
    }, { passive: true });

    // Exponer goTo para que la lógica de variantes pueda saltar slides
    el._carruselGoTo = goTo;
    // CAMBIO 2: exponer stopAutoplay
    el._stopAutoplay = stopAutoplay;

    startAuto();
    el.addEventListener('mouseenter', () => clearInterval(timer));
    el.addEventListener('mouseleave', startAuto);
}

function ordenarPorCategoria(productos, categorias) {
    const result = [];
    // Primero, productos de cada categoría en orden
    categorias.forEach(cat => {
        const delaCat = productos.filter(p => p.categoria === cat.id);
        result.push(...delaCat);
    });
    // Al final, sin categoría
    const sinCat = productos.filter(p => !p.categoria);
    result.push(...sinCat);
    return result;
}

/* ============================================
   BOTÓN CONTADOR (reemplaza "Agregar al carrito")
   ============================================ */

function crearBtnContador(carritoId, onCambio) {
    const wrap = document.createElement('div');
    wrap.className = 'btn-contador-wrap';

    function render(cantidad) {
        wrap.innerHTML = `
            <div class="btn-contador">
                <button class="contador-btn contador-menos">−</button>
                <span class="contador-num">${cantidad}</span>
                <button class="contador-btn contador-mas">+</button>
            </div>`;
        wrap.querySelector('.contador-menos').addEventListener('click', e => {
            e.stopPropagation();
            actualizarCantidad(carritoId, -1);
            const nueva = getCantidadEnCarrito(carritoId);
            // CAMBIO 3: siempre llamar onCambio para sincronizar variante-cant
            if (onCambio) onCambio(nueva);
            if (nueva > 0) render(nueva);
        });
        wrap.querySelector('.contador-mas').addEventListener('click', e => {
            e.stopPropagation();
            actualizarCantidad(carritoId, 1);
            const nueva = getCantidadEnCarrito(carritoId);
            render(nueva);
            // CAMBIO 3: llamar onCambio también al sumar, para sincronizar variante-cant
            if (onCambio) onCambio(nueva);
        });
    }

    render(getCantidadEnCarrito(carritoId));
    return wrap;
}

/* ============================================
   HELPER EVENTOS MOBILE/DESKTOP
   ============================================ */
function agregarEventoAbrirModal(elemento, callback) {
    let touchStartX = 0;
    let touchStartY = 0;

    elemento.addEventListener('touchstart', e => {
        touchStartX = e.changedTouches[0].screenX;
        touchStartY = e.changedTouches[0].screenY;
    }, { passive: true });

    elemento.addEventListener('touchend', e => {
        if (e.target.closest('.btn-area-card') || e.target.closest('.car-btn')) return;
        const touchEndX = e.changedTouches[0].screenX;
        const touchEndY = e.changedTouches[0].screenY;
        if (Math.abs(touchEndX - touchStartX) > 10 || Math.abs(touchEndY - touchStartY) > 10) {
            return;
        }
        if (e.cancelable) e.preventDefault();
        callback();
    });

    elemento.addEventListener('click', e => {
        if (e.target.closest('.btn-area-card') || e.target.closest('.car-btn')) return;
        callback();
    });
}

/* ============================================
   TARJETA DE PRODUCTO
   ============================================ */

function crearTarjetaProducto(producto, tipo) {
    const tarjeta = document.createElement('div');
    tarjeta.className = 'producto-card' + (!producto.enStock ? ' sin-stock' : '');
    tarjeta.dataset.categoria = producto.categoria || '';

    const badge = tipo === 'novedad'
        ? `<div class="producto-badge badge-nuevo">NUEVO</div>`
        : `<div class="producto-badge badge-off">PROMO</div>`;

    const precios = tipo === 'novedad'
        ? `<div class="producto-precios"><span class="precio-unico">${formatearPrecio(producto.precio)}</span></div>`
        : `<div class="producto-precios">
            <span class="precio-original">${formatearPrecio(producto.precioOriginal)}</span>
            <div class="precio-row">
                <span class="precio-descuento">${formatearPrecio(producto.precioDescuento)}</span>
                <span class="descuento-tag">${producto.descuentoPorcentaje}% OFF</span>
            </div>
           </div>`;

    const precioCarrito = tipo === 'novedad' ? producto.precio : producto.precioDescuento;
    const precioTexto = tipo === 'novedad' ? formatearPrecio(producto.precio) : formatearPrecio(producto.precioDescuento);
    const imagenesNorm = normalizarImagenes(producto.imagenes || (producto.imagen ? [producto.imagen] : []), producto.nombre);
    const conVariantes = tieneVariantes(imagenesNorm);
    const { html: carHtml, id: carId } = crearCarrusel(imagenesNorm, producto.nombre);

    const textoBtnPrincipal = !producto.enStock
        ? 'Sin stock'
        : conVariantes
            ? 'Ver opciones →'
            : 'Agregar al carrito';

    tarjeta.innerHTML = `
        <div class="producto-img-container">
            ${carHtml}
            ${badge}
        </div>
        <h3 class="producto-nombre">${producto.nombre}</h3>
        <p class="producto-descripcion">${producto.descripcion || ''}</p>
        ${precios}
        <div class="btn-area-card"></div>`;

    const btnArea = tarjeta.querySelector('.btn-area-card');

    function mostrarBtnPrincipal() {
        btnArea.innerHTML = '';
        const btn = document.createElement('button');
        btn.className = 'btn-agregar-carrito';
        btn.textContent = textoBtnPrincipal;
        if (!producto.enStock) btn.disabled = true;
        btn.addEventListener('click', e => {
            e.stopPropagation();
            if (conVariantes) {
                // Abrir modal para elegir variante
                abrirModalProducto({
                    nombre: producto.nombre,
                    descripcion: producto.descripcion,
                    imagenes: imagenesNorm,
                    precio: precioTexto,
                    enStock: producto.enStock,
                    id: producto.id,
                    precioCarrito,
                    tipo,
                    precioOriginal: tipo === 'promocion' ? producto.precioOriginal : null,
                    descuentoPorcentaje: producto.descuentoPorcentaje || null,
                    idxInicial: 0,
                    conVariantes: true,
                    // Callback para que el modal refresque la card al cerrar
                    onAgregado: () => mostrarBtnPrincipal()
                });
            } else {
                // Sin variantes: agregar directo
                const carritoId = getCarritoId(producto.id, '');
                agregarAlCarrito({
                    id: carritoId,
                    nombre: producto.nombre,
                    precio: precioCarrito,
                    imagen: imagenesNorm[0]?.url || '',
                    tipo
                });
                mostrarContadorEnCard(carritoId);
            }
        });
        btnArea.appendChild(btn);
    }

    function mostrarContadorEnCard(carritoId) {
        btnArea.innerHTML = '';
        const contador = crearBtnContador(carritoId, (nueva) => {
            if (nueva === 0) mostrarBtnPrincipal();
        });
        btnArea.appendChild(contador);
    }

    // Al montar la card, verificar si ya hay algo en el carrito
    // (por si el usuario vuelve a la sección sin recargar)
    if (!conVariantes && producto.enStock) {
        const carritoId = getCarritoId(producto.id, '');
        if (getCantidadEnCarrito(carritoId) > 0) {
            mostrarContadorEnCard(carritoId);
        } else {
            mostrarBtnPrincipal();
        }
        // Registrar callback para resetear la card al vaciar el carrito
        _onCarritoVaciado.push(() => mostrarBtnPrincipal());
    } else {
        mostrarBtnPrincipal();
    }

    // Click / Tap en la tarjeta abre el modal (excepto en botones)
    agregarEventoAbrirModal(tarjeta, () => {
        abrirModalProducto({
            nombre: producto.nombre,
            descripcion: producto.descripcion,
            imagenes: imagenesNorm,
            precio: precioTexto,
            enStock: producto.enStock,
            id: producto.id,
            precioCarrito,
            tipo,
            precioOriginal: tipo === 'promocion' ? producto.precioOriginal : null,
            descuentoPorcentaje: producto.descuentoPorcentaje || null,
            idxInicial: 0,
            conVariantes,
            onAgregado: () => {
                if (!conVariantes) {
                    const carritoId = getCarritoId(producto.id, '');
                    if (getCantidadEnCarrito(carritoId) > 0) mostrarContadorEnCard(carritoId);
                }
            }
        });
    });

    requestAnimationFrame(() => initCarrusel(carId));
    return tarjeta;
}

/* ============================================
   TARJETA DE COMBO
   ============================================ */

function crearTarjetaCombo(combo) {
    const tarjeta = document.createElement('div');
    tarjeta.className = 'producto-card combo-card' + (!combo.enStock ? ' sin-stock' : '');
    tarjeta.dataset.categoria = combo.categoria || '';

    const imagenesNorm = normalizarImagenes(combo.imagenes || (combo.imagen ? [combo.imagen] : []), combo.nombre);
    const conVariantes = tieneVariantes(imagenesNorm);
    const { html: carHtml, id: carId } = crearCarrusel(imagenesNorm, combo.nombre);

    const p1 = combo.producto1 || {};
    const p2 = combo.producto2;
    const precioTachado = (p1.precio || 0) + (p2 ? (p2.precio || 0) : (p1.precio || 0));

    tarjeta.innerHTML = `
        <div class="producto-img-container">
            ${carHtml}
            <div class="producto-badge badge-combo">COMBO</div>
        </div>
        <h3 class="producto-nombre">${combo.nombre}</h3>
        <p class="producto-descripcion">${combo.descripcion || ''}</p>
        <div class="producto-precios">
            ${precioTachado > combo.precio ? `<span class="precio-original">${formatearPrecio(precioTachado)}</span>` : ''}
            <span class="precio-unico">${formatearPrecio(combo.precio)}</span>
        </div>
        <div class="btn-area-card"></div>`;

    const btnArea = tarjeta.querySelector('.btn-area-card');

    function mostrarBtnPrincipal() {
        btnArea.innerHTML = '';
        const btn = document.createElement('button');
        btn.className = 'btn-agregar-carrito';
        btn.textContent = combo.enStock ? 'Ver combo →' : 'Sin stock';
        if (!combo.enStock) btn.disabled = true;
        btn.addEventListener('click', e => {
            e.stopPropagation();
            abrirModalCombo(combo);
        });
        btnArea.appendChild(btn);
    }

    mostrarBtnPrincipal();

    agregarEventoAbrirModal(tarjeta, () => {
        abrirModalCombo(combo);
    });

    requestAnimationFrame(() => initCarrusel(carId));
    return tarjeta;
}

/* ============================================
   MODAL DETALLE PRODUCTO
   ============================================ */

let _modalOnAgregado = null;
let _modalRenderActivo = null;

function abrirModalProducto(p) {
    document.body.classList.add('modal-abierto');

    const hashTipo = p.tipo || 'novedad';
    history.pushState(null, '', `#${hashTipo}-${p.id}`);

    document.getElementById('producto-modal').classList.add('active');
    bloquearScroll();

    const imagenes = p.imagenes || [{ url: '', nombre: p.nombre, esPortada: true }];
    const { html: carHtml, id: carId } = crearCarrusel(imagenes, p.nombre, 'modal-car-img');

    const modalImgWrap = document.getElementById('modal-img-wrap');
    modalImgWrap.innerHTML = carHtml;

    // Lightbox: al tocar la imagen del modal se abre en pantalla completa
    requestAnimationFrame(() => {
        const modalImgs = modalImgWrap.querySelectorAll('img');
        modalImgs.forEach((im, i) => {
            im.style.cursor = 'zoom-in';
            im.addEventListener('click', e => {
                e.stopPropagation();
                const urls = [...modalImgWrap.querySelectorAll('img')].map(x => x.src);
                window._abrirLightbox(urls, i);
            });
        });
    });

    const precioEl = document.getElementById('modal-precio');
    if (p.precioOriginal) {
        precioEl.innerHTML = `
            <span style="text-decoration:line-through;color:#999;font-size:18px;">${formatearPrecio(p.precioOriginal)}</span>
            <span style="color:var(--color-primary);font-size:28px;font-weight:800;margin-left:8px;">${formatearPrecio(p.precioCarrito)}</span>
            <span style="background:#FF6B35;color:white;padding:4px 10px;border-radius:20px;font-size:14px;margin-left:8px;">${p.descuentoPorcentaje}% OFF</span>`;
    } else {
        precioEl.textContent = p.precio;
    }

    document.getElementById('modal-descripcion').textContent = p.descripcion || '';

    const modalInfo = document.querySelector('.producto-modal-info');
    let zonaAccion = document.getElementById('modal-zona-accion');
    if (zonaAccion) zonaAccion.remove();
    zonaAccion = document.createElement('div');
    zonaAccion.id = 'modal-zona-accion';
    modalInfo.appendChild(zonaAccion);

    const btnOriginal = document.getElementById('modal-btn-carrito');
    if (btnOriginal) btnOriginal.style.display = 'none';
    document.getElementById('modal-nombre').textContent = p.nombre;

    let varianteSeleccionada = null;
    let idxActual = p.idxInicial || 0;

    if (p.conVariantes) {
        const variantesWrap = document.createElement('div');
        variantesWrap.className = 'modal-variantes';
        const variantesImagenes = imagenes.slice(1);

        variantesImagenes.forEach((img, i) => {
            const idxReal = i + 1;
            const nombre = typeof img === 'string' ? '' : (img.nombre || '');
            const carritoId = getCarritoId(p.id, nombre);
            const btn = document.createElement('button');
            btn.className = 'btn-variante';
            btn.dataset.carritoId = carritoId;

            function renderBtnVariante() {
                const cant = getCantidadEnCarrito(carritoId);
                if (cant > 0) {
                    btn.innerHTML = `<span class="variante-cant">${cant}</span><span class="variante-nombre">${nombre}</span>`;
                    btn.classList.add('tiene-cantidad');
                } else {
                    btn.innerHTML = `<span class="variante-nombre">${nombre}</span>`;
                    btn.classList.remove('tiene-cantidad');
                }
            }
            renderBtnVariante();

            btn.addEventListener('click', () => {
                varianteSeleccionada = nombre;
                variantesWrap.querySelectorAll('.btn-variante').forEach(b => b.classList.remove('activa'));
                btn.classList.add('activa');
                const carEl = document.getElementById(carId);
                if (carEl && carEl._stopAutoplay) carEl._stopAutoplay();
                if (carEl && carEl._carruselGoTo) carEl._carruselGoTo(idxReal);
                renderAccionModal();
            });

            btn._renderBtnVariante = renderBtnVariante;
            variantesWrap.appendChild(btn);
        });

        zonaAccion.appendChild(variantesWrap);
        const accionWrap = document.createElement('div');
        accionWrap.id = 'modal-accion-wrap';
        zonaAccion.appendChild(accionWrap);

        function renderAccionModal() {
            accionWrap.innerHTML = '';
            variantesWrap.querySelectorAll('.btn-variante').forEach(b => {
                if (b._renderBtnVariante) b._renderBtnVariante();
            });
            if (!varianteSeleccionada) {
                const btn = document.createElement('button');
                btn.className = 'btn-agregar-carrito';
                btn.textContent = 'Elegí una opción';
                btn.disabled = true;
                accionWrap.appendChild(btn);
                return;
            }
            const carritoId = getCarritoId(p.id, varianteSeleccionada);
            const cant = getCantidadEnCarrito(carritoId);
            if (cant > 0) {
                const contador = crearBtnContador(carritoId, () => renderAccionModal());
                accionWrap.appendChild(contador);
            } else {
                const btn = document.createElement('button');
                btn.className = 'btn-agregar-carrito';
                btn.textContent = 'Agregar al carrito';
                btn.addEventListener('click', () => {
                    const imgActual = imagenes.find(img => {
                        const n = typeof img === 'string' ? '' : (img.nombre || '');
                        return n === varianteSeleccionada;
                    });
                    agregarAlCarrito({
                        id: carritoId,
                        nombre: `${p.nombre} — ${varianteSeleccionada}`,
                        precio: p.precioCarrito,
                        imagen: imgActual?.url || '',
                        tipo: p.tipo
                    });
                    const carEl = document.getElementById(carId);
                    if (carEl && carEl._stopAutoplay) carEl._stopAutoplay();
                    if (_modalOnAgregado) _modalOnAgregado();
                    renderAccionModal();
                });
                accionWrap.appendChild(btn);
            }
        }

        _modalRenderActivo = renderAccionModal;
        renderAccionModal();
        requestAnimationFrame(() => {
            initCarrusel(carId, (nuevoIdx) => {
                idxActual = nuevoIdx;
                if (nuevoIdx === 0) return;
                const img = imagenes[nuevoIdx];
                const nombre = typeof img === 'string' ? '' : (img.nombre || '');
                if (nombre) {
                    varianteSeleccionada = nombre;
                    variantesWrap.querySelectorAll('.btn-variante').forEach((b, i) => {
                        b.classList.toggle('activa', i === nuevoIdx - 1);
                    });
                    renderAccionModal();
                }
            });
        });

    } else {
        const carritoId = getCarritoId(p.id, '');

        function renderAccionModalSimple() {
            zonaAccion.innerHTML = '';
            const cant = getCantidadEnCarrito(carritoId);
            if (!p.enStock) {
                const btn = document.createElement('button');
                btn.className = 'btn-agregar-carrito';
                btn.textContent = 'Sin stock';
                btn.disabled = true;
                zonaAccion.appendChild(btn);
            } else if (cant > 0) {
                const contador = crearBtnContador(carritoId, () => renderAccionModalSimple());
                zonaAccion.appendChild(contador);
            } else {
                const btn = document.createElement('button');
                btn.className = 'btn-agregar-carrito';
                btn.textContent = 'Agregar al carrito';
                btn.addEventListener('click', () => {
                    agregarAlCarrito({
                        id: carritoId,
                        nombre: p.nombre,
                        precio: p.precioCarrito,
                        imagen: imagenes[idxActual]?.url || '',
                        tipo: p.tipo
                    });
                    if (_modalOnAgregado) _modalOnAgregado();
                    renderAccionModalSimple();
                });
                zonaAccion.appendChild(btn);
            }
        }

        _modalRenderActivo = renderAccionModalSimple;
        renderAccionModalSimple();
        requestAnimationFrame(() => initCarrusel(carId, (nuevoIdx) => { idxActual = nuevoIdx; }));
    }
}

function abrirModalCombo(combo) {
    document.body.classList.add('modal-abierto');
    history.pushState(null, '', `#combo-${combo.id}`);
    document.getElementById('producto-modal').classList.add('active');
    bloquearScroll();

    const p1 = combo.producto1 || {};
    const p2 = combo.producto2 || null;
    const imagenesPortada = normalizarImagenes(combo.imagenes || (combo.imagen ? [combo.imagen] : []), combo.nombre);

    let todasImagenes = [...imagenesPortada];
    (p1.variantes || []).forEach(v => { if (v.url) todasImagenes.push({ url: v.url, nombre: v.nombre || '', esPortada: false }); });
    if (p2) (p2.variantes || []).forEach(v => { if (v.url) todasImagenes.push({ url: v.url, nombre: v.nombre || '', esPortada: false }); });

    const { html: carHtml, id: carId } = crearCarrusel(todasImagenes, combo.nombre, 'modal-car-img');
    const modalImgWrap = document.getElementById('modal-img-wrap');
    modalImgWrap.innerHTML = carHtml;

    requestAnimationFrame(() => {
        const modalImgs = modalImgWrap.querySelectorAll('img');
        modalImgs.forEach((im, i) => {
            im.style.cursor = 'zoom-in';
            im.addEventListener('click', e => {
                e.stopPropagation();
                const urls = [...modalImgWrap.querySelectorAll('img')].map(x => x.src);
                window._abrirLightbox(urls, i);
            });
        });
        initCarrusel(carId);
    });

    const precioTachado = (p1.precio || 0) + (p2 ? (p2.precio || 0) : (p1.precio || 0));
    const precioEl = document.getElementById('modal-precio');
    if (precioTachado > combo.precio) {
        precioEl.innerHTML = `
            <span style="text-decoration:line-through;color:#999;font-size:18px;">${formatearPrecio(precioTachado)}</span>
            <span style="color:var(--color-primary);font-size:28px;font-weight:800;margin-left:8px;">${formatearPrecio(combo.precio)}</span>`;
    } else {
        precioEl.textContent = formatearPrecio(combo.precio);
    }

    document.getElementById('modal-nombre').textContent = combo.nombre;
    document.getElementById('modal-descripcion').textContent = combo.descripcion || '';

    const btnOriginal = document.getElementById('modal-btn-carrito');
    if (btnOriginal) btnOriginal.style.display = 'none';

    const modalInfo = document.querySelector('.producto-modal-info');
    let zonaAccion = document.getElementById('modal-zona-accion');
    if (zonaAccion) zonaAccion.remove();
    zonaAccion = document.createElement('div');
    zonaAccion.id = 'modal-zona-accion';
    modalInfo.appendChild(zonaAccion);

    const carEl = () => document.getElementById(carId);

    const esCasoA = !p2;
    const p1TieneVariantes = p1.variantes && p1.variantes.length > 1;

    // Estado de cantidades por variante (Caso A)
    // carritoId -> cantidad ya está en carrito global

    function getImgVariante(producto, nombreVariante) {
        if (!nombreVariante || nombreVariante === '__sin_variante__') return producto?.variantes?.[0]?.url || '';
        return (producto?.variantes || []).find(v => v.nombre === nombreVariante)?.url || '';
    }

    function hr() {
        const el = document.createElement('hr');
        el.style.cssText = 'border:none;border-top:2px solid #F0D0DB;margin:16px 0;';
        return el;
    }

    function render() {
        zonaAccion.innerHTML = '';

        if (!combo.enStock) {
            const b = document.createElement('button');
            b.className = 'btn-agregar-carrito';
            b.textContent = 'Sin stock';
            b.disabled = true;
            zonaAccion.appendChild(b);
            return;
        }

        if (esCasoA) {
            const variantes = (p1.variantes && p1.variantes.length > 0) ? p1.variantes : [{ url: '', nombre: '__sin_variante__' }];

            // ID único del ítem agrupado en carrito
            const carritoIdAgrupado = `${combo.id}-agrupado`;

            function getCantidadVariante(nombreVariante) {
                const item = carrito.find(i => i.id === carritoIdAgrupado);
                if (!item || !item.desglose) return 0;
                return item.desglose[nombreVariante] || 0;
            }

            function getTotalUnidades() {
                const item = carrito.find(i => i.id === carritoIdAgrupado);
                if (!item || !item.desglose) return 0;
                return Object.values(item.desglose).reduce((s, v) => s + v, 0);
            }

            function getNombreAgrupado(desglose) {
                const partes = variantes
                    .filter(v => desglose[v.nombre || '__sin_variante__'] > 0)
                    .map(v => {
                        const n = v.nombre || '__sin_variante__';
                        const cant = desglose[n];
                        return cant > 1 ? `${n} x${cant}` : n;
                    });
                return `${p1.nombre}${partes.length ? ' (' + partes.join(' + ') + ')' : ''}`;
            }

            function calcularPrecioTotal(desglose) {
                const total = Object.values(desglose).reduce((s, v) => s + v, 0);
                const pares = Math.floor(total / 2);
                const sueltas = total % 2;
                return pares * combo.precio + sueltas * p1.precio;
            }

            function agregarVariante(v) {
                const nombreVariante = v.nombre || '__sin_variante__';
                let item = carrito.find(i => i.id === carritoIdAgrupado);
                if (!item) {
                    item = {
                        id: carritoIdAgrupado,
                        nombre: '',
                        precio: 0,
                        cantidad: 1,
                        imagen: combo.imagenes?.[0]?.url || combo.imagen || '',
                        tipo: 'combo',
                        desglose: {}
                    };
                    carrito.push(item);
                }
                if (!item.desglose) item.desglose = {};
                item.desglose[nombreVariante] = (item.desglose[nombreVariante] || 0) + 1;
                item.nombre = getNombreAgrupado(item.desglose);
                item.precio = calcularPrecioTotal(item.desglose);
                item.cantidad = 1; // siempre 1, el precio ya incluye todo
                actualizarCarritoUI();
                mostrarConfirmacion('Agregado al carrito');
            }

            function quitarVariante(nombreVariante) {
                const item = carrito.find(i => i.id === carritoIdAgrupado);
                if (!item || !item.desglose) return;
                if (item.desglose[nombreVariante] > 0) item.desglose[nombreVariante]--;
                if (item.desglose[nombreVariante] === 0) delete item.desglose[nombreVariante];
                const total = Object.values(item.desglose).reduce((s, v) => s + v, 0);
                if (total === 0) {
                    carrito = carrito.filter(i => i.id !== carritoIdAgrupado);
                } else {
                    item.nombre = getNombreAgrupado(item.desglose);
                    item.precio = calcularPrecioTotal(item.desglose);
                }
                actualizarCarritoUI();
            }

            // Variante activa para el contador de abajo
            let varianteActiva = variantes.length === 1 ? variantes[0] : null;

            function renderCasoA() {
                zonaAccion.innerHTML = '';

                const total = getTotalUnidades();
                const precioUnitario = p1.precio;

                // Info de precios
                const infoPrecios = document.createElement('div');
                infoPrecios.style.cssText = 'margin-bottom:16px;';
                if (total === 0) {
                    infoPrecios.innerHTML = `
                        <div style="font-size:15px;color:#666;margin-bottom:4px;">
                            <span style="font-weight:700;color:var(--color-primary);">Precio unitario:</span> ${formatearPrecio(precioUnitario)}
                        </div>
                        <div style="font-size:15px;color:#666;">
                            <span style="font-weight:700;color:var(--color-primary);">2 unidades (combo):</span> ${formatearPrecio(combo.precio)}
                        </div>`;
                } else if (total === 1) {
                    infoPrecios.innerHTML = `
                        <div style="font-size:14px;color:#888;background:rgba(239,8,124,0.06);padding:8px 12px;border-radius:8px;">
                            Agregá 1 más para precio combo (${formatearPrecio(combo.precio)})
                        </div>`;
                } else {
                    const pares = Math.floor(total / 2);
                    const sueltas = total % 2;
                    let resumen = '';
                    if (pares > 0) resumen += `${pares * 2} unid. × combo = ${formatearPrecio(combo.precio * pares)}`;
                    if (sueltas > 0) resumen += (pares > 0 ? ' + ' : '') + `1 suelta = ${formatearPrecio(precioUnitario)}`;
                    infoPrecios.innerHTML = `
                        <div style="font-size:14px;background:rgba(239,8,124,0.06);padding:8px 12px;border-radius:8px;color:#555;">${resumen}</div>`;
                }
                zonaAccion.appendChild(infoPrecios);

                // Pills
                if (variantes.length > 1) {
                    const pillsWrap = document.createElement('div');
                    pillsWrap.style.cssText = 'display:flex;flex-wrap:wrap;gap:8px;margin-bottom:16px;';

                    variantes.forEach((v) => {
                        const nombreVariante = v.nombre || '__sin_variante__';
                        const cant = getCantidadVariante(nombreVariante);
                        const esActiva = varianteActiva && varianteActiva.nombre === v.nombre;

                        const pill = document.createElement('button');
                        pill.style.cssText = `
                            display:inline-flex;align-items:center;gap:6px;
                            padding:8px 18px;
                            border:2px solid ${(esActiva || cant > 0) ? 'var(--color-primary)' : '#E8C1D1'};
                            border-radius:32px;font-family:var(--font-family);font-size:15px;font-weight:700;
                            cursor:pointer;transition:all 0.2s;
                            background:${esActiva ? 'rgba(239,8,124,0.08)' : 'white'};
                            color:${(esActiva || cant > 0) ? 'var(--color-primary)' : '#2D2D2D'};`;

                        if (cant > 0) {
                            pill.innerHTML = `
                                <span style="background:var(--color-primary);color:white;border-radius:50%;
                                    width:22px;height:22px;font-size:12px;font-weight:800;
                                    display:flex;align-items:center;justify-content:center;flex-shrink:0;">${cant}</span>
                                <span>${nombreVariante !== '__sin_variante__' ? nombreVariante : p1.nombre}</span>`;
                        } else {
                            pill.textContent = nombreVariante !== '__sin_variante__' ? nombreVariante : p1.nombre;
                        }

                        pill.addEventListener('click', () => {
                            varianteActiva = v;
                            const idxReal = variantes.indexOf(v) + 1;
                            const carEl = document.getElementById(carId);
                            if (carEl?._stopAutoplay) carEl._stopAutoplay();
                            if (carEl?._carruselGoTo) carEl._carruselGoTo(idxReal);
                            renderCasoA();
                        });

                        pillsWrap.appendChild(pill);
                    });

                    zonaAccion.appendChild(pillsWrap);
                }

                // Botón/contador inferior
                if (!varianteActiva && variantes.length > 1) {
                    const btn = document.createElement('button');
                    btn.className = 'btn-agregar-carrito';
                    btn.textContent = 'Elegí una opción';
                    btn.disabled = true;
                    zonaAccion.appendChild(btn);
                } else {
                    const v = varianteActiva || variantes[0];
                    const nombreVariante = v.nombre || '__sin_variante__';
                    const cant = getCantidadVariante(nombreVariante);

                    if (cant === 0) {
                        const btn = document.createElement('button');
                        btn.className = 'btn-agregar-carrito';
                        btn.textContent = 'Agregar al carrito';
                        btn.addEventListener('click', () => {
                            agregarVariante(v);
                            renderCasoA();
                        });
                        zonaAccion.appendChild(btn);
                    } else {
                        // Contador sin nombre
                        const contWrap = document.createElement('div');
                        contWrap.style.cssText = 'display:flex;align-items:center;';
                        const contador = document.createElement('div');
                        contador.style.cssText = 'display:flex;align-items:center;justify-content:space-between;border:2px solid var(--color-primary);border-radius:32px;overflow:hidden;height:44px;width:100%;';
                        contador.innerHTML = `
                            <button class="contador-btn contador-menos" style="width:44px;height:100%;background:transparent;color:var(--color-primary);border:none;font-size:22px;font-weight:700;cursor:pointer;display:flex;align-items:center;justify-content:center;">−</button>
                            <span style="flex:1;text-align:center;font-size:18px;font-weight:800;color:var(--color-primary);">${cant}</span>
                            <button class="contador-btn contador-mas" style="width:44px;height:100%;background:transparent;color:var(--color-primary);border:none;font-size:22px;font-weight:700;cursor:pointer;display:flex;align-items:center;justify-content:center;">+</button>`;

                        contador.querySelector('.contador-menos').addEventListener('click', () => {
                            quitarVariante(nombreVariante);
                            renderCasoA();
                        });
                        contador.querySelector('.contador-mas').addEventListener('click', () => {
                            agregarVariante(v);
                            renderCasoA();
                        });

                        contWrap.appendChild(contador);
                        zonaAccion.appendChild(contWrap);
                    }
                }
            }

            _modalRenderActivo = renderCasoA;
            renderCasoA();

        } else {
            // ============================================================
            // CASO B: dos productos distintos
            // ============================================================

            let varianteP1 = (p1.variantes && p1.variantes.length === 1)
                ? (p1.variantes[0].nombre || '__sin_variante__')
                : null;
            let varianteP2 = (p2.variantes && p2.variantes.length === 1)
                ? (p2.variantes[0].nombre || '__sin_variante__')
                : null;

            // Leer estado previo si ya hay algo seleccionado
            // (Re-render no puede preservar estado de variante sin closure — usamos dataset)
            const prevV1 = zonaAccion.dataset.v1 || varianteP1;
            const prevV2 = zonaAccion.dataset.v2 || varianteP2;
            if (prevV1) varianteP1 = prevV1;
            if (prevV2) varianteP2 = prevV2;

            function getNombreSueltoP1() { return varianteP1 && varianteP1 !== '__sin_variante__' ? `${p1.nombre} — ${varianteP1}` : p1.nombre; }
            function getNombreSueltoP2() { return varianteP2 && varianteP2 !== '__sin_variante__' ? `${p2.nombre} — ${varianteP2}` : p2.nombre; }
            function getIdSueltoP1() { return `${combo.id}-p1${varianteP1 && varianteP1 !== '__sin_variante__' ? '-' + varianteP1 : ''}`; }
            function getIdSueltoP2() { return `${combo.id}-p2${varianteP2 && varianteP2 !== '__sin_variante__' ? '-' + varianteP2 : ''}`; }
            function getIdCombo() {
                const v1 = varianteP1 && varianteP1 !== '__sin_variante__' ? varianteP1 : '';
                const v2 = varianteP2 && varianteP2 !== '__sin_variante__' ? varianteP2 : '';
                return `combo-${combo.id}${v1 ? '-' + v1 : ''}${v2 ? '-' + v2 : ''}`;
            }

            function saveState() {
                zonaAccion.dataset.v1 = varianteP1 || '';
                zonaAccion.dataset.v2 = varianteP2 || '';
            }

            // --- SEPARADOR + PRODUCTO 1 ---
            zonaAccion.appendChild(hr());

            const titP1 = document.createElement('p');
            titP1.style.cssText = 'font-weight:800;color:var(--color-primary);margin-bottom:8px;font-size:16px;';
            titP1.textContent = p1.nombre;
            zonaAccion.appendChild(titP1);

            // Variantes P1
            if (p1.variantes && p1.variantes.length > 1) {
                const varWrap1 = document.createElement('div');
                varWrap1.style.cssText = 'display:flex;flex-wrap:wrap;gap:8px;margin-bottom:8px;';
                p1.variantes.forEach((v, vi) => {
                    const btn = document.createElement('button');
                    btn.className = 'btn-variante' + (varianteP1 === v.nombre ? ' activa' : '');
                    btn.textContent = v.nombre;
                    btn.addEventListener('click', () => {
                        varianteP1 = v.nombre;
                        saveState();
                        const idx = imagenesPortada.length + vi;
                        const cel = carEl();
                        if (cel?._stopAutoplay) cel._stopAutoplay();
                        if (cel?._carruselGoTo) cel._carruselGoTo(idx);
                        render();
                    });
                    varWrap1.appendChild(btn);
                });
                zonaAccion.appendChild(varWrap1);
            }

            // Botón agregar P1 suelto
            const idS1 = getIdSueltoP1();
            const cantS1 = getCantidadEnCarrito(idS1);
            if (cantS1 > 0) {
                const ctr = crearBtnContador(idS1, () => render());
                zonaAccion.appendChild(ctr);
            } else {
                const btn1 = document.createElement('button');
                btn1.className = 'btn-agregar-carrito';
                btn1.style.cssText = 'font-size:14px;padding:10px 12px;margin-bottom:4px;';
                btn1.textContent = `Agregar solo — ${formatearPrecio(p1.precio)}`;
                btn1.addEventListener('click', () => {
                    if (!varianteP1) { mostrarConfirmacion(`Elegí una opción para ${p1.nombre}`); return; }
                    agregarAlCarrito({ id: idS1, nombre: getNombreSueltoP1(), precio: p1.precio, imagen: getImgVariante(p1, varianteP1), tipo: 'combo' });
                    render();
                });
                zonaAccion.appendChild(btn1);
            }

            // --- SEPARADOR + PRODUCTO 2 ---
            zonaAccion.appendChild(hr());

            const titP2 = document.createElement('p');
            titP2.style.cssText = 'font-weight:800;color:var(--color-primary);margin-bottom:8px;font-size:16px;';
            titP2.textContent = p2.nombre;
            zonaAccion.appendChild(titP2);

            // Variantes P2
            const p1VariantesCount = (p1.variantes || []).length;
            if (p2.variantes && p2.variantes.length > 1) {
                const varWrap2 = document.createElement('div');
                varWrap2.style.cssText = 'display:flex;flex-wrap:wrap;gap:8px;margin-bottom:8px;';
                p2.variantes.forEach((v, vi) => {
                    const btn = document.createElement('button');
                    btn.className = 'btn-variante' + (varianteP2 === v.nombre ? ' activa' : '');
                    btn.textContent = v.nombre;
                    btn.addEventListener('click', () => {
                        varianteP2 = v.nombre;
                        saveState();
                        const idx = imagenesPortada.length + p1VariantesCount + vi;
                        const cel = carEl();
                        if (cel?._stopAutoplay) cel._stopAutoplay();
                        if (cel?._carruselGoTo) cel._carruselGoTo(idx);
                        render();
                    });
                    varWrap2.appendChild(btn);
                });
                zonaAccion.appendChild(varWrap2);
            }

            // Botón agregar P2 suelto
            const idS2 = getIdSueltoP2();
            const cantS2 = getCantidadEnCarrito(idS2);
            if (cantS2 > 0) {
                const ctr = crearBtnContador(idS2, () => render());
                zonaAccion.appendChild(ctr);
            } else {
                const btn2 = document.createElement('button');
                btn2.className = 'btn-agregar-carrito';
                btn2.style.cssText = 'font-size:14px;padding:10px 12px;margin-bottom:4px;';
                btn2.textContent = `Agregar solo — ${formatearPrecio(p2.precio)}`;
                btn2.addEventListener('click', () => {
                    if (!varianteP2) { mostrarConfirmacion(`Elegí una opción para ${p2.nombre}`); return; }
                    agregarAlCarrito({ id: idS2, nombre: getNombreSueltoP2(), precio: p2.precio, imagen: getImgVariante(p2, varianteP2), tipo: 'combo' });
                    render();
                });
                zonaAccion.appendChild(btn2);
            }

            // --- SEPARADOR + BOTÓN COMBO ---
            zonaAccion.appendChild(hr());

            const idCombo = getIdCombo();
            const cantCombo = getCantidadEnCarrito(idCombo);

            if (cantCombo > 0) {
                const lblCombo = document.createElement('p');
                lblCombo.style.cssText = 'font-weight:800;color:var(--color-primary);margin-bottom:6px;font-size:15px;';
                lblCombo.textContent = `${combo.nombre} — ${formatearPrecio(combo.precio)}`;
                zonaAccion.appendChild(lblCombo);
                const ctr = crearBtnContador(idCombo, (nueva) => {
                    if (nueva === 0) {
                        if (varianteP1) agregarAlCarrito({ id: idS1, nombre: getNombreSueltoP1(), precio: p1.precio, imagen: getImgVariante(p1, varianteP1), tipo: 'combo' });
                        if (varianteP2) agregarAlCarrito({ id: idS2, nombre: getNombreSueltoP2(), precio: p2.precio, imagen: getImgVariante(p2, varianteP2), tipo: 'combo' });
                    }
                    render();
                });
                zonaAccion.appendChild(ctr);
            } else if (cantS1 > 0 && cantS2 > 0) {
                carrito = carrito.filter(i => i.id !== idS1 && i.id !== idS2);
                const nombreCombo = `${combo.nombre} (${getNombreSueltoP1().split('—')[1]?.trim() || p1.nombre} + ${getNombreSueltoP2().split('—')[1]?.trim() || p2.nombre})`;
                agregarAlCarrito({ id: idCombo, nombre: nombreCombo, precio: combo.precio, imagen: imagenesPortada[0]?.url || '', tipo: 'combo' });
                actualizarCarritoUI();
                render();
            } else {
                const btnCombo = document.createElement('button');
                btnCombo.className = 'btn-agregar-carrito';
                btnCombo.style.background = 'var(--color-success)';
                btnCombo.textContent = `Agregar combo — ${formatearPrecio(combo.precio)}`;
                btnCombo.addEventListener('click', () => {
                    if (!varianteP1) { mostrarConfirmacion(`Elegí una opción para ${p1.nombre}`); return; }
                    if (!varianteP2) { mostrarConfirmacion(`Elegí una opción para ${p2.nombre}`); return; }
                    carrito = carrito.filter(i => i.id !== idS1 && i.id !== idS2);
                    const nombreCombo = `${combo.nombre} (${getNombreSueltoP1().split('—')[1]?.trim() || p1.nombre} + ${getNombreSueltoP2().split('—')[1]?.trim() || p2.nombre})`;
                    agregarAlCarrito({ id: idCombo, nombre: nombreCombo, precio: combo.precio, imagen: imagenesPortada[0]?.url || '', tipo: 'combo' });
                    actualizarCarritoUI();
                    render();
                });
                zonaAccion.appendChild(btnCombo);
            }
        }
    }

    _modalRenderActivo = render;
    render();
}

function cerrarModalProducto() {
    document.body.classList.remove('modal-abierto');
    document.getElementById('producto-modal').classList.remove('active');
    const btnOriginal = document.getElementById('modal-btn-carrito');
    if (btnOriginal) btnOriginal.style.display = '';
    desbloquearScroll();
    _modalOnAgregado = null;
    _modalRenderActivo = null;
    // Limpiar hash de la URL
    history.replaceState(null, '', window.location.pathname);
}

const btnVolver = document.getElementById('btn-volver-modal');
btnVolver.addEventListener('click', (e) => {
    e.stopPropagation();
    cerrarModalProducto();
});
btnVolver.addEventListener('touchend', (e) => {
    e.stopPropagation();
    if (e.cancelable) e.preventDefault();
    cerrarModalProducto();
}, { passive: false });

/* ============================================
   CARGAR PRODUCTOS DESDE FIRESTORE
   ============================================ */

async function cargarProductos() {
    mostrarCargando();
    try {
        // Cargar categorías ordenadas
        const categoriasSnap = await getDocs(collection(db, 'categorias'));
        const categorias = categoriasSnap.docs
            .map(doc => ({ id: doc.id, ...doc.data() }))
            .sort((a, b) => (a.orden ?? 999) - (b.orden ?? 999));

        const novedadesSnap = await getDocs(collection(db, 'novedades'));
        const novedades = novedadesSnap.docs
            .map(doc => ({ id: doc.id, ...doc.data() }))
            .filter(p => p.visible !== false)
            .sort((a, b) => (a.orden ?? 999) - (b.orden ?? 999));
        renderNovedades(novedades, categorias);

        const promocionesSnap = await getDocs(collection(db, 'promociones'));
        const promociones = promocionesSnap.docs
            .map(doc => ({ id: doc.id, ...doc.data() }))
            .filter(p => p.visible !== false)
            .sort((a, b) => (a.orden ?? 999) - (b.orden ?? 999));
        renderPromociones(promociones, categorias);

        const combosSnap = await getDocs(collection(db, 'combos'));
        const combos = combosSnap.docs
            .map(doc => ({ id: doc.id, ...doc.data() }))
            .filter(p => p.visible !== false)
            .sort((a, b) => (a.orden ?? 999) - (b.orden ?? 999));
        renderCombos(combos, categorias);

    } catch (error) {
        console.error('Error cargando productos:', error);
        mostrarErrorCarga();
    }

    const horSnap = await getDoc(doc(db, 'config', 'horarios'));
    if (horSnap.exists()) {
        const h = horSnap.data();
        document.getElementById('hor-display-lv').textContent = h.lunesViernes || '—';
        document.getElementById('hor-display-sab').textContent = h.sabados || '—';
        document.getElementById('hor-display-dom').textContent = h.domingos || '—';
    }
}

function mostrarCargando() {
    const msg = '<p style="text-align:center;color:#666;font-size:18px;padding:40px 0;">Cargando productos...</p>';
    novedadesContainer.innerHTML = msg;
    promocionesContainer.innerHTML = msg;
    combosContainer.innerHTML = msg;
}

function mostrarErrorCarga() {
    const msg = '<p style="text-align:center;color:#999;font-size:18px;padding:40px 0;">No hay productos disponibles en este momento.</p>';
    novedadesContainer.innerHTML = msg;
    promocionesContainer.innerHTML = msg;
    combosContainer.innerHTML = msg;
}

function renderNovedades(novedades, categorias = []) {
    novedadesContainer.innerHTML = '';
    if (novedades.length === 0) {
        novedadesContainer.innerHTML = '<p style="text-align:center;color:#999;font-size:18px;padding:40px 0;">Sin novedades por el momento.</p>';
        return;
    }
    ordenarPorCategoria(novedades, categorias).forEach(p => novedadesContainer.appendChild(crearTarjetaProducto(p, 'novedad')));
}

function renderPromociones(promociones, categorias = []) {
    promocionesContainer.innerHTML = '';
    if (promociones.length === 0) {
        promocionesContainer.innerHTML = '<p style="text-align:center;color:#999;font-size:18px;padding:40px 0;">Sin promociones por el momento.</p>';
        return;
    }
    ordenarPorCategoria(promociones, categorias).forEach(p => promocionesContainer.appendChild(crearTarjetaProducto(p, 'promocion')));
}

function renderCombos(combos, categorias = []) {
    combosContainer.innerHTML = '';
    if (combos.length === 0) {
        combosContainer.innerHTML = '<p style="text-align:center;color:#999;font-size:18px;padding:40px 0;">Sin combos por el momento.</p>';
        return;
    }
    ordenarPorCategoria(combos, categorias).forEach(c => combosContainer.appendChild(crearTarjetaCombo(c)));
}

/* ============================================
   CARRITO
   ============================================ */

function agregarAlCarrito(item) {
    const existente = carrito.find(i => i.id === item.id);
    if (existente) {
        existente.cantidad += 1;
    } else {
        carrito.push({ ...item, cantidad: 1 });
    }
    actualizarCarritoUI();
    mostrarConfirmacion('Agregado al carrito');
}

function actualizarCantidad(id, delta) {
    const item = carrito.find(i => i.id === id);
    if (!item) return;
    item.cantidad += delta;
    if (item.cantidad <= 0) carrito = carrito.filter(i => i.id !== id);
    actualizarCarritoUI();
}

function eliminarDelCarrito(id) {
    carrito = carrito.filter(i => i.id !== id);
    actualizarCarritoUI();
}

function vaciarCarrito() {
    carrito = [];
    actualizarCarritoUI();
    // Resetear todas las tarjetas de productos al estado inicial
    _onCarritoVaciado.forEach(cb => cb());
    mostrarConfirmacion('Carrito vaciado', 'rojo');
}

function actualizarCarritoUI() {
    const total = carrito.reduce((sum, i) => sum + i.precio * i.cantidad, 0);
    const cantidadTotal = carrito.reduce((sum, i) => sum + i.cantidad, 0);
    cartCount.textContent = cantidadTotal;
    const cartCountMobile = document.getElementById('cart-count-mobile');
    if (cartCountMobile) cartCountMobile.textContent = cantidadTotal;
    cartTotalEl.textContent = formatearPrecio(total);
    renderizarCartItems();
    // Si hay un modal abierto, re-renderizar sus botones para reflejar cambios del carrito
    if (_modalRenderActivo) _modalRenderActivo();
}

function renderizarCartItems() {
    if (carrito.length === 0) {
        cartItemsList.innerHTML = '<p class="cart-empty-message">Tu carrito está vacío</p>';
        return;
    }
    cartItemsList.innerHTML = '';
    carrito.forEach(item => {
        const subtotal = item.precio * item.cantidad;
        const el = document.createElement('div');
        el.className = 'cart-item';
        const imgHTML = item.imagen
            ? `<img src="${item.imagen}" alt="${item.nombre}" class="cart-item-img">`
            : '';
        el.innerHTML = `
            <div class="cart-item-top">
                ${imgHTML}
                <div class="cart-item-body">
                    <div class="cart-item-nombre">${item.nombre}</div>
                    <div class="cart-item-controls">
                        <button class="qty-btn qty-minus" data-id="${item.id}">−</button>
                        <span class="qty-cantidad">${item.cantidad}</span>
                        <button class="qty-btn qty-plus" data-id="${item.id}">+</button>
                        <span class="cart-item-subtotal">${formatearPrecio(subtotal)}</span>
                        <button class="cart-item-remove" data-id="${item.id}">×</button>
                    </div>
                </div>
            </div>`;
        el.querySelector('.qty-minus').addEventListener('click', () => actualizarCantidad(item.id, -1));
        el.querySelector('.qty-plus').addEventListener('click', () => actualizarCantidad(item.id, 1));
        el.querySelector('.cart-item-remove').addEventListener('click', () => eliminarDelCarrito(item.id));
        cartItemsList.appendChild(el);
    });
}

/* ============================================
   WHATSAPP
   ============================================ */

function generarMensajeWhatsApp() {
    if (carrito.length === 0) { mostrarConfirmacion('El carrito está vacío'); return; }
    let mensaje = '¡Hola! Quisiera hacer el siguiente pedido:\n\n';
    carrito.forEach(item => {
        const subtotal = item.precio * item.cantidad;
        mensaje += `• ${item.nombre} x${item.cantidad} - ${formatearPrecio(subtotal)}\n`;
    });
    const total = carrito.reduce((sum, i) => sum + i.precio * i.cantidad, 0);
    mensaje += `\nTotal: ${formatearPrecio(total)}\n\n`;
    if (modalidadSeleccionada === 'retiro') {
        mensaje += `Modalidad: Retiro en farmacia 🏪\n\n`;
    } else {
        const direccion = direccionInput.value.trim();
        if (!direccion) { mostrarConfirmacion('Por favor escribí tu dirección'); direccionInput.focus(); return; }
        mensaje += `Modalidad: Envío a domicilio 🚚\nDirección: ${direccion}\n\n`;
    }
    mensaje += `⚠️ Tu pedido está pendiente de confirmación.\nUn integrante de Farmacia Cicala te confirmará\nla disponibilidad antes de realizar el pago.`;
    window.open(`https://wa.me/542494360437?text=${encodeURIComponent(mensaje)}`, '_blank');
}

/* ============================================
   CARRITO UI
   ============================================ */

function abrirCarrito() {
    if (portalAbierto) cerrarPortal();
    // CAMBIO 4: cerrar filtros si están abiertos
    cerrarFiltros();
    cartPanel.classList.add('active');
    cartOverlay.classList.add('active');
    bloquearScroll();
}

function cerrarCarrito() {
    cartPanel.classList.remove('active');
    cartOverlay.classList.remove('active');
    desbloquearScroll();
}

/* ============================================
   NOTIFICACIONES
   ============================================ */

function mostrarConfirmacion(mensaje, color = 'verde') {
    const notif = document.createElement('div');
    notif.className = 'notificacion-toast notificacion-toast--' + color;
    notif.textContent = mensaje;
    document.body.appendChild(notif);
    setTimeout(() => notif.classList.add('visible'), 10);
    setTimeout(() => { notif.classList.remove('visible'); setTimeout(() => notif.remove(), 300); }, 2000);
}

function mostrarModalConfirmacion(mensaje, onAceptar) {
    const existente = document.getElementById('modal-confirmacion-custom');
    if (existente) existente.remove();
    const overlay = document.createElement('div');
    overlay.id = 'modal-confirmacion-custom';
    overlay.className = 'modal-confirmacion-overlay';
    overlay.innerHTML = `
        <div class="modal-confirmacion-box">
            <p class="modal-confirmacion-mensaje">${mensaje}</p>
            <div class="modal-confirmacion-botones">
                <button class="modal-btn-cancelar">Cancelar</button>
                <button class="modal-btn-aceptar">Vaciar</button>
            </div>
        </div>`;
    document.body.appendChild(overlay);
    requestAnimationFrame(() => overlay.classList.add('visible'));
    overlay.querySelector('.modal-btn-aceptar').addEventListener('click', () => {
        overlay.classList.remove('visible');
        setTimeout(() => overlay.remove(), 300);
        onAceptar();
    });
    overlay.querySelector('.modal-btn-cancelar').addEventListener('click', () => {
        overlay.classList.remove('visible');
        setTimeout(() => overlay.remove(), 300);
    });
}

/* ============================================
   DROPDOWNS MOBILE
   ============================================ */

let portalAbierto = null;
let dropdownAbierto = null;
let scrollY_bloqueado = 0;

function bloquearScroll() {
    // Si ya está bloqueado, no hacer nada
    if (document.body.dataset.scrollLocked) return;
    scrollY_bloqueado = window.scrollY;
    document.body.dataset.scrollLocked = '1';
    document.body.style.cssText += `position:fixed;top:-${scrollY_bloqueado}px;left:0;right:0;width:100%;overflow:hidden;`;
}

function desbloquearScroll() {
    if (!document.body.dataset.scrollLocked) return;
    const scrollY = Math.abs(parseInt(document.body.style.top || '0', 10));
    document.body.removeAttribute('data-scroll-locked');
    document.body.style.position = '';
    document.body.style.top = '';
    document.body.style.left = '';
    document.body.style.right = '';
    document.body.style.width = '';
    document.body.style.overflow = '';
    window.scrollTo(0, scrollY);
}

function cerrarPortal() {
    if (portalAbierto) { portalAbierto.remove(); portalAbierto = null; }
    dropdownAbierto = null;
    if (!cartPanel.classList.contains('active')) desbloquearScroll();
}

function abrirPortal(dropdown) {
    bloquearScroll();
    const portal = document.createElement('div');
    portal.innerHTML = dropdown.innerHTML;
    const maxW = Math.min(Math.round(window.innerWidth * 0.92), 360);
    const maxH = Math.round(window.innerHeight * 0.70);
    portal.style.cssText = `
        position:fixed;z-index:9999;top:50%;left:50%;
        transform:translate(-50%,-50%);
        width:${maxW}px;max-height:${maxH}px;overflow-y:auto;
        background:#fff;border-radius:16px;
        border-top:4px solid #EF087C;
        box-shadow:0 12px 40px rgba(0,0,0,0.25);
        padding:24px;box-sizing:border-box;margin:0;`;
    portal.addEventListener('click', e => e.stopPropagation());
    document.body.appendChild(portal);
    portalAbierto = portal;
}

function initDropdownsMobile() {
    document.querySelectorAll('.nav-item').forEach(item => {
        const btn = item.querySelector('.nav-button');
        const dropdown = item.querySelector('.nav-dropdown');
        if (!btn || !dropdown) return;
        btn.addEventListener('click', e => {
            if (window.innerWidth > 768) return;
            e.preventDefault();
            e.stopPropagation();
            if (dropdownAbierto === dropdown) { cerrarPortal(); return; }
            if (portalAbierto) cerrarPortal();
            dropdownAbierto = dropdown;
            abrirPortal(dropdown);
        });
    });
    document.addEventListener('click', () => { if (portalAbierto) cerrarPortal(); });
}

/* ============================================
   NAVEGACIÓN TABS
   ============================================ */

function scrollToSection(sectionId) {
    const section = document.getElementById(sectionId);
    if (!section) return;
    const header = document.querySelector('.header');
    const secondaryNav = document.querySelector('.secondary-nav');
    const headerHeight = header ? header.offsetHeight : 100;
    const secondaryHeight = secondaryNav ? secondaryNav.offsetHeight : 44;
    const extraMargen = window.innerWidth <= 768 ? 16 : 24;
    const offset = headerHeight + secondaryHeight + extraMargen;
    const top = section.getBoundingClientRect().top + window.scrollY - offset;

    // CAMBIO 5: activar bandera para que el scroll listener no oculte la secondary nav
    isScrollingToSection = true;
    secondaryNav.style.transform = 'translateY(0)'; // asegurar que est\u00e9 visible
    clearTimeout(scrollingTimer);
    window.scrollTo({ top, behavior: 'smooth' });
    // Desactivar la bandera despu\u00e9s de que el scroll programm\u00e1tico termina (~1.2s)
    scrollingTimer = setTimeout(() => {
        isScrollingToSection = false;
    }, 1200);
}

/* ============================================
   EVENT LISTENERS
   ============================================ */

cartButton.addEventListener('click', () => cartPanel.classList.contains('active') ? cerrarCarrito() : abrirCarrito());
closeCartBtn.addEventListener('click', cerrarCarrito);
cartOverlay.addEventListener('click', cerrarCarrito);
cartPanel.addEventListener('click', e => e.stopPropagation());
enviarWhatsappBtn.addEventListener('click', generarMensajeWhatsApp);
clearCartBtn.addEventListener('click', () => mostrarModalConfirmacion('¿Querés vaciar el carrito?', vaciarCarrito));

btnRetiro.addEventListener('click', () => {
    modalidadSeleccionada = 'retiro';
    btnRetiro.classList.add('active');
    btnEnvio.classList.remove('active');
    direccionSection.style.display = 'none';
});

btnEnvio.addEventListener('click', () => {
    modalidadSeleccionada = 'envio';
    btnEnvio.classList.add('active');
    btnRetiro.classList.remove('active');
    direccionSection.style.display = 'block';
    direccionInput.focus();
});

navTabs.forEach(tab => {
    tab.addEventListener('click', () => {
        navTabs.forEach(t => t.classList.remove('active'));
        tab.classList.add('active');
        const secondaryNav = document.querySelector('.secondary-nav');
        if (secondaryNav) secondaryNav.style.transform = 'translateY(0)';
        scrollToSection(tab.getAttribute('data-section'));
    });
});

/* ============================================
   FILTROS POR CATEGORÍA (DRAWER)
   ============================================ */

const filtrosDrawer = document.getElementById('filtros-drawer');
const filtrosOverlay = document.getElementById('filtros-overlay');
const closeFiltrosBtn = document.getElementById('close-filtros-btn');
let filtrosCargados = false;

function abrirFiltros() {
    // CAMBIO 4: cerrar carrito si está abierto
    if (cartPanel.classList.contains('active')) cerrarCarrito();
    filtrosDrawer.classList.add('active');
    filtrosOverlay.classList.add('active');
    bloquearScroll();
    if (!filtrosCargados) { cargarFiltros(); filtrosCargados = true; }
}

function cerrarFiltros() {
    filtrosDrawer.classList.remove('active');
    filtrosOverlay.classList.remove('active');
    desbloquearScroll();
}

let _filtroActivoId = null;

async function cargarFiltros() {
    const { getDocs: gd, collection: col } = await import("https://www.gstatic.com/firebasejs/11.9.0/firebase-firestore.js");
    const snap = await gd(col(db, 'categorias'));
    const categorias = snap.docs.map(d => ({ id: d.id, ...d.data() }))
        .sort((a, b) => a.nombre.localeCompare(b.nombre));
    const container = document.getElementById('filtros-container');
    container.innerHTML = '';

    // CAMBIO 4: "Sin filtros" en lugar de "Todos"
    const btnTodos = document.createElement('button');
    btnTodos.textContent = 'Sin filtros';
    btnTodos.className = 'filtro-btn filtro-btn--active';
    btnTodos.addEventListener('click', () => {
        _filtroActivoId = null;
        aplicarFiltro(null);
        actualizarActivoFiltros(btnTodos);
        cerrarFiltros(); // CAMBIO 4: cerrar al aplicar
    });
    container.appendChild(btnTodos);

    categorias.forEach(cat => {
        const btn = document.createElement('button');
        btn.textContent = cat.nombre;
        btn.className = 'filtro-btn';
        btn.addEventListener('click', () => {
            _filtroActivoId = cat.id;
            aplicarFiltro(cat.id);
            actualizarActivoFiltros(btn);
            cerrarFiltros(); // CAMBIO 4: cerrar al aplicar
        });
        container.appendChild(btn);
    });
}

function actualizarActivoFiltros(btnActivo) {
    document.querySelectorAll('#filtros-container .filtro-btn').forEach(b => {
        b.classList.toggle('filtro-btn--active', b === btnActivo);
    });
}

function aplicarFiltro(catId) {
    const modal = document.getElementById('producto-modal');
    if (modal && modal.classList.contains('active')) {
        cerrarModalProducto();
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
    document.querySelectorAll('.producto-card').forEach(card => {
        card.style.display = (!catId || card.dataset.categoria === catId) ? '' : 'none';
    });
}

// CAMBIO 4: listener del botón de filtros — abre/cierra drawer
document.getElementById('filtros-btn').addEventListener('click', () => {
    if (filtrosDrawer.classList.contains('active')) {
        cerrarFiltros();
    } else {
        abrirFiltros();
    }
});
closeFiltrosBtn.addEventListener('click', cerrarFiltros);
filtrosOverlay.addEventListener('click', cerrarFiltros);
filtrosDrawer.addEventListener('click', e => e.stopPropagation());

/* ============================================
   INIT
   ============================================ */

// CAMBIO 5: bandera para no ocultar secondary nav durante scroll programmático
let isScrollingToSection = false;
let scrollingTimer = null;

document.addEventListener('DOMContentLoaded', () => {
    cargarProductos();
    actualizarCarritoUI();
    initDropdownsMobile();

    // CAMBIO 5: scroll al tope sin smooth para que sea instantáneo al cargar
    document.documentElement.style.scrollBehavior = 'auto';
    document.body.style.scrollBehavior = 'auto';
    window.scrollTo(0, 0);
    setTimeout(() => {
        document.documentElement.style.scrollBehavior = '';
        document.body.style.scrollBehavior = '';
    }, 100);

    let lastScroll = 0;
    const secondaryNav = document.querySelector('.secondary-nav');
    window.addEventListener('scroll', () => {
        // CAMBIO 5: no ocultar la barra durante scroll programmático por tabs
        if (isScrollingToSection) return;
        const currentScroll = window.scrollY;
        if (currentScroll > lastScroll && currentScroll > 100) {
            secondaryNav.style.transform = 'translateY(-100%)';
        } else {
            secondaryNav.style.transform = 'translateY(0)';
        }
        lastScroll = currentScroll;
    });

    if (typeof twemoji !== 'undefined') twemoji.parse(document.body);

    // Cerrar modal con botón retroceso del navegador (mobile y PC)
    window.addEventListener('popstate', () => {
        if (document.getElementById('producto-modal').classList.contains('active')) {
            cerrarModalProducto();
        }
    });

    // Cerrar modal con ESC en PC
    document.addEventListener('keydown', e => {
        if (e.key === 'Escape' && document.getElementById('producto-modal').classList.contains('active')) {
            cerrarModalProducto();
        }
    });

    const filtrosBtnMobile = document.getElementById('filtros-btn-mobile');
    const cartBtnMobile = document.getElementById('cart-button-mobile');

    if (filtrosBtnMobile) {
        filtrosBtnMobile.addEventListener('click', () => {
            if (filtrosDrawer.classList.contains('active')) cerrarFiltros();
            else abrirFiltros();
        });
    }

    if (cartBtnMobile) {
        cartBtnMobile.addEventListener('click', () => {
            cartPanel.classList.contains('active') ? cerrarCarrito() : abrirCarrito();
        });
    }


    window.addEventListener('resize', () => {
        if (window.innerWidth > 768 && portalAbierto) cerrarPortal();
    });

    // Abrir modal automáticamente si hay hash en la URL al cargar
    async function abrirModalDesdeHash() {
        const hash = window.location.hash.slice(1); // quita el #
        if (!hash) return;

        const partes = hash.match(/^(novedad|promocion|combo)-(.+)$/);
        if (!partes) return;

        const tipo = partes[1];
        const id = partes[2];
        const coleccion = tipo === 'novedad' ? 'novedades' : tipo === 'promocion' ? 'promociones' : 'combos';

        try {
            const snap = await getDoc(doc(db, coleccion, id));
            if (!snap.exists()) return;
            const p = { id: snap.id, ...snap.data() };

            if (tipo === 'combo') {
                abrirModalCombo(p);
                return;
            }

            const imagenesNorm = normalizarImagenes(p.imagenes || (p.imagen ? [p.imagen] : []), p.nombre);
            const conVariantes = tieneVariantes(imagenesNorm);
            const precioCarrito = tipo === 'promocion' ? p.precioDescuento : p.precio;
            const precioTexto = tipo === 'promocion'
                ? formatearPrecio(p.precioDescuento)
                : formatearPrecio(p.precio);

            abrirModalProducto({
                nombre: p.nombre,
                descripcion: p.descripcion,
                imagenes: imagenesNorm,
                precio: precioTexto,
                enStock: p.enStock,
                id: p.id,
                precioCarrito,
                tipo,
                precioOriginal: tipo === 'promocion' ? p.precioOriginal : null,
                descuentoPorcentaje: p.descuentoPorcentaje || null,
                idxInicial: 0,
                conVariantes,
                onAgregado: () => { }
            });
        } catch (e) {
            console.warn('No se pudo abrir el producto desde el hash:', e);
        }

        // Esperar a que los productos carguen antes de abrir el modal
        setTimeout(abrirModalDesdeHash, 1500);
    }
});

/* ============================================
   ESTILOS DINÁMICOS
   ============================================ */

const estilosDinamicos = document.createElement('style');
estilosDinamicos.innerHTML = `
    .notificacion-toast {
        position:fixed;top:120px;left:50%;
        transform:translateX(-50%) translateY(-10px);
        color:white;padding:14px 28px;border-radius:12px;
        font-size:18px;font-weight:700;
        box-shadow:0 4px 16px rgba(0,0,0,0.2);
        z-index:3000;opacity:0;
        transition:opacity 0.3s ease,transform 0.3s ease;
        pointer-events:none;
    }
    .notificacion-toast.visible { opacity:1; transform:translateX(-50%) translateY(0); }
    .notificacion-toast--verde { background:#25D366; }
    .notificacion-toast--rojo  { background:#CC0000; }
    .cart-badge { background-color:#25D366 !important; }

    /* Botón contador en cards y modal */
    .btn-contador-wrap { width:100%; }
    .btn-contador {
        display:flex;align-items:center;justify-content:space-between;
        border:2px solid var(--color-primary);border-radius:32px;
        overflow:hidden;height:44px;width:100%;
    }
    .contador-btn {
        width:40px;height:100%;
        background:transparent;color:var(--color-primary);
        border:none;font-size:22px;font-weight:700;
        cursor:pointer;display:flex;align-items:center;justify-content:center;
        transition:background 0.2s;flex-shrink:0;
    }
    .contador-btn:hover { background:rgba(239,8,124,0.1); }
    .contador-num {
        flex:1;text-align:center;
        font-size:18px;font-weight:800;color:var(--color-primary);
    }

    /* Variantes en modal */
    .modal-variantes {
        display:flex;flex-wrap:wrap;gap:8px;margin-bottom:12px;
    }
    .btn-variante {
        padding:8px 18px;border:2px solid var(--color-border);
        border-radius:32px;background:white;
        color:var(--color-text);font-family:var(--font-family);
        font-size:15px;font-weight:700;cursor:pointer;
        transition:all 0.2s;
    }
    .btn-variante:hover { border-color:var(--color-primary); }
    .btn-variante.activa {
        border-color:var(--color-primary);
        background:rgba(239,8,124,0.08);
        color:var(--color-primary);
    }

    /* Modal confirmación */
    .modal-confirmacion-overlay {
        position:fixed;inset:0;background:rgba(0,0,0,0.55);
        z-index:10001;display:flex;align-items:center;justify-content:center;
        padding:24px;opacity:0;transition:opacity 0.3s ease;
    }
    @media (min-width: 769px) {
        .modal-confirmacion-overlay {
            background:rgba(0,0,0,0.18);
        }
    }
    .modal-confirmacion-overlay.visible { opacity:1; }
    .modal-confirmacion-box {
        background:#fff;border-radius:20px;padding:40px 32px 32px;
        max-width:380px;width:100%;box-shadow:0 16px 48px rgba(0,0,0,0.25);
        text-align:center;transform:translateY(16px);transition:transform 0.3s ease;
    }
    .modal-confirmacion-overlay.visible .modal-confirmacion-box { transform:translateY(0); }
    .modal-confirmacion-mensaje { font-size:22px;font-weight:800;color:#2D2D2D;margin-bottom:32px;line-height:1.4; }
    .modal-confirmacion-botones { display:flex;gap:12px; }
    .modal-btn-cancelar {
        flex:1;padding:16px;background:#F0F0F0;color:#555;border:none;
        border-radius:12px;font-size:18px;font-weight:700;cursor:pointer;
        font-family:'Nunito',sans-serif;transition:background 0.2s;
    }
    .modal-btn-cancelar:hover { background:#E0E0E0; }
    .modal-btn-aceptar {
        flex:1;padding:16px;background:#CC0000;color:white;border:none;
        border-radius:12px;font-size:18px;font-weight:700;cursor:pointer;
        font-family:'Nunito',sans-serif;transition:background 0.2s;
    }
    .modal-btn-aceptar:hover { background:#AA0000; }

    /* Cart items */
    .cart-item { display:flex;flex-direction:column;gap:6px;padding:10px 0;border-bottom:1px solid #F0D0DB; }
    .cart-item-nombre { font-size:16px;font-weight:700;color:#2D2D2D; }
    .cart-item-controls { display:flex;align-items:center;gap:8px;flex-wrap:wrap; }
    .qty-btn {
        width:36px;height:36px;border:2px solid #EF087C;background:white;
        color:#EF087C;font-size:20px;font-weight:700;border-radius:8px;
        cursor:pointer;display:flex;align-items:center;justify-content:center;transition:background 0.2s;
    }
    .qty-btn:hover { background:#EF087C;color:white; }
    .qty-cantidad { font-size:18px;font-weight:700;min-width:24px;text-align:center; }
    .cart-item-subtotal { font-size:16px;font-weight:700;color:#EF087C;margin-left:auto; }
    .cart-item-remove {
        width:36px;height:36px;border:none;background:#FFE0E0;color:#CC0000;
        font-size:20px;font-weight:700;border-radius:8px;cursor:pointer;
        display:flex;align-items:center;justify-content:center;
    }
    .cart-item-remove:hover { background:#CC0000;color:white; }

    /* Botón de variante con cantidad */
    .btn-variante {
        display: inline-flex;
        align-items: center;
        gap: 6px;
        padding: 8px 18px;
        border: 2px solid var(--color-border);
        border-radius: 32px;
        background: white;
        color: var(--color-text);
        font-family: var(--font-family);
        font-size: 15px;
        font-weight: 700;
        cursor: pointer;
        transition: all 0.2s;
    }
    .btn-variante:hover { border-color: var(--color-primary); }
    .btn-variante.activa {
        border-color: var(--color-primary);
        background: rgba(239,8,124,0.08);
        color: var(--color-primary);
    }
    .btn-variante.tiene-cantidad {
        border-color: var(--color-primary);
        background: rgba(239,8,124,0.05);
    }
    .variante-cant {
        background: var(--color-primary);
        color: white;
        border-radius: 50%;
        width: 22px;
        height: 22px;
        font-size: 12px;
        font-weight: 800;
        display: flex;
        align-items: center;
        justify-content: center;
        flex-shrink: 0;
    }
    .variante-nombre { line-height: 1; }
`;
document.head.appendChild(estilosDinamicos);

/* ============================================
   LIGHTBOX PARA MODAL DE DETALLE
   ============================================ */

(function () {
    // Crear elementos del lightbox
    const overlay = document.createElement('div');
    overlay.id = 'lightbox-overlay';
    overlay.style.cssText = `
    display:none;position:fixed;inset:0;z-index:99999;
    background:rgba(0,0,0,0.92);
    flex-direction:column;align-items:center;justify-content:center;
    touch-action:none;
  `;

    const btnClose = document.createElement('button');
    btnClose.innerHTML = '✕';
    btnClose.style.cssText = `
    position:absolute;top:16px;left:16px;z-index:100001;
    background:rgba(255,255,255,0.15);border:none;color:white;
    width:44px;height:44px;border-radius:50%;font-size:22px;font-weight:700;
    cursor:pointer;display:flex;align-items:center;justify-content:center;
  `;

    const imgEl = document.createElement('img');
    imgEl.style.cssText = `
    max-width:90vw;max-height:85vh;object-fit:contain;
    border-radius:8px;transition:transform 0.2s ease;
    transform-origin:center center;cursor:grab;user-select:none;
  `;

    const btnPrev = document.createElement('button');
    btnPrev.innerHTML = '&#8249;';
    btnPrev.style.cssText = `
    position:absolute;left:12px;top:50%;transform:translateY(-50%);
    background:rgba(255,255,255,0.2);border:none;color:white;
    width:48px;height:48px;border-radius:50%;font-size:36px;font-weight:300;
    cursor:pointer;display:flex;align-items:center;justify-content:center;
    z-index:100001;line-height:1;
  `;

    const btnNext = document.createElement('button');
    btnNext.innerHTML = '&#8250;';
    btnNext.style.cssText = `
    position:absolute;right:12px;top:50%;transform:translateY(-50%);
    background:rgba(255,255,255,0.2);border:none;color:white;
    width:48px;height:48px;border-radius:50%;font-size:36px;font-weight:300;
    cursor:pointer;display:flex;align-items:center;justify-content:center;
    z-index:100001;line-height:1;
  `;

    const dotsWrap = document.createElement('div');
    dotsWrap.style.cssText = `
    position:absolute;bottom:20px;left:50%;transform:translateX(-50%);
    display:flex;gap:8px;
  `;

    overlay.appendChild(btnClose);
    overlay.appendChild(btnPrev);
    overlay.appendChild(imgEl);
    overlay.appendChild(btnNext);
    overlay.appendChild(dotsWrap);
    document.body.appendChild(overlay);

    // Estado
    let imgs = [];
    let idx = 0;
    let scale = 1;
    let lastTouchDist = 0;
    let isDragging = false;
    let dragStart = { x: 0, y: 0 };
    let imgOffset = { x: 0, y: 0 };

    function resetTransform() {
        scale = 1;
        imgOffset = { x: 0, y: 0 };
        imgEl.style.transform = 'translate(0px,0px) scale(1)';
        imgEl.style.cursor = 'grab';
    }

    function applyTransform() {
        imgEl.style.transform = `translate(${imgOffset.x}px,${imgOffset.y}px) scale(${scale})`;
    }

    function goTo(n) {
        idx = (n + imgs.length) % imgs.length;
        imgEl.src = imgs[idx];
        resetTransform();
        updateDots();
        btnPrev.style.display = imgs.length > 1 ? 'flex' : 'none';
        btnNext.style.display = imgs.length > 1 ? 'flex' : 'none';
    }

    function updateDots() {
        dotsWrap.innerHTML = '';
        if (imgs.length <= 1) return;
        imgs.forEach((_, i) => {
            const d = document.createElement('span');
            d.style.cssText = `width:8px;height:8px;border-radius:50%;background:${i === idx ? 'white' : 'rgba(255,255,255,0.4)'};display:inline-block;`;
            d.addEventListener('click', e => { e.stopPropagation(); goTo(i); });
            dotsWrap.appendChild(d);
        });
    }

    function openLightbox(imageList, startIdx) {
        imgs = imageList;
        overlay.style.display = 'flex';
        document.body.style.overflow = 'hidden';
        goTo(startIdx);
    }

    function closeLightbox() {
        overlay.style.display = 'none';
        document.body.style.overflow = '';
        resetTransform();
    }

    // Cerrar
    btnClose.addEventListener('click', e => { e.stopPropagation(); closeLightbox(); });
    overlay.addEventListener('click', e => { if (e.target === overlay) closeLightbox(); });

    // Flechas
    btnPrev.addEventListener('click', e => { e.stopPropagation(); goTo(idx - 1); });
    btnNext.addEventListener('click', e => { e.stopPropagation(); goTo(idx + 1); });

    // Swipe mobile
    let swipeStartX = 0;
    imgEl.addEventListener('touchstart', e => {
        if (e.touches.length === 1) swipeStartX = e.touches[0].clientX;
        if (e.touches.length === 2) {
            lastTouchDist = Math.hypot(
                e.touches[0].clientX - e.touches[1].clientX,
                e.touches[0].clientY - e.touches[1].clientY
            );
        }
    }, { passive: true });

    imgEl.addEventListener('touchmove', e => {
        if (e.touches.length === 2) {
            e.preventDefault();
            const dist = Math.hypot(
                e.touches[0].clientX - e.touches[1].clientX,
                e.touches[0].clientY - e.touches[1].clientY
            );
            scale = Math.min(4, Math.max(1, scale * (dist / lastTouchDist)));
            lastTouchDist = dist;
            imgEl.style.cursor = scale > 1 ? 'move' : 'grab';
            applyTransform();
        }
    }, { passive: false });

    imgEl.addEventListener('touchend', e => {
        if (e.changedTouches.length === 1 && scale === 1) {
            const diff = swipeStartX - e.changedTouches[0].clientX;
            if (Math.abs(diff) > 40) goTo(idx + (diff > 0 ? 1 : -1));
        }
        if (scale < 1.05) resetTransform();
    }, { passive: true });

    // Zoom con rueda del mouse (desktop)
    imgEl.addEventListener('wheel', e => {
        e.preventDefault();
        scale = Math.min(4, Math.max(1, scale - e.deltaY * 0.002));
        imgEl.style.cursor = scale > 1 ? 'move' : 'grab';
        applyTransform();
    }, { passive: false });

    // Drag para mover imagen cuando hay zoom (desktop)
    imgEl.addEventListener('mousedown', e => {
        if (scale <= 1) return;
        isDragging = true;
        dragStart = { x: e.clientX - imgOffset.x, y: e.clientY - imgOffset.y };
        imgEl.style.cursor = 'grabbing';
        e.preventDefault();
    });
    window.addEventListener('mousemove', e => {
        if (!isDragging) return;
        imgOffset = { x: e.clientX - dragStart.x, y: e.clientY - dragStart.y };
        applyTransform();
    });
    window.addEventListener('mouseup', () => {
        isDragging = false;
        imgEl.style.cursor = scale > 1 ? 'move' : 'grab';
    });

    // ESC para cerrar
    document.addEventListener('keydown', e => {
        if (overlay.style.display === 'none') return;
        if (e.key === 'Escape') closeLightbox();
        if (e.key === 'ArrowLeft') goTo(idx - 1);
        if (e.key === 'ArrowRight') goTo(idx + 1);
    });

    // Exponer función global para que abrirModalProducto la use
    window._abrirLightbox = openLightbox;
})();
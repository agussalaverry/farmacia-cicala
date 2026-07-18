/* ============================================
   FARMACIA CICALA - SCRIPT.JS
   Versión con Firebase Firestore
   ============================================ */

/* ============================================
   1. CONFIGURACIÓN DE FIREBASE
   ============================================ */

import { initializeApp } from "https://www.gstatic.com/firebasejs/11.9.0/firebase-app.js";
import { getFirestore, collection, getDocs } from "https://www.gstatic.com/firebasejs/11.9.0/firebase-firestore.js";

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
   2. ESTADO DE LA APLICACION
   ============================================ */

let carrito = [];
let modalidadSeleccionada = 'retiro';

/* ============================================
   3. REFERENCIAS AL DOM
   ============================================ */

const novedadesContainer   = document.getElementById('novedades-container');
const promocionesContainer = document.getElementById('promociones-container');
const combosContainer      = document.getElementById('combos-container');
const cartPanel            = document.getElementById('cart-panel');
const cartOverlay          = document.getElementById('cart-overlay');
const cartItemsList        = document.getElementById('cart-items');
const cartTotalEl          = document.getElementById('cart-total');
const cartButton           = document.getElementById('cart-button');
const cartCount            = document.getElementById('cart-count');
const closeCartBtn         = document.getElementById('close-cart-btn');
const enviarWhatsappBtn    = document.getElementById('enviar-whatsapp-btn');
const clearCartBtn         = document.getElementById('clear-cart-btn');
const btnRetiro            = document.getElementById('btn-retiro');
const btnEnvio             = document.getElementById('btn-envio');
const direccionSection     = document.getElementById('direccion-section');
const direccionInput       = document.getElementById('direccion-input');
const navTabs              = document.querySelectorAll('.nav-tab');

/* ============================================
   4. FORMATEAR PRECIO EN PESOS ARGENTINOS
   ============================================ */

function formatearPrecio(precio) {
    return '$ ' + new Intl.NumberFormat('es-AR', {
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
    }).format(precio);
}

/* ============================================
   5. CARGAR PRODUCTOS DESDE FIRESTORE
   ============================================ */

async function cargarProductos() {
    mostrarCargando();

    try {
        // Cargar novedades
        const novedadesSnap = await getDocs(collection(db, 'novedades'));
        const novedades = novedadesSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        renderNovedades(novedades);

        // Cargar promociones
        const promocionesSnap = await getDocs(collection(db, 'promociones'));
        const promociones = promocionesSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        renderPromociones(promociones);

        // Cargar combos
        const combosSnap = await getDocs(collection(db, 'combos'));
        const combos = combosSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        renderCombos(combos);

    } catch (error) {
        console.error('Error cargando productos:', error);
        mostrarErrorCarga();
    }
}

function mostrarCargando() {
    const mensaje = '<p style="text-align:center;color:#666;font-size:18px;padding:40px 0;">Cargando productos...</p>';
    novedadesContainer.innerHTML = mensaje;
    promocionesContainer.innerHTML = mensaje;
    combosContainer.innerHTML = mensaje;
}

function mostrarErrorCarga() {
    const mensaje = '<p style="text-align:center;color:#999;font-size:18px;padding:40px 0;">No hay productos disponibles en este momento.</p>';
    novedadesContainer.innerHTML = mensaje;
    promocionesContainer.innerHTML = mensaje;
    combosContainer.innerHTML = mensaje;
}

/* ============================================
   6. RENDERIZAR PRODUCTOS
   ============================================ */

function renderNovedades(novedades) {
    novedadesContainer.innerHTML = '';
    if (novedades.length === 0) {
        novedadesContainer.innerHTML = '<p style="text-align:center;color:#999;font-size:18px;padding:40px 0;">Sin novedades por el momento.</p>';
        return;
    }
    novedades.forEach(p => novedadesContainer.appendChild(crearTarjetaProducto(p, 'novedad')));
}

function renderPromociones(promociones) {
    promocionesContainer.innerHTML = '';
    if (promociones.length === 0) {
        promocionesContainer.innerHTML = '<p style="text-align:center;color:#999;font-size:18px;padding:40px 0;">Sin promociones por el momento.</p>';
        return;
    }
    promociones.forEach(p => promocionesContainer.appendChild(crearTarjetaProducto(p, 'promocion')));
}

function renderCombos(combos) {
    combosContainer.innerHTML = '';
    if (combos.length === 0) {
        combosContainer.innerHTML = '<p style="text-align:center;color:#999;font-size:18px;padding:40px 0;">Sin combos por el momento.</p>';
        return;
    }
    combos.forEach(c => combosContainer.appendChild(crearTarjetaCombo(c)));
}

function crearTarjetaProducto(producto, tipo) {
    const tarjeta = document.createElement('div');
    tarjeta.className = 'producto-card' + (!producto.enStock ? ' sin-stock' : '');

    const badge = tipo === 'novedad'
        ? `<div class="producto-badge badge-nuevo">NUEVO</div>`
        : `<div class="producto-badge badge-off">${producto.descuentoPorcentaje}% OFF</div>`;

    const precios = tipo === 'novedad'
        ? `<div class="producto-precios"><span class="precio-unico">${formatearPrecio(producto.precio)}</span></div>`
        : `<div class="producto-precios">
               <span class="precio-original">${formatearPrecio(producto.precioOriginal)}</span>
               <span class="precio-descuento">${formatearPrecio(producto.precioDescuento)}</span>
           </div>`;

    const precioCarrito = tipo === 'novedad' ? producto.precio : producto.precioDescuento;
    const precioTexto = tipo === 'novedad' ? formatearPrecio(producto.precio) : formatearPrecio(producto.precioDescuento);

    tarjeta.innerHTML = `
        <div class="producto-img-container">
            <img src="${producto.imagen}" alt="${producto.nombre}" class="producto-img">
            ${badge}
        </div>
        <h3 class="producto-nombre">${producto.nombre}</h3>
        <p class="producto-descripcion">${producto.descripcion}</p>
        ${precios}
        <button class="btn-agregar-carrito" ${!producto.enStock ? 'disabled' : ''}>
            ${producto.enStock ? 'Agregar al carrito' : 'Sin stock'}
        </button>
    `;

    // Abrir modal al tocar imagen o nombre
    tarjeta.addEventListener('click', (e) => {
    if (e.target.closest('.btn-agregar-carrito')) return;
        abrirModalProducto({
            nombre: producto.nombre,
            descripcion: producto.descripcion,
            imagen: producto.imagen,
            precio: precioTexto,
            enStock: producto.enStock,
            id: producto.id,
            precioCarrito,
            tipo
        });
    });

    if (producto.enStock) {
        tarjeta.querySelector('.btn-agregar-carrito').addEventListener('click', () => {
            agregarAlCarrito({ id: producto.id, nombre: producto.nombre, precio: precioCarrito, imagen: producto.imagen || '', tipo });
        });
    }

    return tarjeta;
}

function crearTarjetaCombo(combo) {
    const tarjeta = document.createElement('div');
    tarjeta.className = 'producto-card combo-card' + (!combo.enStock ? ' sin-stock' : '');

    const sinStockHTML = '';
    const imagenPrincipal = combo.imagen || combo.productos?.[0]?.imagen || '';

    tarjeta.innerHTML = `
        <div class="producto-img-container">
            ${imagenPrincipal ? `<img src="${imagenPrincipal}" alt="${combo.nombre}" class="producto-img">` : ''}
            <div class="producto-badge badge-combo">COMBO</div>
        </div>
        ${sinStockHTML}
        <h3 class="producto-nombre">${combo.nombre}</h3>
        <p class="producto-descripcion">${combo.descripcion || ''}</p>
        <div class="producto-precios">
            <span class="precio-unico">${formatearPrecio(combo.precio)}</span>
        </div>
        <button class="btn-agregar-carrito" ${!combo.enStock ? 'disabled' : ''}>
            ${combo.enStock ? 'Agregar al carrito' : 'Sin stock'}
        </button>
    `;

    if (combo.enStock) {
        tarjeta.querySelector('.btn-agregar-carrito').addEventListener('click', () => {
            agregarAlCarrito({
                id: combo.id,
                nombre: combo.nombre,
                precio: combo.precio,
                imagen: imagenPrincipal || '',
                tipo: 'combo'
            });
        });
    }

    return tarjeta;
}

/* ============================================
   7. LOGICA DEL CARRITO
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
    if (item.cantidad <= 0) {
        carrito = carrito.filter(i => i.id !== id);
    }
    actualizarCarritoUI();
}

function eliminarDelCarrito(id) {
    carrito = carrito.filter(i => i.id !== id);
    actualizarCarritoUI();
}

function vaciarCarrito() {
    carrito = [];
    actualizarCarritoUI();
    mostrarConfirmacion('Carrito vaciado', 'rojo');
}

function actualizarCarritoUI() {
    const total = carrito.reduce((sum, i) => sum + i.precio * i.cantidad, 0);
    const cantidadTotal = carrito.reduce((sum, i) => sum + i.cantidad, 0);

    cartCount.textContent = cantidadTotal;
    cartTotalEl.textContent = formatearPrecio(total);

    renderizarCartItems();
}

function renderizarCartItems() {
    if (carrito.length === 0) {
        cartItemsList.innerHTML = '<p class="cart-empty-message">Tu carrito esta vacio</p>';
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
            </div>
        `;

        el.querySelector('.qty-minus').addEventListener('click', () => actualizarCantidad(item.id, -1));
        el.querySelector('.qty-plus').addEventListener('click', () => actualizarCantidad(item.id, 1));
        el.querySelector('.cart-item-remove').addEventListener('click', () => eliminarDelCarrito(item.id));

        cartItemsList.appendChild(el);
    });
}

/* ============================================
   8. MENSAJE DE WHATSAPP
   ============================================ */

function generarMensajeWhatsApp() {
    if (carrito.length === 0) {
        mostrarConfirmacion('El carrito esta vacio');
        return;
    }

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
        if (!direccion) {
            mostrarConfirmacion('Por favor escribi tu direccion');
            direccionInput.focus();
            return;
        }
        mensaje += `Modalidad: Envio a domicilio 🚚\n`;
        mensaje += `Direccion: ${direccion}\n\n`;
    }

    mensaje += `⚠️ Tu pedido esta pendiente de confirmacion.\n`;
    mensaje += `Un integrante de Farmacia Cicala te confirmara\n`;
    mensaje += `la disponibilidad antes de realizar el pago.`;

    const url = `https://wa.me/542494360437?text=${encodeURIComponent(mensaje)}`;
    window.open(url, '_blank');
}

/* ============================================
   9. ABRIR / CERRAR CARRITO
   ============================================ */

function abrirCarrito() {
    if (portalAbierto) cerrarPortal();
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
   10. NOTIFICACION VISUAL
   ============================================ */

function mostrarConfirmacion(mensaje, color = 'verde') {
    const notif = document.createElement('div');
    notif.className = 'notificacion-toast notificacion-toast--' + color;
    notif.textContent = mensaje;
    document.body.appendChild(notif);

    setTimeout(() => notif.classList.add('visible'), 10);
    setTimeout(() => {
        notif.classList.remove('visible');
        setTimeout(() => notif.remove(), 300);
    }, 2000);
}

function mostrarModalConfirmacion(mensaje, onAceptar) {
    // Evitar duplicados
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
        </div>
    `;

    document.body.appendChild(overlay);
    // Forzar reflow para animación
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
   11. DROPDOWNS EN MOVIL
   ============================================ */

let portalAbierto = null;    // el div portal activo en el body
let dropdownAbierto = null;  // qué dropdown está mostrando el portal
let scrollY_bloqueado = 0;

function bloquearScroll() {
    scrollY_bloqueado = window.scrollY;
    document.body.style.position = 'fixed';
    document.body.style.top = `-${scrollY_bloqueado}px`;
    document.body.style.left = '0';
    document.body.style.right = '0';
}

function desbloquearScroll() {
    document.body.style.position = '';
    document.body.style.top = '';
    document.body.style.left = '';
    document.body.style.right = '';
    window.scrollTo(0, scrollY_bloqueado);
}

function cerrarPortal() {
    if (portalAbierto) {
        portalAbierto.remove();
        portalAbierto = null;
    }
    dropdownAbierto = null;
    if (!cartPanel.classList.contains('active')) {
        desbloquearScroll();
    }
}

function abrirPortal(dropdown) {
    bloquearScroll();

    const portal = document.createElement('div');
    portal.innerHTML = dropdown.innerHTML;

    // Centrado perfecto con CSS puro — no depende de medidas calculadas
    const maxW = Math.min(Math.round(window.innerWidth * 0.92), 360);
    const maxH = Math.round(window.innerHeight * 0.70);

    portal.style.cssText = `
        position: fixed;
        z-index: 9999;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        width: ${maxW}px;
        max-height: ${maxH}px;
        overflow-y: auto;
        background: #ffffff;
        border-radius: 16px;
        border-top: 4px solid #EF087C;
        box-shadow: 0 12px 40px rgba(0,0,0,0.25);
        padding: 24px;
        box-sizing: border-box;
        margin: 0;
    `;

    // Toques dentro del portal no propagan al document → no lo cierran
    portal.addEventListener('click', e => e.stopPropagation());

    document.body.appendChild(portal);
    portalAbierto = portal;
}

function initDropdownsMobile() {
    document.querySelectorAll('.nav-item').forEach(item => {
        const btn = item.querySelector('.nav-button');
        const dropdown = item.querySelector('.nav-dropdown');
        if (!btn || !dropdown) return;

        btn.addEventListener('click', (e) => {
            if (window.innerWidth > 768) return;

            e.preventDefault();
            // stopPropagation: evita que el click llegue al document
            // (que cerraría el portal que acabamos de abrir / queremos cerrar)
            e.stopPropagation();

            if (dropdownAbierto === dropdown) {
                // El mismo botón: cerrar
                cerrarPortal();
                return;
            }

            // Diferente botón o ninguno: cerrar el anterior y abrir el nuevo
            if (portalAbierto) cerrarPortal();
            dropdownAbierto = dropdown;
            abrirPortal(dropdown);
        });
    });

    // Cualquier click fuera del portal lo cierra
    document.addEventListener('click', () => {
        if (portalAbierto) cerrarPortal();
    });
}

/* ============================================
   12. NAVEGACION POR TABS
   ============================================ */

function scrollToSection(sectionId) {
    const section = document.getElementById(sectionId);
    if (!section) return;

    const header = document.querySelector('.header');
    const secondaryNav = document.querySelector('.secondary-nav');
    const headerHeight = header ? header.offsetHeight : 100;
    const secondaryHeight = secondaryNav ? secondaryNav.offsetHeight : 44;
    // En mobile usamos un margen generoso para que el título quede visible
    const extraMargen = window.innerWidth <= 768 ? 24 : 40;
    const offset = headerHeight + secondaryHeight + extraMargen;

    const top = section.getBoundingClientRect().top + window.scrollY - offset;
    window.scrollTo({ top, behavior: 'smooth' });
}

/* ============================================
   13. EVENT LISTENERS
   ============================================ */

cartButton.addEventListener('click', () => {
    cartPanel.classList.contains('active') ? cerrarCarrito() : abrirCarrito();
});
closeCartBtn.addEventListener('click', cerrarCarrito);
cartOverlay.addEventListener('click', cerrarCarrito);
cartPanel.addEventListener('click', e => e.stopPropagation());

enviarWhatsappBtn.addEventListener('click', generarMensajeWhatsApp);
clearCartBtn.addEventListener('click', () => {
    mostrarModalConfirmacion(
        '¿Querés vaciar el carrito?',
        vaciarCarrito
    );
});

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
        scrollToSection(tab.getAttribute('data-section'));
    });
});

/* ============================================
   14. INICIALIZACION
   ============================================ */

document.addEventListener('DOMContentLoaded', () => {
    cargarProductos();
    actualizarCarritoUI();
    initDropdownsMobile();

    window.addEventListener('resize', () => {
        if (window.innerWidth > 768 && portalAbierto) {
            cerrarPortal();
        }
    });

    console.log('Farmacia Cicala - cargada correctamente');
});

/* ============================================
   15. ESTILOS DINAMICOS
   ============================================ */

const estilosDinamicos = document.createElement('style');
estilosDinamicos.innerHTML = `
    /* ---- Toast de notificación ---- */
    .notificacion-toast {
        position: fixed;
        top: 120px;
        left: 50%;
        transform: translateX(-50%) translateY(-10px);
        color: white;
        padding: 14px 28px;
        border-radius: 12px;
        font-size: 18px;
        font-weight: 700;
        box-shadow: 0 4px 16px rgba(0,0,0,0.2);
        z-index: 3000;
        opacity: 0;
        transition: opacity 0.3s ease, transform 0.3s ease;
        pointer-events: none;
    }
    .notificacion-toast.visible {
        opacity: 1;
        transform: translateX(-50%) translateY(0);
    }
    .notificacion-toast--verde { background-color: #25D366; }
    .notificacion-toast--rojo  { background-color: #CC0000; }

    /* ---- Badge del carrito ---- */
    .cart-badge {
        background-color: #25D366 !important;
    }

    /* ---- Imagen de producto en carrito ---- */
    .producto-img-container {
        position: relative;
        width: 100%;
    }
    .producto-badge {
        position: absolute;
        top: 12px;
        right: 12px;
        padding: 6px 12px;
        border-radius: 8px;
        font-size: 14px;
        font-weight: 800;
        color: white;
        z-index: 10;
    }
    .badge-nuevo  { background-color: #2196F3; }
    .badge-off    { background-color: #FF6B35; }
    .badge-combo  { background-color: #25D366; }
    .sin-stock-label {
        background-color: #CCCCCC;
        color: #555;
        text-align: center;
        padding: 6px;
        font-weight: 700;
        font-size: 16px;
        border-radius: 6px;
        margin-bottom: 8px;
    }
    .sin-stock {
        opacity: 0.65;
        filter: grayscale(40%);
    }
    .cart-item {
        display: flex;
        flex-direction: column;
        gap: 6px;
        padding: 10px 0;
        border-bottom: 1px solid #F0D0DB;
    }
    .cart-item-nombre {
        font-size: 16px;
        font-weight: 700;
        color: #2D2D2D;
    }
    .cart-item-controls {
        display: flex;
        align-items: center;
        gap: 8px;
        flex-wrap: wrap;
    }
    .qty-btn {
        width: 36px;
        height: 36px;
        border: 2px solid #EF087C;
        background: white;
        color: #EF087C;
        font-size: 20px;
        font-weight: 700;
        border-radius: 8px;
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        transition: background 0.2s;
    }
    .qty-btn:hover {
        background: #EF087C;
        color: white;
    }
    .qty-cantidad {
        font-size: 18px;
        font-weight: 700;
        min-width: 24px;
        text-align: center;
    }
    .cart-item-subtotal {
        font-size: 16px;
        font-weight: 700;
        color: #EF087C;
        margin-left: auto;
    }
    .cart-item-remove {
        width: 36px;
        height: 36px;
        border: none;
        background: #FFE0E0;
        color: #CC0000;
        font-size: 20px;
        font-weight: 700;
        border-radius: 8px;
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
    }
    .cart-item-remove:hover {
        background: #CC0000;
        color: white;
    }
    .combo-productos-lista {
        display: flex;
        gap: 8px;
        margin-bottom: 12px;
        flex-wrap: wrap;
    }
    .combo-producto-item {
        flex: 1;
        min-width: 80px;
        text-align: center;
    }
    .combo-producto-img {
        width: 100%;
        height: 70px;
        object-fit: cover;
        border-radius: 6px;
        margin-bottom: 4px;
    }
    .combo-producto-nombre {
        font-size: 13px;
        color: #2D2D2D;
        font-weight: 600;
    }
    /* dropdown-mobile-open: manejado en style.css */

    /* ---- Modal de confirmación personalizado ---- */
    .modal-confirmacion-overlay {
        position: fixed;
        inset: 0;
        background: rgba(0, 0, 0, 0.55);
        z-index: 5000;
        display: flex;
        align-items: center;
        justify-content: center;
        padding: 24px;
        opacity: 0;
        transition: opacity 0.3s ease;
    }
    .modal-confirmacion-overlay.visible {
        opacity: 1;
    }
    .modal-confirmacion-box {
        background: #FFFFFF;
        border-radius: 20px;
        padding: 40px 32px 32px;
        max-width: 380px;
        width: 100%;
        box-shadow: 0 16px 48px rgba(0, 0, 0, 0.25);
        text-align: center;
        transform: translateY(16px);
        transition: transform 0.3s ease;
    }
    .modal-confirmacion-overlay.visible .modal-confirmacion-box {
        transform: translateY(0);
    }
    .modal-confirmacion-mensaje {
        font-size: 22px;
        font-weight: 800;
        color: #2D2D2D;
        margin-bottom: 32px;
        line-height: 1.4;
    }
    .modal-confirmacion-botones {
        display: flex;
        gap: 12px;
    }
    .modal-btn-cancelar {
        flex: 1;
        padding: 16px;
        background: #F0F0F0;
        color: #555;
        border: none;
        border-radius: 12px;
        font-size: 18px;
        font-weight: 700;
        cursor: pointer;
        font-family: 'Nunito', sans-serif;
        transition: background 0.2s;
    }
    .modal-btn-cancelar:hover { background: #E0E0E0; }
    .modal-btn-aceptar {
        flex: 1;
        padding: 16px;
        background: #CC0000;
        color: white;
        border: none;
        border-radius: 12px;
        font-size: 18px;
        font-weight: 700;
        cursor: pointer;
        font-family: 'Nunito', sans-serif;
        transition: background 0.2s;
    }
    .modal-btn-aceptar:hover { background: #AA0000; }
`;
document.head.appendChild(estilosDinamicos);

/* ============================================
   MODAL DETALLE PRODUCTO
   ============================================ */

function abrirModalProducto(p) {
    document.getElementById('modal-img').src = p.imagen || '';
    document.getElementById('modal-nombre').textContent = p.nombre;
    document.getElementById('modal-descripcion').textContent = p.descripcion;
    document.getElementById('modal-precio').textContent = p.precio;

    const btnCarrito = document.getElementById('modal-btn-carrito');
    btnCarrito.textContent = p.enStock ? 'Agregar al carrito' : 'Sin stock';
    btnCarrito.disabled = !p.enStock;

    btnCarrito.onclick = () => {
        agregarAlCarrito({ id: p.id, nombre: p.nombre, precio: p.precioCarrito, imagen: p.imagen || '', tipo: p.tipo });
        cerrarModalProducto();
    };

    document.getElementById('producto-modal').classList.add('active');
    bloquearScroll();
}

function cerrarModalProducto() {
    document.getElementById('producto-modal').classList.remove('active');
    desbloquearScroll();
}

document.getElementById('btn-volver-modal').addEventListener('click', cerrarModalProducto);

/* ============================================
   FIN DEL SCRIPT
   ============================================ */

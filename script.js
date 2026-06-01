/* ============================================
   FARMACIA CICALA - SCRIPT.JS
   Funcionalidad de carrito, productos, novedades, combos y WhatsApp
   ============================================ */

/* ============================================
   1. ARRAYS DE PRODUCTOS
   Editar estos arrays para agregar, modificar o eliminar productos.
   ============================================ */

const novedades = [
    {
        id: "N1",
        nombre: "Colageno Hidrolizado",
        descripcion: "Suplemento - Frasco x300g",
        imagen: "images/novedad1.jpg",
        precio: 4200,
        enStock: true
    },
    {
        id: "N2",
        nombre: "Vitamina D3 2000 UI",
        descripcion: "Suplemento vitaminico - Frasco x60 comprimidos",
        imagen: "images/novedad2.jpg",
        precio: 3800,
        enStock: true
    }
];

const promociones = [
    {
        id: "P1",
        nombre: "Vitamina C 500mg",
        descripcion: "Suplemento vitaminico - Frasco x60 comprimidos",
        imagen: "images/producto1.jpg",
        precioOriginal: 5500,
        precioDescuento: 3850,
        descuentoPorcentaje: 30,
        enStock: true
    },
    {
        id: "P2",
        nombre: "Protector Solar FPS 50",
        descripcion: "Proteccion total - Envase 200ml",
        imagen: "images/producto2.jpg",
        precioOriginal: 6200,
        precioDescuento: 4650,
        descuentoPorcentaje: 25,
        enStock: true
    }
];

const combos = [
    {
        id: "C1",
        nombre: "Combo Salud & Bienestar",
        precio: 8500,
        enStock: true,
        productos: [
            { nombre: "Vitamina C 500mg", imagen: "images/producto1.jpg" },
            { nombre: "Complejo B", imagen: "images/producto6.jpg" }
        ]
    },
    {
        id: "C2",
        nombre: "Combo Cuidado de Piel",
        precio: 9200,
        enStock: false,
        productos: [
            { nombre: "Protector Solar FPS 50", imagen: "images/producto2.jpg" },
            { nombre: "Crema Hidratante", imagen: "images/producto4.jpg" }
        ]
    }
];

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
    return new Intl.NumberFormat('es-AR', {
        style: 'currency',
        currency: 'ARS',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
    }).format(precio);
}

/* ============================================
   5. RENDERIZAR PRODUCTOS
   ============================================ */

function renderNovedades() {
    novedadesContainer.innerHTML = '';
    novedades.forEach(p => novedadesContainer.appendChild(crearTarjetaProducto(p, 'novedad')));
}

function renderPromociones() {
    promocionesContainer.innerHTML = '';
    promociones.forEach(p => promocionesContainer.appendChild(crearTarjetaProducto(p, 'promocion')));
}

function renderCombos() {
    combosContainer.innerHTML = '';
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

    const sinStockHTML = !producto.enStock ? `<div class="sin-stock-label">Sin stock</div>` : '';
    const precioCarrito = tipo === 'novedad' ? producto.precio : producto.precioDescuento;

    tarjeta.innerHTML = `
        <div class="producto-img-container">
            <img src="${producto.imagen}" alt="${producto.nombre}" class="producto-img">
            ${badge}
        </div>
        ${sinStockHTML}
        <h3 class="producto-nombre">${producto.nombre}</h3>
        <p class="producto-descripcion">${producto.descripcion}</p>
        ${precios}
        <button class="btn-agregar-carrito" ${!producto.enStock ? 'disabled' : ''}>
            ${producto.enStock ? 'Agregar al carrito' : 'Sin stock'}
        </button>
    `;

    if (producto.enStock) {
        tarjeta.querySelector('.btn-agregar-carrito').addEventListener('click', () => {
            agregarAlCarrito({
                id: producto.id,
                nombre: producto.nombre,
                precio: precioCarrito,
                tipo: tipo
            });
        });
    }

    return tarjeta;
}

function crearTarjetaCombo(combo) {
    const tarjeta = document.createElement('div');
    tarjeta.className = 'producto-card combo-card' + (!combo.enStock ? ' sin-stock' : '');

    const productosHTML = combo.productos.map(p => `
        <div class="combo-producto-item">
            <img src="${p.imagen}" alt="${p.nombre}" class="combo-producto-img">
            <p class="combo-producto-nombre">${p.nombre}</p>
        </div>
    `).join('');

    const sinStockHTML = !combo.enStock ? `<div class="sin-stock-label">Sin stock</div>` : '';

    tarjeta.innerHTML = `
        <div class="producto-img-container">
            <img src="${combo.productos[0]?.imagen || ''}" alt="${combo.nombre}" class="producto-img">
            <div class="producto-badge badge-combo">COMBO</div>
        </div>
        ${sinStockHTML}
        <h3 class="producto-nombre">${combo.nombre}</h3>
        <div class="combo-productos-lista">${productosHTML}</div>
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
                tipo: 'combo'
            });
        });
    }

    return tarjeta;
}

/* ============================================
   6. LOGICA DEL CARRITO
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
    mostrarConfirmacion('Carrito vaciado');
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
        el.innerHTML = `
            <div class="cart-item-nombre">${item.nombre}</div>
            <div class="cart-item-controls">
                <button class="qty-btn qty-minus" data-id="${item.id}">−</button>
                <span class="qty-cantidad">${item.cantidad}</span>
                <button class="qty-btn qty-plus" data-id="${item.id}">+</button>
                <span class="cart-item-subtotal">${formatearPrecio(subtotal)}</span>
                <button class="cart-item-remove" data-id="${item.id}">×</button>
            </div>
        `;

        el.querySelector('.qty-minus').addEventListener('click', () => actualizarCantidad(item.id, -1));
        el.querySelector('.qty-plus').addEventListener('click', () => actualizarCantidad(item.id, 1));
        el.querySelector('.cart-item-remove').addEventListener('click', () => eliminarDelCarrito(item.id));

        cartItemsList.appendChild(el);
    });
}

/* ============================================
   7. MENSAJE DE WHATSAPP
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
   8. ABRIR / CERRAR CARRITO
   ============================================ */

function abrirCarrito() {
    cartPanel.classList.add('active');
    cartOverlay.classList.add('active');
    document.body.style.overflow = 'hidden';
}

function cerrarCarrito() {
    cartPanel.classList.remove('active');
    cartOverlay.classList.remove('active');
    document.body.style.overflow = '';
}

/* ============================================
   9. NOTIFICACION VISUAL
   ============================================ */

function mostrarConfirmacion(mensaje) {
    const notif = document.createElement('div');
    notif.className = 'notificacion-toast';
    notif.textContent = mensaje;
    document.body.appendChild(notif);

    setTimeout(() => notif.classList.add('visible'), 10);
    setTimeout(() => {
        notif.classList.remove('visible');
        setTimeout(() => notif.remove(), 300);
    }, 2000);
}

/* ============================================
   10. DROPDOWNS EN MOVIL (centrados en pantalla)
   ============================================ */

let overlayDropdown = null;
let dropdownAbierto = null;

function initDropdownsMobile() {
    overlayDropdown = document.createElement('div');
    overlayDropdown.className = 'nav-dropdown-overlay';
    document.body.appendChild(overlayDropdown);

    document.querySelectorAll('.nav-item').forEach(item => {
        const btn = item.querySelector('.nav-button');
        const dropdown = item.querySelector('.nav-dropdown');
        if (!btn || !dropdown) return;

        btn.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();

            const isMobile = window.innerWidth <= 768;
            if (!isMobile) return; // en desktop se maneja por CSS hover

            if (dropdownAbierto && dropdownAbierto !== dropdown) {
                cerrarDropdown(dropdownAbierto);
            }

            if (dropdown.classList.contains('dropdown-mobile-open')) {
                cerrarDropdown(dropdown);
            } else {
                abrirDropdown(dropdown);
            }
        });
    });

    overlayDropdown.addEventListener('click', () => {
        if (dropdownAbierto) cerrarDropdown(dropdownAbierto);
    });
}

function abrirDropdown(dropdown) {
    dropdown.classList.add('dropdown-mobile-open');
    overlayDropdown.classList.add('active');
    dropdownAbierto = dropdown;
}

function cerrarDropdown(dropdown) {
    dropdown.classList.remove('dropdown-mobile-open');
    overlayDropdown.classList.remove('active');
    dropdownAbierto = null;
}

/* ============================================
   11. NAVEGACION POR TABS (scroll con offset)
   ============================================ */

function scrollToSection(sectionId) {
    const section = document.getElementById(sectionId);
    if (!section) return;

    const header = document.querySelector('.header');
    const secondaryNav = document.querySelector('.secondary-nav');
    const headerHeight = header ? header.offsetHeight : 100;
    const secondaryHeight = secondaryNav ? secondaryNav.offsetHeight : 44;
    const offset = headerHeight + secondaryHeight + 40;

    const top = section.getBoundingClientRect().top + window.scrollY - offset;
    window.scrollTo({ top, behavior: 'smooth' });
}

/* ============================================
   12. EVENT LISTENERS
   ============================================ */

// Carrito: abrir/cerrar
cartButton.addEventListener('click', () => {
    cartPanel.classList.contains('active') ? cerrarCarrito() : abrirCarrito();
});
closeCartBtn.addEventListener('click', cerrarCarrito);
cartOverlay.addEventListener('click', cerrarCarrito);

// Evitar que click dentro del panel cierre el carrito
cartPanel.addEventListener('click', e => e.stopPropagation());

// WhatsApp y vaciar
enviarWhatsappBtn.addEventListener('click', generarMensajeWhatsApp);
clearCartBtn.addEventListener('click', () => {
    if (confirm('¿Estas seguro de que deseas vaciar el carrito?')) vaciarCarrito();
});

// Modalidad retiro / envio
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

// Tabs de navegacion
navTabs.forEach(tab => {
    tab.addEventListener('click', () => {
        navTabs.forEach(t => t.classList.remove('active'));
        tab.classList.add('active');
        scrollToSection(tab.getAttribute('data-section'));
    });
});

/* ============================================
   13. INICIALIZACION
   ============================================ */

document.addEventListener('DOMContentLoaded', () => {
    renderNovedades();
    renderPromociones();
    renderCombos();
    actualizarCarritoUI();
    initDropdownsMobile();

    // Recalcular dropdown mobile al rotar pantalla
    window.addEventListener('resize', () => {
        if (window.innerWidth > 768 && dropdownAbierto) {
            cerrarDropdown(dropdownAbierto);
        }
    });

    console.log('Farmacia Cicala - cargada correctamente');
});

/* ============================================
   14. ESTILOS DINAMICOS (animaciones y badges)
   ============================================ */

const estilosDinamicos = document.createElement('style');
estilosDinamicos.innerHTML = `
    /* Notificacion toast */
    .notificacion-toast {
        position: fixed;
        top: 120px;
        left: 50%;
        transform: translateX(-50%) translateY(-10px);
        background-color: #25D366;
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

    /* Badges de productos */
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
    .badge-combo  { background-color: #9C27B0; }

    /* Sin stock */
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

    /* Items del carrito con controles de cantidad a la derecha */
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
        border: 2px solid #D5006D;
        background: white;
        color: #D5006D;
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
        background: #D5006D;
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
        color: #D5006D;
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

    /* Combos */
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

    /* Dropdown mobile centrado */
    .nav-dropdown.dropdown-mobile-open {
        display: block !important;
        position: fixed !important;
        top: 50% !important;
        left: 50% !important;
        transform: translate(-50%, -50%) !important;
        z-index: 2001 !important;
        opacity: 1 !important;
        visibility: visible !important;
        max-width: 92vw;
        max-height: 85vh;
        overflow-y: auto;
    }
`;
document.head.appendChild(estilosDinamicos);

/* ============================================
   FIN DEL SCRIPT
   ============================================ */

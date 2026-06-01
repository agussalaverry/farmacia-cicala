/* ============================================
   FARMACIA CICALA - SCRIPT.JS
   Funcionalidad de carrito, ofertas, novedades y combos
   ============================================ */

/* ============================================
   1. ARRAYS DE PRODUCTOS
   ============================================ */

const novedades = [
    {
        id: "N1",
        nombre: "Colágeno Hidrolizado",
        descripcion: "Suplemento - Frasco x300g",
        imagen: "images/novedad1.jpg",
        precio: 4200,
        enStock: true
    },
    {
        id: "N2",
        nombre: "Vitamina D3 2000 UI",
        descripcion: "Suplemento vitamínico - Frasco x60 comprimidos",
        imagen: "images/novedad2.jpg",
        precio: 3800,
        enStock: true
    }
];

const promociones = [
    {
        id: "P1",
        nombre: "Vitamina C 500mg",
        descripcion: "Suplemento vitamínico - Frasco x60 comprimidos",
        imagen: "images/producto1.jpg",
        precioOriginal: 5500,
        precioDescuento: 3850,
        descuentoPorcentaje: 30,
        enStock: true
    },
    {
        id: "P2",
        nombre: "Protector Solar FPS 50",
        descripcion: "Protección total - Envase 200ml",
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
            {
                nombre: "Vitamina C 500mg",
                imagen: "images/producto1.jpg"
            },
            {
                nombre: "Complejo B",
                imagen: "images/producto6.jpg"
            }
        ]
    },
    {
        id: "C2",
        nombre: "Combo Cuidado de Piel",
        precio: 9200,
        enStock: false,
        productos: [
            {
                nombre: "Protector Solar FPS 50",
                imagen: "images/producto2.jpg"
            },
            {
                nombre: "Crema Hidratante",
                imagen: "images/producto4.jpg"
            }
        ]
    }
];

/* ============================================
   2. ESTADO DEL CARRITO (se guarda en memoria)
   ============================================ */

let carrito = [];
let modalidadSeleccionada = 'retiro'; // 'retiro' o 'envio'
let direccionEnvio = '';

/* ============================================
   3. REFERENCIAS A ELEMENTOS DEL DOM
   ============================================ */

// Contenedores principales
const novedadesContainer = document.getElementById('novedades-container');
const promocionesContainer = document.getElementById('promociones-container');
const combosContainer = document.getElementById('combos-container');
const cartPanel = document.getElementById('cart-panel');
const cartOverlay = document.getElementById('cart-overlay');
const cartItemsList = document.getElementById('cart-items');
const cartTotal = document.getElementById('cart-total');

// Botones flotantes
const cartButton = document.getElementById('cart-button');
const cartCount = document.getElementById('cart-count');
const closeCartBtn = document.getElementById('close-cart-btn');

// Botones de acción del carrito
const enviarWhatsappBtn = document.getElementById('enviar-whatsapp-btn');
const clearCartBtn = document.getElementById('clear-cart-btn');

// Modalidad
const btnRetiro = document.getElementById('btn-retiro');
const btnEnvio = document.getElementById('btn-envio');
const direccionSection = document.getElementById('direccion-section');
const direccionInput = document.getElementById('direccion-input');

// Tabs de navegación
const navTabs = document.querySelectorAll('.nav-tab');

/* ============================================
   4. FUNCIÓN: FORMATEAR PRECIO EN PESOS
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
   5. FUNCIONES: RENDERIZAR PRODUCTOS
   ============================================ */

function renderNovedades() {
    novedadesContainer.innerHTML = '';
    
    novedades.forEach(producto => {
        const tarjeta = crearTarjetaProducto(producto, 'novedad');
        novedadesContainer.appendChild(tarjeta);
    });
}

function renderPromociones() {
    promocionesContainer.innerHTML = '';
    
    promociones.forEach(producto => {
        const tarjeta = crearTarjetaProducto(producto, 'promocion');
        promocionesContainer.appendChild(tarjeta);
    });
}

function renderCombos() {
    combosContainer.innerHTML = '';
    
    combos.forEach(combo => {
        const tarjeta = crearTarjetaCombo(combo);
        combosContainer.appendChild(tarjeta);
    });
}

function crearTarjetaProducto(producto, tipo) {
    const tarjeta = document.createElement('div');
    tarjeta.className = 'producto-card';
    if (!producto.enStock) {
        tarjeta.classList.add('sin-stock');
    }
    
    let badgeHTML = '';
    let precioHTML = '';
    
    if (tipo === 'novedad') {
        badgeHTML = `<div class="producto-badge">NUEVO</div>`;
        precioHTML = `<div class="producto-precios">
                        <span class="precio-unico">${formatearPrecio(producto.precio)}</span>
                      </div>`;
    } else if (tipo === 'promocion') {
        badgeHTML = `<div class="producto-badge">${producto.descuentoPorcentaje}% OFF</div>`;
        precioHTML = `<div class="producto-precios">
                        <span class="precio-original">${formatearPrecio(producto.precioOriginal)}</span>
                        <span class="precio-descuento">${formatearPrecio(producto.precioDescuento)}</span>
                      </div>`;
    }
    
    const precioFinal = tipo === 'novedad' ? producto.precio : producto.precioDescuento;
    
    tarjeta.innerHTML = `
        <img src="${producto.imagen}" alt="${producto.nombre}" class="producto-img">
        ${badgeHTML}
        <h3 class="producto-nombre">${producto.nombre}</h3>
        <p class="producto-descripcion">${producto.descripcion}</p>
        ${precioHTML}
        <button class="btn-agregar-carrito" data-id="${producto.id}" data-tipo="${tipo}" 
                ${producto.enStock ? '' : 'disabled'}>
            Agregar al carrito
        </button>
    `;
    
    const btnAgregar = tarjeta.querySelector('.btn-agregar-carrito');
    btnAgregar.addEventListener('click', () => {
        if (tipo === 'novedad') {
            agregarAlCarrito({ ...producto, tipo: 'novedad', precioCarrito: producto.precio });
        } else if (tipo === 'promocion') {
            agregarAlCarrito({ ...producto, tipo: 'promocion', precioCarrito: producto.precioDescuento });
        }
    });
    
    return tarjeta;
}

function crearTarjetaCombo(combo) {
    const tarjeta = document.createElement('div');
    tarjeta.className = 'producto-card';
    if (!combo.enStock) {
        tarjeta.classList.add('sin-stock');
    }
    
    let productosHTML = combo.productos.map(prod => `
        <div style="margin-bottom: 8px;">
            <img src="${prod.imagen}" alt="${prod.nombre}" style="width: 100%; height: 80px; object-fit: cover; border-radius: 6px; margin-bottom: 4px;">
            <p style="font-size: 14px; color: var(--color-text); margin: 0;">${prod.nombre}</p>
        </div>
    `).join('');
    
    tarjeta.innerHTML = `
        <div style="position: relative;">
            ${combo.productos[0] ? `<img src="${combo.productos[0].imagen}" alt="${combo.nombre}" class="producto-img">` : ''}
            <div class="producto-badge">COMBO</div>
        </div>
        <h3 class="producto-nombre">${combo.nombre}</h3>
        <div style="margin-bottom: var(--spacing-md);">
            ${productosHTML}
        </div>
        <div class="producto-precios">
            <span class="precio-unico">${formatearPrecio(combo.precio)}</span>
        </div>
        <button class="btn-agregar-carrito" data-id="${combo.id}" data-tipo="combo" 
                ${combo.enStock ? '' : 'disabled'}>
            Agregar al carrito
        </button>
    `;
    
    const btnAgregar = tarjeta.querySelector('.btn-agregar-carrito');
    btnAgregar.addEventListener('click', () => {
        agregarAlCarrito({ ...combo, tipo: 'combo', precioCarrito: combo.precio });
    });
    
    return tarjeta;
}

/* ============================================
   6. FUNCIÓN: AGREGAR PRODUCTO AL CARRITO
   ============================================ */

function agregarAlCarrito(producto) {
    // Buscar si el producto ya está en el carrito
    const itemExistente = carrito.find(item => item.id === producto.id);

    if (itemExistente) {
        // Si existe, aumentar la cantidad
        itemExistente.cantidad += 1;
    } else {
        // Si no existe, agregar nuevo item
        carrito.push({
            id: producto.id,
            nombre: producto.nombre,
            precio: producto.precioCarrito || producto.precio,
            cantidad: 1,
            tipo: producto.tipo
        });
    }

    // Actualizar UI
    actualizarCarritoUI();

    // Mostrar confirmación visual
    mostrarConfirmacion('¡Agregado al carrito!');
}

/* ============================================
   7. FUNCIÓN: MOSTRAR CONFIRMACIÓN VISUAL
   ============================================ */

function mostrarConfirmacion(mensaje) {
    // Crear elemento de notificación
    const notificacion = document.createElement('div');
    notificacion.className = 'notificacion';
    notificacion.textContent = mensaje;
    notificacion.style.cssText = `
        position: fixed;
        top: 120px;
        left: 50%;
        transform: translateX(-50%);
        background-color: #25D366;
        color: white;
        padding: 16px 24px;
        border-radius: 8px;
        font-size: 18px;
        font-weight: 700;
        box-shadow: 0 4px 16px rgba(0, 0, 0, 0.15);
        z-index: 2000;
        animation: slideDown 0.3s ease;
    `;

    document.body.appendChild(notificacion);

    // Remover después de 2 segundos
    setTimeout(() => {
        notificacion.style.animation = 'slideUp 0.3s ease';
        setTimeout(() => notificacion.remove(), 300);
    }, 2000);
}

/* ============================================
   8. FUNCIÓN: ACTUALIZAR UI DEL CARRITO
   ============================================ */

function actualizarCarritoUI() {
    // Actualizar contador de items
    const cantidadTotal = carrito.reduce((sum, item) => sum + item.cantidad, 0);
    cartCount.textContent = cantidadTotal;

    // Renderizar lista de items
    renderizarCartItems();

    // Calcular y mostrar total
    calcularTotal();
}

/* ============================================
   9. FUNCIÓN: RENDERIZAR ITEMS DEL CARRITO
   ============================================ */

function renderizarCartItems() {
    cartItemsList.innerHTML = '';

    if (carrito.length === 0) {
        cartItemsList.innerHTML = '<p class="cart-empty-message">Tu carrito está vacío</p>';
        return;
    }

    carrito.forEach(item => {
        const subtotal = item.precio * item.cantidad;

        const itemElement = document.createElement('div');
        itemElement.className = 'cart-item';
        itemElement.innerHTML = `
            <div class="cart-item-info">
                <div class="cart-item-name">${item.nombre}</div>
                <div class="cart-item-price">${formatearPrecio(subtotal)}</div>
                <div class="quantity-controls">
                    <button class="btn-quantity btn-minus" data-id="${item.id}">−</button>
                    <span class="quantity-display">${item.cantidad}</span>
                    <button class="btn-quantity btn-plus" data-id="${item.id}">+</button>
                </div>
            </div>
            <button class="cart-item-remove" data-id="${item.id}" title="Eliminar producto">×</button>
        `;

        // Evento para aumentar cantidad
        const btnPlus = itemElement.querySelector('.btn-plus');
        btnPlus.addEventListener('click', () => actualizarCantidad(item.id, 1));

        // Evento para disminuir cantidad
        const btnMinus = itemElement.querySelector('.btn-minus');
        btnMinus.addEventListener('click', () => actualizarCantidad(item.id, -1));

        // Evento para eliminar
        const btnRemove = itemElement.querySelector('.cart-item-remove');
        btnRemove.addEventListener('click', () => eliminarDelCarrito(item.id));

        cartItemsList.appendChild(itemElement);
    });
}

/* ============================================
   10. FUNCIÓN: ACTUALIZAR CANTIDAD DE PRODUCTO EN CARRITO
   ============================================ */

function actualizarCantidad(productoId, delta) {
    const item = carrito.find(i => i.id === productoId);
    
    if (item) {
        item.cantidad += delta;
        
        // Si la cantidad llega a 0, eliminar del carrito
        if (item.cantidad <= 0) {
            eliminarDelCarrito(productoId);
        } else {
            actualizarCarritoUI();
        }
    }
}

/* ============================================
   11. FUNCIÓN: CALCULAR TOTAL DEL CARRITO
   ============================================ */

function calcularTotal() {
    const total = carrito.reduce((sum, item) => {
        return sum + (item.precio * item.cantidad);
    }, 0);

    cartTotal.textContent = formatearPrecio(total);
}

/* ============================================
   11. FUNCIÓN: ELIMINAR PRODUCTO DEL CARRITO
   ============================================ */

function eliminarDelCarrito(productoId) {
    carrito = carrito.filter(item => item.id !== productoId);
    actualizarCarritoUI();
    mostrarConfirmacion('Producto eliminado del carrito');
}

/* ============================================
   12. FUNCIÓN: VACIAR CARRITO
   ============================================ */

function vaciarCarrito() {
    carrito = [];
    actualizarCarritoUI();
    mostrarConfirmacion('Carrito vaciado');
}

/* ============================================
   13. FUNCIÓN: GENERAR MENSAJE WHATSAPP
   ============================================ */

function generarMensajeWhatsApp() {
    if (carrito.length === 0) {
        mostrarConfirmacion('El carrito está vacío');
        return;
    }

    // Validar que si elige envío, tenga dirección
    if (modalidadSeleccionada === 'envio' && !direccionInput.value.trim()) {
        mostrarConfirmacion('Por favor, escribí tu dirección');
        return;
    }

    let mensaje = '¡Hola! Quisiera hacer el siguiente pedido:\n\n';

    // Agregar cada producto
    carrito.forEach(item => {
        const subtotal = item.precio * item.cantidad;
        mensaje += `• ${item.nombre} x${item.cantidad} - ${formatearPrecio(subtotal)}\n`;
    });

    // Calcular total
    const total = carrito.reduce((sum, item) => {
        return sum + (item.precio * item.cantidad);
    }, 0);

    mensaje += `\nTotal: ${formatearPrecio(total)}\n\n`;

    // Agregar modalidad
    if (modalidadSeleccionada === 'retiro') {
        mensaje += `Modalidad: Retiro en farmacia 🏪\n\n`;
    } else {
        mensaje += `Modalidad: Envío a domicilio 🚚\n`;
        mensaje += `Dirección: ${direccionInput.value.trim()}\n\n`;
    }

    // Agregar aclaración
    mensaje += `⚠️ Tu pedido está pendiente de confirmación.\n`;
    mensaje += `Un integrante de Farmacia Cicala te confirmará\n`;
    mensaje += `la disponibilidad antes de realizar el pago.`;

    // Codificar mensaje para URL
    const mensajeEncodificado = encodeURIComponent(mensaje);

    // Abrir WhatsApp
    const urlWhatsapp = `https://wa.me/542494360437?text=${mensajeEncodificado}`;
    window.open(urlWhatsapp, '_blank');
}

/* ============================================
   14. FUNCIÓN: ABRIR/CERRAR PANEL CARRITO
   ============================================ */

function abrirCarrito() {
    cartPanel.classList.add('active');
    cartOverlay.classList.add('active');
}

function cerrarCarrito() {
    cartPanel.classList.remove('active');
    cartOverlay.classList.remove('active');
}

/* ============================================
   15. EVENT LISTENERS
   ============================================ */

// Botón flotante del carrito
cartButton.addEventListener('click', () => {
    if (cartPanel.classList.contains('active')) {
        cerrarCarrito();
    } else {
        abrirCarrito();
    }
});

// Botón de cerrar carrito
closeCartBtn.addEventListener('click', cerrarCarrito);

// Click en el overlay cierra el carrito
cartOverlay.addEventListener('click', cerrarCarrito);

// Botón enviar por WhatsApp
enviarWhatsappBtn.addEventListener('click', generarMensajeWhatsApp);

// Botón vaciar carrito
clearCartBtn.addEventListener('click', () => {
    if (confirm('¿Estás seguro de que deseas vaciar el carrito?')) {
        vaciarCarrito();
    }
});

// Prevenir que el overlay cierre el carrito si se hace clic dentro del panel
cartPanel.addEventListener('click', (event) => {
    event.stopPropagation();
});

// Selector de modalidad (Retiro vs Envío)
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

// Actualizar dirección mientras se escribe
direccionInput.addEventListener('input', (e) => {
    direccionEnvio = e.target.value;
});

// Navegación por tabs
navTabs.forEach(tab => {
    tab.addEventListener('click', () => {
        const section = tab.getAttribute('data-section');
        
        // Actualizar tabs activos
        navTabs.forEach(t => t.classList.remove('active'));
        tab.classList.add('active');
        
        // Scroll suave a la sección
        const targetSection = document.getElementById(section);
        if (targetSection) {
            targetSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
    });
});

/* ============================================
   16. INICIALIZACIÓN
   ============================================ */

document.addEventListener('DOMContentLoaded', () => {
    // Renderizar todas las secciones
    renderNovedades();
    renderPromociones();
    renderCombos();

    // Inicializar carrito vacío
    actualizarCarritoUI();

    // Establecer la primera tab como activa
    navTabs[0].classList.add('active');

    console.log('✅ Farmacia Cicala - Página cargada correctamente');
});

/* ============================================
   17. ANIMACIONES CSS (inyectadas con JavaScript)
   ============================================ */

// Crear estilos para las animaciones de confirmación
const style = document.createElement('style');
style.innerHTML = `
    @keyframes slideDown {
        from {
            opacity: 0;
            transform: translateX(-50%) translateY(-20px);
        }
        to {
            opacity: 1;
            transform: translateX(-50%) translateY(0);
        }
    }

    @keyframes slideUp {
        from {
            opacity: 1;
            transform: translateX(-50%) translateY(0);
        }
        to {
            opacity: 0;
            transform: translateX(-50%) translateY(-20px);
        }
    }

    .producto-badge {
        position: absolute;
        top: 16px;
        right: 16px;
        background-color: #FF6B35;
        color: white;
        padding: 8px 12px;
        border-radius: 8px;
        font-size: 14px;
        font-weight: 700;
        z-index: 10;
    }
`;

document.head.appendChild(style);

/* ============================================
   FIN DEL SCRIPT
   ============================================ */

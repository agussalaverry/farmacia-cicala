/* ============================================
   FARMACIA CICALA - SCRIPT.JS
   Funcionalidad de carrito, ofertas y WhatsApp
   ============================================ */

/* ============================================
   1. ARRAY DE PRODUCTOS
   ============================================ */

const productos = [
    {
        id: 1,
        nombre: "Vitamina C 500mg",
        descripcion: "Suplemento vitamínico - Frasco x60 comprimidos",
        imagen: "images/producto1.jpg",
        precioOriginal: 5500,
        precioDescuento: 3850,
        descuentoPorcentaje: 30
    },
    {
        id: 2,
        nombre: "Protector Solar FPS 50",
        descripcion: "Protección total - Envase 200ml",
        imagen: "images/producto2.jpg",
        precioOriginal: 6200,
        precioDescuento: 4650,
        descuentoPorcentaje: 25
    },
    {
        id: 3,
        nombre: "Ibuprofeno 400mg",
        descripcion: "Antiinflamatorio - Caja x10 comprimidos",
        imagen: "images/producto3.jpg",
        precioOriginal: 2800,
        precioDescuento: 1960,
        descuentoPorcentaje: 30
    },
    {
        id: 4,
        nombre: "Crema Hidratante",
        descripcion: "Perfumería - Tarro 50ml",
        imagen: "images/producto4.jpg",
        precioOriginal: 4500,
        precioDescuento: 3150,
        descuentoPorcentaje: 30
    },
    {
        id: 5,
        nombre: "Té de Jengibre y Miel",
        descripcion: "Herboristería - Caja x20 bolsitas",
        imagen: "images/producto5.jpg",
        precioOriginal: 3200,
        precioDescuento: 2240,
        descuentoPorcentaje: 30
    },
    {
        id: 6,
        nombre: "Complejo B Stress",
        descripcion: "Suplemento vitamínico - Frasco x30 comprimidos",
        imagen: "images/producto6.jpg",
        precioOriginal: 4800,
        precioDescuento: 3360,
        descuentoPorcentaje: 30
    }
];

/* ============================================
   2. ESTADO DEL CARRITO (se guarda en memoria)
   ============================================ */

let carrito = [];

/* ============================================
   3. REFERENCIAS A ELEMENTOS DEL DOM
   ============================================ */

// Contenedores principales
const productosContainer = document.getElementById('productos-container');
const cartPanel = document.getElementById('cart-panel');
const cartOverlay = document.getElementById('cart-overlay');
const cartItemsList = document.getElementById('cart-items');
const cartTotal = document.getElementById('cart-total');

// Botones flotantes
const cartButton = document.getElementById('cart-button');
const cartCount = document.getElementById('cart-count');
const closeCartBtn = document.getElementById('close-cart-btn');

// Botones del carrito
const consultWhatsappBtn = document.getElementById('consult-whatsapp-btn');
const clearCartBtn = document.getElementById('clear-cart-btn');

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
   5. FUNCIÓN: RENDERIZAR PRODUCTOS
   ============================================ */

function renderProductos() {
    // Limpiar el contenedor
    productosContainer.innerHTML = '';

    // Iterar sobre el array de productos
    productos.forEach(producto => {
        // Crear elemento de tarjeta
        const tarjeta = document.createElement('div');
        tarjeta.className = 'producto-card';
        tarjeta.innerHTML = `
            <img src="${producto.imagen}" alt="${producto.nombre}" class="producto-img">
            <div class="producto-badge">${producto.descuentoPorcentaje}% OFF</div>
            <h3 class="producto-nombre">${producto.nombre}</h3>
            <p class="producto-descripcion">${producto.descripcion}</p>
            <div class="producto-precios">
                <span class="precio-original">${formatearPrecio(producto.precioOriginal)}</span>
                <span class="precio-descuento">${formatearPrecio(producto.precioDescuento)}</span>
            </div>
            <button class="btn-agregar-carrito" data-id="${producto.id}">
                Agregar al carrito
            </button>
        `;

        // Agregar evento al botón
        const btnAgregar = tarjeta.querySelector('.btn-agregar-carrito');
        btnAgregar.addEventListener('click', () => agregarAlCarrito(producto));

        // Insertar en el DOM
        productosContainer.appendChild(tarjeta);
    });
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
            precioDescuento: producto.precioDescuento,
            cantidad: 1
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
        const subtotal = item.precioDescuento * item.cantidad;

        const itemElement = document.createElement('div');
        itemElement.className = 'cart-item';
        itemElement.innerHTML = `
            <div class="cart-item-info">
                <div class="cart-item-name">${item.nombre}</div>
                <div class="cart-item-quantity">Cantidad: ${item.cantidad}</div>
            </div>
            <div class="cart-item-price">${formatearPrecio(subtotal)}</div>
            <button class="cart-item-remove" data-id="${item.id}" title="Eliminar producto">×</button>
        `;

        // Evento para eliminar
        const btnRemove = itemElement.querySelector('.cart-item-remove');
        btnRemove.addEventListener('click', () => eliminarDelCarrito(item.id));

        cartItemsList.appendChild(itemElement);
    });
}

/* ============================================
   10. FUNCIÓN: CALCULAR TOTAL DEL CARRITO
   ============================================ */

function calcularTotal() {
    const total = carrito.reduce((sum, item) => {
        return sum + (item.precioDescuento * item.cantidad);
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

    let mensaje = '¡Hola! Me interesan los siguientes productos con descuento:\n\n';

    // Agregar cada producto
    carrito.forEach(item => {
        const subtotal = item.precioDescuento * item.cantidad;
        mensaje += `• ${item.nombre} x${item.cantidad} - ${formatearPrecio(subtotal)}\n`;
    });

    // Calcular total
    const total = carrito.reduce((sum, item) => {
        return sum + (item.precioDescuento * item.cantidad);
    }, 0);

    mensaje += `\nTotal: ${formatearPrecio(total)}\n\n¿Están disponibles? 😊`;

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

// Botón consultar por WhatsApp
consultWhatsappBtn.addEventListener('click', generarMensajeWhatsApp);

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

/* ============================================
   16. INICIALIZACIÓN
   ============================================ */

document.addEventListener('DOMContentLoaded', () => {
    // Renderizar productos al cargar la página
    renderProductos();

    // Inicializar carrito vacío
    actualizarCarritoUI();

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

# SPEC — Farmacia Cicala
> Documento de especificación técnica del proyecto. Leer este archivo antes de cualquier modificación.

---

## 1. DESCRIPCIÓN GENERAL

Página web de **Farmacia Cicala** orientada a mostrar novedades, promociones y combos. El público principal son **adultos mayores**, por lo que el diseño prioriza texto grande, botones amplios, alto contraste y simplicidad visual.

---

## 2. INFORMACIÓN DE LA FARMACIA

| Campo       | Valor                                                                                           |
|-------------|-------------------------------------------------------------------------------------------------|
| Nombre      | Farmacia Cicala                                                                                 |
| Dirección   | Quintana 658, Tandil, Buenos Aires                                                              |
| Teléfono    | (02293) 45-3202                                                                                 |
| WhatsApp    | 2494360437 (wa.me/542494360437)                                                                 |
| Email       | farmaciacicalatandil@gmail.com                                                                  |
| Horario L–V | 8:00–13:00 y 16:00–21:00                                                                       |
| Horario Sáb | 9:00–13:00 y 17:00–21:00                                                                       |
| Domingos    | Cerrado                                                                                         |
| Servicios   | Farmacia, Perfumería, Herboristería, Vacunatorio, Fórmulas magistrales, Inyectables, Delivery  |

---

## 3. ESTRUCTURA DE ARCHIVOS

```
Farmacia Cicala web/
│
├── index.html        → Estructura HTML de la página
├── style.css         → Estilos visuales (paleta, tipografía, layout, responsive)
├── script.js         → Lógica del carrito, renderizado de productos, WhatsApp
├── SPEC.md           → Este documento
│
└── images/
    ├── logo.png             → Logo de la farmacia (header)
    ├── producto1.jpg        → Vitamina C 500mg
    ├── producto2.jpg        → Protector Solar FPS 50
    ├── producto3.jpg        → Ibuprofeno 400mg
    ├── producto4.jpg        → Crema Hidratante
    ├── producto5.jpg        → Té de Jengibre y Miel
    ├── producto6.jpg        → Complejo B Stress
    └── combo1-prod1.jpg     → Imagen producto 1 del combo (ejemplo)
        combo1-prod2.jpg     → Imagen producto 2 del combo (ejemplo)
```

> **Nota:** La carpeta `images/` debe existir en la raíz del proyecto. Los nombres deben coincidir exactamente con los definidos en los arrays de `script.js`.

---

## 4. PALETA DE COLORES Y TIPOGRAFÍA

### Colores (variables CSS en `:root`)

| Variable               | Valor     | Uso                        |
|------------------------|-----------|----------------------------|
| `--color-primary`      | `#D5006D` | Fucsia — color principal   |
| `--color-primary-dark` | `#9B004F` | Fucsia oscuro              |
| `--color-secondary`    | `#FFB6C1` | Rosa claro                 |
| `--color-accent`       | `#FF69B4` | Rosa medio                 |
| `--color-white`        | `#FFFFFF` | Blanco                     |
| `--color-bg`           | `#FFF5F8` | Fondo general rosa suave   |
| `--color-text`         | `#2D2D2D` | Texto principal            |
| `--color-text-light`   | `#666666` | Texto secundario           |
| `--color-border`       | `#E8C1D1` | Bordes rosa suave          |
| `--color-success`      | `#25D366` | Verde WhatsApp             |
| `--color-gray`         | `#999999` | Precio original tachado    |
| `--color-sin-stock`    | `#CCCCCC` | Gris para productos sin stock |

### Tipografía

- **Fuente:** Google Fonts `Nunito` (400, 600, 700, 800)
- **Tamaño base:** 18px (mínimo absoluto en toda la página)
- **Escala:** small 16px / base 18px / medium 20px / large 24px / xl 28px / xxl 32px / heading 36px

---

## 5. ESTRUCTURA DE LA PÁGINA

### 5.1 Header principal (fijo, `position: fixed`)
- **Izquierda:** Logo (`images/logo.png`) + título "Farmacia Cicala"
- **Derecha:** Menú de navegación con 3 secciones separadas por `|`

#### Menú de navegación (dropdown al hover)

| Sección   | Contenido del dropdown                                                                          |
|-----------|-------------------------------------------------------------------------------------------------|
| Horarios  | L–V: 8:00–13:00 / 16:00–21:00 · Sáb: 9:00–13:00 / 17:00–21:00 · Dom: Cerrado                |
| Ubicación | Texto: "Quintana 658 - Tandil, Buenos Aires" + iframe Google Maps                              |
| Contacto  | Teléfono (tel:) / WhatsApp (wa.me) / Email (mailto:) — separados por `<hr>`                   |

### 5.2 Barra de navegación secundaria (debajo del header, fija)
- Barra más pequeña debajo del header principal
- Tres tabs de izquierda a derecha: **Novedades | Promociones | Combos**
- Al hacer clic en cada tab, hace scroll suave a la sección correspondiente
- El tab activo se resalta visualmente (fondo fucsia, texto blanco)

### 5.3 Secciones de contenido (en este orden de arriba a abajo)

#### Novedades (`id="novedades"`)
- Productos nuevos que ingresaron a la farmacia
- Badge **"NUEVO"** en lugar de % OFF
- Sin precio tachado, solo precio actual
- Misma estructura de tarjeta que Promociones

#### Promociones (`id="promociones"`)
- Productos individuales con descuento de precio
- Badge con **% OFF** calculado automáticamente
- Precio original tachado + precio con descuento en fucsia
- Antes llamada "Ofertas"

#### Combos (`id="combos"`)
- Dos o más productos juntos con precio especial
- Tarjeta muestra: nombre del combo, imagen y nombre de cada producto incluido, precio del combo (sin precio individual, sin etiqueta "precio combo")
- Badge **"COMBO"**

### 5.4 Footer
- Contenido único: `© 2026 Farmacia Cicala. Todos los derechos reservados.`
- Fondo fucsia (`--color-primary`), texto blanco, centrado

### 5.5 Botón flotante (esquina inferior derecha)
- **Carrito** (único botón): redondo, 60px, fucsia, badge contador (`id="cart-count"`)

### 5.6 Panel del carrito (drawer lateral derecho)
- Se activa con el botón flotante del carrito
- Se cierra solo con botón ✕ o click en overlay (no se cierra solo)
- Contenido en orden:
  1. Lista de productos con selector de cantidad (botones + y −) por item
  2. Botón eliminar item (×)
  3. Total del carrito
  4. Separador
  5. Selector de modalidad: **"Retiro en farmacia 🏪"** o **"Envío a domicilio 🚚"** (botones grandes)
  6. Si elige envío: campo de texto en blanco para que el cliente escriba su dirección
  7. Botón **"Consultar por WhatsApp"** (verde)
  8. Botón **"Vaciar carrito"** (naranja)

---

## 6. ARRAYS DE DATOS (`script.js`)

### 6.1 Array `novedades`

```javascript
{
  id: "N1",                        // Prefijo N para novedades
  nombre: "Nombre del producto",
  descripcion: "Descripción breve",
  imagen: "images/novedad1.jpg",
  precio: 4500,                    // Solo precio actual, sin descuento
  enStock: true                    // true = disponible / false = sin stock
}
```

### 6.2 Array `promociones`

```javascript
{
  id: "P1",                        // Prefijo P para promociones
  nombre: "Nombre del producto",
  descripcion: "Descripción breve",
  imagen: "images/producto1.jpg",
  precioOriginal: 5500,
  precioDescuento: 3850,
  descuentoPorcentaje: 30,         // Se calcula automáticamente
  enStock: true                    // true = disponible / false = sin stock
}
```

### 6.3 Array `combos`

```javascript
{
  id: "C1",                        // Prefijo C para combos
  nombre: "Nombre del combo",
  precio: 9500,                    // Solo precio del combo
  enStock: true,
  productos: [
    {
      nombre: "Producto 1",
      imagen: "images/combo1-prod1.jpg"
    },
    {
      nombre: "Producto 2",
      imagen: "images/combo1-prod2.jpg"
    }
  ]
}
```

### 6.4 Estado sin stock

Cuando `enStock: false`, la tarjeta se muestra en gris con cartel **"Sin stock"** y el botón de agregar desactivado. El producto sigue visible pero no se puede agregar al carrito.

---

## 7. LÓGICA JAVASCRIPT (`script.js`)

### Funciones principales

| Función                     | Descripción                                                        |
|-----------------------------|--------------------------------------------------------------------|
| `renderNovedades()`         | Genera tarjetas del array `novedades`                              |
| `renderPromociones()`       | Genera tarjetas del array `promociones`                            |
| `renderCombos()`            | Genera tarjetas del array `combos`                                 |
| `agregarAlCarrito(item)`    | Agrega cualquier tipo (novedad, promo o combo) al carrito          |
| `actualizarCantidad(id, delta)` | Suma o resta 1 a la cantidad de un item en el carrito          |
| `actualizarCarritoUI()`     | Actualiza badge, lista y total del carrito                         |
| `renderizarCartItems()`     | Renderiza los items con botones + y − en el panel                  |
| `calcularTotal()`           | Suma los subtotales y actualiza el DOM                             |
| `eliminarDelCarrito(id)`    | Elimina un item del carrito por su ID                              |
| `vaciarCarrito()`           | Vacía completamente el carrito                                     |
| `generarMensajeWhatsApp(modalidad, direccion)` | Arma el mensaje con productos, total, modalidad y dirección si aplica |
| `abrirCarrito()`            | Muestra el panel lateral                                           |
| `cerrarCarrito()`           | Oculta el panel lateral                                            |
| `mostrarConfirmacion(msg)`  | Notificación temporal verde en pantalla                            |
| `formatearPrecio(precio)`   | Formatea número a pesos argentinos ($X.XXX)                        |

### Mensaje de WhatsApp generado

**Para retiro:**
```
¡Hola! Quisiera hacer el siguiente pedido:

• Vitamina C x2 - $7.700
• Combo Verano x1 - $9.500

Total: $17.200

Modalidad: Retiro en farmacia 🏪

⚠️ Este pedido está pendiente de confirmación.
Un integrante de Farmacia Cicala te confirmará
la disponibilidad antes de realizar el pago.
```

**Para envío:**
```
¡Hola! Quisiera hacer el siguiente pedido:

• Vitamina C x2 - $7.700
• Combo Verano x1 - $9.500

Total: $17.200

Modalidad: Envío a domicilio 🚚
Dirección: [lo que escribió el cliente]

⚠️ Este pedido está pendiente de confirmación.
Un integrante de Farmacia Cicala te confirmará
la disponibilidad antes de realizar el pago.
```

### Estado del carrito en memoria

```javascript
let carrito = [
  {
    id: "P1",
    nombre: "Vitamina C 500mg",
    precio: 3850,       // precioDescuento para promos, precio para novedades y combos
    cantidad: 2,
    tipo: "promocion"   // "novedad" | "promocion" | "combo"
  }
];
```

> El carrito **no persiste** entre recargas (almacenado solo en memoria).

---

## 8. RESPONSIVE DESIGN

| Breakpoint        | Comportamiento                                              |
|-------------------|-------------------------------------------------------------|
| Mobile (< 480px)  | 1 columna, header apilado, barra secundaria scrolleable     |
| Tablet (< 768px)  | 2 columnas, nav centrado                                    |
| Desktop (≥ 1200px)| 3 columnas, layout completo en una fila                    |

---

## 9. FLUJO DE COMPRA COMPLETO

```
Cliente navega por Novedades / Promociones / Combos
                    ↓
        Agrega productos al carrito
                    ↓
        Abre el panel del carrito
                    ↓
     Ajusta cantidades con + y −
                    ↓
   Elige: Retiro en farmacia / Envío a domicilio
                    ↓
      Si envío: escribe su dirección
                    ↓
     Pulsa "Consultar por WhatsApp"
                    ↓
  Se abre WhatsApp con mensaje automático
                    ↓
  Bot de WhatsApp Business responde con:
  - Datos de pago (CBU / alias)
  - Aviso de esperar confirmación de stock
                    ↓
  Farmacia confirma stock y el cliente paga
                    ↓
       Cliente envía comprobante
                    ↓
      Farmacia prepara y entrega
```

---

## 10. INTEGRACIONES FUTURAS PLANIFICADAS

### 10.1 Panel de Administración (PENDIENTE)
- URL privada `/admin` con login (usuario + contraseña)
- No visible para clientes
- Funciones:
  - Gestionar novedades, promociones y combos
  - Activar/desactivar descuentos
  - Marcar productos como sin stock
  - Subir archivo Excel del software de gestión
- Base de datos: **Firebase** (plan gratuito)

### 10.2 Integración de Stock con Excel (PENDIENTE)
- El software de gestión de la farmacia exporta Excel con el stock
- Desde el panel admin se sube el Excel
- La página cruza el stock con los productos activos
- Si un producto llega a 0 unidades → se marca automáticamente como sin stock
- **Estado:** pendiente de ver el software en persona (mañana)

### 10.3 WhatsApp Business (CONFIGURACIÓN MANUAL — PENDIENTE)
- Respuesta automática con datos de pago (CBU / alias)
- Aclaración de esperar confirmación de un integrante de la farmacia
- Se configura directo desde la app, sin código
- **Estado:** pendiente de confirmar que la farmacia ya tiene WhatsApp Business

---

## 11. DESPLIEGUE

| Plataforma | URL                                              |
|------------|--------------------------------------------------|
| GitHub     | https://github.com/agussalaverry/farmacia-cicala |
| Vercel     | Publicado (actualmente en modo privado)          |
| Dominio    | Pendiente — registrar en NIC.ar (.com.ar)        |

> Vercel se mantiene privado hasta que la página esté completamente terminada.

---

## 12. NOTAS DE ACCESIBILIDAD (adultos mayores)

- Font-size mínimo: **16px** (preferentemente 18px en todo)
- Botones con padding generoso (mínimo 15px)
- Alto contraste entre texto y fondo en todo momento
- Confirmaciones visuales al agregar/eliminar productos
- El carrito no se cierra solo, solo con acción explícita
- Etiquetas claras en cada campo (no solo íconos)
- Scroll suave activado globalmente
- Selector de cantidad con botones grandes (no campo de texto)
- Botones de Retiro/Envío grandes y bien diferenciados

---

*Última actualización: Junio 2026 — Estado: HTML + CSS + JS base implementados. Pendiente: novedades, combos, selector de cantidad en carrito, flujo de compra WhatsApp, panel admin, Firebase.*

// ============================================
// CONFIG.JS — EDITAR PARA CADA CLIENTE NUEVO
// ============================================

window.CONFIG = {

  // Negocio
  NEGOCIO_NOMBRE: 'Mi Tienda',
  NEGOCIO_DESCRIPCION: 'Tu negocio de confianza',

  // WhatsApp
  WHATSAPP_NUMERO: '5491112345678',
  WHATSAPP_MENSAJE: '¡Hola! Quisiera hacer el siguiente pedido:',

  // Firebase — reemplazar con las credenciales del cliente
  FIREBASE_CONFIG: {
    apiKey: "TU_API_KEY",
    authDomain: "TU_PROYECTO.firebaseapp.com",
    projectId: "TU_PROYECTO",
    storageBucket: "TU_PROYECTO.firebasestorage.app",
    messagingSenderId: "TU_ID",
    appId: "TU_APP_ID"
  },

  // Cloudinary
  CLOUDINARY_CLOUD: 'TU_CLOUD_NAME',
  CLOUDINARY_PRESET: 'TU_UPLOAD_PRESET',

  // Colecciones de Firestore
  COL_DESTACADOS: 'destacados',
  COL_OFERTAS: 'ofertas',
  COL_PACKS: 'packs',

  // Secciones — etiquetas visibles en la UI
  SECCION_1_NOMBRE: 'Destacados',
  SECCION_1_SUBTITULO: 'Productos nuevos que acaban de llegar',
  SECCION_2_NOMBRE: 'Ofertas',
  SECCION_2_SUBTITULO: 'Productos con descuento especial esta semana',
  SECCION_3_NOMBRE: 'Combos & Packs',
  SECCION_3_SUBTITULO: 'Ofertas especiales con múltiples productos',

  // Contacto
  TELEFONO: '+54 9 11 1234-5678',
  EMAIL: 'info@mitienda.com',
  DIRECCION: 'Dirección 123',
  CIUDAD: 'Ciudad, Provincia',

  // Horarios
  HORARIO_LV: '9:00–13:00 | 16:00–20:00',
  HORARIO_SAB: '9:00–13:00',
  HORARIO_DOM: 'Cerrado',

  // Turnos (link externo en botón flotante — dejar vacío para ocultar)
  TURNOS_URL: '',
  TURNOS_LABEL: 'Turnos',
};
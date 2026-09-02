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
    apiKey: "AIzaSyC5r3rA7a5awU2oErPnn2fP2qNZZ6s5qmo",
    authDomain: "farmacia-cicala.firebaseapp.com",
    projectId: "farmacia-cicala",
    storageBucket: "farmacia-cicala.firebasestorage.app",
    messagingSenderId: "299138749267",
    appId: "1:299138749267:web:c716a4f57e6e8957a987a6"
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
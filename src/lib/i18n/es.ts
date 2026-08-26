/**
 * Textos de interfaz en español.
 * Centralizados para facilitar la futura internacionalización:
 * agregar en.ts y un selector de idioma sin tocar componentes.
 */
export const t = {
  app: { name: "Soy Templo", tagline: "Una casa para encontrarte con Dios" },
  nav: {
    home: "Inicio", devotionals: "Devocionales", devotionalsShort: "Devo", plans: "Planes",
    events: "Eventos", more: "Más", announcements: "Anuncios",
    donate: "Donar", prayer: "Oración", streams: "Transmisiones",
    favorites: "Favoritos", progress: "Mi progreso", profile: "Perfil",
    settings: "Configuración", about: "Acerca de Soy Templo", admin: "Panel",
  },
  greeting: {
    morning: "Buenos días", afternoon: "Buenas tardes", evening: "Buenas noches",
  },
  home: {
    todayDevotional: "Devocional de hoy", nextEvent: "Próximo evento",
    featuredAnnouncement: "Anuncio destacado", continuePlan: "Continúa tu plan",
    quickActions: "Accesos rápidos", liveNow: "En vivo ahora", readMore: "Leer",
    donateCta: "Quiero dar",
  },
  devotional: {
    reading: "Lectura bíblica", keyVerse: "Versículo destacado",
    application: "Aplicación práctica", questions: "Para meditar",
    prayer: "Oración final", share: "Compartir", save: "Guardar",
    markRead: "Marcar como leído", read: "Leído", related: "Devocionales relacionados",
    empty: "Aún no hay devocionales publicados. Vuelve pronto.",
  },
  plans: {
    start: "Comenzar plan", continue: "Continuar", completed: "Completado",
    lesson: "Lección", progress: "Progreso",
    level: {
      beginner: "Principiante", intermediate: "Intermedio", advanced: "Avanzado",
    } as Record<string, string>,
    days: "días", completeLesson: "Completar lección",
    congrats: "¡Terminaste este plan! Que lo aprendido eche raíces.",
    empty: "Pronto habrá planes de estudio disponibles.",
  },
  events: {
    upcoming: "Próximos eventos", location: "Ubicación", register: "Inscribirme",
    addToCalendar: "Agregar a mi calendario", empty: "No hay eventos próximos por ahora.",
  },
  donate: {
    title: "Donaciones",
    intro: "Tu generosidad sostiene la obra: la enseñanza, el servicio a la comunidad y el cuidado de esta casa. Toda donación se procesa de forma segura.",
    amount: "Monto", custom: "Otro monto", category: "Destino de la donación",
    anonymous: "Donar de forma anónima", name: "Nombre", email: "Correo electrónico",
    submit: "Continuar con la donación",
    bank: "También puedes donar por transferencia bancaria; consulta los datos al final del servicio o escríbenos.",
    thanks: "Gracias por tu generosidad. Dios ama al dador alegre (2 Corintios 9:7).",
    error: "No pudimos procesar la donación. Revisa los datos e intenta de nuevo.",
  },
  prayer: {
    title: "Peticiones de oración",
    intro: "Queremos orar contigo. Comparte tu petición; nuestro equipo la trata con respeto y confidencialidad.",
    body: "Escribe tu petición", category: "Categoría",
    isPublic: "Permitir que la iglesia la vea y ore por ella (se publica tras revisión)",
    isAnonymous: "Enviar de forma anónima",
    allowContact: "Autorizo que un pastor me contacte",
    submit: "Enviar petición",
    praying: "Estoy orando por ti", prayingCount: "personas están orando",
    sent: "Recibimos tu petición. Estamos orando contigo.",
    empty: "Aún no hay peticiones públicas.",
  },
  auth: {
    login: "Iniciar sesión", register: "Crear cuenta", email: "Correo electrónico",
    password: "Contraseña", fullName: "Nombre completo",
    forgot: "¿Olvidaste tu contraseña?", noAccount: "¿No tienes cuenta?",
    hasAccount: "¿Ya tienes cuenta?", logout: "Cerrar sesión",
    invalid: "Correo o contraseña incorrectos.",
    checkEmail: "Te enviamos un correo para confirmar tu cuenta.",
  },
  common: {
    loading: "Cargando…", error: "Algo salió mal. Intenta de nuevo.",
    back: "Volver", all: "Todos", by: "Por",
  },
  radio: {
    title: "Radio Soy Templo", play: "Reproducir", pause: "Pausar",
    live: "En vivo", loading: "Conectando…",
    error: "No pudimos conectar con la radio. Intenta de nuevo en un momento.",
    unavailable: "La radio en línea estará disponible muy pronto.",
    share: "Compartir",
  },
  notifications: {
    title: "Notificaciones", enable: "Activar notificaciones", disable: "Desactivar notificaciones",
    enabling: "Activando…",
    intro: "Recibe avisos directo en tu teléfono o computadora, sin necesidad de una cuenta.",
    unsupported: "Tu navegador no admite notificaciones push.",
    iosHint: "En iPhone: agrega esta app a tu pantalla de inicio para poder recibir notificaciones (Compartir → Agregar a inicio).",
    blocked: "Bloqueaste las notificaciones para este sitio. Actívalas desde los ajustes de tu navegador.",
    categories: {
      devotional: "Nuevo devocional", verse: "Versículo del día", events: "Eventos y recordatorios",
      sermons: "Nuevos sermones", campaigns: "Campañas de donación",
    },
    enabled: "Notificaciones activadas",
    error: "No pudimos activar las notificaciones. Intenta de nuevo.",
  },
} as const;

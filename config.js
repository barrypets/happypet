// ÚNICO archivo que se toca por cliente. index.html no se toca nunca.
// Sección sin datos = sección que desaparece sola. Deja [] o borra la clave.
// ponytail: .js y no .json para que index.html abra con doble clic (file:// bloquea fetch)
const CONFIG = {
  url: "https://barrypets.github.io/happypet",
  demo: true,
  nombre: "Happy Pet Madrid",
  claim: "Más que mascotas, familia",
  subclaim: "Guardería y peluquería canina en Retiro. Un cole sin jaulas para perros pequeños, por horas o por días, y peluquería adaptada a cada perro.",
  color: "#E5534F",
  logo: "assets/logo.jpg",
  logoAlto: 52,                      // su logo es cuadrado (avatar de Instagram)

  // Google Maps e Instagram (@happypetmadrid), 14 nov 2026
  telefono: "+34 611 57 15 19",
  whatsapp: "34611571519",
  whatsappMensaje: "Hola, he visto vuestra web y quería información",
  email: "",
  direccion: "C/ de Fernán González 64, Retiro, 28009 Madrid",
  mapa: "https://maps.google.com/?cid=7872680113833965685",
  instagram: "https://instagram.com/happypetmadrid",

  // Reservas de barrypets: la demo (V2tI...) tiene demo.webBooking, así que su caja responde
  // al público aunque no salga en el mapa. Al darse de alta: su uid real.
  barrypets: {
    negocio: "V2tIoEUjEbV6KfyVmQpBsDhc5SW2",
    formato: "servicios",
    local: "",
    tarjeta: false,
    titulo: "Reserva en un minuto",
    texto: "Elige el servicio y el día, sin crear cuenta. La confirmación te llega al momento."
  },

  hero: "assets/hero.jpg",

  google: { nota: "5,0", resenas: 42, url: "https://maps.google.com/?cid=7872680113833965685" },

  cifras: [
    ["5,0", "en Google, 42 reseñas"],
    ["0", "jaulas"],
    ["2", "formas de guardería: por horas o por días"],
    ["L a S", "abierto"]
  ],

  servicios: [
    { icono: "house",      titulo: "Guardería sin jaulas",  texto: "Un cole para perros pequeños: espacio libre y seguro para que se sientan como en casa." },
    { icono: "clock",      titulo: "Por horas o por días",   texto: "Tú eliges lo que mejor se adapta a tu rutina." },
    { icono: "users",      titulo: "Grupos pequeños",        texto: "Socialización sana y supervisada, con ejercicio y juego cada día." },
    { icono: "sparkles",   titulo: "Baño",                   texto: "Cepillado previo, champú adaptado, limpieza de oídos, secado y cepillado final." },
    { icono: "scissors",   titulo: "Corte",                  texto: "A máquina o tijera, adaptado a cada perro y con especial cuidado en zonas sensibles." },
    { icono: "paw-print",  titulo: "Deslanado",              texto: "Eliminamos el pelo muerto para un manto más sano y ligero." }
  ],

  puntos: [
    "Sin jaulas: camitas, rampas y espacio para jugar",
    "Grupos pequeños y supervisados",
    "Te mantenemos informado para que siempre sepas cómo está",
    "Hotel canino para cuando te vas de viaje"
  ],

  galeria: ["assets/1.jpg", "assets/2.jpg", "assets/3.jpg", "assets/4.jpg", "assets/5.jpg", "assets/6.jpg"],

  // De sus reseñas de Google (iniciales)
  resenas: [
    { texto: "Han hecho un muy buen trabajo con nuestra perra, que es grande. Le hicieron corte de pelo y bañado, y también le limpiaron las orejas muy bien. La vamos a seguir llevando.", autor: "A. y L. L." },
    { texto: "Mi perro sufre de ansiedad por separación y nos ayudan mucho en este proceso. Estamos encantados viendo la evolución poco a poco y cómo disfruta.", autor: "M. V." },
    { texto: "Me encantó el servicio, todos súper amables. Mi perrita llegó feliz y salió muy feliz, a pesar de que no le encanta que la bañen.", autor: "M. F. C." }
  ],

  faq: [
    { p: "¿Qué perros admitís en la guardería?", r: "Es un cole para perros pequeños, en grupos pequeños y supervisados." },
    { p: "¿Puedo traerlo solo unas horas?",      r: "Sí. La guardería es por horas o por días, como mejor encaje en tu rutina." },
    { p: "¿Cuánto cuesta la peluquería?",        r: "Depende del perro, su tamaño y su tipo de pelo. Escríbenos y te asesoramos." },
    { p: "¿Tenéis hotel canino?",                r: "Sí, para cuando te vas de viaje: cuidado diario, paseos, juego y mimos." }
  ],

  horario: [
    ["Lunes a viernes", "8:00 – 20:00"],
    ["Sábado", "9:00 – 16:00"],
    ["Domingo", "Cerrado"]
  ],

  formulario: {
    intro: "Hola, quería información:",
    boton: "Enviar por WhatsApp",
    campos: [
      { id: "nombre", etiqueta: "Tu nombre", tipo: "texto", pista: "Tu nombre", requerido: true },
      { id: "perro",  etiqueta: "Tu perro (nombre y raza)", tipo: "texto", pista: "Coco, bichón maltés", requerido: true },
      { id: "asunto", etiqueta: "Qué necesitas", tipo: "lista", requerido: true,
        opciones: ["Guardería por horas", "Guardería por días", "Hotel canino", "Baño", "Corte", "Deslanado"] },
      { id: "cuando", etiqueta: "Cuándo te viene bien", tipo: "area", max: 300, pista: "Mañanas entre semana, este sábado..." }
    ]
  },

  cta: "Ven a conocernos",
  ctaTexto: "Escríbenos por WhatsApp y te contamos todo lo que necesites.",

  legal: { razonSocial: "", nif: "", domicilio: "", registro: "" }
};

// Iconos disponibles (Lucide). Si falta uno para un negocio, se añade a ICONS en index.html:
//   award baby bike bone book-open briefcase building-2 calendar camera car check
//   chevron-down clock coffee credit-card drill dumbbell flame flower gift glasses
//   graduation-cap hammer hand-platter heart house instagram key-round laptop leaf
//   mail map-pin music package paintbrush paw-print phone scissors shield-check
//   shirt siren smile snowflake sofa sparkles spray-can star stethoscope syringe
//   truck users utensils wine wrench zap

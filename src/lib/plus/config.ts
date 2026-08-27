export const PLUS_PRODUCT_ID = "soy_templo_plus";

export const plusProducts = {
  monthly: {
    productId: PLUS_PRODUCT_ID,
    basePlanId: "monthly",
    label: "Mensual",
    displayPrice: "$2.99 / mes",
  },
  annual: {
    productId: PLUS_PRODUCT_ID,
    basePlanId: "annual",
    label: "Anual",
    displayPrice: "$29.99 / año",
  },
} as const;

export const plusBenefits = [
  "Radio en segundo plano y con la pantalla bloqueada",
  "Planes bíblicos y teológicos especializados",
  "Audio de devocionales y estudios",
  "Biblioteca de formación y materiales ampliados",
  "Descargas para escuchar y estudiar sin conexión",
  "Nuevas funciones premium que se añadirán sin perder tu progreso",
] as const;

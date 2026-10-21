// Vocabulario compartido por la base de datos, el match y la interfaz.

export const CATEGORIES = [
  "Quesos",
  "Aceite",
  "Aceitunas y encurtidos",
  "Vinos",
  "Carnes",
  "Embutidos",
  "Lácteos",
  "Verduras y frutas",
  "Pan y repostería",
  "Conservas y ahumados",
  "Bebidas",
  "Café y chocolates",
  "Alimentos preparados",
  "Otros alimentos",
] as const;

export type Category = (typeof CATEGORIES)[number];

export const LABELS = {
  DOP_VINOS_MADRID: { name: "D.O.P. Vinos de Madrid", short: "DOP Vinos de Madrid", kind: "dop" },
  DOP_ACEITE_MADRID: { name: "D.O.P. Aceite de Madrid", short: "DOP Aceite de Madrid", kind: "dop" },
  DC_ACEITUNAS_CAMPO_REAL: { name: "D.C. Aceitunas de Campo Real", short: "DC Campo Real", kind: "dop" },
  IGP_CARNE_GUADARRAMA: { name: "I.G.P. Carne de la Sierra de Guadarrama", short: "IGP Guadarrama", kind: "dop" },
  ECO: { name: "Producción ecológica certificada", short: "Ecológico", kind: "eco" },
} as const;

export type LabelCode = keyof typeof LABELS;
export const LABEL_CODES = Object.keys(LABELS) as LabelCode[];

export type Role = "hostelero" | "productor" | "consumidor" | "equipo";

export const ROLE_NAMES: Record<Role, string> = {
  hostelero: "Hostelero",
  productor: "Productor",
  consumidor: "Consumidor",
  equipo: "Equipo BACO",
};

export const REQUEST_TYPES = {
  muestra: "Pedir muestra",
  pedido: "Pedir precio y plazo",
  contacto: "Hacer una pregunta",
} as const;
export type RequestType = keyof typeof REQUEST_TYPES;

export const REQUEST_STATUS = {
  enviada: "Enviada",
  vista: "Leída",
  respondida: "Respondida",
  cerrada: "Archivada",
} as const;
export type RequestStatus = keyof typeof REQUEST_STATUS;

// Fuente oficial de los datos de producto.
export const CATALOG_URL = "https://www.comunidad.madrid/info/productos";

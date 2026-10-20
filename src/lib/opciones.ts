export const MONEDAS = [
  { valor: "DOP", texto: "RD$ (DOP)" },
  { valor: "USD", texto: "US$ (USD)" },
];
export const TIPOS_DEUDA = [
  { valor: "prestamo", texto: "Préstamo" },
  { valor: "hipoteca", texto: "Hipoteca" },
  { valor: "tarjeta", texto: "Tarjeta de crédito" },
];
export const BOLSILLOS = [
  { valor: "manejable", texto: "Manejable" },
  { valor: "auto_debitado", texto: "Auto-debitado" },
];
export const FRECUENCIAS = [
  { valor: "recurrente", texto: "Recurrente (cada mes)" },
  { valor: "puntual", texto: "Puntual (una vez)" },
];
export const TIPOS_GASTO = [
  { valor: "fijo", texto: "Fijo" },
  { valor: "variable", texto: "Variable" },
];
export const CATEGORIAS_GASTO = ["Comida", "Vivienda", "Educación", "Hogar", "Transporte", "Servicios", "Digital", "Salud", "Ropa", "Ocio", "Deudas", "Otros"];
export const CATEGORIAS_INGRESO = ["Salario", "Asesoría", "Honorarios", "Reembolso", "Otros"];
export const TIPOS_FONDO = [
  { valor: "emergencia", texto: "Emergencia" },
  { valor: "medico", texto: "Médico" },
  { valor: "otro", texto: "Otro" },
];
export const ETIQUETA_TIPO_DEUDA: Record<string, string> = { prestamo: "Préstamo", hipoteca: "Hipoteca", tarjeta: "Tarjeta" };

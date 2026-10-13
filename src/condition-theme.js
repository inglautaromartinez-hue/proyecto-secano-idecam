/**
 * Presentación cromática de la condición parcelaria del Proyecto Secano.
 * SUPLETA=1 => Supletorio; los restantes registros => Con título.
 */
export function conditionClass(condition) {
  return condition === "Supletorio" ? "supletorio" : "titulo";
}

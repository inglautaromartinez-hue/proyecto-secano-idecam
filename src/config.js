export const WFS_URL = "https://geonode-cam.marketsis.com.ar/geoserver/wfs";

export const WFS_LAYER_GROUPS = [
  {
    id: "agosto",
    label: "Verificadas · 28 agosto 2026",
    candidates: [
      "geonode:supletorios_28agosto",
      "geonode:supletorios_28agosto_22172",
      "geonode:supletorios-28agosto"
    ]
  },
  {
    id: "octubre",
    label: "Verificadas · octubre 2026",
    candidates: [
      "geonode:supletorios_secano_oct",
      "geonode:supletorios_secano_oct_22172",
      "geonode:supletorios-secano-oct",
      "geonode:supletorios_secano_octubre"
    ]
  }
];

export const PROJECT_STATS = Object.freeze({
  total: 500,
  validada: 205,
  revision: 295,
  supletorio: 205,
  titulo: 257,
  sinDato: 38,
  superficieHa: 1762785.82,
  avancePct: 41
});

export const DEPARTMENT_NAMES = Object.freeze({
  "06": "Luján de Cuyo",
  "17": "San Rafael",
  "18": "General Alvear",
  "19": "Malargüe"
});

export const COLORS = Object.freeze({
  supletorio: "#d97706",
  titulo: "#2563eb",
  sinDato: "#64748b",
  outline: "#102a2e",
  highlight: "#ef4444"
});
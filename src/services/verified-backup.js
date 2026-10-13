import { DEPARTMENT_NAMES } from "../config.js";

const PART_COUNT = 6;
const EXPECTED_FEATURES = 205;
const PATH = "/verified";

export async function loadBundledVerifiedParcels({ fetchImpl = fetch } = {}) {
  const parts = await Promise.all(Array.from({ length: PART_COUNT }, async (_, index) => {
    const response = await fetchImpl(`${PATH}/chunk-${index + 1}.txt`);
    if (!response.ok) throw new Error(`VERIFIED_BUNDLE_HTTP_${response.status}`);
    const text = (await response.text()).trim();
    if (!/^[A-Za-z0-9+/=]+$/.test(text) || text.length !== 3508) {
      throw new Error("VERIFIED_BUNDLE_PART_INVALID");
    }
    return text;
  }));

  if (typeof DecompressionStream !== "function") {
    throw new Error("GZIP_DECOMPRESSION_UNSUPPORTED");
  }

  const binary = atob(parts.join(""));
  const zipped = Uint8Array.from(binary, (character) => character.charCodeAt(0));
  const stream = new Blob([zipped]).stream().pipeThrough(new DecompressionStream("gzip"));
  const rows = JSON.parse(await new Response(stream).text());
  if (!Array.isArray(rows) || rows.length !== EXPECTED_FEATURES) {
    throw new Error("VERIFIED_BUNDLE_COUNT_MISMATCH");
  }

  const seen = new Set();
  const features = rows.map((row) => {
    if (!Array.isArray(row) || row.length !== 4) throw new Error("VERIFIED_BUNDLE_ROW_INVALID");
    const [nc, plano, octoberFlag, rings] = row;
    if (typeof nc !== "string" || !/^\d{20,21}$/.test(nc) || seen.has(nc)) {
      throw new Error("VERIFIED_BUNDLE_NOMENCLATURE_INVALID");
    }
    seen.add(nc);
    if (!Array.isArray(rings) || rings.length === 0) throw new Error("VERIFIED_BUNDLE_GEOMETRY_INVALID");

    const coords = rings.map((ring) => {
      if (!Array.isArray(ring) || ring.length < 4) throw new Error("VERIFIED_BUNDLE_RING_INVALID");
      return ring.map((coordinate) => {
        if (!Array.isArray(coordinate) || coordinate.length !== 2 ||
            !coordinate.every(Number.isInteger)) throw new Error("VERIFIED_BUNDLE_COORDINATE_INVALID");
        const lon = coordinate[0] / 100000;
        const lat = coordinate[1] / 100000;
        if (lon < -75 || lon > -63 || lat < -40 || lat > -28) {
          throw new Error("VERIFIED_BUNDLE_COORDINATE_OUT_OF_RANGE");
        }
        return [lon, lat];
      });
    });
    const dep = nc.slice(0, 2);
    return {
      type: "Feature",
      id: nc,
      properties: {
        nc,
        plano: String(plano ?? ""),
        departamentoCodigo: dep,
        departamento: DEPARTMENT_NAMES[dep] ?? dep,
        supleta: 1,
        condicion: "Supletorio",
        estado: "Validada",
        periodo: octoberFlag ? "Verificadas · octubre 2026" : "Verificadas · 28 agosto 2026",
        observacion: nc.length === 20 ? "NC de 20 dígitos: cotejar con plano de mensura." : null,
        fuenteWfs: "Respaldo validado (ZIP de IDECAM)"
      },
      geometry: { type: "Polygon", coordinates: coords }
    };
  });

  return {
    collection: { type: "FeatureCollection", features },
    origin: "verified-static-bundle",
    count: features.length
  };
}

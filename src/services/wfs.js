import { DEPARTMENT_NAMES, WFS_LAYER_GROUPS, WFS_URL } from "../config.js";

export async function loadVerifiedParcels({ fetchImpl = fetch } = {}) {
  const loaded = [];
  const failures = [];

  for (const group of WFS_LAYER_GROUPS) {
    const result = await loadFirstAvailableLayer(group, fetchImpl);
    if (result) loaded.push(result);
    else failures.push(group.label);
  }

  const byNc = new Map();
  for (const layer of loaded) {
    for (const feature of layer.collection.features) {
      const normalized = normalizeFeature(feature, layer);
      if (!normalized) continue;
      byNc.set(normalized.properties.nc, normalized);
    }
  }

  return {
    collection: { type: "FeatureCollection", features: [...byNc.values()] },
    layers: loaded.map(({ collection, ...meta }) => meta),
    failures
  };
}

async function loadFirstAvailableLayer(group, fetchImpl) {
  for (const typeName of group.candidates) {
    try {
      const url = buildGetFeatureUrl(typeName);
      const response = await fetchImpl(url, { headers: { Accept: "application/json" } });
      if (!response.ok) continue;

      const contentType = response.headers?.get?.("content-type") ?? "";
      let payload;
      if (contentType.includes("json")) payload = await response.json();
      else {
        const text = await response.text();
        if (/ExceptionReport|ServiceException/i.test(text)) continue;
        payload = JSON.parse(text);
      }

      if (payload?.type !== "FeatureCollection" || !Array.isArray(payload.features)) continue;
      return { ...group, typeName, url, collection: payload };
    } catch {
      // Probar siguiente nombre posible.
    }
  }
  return null;
}

function buildGetFeatureUrl(typeName) {
  const url = new URL(WFS_URL);
  url.search = new URLSearchParams({
    service: "WFS",
    version: "2.0.0",
    request: "GetFeature",
    typeNames: typeName,
    outputFormat: "application/json",
    srsName: "EPSG:4326",
    count: "5000"
  });
  return url.toString();
}

function normalizeFeature(feature, layer) {
  if (feature?.type !== "Feature" || !feature.geometry) return null;
  const properties = feature.properties ?? {};
  const nc = digits(readCI(properties, ["nomenclatu", "nomenclatura", "nomenc"]));
  if (!nc) return null;

  const supleta = normalizeSupleta(readCI(properties, ["SUPLETA", "supleta"]));
  const condicion = supleta === 1 ? "Supletorio" : supleta === 0 ? "Con título" : "Sin dato";
  const depCode = digits(readCI(properties, ["codigo_dep", "codigo_depto"]))?.slice(0, 2) || nc.slice(0, 2);

  return {
    type: "Feature",
    id: feature.id ?? nc,
    geometry: feature.geometry,
    properties: {
      nc,
      departamentoCodigo: depCode,
      departamento: DEPARTMENT_NAMES[depCode] ?? depCode ?? "Sin dato",
      plano: clean(readCI(properties, ["nro_plano", "nroplano", "plano", "n_plano"])),
      supleta,
      condicion,
      estado: "Validada",
      periodo: layer.label,
      observacion: clean(readCI(properties, ["observacio", "observacion", "observaciones"])),
      fuenteWfs: layer.typeName
    }
  };
}

function readCI(properties, names) {
  const map = new Map(Object.entries(properties).map(([key, value]) => [key.toLowerCase(), value]));
  for (const name of names) {
    const value = map.get(String(name).toLowerCase());
    if (value !== undefined && value !== null) return value;
  }
  return null;
}

function clean(value) {
  if (value === null || value === undefined) return null;
  const text = String(value).trim();
  return text === "" ? null : text;
}

function digits(value) {
  const text = clean(value);
  if (!text) return null;
  const normalized = text.replace(/\D/g, "");
  return normalized || null;
}

function normalizeSupleta(value) {
  if (value === null || value === undefined || value === "") return null;
  const n = Number(value);
  return n === 1 ? 1 : n === 0 ? 0 : null;
}
import * as maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import { COLORS } from "./config.js";
import { loadVerifiedParcels } from "./services/wfs.js";
import { loadBundledVerifiedParcels } from "./services/verified-backup.js";
import "./styles.css";

const app = document.querySelector("#app");

app.innerHTML = [
  '<main class="app-shell">',
  '  <section class="map-stage" aria-label="Mapa Proyecto Secano">',
  '    <div id="map"></div>',
  '    <svg id="parcel-outline-overlay" class="parcel-outline-overlay" aria-label="Límites de parcelas al acercar el mapa"></svg>',
  '    <div class="top-brand">',
  '      <div><span class="brand-kicker">IDECAM · Colegio de Agrimensura de Mendoza</span><h1>Proyecto Secano</h1></div>',
  '      <span class="live-pill"><i></i> Base verificada</span>',
  '    </div>',
  '    <div class="map-tools">',
  '      <button id="basemap-toggle" type="button">Satélite</button>',
  '      <button id="fit-all" type="button">Encuadrar</button>',
  '    </div>',
  '    <div class="map-legend">',
  '      <strong>Condición</strong>',
  '      <span><i style="--legend:#d97706"></i>Supletorio</span>',
  '      <span><i style="--legend:#0f766e"></i>Con título</span>',
  '      <span><i style="--legend:#64748b"></i>Sin dato</span>',
  '    </div>',
  '  </section>',
  '  <aside class="panel" id="panel">',
  '    <button class="sheet-handle" id="sheet-handle" type="button" aria-label="Expandir o contraer panel"><span></span></button>',
  '    <section class="panel-hero">',
  '      <p class="eyebrow">PROYECTO SECANO · 2026</p>',
  '      <h2>Base parcelaria del secano</h2>',
  '      <p>Seguimiento y consulta de parcelas relevadas, verificadas y publicadas en IDECAM.</p>',
  '    </section>',
  '    <section class="progress-card">',
  '      <div class="progress-head"><div><span>Avance verificado</span><strong>41%</strong></div><small>205 de 500 parcelas únicas</small></div>',
  '      <div class="progress-track"><span style="width:41%"></span></div>',
  '      <div class="progress-grid">',
  '        <div><strong>205</strong><span>Validadas</span></div>',
  '        <div><strong>295</strong><span>En revisión</span></div>',
  '        <div><strong>500</strong><span>Total</span></div>',
  '      </div>',
  '    </section>',
    '    <section class="condition-chart" aria-label="Distribución de condición jurídica del inventario">',
  '      <div class="section-title"><span>Condición del inventario</span><small>500 parcelas</small></div>',
  '      <div class="chart-body"><div class="donut" role="img" aria-label="205 supletorias, 257 con título, 38 sin dato"><span><strong>500</strong><small>parcelas</small></span></div>',
  '      <div class="chart-labels"><div><i class="chart-dot supletorio"></i><span>Supletorio</span><b>205 · 41%</b></div><div><i class="chart-dot titulo"></i><span>Con título</span><b>257 · 51,4%</b></div><div><i class="chart-dot sindato"></i><span>Sin dato</span><b>38 · 7,6%</b></div></div></div>',
  '      <p class="chart-note">Inventario general (crudo + verificado). Sólo las 205 supletorias verificadas están publicadas en este mapa.</p>',
  '    </section>',
  '    <section class="monthly-card" aria-label="Superficie parcelaria por mes de origen">',
  '      <div class="section-title"><span>Superficie por mes</span><small>Cortes verificados</small></div>',
  '      <strong class="monthly-total">746.539 <span>ha</span></strong>',
  '      <p class="monthly-subtitle">Superficie geométrica de 205 NC únicas.</p>',
  '      <div class="monthly-bars" role="img" aria-label="Agosto: 508.938 hectáreas. Septiembre: 237.601 hectáreas.">',
  '        <div class="month-row"><div class="month-heading"><b>Agosto 2026</b><span>508.938 ha</span></div><div class="month-track"><span style="width:100%"></span></div><small>96 parcelas</small></div>',
  '        <div class="month-row"><div class="month-heading"><b>Septiembre 2026</b><span>237.601 ha</span></div><div class="month-track"><span style="width:46.7%"></span></div><small>109 parcelas</small></div>',
  '      </div>',
  '      <p class="monthly-note">Mes de origen de los lotes entregados, no fecha individual de dibujo. Áreas en EPSG:5344, sin duplicar NC. El lote de septiembre se publicó en octubre.</p>',
  '    </section>',
'    <section class="search-section">',
  '      <label for="parcel-search">Buscar parcela o plano</label>',
  '      <div class="search-row"><input id="parcel-search" type="search" placeholder="Nomenclatura o Nº de plano" autocomplete="off"><button id="search-clear" type="button" aria-label="Limpiar búsqueda">×</button></div>',
  '      <div id="search-results" class="search-results" hidden></div>',
  '    </section>',
  '    <section class="filters">',
  '      <div class="section-title"><span>Filtros</span><button id="reset-filters" type="button">Restablecer</button></div>',
  '      <div class="filter-block"><span class="filter-label">Departamento</span><div class="chips" id="department-chips"><button type="button" class="chip active" data-department="all">Todos</button></div></div>',
  '      <div class="filter-block"><span class="filter-label">Condición</span><div class="chips" id="condition-chips"><button type="button" class="chip active" data-condition="all">Todas</button><button type="button" class="chip" data-condition="Supletorio">Supletorio</button><button type="button" class="chip" data-condition="Con título">Con título</button><button type="button" class="chip" data-condition="Sin dato">Sin dato</button></div></div>',
  '    </section>',
  '    <section class="visible-card"><div><span>Parcelas visibles</span><strong id="visible-count">—</strong></div><small id="source-status">Conectando con IDECAM…</small></section>',
  '    <section id="parcel-detail" class="parcel-detail" hidden>',
  '      <div class="detail-head"><div><span class="detail-kicker">Parcela seleccionada</span><strong id="detail-condition"></strong></div><button id="detail-close" type="button" aria-label="Cerrar detalle">×</button></div>',
  '      <dl>',
  '        <div><dt>Nomenclatura</dt><dd id="detail-nc"></dd></div>',
  '        <div><dt>Departamento</dt><dd id="detail-dep"></dd></div>',
  '        <div><dt>Plano</dt><dd id="detail-plano"></dd></div>',
  '        <div><dt>SUPLETA</dt><dd id="detail-supleta"></dd></div>',
  '        <div><dt>Fuente</dt><dd id="detail-source"></dd></div>',
  '        <div class="detail-wide"><dt>Observación</dt><dd id="detail-obs"></dd></div>',
  '      </dl>',
  '    </section>',
  '    <section class="method-note"><strong>Criterio de lectura</strong><p><b>SUPLETA = 1</b> → Supletorio · <b>SUPLETA = 0</b> → Con título.</p><p>El mapa publica únicamente capas verificadas/subidas a IDECAM. El inventario crudo se usa para indicadores de avance.</p></section>',
  '    <footer><span>Proyecto Secano · CAM · IDECAM</span><span>Corte: octubre 2026</span></footer>',
  '  </aside>',
  '</main>'
].join("");

const map = new maplibregl.Map({
  container: "map",
  center: [-68.95, -35.2],
  zoom: 6.4,
  minZoom: 4,
  maxZoom: 19,
  style: {
    version: 8,
    sources: {
      osm: { type: "raster", tiles: ["https://tile.openstreetmap.org/{z}/{x}/{y}.png"], tileSize: 256, attribution: "© OpenStreetMap" },
      satellite: { type: "raster", tiles: ["https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"], tileSize: 256, attribution: "Tiles © Esri" }
    },
    layers: [
      { id: "osm", type: "raster", source: "osm" },
      { id: "satellite", type: "raster", source: "satellite", layout: { visibility: "none" } }
    ]
  }
});

map.addControl(new maplibregl.NavigationControl({ visualizePitch: false }), "top-right");
map.addControl(new maplibregl.ScaleControl({ unit: "metric" }), "bottom-right");

let allFeatures = [];
let filteredFeatures = [];
let selectedNc = null;
let departmentFilter = "all";
let conditionFilter = "all";
let isSatellite = false;
let parcelHtmlMarkers = [];
const polygonOverlay = document.querySelector("#parcel-outline-overlay");
let overlayScheduled = false;

map.on("load", async () => {
  addParcelLayers();
  await loadData();
});

async function loadData() {
  const status = document.querySelector("#source-status");
  const setFeatures = (features) => {
    allFeatures = features;
    const chips = document.querySelector("#department-chips");
    chips.replaceChildren();
    const all = document.createElement("button");
    all.type = "button";
    all.className = "chip active";
    all.dataset.department = "all";
    all.textContent = "Todos";
    chips.append(all);
    departmentFilter = "all";
    conditionFilter = "all";
    setActiveByValue("#condition-chips", "condition", "all");
    clearSelection();
    buildDepartmentFilters();
    applyFilters();
    fitAll();
    renderHtmlParcelMarkers();
  };

  let bundleFeatures = [];
  try {
    const bundle = await loadBundledVerifiedParcels();
    bundleFeatures = bundle.collection.features;
    setFeatures(bundleFeatures);
    status.textContent = bundleFeatures.length + " verificadas · respaldo cartográfico validado";
  } catch {
    status.textContent = "Cargando capas IDECAM (respaldo local no disponible)…";
  }

  try {
    const live = await loadVerifiedParcels();
    const features = live.collection.features;
    const baseNcs = new Set(bundleFeatures.map((feature) => feature.properties.nc));
    const liveNcs = new Set(features.map((feature) => feature.properties.nc));
    const complete = live.failures.length === 0 && features.length >= 205 &&
      [...baseNcs].every((nc) => liveNcs.has(nc));

    if (complete) {
      setFeatures(features);
      status.textContent = features.length + " verificadas · IDECAM WFS en vivo";
    } else if (bundleFeatures.length) {
      status.textContent = bundleFeatures.length + " verificadas · respaldo local; WFS incompleto o sin respuesta";
    } else if (features.length) {
      setFeatures(features);
      status.textContent = features.length + " cargadas parcialmente · faltan fuentes WFS";
    } else {
      status.textContent = "Sin cartografía disponible; no fue posible recuperar WFS ni respaldo.";
    }
  } catch {
    status.textContent = bundleFeatures.length
      ? bundleFeatures.length + " verificadas · respaldo local (WFS no disponible)"
      : "No se pudieron cargar las parcelas verificadas.";
  }
}

function addParcelLayers() {
  map.addSource("parcelas", { type: "geojson", data: emptyCollection(), promoteId: "nc" });

  map.addLayer({
    id: "parcelas-fill",
    type: "fill",
    source: "parcelas",
    paint: {
      "fill-color": ["match", ["get", "condicion"], "Supletorio", COLORS.supletorio, "Con título", COLORS.titulo, COLORS.sinDato],
      "fill-opacity": ["interpolate", ["linear"], ["zoom"], 5, 0.68, 10, 0.52, 16, 0.32]
    }
  });

  map.addLayer({
    id: "parcelas-line",
    type: "line",
    source: "parcelas",
    paint: {
      "line-color": "#a34c06",
      "line-width": ["interpolate", ["linear"], ["zoom"], 5, 1.8, 11, 2.2, 16, 2.6],
      "line-opacity": 0.88
    }
  });

  // Puntos de localización para distinguir parcelas pequeñas a escala regional.
  map.addSource("parcel-markers", {
    type: "geojson",
    data: emptyCollection(),
    cluster: true,
    clusterRadius: 36,
    clusterMaxZoom: 10
  });
  map.addLayer({
    id: "parcel-clusters",
    type: "circle",
    source: "parcel-markers",
    filter: ["has", "point_count"],
    maxzoom: 12,
    paint: {
      "circle-color": "#b45309",
      "circle-radius": ["step", ["get", "point_count"], 17, 10, 21, 35, 26],
      "circle-opacity": 0.9,
      "circle-stroke-width": 2.5,
      "circle-stroke-color": "#ffffff"
    }
  });
  map.addLayer({
    id: "parcel-dots",
    type: "circle",
    source: "parcel-markers",
    filter: ["!", ["has", "point_count"]],
    maxzoom: 12,
    paint: {
      "circle-color": "#e2a132",
      "circle-radius": ["interpolate", ["linear"], ["zoom"], 5, 5, 8, 7, 11, 9],
      "circle-stroke-width": 2,
      "circle-stroke-color": "#6b3508"
    }
  });
  map.on("click", "parcel-clusters", async (event) => {
    const cluster = event.features?.[0];
    if (!cluster) return;
    const id = cluster.properties.cluster_id;
    const zoom = await map.getSource("parcel-markers").getClusterExpansionZoom(id);
    map.easeTo({ center: cluster.geometry.coordinates, zoom: Math.min(zoom, 15), duration: 550 });
  });
  map.on("click", "parcel-dots", (event) => {
    const feature = event.features?.[0];
    if (feature?.properties?.nc) selectFeature(feature.properties.nc);
  });

  map.addLayer({
    id: "parcelas-selected",
    type: "line",
    source: "parcelas",
    filter: ["==", ["get", "nc"], "__none__"],
    paint: { "line-color": COLORS.highlight, "line-width": 4 }
  });

  map.on("click", "parcelas-fill", (event) => {
    const feature = event.features && event.features[0];
    if (feature) selectFeature(feature.properties.nc);
  });

  map.on("mouseenter", "parcelas-fill", () => { map.getCanvas().style.cursor = "pointer"; });
  map.on("mouseleave", "parcelas-fill", () => { map.getCanvas().style.cursor = ""; });
}

function applyFilters() {
  filteredFeatures = allFeatures.filter((feature) => {
    const p = feature.properties;
    const depOk = departmentFilter === "all" || p.departamento === departmentFilter;
    const condOk = conditionFilter === "all" || p.condicion === conditionFilter;
    return depOk && condOk;
  });

  const source = map.getSource("parcelas");
  if (source) source.setData({ type: "FeatureCollection", features: filteredFeatures });
  const markerSource = map.getSource("parcel-markers");
  if (markerSource) {
    const markers = filteredFeatures.map((feature) => {
      const bounds = featureBounds(feature);
      if (!bounds) return null;
      const [[minLon, minLat], [maxLon, maxLat]] = bounds;
      return { type: "Feature", properties: { nc: feature.properties.nc },
        geometry: { type: "Point", coordinates: [(minLon + maxLon) / 2, (minLat + maxLat) / 2] } };
    }).filter(Boolean);
    markerSource.setData({ type: "FeatureCollection", features: markers });
  }
  document.querySelector("#visible-count").textContent = filteredFeatures.length.toLocaleString("es-AR");
  renderHtmlParcelMarkers();
  schedulePolygonOverlay();

  if (selectedNc && !filteredFeatures.some((f) => f.properties.nc === selectedNc)) clearSelection();
}

// Respaldo visual independiente de la fuente GeoJSON de MapLibre.
// Cada marcador se ancla a una coordenada real derivada del polígono.
function renderHtmlParcelMarkers() {
  for (const marker of parcelHtmlMarkers) marker.remove();
  parcelHtmlMarkers = [];
  for (const feature of filteredFeatures) {
    const bounds = featureBounds(feature);
    if (!bounds) continue;
    const [[minX, minY], [maxX, maxY]] = bounds;
    const lng = (minX + maxX) / 2;
    const lat = (minY + maxY) / 2;
    if (![lng, lat].every(Number.isFinite)) continue;

    const button = document.createElement("button");
    button.type = "button";
    button.className = "parcel-pin";
    button.title = "Ver parcela " + feature.properties.nc;
    button.setAttribute("aria-label", "Ver parcela " + feature.properties.nc);
    button.addEventListener("click", (event) => {
      event.stopPropagation();
      selectFeature(feature.properties.nc);
    });
    parcelHtmlMarkers.push(new maplibregl.Marker({
      element: button, anchor: "center"
    }).setLngLat([lng, lat]).addTo(map));
  }
  updateHtmlMarkersVisibility();
}

function updateHtmlMarkersVisibility() {
  const zoom = map.getZoom();
  for (const marker of parcelHtmlMarkers) {
    marker.getElement().classList.toggle("pin-hidden", zoom >= 9.3);
  }
}

map.on("zoomend", updateHtmlMarkersVisibility);

// Superposición SVG anclada a la proyección cartográfica, independiente del render GeoJSON.
function schedulePolygonOverlay() {
  if (overlayScheduled) return;
  overlayScheduled = true;
  requestAnimationFrame(() => {
    overlayScheduled = false;
    renderPolygonOverlay();
  });
}

function renderPolygonOverlay() {
  const zoom = map.getZoom();
  polygonOverlay.replaceChildren();
  const visible = zoom >= 9.3;
  polygonOverlay.classList.toggle("overlay-active", visible);
  if (!visible) return;
  const viewportWidth = map.getCanvas().clientWidth;
  const viewportHeight = map.getCanvas().clientHeight;
  polygonOverlay.setAttribute("viewBox", "0 0 " + viewportWidth + " " + viewportHeight);
  for (const feature of filteredFeatures) {
    if (feature.geometry?.type !== "Polygon") continue;
    const bounds = featureBounds(feature);
    if (!bounds) continue;
    const p0 = map.project(bounds[0]), p1 = map.project(bounds[1]);
    if (Math.max(p0.x, p1.x) < -20 || Math.min(p0.x, p1.x) > viewportWidth + 20 ||
        Math.max(p0.y, p1.y) < -20 || Math.min(p0.y, p1.y) > viewportHeight + 20) continue;
    const parts = [];
    for (const ring of feature.geometry.coordinates) {
      if (!Array.isArray(ring) || ring.length < 4) continue;
      parts.push("M" + ring.map(([lon, lat]) => {
        const p = map.project([lon, lat]);
        return p.x.toFixed(1) + "," + p.y.toFixed(1);
      }).join("L") + "Z");
    }
    if (!parts.length) continue;
    const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
    path.setAttribute("d", parts.join(""));
    path.setAttribute("class", feature.properties.nc === selectedNc ? "parcel-svg selected" : "parcel-svg");
    path.setAttribute("fill-rule", "evenodd");
    path.addEventListener("click", (event) => { event.stopPropagation(); selectFeature(feature.properties.nc); });
    polygonOverlay.append(path);
  }
}
map.on("move", schedulePolygonOverlay);
map.on("resize", schedulePolygonOverlay);
map.on("zoom", schedulePolygonOverlay);

function buildDepartmentFilters() {
  const container = document.querySelector("#department-chips");
  const departments = [...new Set(allFeatures.map((f) => f.properties.departamento))].filter(Boolean).sort();
  for (const department of departments) {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "chip";
    button.dataset.department = department;
    button.textContent = department;
    container.append(button);
  }
}

function selectFeature(nc) {
  const feature = allFeatures.find((f) => f.properties.nc === nc);
  if (!feature) return;
  selectedNc = nc;
  map.setFilter("parcelas-selected", ["==", ["get", "nc"], nc]);
  fillDetail(feature.properties);
  schedulePolygonOverlay();
  document.querySelector("#parcel-detail").hidden = false;
  focusFeature(feature);
  openMobileSheet();
}

function fillDetail(p) {
  const condition = document.querySelector("#detail-condition");
  condition.textContent = p.condicion || "Sin dato";
  condition.dataset.condition = p.condicion || "Sin dato";
  document.querySelector("#detail-nc").textContent = formatNc(p.nc);
  document.querySelector("#detail-dep").textContent = p.departamento || "—";
  document.querySelector("#detail-plano").textContent = p.plano || "—";
  document.querySelector("#detail-supleta").textContent = p.supleta === 1 ? "1 · Supletorio" : p.supleta === 0 ? "0 · Con título" : "Sin dato";
  document.querySelector("#detail-source").textContent = p.periodo || "IDECAM";
  document.querySelector("#detail-obs").textContent = p.observacion || "Sin observaciones";
}

function clearSelection() {
  selectedNc = null;
  if (map.getLayer("parcelas-selected")) map.setFilter("parcelas-selected", ["==", ["get", "nc"], "__none__"]);
  document.querySelector("#parcel-detail").hidden = true;
}

function focusFeature(feature) {
  const bounds = featureBounds(feature);
  if (!bounds) return;
  map.fitBounds(bounds, {
    padding: window.innerWidth <= 780 ? { top: 100, bottom: 260, left: 40, right: 40 } : 80,
    maxZoom: 16,
    duration: 650
  });
}

function fitAll() {
  if (!allFeatures.length) return;
  const bounds = featuresBounds(allFeatures);
  if (!bounds) return;
  map.fitBounds(bounds, {
    padding: window.innerWidth <= 780 ? { top: 110, bottom: 180, left: 40, right: 40 } : 70,
    maxZoom: 8,
    duration: 700
  });
}

document.querySelector("#basemap-toggle").addEventListener("click", () => {
  isSatellite = !isSatellite;
  map.setLayoutProperty("osm", "visibility", isSatellite ? "none" : "visible");
  map.setLayoutProperty("satellite", "visibility", isSatellite ? "visible" : "none");
  document.querySelector("#basemap-toggle").textContent = isSatellite ? "Calles" : "Satélite";
});

document.querySelector("#fit-all").addEventListener("click", fitAll);
document.querySelector("#detail-close").addEventListener("click", clearSelection);

document.querySelector("#department-chips").addEventListener("click", (event) => {
  const button = event.target.closest("[data-department]");
  if (!button) return;
  departmentFilter = button.dataset.department;
  setActiveChip("#department-chips", button);
  applyFilters();
});

document.querySelector("#condition-chips").addEventListener("click", (event) => {
  const button = event.target.closest("[data-condition]");
  if (!button) return;
  conditionFilter = button.dataset.condition;
  setActiveChip("#condition-chips", button);
  applyFilters();
});

document.querySelector("#reset-filters").addEventListener("click", () => {
  departmentFilter = "all";
  conditionFilter = "all";
  setActiveByValue("#department-chips", "department", "all");
  setActiveByValue("#condition-chips", "condition", "all");
  document.querySelector("#parcel-search").value = "";
  hideSearchResults();
  applyFilters();
  fitAll();
});

const searchInput = document.querySelector("#parcel-search");
searchInput.addEventListener("input", () => {
  const query = normalizeSearch(searchInput.value);
  if (query.length < 2) {
    hideSearchResults();
    return;
  }
  const matches = allFeatures.filter((feature) => {
    const p = feature.properties;
    return normalizeSearch(p.nc).includes(query) ||
      normalizeSearch(p.plano).includes(query) ||
      normalizeSearch(p.departamento).includes(query);
  }).slice(0, 8);
  renderSearchResults(matches);
});

document.querySelector("#search-clear").addEventListener("click", () => {
  searchInput.value = "";
  hideSearchResults();
  searchInput.focus();
});

function renderSearchResults(features) {
  const container = document.querySelector("#search-results");
  container.replaceChildren();

  if (!features.length) {
    const empty = document.createElement("div");
    empty.className = "search-empty";
    empty.textContent = "Sin coincidencias";
    container.append(empty);
    container.hidden = false;
    return;
  }

  for (const feature of features) {
    const p = feature.properties;
    const button = document.createElement("button");
    button.type = "button";
    button.className = "search-result";

    const strong = document.createElement("strong");
    strong.textContent = formatNc(p.nc);
    const meta = document.createElement("span");
    meta.textContent = (p.departamento || "Sin departamento") + " · Plano " + (p.plano || "s/d");
    button.append(strong, meta);

    button.addEventListener("click", () => {
      searchInput.value = formatNc(p.nc);
      hideSearchResults();
      selectFeature(p.nc);
    });
    container.append(button);
  }

  container.hidden = false;
}

function hideSearchResults() {
  const container = document.querySelector("#search-results");
  container.hidden = true;
  container.replaceChildren();
}

function setActiveChip(containerSelector, activeButton) {
  document.querySelectorAll(containerSelector + " .chip").forEach((button) => {
    button.classList.toggle("active", button === activeButton);
  });
}

function setActiveByValue(containerSelector, key, value) {
  const buttons = document.querySelectorAll(containerSelector + " [data-" + key + "]");
  for (const button of buttons) {
    if (button.dataset[key] === value) {
      setActiveChip(containerSelector, button);
      break;
    }
  }
}

function normalizeSearch(value) {
  return String(value || "").toLowerCase().replace(/[^a-z0-9áéíóúñ]/g, "");
}

function formatNc(value) {
  const nc = String(value || "");
  return nc.length === 21
    ? nc.slice(0,2) + "-" + nc.slice(2,9) + "-" + nc.slice(9,16) + "-" + nc.slice(16)
    : nc;
}

function emptyCollection() {
  return { type: "FeatureCollection", features: [] };
}

function featuresBounds(features) {
  const coords = [];
  for (const feature of features) collectCoords(feature.geometry && feature.geometry.coordinates, coords);
  return boundsFromCoords(coords);
}

function featureBounds(feature) {
  const coords = [];
  collectCoords(feature.geometry && feature.geometry.coordinates, coords);
  return boundsFromCoords(coords);
}

function collectCoords(value, output) {
  if (!Array.isArray(value)) return;
  if (typeof value[0] === "number" && typeof value[1] === "number") {
    output.push(value);
    return;
  }
  for (const child of value) collectCoords(child, output);
}

function boundsFromCoords(coords) {
  if (!coords.length) return null;
  return coords.reduce((bounds, point) => {
    const x = point[0], y = point[1];
    return [
      [Math.min(bounds[0][0], x), Math.min(bounds[0][1], y)],
      [Math.max(bounds[1][0], x), Math.max(bounds[1][1], y)]
    ];
  }, [[Infinity, Infinity], [-Infinity, -Infinity]]);
}

const panel = document.querySelector("#panel");
const sheetHandle = document.querySelector("#sheet-handle");
let mobileExpanded = false;

sheetHandle.addEventListener("click", () => {
  mobileExpanded = !mobileExpanded;
  panel.classList.toggle("expanded", mobileExpanded);
});

function openMobileSheet() {
  if (window.matchMedia("(max-width: 780px)").matches) {
    mobileExpanded = true;
    panel.classList.add("expanded");
  }
}

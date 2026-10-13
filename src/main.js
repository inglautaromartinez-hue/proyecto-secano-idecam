import * as maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import { COLORS } from "./config.js";
import { conditionClass } from "./condition-theme.js";
import { loadVerifiedParcels } from "./services/wfs.js";
import { loadAllParcels } from "./services/all-parcels.js";
import "./styles.css";

const app = document.querySelector("#app");

app.innerHTML = [
  '<main class="app-shell">',
  '  <section class="map-stage" aria-label="Mapa Proyecto Secano">',
  '    <div id="map"></div>',
  '    <svg id="parcel-outline-overlay" class="parcel-outline-overlay" aria-label="Límites de parcelas al acercar el mapa"></svg>',
  '    <div class="top-brand">',
  '      <div><span class="brand-kicker">IDECAM · Colegio de Agrimensura de Mendoza</span><h1>Proyecto Secano</h1></div>',
  '      <span class="live-pill"><i></i> 500 parcelas relevadas</span>',
  '    </div>',
  '    <div class="map-tools">',
  '      <button id="basemap-toggle" type="button">Satélite</button>',
  '      <button id="fit-all" type="button">Encuadrar</button>',
  '    </div>',
  '    <div class="map-legend">',
  '      <strong>Condición</strong>',
  '      <span><i style="--legend:#d97706"></i>Supletorio</span>',
  '      <span><i style="--legend:#2563eb"></i>Con título</span>',
  '    </div>',
  '  </section>',
  '  <aside class="panel" id="panel">',
  '    <button class="sheet-handle" id="sheet-handle" type="button" aria-label="Expandir o contraer panel"><span></span></button>',
  '    <section class="panel-hero">',
  '      <p class="eyebrow">PROYECTO SECANO · 2026</p>',
  '      <h2>Base parcelaria del secano</h2>',
  '      <p>Cartografía parcelaria y cobertura territorial del secano mendocino.</p>',
  '    </section>',
  '    <section class="progress-card">',
  '      <div class="progress-head"><div><span>Parcelas relevadas</span><strong id="dashboard-count">500</strong></div><small id="dashboard-scope">Cobertura total del proyecto</small></div>',
  '      <div class="progress-grid two-stat"><div><strong id="stat-supletorio">207</strong><span>Supletorias</span></div><div><strong id="stat-titulo">293</strong><span>Con título</span></div></div>',
  '    </section>',
    '    <section class="condition-chart" aria-label="Condición de parcelas filtradas">',
  '      <div class="section-title"><span>Condición parcelaria</span><small id="chart-subtitle">500 parcelas</small></div>',
  '      <div class="chart-body"><div id="condition-donut" class="donut" role="img" aria-label="Condiciones de las parcelas visibles"><span><strong id="donut-total">500</strong><small>parcelas</small></span></div>',
  '        <div class="chart-labels"><div><i class="chart-dot supletorio"></i><span>Supletorio</span><b id="chart-supletorio">207</b></div><div><i class="chart-dot titulo"></i><span>Con título</span><b id="chart-titulo">293</b></div></div></div>',
  '    </section>',
  '    <section class="monthly-card institutional-area area-card" aria-label="Superficie cartografiada del secano">',
  '      <div class="area-card-header">',
  '        <div class="area-card-heading"><span class="area-card-symbol" aria-hidden="true">↗</span><div><span class="area-card-kicker">COBERTURA TERRITORIAL</span><h3>Superficie secano dibujada</h3></div></div>',
  '        <span class="area-card-unit">HECTÁREAS</span>',
  '      </div>',
  '      <div class="area-card-value"><strong class="monthly-total" id="dashboard-area" aria-live="polite">—</strong><span class="area-card-value-unit">ha</span></div>',
  '      <p class="monthly-subtitle">Superficie geométrica de las parcelas relevadas que cumplen los filtros seleccionados.</p>',
  '      <div class="area-share-head"><span>Participación en superficie relevada</span><strong id="area-share">100%</strong></div>',
  '      <div class="area-share-track" role="presentation"><span id="area-share-bar" style="width:100%"></span></div>',
  '      <div class="coverage-row"><span id="area-count">500 parcelas con superficie</span><b id="area-location">Cobertura territorial</b></div>',
  '    </section>',
'    <section class="search-section">',
  '      <label for="parcel-search">Buscar parcela o plano</label>',
  '      <div class="search-row"><input id="parcel-search" type="search" placeholder="Nomenclatura o Nº de plano" autocomplete="off"><button id="search-clear" type="button" aria-label="Limpiar búsqueda">×</button></div>',
  '      <div id="search-results" class="search-results" hidden></div>',
  '    </section>',
  '    <section class="filters">',
  '      <div class="section-title"><span>Filtros</span><button id="reset-filters" type="button">Restablecer</button></div>',
  '      <div class="filter-block"><span class="filter-label">Departamento</span><div class="chips" id="department-chips"><button type="button" class="chip active" data-department="all">Todos</button></div></div>',
  '      <div class="filter-block"><span class="filter-label">Condición</span><div class="chips" id="condition-chips"><button type="button" class="chip active" data-condition="all">Todas</button><button type="button" class="chip" data-condition="Supletorio">Supletorio</button><button type="button" class="chip" data-condition="Con título">Con título</button></div></div>',
  '    </section>',
  '    <section class="visible-card"><div><span>Parcelas en el mapa</span><strong id="visible-count">—</strong></div><small id="source-status">Cargando cartografía…</small></section>',
  '    <p id="empty-filter-note" class="empty-filter-note" hidden>No hay parcelas disponibles con estos filtros. Probá otra opción.</p>',
  '    <section id="parcel-detail" class="parcel-detail" hidden>',
  '      <div class="detail-head"><div><span class="detail-kicker">Parcela seleccionada</span><strong id="detail-condition"></strong></div><button id="detail-close" type="button" aria-label="Cerrar detalle">×</button></div>',
  '      <dl>',
  '        <div><dt>Nomenclatura</dt><dd id="detail-nc"></dd></div>',
  '        <div><dt>Superficie</dt><dd id="detail-area"></dd></div>',
  '        <div><dt>Plano</dt><dd id="detail-plano"></dd></div>',



  '      </dl>',
  '    </section>',
  '    <footer><span>Proyecto Secano · CAM · IDECAM</span><span>Consolidación cartográfica · 2026</span></footer>',
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
let activeParcelPopup = null;
let totalCatalogAreaHa = 0;
const polygonOverlay = document.querySelector("#parcel-outline-overlay");
let overlayScheduled = false;

map.on("load", async () => {
  addParcelLayers();
  await loadData();
});

async function loadData() {
  const status=document.querySelector("#source-status");
  try {
    const result=await loadAllParcels();
    allFeatures=result.collection.features;
    totalCatalogAreaHa = allFeatures.reduce((sum, feature) => sum + (parcelAreaHectares(feature.geometry) ?? 0), 0);
    const chips=document.querySelector("#department-chips");
    chips.replaceChildren();
    const all=document.createElement("button");
    all.type="button";all.className="chip active";all.dataset.department="all";all.textContent="Todos";
    chips.append(all);
    buildDepartmentFilters();
    applyFilters();
    fitAll();
    status.textContent="Cartografía del Proyecto Secano · 500 parcelas relevadas";
  } catch (error) {
    console.error("Carga Secano 500",error);
    status.textContent="No se pudo cargar el parcelario completo; reintentá actualizando la página.";
  }
}

function addParcelLayers() {
  map.addSource("parcelas", { type: "geojson", data: emptyCollection(), promoteId: "nc" });

  map.addLayer({
    id: "parcelas-fill",
    type: "fill",
    source: "parcelas",
    paint: {
      "fill-color": ["match", ["get", "condicion"], "Supletorio", COLORS.supletorio, "Con título", COLORS.titulo, COLORS.titulo],
      "fill-opacity": ["interpolate", ["linear"], ["zoom"], 5, 0.68, 10, 0.52, 16, 0.32]
    }
  });

  map.addLayer({
    id: "parcelas-line",
    type: "line",
    source: "parcelas",
    paint: {
      "line-color": ["match", ["get", "condicion"], "Supletorio", "#92400e", "Con título", "#1d4ed8", "#1d4ed8"],
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
      "circle-color": "#35556d",
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
      "circle-color": ["match", ["get", "condicion"], "Supletorio", "#f59e0b", "Con título", "#3b82f6", "#3b82f6"],
      "circle-radius": ["interpolate", ["linear"], ["zoom"], 5, 5, 8, 7, 11, 9],
      "circle-stroke-width": 2,
      "circle-stroke-color": ["match", ["get", "condicion"], "Supletorio", "#92400e", "Con título", "#1d4ed8", "#1d4ed8"]
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
      return { type: "Feature", properties: { nc: feature.properties.nc, condicion: feature.properties.condicion },
        geometry: { type: "Point", coordinates: [(minLon + maxLon) / 2, (minLat + maxLat) / 2] } };
    }).filter(Boolean);
    markerSource.setData({ type: "FeatureCollection", features: markers });
  }
  document.querySelector("#visible-count").textContent = filteredFeatures.length.toLocaleString("es-AR");
  updateDashboard();
  document.querySelector("#empty-filter-note").hidden = filteredFeatures.length !== 0;
  renderHtmlParcelMarkers();
  schedulePolygonOverlay();

  if (selectedNc && !filteredFeatures.some((f) => f.properties.nc === selectedNc)) clearSelection();
}

function updateDashboard() {
  const count = filteredFeatures.length;
  let supletorio = 0;
  let totalHa = 0;
  let areaCount = 0;
  const deps = new Set();
  for (const feature of filteredFeatures) {
    if (feature.properties.condicion === "Supletorio") supletorio++;
    deps.add(feature.properties.departamento);
    const ha = parcelAreaHectares(feature.geometry);
    if (ha !== null && Number.isFinite(ha)) { totalHa += ha; areaCount++; }
  }
  const titulo = count - supletorio;
  const fmt = (n) => n.toLocaleString("es-AR");
  const pct = (n) => count ? (n * 100 / count).toLocaleString("es-AR", {maximumFractionDigits:1}) + "%" : "0%";
  document.querySelector("#dashboard-count").textContent = fmt(count);
  document.querySelector("#dashboard-scope").textContent = departmentFilter === "all" ? "Cobertura del proyecto" : departmentFilter;
  document.querySelector("#stat-supletorio").textContent = fmt(supletorio);
  document.querySelector("#stat-titulo").textContent = fmt(titulo);
  document.querySelector("#donut-total").textContent = fmt(count);
  document.querySelector("#chart-subtitle").textContent = fmt(count) + " parcelas";
  document.querySelector("#chart-supletorio").textContent = fmt(supletorio) + " · " + pct(supletorio);
  document.querySelector("#chart-titulo").textContent = fmt(titulo) + " · " + pct(titulo);
  document.querySelector("#condition-donut").style.background =
    count ? "conic-gradient(#d97706 0 " + (100 * supletorio/count) +
      "%, #2563eb " + (100 * supletorio/count) + "% 100%)" : "#dfe9e5";
  document.querySelector("#dashboard-area").textContent =
    totalHa.toLocaleString("es-AR", {maximumFractionDigits:0});
  const areaShare = totalCatalogAreaHa > 0 ? Math.max(0, Math.min(100, (totalHa / totalCatalogAreaHa) * 100)) : 0;
  document.querySelector("#area-share").textContent = areaShare.toLocaleString("es-AR", {
    maximumFractionDigits:1
  }) + "%";
  document.querySelector("#area-share-bar").style.width = areaShare + "%";
  document.querySelector("#area-count").textContent = fmt(areaCount) + " parcelas con superficie";
  document.querySelector("#area-location").textContent = deps.size === 1 ? [...deps][0] : "Cobertura territorial";
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
    button.className = "parcel-pin " + conditionClass(feature.properties.condicion);
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
    if (!["Polygon", "MultiPolygon"].includes(feature.geometry?.type)) continue;
    const bounds = featureBounds(feature);
    if (!bounds) continue;
    const p0 = map.project(bounds[0]), p1 = map.project(bounds[1]);
    if (Math.max(p0.x, p1.x) < -20 || Math.min(p0.x, p1.x) > viewportWidth + 20 ||
        Math.max(p0.y, p1.y) < -20 || Math.min(p0.y, p1.y) > viewportHeight + 20) continue;
    const parts = [];
    const polygons = feature.geometry.type === "Polygon" ? [feature.geometry.coordinates] : feature.geometry.coordinates;
    for (const polygon of polygons) for (const ring of polygon) {
      if (!Array.isArray(ring) || ring.length < 4) continue;
      parts.push("M" + ring.map(([lon, lat]) => {
        const p = map.project([lon, lat]);
        return p.x.toFixed(1) + "," + p.y.toFixed(1);
      }).join("L") + "Z");
    }
    if (!parts.length) continue;
    const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
    path.setAttribute("d", parts.join(""));
    path.setAttribute("class", "parcel-svg " + conditionClass(feature.properties.condicion) + (feature.properties.nc === selectedNc ? " selected" : ""));
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
  const area = parcelAreaHectares(feature.geometry);
  feature.properties.superficieDisplay = area === null ? "Sin superficie disponible" :
    area.toLocaleString("es-AR", { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + " ha";
  fillDetail(feature.properties);
  showParcelPopup(feature, area);
  schedulePolygonOverlay();
  document.querySelector("#parcel-detail").hidden = false;
  focusFeature(feature);
  openMobileSheet();
}

function fillDetail(p) {
  const condition = document.querySelector("#detail-condition");
  condition.textContent = p.condicion || "Con título";
  condition.dataset.condition = p.condicion || "Con título";
  document.querySelector("#detail-nc").textContent = formatNc(p.nc);
  document.querySelector("#detail-area").textContent = p.superficieDisplay || "No disponible";
  document.querySelector("#detail-plano").textContent = p.plano || "—";



}

function clearSelection() {
  if (activeParcelPopup) { activeParcelPopup.remove(); activeParcelPopup = null; }
  selectedNc = null;
  if (map.getLayer("parcelas-selected")) map.setFilter("parcelas-selected", ["==", ["get", "nc"], "__none__"]);
  document.querySelector("#parcel-detail").hidden = true;
}

// Área esférica WGS84 en hectáreas calculada desde el polígono; no sustituye mensura oficial.
export function parcelAreaHectares(geometry) {
  if (!geometry || !["Polygon", "MultiPolygon"].includes(geometry.type)) return null;
  const polygons = geometry.type === "Polygon" ? [geometry.coordinates] : geometry.coordinates;
  const radius = 6378137;
  const rad = Math.PI / 180;
  const ringArea = (ring) => {
    let sum = 0;
    for (let i = 0; i < ring.length; i++) {
      const a = ring[i], b = ring[(i + 1) % ring.length];
      if (![...a, ...b].every(Number.isFinite)) return NaN;
      sum += (b[0] - a[0]) * rad * (2 + Math.sin(a[1] * rad) + Math.sin(b[1] * rad));
    }
    return Math.abs(sum * radius * radius / 2);
  };
  let total = 0;
  for (const poly of polygons) {
    if (!Array.isArray(poly) || !poly.length) return null;
    let area = ringArea(poly[0]);
    for (const hole of poly.slice(1)) area -= ringArea(hole);
    if (!Number.isFinite(area) || area < 0) return null;
    total += area;
  }
  return total / 10000;
}

function showParcelPopup(feature, area) {
  if (activeParcelPopup) activeParcelPopup.remove();
  const bounds = featureBounds(feature);
  if (!bounds) return;
  const center = [(bounds[0][0] + bounds[1][0]) / 2, (bounds[0][1] + bounds[1][1]) / 2];
  const container = document.createElement("div");
  container.className = "parcel-popup-content";
  const fields = [
    ["Nomenclatura", formatNc(feature.properties.nc)],
    ["Nº de plano", feature.properties.plano || "No disponible"],
    ["Superficie", area === null ? "No disponible" : area.toLocaleString("es-AR", {
      minimumFractionDigits: 2, maximumFractionDigits: 2
    }) + " ha"]
  ];
  for (const [label, value] of fields) {
    const row = document.createElement("div");
    const dt = document.createElement("span");
    dt.textContent = label;
    const dd = document.createElement("strong");
    dd.textContent = value;
    row.append(dt, dd);
    container.append(row);
  }
  activeParcelPopup = new maplibregl.Popup({ offset: 14, closeOnMove: false, maxWidth: "280px" })
    .setLngLat(center).setDOMContent(container).addTo(map);
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

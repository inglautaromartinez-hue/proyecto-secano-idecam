import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const main = readFileSync(new URL("../src/main.js", import.meta.url), "utf8");
const css = readFileSync(new URL("../src/styles.css", import.meta.url), "utf8");

test("ficha parcelaria preserva tres campos y render seguro", () => {
  const start = main.indexOf("function showParcelPopup(");
  const end = main.indexOf("function focusFeature(", start);
  assert.ok(start >= 0 && end > start);
  const popup = main.slice(start, end);
  assert.match(popup, /\["Nomenclatura"/);
  assert.match(popup, /\["Nº de plano"/);
  assert.match(popup, /\["Superficie"/);
  assert.match(popup, /setDOMContent\(container\)/);
  assert.match(popup, /className: "parcel-info-popup"/);
  assert.match(popup, /anchor: "bottom"/);
});

test("popup está por encima de capa SVG y tiene tratamiento mobile", () => {
  assert.match(css, /\.parcel-outline-overlay\s*\{[^}]*z-index:\s*4/s);
  assert.match(css, /#map \.maplibregl-popup\.parcel-info-popup\s*\{[^}]*z-index:\s*60/s);
  assert.match(css, /@media\s*\(max-width:780px\)[\s\S]*#map \.parcel-info-popup/);
});

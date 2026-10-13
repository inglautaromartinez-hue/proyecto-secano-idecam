import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { conditionClass } from "../src/condition-theme.js";
import { COLORS } from "../src/config.js";

const main = readFileSync(new URL("../src/main.js", import.meta.url), "utf8");
const css = readFileSync(new URL("../src/styles.css", import.meta.url), "utf8");

test("naranja para supletorios y azul para con título", () => {
  assert.equal(COLORS.supletorio, "#d97706");
  assert.equal(COLORS.titulo, "#2563eb");
  assert.equal(conditionClass("Supletorio"), "supletorio");
  assert.equal(conditionClass("Con título"), "titulo");
  assert.match(css, /\.parcel-pin\.supletorio/);
  assert.match(css, /\.parcel-pin\.titulo/);
  assert.match(css, /\.parcel-svg\.supletorio/);
  assert.match(css, /\.parcel-svg\.titulo/);
  assert.match(main, /conditionClass\(feature\.properties\.condicion\)/);
});

test("dashboard de superficie mantiene dato y porcentaje ligados al filtro", () => {
  assert.match(main, /id="dashboard-area"/);
  assert.match(main, /id="area-share"/);
  assert.match(main, /id="area-share-bar"/);
  assert.match(main, /updateDashboard\(\)/);
  assert.match(main, /totalHa \/ totalCatalogAreaHa/);
  assert.match(main, /totalCatalogAreaHa = allFeatures\.reduce/);
});

test("seleccionar parcela no abre automáticamente el panel mobile", () => {
  const select = main.slice(main.indexOf("function selectFeature("), main.indexOf("function fillDetail("));
  assert.doesNotMatch(select, /openMobileSheet\(|setMobileSheetExpanded\(true\)/);
  assert.match(main, /sheetHandle\.addEventListener\("pointermove"/);
  assert.match(main, /sheetHandle\.addEventListener\("click"/);
  assert.match(main, /setMobileSheetExpanded\(delta < 0\)/);
});

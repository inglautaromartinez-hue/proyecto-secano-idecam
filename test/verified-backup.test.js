import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { loadBundledVerifiedParcels } from "../src/services/verified-backup.js";

test("respaldo validado contiene 205 NC únicas, geometrías WGS84 y condición supletoria", async () => {
  const result = await loadBundledVerifiedParcels({
    fetchImpl: async (url) => new Response(
      readFileSync(new URL("../public" + url, import.meta.url)),
      { status: 200 }
    )
  });

  const features = result.collection.features;
  assert.equal(features.length, 205);
  assert.equal(new Set(features.map((f) => f.properties.nc)).size, 205);
  assert.deepEqual(
    features.reduce((acc, f) => {
      const dep = f.properties.departamento;
      acc[dep] = (acc[dep] || 0) + 1;
      return acc;
    }, {}),
    { "San Rafael": 109, "Malargüe": 96 }
  );

  for (const feature of features) {
    assert.equal(feature.properties.supleta, 1);
    assert.equal(feature.properties.condicion, "Supletorio");
    assert.equal(feature.geometry.type, "Polygon");
    for (const ring of feature.geometry.coordinates) {
      assert.ok(ring.length >= 4);
      assert.deepEqual(ring.at(0), ring.at(-1));
      for (const [lon, lat] of ring) {
        assert.ok(lon > -75 && lon < -63);
        assert.ok(lat > -40 && lat < -28);
      }
    }
  }
});

test("no acepta respaldo truncado o con archivos faltantes", async () => {
  await assert.rejects(loadBundledVerifiedParcels({
    fetchImpl: async (url) => url.endsWith("chunk-2.txt")
      ? new Response("", { status: 404 })
      : new Response("broken", { status: 200 })
  }), /VERIFIED_BUNDLE/);
});

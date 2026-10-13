import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { loadAllParcels } from "../src/services/all-parcels.js";

test("universo Secano: 500 NC únicas, 205 verificadas y estados completos", async () => {
  const bundle=readFileSync(new URL("../public/secano-all-500.b64.txt",import.meta.url));
  const result=await loadAllParcels({fetchImpl:async()=>new Response(bundle,{status:200})});
  const features=result.collection.features;
  assert.equal(features.length,500);
  assert.equal(new Set(features.map(f=>f.properties.nc)).size,500);
  assert.equal(features.filter(f=>f.properties.verificada).length,205);
  assert.equal(features.filter(f=>!f.properties.verificada).length,295);
  assert.equal(features.filter(f=>f.geometry.type==="Point").length,1);
  assert.equal(features.filter(f=>["Polygon","MultiPolygon"].includes(f.geometry.type)).length,499);
  assert.deepEqual(
    [1,0,null].map(v=>features.filter(f=>f.properties.supleta===v).length),
    [207,216,77]
  );
});
test("no publica datos incompletos",async()=>{
  await assert.rejects(loadAllParcels({
    fetchImpl:async()=>new Response("not-valid",{status:200})
  }),/SECANO_500/);
});

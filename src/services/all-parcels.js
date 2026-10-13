import { DEPARTMENT_NAMES } from "../config.js";

const EXPECTED_COUNT = 500;
const DATA_URL = "/secano-all-500.b64.txt";
function decodeGeometry(polygons) {
  const coords=polygons.map(poly=>poly.map(ring=>ring.map(([x,y])=>[x/1000000,y/1000000])));
  if(coords.length===1)return {type:"Polygon",coordinates:coords[0]};
  return {type:"MultiPolygon",coordinates:coords};
}

export async function loadAllParcels({ fetchImpl=fetch }={}) {
  const response=await fetchImpl(DATA_URL);
  if(!response.ok)throw new Error("SECANO_500_DATA_HTTP_"+response.status);
  const text=(await response.text()).trim();
  if(!/^[A-Za-z0-9+/=]+$/.test(text))throw new Error("SECANO_500_BUNDLE_INVALID");
  if(typeof DecompressionStream!=="function")throw new Error("GZIP_UNSUPPORTED");
  const data=Uint8Array.from(atob(text),c=>c.charCodeAt(0));
  const stream=new Blob([data]).stream().pipeThrough(new DecompressionStream("gzip"));
  const rows=JSON.parse(await new Response(stream).text());
  if(!Array.isArray(rows)||rows.length!==EXPECTED_COUNT)throw new Error("SECANO_500_COUNT_MISMATCH");
  const seen=new Set();
  const features=rows.map((row)=>{
    const [nc,plano,supleta,verified,polygons,point]=row;
    if(typeof nc!=="string"||!/^\d{16,21}$/.test(nc)||seen.has(nc))throw new Error("SECANO_500_NC_INVALID");
    seen.add(nc);
    if(![0,1,null].includes(supleta)||![0,1].includes(verified))throw new Error("SECANO_500_ATTRIBUTES_INVALID");
    const geometry=polygons?.length?decodeGeometry(polygons):
      point?.length===2?{type:"Point",coordinates:point.map(x=>x/1000000)}:null;
    if(!geometry)throw new Error("SECANO_500_GEOMETRY_MISSING");
    const condition=supleta===1?"Supletorio":"Con título";
    const department=DEPARTMENT_NAMES[nc.slice(0,2)]||"Departamento "+nc.slice(0,2);
    return {type:"Feature",id:nc,geometry,properties:{
      nc,plano:String(plano||""),supleta,condicion:condition,departamento:department,
      estado:verified?"Verificada":"En proceso",verificada:Boolean(verified),
      periodo:"Proyecto Secano",fuenteWfs:"Relevamiento parcelario del Proyecto Secano",
      observacion:geometry.type==="Point"?"Geometría de origen incompleta: localización puntual solamente.":null
    }};
  });
  if(features.filter(f=>f.properties.verificada).length!==205)throw new Error("SECANO_500_VERIFIED_MISMATCH");
  return {collection:{type:"FeatureCollection",features},count:features.length};
}

// Test-only HTTP fixtures for browser flows. Database/RLS enforcement is tested separately in PostgreSQL.
import { createServer } from "node:http";
import { randomUUID, createHmac } from "node:crypto";

const userId = "00000000-0000-0000-0000-000000000001";
const partnerId = "00000000-0000-0000-0000-000000000002";
const tripId = "10000000-0000-0000-0000-000000000001";
const user = { id: userId,aud: "authenticated",role: "authenticated",email: "partner@example.test",app_metadata: { provider: "email",providers: ["email"] },user_metadata: {},created_at: "2026-01-01T00:00:00Z" };
const timestamp = "2026-10-23T00:00:00Z";
const future = new Date();future.setUTCDate(future.getUTCDate() + 30);
const start = future.toISOString().slice(0,10);future.setUTCDate(future.getUTCDate() + 3);
const base = { created_by: userId,created_at: timestamp,updated_at: timestamp,revision: 0 };
let tables;
let files;
let authRequests = 0;
function reset() {
  authRequests = 0;
  files = new Map();
  tables = {
    private_pair: [{ id: true,person_one: userId,person_two: partnerId,name_one: "Test Partner A",name_two: "Test Partner B" }],
    trips: [{ ...base,id: tripId,title: "Our seaside days",destination: "Test coast",start_date: start,end_date: future.toISOString().slice(0,10),timezone: "Asia/Tokyo",description: "Slow mornings and a little wandering.",status: "upcoming",cover_photo_id: null }],
    trip_activities: [],travel_bucket_items: [],travel_memories: [],travel_photos: [],travel_expenses: [],photo_cleanup: [],
  };
}
reset();
function token() {
  const encode = value => Buffer.from(JSON.stringify(value)).toString("base64url");
  const raw = `${encode({ alg: "HS256",typ: "JWT" })}.${encode({ sub: userId,aud: "authenticated",role: "authenticated",email: user.email,exp: Math.floor(Date.now()/1000) + 3600,iat: Math.floor(Date.now()/1000),iss: "http://127.0.0.1:55439/auth/v1" })}`;
  return `${raw}.${createHmac("sha256","browser-fixture-only").update(raw).digest("base64url")}`;
}
function selected(row,query) {
  return [...query].every(([key,value]) => {
    if (["select","order","limit","offset"].includes(key)) return true;
    const [operator,...rest] = value.split(".");const expected = rest.join(".");
    if (operator === "eq") return String(row[key]) === expected;
    if (operator === "is") return expected === "null" ? row[key] == null : String(row[key]) === expected;
    if (operator === "lt") return row[key] < expected;
    if (operator === "in") return expected.slice(1,-1).split(",").includes(row[key]);
    return true;
  });
}
createServer(async (request,response) => {
  response.setHeader("X-Supabase-Api-Version","2024-01-01");
  response.setHeader("Access-Control-Allow-Origin","http://127.0.0.1:3108");
  response.setHeader("Access-Control-Allow-Headers","authorization,apikey,content-type,x-client-info,x-supabase-api-version,prefer");
  response.setHeader("Access-Control-Allow-Methods","GET,POST,PATCH,DELETE,OPTIONS");
  const send = (value,status = 200) => { response.statusCode = status;response.setHeader("Content-Type","application/json");response.end(JSON.stringify(value)); };
  if (request.method === "OPTIONS") { response.end();return; }
  const url = new URL(request.url,"http://127.0.0.1:55439");
  const chunks = [];for await (const chunk of request) chunks.push(chunk);
  const buffer = Buffer.concat(chunks);
  let body = {};try { body = JSON.parse(buffer.toString() || "{}"); } catch { /* Binary photo upload. */ }
  if (url.pathname === "/health") return send({ ok: true });
  if (url.pathname === "/__reset") { reset();return send({ ok: true }); }
  if (url.pathname === "/__auth-requests") {
    if (request.method === "DELETE") authRequests = 0;
    return send({ count: authRequests });
  }
  if (url.pathname.startsWith("/auth/v1/")) authRequests++;
  if (url.pathname === "/auth/v1/token") {
    if (body.email === "unconfirmed@example.test") return send({ code: "email_not_confirmed",message: "Email not confirmed" },400);
    if (body.password !== "fixture-password") return send({ code: "invalid_credentials",message: "Invalid login credentials" },400);
    return send({ access_token: token(),token_type: "bearer",expires_in: 3600,refresh_token: "fixture-only",user });
  }
  if (url.pathname === "/auth/v1/user") return send(user);
  if (url.pathname === "/auth/v1/logout") return send({});
  if (url.pathname === "/auth/v1/.well-known/jwks.json") return send({ keys: [] });
  if (url.pathname.startsWith("/storage/v1/object/sign/") && request.method === "POST") {
    const bucket = url.pathname.split("/")[5];
    return send(body.paths.map(path => ({ path,signedURL: `/object/sign/${bucket}/${path}?token=fixture`,error: null })));
  }
  if (url.pathname.startsWith("/storage/v1/object/")) {
    const path = url.pathname.replace("/storage/v1/object/","").replace(/^sign\//,"");
    if (request.method === "POST") { files.set(path,buffer);return send({ Key: path }); }
    if (request.method === "DELETE") { for (const prefix of body.prefixes ?? []) files.delete(`travel-photos/${prefix}`);return send([]); }
    if (request.method === "GET") { response.setHeader("Content-Type","image/png");response.end(files.get(path.split("?")[0]) ?? Buffer.from("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+jB1cAAAAASUVORK5CYII=","base64"));return; }
  }
  if (url.pathname === "/rest/v1/rpc/is_pair_member") return send(true);
  if (url.pathname === "/rest/v1/rpc/convert_bucket_item") {
    const item = tables.travel_bucket_items.find(row => row.id === body.item_id);
    if (!item.activity_id) {
      item.activity_id = randomUUID();item.trip_id = body.target_trip;item.status = "planned";item.revision++;
      tables.trip_activities.push({ ...base,id: item.activity_id,trip_id: item.trip_id,date: body.target_date,start_time: null,title: item.title,location: item.destination,description: item.description,notes: "",estimated_cost: null,currency: null,completed: false,sort_order: 0 });
    }
    return send(item.activity_id);
  }
  const table = tables[url.pathname.replace("/rest/v1/","")];
  if (!table) return send({ message: "Unknown test fixture endpoint",path: url.pathname },404);
  let rows = table.filter(row => selected(row,url.searchParams));
  if (request.method === "POST") {
    const defaults = { ...base,id: randomUUID(),description: "",destination: "",location: "",notes: "",start_time: null,estimated_cost: null,currency: null,completed: false,sort_order: 0,trip_id: null,activity_id: null,ready: false,cover_photo_id: null };
    rows = [{ ...defaults,...body }];table.push(...rows);
  } else if (request.method === "PATCH") for (const row of rows) Object.assign(row,body,{ revision: row.revision + 1 });
  else if (request.method === "DELETE") {
    for (const row of rows) {
      table.splice(table.indexOf(row),1);
      if (url.pathname.endsWith("/trips")) for (const [name,children] of Object.entries(tables)) if (name !== "trips") tables[name] = children.filter(child => child.trip_id !== row.id);
    }
  }
  const order = url.searchParams.get("order");
  if (order) rows.sort((a,b) => {
    for (const part of order.split(",")) { const [key,dir] = part.split(".");const n = String(a[key] ?? "zzzz").localeCompare(String(b[key] ?? "zzzz"));if(n) return dir === "desc" ? -n : n; }return 0;
  });
  if (url.searchParams.has("limit")) rows = rows.slice(0,Number(url.searchParams.get("limit")));
  return send(request.headers.accept?.includes("application/vnd.pgrst.object+json") ? rows[0] ?? null : rows);
}).listen(55439,"127.0.0.1");

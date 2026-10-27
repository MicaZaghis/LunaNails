import { getStore } from "@netlify/blobs";
import { CFG } from "./config.mjs";
export const config = { path: "/api/*" };
const J = (d, s = 200) => new Response(JSON.stringify(d), { status: s, headers: { "content-type": "application/json" } });
const ar = () => { const p = Object.fromEntries(new Intl.DateTimeFormat("en-CA", { timeZone: "America/Argentina/Buenos_Aires", year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", hourCycle: "h23" }).formatToParts(new Date()).map(x => [x.type, x.value])); return { d: `${p.year}-${p.month}-${p.day}`, h: +p.hour }; };
const addDays = (d, n) => new Date(new Date(d + "T12:00:00Z").getTime() + n * 864e5).toISOString().slice(0, 10);
const dow = d => new Date(d + "T12:00:00Z").getUTCDay();
const sk = (d, t) => `s:${d}_${String(t).padStart(2, "0")}`;
const okSlot = (date, time) => { const n = ar(); if (!/^\d{4}-\d\d-\d\d$/.test(date || "")) return false; if (date < n.d || date > addDays(n.d, CFG.dias - 1)) return false; if (date === n.d && +time <= n.h) return false; return (CFG.horarios[dow(date)] || []).includes(+time); };
const okId = i => /^[a-f0-9]{10}$/.test(i || "");
export default async (req) => {
  const r = new URL(req.url).pathname.replace(/^\/api\//, "");
  const s = getStore({ name: "turnos", consistency: "strong" });
  const q = new URL(req.url).searchParams;
  const b = req.method === "POST" ? await req.json().catch(() => ({})) : {};
  const cancel = async id => { const k = okId(id) && await s.get("b:" + id, { type: "json" }); if (!k) return false; await s.delete(sk(k.date, k.time)); await s.delete("b:" + id); return true; };
  if (r === "config") return J({ ...CFG, today: ar().d });
  if (r === "slots") { const { blobs } = await s.list({ prefix: "s:" }); return J(blobs.map(x => x.key.slice(2))); }
  if (r === "get") { const k = okId(q.get("id")) && await s.get("b:" + q.get("id"), { type: "json" }); return k ? J(k) : J({ error: "No existe" }, 404); }
  if (r === "book") {
    const sv = CFG.servicios.find(x => x.id === b.servicio), name = String(b.name || "").trim().slice(0, 60), tel = String(b.tel || "").trim().slice(0, 30);
    if (!sv || !name || tel.replace(/\D/g, "").length < 8 || !okSlot(b.date, b.time)) return J({ error: "Datos inválidos" }, 400);
    const id = crypto.randomUUID().replace(/-/g, "").slice(0, 10);
    const w = await s.set(sk(b.date, b.time), id, { onlyIfNew: true });
    if (!w.modified) return J({ error: "Ese horario ya fue tomado. Elegí otro." }, 409);
    const bk = { id, name, tel, servicio: sv.id, sn: sv.n, p: sv.p, date: b.date, time: +b.time, gift: String(b.gift || "").trim().slice(0, 60), at: Date.now() };
    await s.setJSON("b:" + id, bk); return J(bk);
  }
  if (r === "move") {
    const k = okId(b.id) && await s.get("b:" + b.id, { type: "json" });
    if (!k || !okSlot(b.date, b.time)) return J({ error: "No se pudo cambiar" }, 400);
    const w = await s.set(sk(b.date, b.time), k.id, { onlyIfNew: true });
    if (!w.modified) return J({ error: "Ese horario ya fue tomado. Elegí otro." }, 409);
    await s.delete(sk(k.date, k.time)); k.date = b.date; k.time = +b.time; await s.setJSON("b:" + k.id, k); return J(k);
  }
  if (r === "cancel") return (await cancel(b.id)) ? J({ ok: 1 }) : J({ error: "No existe" }, 404);
  if (r.startsWith("admin/")) {
    const pw = Netlify.env.get("ADMIN_PASSWORD");
    if (!pw || req.headers.get("x-admin") !== pw) return J({ error: "No autorizado" }, 401);
    if (r === "admin/agenda") {
      const { blobs } = await s.list({ prefix: "b:" }), bs = (await Promise.all(blobs.map(x => s.get(x.key, { type: "json" })))).filter(Boolean);
      const used = new Set(bs.map(x => sk(x.date, x.time).slice(2))), all = (await s.list({ prefix: "s:" })).blobs.map(x => x.key.slice(2));
      return J({ today: ar().d, bookings: bs, blocks: all.filter(k => !used.has(k)) });
    }
    if (r === "admin/cancel") return J({ ok: await cancel(b.id) });
    if (r === "admin/block") {
      if (!/^\d{4}-\d\d-\d\d$/.test(b.date || "")) return J({ error: "Fecha inválida" }, 400);
      if (b.on) { const w = await s.set(sk(b.date, b.time), "block", { onlyIfNew: true }); return J({ ok: w.modified }); }
      if ((await s.get(sk(b.date, b.time))) === "block") await s.delete(sk(b.date, b.time)); return J({ ok: 1 });
    }
  }
  return J({ error: "No encontrado" }, 404);
};

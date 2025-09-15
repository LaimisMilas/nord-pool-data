import { DateTime } from "luxon";

const BASE_URL = process.env.ETI_BASE_URL || "https://etiekejai.lt/emarket/prices";

async function fetchJson(from, to) {
  const url = new URL(BASE_URL);
  url.searchParams.set("from", from);
  url.searchParams.set("to", to);
  url.searchParams.set("time_range", "hourly");
  try {
    const res = await fetch(url);
    if (!res.ok) {
      console.warn(`Etiekėjai error ${res.status}`);
      return null;
    }
    return await res.json();
  } catch (e) {
    console.warn("Etiekėjai fetch failed", e);
    return null;
  }
}

function normalize(js, tz = "Europe/Vilnius") {
  const arr = Array.isArray(js) ? js : (Array.isArray(js?.data) ? js.data : []);
  const out = [];
  for (const item of arr) {
    let ts = item.time ?? item.timestamp ?? item.ts ?? item.date;
    if (ts == null) { console.warn("Etiekėjai: missing timestamp", item); continue; }
    if (typeof ts === "string") {
      if (/^\d+$/.test(ts)) ts = Number(ts);
      else {
        const d = DateTime.fromISO(ts, { zone: tz });
        if (!d.isValid) { console.warn("Etiekėjai: bad timestamp", item); continue; }
        ts = d.toMillis();
      }
    }
    if (typeof ts === "number" && ts < 1e12) ts *= 1000; // seconds -> ms

    let val = item.price ?? item.value ?? item.eur_kwh ?? item.eurKwh ?? item.eurMWh;
    if (val == null) { console.warn("Etiekėjai: missing value", item); continue; }
    val = Number(val);
    if (Number.isNaN(val)) { console.warn("Etiekėjai: invalid value", item); continue; }
    if (val > 50) val = val / 1000; // EUR/MWh -> EUR/kWh

    const startLocal = DateTime.fromMillis(Number(ts), { zone: tz }).startOf("hour");
    const endLocal = startLocal.plus({ hours: 1 });
    out.push({
      startUTC: startLocal.toUTC().toISO(),
      endUTC: endLocal.toUTC().toISO(),
      startLocal: startLocal.toISO(),
      endLocal: endLocal.toISO(),
      value: val
    });
  }
  out.sort((a, b) => a.startUTC.localeCompare(b.startUTC));
  if (!out.length) return null;
  return {
    zone: "LT",
    unit: "EUR/kWh",
    resolution: "PT60M",
    fromUTC: out[0].startUTC,
    toUTC: out[out.length - 1].endUTC,
    prices: out
  };
}

export async function fetchTomorrow({ tz = "Europe/Vilnius" } = {}) {
  const start = DateTime.now().setZone(tz).plus({ days: 1 }).startOf("day");
  const end = start.plus({ days: 1 });
  const js = await fetchJson(start.toMillis(), end.toMillis());
  return normalize(js, tz);
}

export async function fetchRolling24h({ tz = "Europe/Vilnius" } = {}) {
  const start = DateTime.now().setZone(tz);
  const end = start.plus({ hours: 24 });
  const js = await fetchJson(start.toMillis(), end.toMillis());
  return normalize(js, tz);
}

export const meta = { id: "etiekejai", official: false, unit: "EUR/kWh", note: "Schema may change; use at your own risk" };

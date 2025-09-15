import { XMLParser } from "fast-xml-parser";
import { normalizeA44ToSeries, sliceRolling24h } from "../normalize.js";
import { tomorrowUtcBounds, rolling24hUtcWindow } from "../time.js";

async function fetchEntsoeA44({ token, eic, periodStart, periodEnd }) {
  const url = new URL("https://web-api.tp.entsoe.eu/api");
  url.searchParams.set("securityToken", token);
  url.searchParams.set("documentType", "A44");
  url.searchParams.set("in_Domain", eic);
  url.searchParams.set("out_Domain", eic);
  url.searchParams.set("periodStart", periodStart);
  url.searchParams.set("periodEnd", periodEnd);
  const res = await fetch(url, { headers: { Accept: "application/xml" } });
  const text = await res.text();
  if (!res.ok) throw new Error(`ENTSO-E error ${res.status}: ${text.slice(0,200)}...`);
  const parser = new XMLParser({ ignoreAttributes: false });
  return parser.parse(text);
}

export async function fetchTomorrow({ eic, token }) {
  const { periodStart, periodEnd } = tomorrowUtcBounds();
  const js = await fetchEntsoeA44({ token, eic, periodStart, periodEnd });
  return normalizeA44ToSeries(js, { eic });
}

export async function fetchRolling24h({ eic, token }) {
  const { query1, query2, sliceFromUtc, sliceToUtc } = rolling24hUtcWindow();
  const js1 = await fetchEntsoeA44({ token, eic, periodStart: query1.periodStart, periodEnd: query1.periodEnd });
  const js2 = await fetchEntsoeA44({ token, eic, periodStart: query2.periodStart, periodEnd: query2.periodEnd });
  const s1 = normalizeA44ToSeries(js1, { eic });
  const s2 = normalizeA44ToSeries(js2, { eic });
  const prices = sliceRolling24h(s1, s2, sliceFromUtc, sliceToUtc);
  return {
    zone: "LT",
    eic,
    unit: "EUR/kWh",
    resolution: (s1?.resolution || s2?.resolution || "PT60M"),
    fromUTC: sliceFromUtc.toISO(),
    toUTC: sliceToUtc.toISO(),
    prices
  };
}

export const meta = { id: "entsoe", official: true, unit: "EUR/kWh" };

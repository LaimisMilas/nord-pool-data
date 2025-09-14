import { DateTime } from "luxon";
import { plusResolution } from "./time.js";

export function normalizeA44ToSeries(jsDoc, { eic, tz = "Europe/Vilnius" }) {
  const doc = jsDoc?.Publication_MarketDocument;
  const series = Array.isArray(doc?.TimeSeries) ? doc.TimeSeries : (doc?.TimeSeries ? [doc.TimeSeries] : []);
  if (!series.length) return null;

  const currency = series[0]?.currency_Unit?.value || "EUR";
  const out = [];
  let resolution = "PT60M";
  let fromUTC, toUTC;

  for (const ts of series) {
    const period = ts.Period;
    const startISO = period?.timeInterval?.start;
    const endISO = period?.timeInterval?.end;
    const points = Array.isArray(period?.Point) ? period.Point : (period?.Point ? [period.Point] : []);
    resolution = period?.resolution || resolution;

    const startUtc = DateTime.fromISO(startISO, { zone: "utc" });
    const endUtc = DateTime.fromISO(endISO, { zone: "utc" });
    fromUTC = fromUTC ? DateTime.min(fromUTC, startUtc) : startUtc;
    toUTC = toUTC ? DateTime.max(toUTC, endUtc) : endUtc;

    for (const p of points) {
      const pos = Number(p.position) - 1; // 1-based
      const bucketStart = startUtc.plus({ minutes: resolution === "PT15M" ? pos * 15 : pos * 60 });
      const bucketEnd = plusResolution(bucketStart, resolution);
      const eurMWh = Number(p["price.amount"]);
      out.push({
        startUTC: bucketStart.toISO(),
        endUTC: bucketEnd.toISO(),
        startLocal: bucketStart.setZone(tz).toISO(),
        endLocal: bucketEnd.setZone(tz).toISO(),
        value: eurMWh / 1000 // EUR/kWh
      });
    }
  }

  out.sort((a, b) => a.startUTC.localeCompare(b.startUTC));
  return { zone: "LT", eic, currency, resolution, unit: "EUR/kWh", fromUTC: fromUTC?.toISO(), toUTC: toUTC?.toISO(), prices: out };
}

export function sliceRolling24h(seriesDay1, seriesDay2, sliceFromUtc, sliceToUtc) {
  const merged = [...(seriesDay1?.prices ?? []), ...(seriesDay2?.prices ?? [])];
  return merged.filter(p => p.startUTC >= sliceFromUtc.toISO() && p.startUTC < sliceToUtc.toISO());
}

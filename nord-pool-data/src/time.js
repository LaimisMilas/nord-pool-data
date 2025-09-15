import { DateTime, Duration } from "luxon";
export const TZ = "Europe/Vilnius";

export function dayBoundsUtc(localDateISO, tz = TZ) {
  const startLocal = DateTime.fromISO(localDateISO, { zone: tz }).startOf("day");
  const endLocal = startLocal.plus({ days: 1 });
  return { startUTC: startLocal.toUTC(), endUTC: endLocal.toUTC() };
}

export function todayUtcBounds(tz = TZ) {
  const today = DateTime.now().setZone(tz).startOf("day");
  const { startUTC, endUTC } = dayBoundsUtc(today.toISODate(), tz);
  const fmt = "yyyyLLddHHmm";
  return {
    periodStart: startUTC.toFormat(fmt),
    periodEnd: endUTC.toFormat(fmt),
    startUTC,
    endUTC
  };
}

export function tomorrowUtcBounds(tz = TZ) {
  const tomorrow = DateTime.now().setZone(tz).plus({ days: 1 }).startOf("day");
  const { startUTC, endUTC } = dayBoundsUtc(tomorrow.toISODate(), tz);
  const fmt = "yyyyLLddHHmm";
  return {
    periodStart: startUTC.toFormat(fmt),
    periodEnd: endUTC.toFormat(fmt),
    startUTC,
    endUTC
  };
}

export function rolling24hUtcWindow(tz = TZ) {
  const nowLocal = DateTime.now().setZone(tz);
  const fromUtc = nowLocal.toUTC();
  const toUtc = fromUtc.plus({ hours: 24 });

  const todayStart = nowLocal.startOf("day");
  const tomorrowStart = todayStart.plus({ days: 1 });
  const dayAfterStart = tomorrowStart.plus({ days: 1 });

  const fmt = "yyyyLLddHHmm";
  return {
    query1: { periodStart: todayStart.toUTC().toFormat(fmt), periodEnd: tomorrowStart.toUTC().toFormat(fmt) },
    query2: { periodStart: tomorrowStart.toUTC().toFormat(fmt), periodEnd: dayAfterStart.toUTC().toFormat(fmt) },
    sliceFromUtc: fromUtc,
    sliceToUtc: toUtc
  };
}

export function plusResolution(dtUtc, resolution) {
  const dur = resolution === "PT15M" ? Duration.fromObject({ minutes: 15 }) : Duration.fromObject({ hours: 1 });
  return dtUtc.plus(dur);
}

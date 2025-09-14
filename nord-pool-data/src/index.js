#!/usr/bin/env node
import "dotenv/config";
import yargs from "yargs";
import { hideBin } from "yargs/helpers";
import { ZONES } from "./zones.js";
import { fetchEntsoeA44 } from "./entsoe.js";
import { normalizeA44ToSeries, sliceRolling24h } from "./normalize.js";
import { tomorrowUtcBounds, rolling24hUtcWindow } from "./time.js";

const argv = yargs(hideBin(process.argv))
  .command("tomorrow", "Fetch tomorrow 00:00–24:00 (Europe/Vilnius)")
  .command("next24h", "Fetch rolling 24h from now")
  .option("zone",   { type: "string", default: "LT", describe: "Bidding zone (LT)" })
  .option("format", { choices: ["json", "csv"], default: "json" })
  .demandCommand(1)
  .strict()
  .help().argv;

const mode = argv._[0];
const zone = argv.zone.toUpperCase();
const eic = ZONES[zone];
if (!eic) { console.error(`Unknown zone ${zone}`); process.exit(1); }
const token = process.env.ENTSOE_TOKEN;
if (!token) { console.error("Missing ENTSOE_TOKEN in .env"); process.exit(1); }

function toCSV(prices) {
  const header = "startLocal,endLocal,value_EUR_per_kWh";
  const rows = prices.map(p => `${p.startLocal},${p.endLocal},${p.value}`);
  return [header, ...rows].join("\n");
}

if (mode === "tomorrow") {
  const { periodStart, periodEnd } = tomorrowUtcBounds();
  const js = await fetchEntsoeA44({ token, eic, periodStart, periodEnd });
  const normalized = normalizeA44ToSeries(js, { eic });
  if (!normalized) { console.error("No data returned (maybe not published yet)."); process.exit(2); }
  if (argv.format === "csv") console.log(toCSV(normalized.prices));
  else console.log(JSON.stringify(normalized, null, 2));
  process.exit(0);
}

if (mode === "next24h") {
  const { query1, query2, sliceFromUtc, sliceToUtc } = rolling24hUtcWindow();
  const js1 = await fetchEntsoeA44({ token, eic, periodStart: query1.periodStart, periodEnd: query1.periodEnd });
  const js2 = await fetchEntsoeA44({ token, eic, periodStart: query2.periodStart, periodEnd: query2.periodEnd });
  const s1 = normalizeA44ToSeries(js1, { eic });
  const s2 = normalizeA44ToSeries(js2, { eic });
  const prices = sliceRolling24h(s1, s2, sliceFromUtc, sliceToUtc);
  const payload = {
    zone: "LT",
    eic,
    unit: "EUR/kWh",
    resolution: (s1?.resolution || s2?.resolution || "PT60M"),
    fromUTC: sliceFromUtc.toISO(),
    toUTC: sliceToUtc.toISO(),
    prices
  };
  if (argv.format === "csv") console.log(toCSV(payload.prices));
  else console.log(JSON.stringify(payload, null, 2));
  process.exit(0);
}

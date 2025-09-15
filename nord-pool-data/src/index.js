#!/usr/bin/env node
import "dotenv/config";
import yargs from "yargs";
import { hideBin } from "yargs/helpers";
import { getProvider, getZoneEic } from "./selectProvider.js";

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
const { src, mod } = getProvider();
const p = await mod;

let eic, token;
if (src === "entsoe") {
  try {
    eic = getZoneEic(zone);
  } catch (e) {
    console.error(e.message); process.exit(1);
  }
  token = process.env.ENTSOE_TOKEN;
  if (!token) { console.error("Missing ENTSOE_TOKEN in .env"); process.exit(1); }
}

function toCSV(prices) {
  const header = "startLocal,endLocal,value_EUR_per_kWh";
  const rows = prices.map(p => `${p.startLocal},${p.endLocal},${p.value}`);
  return [header, ...rows].join("\n");
}

if (mode === "tomorrow") {
  const payload = src === "entsoe"
    ? await p.fetchTomorrow({ eic, token })
    : await p.fetchTomorrow({ tz: "Europe/Vilnius" });
  if (!payload) { console.error("No data returned (maybe not published yet)."); process.exit(2); }
  if (argv.format === "csv") console.log(toCSV(payload.prices));
  else console.log(JSON.stringify(payload, null, 2));
  process.exit(0);
}

if (mode === "next24h") {
  const payload = src === "entsoe"
    ? await p.fetchRolling24h({ eic, token })
    : await p.fetchRolling24h({ tz: "Europe/Vilnius" });
  if (argv.format === "csv") console.log(toCSV(payload.prices));
  else console.log(JSON.stringify(payload, null, 2));
  process.exit(0);
}

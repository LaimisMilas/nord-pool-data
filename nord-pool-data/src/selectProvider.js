import "dotenv/config";
import { ZONES } from "./zones.js";

export function getProvider() {
  const src = (process.env.DATA_SOURCE || "entsoe").toLowerCase();
  if (src === "etiekejai") return { src, mod: import("./providers/etiekejai.js") };
  return { src: "entsoe", mod: import("./providers/entsoe.js") };
}

export function getZoneEic(zone = "LT") {
  const z = zone.toUpperCase();
  if (!ZONES[z]) throw new Error(`Unknown zone ${z}`);
  return ZONES[z];
}

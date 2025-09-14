import { XMLParser } from "fast-xml-parser";

export async function fetchEntsoeA44({ token, eic, periodStart, periodEnd }) {
  const url = new URL("https://web-api.tp.entsoe.eu/api"); // oficialus TP Web API endpoint
  url.searchParams.set("securityToken", token);
  url.searchParams.set("documentType", "A44");     // Day-Ahead Prices
  url.searchParams.set("in_Domain", eic);
  url.searchParams.set("out_Domain", eic);
  url.searchParams.set("periodStart", periodStart); // UTC, yyyyMMddHHmm
  url.searchParams.set("periodEnd", periodEnd);     // UTC, yyyyMMddHHmm

  const res = await fetch(url, { headers: { Accept: "application/xml" } });
  const text = await res.text();
  if (!res.ok) throw new Error(`ENTSO-E error ${res.status}: ${text.slice(0,200)}...`);

  const parser = new XMLParser({ ignoreAttributes: false }); // saugom atributus
  return parser.parse(text);
}

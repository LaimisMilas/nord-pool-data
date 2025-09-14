# nord-pool-data

Parsisiunčia **Day-Ahead (A44)** kainas Lietuvai (LT) iš **ENTSO-E** (REST API).
- Endpoint: https://web-api.tp.entsoe.eu/api
- LT zona (EIC): 10YLT-1001A0008Q
- Reikalingas ENTSOE_TOKEN (`.env`)

## Startas
```bash
cp .env.example .env  # įrašyk ENTSOE_TOKEN
npm i
npm run tomorrow      # rytojaus 24h (JSON)
npm run next24h       # "rolling" 24h nuo dabar (JSON)
```


Pastabos

Atsakymo laikas – UTC; konvertuojam į Europe/Vilnius (luxon).

Vienetai iš ENTSO-E būna EUR/MWh – čia verčiam į EUR/kWh (÷1000).

Palaikoma rezoliucija PT60M ir PT15M.

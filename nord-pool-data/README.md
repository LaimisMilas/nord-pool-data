# nord-pool-data

Parsisiunčia **Day-Ahead (A44)** kainas Lietuvai (LT) iš oficialaus **ENTSO-E** REST API.
Taip pat palaikomas neoficialus **Etiekėjai** JSON endpointas.
- Endpoint: https://web-api.tp.entsoe.eu/api
- LT zona (EIC): 10YLT-1001A0008Q
- Reikalingas ENTSOE_TOKEN (`.env`)

## Startas
```bash
cp .env.example .env  # įrašyk ENTSOE_TOKEN
npm i
npm run today         # šiandienos 24h (JSON)
npm run tomorrow      # rytojaus 24h (JSON)
npm run next24h       # "rolling" 24h nuo dabar (JSON)
```

### Select data source
Default: ENTSO-E
```bash
# ENTSO-E (default)
DATA_SOURCE=entsoe ENTSOE_TOKEN=... npm run tomorrow

# Etiekėjai (unofficial, best-effort)
DATA_SOURCE=etiekejai npm run tomorrow
```

Etiekėjai yra neoficialus JSON šaltinis; schema gali keistis. Projektas bandys
normalizuoti hourly duomenis tolerantiškai (įskaitant EUR/MWh → EUR/kWh heuristiką).


Pastabos

Visos datos pateikiamos ISO formatu Europe/Vilnius laiko zonoje (`start` / `end`).

Vienetai iš ENTSO-E būna EUR/MWh – čia verčiam į EUR/kWh (÷1000).

Palaikoma rezoliucija PT60M ir PT15M.

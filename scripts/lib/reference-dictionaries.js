import fs from "node:fs";
import path from "node:path";

const REFERENCE_DIR = "data/reference";

function normalize(value) {
  return String(value || "")
    .trim()
    .toUpperCase()
    .replace(/[^A-Z0-9가-힣]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function parseCsv(text) {
  const lines = String(text || "").replace(/^\uFEFF/, "").split(/\r?\n/).filter(line => line.trim());
  if (lines.length < 2) return [];
  const parseLine = line => {
    const cells = [];
    let current = "";
    let quoted = false;
    for (let index = 0; index < line.length; index += 1) {
      const char = line[index];
      const next = line[index + 1];
      if (char === '"' && quoted && next === '"') {
        current += '"';
        index += 1;
      } else if (char === '"') {
        quoted = !quoted;
      } else if (char === "," && !quoted) {
        cells.push(current.trim());
        current = "";
      } else {
        current += char;
      }
    }
    cells.push(current.trim());
    return cells;
  };
  const headers = parseLine(lines[0]);
  return lines.slice(1).map(line => {
    const values = parseLine(line);
    return Object.fromEntries(headers.map((header, index) => [header, values[index] || ""]));
  });
}

function loadCsv(name) {
  const file = path.join(REFERENCE_DIR, name);
  if (!fs.existsSync(file)) return [];
  return parseCsv(fs.readFileSync(file, "utf8"));
}

function indexBy(rows, keys) {
  const map = new Map();
  for (const row of rows) {
    for (const key of keys) {
      const value = normalize(row[key]);
      if (value) map.set(value, row);
    }
  }
  return map;
}

export function loadReferenceDictionaries() {
  const ports = loadCsv("ports.csv");
  const berths = loadCsv("berths.csv");
  const anchorages = loadCsv("anchorages.csv");
  const vesselTypes = loadCsv("vessel_types.csv");
  const operators = loadCsv("operators.csv");
  const agents = loadCsv("agents.csv");
  const vesselMasterSeed = loadCsv("vessel_master_seed.csv");
  return {
    loaded_at: new Date().toISOString(),
    ports,
    berths,
    anchorages,
    vesselTypes,
    operators,
    agents,
    vesselMasterSeed,
    indexes: {
      ports: indexBy(ports, ["port_code", "port_name", "alias"]),
      berths: indexBy(berths, ["berth_name", "alias"]),
      anchorages: indexBy(anchorages, ["anchorage_name", "alias"]),
      vesselTypes: indexBy(vesselTypes, ["vessel_type", "alias"]),
      operators: indexBy(operators, ["operator", "alias"]),
      agents: indexBy(agents, ["agent", "alias"]),
      vesselMasterSeed: indexBy(vesselMasterSeed, ["imo", "mmsi", "call_sign", "canonical_name", "alias"])
    }
  };
}

export function enrichWithReferenceDictionaries(records = [], dictionaries = loadReferenceDictionaries()) {
  const indexes = dictionaries.indexes || {};
  return records.map(record => {
    const enriched = { ...record };
    const portRef = indexes.ports?.get(normalize(record.port_code)) || indexes.ports?.get(normalize(record.port_name || record.port));
    if (portRef) {
      enriched.port_code = enriched.port_code || portRef.port_code;
      enriched.port_name = portRef.port_name || enriched.port_name || enriched.port;
      enriched.port = enriched.port_name;
    }
    const berthRef = indexes.berths?.get(normalize(record.berth_name || record.berth));
    if (berthRef) {
      enriched.berth_name = berthRef.berth_name || enriched.berth_name || enriched.berth;
      enriched.berth_class = berthRef.berth_class || enriched.berth_class;
    }
    const anchorageRef = indexes.anchorages?.get(normalize(record.anchorage_name || record.anchorage_zone));
    if (anchorageRef) {
      enriched.anchorage_name = anchorageRef.anchorage_name || enriched.anchorage_name || enriched.anchorage_zone;
      enriched.is_anchorage_waiting = true;
    }
    const typeRef = indexes.vesselTypes?.get(normalize(record.vessel_type));
    if (typeRef) {
      enriched.vessel_type = typeRef.vessel_type || enriched.vessel_type;
      enriched.vessel_type_group = typeRef.vessel_type_group || enriched.vessel_type_group;
    }
    const operatorRef = indexes.operators?.get(normalize(record.operator));
    if (operatorRef) {
      enriched.operator = operatorRef.operator || enriched.operator;
      enriched.operator_normalized = operatorRef.operator_normalized || normalize(enriched.operator);
    }
    const agentRef = indexes.agents?.get(normalize(record.agent));
    if (agentRef) {
      enriched.agent = agentRef.agent || enriched.agent;
      enriched.agent_normalized = agentRef.agent_normalized || normalize(enriched.agent);
    }
    const seedRef = indexes.vesselMasterSeed?.get(normalize(record.imo)) ||
      indexes.vesselMasterSeed?.get(normalize(record.mmsi)) ||
      indexes.vesselMasterSeed?.get(normalize(record.call_sign)) ||
      indexes.vesselMasterSeed?.get(normalize(record.vessel_name));
    if (seedRef) {
      enriched.imo = enriched.imo || seedRef.imo;
      enriched.mmsi = enriched.mmsi || seedRef.mmsi;
      enriched.call_sign = enriched.call_sign || seedRef.call_sign;
      enriched.gt = enriched.gt || Number(seedRef.gt || 0);
      enriched.operator = enriched.operator || seedRef.operator;
      enriched.vessel_master_seed_match = true;
    }
    enriched.reference_enriched = Boolean(portRef || berthRef || anchorageRef || typeRef || operatorRef || agentRef || seedRef);
    return enriched;
  });
}

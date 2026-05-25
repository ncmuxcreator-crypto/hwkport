const SOURCE_TIMEOUT_MS = Number(process.env.SOURCE_TIMEOUT_MS || 10000);
const MAX_OUTPUT_ROWS = Number(process.env.MAX_OUTPUT_ROWS || 500);

const FIELD_ALIASES = {
  vessel_name: ["vessel_name", "ship_name", "shipNm", "vsslNm", "vslNm", "선박명", "선명", "VSL_NM"],
  imo: ["imo", "imo_no", "imoNo", "IMO", "IMO_NO"],
  mmsi: ["mmsi", "MMSI"],
  call_sign: ["call_sign", "callSign", "callsign", "호출부호", "CALL_SIGN"],
  port: ["port", "port_name", "portNm", "prtNm", "항", "항명", "PORT_NM"],
  berth: ["berth", "berth_name", "berthNm", "brthNm", "선석", "접안지", "BERTH_NM"],
  anchorage_zone: ["anchorage_zone", "anchorage", "anchorZone", "묘박지", "ANCHorage"],
  status: ["status", "movement_status", "shipStatus", "sttus", "상태", "운항상태"],
  operator: ["operator", "company", "shippingCompany", "agent", "선사", "대리점"],
  destination: ["destination", "dest", "next_port_country", "목적지", "DEST"],
  previous_port: ["previous_port", "prevPort", "last_port", "전출항"],
  next_port: ["next_port", "nextPort", "다음항", "차항"],
  vessel_type: ["vessel_type", "ship_type", "shipType", "vsslKnd", "선종", "TYPE"],
  gt: ["gt", "gross_tonnage", "grt", "총톤수", "GT"],
  eta: ["eta", "ETA", "etaDate", "estimatedArrival", "입항예정일시", "입항예정"],
  etb: ["etb", "ETB", "estimatedBerthing", "접안예정일시", "접안예정"],
  ata: ["ata", "ATA", "actualArrival", "입항일시", "실입항"],
  atb: ["atb", "ATB", "actualBerthing", "접안일시", "실접안"],
  etd: ["etd", "ETD", "estimatedDeparture", "출항예정일시", "출항예정"],
  atd: ["atd", "ATD", "actualDeparture", "출항일시", "실출항"],
  speed: ["speed", "sog", "SOG", "속력", "선속"]
};

function env(name) {
  return process.env[name] && String(process.env[name]).trim();
}

function firstValue(row, aliases) {
  for (const key of aliases) {
    if (row[key] !== undefined && row[key] !== null && String(row[key]).trim() !== "") {
      return row[key];
    }
  }
  const lowerMap = new Map(Object.keys(row).map(key => [key.toLowerCase(), key]));
  for (const key of aliases) {
    const actual = lowerMap.get(String(key).toLowerCase());
    if (actual && row[actual] !== undefined && row[actual] !== null && String(row[actual]).trim() !== "") {
      return row[actual];
    }
  }
  return "";
}

function normalizeDate(value) {
  if (!value) return "";
  const text = String(value).trim();
  if (!text) return "";
  if (/^\d{8}$/.test(text)) return `${text.slice(0, 4)}-${text.slice(4, 6)}-${text.slice(6, 8)} 00:00`;
  if (/^\d{12}$/.test(text)) return `${text.slice(0, 4)}-${text.slice(4, 6)}-${text.slice(6, 8)} ${text.slice(8, 10)}:${text.slice(10, 12)}`;
  if (/^\d{14}$/.test(text)) return `${text.slice(0, 4)}-${text.slice(4, 6)}-${text.slice(6, 8)} ${text.slice(8, 10)}:${text.slice(10, 12)}`;
  return text.replace("T", " ").replace(/:\d{2}\.\d{3}Z$/, "");
}

function toNumber(value) {
  const n = Number(String(value ?? "").replace(/,/g, ""));
  return Number.isFinite(n) ? n : 0;
}

function sourceConfigs() {
  return [
    { key: "port_operation", label: "PORT-MIS 항만운영", url: env("PORT_OPERATION_API_URL"), serviceKey: env("PORT_OPERATION_SERVICE_KEY") },
    { key: "port_facility", label: "항만시설", url: env("PORT_FACILITY_API_URL"), serviceKey: env("PORT_FACILITY_SERVICE_KEY") },
    { key: "ulsan_core", label: "울산항", url: env("ULSAN_API_URL"), serviceKey: env("ULSAN_API_KEY") },
    { key: "ulsan_berth_detail", label: "울산 선석상세", url: env("ULSAN_BERTH_DETAIL_API_URL"), serviceKey: env("ULSAN_BERTH_DETAIL_API_KEY") },
    { key: "ulsan_cargo_plan", label: "울산 화물계획", url: env("ULSAN_CARGO_PLAN_API_URL"), serviceKey: env("ULSAN_CARGO_PLAN_API_KEY") },
    { key: "ulsan_berth_operation", label: "울산 선석운영", url: env("ULSAN_BERTH_OPERATION_API_URL"), serviceKey: env("ULSAN_BERTH_OPERATION_API_KEY") },
    { key: "ulsan_terminal_process", label: "울산 터미널", url: env("ULSAN_TERMINAL_PROCESS_API_URL"), serviceKey: env("ULSAN_TERMINAL_PROCESS_API_KEY") },
    { key: "ygpa_arrival", label: "여수광양 입항", url: env("YGPA_ARRIVAL_API_URL"), serviceKey: env("YGPA_ARRIVAL_API_KEY") || env("YGPA_SERVICE_KEY") },
    { key: "ygpa_departure", label: "여수광양 출항", url: env("YGPA_DEPARTURE_API_URL"), serviceKey: env("YGPA_DEPARTURE_API_KEY") || env("YGPA_SERVICE_KEY") },
    { key: "ygpa_vts", label: "여수광양 VTS", url: env("YGPA_VTS_API_URL"), serviceKey: env("YGPA_VTS_API_KEY") || env("YGPA_SERVICE_KEY") },
    { key: "mof_ais_dynamic", label: "MOF AIS 동적", url: env("MOF_AIS_DYNAMIC_API_URL"), serviceKey: env("MOF_AIS_DYNAMIC_SERVICE_KEY") },
    { key: "mof_ais_info", label: "MOF AIS 선박정보", url: env("MOF_AIS_INFO_API_URL"), serviceKey: env("MOF_AIS_INFO_SERVICE_KEY") },
    { key: "mof_ais_stat", label: "MOF AIS 통계", url: env("MOF_AIS_STAT_API_URL"), serviceKey: env("MOF_AIS_STAT_SERVICE_KEY") },
    { key: "korea_public_data", label: "공공데이터 예비", url: env("KOREA_PORTMIS_BASE_URL"), serviceKey: env("PORTMIS_API_KEY") || env("PORT_MIS_API_KEY") || env("DATA_GO_KR_API_KEY") || env("SERVICE_KEY") }
  ].filter(source => source.url && source.serviceKey);
}

function vtsConfigs() {
  const base = env("MOF_VTS_API_BASE");
  const key = env("MOF_VTS_SERVICE_KEY");
  if (!base || !key) return [];
  const codes = (env("MOF_VTS_PORT_CODES") || "BUSAN,YEOSU,GWANGYANG,ULSAN,PYEONGTAEK,POHANG,HADONG,MASAN,INCHEON")
    .split(/[,\s]+/)
    .map(code => code.trim())
    .filter(Boolean);
  return codes.map(code => ({ key: `mof_vts_${code.toLowerCase()}`, label: `통합 VTS ${code}`, url: base, serviceKey: key, portCode: code }));
}

function buildUrl(source) {
  const url = new URL(source.url);
  if (source.serviceKey && !url.searchParams.has("serviceKey") && !url.searchParams.has("ServiceKey")) {
    url.searchParams.set("serviceKey", source.serviceKey);
  }
  if (!url.searchParams.has("_type")) url.searchParams.set("_type", "json");
  if (!url.searchParams.has("pageNo")) url.searchParams.set("pageNo", "1");
  if (!url.searchParams.has("numOfRows")) url.searchParams.set("numOfRows", String(Math.min(MAX_OUTPUT_ROWS, 100)));
  if (source.portCode && !url.searchParams.has("portCode")) url.searchParams.set("portCode", source.portCode);
  return url;
}

async function fetchText(source) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), SOURCE_TIMEOUT_MS);
  try {
    const res = await fetch(buildUrl(source), { signal: controller.signal, headers: { accept: "application/json, text/xml, */*" } });
    const text = await res.text();
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return text;
  } finally {
    clearTimeout(timer);
  }
}

function flattenJson(value) {
  if (Array.isArray(value)) return value.flatMap(flattenJson);
  if (!value || typeof value !== "object") return [];
  const preferred = value.items?.item || value.response?.body?.items?.item || value.body?.items?.item || value.data || value.list || value.result || value.records;
  if (preferred) return flattenJson(preferred);
  const objectValues = Object.values(value);
  const arrays = objectValues.filter(Array.isArray);
  if (arrays.length) return arrays.flatMap(flattenJson);
  return [value];
}

function parseXmlRows(text) {
  const rows = [];
  for (const match of text.matchAll(/<item\b[^>]*>([\s\S]*?)<\/item>/gi)) {
    const row = {};
    for (const field of match[1].matchAll(/<([^!?\/][^>\s]*)[^>]*>([\s\S]*?)<\/\1>/g)) {
      row[field[1]] = field[2].replace(/<!\[CDATA\[|\]\]>/g, "").trim();
    }
    if (Object.keys(row).length) rows.push(row);
  }
  return rows;
}

function parseRows(text) {
  const trimmed = text.trim();
  if (!trimmed) return [];
  if (trimmed.startsWith("{") || trimmed.startsWith("[")) {
    return flattenJson(JSON.parse(trimmed)).filter(row => row && typeof row === "object");
  }
  return parseXmlRows(trimmed);
}

function normalizeStatus(value) {
  const text = String(value || "").trim();
  if (/접안|berth|alongside|moored/i.test(text)) return "At Berth";
  if (/묘박|대기|anchor|waiting|idle|drifting/i.test(text)) return "Waiting";
  if (/예정|expected|schedule|planned/i.test(text)) return "Expected";
  if (/출항|departure|departed/i.test(text)) return "Departed";
  return text || "Observed";
}

function normalizePort(value, fallback = "") {
  const text = String(value || fallback || "").trim();
  if (/busan|부산/i.test(text)) return "Busan";
  if (/yeosu|여수/i.test(text)) return "Yeosu";
  if (/gwangyang|광양/i.test(text)) return "Gwangyang";
  if (/ulsan|울산/i.test(text)) return "Ulsan";
  if (/pyeongtaek|dangjin|평택|당진/i.test(text)) return "Pyeongtaek-Dangjin";
  if (/pohang|포항/i.test(text)) return "Pohang";
  if (/hadong|samcheonpo|하동|삼천포/i.test(text)) return "Hadong/Samcheonpo";
  if (/masan|jinhae|마산|진해/i.test(text)) return "Masan/Jinhae";
  if (/incheon|인천/i.test(text)) return "Incheon";
  return text || "Korea";
}

function normalizeRow(row, source, now) {
  const vesselName = String(firstValue(row, FIELD_ALIASES.vessel_name)).trim();
  const imo = String(firstValue(row, FIELD_ALIASES.imo)).trim();
  const mmsi = String(firstValue(row, FIELD_ALIASES.mmsi)).trim();
  const callSign = String(firstValue(row, FIELD_ALIASES.call_sign)).trim();
  const port = normalizePort(firstValue(row, FIELD_ALIASES.port), source.portCode);
  if (!vesselName && !imo && !mmsi && !callSign) return null;

  return {
    vessel_id: imo ? `IMO-${imo}` : mmsi ? `MMSI-${mmsi}` : callSign ? `CALL-${callSign}` : `${vesselName}-${port}`,
    vessel_name: vesselName || imo || mmsi || callSign,
    imo,
    mmsi,
    call_sign: callSign,
    port,
    berth: String(firstValue(row, FIELD_ALIASES.berth)).trim(),
    anchorage_zone: String(firstValue(row, FIELD_ALIASES.anchorage_zone)).trim(),
    status: normalizeStatus(firstValue(row, FIELD_ALIASES.status)),
    operator: String(firstValue(row, FIELD_ALIASES.operator)).trim(),
    destination: String(firstValue(row, FIELD_ALIASES.destination)).trim(),
    previous_port: String(firstValue(row, FIELD_ALIASES.previous_port)).trim(),
    next_port: String(firstValue(row, FIELD_ALIASES.next_port)).trim(),
    vessel_type: String(firstValue(row, FIELD_ALIASES.vessel_type)).trim() || "Unknown",
    gt: toNumber(firstValue(row, FIELD_ALIASES.gt)),
    eta: normalizeDate(firstValue(row, FIELD_ALIASES.eta)),
    etb: normalizeDate(firstValue(row, FIELD_ALIASES.etb)),
    ata: normalizeDate(firstValue(row, FIELD_ALIASES.ata)),
    atb: normalizeDate(firstValue(row, FIELD_ALIASES.atb)),
    etd: normalizeDate(firstValue(row, FIELD_ALIASES.etd)),
    atd: normalizeDate(firstValue(row, FIELD_ALIASES.atd)),
    speed: toNumber(firstValue(row, FIELD_ALIASES.speed)),
    risk_score: 45,
    source: source.key,
    source_label: source.label,
    source_mode: "real_public_api_snapshot",
    data_confidence: "source_configured",
    raw_source_keys: Object.keys(row).slice(0, 40),
    updated_at: now
  };
}

function dedupe(records) {
  const seen = new Set();
  const output = [];
  for (const record of records) {
    const key = [record.vessel_id, record.port, record.eta, record.ata, record.berth].join("|").toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    output.push(record);
  }
  return output.slice(0, MAX_OUTPUT_ROWS);
}

async function collectRealRows() {
  const now = new Date().toISOString();
  const records = [];
  for (const source of [...sourceConfigs(), ...vtsConfigs()]) {
    try {
      const text = await fetchText(source);
      const rows = parseRows(text);
      for (const row of rows) {
        const normalized = normalizeRow(row, source, now);
        if (normalized) records.push(normalized);
      }
    } catch (error) {
      records.push({
        vessel_id: `SOURCE-ERROR-${source.key}`,
        vessel_name: `${source.label} 수집 실패`,
        port: normalizePort("", source.portCode),
        status: "Source Error",
        vessel_type: "Collector",
        risk_score: 0,
        source: source.key,
        source_label: source.label,
        source_mode: "collector_error",
        data_confidence: "low",
        collector_error: error?.message || String(error),
        updated_at: now
      });
    }
  }
  return dedupe(records.filter(record => record.source_mode === "real_public_api_snapshot"));
}

function sampleRows(apiSources = []) {
  const enabled = new Set(apiSources.filter(s => s.enabled).map(s => s.key));
  const sourceMode = enabled.size ? "api_ready_sample_snapshot" : "sample_snapshot";
  const now = new Date().toISOString();
  return [
    {
      vessel_id: "IMO-9876543",
      vessel_name: "MV HF ZHOUSHAN",
      port: "Busan",
      berth: "Outer Anchorage",
      anchorage_zone: "Busan OPL",
      status: "Waiting",
      operator: "Sample Operator",
      destination: "Australia",
      previous_port: "Port Hedland",
      next_port: "Brisbane",
      vessel_type: "Capesize",
      gt: 93000,
      eta: "2026-05-04 08:00",
      etb: "2026-05-27 10:00",
      ata: "2026-05-04 07:40",
      atb: "",
      etd: "2026-05-29 18:00",
      atd: "",
      days_in_korea: 21,
      speed: 2,
      risk_score: 95,
      source: "integrated_vts_sample",
      updated_at: now,
      source_mode: sourceMode,
      api_ready: [...enabled]
    },
    {
      vessel_id: "IMO-8111222",
      vessel_name: "MAERSK DEMO",
      port: "Ulsan",
      berth: "Industrial Berth",
      anchorage_zone: "",
      status: "At Berth",
      operator: "Maersk",
      destination: "Singapore",
      previous_port: "Shanghai",
      next_port: "Singapore",
      vessel_type: "Container",
      gt: 76000,
      eta: "2026-05-20 09:00",
      etb: "2026-05-20 16:00",
      ata: "2026-05-20 08:45",
      atb: "2026-05-20 16:20",
      etd: "2026-05-25 21:00",
      atd: "",
      days_in_korea: 5,
      speed: 10,
      risk_score: 35,
      source: "ulsan_port_schedule_sample",
      updated_at: now,
      source_mode: sourceMode,
      api_ready: [...enabled]
    },
    {
      vessel_id: "IMO-7000001",
      vessel_name: "YEOSU TARGET",
      port: "Yeosu",
      berth: "Outer Anchorage",
      anchorage_zone: "D",
      status: "Waiting",
      operator: "Demo Operator",
      destination: "Brazil",
      previous_port: "Singapore",
      next_port: "Brazil",
      vessel_type: "VLCC",
      gt: 160000,
      eta: "2026-05-09 03:00",
      etb: "",
      ata: "2026-05-09 02:35",
      atb: "",
      etd: "2026-05-31 12:00",
      atd: "",
      days_in_korea: 16,
      speed: 1,
      risk_score: 90,
      source: "integrated_vts_sample",
      updated_at: now,
      source_mode: sourceMode,
      api_ready: [...enabled]
    }
  ];
}

export async function collectKoreaData({ apiSources = [] } = {}) {
  const realRows = await collectRealRows();
  return realRows.length ? realRows : sampleRows(apiSources);
}

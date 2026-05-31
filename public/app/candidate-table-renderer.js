import { esc, fmt } from "./utils.js";

export function renderCandidateTableRows(rows, { page, pageSize, vesselName, portName, statusText, dateLabel, stayLabel, score, grade, action }) {
  if (!rows.length) {
    return '<tr><td colspan="8" class="empty">영업 후보 선박이 없습니다.</td></tr>';
  }

  return rows.map((vessel, index) => {
    const [label, className] = grade(vessel);
    const rank = (page - 1) * pageSize + index + 1;
    return `<tr>
      <td>${rank}</td>
      <td><b>${esc(vesselName(vessel))}</b><div class="meta-line">IMO ${esc(vessel.imo || "-")} · MMSI ${esc(vessel.mmsi || "-")}</div></td>
      <td>${esc(portName(vessel))}</td>
      <td>${esc(statusText(vessel))}</td>
      <td>${esc(dateLabel(vessel))}</td>
      <td>${esc(stayLabel(vessel))}</td>
      <td><span class="chip ${className}">${label} ${fmt(score(vessel))}</span></td>
      <td>${esc(action(vessel))}</td>
    </tr>`;
  }).join("");
}

export function renderCandidateCards(rows, { page, pageSize, vesselName, portName, statusText, dateLabel, stayLabel, score, grade, action, memo, tags }) {
  if (!rows.length) {
    return '<div class="empty">영업 후보 선박이 없습니다.</div>';
  }

  return rows.map((vessel, index) => {
    const [label, className] = grade(vessel);
    const rank = (page - 1) * pageSize + index + 1;
    return `<article class="candidate-card">
      <div class="hot-item compact">
        <span class="rank">${rank}</span>
        <div>
          <div class="candidate-name">${esc(vesselName(vessel))}</div>
          <div class="meta-line">${esc(portName(vessel))} · ${esc(statusText(vessel))}</div>
        </div>
        <span class="chip ${className}">${label} ${fmt(score(vessel))}</span>
      </div>
      <div class="kv-grid">
        <div class="kv"><span>일정</span><b>${esc(dateLabel(vessel))}</b></div>
        <div class="kv"><span>체류</span><b>${esc(stayLabel(vessel))}</b></div>
      </div>
      <details>
        <summary>더 보기</summary>
        <div class="memo"><b>추천 액션</b><br>${esc(action(vessel))}</div>
        <div class="memo"><b>영업메모</b><br>${esc(memo(vessel))}</div>
        <div class="tag-row">${tags(vessel).map(tag => `<span class="tag">${esc(tag)}</span>`).join("")}</div>
      </details>
    </article>`;
  }).join("");
}

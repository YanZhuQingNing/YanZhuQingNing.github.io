// Replace these date totals with CC Switch export data when it is available.
const tokenUsage = {};
const calendar = document.querySelector('#token-calendar');
const today = new Date();

for (let index = 0; index < 182; index += 1) {
  const date = new Date(today);
  date.setDate(today.getDate() - (181 - index));
  const key = date.toISOString().slice(0, 10);
  const value = tokenUsage[key] || 0;
  const cell = document.createElement('i');
  cell.className = `token-cell token-level-${Math.min(3, Math.ceil(value / 25000))}`;
  cell.title = `${key}: ${value ? `${value.toLocaleString()} tokens` : '暂无数据'}`;
  cell.setAttribute('aria-label', cell.title);
  calendar.appendChild(cell);
}

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

const githubChart = document.querySelector('#github-chart');

function renderGithubChart(data) {
  const contributions = new Map((data.contributions || []).map((item) => [item.date, item.count]));
  const end = new Date();
  const start = new Date(end);
  start.setDate(end.getDate() - 364);

  for (let index = 0; index < 365; index += 1) {
    const date = new Date(start);
    date.setDate(start.getDate() + index);
    const key = date.toISOString().slice(0, 10);
    const count = contributions.get(key) || 0;
    const cell = document.createElement('i');
    const level = count === 0 ? 0 : count < 3 ? 1 : count < 6 ? 2 : count < 10 ? 3 : 4;
    cell.className = `github-cell level-${level}`;
    cell.title = `${key}: ${count} 次贡献`;
    cell.setAttribute('aria-label', cell.title);
    githubChart.appendChild(cell);
  }
}

fetch('data/github-contributions.json', { cache: 'no-store' })
  .then((response) => {
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    return response.json();
  })
  .then(renderGithubChart)
  .catch(() => {
    githubChart.textContent = '贡献数据暂未生成';
    githubChart.classList.add('github-chart-empty');
  });

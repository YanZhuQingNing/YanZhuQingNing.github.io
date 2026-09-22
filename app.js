const calendar = document.querySelector('#token-calendar');
const tokenTotal = document.querySelector('#token-total');
const tokenTotalLabel = document.querySelector('#token-total-label');
const tokenStatus = document.querySelector('#token-status');

function formatTokens(value) {
  return value >= 1000000 ? `${(value / 1000000).toFixed(1)}M` : value >= 1000 ? `${(value / 1000).toFixed(1)}k` : String(value);
}

function renderTokenUsage(data) {
  const dates = data.dates || {};
  const values = Object.values(dates).map((day) => day.totalTokens || 0);
  const max = Math.max(...values, 1);
  const todayKey = new Date().toISOString().slice(0, 10);
  tokenTotal.textContent = formatTokens(data.totalTokens || 0);
  tokenTotalLabel.innerHTML = `累计 token<br />今日 ${formatTokens(dates[todayKey]?.totalTokens || 0)}`;
  tokenStatus.textContent = data.generatedAt ? `更新于 ${new Date(data.generatedAt).toLocaleDateString('zh-CN')}` : '暂无数据';
  for (let index = 0; index < 182; index += 1) {
    const date = new Date();
    date.setDate(date.getDate() - (181 - index));
    const key = date.toISOString().slice(0, 10);
    const value = dates[key]?.totalTokens || 0;
    const cell = document.createElement('i');
    cell.className = `token-cell token-level-${value ? Math.min(3, Math.ceil((value / max) * 3)) : 0}`;
    const modelDetails = Object.entries(dates[key]?.models || {})
      .sort(([, first], [, second]) => second - first)
      .map(([model, total]) => `${model.replace(':', ' / ')}: ${total.toLocaleString()} tokens`)
      .join('\n');
    cell.title = value ? `${key}: ${value.toLocaleString()} tokens${modelDetails ? `\n${modelDetails}` : ''}` : `${key}: 暂无记录`;
    cell.setAttribute('aria-label', cell.title);
    calendar.appendChild(cell);
  }
}

fetch('data/token-usage.json', { cache: 'no-store' })
  .then((response) => { if (!response.ok) throw new Error(`HTTP ${response.status}`); return response.json(); })
  .then(renderTokenUsage)
  .catch(() => { tokenStatus.textContent = '数据不可用'; tokenTotalLabel.innerHTML = '累计 token<br />读取失败'; });

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

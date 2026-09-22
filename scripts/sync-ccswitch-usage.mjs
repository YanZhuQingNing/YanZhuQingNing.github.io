import { execFileSync } from 'node:child_process';
import { existsSync, mkdirSync, readFileSync, renameSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';

const repoRoot = resolve(import.meta.dirname, '..');
const database = process.env.CC_SWITCH_DB || resolve(process.env.USERPROFILE || '', '.cc-switch', 'cc-switch.db');
const output = resolve(process.env.TOKEN_USAGE_OUTPUT || resolve(repoRoot, 'data', 'token-usage.json'));
const sqlite = process.env.SQLITE3 || 'sqlite3';

if (!existsSync(database)) throw new Error(`CC Switch database not found: ${database}`);

function query(sql) {
  const result = execFileSync(sqlite, ['-json', database, sql], { encoding: 'utf8' });
  return result.trim() ? JSON.parse(result) : [];
}

const rows = [
  ...query(`
    SELECT date(datetime(created_at, 'unixepoch', 'localtime')) AS date, app_type AS app, model,
      SUM(input_tokens) AS inputTokens,
      SUM(output_tokens) AS outputTokens,
      SUM(cache_read_tokens) AS cacheReadTokens,
      SUM(cache_creation_tokens) AS cacheCreationTokens,
      COUNT(*) AS requests
    FROM proxy_request_logs
    WHERE date(datetime(created_at, 'unixepoch', 'localtime')) >= date('now', 'localtime', '-30 day')
    GROUP BY 1, 2, 3
  `),
  ...query(`
    SELECT date, app_type AS app, model,
      SUM(input_tokens) AS inputTokens,
      SUM(output_tokens) AS outputTokens,
      SUM(cache_read_tokens) AS cacheReadTokens,
      SUM(cache_creation_tokens) AS cacheCreationTokens,
      SUM(request_count) AS requests
    FROM usage_daily_rollups
    WHERE date < date('now', 'localtime', '-30 day')
    GROUP BY date, app_type, model
  `)
];

const dates = {};
const models = {};
for (const row of rows) {
  const inputTokens = Number(row.inputTokens) || 0;
  const outputTokens = Number(row.outputTokens) || 0;
  const cacheReadTokens = Number(row.cacheReadTokens) || 0;
  const cacheCreationTokens = Number(row.cacheCreationTokens) || 0;
  const totalTokens = inputTokens + outputTokens + cacheReadTokens + cacheCreationTokens;
  const modelKey = `${row.app}:${row.model}`;
  const model = models[modelKey] || { app: row.app, model: row.model, totalTokens: 0, inputTokens: 0, outputTokens: 0, cacheReadTokens: 0, cacheCreationTokens: 0, requests: 0 };
  Object.assign(model, {
    totalTokens: model.totalTokens + totalTokens,
    inputTokens: model.inputTokens + inputTokens,
    outputTokens: model.outputTokens + outputTokens,
    cacheReadTokens: model.cacheReadTokens + cacheReadTokens,
    cacheCreationTokens: model.cacheCreationTokens + cacheCreationTokens,
    requests: model.requests + (Number(row.requests) || 0)
  });
  models[modelKey] = model;

  const day = dates[row.date] || { totalTokens: 0, models: {} };
  day.totalTokens += totalTokens;
  day.models[modelKey] = (day.models[modelKey] || 0) + totalTokens;
  dates[row.date] = day;
}

const payload = {
  generatedAt: new Date().toISOString(),
  source: 'CC Switch SQLite',
  backfillDays: 30,
  totalTokens: Object.values(models).reduce((sum, model) => sum + model.totalTokens, 0),
  models: Object.values(models).sort((a, b) => b.totalTokens - a.totalTokens),
  dates
};

mkdirSync(dirname(output), { recursive: true });
const temporary = `${output}.tmp`;
writeFileSync(temporary, `${JSON.stringify(payload, null, 2)}\n`);
renameSync(temporary, output);
console.log(`Synced ${rows.length} grouped rows, ${payload.totalTokens.toLocaleString()} tokens.`);

const token = process.env.GITHUB_TOKEN;
const login = process.env.GITHUB_LOGIN || 'YanZhuQingNing';

if (!token) throw new Error('GITHUB_TOKEN is required');

const end = new Date();
const start = new Date(end);
start.setUTCDate(end.getUTCDate() - 364);

const query = `query($login: String!, $from: DateTime!, $to: DateTime!) {
  user(login: $login) {
    contributionsCollection(from: $from, to: $to) {
      totalCommitContributions
      restrictedContributionsCount
      contributionCalendar {
        totalContributions
        weeks {
          contributionDays { date contributionCount }
        }
      }
    }
  }
}`;

const response = await fetch('https://api.github.com/graphql', {
  method: 'POST',
  headers: {
    authorization: `bearer ${token}`,
    'content-type': 'application/json',
    'user-agent': 'personal-website-contributions'
  },
  body: JSON.stringify({
    query,
    variables: { login, from: start.toISOString(), to: end.toISOString() }
  })
});

if (!response.ok) throw new Error(`GitHub API HTTP ${response.status}: ${await response.text()}`);
const payload = await response.json();
if (payload.errors?.length) throw new Error(payload.errors.map((error) => error.message).join('; '));

const collection = payload.data.user.contributionsCollection;
const contributions = collection.contributionCalendar.weeks.flatMap((week) => week.contributionDays)
  .map(({ date, contributionCount }) => ({ date, count: contributionCount }));

process.stdout.write(JSON.stringify({
  updatedAt: new Date().toISOString(),
  total: collection.contributionCalendar.totalContributions,
  publicCommits: collection.totalCommitContributions,
  privateContributions: collection.restrictedContributionsCount,
  contributions
}, null, 2));

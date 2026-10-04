// Publish firebase/firestore.rules to the site's database.
//
//   node tools/deploy-rules.js
//
// Uses the account signed in to the Firebase CLI (`firebase login`) and talks to Google's rules API
// directly, one attempt per call. It does not need a Firebase project, only the Google Cloud
// project named in assets/js/live-config.js. Normally run for you by `tools/set-passcode.py --deploy`.
const fs = require('fs');
const path = require('path');
const https = require('https');

const root = path.join(__dirname, '..');
const lib = path.join(process.env.APPDATA || path.join(process.env.HOME || '', '.config'), 'npm', 'node_modules', 'firebase-tools', 'lib');
let auth, configstore;
try {
  auth = require(path.join(lib, 'auth'));
  configstore = require(path.join(lib, 'configstore')).configstore;
} catch (e) {
  console.error('Could not find the Firebase CLI. Install it (npm i -g firebase-tools) and run `firebase login`.');
  process.exit(1);
}

const config = fs.readFileSync(path.join(root, 'assets', 'js', 'live-config.js'), 'utf8');
const PID = (config.match(/projectId\s*:\s*'([^']+)'/) || [])[1];
if (!PID) { console.error('No projectId in assets/js/live-config.js'); process.exit(1); }
const rulesFile = path.join(root, 'firebase', 'firestore.rules');
if (!fs.existsSync(rulesFile)) { console.error('Missing firebase/firestore.rules. Run: python tools/set-passcode.py'); process.exit(1); }

async function call(method, url, body) {
  const tokens = configstore.get('tokens');
  if (!tokens || !tokens.refresh_token) throw new Error('Not signed in. Run: firebase login');
  const access = (await auth.getAccessToken(tokens.refresh_token, ['https://www.googleapis.com/auth/cloud-platform'])).access_token;
  const u = new URL(url), data = body ? JSON.stringify(body) : null;
  return new Promise((resolve, reject) => {
    const req = https.request({ hostname: u.hostname, path: u.pathname + u.search, method, agent: false, headers: Object.assign(
      { Authorization: 'Bearer ' + access, Connection: 'close' },
      data ? { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(data) } : {}) }, (res) => {
      let raw = '';
      res.on('data', (d) => (raw += d));
      res.on('close', () => { let j = raw; try { j = JSON.parse(raw); } catch (e) { /* keep text */ } resolve({ status: res.statusCode, body: j }); });
    });
    req.setTimeout(60000, () => req.destroy(new Error('timeout')));
    req.on('error', reject);
    if (data) req.write(data);
    req.end();
  });
}

(async () => {
  const base = 'https://firebaserules.googleapis.com/v1/projects/' + PID;
  const rs = await call('POST', base + '/rulesets', { source: { files: [{ name: 'firestore.rules', content: fs.readFileSync(rulesFile, 'utf8') }] } });
  if (rs.status !== 200) throw new Error('rules rejected: ' + JSON.stringify(rs.body).slice(0, 400));
  const release = 'projects/' + PID + '/releases/cloud.firestore';
  let r = await call('POST', base + '/releases', { name: release, rulesetName: rs.body.name });
  if (r.status === 409) r = await call('PATCH', 'https://firebaserules.googleapis.com/v1/' + release, { release: { name: release, rulesetName: rs.body.name } });
  if (r.status !== 200) throw new Error('publish failed: ' + JSON.stringify(r.body).slice(0, 400));
  console.log('Rules published to ' + PID + '. Allow a minute or two for them to reach every server.');
})().catch((e) => { console.error(e.message); process.exit(1); });

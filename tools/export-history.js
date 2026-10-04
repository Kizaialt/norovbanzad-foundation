// Download the full edit history (every save ever made) as one JSON file.
//
//   node tools/export-history.js [output.json]
//
// The history is private: only the project owner can read it, so this uses the account signed in to
// the Firebase CLI (`firebase login`). Each entry has the text id (e.g. mn__hero.title), the new text,
// the previous text, who made the change (an anonymous per-browser label) and when. To bring an old
// wording back, open the edit link and type it in again, or ask for it to be restored from this file.
const fs = require('fs');
const path = require('path');
const https = require('https');

const lib = path.join(process.env.APPDATA || path.join(process.env.HOME || '', '.config'), 'npm', 'node_modules', 'firebase-tools', 'lib');
const auth = require(path.join(lib, 'auth'));
const configstore = require(path.join(lib, 'configstore')).configstore;
const config = fs.readFileSync(path.join(__dirname, '..', 'assets', 'js', 'live-config.js'), 'utf8');
const PID = (config.match(/projectId\s*:\s*'([^']+)'/) || [])[1];
const out = process.argv[2] || path.join(process.cwd(), 'history-' + new Date().toISOString().slice(0, 10) + '.json');

async function get(url) {
  const t = configstore.get('tokens');
  const access = (await auth.getAccessToken(t.refresh_token, ['https://www.googleapis.com/auth/cloud-platform'])).access_token;
  const u = new URL(url);
  return new Promise((resolve, reject) => {
    const req = https.request({ hostname: u.hostname, path: u.pathname + u.search, agent: false, headers: { Authorization: 'Bearer ' + access, Connection: 'close' } }, (res) => {
      let raw = '';
      res.on('data', (d) => (raw += d));
      res.on('close', () => { try { resolve({ status: res.statusCode, body: JSON.parse(raw) }); } catch (e) { reject(new Error('unreadable reply')); } });
    });
    req.setTimeout(60000, () => req.destroy(new Error('timeout')));
    req.on('error', reject);
    req.end();
  });
}

(async () => {
  const entries = [];
  let token = '';
  do {
    const r = await get('https://firestore.googleapis.com/v1/projects/' + PID + '/databases/(default)/documents/history?pageSize=300' + (token ? '&pageToken=' + encodeURIComponent(token) : ''));
    if (r.status !== 200) throw new Error('read failed: ' + JSON.stringify(r.body).slice(0, 300));
    (r.body.documents || []).forEach((d) => {
      const id = d.name.split('/').pop(), f = d.fields || {};
      const [textId, ms] = id.split('~');
      const v = (k) => (f[k] && f[k].stringValue) || '';
      entries.push({ id: textId, when: v('at') || new Date(Number(ms)).toISOString(), by: v('by'), html: v('html'), prev: v('prev') });
    });
    token = r.body.nextPageToken || '';
  } while (token);
  entries.sort((a, b) => (a.when < b.when ? -1 : 1));
  fs.writeFileSync(out, JSON.stringify(entries, null, 1) + '\n');
  console.log('Wrote ' + entries.length + ' history entries to ' + out);
})().catch((e) => { console.error(e.message); process.exit(1); });

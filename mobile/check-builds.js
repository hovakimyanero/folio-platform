const { execSync } = require('child_process');
const result = execSync('eas build:list --limit 10 --json', { 
  cwd: process.env.USERPROFILE + '/Desktop/folio-platform/mobile',
  encoding: 'utf-8',
  env: { ...process.env, NO_COLOR: '1' }
});
// Remove any non-JSON prefix
const jsonStart = result.indexOf('[');
const json = result.slice(jsonStart);
const builds = JSON.parse(json);
builds.forEach(b => {
  console.log(`${b.id} | ${b.status} | ${b.artifacts?.buildUrl || 'no artifact'}`);
});

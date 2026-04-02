import { createRequire } from 'module';
import { readFileSync } from 'fs';
import { resolve } from 'path';

// Load .env manually
const envPath = resolve(process.cwd(), '.env');
try {
  const envContent = readFileSync(envPath, 'utf-8');
  for (const line of envContent.split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eqIdx = trimmed.indexOf('=');
    if (eqIdx < 0) continue;
    const key = trimmed.slice(0, eqIdx).trim();
    const val = trimmed.slice(eqIdx + 1).trim().replace(/^["']|["']$/g, '');
    process.env[key] = val;
  }
} catch {}

const forgeApiUrl = process.env.BUILT_IN_FORGE_API_URL || 'https://forge.manus.im';
const forgeApiKey = process.env.BUILT_IN_FORGE_API_KEY || '';

const url = forgeApiUrl.replace(/\/$/, '') + '/v1/models';
console.log('Querying:', url);

const res = await fetch(url, {
  headers: { authorization: `Bearer ${forgeApiKey}` }
});

if (!res.ok) {
  console.error('Error:', res.status, await res.text());
  process.exit(1);
}

const data = await res.json();
if (data.data && Array.isArray(data.data)) {
  console.log('\nAvailable models:');
  data.data.forEach(m => {
    console.log(' -', m.id, m.owned_by ? `(${m.owned_by})` : '');
  });
} else {
  console.log(JSON.stringify(data, null, 2));
}

import { MongoClient } from 'mongodb';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const envPath = path.join('D:\\song\\next-app', '.env.local');
const env = fs.readFileSync(envPath, 'utf8');
const line = env.split(/\r?\n/).find((l) => l.startsWith('MONGODB_URI='));
const uri = line.slice('MONGODB_URI='.length).trim();

const trials = [
  { name: 'default', opts: {} },
  { name: 'tls:true', opts: { tls: true } },
  { name: 'tlsInsecure', opts: { tls: true, tlsInsecure: true } },
  { name: 'tlsAllowInvalidCertificates', opts: { tls: true, tlsAllowInvalidCertificates: true } },
  { name: 'tlsAllowInvalidHostnames', opts: { tls: true, tlsAllowInvalidCertificates: true, tlsAllowInvalidHostnames: true } },
  { name: 'minTLS1.2', opts: { tls: true, tlsInsecure: true, tlsOptions: { minVersion: 'TLSv1.2' } } },
];

for (const t of trials) {
  const client = new MongoClient(uri, {
    serverSelectionTimeoutMS: 8000,
    ...t.opts,
  });
  const start = Date.now();
  try {
    await client.connect();
    const db = client.db();
    await db.command({ ping: 1 });
    console.log(`[OK]   ${t.name}  (${Date.now() - start}ms)`);
    await client.close();
    console.log(`USABLE_OPTS: ${JSON.stringify(t.opts)}`);
    break;
  } catch (e) {
    console.log(`[FAIL] ${t.name}  (${Date.now() - start}ms)  ${String(e.message).split('\n')[0]}`);
    try { await client.close(); } catch {}
  }
}

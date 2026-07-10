#!/usr/bin/env node
// Quiz import: PUTs every quiz in js/seed.js to the server as published, then
// reads each back and verifies the round-trip. Run once after the first
// deploy, or any time the stored quizzes need restoring from the repo copy.
// Usage (see deploy-plan/DEPLOY.md):
//   SEED_TOKEN="<google-id-token>" node scripts/seed.mjs [baseUrl]
import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const BASE = (process.argv[2] || 'http://localhost:8888').replace(/\/$/, '');
const TOKEN = process.env.SEED_TOKEN;
if (!TOKEN) {
  console.error('SEED_TOKEN is required — a Google ID token from a signed-in admin (see deploy-plan/DEPLOY.md).');
  process.exit(1);
}

// js/seed.js is a browser script (`const SEED_QUIZZES=[...]`), not a module —
// evaluate it and pull the constant out.
const seedPath = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', 'js', 'seed.js');
const src = await readFile(seedPath, 'utf8');
const SEED_QUIZZES = new Function(`${src}; return SEED_QUIZZES;`)();

let failed = 0;
for (const quiz of SEED_QUIZZES) {
  try {
    const putRes = await fetch(`${BASE}/api/quizzes/${encodeURIComponent(quiz.id)}`, {
      method: 'PUT',
      headers: { 'content-type': 'application/json', authorization: `Bearer ${TOKEN}` },
      body: JSON.stringify({ ...quiz, published: true }),
    });
    const saved = await putRes.json().catch(() => ({}));
    if (!putRes.ok) throw new Error(saved.error || `PUT failed (${putRes.status})`);

    const getRes = await fetch(`${BASE}/api/quizzes/${encodeURIComponent(quiz.id)}`, {
      headers: { authorization: `Bearer ${TOKEN}` },
    });
    const fetched = await getRes.json().catch(() => ({}));
    if (!getRes.ok) throw new Error(fetched.error || `read-back failed (${getRes.status})`);

    // The server owns version/updatedAt; every other field we sent must
    // round-trip exactly.
    const mismatched = Object.keys(quiz).filter(
      (k) => k !== 'version' && JSON.stringify(quiz[k]) !== JSON.stringify(fetched[k])
    );
    if (mismatched.length) throw new Error(`round-trip mismatch in: ${mismatched.join(', ')}`);

    console.log(`✓ ${quiz.id} (v${saved.version})`);
  } catch (err) {
    failed++;
    console.error(`✗ ${quiz.id} — ${err.message}`);
  }
}

if (failed) {
  console.error(`${failed} quiz(es) failed.`);
  process.exit(1);
}
console.log(`Seeded ${SEED_QUIZZES.length} quizzes to ${BASE}.`);

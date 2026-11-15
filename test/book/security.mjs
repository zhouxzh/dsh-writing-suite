/** Credential redaction gate regression test. */
import assert from 'node:assert/strict';
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import { collectSecretFindings } from '../../lib/book/checks.js';

const root = mkdtempSync(join(tmpdir(), 'writing-secret-scan-'));
try {
	mkdirSync(join(root, 'docs'), { recursive: true });
	writeFileSync(join(root, 'docs', 'clean.md'), 'token: <TOKEN>\npassword: ${PASSWORD}\n', 'utf8');
	assert.equal(collectSecretFindings(root).length, 0, 'placeholders must not be blocked');
	writeFileSync(join(root, 'docs', 'leak.md'), `github: ${'ghp_'}${'a'.repeat(36)}\n`, 'utf8');
	const findings = collectSecretFindings(root);
	assert.equal(findings.length, 1);
	assert.equal(findings[0].rule, 'secret-github-token');
	assert.equal(findings[0].severity, 'error');
} finally {
	rmSync(root, { recursive: true, force: true });
}

console.log('security ok: placeholders pass, high-confidence tokens block');

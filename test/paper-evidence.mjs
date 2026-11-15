/** Submission-mode evidence gate and scaffold placeholder regression tests. */
import assert from 'node:assert/strict';
import { mkdtemp, mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import { auditPaper } from '../lib/paper/audit.js';
import { scaffoldPaper } from '../lib/paper/scaffold.js';

const root = await mkdtemp(join(tmpdir(), 'writing-paper-evidence-'));
try {
	await mkdir(join(root, 'audit'), { recursive: true });
	await writeFile(join(root, 'main.tex'), '\\documentclass{article}\\begin{document}x\\end{document}\n', 'utf8');
	await writeFile(join(root, 'claims_register.md'), '| ID | Claim | Status |\n|---|---|---|\n| C1 | result | pending |\n', 'utf8');
	await writeFile(
		join(root, 'audit', 'claim_evidence_map.md'),
		'| Claim | Evidence |\n|---|---|\n| C1 | `ace2:/tmp/results.csv` |\n',
		'utf8'
	);
	const draft = await auditPaper({ dir: root, mode: 'draft' });
	assert.ok(draft.findings.some((item) => item.code === 'claims-pending' && item.severity === 'info'));
	assert.ok(draft.findings.some((item) => item.code === 'remote-evidence-unverified' && item.severity === 'warn'));
	const submission = await auditPaper({ dir: root, mode: 'submission' });
	assert.ok(submission.findings.some((item) => item.code === 'claims-pending' && item.severity === 'error'));
	assert.ok(submission.findings.some((item) => item.code === 'remote-evidence-unverified' && item.severity === 'error'));

	const scaffoldRoot = await mkdtemp(join(tmpdir(), 'writing-paper-scaffold-'));
	try {
		const created = await scaffoldPaper({ root: scaffoldRoot, slug: 'paper', title: 'Paper' });
		const bib = await readFile(join(created.dir, 'references.bib'), 'utf8');
		assert.ok(!bib.includes('10.0000/example'));
		assert.ok(!bib.includes('Example Title'));
	} finally {
		await rm(scaffoldRoot, { recursive: true, force: true });
	}
} finally {
	await rm(root, { recursive: true, force: true });
}

console.log('paper evidence ok: submission blocks pending/remote evidence and scaffold has no fake DOI');

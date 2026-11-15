/** Response-letter text audit must fail closed on CLOSE/REVIEW. */
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import { mkdtemp, rm, writeFile } from 'node:fs/promises';
import { homedir, tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const script = join(
	dirname(fileURLToPath(import.meta.url)),
	'..',
	'skills',
	'reviewer-response-letter',
	'scripts',
	'verify_revision_text.py'
);

function run(args) {
	const candidates = [];
	if (process.env.DSH_PYTHON) candidates.push([process.env.DSH_PYTHON, []]);
	if (process.platform === 'win32') {
		for (const path of [
			join(homedir(), 'anaconda3', 'envs', 'sci-agent', 'python.exe'),
			join(homedir(), 'anaconda3', 'python.exe')
		]) if (existsSync(path)) candidates.push([path, []]);
		candidates.push(['py', ['-3']], ['python', []], ['python3', []]);
	} else candidates.push(['python3', []], ['python', []]);
	for (const [command, prefix] of candidates) {
		const result = spawnSync(command, [...prefix, script, ...args], { encoding: 'utf8' });
		if (result.error?.code !== 'ENOENT') return result;
	}
	throw new Error('Python 3 not found');
}

const root = await mkdtemp(join(tmpdir(), 'writing-response-gate-'));
try {
	const manuscript = join(root, 'manuscript.tex');
	const response = join(root, 'response.tex');
	await writeFile(manuscript, 'We report a mean absolute error of 0.12 on the held-out test set.\n', 'utf8');
	await writeFile(
		response,
		'\\begin{addedblock}We report a mean absolute error of 0.13 on the held-out test set.\\end{addedblock}\n',
		'utf8'
	);
	const result = run(['--manuscript', manuscript, '--response', response]);
	assert.equal(result.status, 2, result.stdout + result.stderr);
	assert.match(result.stdout, /MANUAL_REVIEW_REQUIRED/);
} finally {
	await rm(root, { recursive: true, force: true });
}

console.log('response gates ok: CLOSE/REVIEW returns manual-review status');

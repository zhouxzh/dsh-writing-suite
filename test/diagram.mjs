/** Geometry test for the merged TikZ neural-diagram audit. */
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { homedir, tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const script = join(dirname(fileURLToPath(import.meta.url)), '..', 'lib', 'diagram', 'check_tikz_paths.py');
const root = await mkdtemp(join(tmpdir(), 'writing-suite-diagram-'));
const source = join(root, 'figure.tex');
const layout = join(root, 'figure.layout.json');

await writeFile(source, '\\begin{tikzpicture}\\node (a) at (1,1) {A};\\end{tikzpicture}\n', 'utf8');
const sourceHash = createHash('sha256').update(await readFile(source)).digest('hex');
await writeFile(layout, JSON.stringify({
	source_sha256: sourceHash,
	boxes: [
		{ name: 'a', kind: 'module', rect: [0, 0, 2, 2] },
		{ name: 'b', kind: 'module', rect: [3, 0, 5, 2] }
	],
	paths: [
		{ name: 'outer', polyline: [[-0.5, 1], [-0.5, 2.5], [5.5, 2.5], [5.5, 1]], allowed_boxes: [] },
		{ name: 'collision', polyline: [[0, 1], [1, 1]], allowed_boxes: [] }
	]
}), 'utf8');

function run(command, prefix = [], extra = []) {
	return spawnSync(command, [...prefix, script, '--source', source, '--layout', layout, ...extra], { encoding: 'utf8' });
}

try {
	const candidates = [];
	if (process.env.DSH_PYTHON) candidates.push([process.env.DSH_PYTHON, []]);
	if (process.env.PYTHON) candidates.push([process.env.PYTHON, []]);
	if (process.platform === 'win32') {
		for (const candidate of [
			join(homedir(), 'anaconda3', 'envs', 'sci-agent', 'python.exe'),
			join(homedir(), 'anaconda3', 'python.exe'),
			join(homedir(), 'miniconda3', 'envs', 'sci-agent', 'python.exe'),
			join(homedir(), 'miniconda3', 'python.exe')
		]) if (existsSync(candidate)) candidates.push([candidate, []]);
		candidates.push(['py', ['-3']], ['python', []], ['python3', []]);
	} else {
		candidates.push(['python3', []], ['python', []]);
	}
	let result;
	for (const [command, prefix] of candidates) {
		result = run(command, prefix);
		if (result.error?.code !== 'ENOENT' && result.stdout.trim() !== '') break;
	}
	assert.ok(result !== undefined && result.stdout.trim() !== '', 'Python 3 was not found');
	const report = JSON.parse(result.stdout);
	assert.equal(report.ok, false, 'collision fixture must fail');
	assert.ok(report.findings.some((finding) => finding.path === 'collision' && finding.box === 'a'));
	assert.ok(!report.findings.some((finding) => finding.path === 'outer' && finding.box !== undefined));
	assert.ok(!report.findings.some((finding) => finding.path === 'source' && finding.severity === 'error'));

	await writeFile(source, '\\begin{tikzpicture}\\node (a) at (2,1) {A};\\end{tikzpicture}\n', 'utf8');
	let mismatch;
	for (const [command, prefix] of candidates) {
		mismatch = run(command, prefix, ['--require-hash']);
		if (mismatch.error?.code !== 'ENOENT' && mismatch.stdout.trim() !== '') break;
	}
	const drift = JSON.parse(mismatch.stdout);
	assert.equal(drift.ok, false);
	assert.ok(drift.findings.some((finding) => finding.path === 'source' && finding.severity === 'error'));
} finally {
	await rm(root, { recursive: true, force: true });
}

console.log('diagram ok: box collision detected and outer route accepted');

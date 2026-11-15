/** Regression tests for cover/response letter false-pass gates. */
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { mkdtemp, rm, writeFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { homedir, tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const identityScript = join(root, 'skills', 'paper-cover-letter', 'scripts', 'check_letter_identity.py');
const coverScript = join(root, 'skills', 'paper-cover-letter', 'scripts', 'check_cover_letter.py');

function candidates() {
	const list = [];
	if (process.env.DSH_PYTHON) list.push([process.env.DSH_PYTHON, []]);
	if (process.env.PYTHON) list.push([process.env.PYTHON, []]);
	if (process.platform === 'win32') {
		for (const path of [
			join(homedir(), 'anaconda3', 'envs', 'sci-agent', 'python.exe'),
			join(homedir(), 'anaconda3', 'python.exe')
		]) if (existsSync(path)) list.push([path, []]);
		list.push(['py', ['-3']], ['python', []], ['python3', []]);
	} else {
		list.push(['python3', []], ['python', []]);
	}
	return list;
}

function run(script, args) {
	for (const [command, prefix] of candidates()) {
		const result = spawnSync(command, [...prefix, script, ...args], { encoding: 'utf8' });
		if (result.error?.code !== 'ENOENT') return result;
	}
	throw new Error('Python 3 not found');
}

const dir = await mkdtemp(join(tmpdir(), 'writing-suite-letters-'));
try {
	const emptyA = join(dir, 'empty-a.tex');
	const emptyB = join(dir, 'empty-b.tex');
	await writeFile(emptyA, 'nothing\n', 'utf8');
	await writeFile(emptyB, 'nothing\n', 'utf8');
	const missing = run(identityScript, [emptyA, emptyB]);
	assert.equal(missing.status, 1, 'missing identity fields must fail');

	const macros = (title) => [
		`\\newcommand{\\papertitle}{${title}}`,
		'\\newcommand{\\journalname}{Journal}',
		'\\newcommand{\\manuscriptid}{ID-1}',
		'\\newcommand{\\revisiondate}{1 January 2026}',
		'\\newcommand{\\correspondingauthor}{Dr. Author}',
		'\\newcommand{\\correspondingemail}{author@example.org}',
		'\\newcommand{\\affiliation}{University}',
		'\\newcommand{\\affiliationlines}{City, Country}'
	].join('\n') + '\n';
	const cover = join(dir, 'cover.tex');
	const response = join(dir, 'response.tex');
	await writeFile(cover, macros('Exact title'), 'utf8');
	await writeFile(response, macros('Exact title'), 'utf8');
	assert.equal(run(identityScript, [cover, response]).status, 0, 'matching metadata must pass');
	await writeFile(response, macros('Exact Title'), 'utf8');
	assert.equal(run(identityScript, [cover, response]).status, 1, 'case differences must fail');

	const letter = join(dir, 'letter.tex');
	await writeFile(letter, [
		'\\newcommand{\\papertitle}{Title}',
		'\\setkomavar{subject}{Submission}',
		'\\setkomavar{date}{1 January 2026}',
		'\\begin{letter}{Editorial Office}',
		'\\opening{Dear Editor}',
		'Our manuscript fits within the 10-page limit and improves MAE by 12\\%.',
		'\\closing{Yours sincerely}',
		'\\end{letter}',
		'author@example.org'
	].join('\n'), 'utf8');
	const coverCheck = run(coverScript, [letter]);
	assert.equal(coverCheck.status, 1, 'unverifiable page and quantity claims must fail');
	assert.match(coverCheck.stdout, /manuscript-pdf was not provided/);
	assert.match(coverCheck.stdout, /--manuscript was not provided/);
} finally {
	await rm(dir, { recursive: true, force: true });
}

console.log('letters ok: missing identity, case mismatch, and unverifiable claims fail closed');

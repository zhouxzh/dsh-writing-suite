#!/usr/bin/env node
/**
 * Copy every bundled skill into a DSH skill root.
 *
 * Skills are plain files: dropping `<name>/SKILL.md` into a scanned skill root is
 * all that DSH needs. Directories without a `SKILL.md` are support material and
 * are skipped (they are copied only when a sibling skill references them by path
 * inside its own directory).
 *
 * Usage:
 *   node scripts/install-skill.mjs                 # install to ~/.dsh/skills
 *   node scripts/install-skill.mjs --target <dir>  # install elsewhere
 *   node scripts/install-skill.mjs --check         # verify, non-zero when stale
 */

import { createHash } from 'node:crypto';
import { cp, mkdir, readFile, readdir, stat } from 'node:fs/promises';
import { homedir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const skillsRoot = resolve(here, '..', 'skills');

/** SHA-256 of a file, or undefined when it is absent. */
async function hash(path) {
	try {
		return createHash('sha256').update(await readFile(path)).digest('hex');
	} catch {
		return undefined;
	}
}

/** Support directories referenced by sibling skills but carrying no SKILL.md. */
const SUPPORT_DIRECTORIES = new Set(['nature-shared']);

/** Skill directories, plus explicitly supported shared resource directories. */
export async function listSkills(root = skillsRoot) {
	const entries = await readdir(root, { withFileTypes: true });
	const skills = [];
	const support = [];
	const skipped = [];
	for (const entry of entries) {
		if (!entry.isDirectory()) continue;
		const dir = join(root, entry.name);
		try {
			await stat(join(dir, 'SKILL.md'));
			skills.push({ name: entry.name, dir });
		} catch {
			if (SUPPORT_DIRECTORIES.has(entry.name)) support.push({ name: entry.name, dir });
			else skipped.push(entry.name);
		}
	}
	skills.sort((a, b) => a.name.localeCompare(b.name));
	support.sort((a, b) => a.name.localeCompare(b.name));
	return { skills, support, skipped };
}

/** Walk all regular files below one directory. */
async function walkFiles(dir, prefix = '') {
	const entries = await readdir(join(dir, prefix), { withFileTypes: true });
	const files = [];
	for (const entry of entries) {
		const rel = prefix === '' ? entry.name : `${prefix}/${entry.name}`;
		if (entry.isDirectory()) files.push(...await walkFiles(dir, rel));
		else if (entry.isFile()) files.push(rel);
	}
	return files;
}

/** Compare one complete skill/support tree without writing. */
async function treeState(sourceDir, targetDir) {
	const files = await walkFiles(sourceDir);
	for (const rel of files) {
		const sourceHash = await hash(join(sourceDir, rel));
		const destHash = await hash(join(targetDir, rel));
		if (destHash === undefined) return 'missing';
		if (destHash !== sourceHash) return 'stale';
	}
	return 'current';
}

/**
 * Install, or with `check: true`, compare without writing.
 * @param {{target?: string, check?: boolean}} options
 */
export async function installSkills({ target, check = false } = {}) {
	const root = target === undefined ? join(homedir(), '.dsh', 'skills') : resolve(target);
	const { skills, support, skipped } = await listSkills();
	const results = [];

	for (const item of [...skills, ...support]) {
		const dest = join(root, item.name);
		const state = await treeState(item.dir, dest);
		if (check) {
			results.push({ name: item.name, state });
			continue;
		}
		await mkdir(root, { recursive: true });
		await cp(item.dir, dest, { recursive: true, force: true });
		results.push({
			name: item.name,
			state: state === 'current' ? 'current' : state === 'missing' ? 'installed' : 'updated'
		});
	}

	return { root, results, support, skipped };
}

// Windows exposes argv[1] as a native path, so compare canonical file URLs
// instead of hand-building one (two slashes vs three silently never matches).
const invokedDirectly = process.argv[1] !== undefined && import.meta.url === pathToFileURL(process.argv[1]).href;

if (invokedDirectly) {
	const args = process.argv.slice(2);
	const check = args.includes('--check');
	const index = args.indexOf('--target');
	const target = index === -1 ? undefined : args[index + 1];
	const { root, results, skipped } = await installSkills({ target, check });

	for (const item of results) console.log(`${item.state.padEnd(9)} ${item.name}`);
	if (skipped.length > 0) console.log(`skipped (no SKILL.md): ${skipped.join(', ')}`);
	console.log(`skill root: ${root}`);

	if (check) {
		const bad = results.filter((item) => item.state !== 'current');
		if (bad.length > 0) {
			console.error(`${bad.length} skill(s) missing or stale; run: node scripts/install-skill.mjs`);
			process.exit(1);
		}
		console.log('all bundled skills are installed and current');
	}
}

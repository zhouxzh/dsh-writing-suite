import { spawn } from 'node:child_process';
import { existsSync } from 'node:fs';
import { homedir } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { defineTool } from '@deepseek-ai/dsh-tools';

const SCRIPT = join(dirname(fileURLToPath(import.meta.url)), 'check_tikz_paths.py');

function run(command, args) {
	return new Promise((resolve, reject) => {
		const child = spawn(command, args, { windowsHide: true, stdio: ['ignore', 'pipe', 'pipe'] });
		let stdout = '';
		let stderr = '';
		child.stdout.on('data', (chunk) => { stdout += chunk; });
		child.stderr.on('data', (chunk) => { stderr += chunk; });
		child.on('error', reject);
		child.on('close', (code) => resolve({ code, stdout, stderr }));
	});
}

function pythonCandidates() {
	const candidates = [];
	for (const envName of ['DSH_PYTHON', 'PYTHON']) {
		if (process.env[envName]) candidates.push([process.env[envName], []]);
	}
	if (process.platform === 'win32') {
		const home = homedir();
		for (const path of [
			join(home, 'anaconda3', 'envs', 'sci-agent', 'python.exe'),
			join(home, 'anaconda3', 'python.exe'),
			join(home, 'miniconda3', 'envs', 'sci-agent', 'python.exe'),
			join(home, 'miniconda3', 'python.exe')
		]) {
			if (existsSync(path)) candidates.push([path, []]);
		}
		candidates.push(['py', ['-3']], ['python', []], ['python3', []]);
	} else {
		candidates.push(['python3', []], ['python', []]);
	}
	return candidates;
}

async function runPython(args) {
	const candidates = pythonCandidates();
	let last;
	for (const [command, prefix] of candidates) {
		try {
			const result = await run(command, [...prefix, SCRIPT, ...args]);
			if (result.code === 127 || (result.code === 0 && result.stdout.trim() === '')) {
				last = new Error(result.stderr || `${command} produced no output`);
				continue;
			}
			if (result.stdout.trim() === '') throw new Error(result.stderr || `${command} produced no output`);
			return JSON.parse(result.stdout);
		} catch (error) {
			last = error;
		}
	}
	throw last ?? new Error('Python 3 was not found');
}

export function registerDiagramTool(ctx) {
	ctx.tools.register(defineTool({
		name: 'ascend310b_writing_neural_diagram_audit',
		description:
			'Audit a TikZ neural-network diagram against an explicit geometry sidecar. Detects connector segments that enter, cross, or touch module/text boxes; reports unintended path crossings; and can suggest outer routing channels. Use after moving modules or connectors and before compiling the manuscript.',
		parameters: {
			source: { type: 'string', required: true, description: 'TikZ source file, absolute or relative to the current working directory.' },
			layout: { type: 'string', description: 'Optional JSON layout sidecar. Defaults to the source basename with .layout.json.' },
			margin: { type: 'number', description: 'Clearance around boxes in TikZ coordinate units. Default 0.04.' },
			suggest: { type: 'boolean', description: 'Include suggested outer routing channels. Default true.' }
		},
		output: {
			schema: { type: 'object', additionalProperties: true },
			render: (_args, value) => [{ type: 'text', text: value?.text ?? JSON.stringify(value, null, 2) }]
		},
		execute: async (args) => {
			try {
				return await runPython([
					'--source', args.source,
					...(args.layout ? ['--layout', args.layout] : []),
					...(args.margin !== undefined ? ['--margin', String(args.margin)] : []),
					...(args.suggest === false ? ['--no-suggest'] : [])
				]);
			} catch (error) {
				return { ok: false, text: `Neural diagram audit failed: ${error?.message ?? error}` };
			}
		},
		presentCall: (args) => ({ card: 'generic', title: '神经网络框图路径审计', kind: 'other', rawInput: args })
	}));
}

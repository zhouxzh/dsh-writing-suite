import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { invoke, resolveRoot } from '../mcp/operations.js';

const pluginRoot = join(dirname(fileURLToPath(import.meta.url)), '..');
const repoRoot = join(pluginRoot, '..', '..');
assert.equal(resolveRoot(repoRoot), resolveRoot());
assert.throws(() => resolveRoot(pluginRoot), /不是 Ascend310 教材仓库/u);
assert.throws(() => invoke('ascend310b_writing_page_layout', { root: repoRoot, url: 'https://example.com/' }), /只接受本机/u);
assert.throws(() => invoke('ascend310b_writing_record_audit', { root: repoRoot, file: '../AGENTS.md' }));
assert.throws(() => invoke('ascend310b_writing_build_status', { jobId: '00000000-0000-0000-0000-000000000000' }), /不存在/u);

const preflight = invoke('ascend310b_writing_build', { root: repoRoot, target: 'site' });
assert.equal(preflight.started, false);
assert.equal(preflight.target, 'site');
const audit = invoke('ascend310b_writing_audit', { root: repoRoot, maxFindings: 5 });
assert.ok(audit.summary.files > 0);
assert.ok(audit.findings.length <= 5);
const render = invoke('ascend310b_writing_render', { root: repoRoot });
assert.ok(Array.isArray(render.findings));

const child = spawn(process.execPath, ['mcp/server.js', 'stdio'], { cwd: pluginRoot, stdio: ['pipe', 'pipe', 'pipe'] });
const messages = [];
let buffer = '';
let stderr = '';
child.stdout.on('data', (chunk) => {
  buffer += chunk.toString('utf8');
  const lines = buffer.split(/\r?\n/u);
  buffer = lines.pop() ?? '';
  for (const line of lines) if (line.trim()) messages.push(JSON.parse(line));
});
child.stderr.on('data', (chunk) => { stderr += chunk.toString('utf8'); });

function request(id, method, params = {}) {
  child.stdin.write(`${JSON.stringify({ jsonrpc: '2.0', id, method, params })}\n`);
  return new Promise((resolveResponse, reject) => {
    const timeout = setTimeout(() => {
      clearInterval(poll);
      reject(new Error(`MCP 超时：${method}; ${stderr}`));
    }, 15000);
    const poll = setInterval(() => {
      const found = messages.find((message) => message.id === id);
      if (!found) return;
      clearTimeout(timeout);
      clearInterval(poll);
      resolveResponse(found);
    }, 20);
  });
}

try {
  const initialized = await request(1, 'initialize', { protocolVersion: '2025-03-26', capabilities: {}, clientInfo: { name: 'writing-smoke', version: '0.1.0' } });
  assert.equal(initialized.result.serverInfo.name, 'ascend310b-writing');
  const listed = await request(2, 'tools/list');
  assert.equal(listed.result.tools.length, 12);
  assert.ok(listed.result.tools.some((tool) => tool.name === 'ascend310b_writing_audit'));
  const called = await request(3, 'tools/call', { name: 'ascend310b_writing_build', arguments: { root: repoRoot, target: 'site' } });
  assert.equal(called.result.structuredContent.started, false);
  console.log('writing MCP smoke passed');
} finally {
  child.kill();
}

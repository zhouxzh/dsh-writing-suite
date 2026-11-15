/** Import test for the optional MCP surface and merged paper operations. */
import assert from 'node:assert/strict';

const { createMcpServer } = await import('../mcp/server.js');
const { invoke } = await import('../mcp/operations.js');

assert.equal(typeof createMcpServer, 'function');
assert.equal(typeof invoke, 'function');
await assert.rejects(() => invoke('unknown_tool', {}));

console.log('mcp ok: server and merged operations import');

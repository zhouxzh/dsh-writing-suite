/** Case 4 self-containment regression test. */
import assert from 'node:assert/strict';
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import { auditRepo } from '../../lib/book/audit-core.js';

const root = mkdtempSync(join(tmpdir(), 'writing-case4-'));
try {
	mkdirSync(join(root, 'src', 'book'), { recursive: true });
	mkdirSync(join(root, 'src', 'experiment'), { recursive: true });
	mkdirSync(join(root, 'samples', 'case4'), { recursive: true });
	writeFileSync(join(root, 'src', 'book', 'chapter1.md'), '# 第1章：测试\n', 'utf8');
	writeFileSync(
		join(root, 'src', 'experiment', 'case4.md'),
		'# 案例 4：掌纹识别\n\n## 依赖测试\n\n[错误依赖](../book/chapter1.md)\n',
		'utf8'
	);
	const audit = auditRepo({ root, maxFindings: 500 });
	assert.ok(
		audit.findings.some((finding) => finding.rule === 'case4-link-dependency' && finding.severity === 'error'),
		'case4 local dependency on another manuscript must fail'
	);
} finally {
	rmSync(root, { recursive: true, force: true });
}

console.log('case4 ok: cross-manuscript local dependency is blocked');

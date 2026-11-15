/** Patent-disclosure skill integration test. */
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..', 'skills');
const patentDir = join(root, 'patent-disclosure');
const skill = await readFile(join(patentDir, 'SKILL.md'), 'utf8');
const template = await readFile(join(patentDir, 'assets', 'technical-disclosure-template.md'), 'utf8');
const diagram = await readFile(join(root, 'diagram-design', 'SKILL.md'), 'utf8');

const sections = [
	'一、发明创造的技术方案名称',
	'二、技术方案应用的技术领域',
	'三、背景技术',
	'四、本发明内容',
	'五、本发明技术方案的优点',
	'六、本发明的其他替代方案',
	'七、附图及附图说明',
	'八、具体实施方式',
	'九、'
];
for (const section of sections) {
	assert.ok(template.includes(section), `template missing section: ${section}`);
}
assert.match(skill, /九段/);
assert.match(skill, /不生成权利要求或正式申请文件/);
assert.ok(skill.includes('references/research-and-prior-art.md'));
assert.ok(skill.includes('references/data-model-disclosure.md'));
assert.match(diagram, /^---\nname: diagram-design\n/m);
assert.match(diagram, /箭头不穿节点/);

console.log('patent ok: nine-section disclosure, references, and diagram rules bundled');

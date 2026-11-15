import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { z } from 'zod';

import { invoke } from './operations.js';

const root = z.string().optional().describe('Ascend310 教材仓库的绝对路径。省略时使用 TUTORIAL_WRITING_ROOT 或插件所在仓库。');
const scope = z.enum(['all', 'book', 'experiment', 'appendix', 'presentation', 'misc']).optional();
const maxFindings = z.number().int().min(1).max(2000).optional();

function result(value) {
  return { structuredContent: value, content: [{ type: 'text', text: value.text ?? JSON.stringify(value) }] };
}

function errorResult(error) {
  return { isError: true, content: [{ type: 'text', text: `写作工具执行失败：${String(error?.message ?? error)}` }] };
}

export function createMcpServer() {
  const server = new McpServer(
    { name: 'dsh-writing-suite', version: '1.2.0' },
    { instructions: '先读仓库 AGENTS.md 和对应写作 skill。教材结论以源 Markdown 为准，论文数字以证据文件为准；自动检查不能代替人工验收。构建只在用户要求生成产物时执行，教材构建必须显式传 confirm: true。' }
  );

  const register = (name, title, description, inputSchema, write = false) => {
    server.registerTool(name, {
      title, description, inputSchema,
      annotations: { readOnlyHint: !write, destructiveHint: false, openWorldHint: name === 'ascend310b_writing_ci' }
    }, async (args) => {
      try { return result(await invoke(name, args)); }
      catch (error) { return errorResult(error); }
    });
  };

  register('ascend310b_writing_audit', '审计教材',
    '检查 Markdown、冻结标题、锚点、链接、图片、站点配置、课件和交叉产物；rev 可额外检查提交树断链。',
    { root, scope, rev: z.string().optional(), maxFindings });
  register('ascend310b_writing_record_audit', '审计学习记录',
    '检查仓库 tmp/ 下的一份 Markdown 学习实验记录，不套用教材冻结标题规则。',
    { root, file: z.string().min(1), maxFindings });
  register('ascend310b_writing_deck_render', '检查课件渲染',
    '用真实浏览器检查已生成 Marp 课件的裁切和图片加载情况。',
    { root, deck: z.string().optional() });
  register('ascend310b_writing_page_layout', '检查网页排版',
    '检查本地 VuePress 页面在桌面和移动视口的溢出；人工视觉验收仍须完成。',
    { root, url: z.string().url(), viewports: z.string().optional() });
  register('ascend310b_writing_render', '检查 PDF 渲染',
    '读取 LaTeX 构建日志、缺字形、引用、页面溢出、产物新鲜度和源锚点映射。',
    { root, logPath: z.string().optional() });
  register('ascend310b_writing_push_check', '检查推送门槛',
    '检查提交树断链、正文审计、产物状态，并明确提示仍需用户确认本地预览；不会执行 push。',
    { root, rev: z.string().optional() });
  register('ascend310b_writing_ci', '查看 Pages 构建',
    '通过已登录的 gh CLI 读取 GitHub Pages 工作流运行状态和失败步骤。',
    { root, runId: z.string().optional() });
  register('ascend310b_writing_progress', '统计写作进度',
    '统计章节字数、标题、图片、代码块、阅读时间和 sidebar 覆盖。',
    { root, scope });
  register('ascend310b_writing_toolchain', '检查写作工具链',
    '检查本机 bash、pandoc、LaTeX、Python、pnpm 等构建依赖，不执行构建。',
    { root });
  register('ascend310b_writing_style', '检查文风',
    '诊断营销腔、空转套话、元话语和对话残留；命中项需要人工判断。',
    { root, scope });
  register('ascend310b_writing_build', '构建教材产物',
    '默认只预检；confirm: true 才启动后台构建，并在完成后检查产物。仅在用户要求生成产物时使用。',
    { root, target: z.enum(['latex', 'site', 'all']).optional(), confirm: z.boolean().optional() }, true);
  register('ascend310b_writing_build_status', '查看构建任务',
    '按 jobId 查看构建状态和最近日志；cancel: true 可停止正在运行的构建。',
    { jobId: z.string().uuid(), cancel: z.boolean().optional() }, true);
  register('ascend310b_writing_neural_diagram_audit', '审计神经网络框图',
    '检查 TikZ 连线与模块/文字框冲突、路径交叉和 layout source hash 漂移。',
    { source: z.string().min(1), layout: z.string().optional(), margin: z.number().optional(), suggest: z.boolean().optional(), requireHash: z.boolean().optional() });

  const workspace = z.string().min(1).describe('论文工作区的绝对路径。');
  register('paper_scaffold', '生成论文骨架',
    '创建中文 LaTeX 论文工作区；已有文件不会被覆盖。',
    { root: z.string().min(1), slug: z.string().min(1), title: z.string().min(1), author: z.string().optional(), dryRun: z.boolean().optional() }, true);
  register('paper_audit', '审计论文',
    '离线检查引用、参考文献、claim map、远程证据、pending claim、占位符和 PDF 新鲜度。',
    { workspace, mode: z.enum(['draft', 'submission']).optional(), maxFindings });
  register('paper_build', '构建论文',
    '用 latexmk 构建论文并返回错误、未定义引用、缺字形和页数。',
    { workspace, entry: z.string().optional(), engine: z.enum(['auto', 'xelatex', 'pdflatex', 'lualatex']).optional(), timeoutMs: z.number().int().positive().optional() }, true);
  register('paper_sync_evidence', '同步论文证据',
    '从远程代码仓复制紧凑证据文件并登记 SHA-256；二进制产物拒收。',
    { workspace, host: z.string().optional(), remotePaths: z.string().min(1), overwrite: z.boolean().optional(), dryRun: z.boolean().optional() }, true);
  register('paper_kit', '论文一键流程',
    '生成骨架、审计，并可选择编译论文。',
    { root: z.string().min(1), slug: z.string().min(1), title: z.string().min(1), author: z.string().optional(), scaffold: z.boolean().optional(), build: z.boolean().optional() }, true);
  register('paper_review', '论文完整性审阅',
    '审阅单篇论文或根目录下全部论文的完整性、证据、逻辑和学术表达。',
    { root: z.string().optional(), workspace: z.string().optional(), maxFindings });

  return server;
}

if (process.argv[1] && fileURLToPath(import.meta.url) === resolve(process.argv[1])) {
  if (process.argv[2] !== 'stdio') {
    console.error('仅支持 stdio 模式：node mcp/server.js stdio');
    process.exitCode = 1;
  } else {
    createMcpServer().connect(new StdioServerTransport()).catch((error) => {
      console.error(`MCP 启动失败：${String(error?.message ?? error)}`);
      process.exitCode = 1;
    });
  }
}

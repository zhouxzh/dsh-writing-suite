import { randomUUID } from 'node:crypto';
import { spawnSync } from 'node:child_process';
import { existsSync, realpathSync } from 'node:fs';
import { homedir } from 'node:os';
import { dirname, isAbsolute, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { PARTS, auditLearnerRecord, auditRepo, progressReport, resolveSettings, sortFindings } from '../lib/book/audit-core.js';
import {
  collectArtifactFindings, collectAssetFindings, collectCommitFindings,
  collectFrozenNameFindings, collectLatexChapterFindings, collectRenderFindings,
  describeCommit, describeFrozenNames, evaluatePushGate
} from '../lib/book/checks.js';
import { diagnose } from '../lib/book/doctor.js';
import { collectVuepressFindings } from '../lib/book/vuepress.js';
import { collectCodeFindings } from '../lib/book/code.js';
import { collectCodeDocs } from '../lib/book/code-docs.js';
import { collectDeckFindings } from '../lib/book/deck.js';
import { collectSiteFindings, describeSite } from '../lib/book/site.js';
import { collectFigureFindings, describeFigures } from '../lib/book/figures.js';
import { collectDeckWebFindings, describeDeckWeb } from '../lib/book/deck-web.js';
import { collectDeckRenderFindings } from '../lib/book/deck-render.js';
import { collectPageLayoutFindings } from '../lib/book/page-layout.js';
import { collectCiStatus } from '../lib/book/ci.js';
import { collectCoursewareFindings } from '../lib/book/courseware.js';
import { analyzeStyle, formatStyle } from '../lib/book/style.js';
import { planBuild, resolveBuildEnvironment, runBuild } from '../lib/book/build.js';
import { auditPaper } from '../lib/paper/audit.js';
import { buildPaper } from '../lib/paper/build.js';
import { reviewCollection, reviewPaper } from '../lib/paper/review.js';
import { scaffoldPaper } from '../lib/paper/scaffold.js';
import { syncEvidence } from '../lib/paper/sync.js';

const scopes = new Set(['all', ...PARTS.map((part) => part.key)]);
const jobs = new Map();
const pluginRoot = dirname(dirname(fileURLToPath(import.meta.url)));

function neuralDiagramAudit(args) {
  const script = join(pluginRoot, 'lib', 'diagram', 'check_tikz_paths.py');
  const candidates = [];
  if (process.env.DSH_PYTHON) candidates.push([process.env.DSH_PYTHON, []]);
  if (process.env.PYTHON) candidates.push([process.env.PYTHON, []]);
  if (process.platform === 'win32') {
    for (const path of [
      join(homedir(), 'anaconda3', 'envs', 'sci-agent', 'python.exe'),
      join(homedir(), 'anaconda3', 'python.exe')
    ]) if (existsSync(path)) candidates.push([path, []]);
    candidates.push(['py', ['-3']], ['python', []], ['python3', []]);
  } else {
    candidates.push(['python3', []], ['python', []]);
  }
  const cli = [
    '--source', args.source,
    ...(args.layout ? ['--layout', args.layout] : []),
    ...(args.margin !== undefined ? ['--margin', String(args.margin)] : []),
    ...(args.suggest === false ? ['--no-suggest'] : []),
    ...(args.requireHash === true ? ['--require-hash'] : [])
  ];
  for (const [command, prefix] of candidates) {
    const result = spawnSync(command, [...prefix, script, ...cli], { encoding: 'utf8' });
    if (result.error?.code === 'ENOENT' || (result.status === 0 && !result.stdout.trim())) continue;
    if (!result.stdout.trim()) throw new Error(result.stderr || `${command} produced no output`);
    return JSON.parse(result.stdout);
  }
  throw new Error('Python 3 was not found');
}

export function resolveRoot(argument) {
  const selected = argument?.trim() || process.env.TUTORIAL_WRITING_ROOT?.trim();
  if (!selected) throw new Error('未提供教材仓库根目录：请传 root 或设置 TUTORIAL_WRITING_ROOT。');
  if (!isAbsolute(selected)) throw new Error('root 必须是仓库的绝对路径。');
  const root = realpathSync(selected);
  if (!['AGENTS.md', 'package.json', join('src', 'book'), join('src', 'experiment')].every((entry) => existsSync(join(root, entry)))) {
    throw new Error(`这不是 Ascend310 教材仓库根目录：${root}。可传 root 或设置 TUTORIAL_WRITING_ROOT。`);
  }
  return root;
}

function context(args) {
  const root = resolveRoot(args.root);
  return { root, settings: resolveSettings({ root }) };
}

function scopeOf(value) {
  return scopes.has(value) ? value : 'all';
}

function capOf(value) {
  return Number.isInteger(value) && value > 0 ? value : 400;
}

function audit(args) {
  const { root, settings } = context(args);
  const frozen = collectFrozenNameFindings({ root, settings });
  const extras = [...frozen.findings];
  const notes = [describeFrozenNames(frozen)];
  if (args.rev?.trim()) {
    const commit = collectCommitFindings({ root, rev: args.rev.trim() });
    extras.push(...commit.findings);
    notes.push(describeCommit(commit, args.rev.trim()));
  }
  const assets = collectAssetFindings({ root, settings });
  extras.push(...assets.findings);
  notes.push(`交叉产物：${assets.decks} 个课件，${assets.slidesStale} 个过期，${assets.slidesMissing} 个未构建。`);
  const vuepress = collectVuepressFindings({ root, settings, frozenRows: frozen.tableRows });
  extras.push(...vuepress.findings);
  const code = collectCodeFindings({ root, settings });
  extras.push(...code.findings);
  const codeDocs = collectCodeDocs({ root });
  extras.push(...codeDocs.findings);
  const deck = collectDeckFindings({ root, settings });
  extras.push(...deck.findings);
  const courseware = collectCoursewareFindings({ root, settings });
  extras.push(...courseware.findings);
  const latexMap = collectLatexChapterFindings({ root, settings });
  extras.push(...latexMap.findings);
  const site = collectSiteFindings({ root, settings });
  extras.push(...site.findings);
  notes.push(describeSite(site));
  const figures = collectFigureFindings({ root, settings });
  extras.push(...figures.findings);
  notes.push(describeFigures(figures));
  const deckWeb = collectDeckWebFindings({ root, settings });
  extras.push(...deckWeb.findings);
  notes.push(describeDeckWeb(deckWeb));
  const report = auditRepo({ root, scope: scopeOf(args.scope), maxFindings: capOf(args.maxFindings), extraFindings: extras, settings });
  return { text: [report.text, '', ...notes].join('\n'), summary: report.summary, findings: report.findings };
}

function render(args) {
  const { root, settings } = context(args);
  const report = collectRenderFindings({ root, logPath: args.logPath, settings });
  const artifacts = collectArtifactFindings({ root, settings });
  return {
    text: [report.text, '', `产物新鲜度：${artifacts.pairs} 对源/产物、${artifacts.anchors} 个源锚点，${artifacts.findings.length} 条产物问题。`].join('\n'),
    available: report.available,
    stats: report.stats ?? { hardErrors: 0, missingCharacters: 0, undefinedReferences: 0, overfull: 0, stale: false },
    findings: sortFindings([...report.findings, ...artifacts.findings])
  };
}

function buildPlan(args) {
  const { root, settings } = context(args);
  const target = ['latex', 'site', 'all'].includes(args.target) ? args.target : 'latex';
  const environment = resolveBuildEnvironment();
  const plan = planBuild({ root, target, adapter: environment.adapter, components: environment.components, settings });
  const steps = plan.steps.map((step) => ({ label: step.label, command: step.command, args: step.args }));
  return { root, settings, target, environment, plan, steps };
}

function jobView(job) {
  return { jobId: job.id, target: job.target, status: job.status, text: `构建任务 ${job.id}（${job.status}）：${job.text}`, log: job.log.slice(-32000), result: job.result ?? null };
}

function build(args) {
  const { root, settings, target, environment, plan, steps } = buildPlan(args);
  if (args.confirm !== true) return { started: false, target, blockers: plan.blockers, steps, text: plan.ok ? '构建预检通过；confirm: true 可启动构建。' : `构建预检未通过：${plan.blockers.join('；')}` };
  if (!plan.ok) throw new Error(`构建预检未通过：${plan.blockers.join('；')}`);
  if ([...jobs.values()].some((job) => job.root === root && job.status === 'running')) throw new Error('该仓库已有正在运行的构建任务。');
  const job = { id: randomUUID(), root, target, status: 'running', text: '构建中', log: '', child: null };
  jobs.set(job.id, job);
  runBuild({
    plan, root, adapter: environment.adapter, settings,
    onChunk: (chunk) => { job.log = (job.log + chunk).slice(-64000); },
    onSpawn: (child) => { job.child = child; }
  }).then((result) => {
    if (job.status === 'cancelled') return;
    job.status = result.ok ? 'completed' : 'failed';
    job.text = `${result.detail}\n${result.summary.text}`;
    job.result = result;
  }).catch((error) => {
    if (job.status === 'cancelled') return;
    job.status = 'failed';
    job.text = String(error?.message ?? error);
  }).finally(() => { job.child = null; });
  return { started: true, target, blockers: [], steps, ...jobView(job) };
}

function buildStatus(args) {
  const job = jobs.get(args.jobId);
  if (!job) throw new Error('构建任务不存在；MCP 进程重启后内存中的任务记录不可恢复。');
  if (args.cancel === true && job.status === 'running') {
    job.child?.kill();
    job.status = 'cancelled';
    job.text = '已请求停止构建。';
  }
  return jobView(job);
}

export async function invoke(name, args = {}) {
  switch (name) {
    case 'ascend310b_writing_audit': return audit(args);
    case 'ascend310b_writing_record_audit': {
      const { root } = context(args);
      const report = auditLearnerRecord({ root, file: args.file, maxFindings: capOf(args.maxFindings) });
      return { text: report.text, summary: report.summary, findings: report.findings };
    }
    case 'ascend310b_writing_deck_render': {
      const { root } = context(args);
      const report = collectDeckRenderFindings({ root, deck: args.deck });
      return { text: report.text, decks: report.decks, pages: report.pages, issues: report.findings.map((finding) => finding.message) };
    }
    case 'ascend310b_writing_page_layout': {
      const { root } = context(args);
      const url = new URL(args.url);
      if (!['localhost', '127.0.0.1', '::1', '[::1]'].includes(url.hostname) || !['http:', 'https:'].includes(url.protocol)) {
        throw new Error('页面排版工具只接受本机 HTTP 地址。');
      }
      return collectPageLayoutFindings({ root, url: args.url, viewports: args.viewports || '1440x1000,390x844' });
    }
    case 'ascend310b_writing_render': return render(args);
    case 'ascend310b_writing_push_check': {
      const { root, settings } = context(args);
      const gate = evaluatePushGate({ root, rev: args.rev?.trim() || 'HEAD', settings });
      return { text: gate.text, ready: gate.ready, blockingFailed: gate.blockingFailed, items: gate.items };
    }
    case 'ascend310b_writing_ci': {
      const { root } = context(args);
      const ci = collectCiStatus({ root, runId: args.runId });
      return { text: ci.text, status: ci.status, conclusion: ci.conclusion, runUrl: ci.run?.url ?? '' };
    }
    case 'ascend310b_writing_progress': {
      const { root, settings } = context(args);
      const report = progressReport({ root, scope: scopeOf(args.scope), settings });
      const codeDocs = collectCodeDocs({ root });
      return { text: [report.text, '', codeDocs.text].join('\n'), totals: report.totals, missingFromSidebar: report.missingFromSidebar, codeDocs: { summary: codeDocs.summary, findings: codeDocs.findings } };
    }
    case 'ascend310b_writing_toolchain': {
      let root = null;
      try { root = resolveRoot(args.root); } catch { /* Host checks still work without a repository. */ }
      const report = diagnose({ root });
      return { text: report.text, platform: process.platform, missingRequired: report.missingRequired, missingOptional: report.missingOptional, capabilities: report.capabilities };
    }
    case 'ascend310b_writing_style': {
      const { root, settings } = context(args);
      const analysis = analyzeStyle({ root, settings, scope: scopeOf(args.scope) });
      return { text: formatStyle({ analysis }), ...analysis.totals };
    }
    case 'ascend310b_writing_build': return build(args);
    case 'ascend310b_writing_build_status': return buildStatus(args);
    case 'paper_scaffold': return scaffoldPaper({
      root: args.root,
      slug: args.slug,
      title: args.title,
      author: args.author,
      dryRun: args.dryRun === true
    });
    case 'paper_audit': return auditPaper({
      dir: args.workspace,
      mode: args.mode === 'submission' ? 'submission' : 'draft'
    });
    case 'paper_build': return buildPaper({
      dir: args.workspace,
      entry: args.entry || 'main.tex',
      engine: args.engine || 'auto',
      timeoutMs: Number.isInteger(args.timeoutMs) ? args.timeoutMs : 300000
    });
    case 'paper_sync_evidence': {
      const host = args.host || process.env.PAPER_EVIDENCE_HOST;
      if (!host) throw new Error('未提供 host，也未设置 PAPER_EVIDENCE_HOST。');
      const remotePaths = String(args.remotePaths || '').split(',').map((item) => item.trim()).filter(Boolean);
      return syncEvidence({
        workspace: args.workspace,
        host,
        remotePaths,
        overwrite: args.overwrite === true,
        dryRun: args.dryRun === true
      });
    }
    case 'paper_review':
      return args.workspace ? reviewPaper({ dir: args.workspace }) : reviewCollection({ root: args.root });
    case 'ascend310b_writing_neural_diagram_audit':
      return neuralDiagramAudit(args);
    case 'paper_kit': {
      let workspace = join(args.root, args.slug);
      const sections = [];
      if (args.scaffold !== false) {
        const scaffold = await scaffoldPaper({
          root: args.root,
          slug: args.slug,
          title: args.title,
          author: args.author
        });
        workspace = scaffold.dir;
        sections.push(`scaffold: ${scaffold.created.length} created, ${scaffold.skipped.length} skipped`);
      }
      const audit = await auditPaper({ dir: workspace });
      sections.push(`audit: ${audit.findings.filter((item) => item.severity === 'error').length} error(s)`);
      if (args.build === true) {
        const built = await buildPaper({ dir: workspace });
        sections.push(`build: ${built.ok ? 'ok' : 'failed'}, pages: ${built.pageCount ?? 'unknown'}`);
      }
      return { text: sections.join('\n'), workspace, audit };
    }
    default: throw new Error(`未知写作工具：${name}`);
  }
}

# dsh-writing-suite

[![test](https://github.com/zhouxzh/dsh-writing-suite/actions/workflows/test.yml/badge.svg)](https://github.com/zhouxzh/dsh-writing-suite/actions/workflows/test.yml)

统一的 DSH 写作套件：**一个 bundle、一个写作侧栏、四个领域模块、18 个工具、21 个 skill**。

它合并了原先的 `dsh-paper-suite` 和 `dsh-plugin-ascend310b-writing`，并吸收神经网络框图路径审计。既有工具名保持不变，已有调用无需改名。

## 组成

| 模块 | 工具 | 职责 |
|---|---|---|
| 教材写作 `lib/book` | `ascend310b_writing_*` | Markdown 教材审计、冻结标题、链接、锚点、site/deck/PDF 产物、代码文档、写作进度、构建和推送门禁 |
| 学术论文 `lib/paper` | `paper_*` | 论文骨架、引用/证据审计、`latexmk` 构建、证据同步、完整性审阅、cover letter 和审稿回复 |
| 框图审计 `lib/diagram` | `ascend310b_writing_neural_diagram_audit` | 用显式 `.layout.json` 几何契约检查 TikZ 连线是否穿框或相交 |
| 专利写作 `skills/patent-disclosure` | 无独立 Host 工具 | 九段式发明专利技术交底、附图与表格、算法/数据模型公开、审查与代理交接；不生成权利要求或正式申请文件 |

### 兼容工具名

合并后保留：

- `paper_scaffold`, `paper_audit`, `paper_build`, `paper_sync_evidence`, `paper_kit`, `paper_review`
- `ascend310b_writing_audit`, `ascend310b_writing_record_audit`, `ascend310b_writing_deck_render`,
  `ascend310b_writing_page_layout`, `ascend310b_writing_render`, `ascend310b_writing_push_check`,
  `ascend310b_writing_ci`, `ascend310b_writing_progress`, `ascend310b_writing_toolchain`,
  `ascend310b_writing_style`, `ascend310b_writing_build`
- 新增 `ascend310b_writing_neural_diagram_audit`

这些名字暂时不变，避免已有会话、文档和自动化调用失效。后续若发布统一命名，应先提供兼容别名。

## 专利技术交底

`patent-disclosure` 是纯 skill 能力，不注册 Host 工具。它面向专业专利代理师，输出“填写前须知＋九段式技术交底＋附录”，不生成权利要求书、正式申请说明书、摘要或请求书，也不判断授权概率。

`diagram-design` 为该流程和一般技术报告提供结构图、流程图、状态图和连接图规范。这两个 skill 从原 `dsh-patent-writing` 合并，模板和参考文件完整保留。

## 统一面板

浏览器端只注册一个 **写作套件** 侧栏和一个主面板。面板标签包括：

- 概览
- 分部进度
- 代码文档
- 问题清单
- 论文审计

Host 端仍使用两个只读路由：

- `/ascend310b-writing/report.json`
- `/paper-suite/report.json`

一个客户端模块同时读取两者，不再出现两个相互重叠的侧栏入口。

## 安装

```bash
npm install
npm test
npm pack

dsh plugin --profile desktop add file:C:/path/to/dsh-writing-suite-1.0.0.tgz
node scripts/install-skill.mjs
node scripts/install-skill.mjs --check
```

安装后重启 DSH。skill catalog 只在会话启动时扫描；新会话才能看到新增或更新的 skill。

## 配置

教材和论文可以位于不同仓库，因此提供两个根目录：

```yaml
- id: dsh-writing-suite
  name: dsh-writing-suite
  config:
    tutorialRoot: D:/Github/Ascend310
    paperRoot: D:/Github/nonstationary-mamba
    defaultHost: ace2
```

`repoRoot` 仍可作为两者共同根目录的回退值。

## 框图几何契约

TikZ 源文件只描述绘图，不保证可机读节点尺寸。因此每条路径审计要求同名的 sidecar：

```text
figure.tex
figure.layout.json
```

示例：

```json
{
  "boxes": [
    { "name": "encoder", "kind": "module", "rect": [0.5, 1.0, 2.5, 2.0] }
  ],
  "paths": [
    {
      "name": "residual",
      "polyline": [[0.5, 1.5], [0.2, 1.5], [0.2, 2.5], [0.5, 2.5]],
      "allowed_boxes": []
    }
  ]
}
```

坐标与 TikZ 画布一致。`rect` 为 `[xmin, ymin, xmax, ymax]`。只有列入 `allowed_boxes` 的模块允许路径进入；触碰边界也按冲突处理。有意 T-junction 可在路径上声明 `allow_crossing_with`。

运行：

```bash
python3 lib/diagram/check_tikz_paths.py \
  --source figure.tex \
  --layout figure.layout.json
```

Windows 上工具会自动尝试 `DSH_PYTHON`、`PYTHON`、Anaconda/miniconda 的 `sci-agent` 环境，以及 `py -3`/`python`/`python3`。

几何检查通过后仍必须在论文最终尺寸下检查 PDF；它不能判断字体可读性、箭头语义或视觉层级。

## 外部依赖与降级

| 能力 | 提供方 | 缺失时 |
| --- | --- | --- |
| 案例来源固定、板端复现 | `ascend310b-case-testing` | 经验性结果保持 `untested`，不得声称 board pass |
| 环境与硬件事实 | `ascend310b-env-check`、Ascend 板端工具 | 只做本地静态检查并明确边界 |
| Word 生成与渲染 | `office` / `office-docx` / `office-render` | 专利交底退回 Markdown/LaTeX 和可编辑图源 |
| 英文期刊 LaTeX | `latex-paper-en` 或期刊官方 skill | 本套件只提供中文论文工作区 `paper-latex-cn` |
| TikZ 几何审计 | Python 3 + 本套件 Host/MCP 工具 | 不能声称箭头/模块框无碰撞 |

## Fail-closed 门

- cover/response 身份字段缺失、大小写不同或无法解析即失败；
- cover letter 的正文页数和量化结论必须提供对应 manuscript 源文件/PDF；
- 审稿回复的 `CLOSE`/`REVIEW`、无法定位的删除项返回退出码 2，必须作者签认；
- `paper_audit mode=submission` 把 pending/invalidated claim、缺失 register 和无法离线核验的远程证据设为 error；
- 教材推送门包含代码工程文档 error、case4 自包含和高置信度凭证扫描；
- TikZ 神经网络审计可用 `requireHash=true` 阻断 sidecar 与 TikZ 源漂移。

## 安全边界

- 写作/论文审计工具只读；生成骨架、证据同步、构建和框图 layout 文件属于写操作。
- `paper_scaffold` 和 `paper_kit` 不覆盖已有正文。
- `paper_sync_evidence` 只接收紧凑证据扩展名，拒绝 checkpoint、预测数组、数据集和归档。
- `paper_build` 会在指定工作区执行 LaTeX；不要编译来源不可信的 `.tex`。
- 教材构建默认只预检，必须显式 `confirm: true` 才执行。
- 离线审计不能证明 DOI 可解析、文献结论正确或论文结论成立。

## MCP

`mcp/server.js` 保留原写作插件的 MCP 入口，并增加论文工具。它适合不支持 DSH Host tools 的本地执行器；DSH 本身直接使用本 bundle 的 18 个 Host 工具。

## 测试

```bash
npm test
```

测试覆盖：

- 论文脚手架、引用、证据、日志解析和审阅；
- 18 个 Host 工具注册与两条只读报告路由；
- 统一客户端的单面板注册；
- 21 个 skill 与 `nature-shared` 支持目录的安装一致性；
- TikZ 路径碰撞检测和外围绕行通道；
- `npm pack --dry-run` 的发布文件清单。

## 目录

```text
dsh-writing-suite/
├── lib/
│   ├── index.js          # unified Host entry
│   ├── client.js         # unified browser panel
│   ├── book/             # tutorial/book rules and tools
│   ├── drivers/          # shell/toolchain adapters used by book builds
│   ├── paper/            # academic paper tools
│   └── diagram/          # TikZ path audit
├── skills/               # tutorial, paper, patent, writing and diagram skills
├── mcp/                  # optional MCP surface
├── scripts/              # skill installer and repository checks
├── test/
├── cordis.patch.yml
└── SOURCE.md
```

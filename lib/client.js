window.__ModuleLoader__.load({
	id: "dsh-writing-suite",
	factory: (require) => {
		var module = { exports: {} };
		var exports = module.exports;
		Object.defineProperty(exports, Symbol.toStringTag, { value: "Module" });

		const react = require("react");
		const h = react.createElement;

		/** The id shared by the sidebar entry and the main panel it opens. */
		const PANEL_ID = "writing-suite";
		/** Tutorial-writing report route. */
		const REPORT_URL = "/ascend310b-writing/report.json";
		/** Paper audit/review report route. */
		const PAPER_REPORT_URL = "/paper-suite/report.json";

		/** Class-name prefix keeping this plugin's styles out of every other panel. */
		const CSS = `
.tw-root{height:100%;overflow:auto;padding:18px 22px 40px;box-sizing:border-box;color:var(--dsw-alias-label-primary);font-size:13px;line-height:20px;max-width:1320px;margin:0 auto}
.tw-head{display:flex;align-items:center;gap:12px;flex-wrap:wrap;margin-bottom:4px}
.tw-title{font-size:16px;font-weight:600;margin:0}
.tw-sub{color:var(--dsw-alias-label-tertiary);font-size:12px}
.tw-note{color:var(--dsw-alias-label-tertiary);font-size:12px;margin-top:8px}
.tw-actions{margin-left:auto;display:flex;gap:8px;flex-wrap:wrap}
.tw-button{border:.5px solid var(--dsw-alias-border-l3);background:var(--dsw-alias-button-elevated-fill);color:var(--dsw-alias-label-primary);border-radius:6px;padding:4px 12px;font:inherit;cursor:pointer}
.tw-button:hover{background:var(--dsw-alias-interactive-bg-hover)}
.tw-button:disabled{opacity:.5;cursor:default}
.tw-cards{display:grid;grid-template-columns:repeat(auto-fit,minmax(120px,1fr));gap:8px;margin:16px 0}
.tw-card{border:.5px solid var(--dsw-alias-border-l1);border-radius:8px;padding:10px 12px}
.tw-card b{display:block;font-size:20px;font-weight:600;line-height:26px}
.tw-card span{color:var(--dsw-alias-label-tertiary);font-size:12px}
.tw-section{margin-top:16px;padding-top:12px;border-top:.5px solid var(--dsw-alias-border-l1)}
.tw-section h3{font-size:13px;font-weight:600;margin:0 0 8px}
.tw-table{width:100%;border-collapse:collapse;font-size:12px}
.tw-table th{text-align:left;color:var(--dsw-alias-label-tertiary);font-weight:500;border-bottom:.5px solid var(--dsw-alias-border-l1);padding:4px 8px}
.tw-table td{border-bottom:.5px solid var(--dsw-alias-border-l1);padding:4px 8px;vertical-align:top}
.tw-table td.tw-num{text-align:right;font-variant-numeric:tabular-nums}
.tw-bar{height:4px;border-radius:2px;background:var(--dsw-alias-state-business-primary);min-width:2px}
.tw-bar-track{width:88px;height:4px;border-radius:2px;background:var(--dsw-alias-border-l1);display:inline-block;vertical-align:middle}
.tw-file{font-family:var(--ds-font-family-code);color:var(--dsw-alias-label-secondary)}
.tw-sev{font-weight:600;font-family:var(--ds-font-family-code)}
.tw-sev-error{color:var(--dsw-alias-state-error-primary)}
.tw-sev-warning{color:var(--dsw-alias-state-warning-primary,#c98a00)}
.tw-sev-info{color:var(--dsw-alias-label-tertiary)}
.tw-status{display:inline-block;border-radius:999px;padding:1px 7px;font-size:11px;border:.5px solid var(--dsw-alias-border-l2)}
.tw-status-ok{color:var(--dsw-alias-state-success-primary,#2f9e44);border-color:var(--dsw-alias-state-success-primary,#2f9e44)}
.tw-status-warn{color:var(--dsw-alias-state-warning-primary,#c98a00);border-color:var(--dsw-alias-state-warning-primary,#c98a00)}
.tw-status-bad{color:var(--dsw-alias-state-error-primary,#d92d20);border-color:var(--dsw-alias-state-error-primary,#d92d20)}
.tw-empty{color:var(--dsw-alias-label-tertiary);padding:12px 0}
.tw-error{color:var(--dsw-alias-state-error-primary);white-space:pre-wrap}
.tw-heading{display:flex;flex-direction:column;gap:2px;min-width:0}
.tw-heading .tw-sub{margin:0}
.tw-meta{display:flex;align-items:center;gap:7px;min-width:0;padding:4px 9px;border:.5px solid var(--dsw-alias-border-l1);border-radius:6px;background:var(--dsw-alias-bg-l1,#0000)}
.tw-meta strong{font-size:12px;max-width:360px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.tw-meta code{font-family:var(--ds-font-family-code);font-size:10px;color:var(--dsw-alias-label-tertiary);white-space:nowrap}
.tw-tabs{display:flex;gap:2px;border-bottom:.5px solid var(--dsw-alias-border-l1);margin:16px 0 0;overflow-x:auto;scrollbar-width:thin}
.tw-tab{flex:none;border:0;border-bottom:2px solid transparent;background:transparent;color:var(--dsw-alias-label-tertiary);padding:7px 12px;font:inherit;cursor:pointer}
.tw-tab:hover{color:var(--dsw-alias-label-primary)}
.tw-tab.tw-active{color:var(--dsw-alias-state-business-primary);border-bottom-color:var(--dsw-alias-state-business-primary);font-weight:600}
.tw-overview-grid{display:grid;grid-template-columns:minmax(0,1.35fr) minmax(240px,.65fr);gap:12px;margin-top:14px}
.tw-panel-card{border:.5px solid var(--dsw-alias-border-l1);border-radius:7px;padding:11px 12px;min-width:0}
.tw-panel-card h3{margin:0 0 8px;font-size:12px}
.tw-severity{display:grid;grid-template-columns:repeat(3,1fr);gap:7px}
.tw-severity div{border-top:2px solid var(--dsw-alias-border-l2);padding-top:7px}
.tw-severity b{display:block;font-size:18px;line-height:22px}
.tw-severity span{font-size:11px;color:var(--dsw-alias-label-tertiary)}
.tw-quick-links{display:flex;flex-direction:column;gap:6px}
.tw-quick-link{display:flex;justify-content:space-between;gap:8px;align-items:center;border:.5px solid var(--dsw-alias-border-l1);border-radius:6px;background:transparent;color:var(--dsw-alias-label-primary);padding:7px 9px;font:inherit;text-align:left;cursor:pointer}
.tw-quick-link:hover{background:var(--dsw-alias-interactive-bg-hover)}
.tw-quick-link span{font-size:11px;color:var(--dsw-alias-label-tertiary)}
.tw-filters{display:flex;align-items:center;gap:8px;flex-wrap:wrap;margin:12px 0 8px}
.tw-search{flex:1;min-width:180px;box-sizing:border-box;border:.5px solid var(--dsw-alias-border-l3);background:var(--dsw-alias-button-elevated-fill);color:var(--dsw-alias-label-primary);border-radius:6px;padding:5px 8px;font:inherit}
.tw-section-head{display:flex;justify-content:space-between;align-items:baseline;gap:10px;flex-wrap:wrap}
.tw-section-head h3{margin:0 0 8px}
.tw-overflow{overflow-x:auto;max-width:100%}
@media(max-width:900px){.tw-overview-grid{grid-template-columns:1fr}}
@media(max-width:720px){.tw-root{padding:14px 14px 32px}.tw-head{align-items:flex-start}.tw-actions{width:100%;margin-left:0}.tw-actions .tw-button{flex:1}.tw-meta{order:3;width:100%;box-sizing:border-box}.tw-cards{grid-template-columns:repeat(2,minmax(0,1fr))}.tw-table{display:block;overflow-x:auto;white-space:nowrap}.tw-table td,.tw-table th{white-space:normal;min-width:90px}.tw-severity{grid-template-columns:repeat(3,minmax(0,1fr))}}
`;

		/** Install this plugin's stylesheet once, at materialization. */
		function installStyles() {
			if (document.querySelector('style[data-plugin="dsh-writing-suite"]') !== null) return;
			const tag = document.createElement("style");
			tag.dataset.plugin = "dsh-writing-suite";
			tag.textContent = CSS;
			document.head.appendChild(tag);
		}

		/** Format an integer with thousands separators. */
		function num(value) {
			return Number(value ?? 0).toLocaleString("zh-CN");
		}

		/** Human-readable generation time in the browser's own time zone. */
		function stamp(iso) {
			if (typeof iso !== "string") return "";
			const date = new Date(iso);
			return Number.isNaN(date.getTime()) ? "" : date.toLocaleString("zh-CN");
		}

		/** One headline number. */
		function Card(props) {
			return h("div", { className: "tw-card" }, h("b", null, props.value), h("span", null, props.label));
		}

		/** The per-part progress table plus its proportional bars. */
		function ProgressTable(props) {
			const parts = props.parts ?? [];
			const widest = parts.reduce((max, part) => Math.max(max, part.cjk ?? 0), 0);
			if (parts.length === 0) return h("div", { className: "tw-empty" }, "暂无正文文件。");
			return h(
				"table",
				{ className: "tw-table" },
				h(
					"thead",
					null,
					h(
						"tr",
						null,
						h("th", null, "部分"),
						h("th", null, "占比"),
						h("th", { className: "tw-num" }, "篇数"),
						h("th", { className: "tw-num" }, "中文字"),
						h("th", { className: "tw-num" }, "图"),
						h("th", { className: "tw-num" }, "代码块"),
						h("th", { className: "tw-num" }, "阅读量")
					)
				),
				h(
					"tbody",
					null,
					parts.map((part) =>
						h(
							"tr",
							{ key: part.key },
							h("td", null, part.label),
							h(
								"td",
								null,
								h(
									"span",
									{ className: "tw-bar-track" },
									h("span", {
										className: "tw-bar",
										style: { width: widest === 0 ? "0" : `${Math.max(2, Math.round((part.cjk / widest) * 100))}%`, display: "block" }
									})
								)
							),
							h("td", { className: "tw-num" }, num(part.files?.length)),
							h("td", { className: "tw-num" }, num(part.cjk)),
							h("td", { className: "tw-num" }, num((part.files ?? []).reduce((sum, file) => sum + (file.figures ?? 0), 0))),
							h("td", { className: "tw-num" }, num((part.files ?? []).reduce((sum, file) => sum + (file.codeBlocks ?? 0), 0))),
							h("td", { className: "tw-num" }, `${num((part.files ?? []).reduce((sum, file) => sum + (file.readingMinutes ?? 0), 0))} 分钟`)
						)
					)
				)
			);
		}

		/** Code-doc coverage by sample, including README/docs/code drift. */
		function CodeDocsTable(props) {
			const entries = props.entries ?? [];
			if (entries.length === 0) return h("div", { className: "tw-empty" }, "没有找到代码样例目录。");
			const status = (value) => {
				if (value === "complete") return ["完整", "tw-status-ok"];
				if (value === "missing") return ["缺 README", "tw-status-bad"];
				return ["仅 README", "tw-status-warn"];
			};
			return h(
				"table",
				{ className: "tw-table" },
				h(
					"thead",
					null,
					h(
						"tr",
						null,
						h("th", null, "样例目录"),
						h("th", null, "README"),
						h("th", { className: "tw-num" }, "代码"),
						h("th", { className: "tw-num" }, "docs"),
						h("th", null, "状态"),
						h("th", null, "同步提示")
					)
				),
				h(
					"tbody",
					null,
					entries.map((entry) => {
						const [label, className] = status(entry.status);
						return h(
							"tr",
							{ key: entry.sample },
							h("td", { className: "tw-file" }, entry.sample),
							h("td", null, entry.readme ? "有" : "缺"),
							h("td", { className: "tw-num" }, num(entry.codeFiles)),
							h("td", { className: "tw-num" }, num(entry.docs)),
							h("td", null, h("span", { className: `tw-status ${className}` }, label)),
							h("td", { className: "tw-note" }, (entry.issues ?? []).join("；") || "—")
						);
					})
				)
			);
		}

		/** The finding list, most severe first. */
		function FindingList(props) {
			const findings = props.findings ?? [];
			if (findings.length === 0) return h("div", { className: "tw-empty" }, "没有发现问题。");
			return h(
				"table",
				{ className: "tw-table" },
				h(
					"thead",
					null,
					h(
						"tr",
						null,
						h("th", null, "级别"),
						h("th", null, "位置"),
						h("th", null, "规则"),
						h("th", null, "说明")
					)
				),
				h(
					"tbody",
					null,
					findings.map((finding, index) =>
						h(
							"tr",
							{ key: `${finding.file}:${finding.line}:${finding.rule}:${index}` },
							h("td", { className: `tw-sev tw-sev-${finding.severity}` }, finding.severity === "error" ? "错误" : finding.severity === "warning" ? "警告" : "提示"),
							h("td", { className: "tw-file" }, `${finding.file}:${finding.line}`),
							h("td", { className: "tw-file" }, finding.rule),
							h("td", null, finding.message)
						)
					)
				)
			);
		}

		/** Compact workspace navigation for the writing panel. */
		function TabBar(props) {
			const tabs = [
				["overview", "概览"],
				["progress", "分部进度"],
				["code", "代码文档"],
				["findings", "问题清单"],
				["papers", "论文审计"]
			];
			return h(
				"div",
				{ className: "tw-tabs", role: "tablist" },
				tabs.map(([id, label]) =>
					h(
						"button",
						{
							key: id,
							type: "button",
							role: "tab",
							"aria-selected": props.active === id,
							className: props.active === id ? "tw-tab tw-active" : "tw-tab",
							onClick: () => props.onChange(id)
						},
						label
					)
				)
			);
		}

		/** Academic-paper completeness and review results in the unified panel. */
		function PaperAuditPanel() {
			const [state, setState] = react.useState({ kind: "loading" });
			const [selected, setSelected] = react.useState(undefined);

			const load = react.useCallback((fresh) => {
				setState((previous) => (previous.kind === "ready" ? previous : { kind: "loading" }));
				fetch(fresh ? `${PAPER_REPORT_URL}?fresh=1` : PAPER_REPORT_URL, { headers: { accept: "application/json" } })
					.then(async (response) => {
						if (response.status === 404) {
							throw new Error("论文审计 Host 路由未注册（404）。请确认 dsh-writing-suite 已加载并重启 DSH。");
						}
						if (!response.ok) throw new Error(`HTTP ${response.status}`);
						return response.json();
					})
					.then((report) => setState({ kind: "ready", report }))
					.catch((error) => setState({ kind: "failed", message: String(error?.message ?? error) }));
			}, []);

			react.useEffect(() => {
				load(false);
			}, [load]);

			if (state.kind === "loading") return h("div", { className: "tw-empty" }, "正在审计论文工作区…");
			if (state.kind === "failed") return h("div", { className: "tw-error" }, `论文审计失败：${state.message}`);

			const report = state.report;
			const papers = report.papers ?? [];
			const current = papers.find((paper) => paper.slug === selected) ?? papers[0];
			const findings = current?.findings ?? [];
			const groups = [
				["error", "错误"],
				["warn", "警告"],
				["info", "提示"]
			];

			return h(
				"div",
				{ className: "tw-section" },
				h(
					"div",
					{ className: "tw-section-head" },
					h("h3", null, `论文审计（${report.root ?? ""}）`),
					h(
						"button",
						{ type: "button", className: "tw-button", onClick: () => load(true) },
						"重新审计"
					)
				),
				h(
					"div",
					{ className: "tw-cards" },
					h(Card, { label: "论文", value: num(report.summary?.papers) }),
					h(Card, { label: "通过", value: num(report.summary?.pass) }),
					h(Card, { label: "警告", value: num(report.summary?.warn) }),
					h(Card, { label: "失败", value: num(report.summary?.fail) })
				),
				papers.length === 0
					? h("div", { className: "tw-empty" }, "当前根目录下没有找到论文工作区。")
					: h(
							"div",
							{ className: "tw-overview-grid" },
							h(
								"div",
								{ className: "tw-quick-links" },
								...papers.map((paper) =>
									h(
										"button",
										{
											key: paper.slug,
											type: "button",
											className: "tw-quick-link",
											onClick: () => setSelected(paper.slug)
										},
										h("span", null, paper.slug),
										h("strong", null, `${paper.overall} · ${paper.verdict}`)
									)
								)
							),
							h(
								"div",
								{ className: "tw-panel-card" },
								current === undefined
									? h("div", { className: "tw-empty" }, "选择一篇论文。")
									: h(
											"div",
											null,
											h("h3", null, current.title ?? current.slug),
											h(
												"div",
												{ className: "tw-file" },
												`完整 ${current.scores.completeness} · 结果 ${current.scores.results} · 逻辑 ${current.scores.logic} · 学术表达 ${current.scores.scholarship}`
											),
											...groups.map(([severity, label]) => {
												const items = findings.filter((item) => item.severity === severity);
												if (items.length === 0) return null;
												return h(
													"div",
													{ key: severity, className: "tw-section" },
													h("h3", null, `${label}（${items.length}）`),
													h(FindingList, {
														findings: items.map((item) => ({
															severity: severity === "warn" ? "warning" : severity,
															file: item.locator ?? current.slug,
															line: 1,
															rule: item.category ?? "paper",
															message: item.message
														}))
													})
												);
											})
										)
							)
						),
				h("div", { className: "tw-note" }, `生成时间：${stamp(report.generatedAt)}`)
			);
		}

		/**
		 * The unified writing panel: tutorial progress/audit and academic paper review.
		 * @returns the panel element.
		 */
		function WritingPanel() {
			const [state, setState] = react.useState({ kind: "loading" });
			const [onlyProblems, setOnlyProblems] = react.useState(false);
			const [tab, setTab] = react.useState("overview");
			const [query, setQuery] = react.useState("");

			const load = react.useCallback((fresh) => {
				setState((previous) => (previous.kind === "ready" ? previous : { kind: "loading" }));
				fetch(fresh ? `${REPORT_URL}?fresh=1` : REPORT_URL, { headers: { accept: "application/json" } })
					.then(async (response) => {
						if (response.status === 404) {
							throw new Error("教程写作 Host 路由未注册（404）。请确认 Host 端 dsh-writing-suite 已加载并重启 DSH；当前 client/Host 版本可能不一致。");
						}
						if (!response.ok) throw new Error(`HTTP ${response.status}`);
						return response.json();
					})
					.then((payload) => setState({ kind: "ready", payload }))
					.catch((error) => setState({ kind: "failed", message: String(error?.message ?? error) }));
			}, []);

			react.useEffect(() => {
				load(false);
			}, [load]);

			const head = h(
				"div",
				{ className: "tw-head" },
				h(
					"div",
					{ className: "tw-heading" },
					h("h2", { className: "tw-title" }, "写作套件"),
					h("span", { className: "tw-sub" }, "统一审计教材、论文、代码文档、图表和生产产物")
				),
				h(
					"div",
					{ className: "tw-meta" },
					h("strong", null, state.payload?.root ?? "等待读取仓库"),
					h("code", null, state.payload?.generatedAt ? stamp(state.payload.generatedAt) : "尚未生成")
				),
				h(
					"div",
					{ className: "tw-actions" },
					h(
						"button",
						{ className: "tw-button", type: "button", onClick: () => setOnlyProblems((value) => !value) },
						onlyProblems ? "显示全部" : "只看问题"
					),
					h("button", { className: "tw-button", type: "button", disabled: state.kind === "loading", onClick: () => load(true) }, state.kind === "loading" ? "读取中…" : "刷新")
				)
			);

			if (state.kind === "loading") return h("div", { className: "tw-root" }, head, h("div", { className: "tw-empty" }, "正在读取仓库…"));
			if (state.kind === "failed") {
				return h(
					"div",
					{ className: "tw-root" },
					head,
					h("div", { className: "tw-error" }, `读取失败：${state.message}`)
				);
			}

			const { audit, progress, codeDocs = {}, root, generatedAt } = state.payload;
			const totals = progress.totals ?? {};
			const codeSummary = codeDocs.summary ?? {};
			const codeEntries = codeDocs.entries ?? [];
			const allAuditFindings = audit.findings ?? [];
			const allCodeFindings = codeDocs.findings ?? [];
			const needle = String(query ?? "").trim().toLowerCase();
			const matches = (finding) =>
				needle === "" ||
				[finding.file, finding.rule, finding.severity, finding.message].filter(Boolean).join(" ").toLowerCase().includes(needle);
			const auditFindings = allAuditFindings.filter((finding) => (!onlyProblems || finding.severity !== "info") && matches(finding));
			const codeFindings = allCodeFindings.filter((finding) => (!onlyProblems || finding.severity !== "info") && matches(finding));
			const sidebarMissing = progress.missingFromSidebar ?? [];

			const cards = h(
				"div",
				{ className: "tw-cards" },
				h(Card, { label: "正文文件", value: num(totals.files) }),
				h(Card, { label: "中文字", value: num(totals.cjk) }),
				h(Card, { label: "图 / 代码块", value: `${num(totals.figures)} / ${num(totals.codeBlocks)}` }),
				h(Card, { label: "代码 docs", value: `${num(codeSummary.withDocs)}/${num(codeSummary.samples)}` }),
				h(Card, { label: "同步问题", value: num(codeSummary.findings) }),
				h(Card, { label: "错误", value: num(audit.summary?.errors) }),
				h(Card, { label: "警告", value: num(audit.summary?.warnings) })
			);

			const tabs = h(TabBar, { active: tab, onChange: setTab });

			const progressSection = h(
				"div",
				{ className: "tw-section" },
				h("div", { className: "tw-section-head" }, h("h3", null, "各分部进度")),
				h(ProgressTable, { parts: progress.parts })
			);

			const codeSection = h(
				"div",
				{ className: "tw-section" },
				h(
					"div",
					{ className: "tw-section-head" },
					h("h3", null, `代码文档与样例同步（${codeSummary.samples ?? 0} 个样例目录）`),
					h("span", { className: "tw-note" }, `README ${num(codeSummary.readmes)} · docs ${num(codeSummary.withDocs)} · 缺 README ${num(codeSummary.missingReadme)}`)
				),
				h(CodeDocsTable, { entries: codeEntries })
			);

			const codeIssues = codeFindings.length > 0
				? h(
						"div",
						{ className: "tw-section" },
						h("div", { className: "tw-section-head" }, h("h3", null, `跨对象同步问题（${codeFindings.length}）`)),
						h(FindingList, { findings: codeFindings })
					)
				: null;

			const auditSection = h(
				"div",
				{ className: "tw-section" },
				h(
					"div",
					{ className: "tw-section-head" },
					h("h3", null, `审计发现（${auditFindings.length}${audit.summary?.truncated ? "，已截断" : ""}）`),
					h("span", { className: "tw-note" }, "错误 / 警告 / 提示")
				),
				h(FindingList, { findings: auditFindings })
			);

			const findingsFilters = h(
				"div",
				{ className: "tw-filters" },
				h("input", {
					className: "tw-search",
					type: "search",
					placeholder: "按文件、规则或说明筛选问题",
					value: query,
					onChange: (event) => setQuery(event.target.value)
				}),
				h("span", { className: "tw-note" }, `${auditFindings.length} 条`)
			);

			const sidebarSection = sidebarMissing.length > 0
				? h(
						"div",
						{ className: "tw-section" },
						h("div", { className: "tw-section-head" }, h("h3", null, "未加入 sidebar.ts"), h("span", { className: "tw-note" }, `${sidebarMissing.length} 个`)),
						h("div", { className: "tw-file" }, sidebarMissing.join("、"))
					)
				: null;

			const overview = h(
				"div",
				null,
				h(
					"div",
					{ className: "tw-overview-grid" },
					h(
						"div",
						{ className: "tw-panel-card" },
						h("h3", null, "审计状态"),
						h(
							"div",
							{ className: "tw-severity" },
							h("div", null, h("b", null, num(audit.summary?.errors)), h("span", null, "错误")),
							h("div", null, h("b", null, num(audit.summary?.warnings)), h("span", null, "警告")),
							h("div", null, h("b", null, num(audit.summary?.infos)), h("span", null, "提示"))
						),
						h("div", { className: "tw-note" }, audit.summary?.truncated ? "审计结果已截断。" : "审计结果完整。")
					),
					h(
						"div",
						{ className: "tw-panel-card" },
						h("h3", null, "快速进入"),
						h(
							"div",
							{ className: "tw-quick-links" },
							h("button", { className: "tw-quick-link", type: "button", onClick: () => setTab("progress") }, h("span", null, "各分部进度"), h("strong", null, `${num((progress.parts ?? []).length)} 个分部`)),
							h("button", { className: "tw-quick-link", type: "button", onClick: () => setTab("code") }, h("span", null, "代码文档"), h("strong", null, `${num(codeSummary.withDocs)}/${num(codeSummary.samples)} 覆盖`)),
							h("button", { className: "tw-quick-link", type: "button", onClick: () => setTab("findings") }, h("span", null, "问题清单"), h("strong", null, `${num(auditFindings.length)} 条`))
						)
					)
				),
				h(
					"div",
					{ className: "tw-section" },
					h("div", { className: "tw-section-head" }, h("h3", null, "各分部进度"), h("span", { className: "tw-note" }, "按稿件分部统计")),
					h(ProgressTable, { parts: progress.parts })
				),
				h(
					"div",
					{ className: "tw-section" },
					h("div", { className: "tw-section-head" }, h("h3", null, `代码文档与样例同步（${codeSummary.samples ?? 0} 个样例目录）`), h("span", { className: "tw-note" }, "概览仅显示前 6 项")),
					h(CodeDocsTable, { entries: codeEntries.slice(0, 6) }),
					codeEntries.length > 6 ? h("div", { className: "tw-note" }, `还有 ${codeEntries.length - 6} 个样例目录，切换到“代码文档”查看。`) : null
				),
				codeFindings.length > 0
					? h(
							"div",
							{ className: "tw-section" },
							h("div", { className: "tw-section-head" }, h("h3", null, `跨对象同步问题（${codeFindings.length}）`), h("span", { className: "tw-note" }, "显示前 4 条")),
							h(FindingList, { findings: codeFindings.slice(0, 4) })
						)
					: null,
				auditFindings.length > 0
					? h(
							"div",
							{ className: "tw-section" },
							h("div", { className: "tw-section-head" }, h("h3", null, "最近审计发现"), h("span", { className: "tw-note" }, "显示前 5 条")),
							h(FindingList, { findings: auditFindings.slice(0, 5) })
						)
					: null,
				sidebarSection
			);

			const content =
				tab === "progress"
					? h("div", null, progressSection, sidebarSection)
					: tab === "code"
						? h("div", null, codeSection, codeIssues)
						: tab === "findings"
							? h("div", null, findingsFilters, auditSection, codeIssues, sidebarSection)
							: tab === "papers"
								? h(PaperAuditPanel)
								: overview;

			return h(
				"div",
				{ className: "tw-root" },
				head,
				h("div", { className: "tw-sub" }, `${root} · ${stamp(generatedAt)}`),
				cards,
				tabs,
				content
			);
		}

		/** The sidebar glyph for this panel. */
		function WritingPanelIcon(props) {
			const size = props?.size ?? 16;
			return h(
				"svg",
				{ width: size, height: size, viewBox: "0 0 16 16", fill: "none", xmlns: "http://www.w3.org/2000/svg" },
				h("path", {
					d: "M3 1.75h6.5L13 5.25v9H3z",
					stroke: "currentColor",
					"stroke-width": "1.2",
					"stroke-linejoin": "round"
				}),
				h("path", { d: "M9.25 1.75v3.5h3.5", stroke: "currentColor", "stroke-width": "1.2", "stroke-linejoin": "round" }),
				h("path", { d: "M5.25 8.5h5.5M5.25 11h3.5", stroke: "currentColor", "stroke-width": "1.2", "stroke-linecap": "round" })
			);
		}

		/** Services the panel registrations need from the browser plugin context. */
		const inject = ["slots"];

		/**
		 * Contribute the Writing entry to the sidebar and the panel it opens.
		 * @param ctx - the browser plugin context.
		 */
		function apply(ctx) {
			installStyles();
			ctx.slots.inject("main", function* () {
				yield ctx.slots.register({ name: "main", key: PANEL_ID }, WritingPanel);
			});
			ctx.slots.inject("sidebar.panellist", () =>
				ctx.slots.register(
					{
						name: "sidebar.panellist",
						id: PANEL_ID,
						order: 20,
						label: "写作套件"
					},
					WritingPanelIcon
				)
			);
		}

		exports.PANEL_ID = PANEL_ID;
		exports.apply = apply;
		exports.inject = inject;
		return module.exports;
	}
});

//# sourceMappingURL=client.js.map

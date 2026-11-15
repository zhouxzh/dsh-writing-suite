/**
 * dsh-writing-suite — unified Host entry.
 *
 * The package merges three previously separate capabilities without collapsing
 * their domain logic:
 *
 * - tutorial/book auditing and build orchestration (`lib/book`);
 * - academic paper scaffolding, audit, review and evidence sync (`lib/paper`);
 * - TikZ neural-diagram path collision checking (`lib/diagram`).
 *
 * Existing tool names remain stable so installed sessions and documented
 * workflows keep working after the bundle migration.
 */

import { apply as applyBook } from './book/index.js';
import { apply as applyPaper } from './paper/index.js';
import { registerDiagramTool } from './diagram/index.js';

export const name = 'dsh-writing-suite';
export const inject = ['tools'];

/**
 * Register every writing-suite tool and browser route.
 *
 * @param {import('@deepseek-ai/cordis').Context} ctx
 * `tutorialRoot` and `paperRoot` keep the two document ecosystems separate when
 * they live in different repositories. `repoRoot` remains a shared fallback for
 * users whose tutorial and paper projects share one root.
 *
 * @param {{repoRoot?: string, tutorialRoot?: string, paperRoot?: string, defaultHost?: string}} [config]
 */
export function apply(ctx, config = {}) {
	const tutorialRoot = config.tutorialRoot ?? config.repoRoot;
	const paperRoot = config.paperRoot ?? config.repoRoot;
	applyBook(ctx, { ...config, repoRoot: tutorialRoot });
	applyPaper(ctx, { ...config, repoRoot: paperRoot });
	registerDiagramTool(ctx);
}

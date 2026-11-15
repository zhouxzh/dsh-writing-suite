#!/usr/bin/env node
/** Remove the test-only dsh-tools stub after the suite test run. */
import { rm } from 'node:fs/promises';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
await rm(join(root, 'node_modules', '@deepseek-ai', 'dsh-tools'), { recursive: true, force: true });
console.log('test dsh-tools stub removed');

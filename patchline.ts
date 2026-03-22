#!/usr/bin/env bun
/**
 * Patchline launcher
 *
 * Usage:
 *   bun patchline.ts [--hmr] [--source <path>]...
 *   bun patchline.ts --hmr --source . --source ../other-repo
 *   npm run patchline:hmr -- --source . --source ~/work/app
 *
 * Each `--source` is one repository root (repeat the flag for multiple repos).
 * You can also use `--source a,b` (comma-separated in one flag). Paths are
 * resolved relative to the current working directory, then deduped.
 *
 * Omit every `--source` to pick folders in the app (and clear inherited PATCHLINE_SOURCE).
 */
import { resolve } from "path";
import { spawn } from "child_process";

/** Collect paths from repeated `--source` / `--source=`; commas inside a value split too. */
function collectSourcePaths(argv: string[]): string[] {
	const segments: string[] = [];
	for (let i = 0; i < argv.length; i++) {
		const a = argv[i]!;
		if (a === "--source") {
			const next = argv[i + 1];
			if (next !== undefined && !next.startsWith("-")) {
				segments.push(next);
				i += 1;
			}
			continue;
		}
		if (a.startsWith("--source=")) {
			const rest = a.slice("--source=".length);
			if (rest) segments.push(rest);
		}
	}
	const raw: string[] = [];
	for (const seg of segments) {
		for (const part of seg.split(",")) {
			const p = part.trim();
			if (p) raw.push(p);
		}
	}
	const seen = new Set<string>();
	const resolved: string[] = [];
	for (const p of raw) {
		const abs = resolve(p);
		if (seen.has(abs)) continue;
		seen.add(abs);
		resolved.push(abs);
	}
	return resolved;
}

const args = process.argv.slice(2);
const hmr = args.includes("--hmr");
const sourcePaths = collectSourcePaths(args);
const patchlineSource = sourcePaths.join(",");

const env: NodeJS.ProcessEnv = { ...process.env };
if (patchlineSource) {
	env.PATCHLINE_SOURCE = patchlineSource;
} else {
	delete env.PATCHLINE_SOURCE;
}

const sourceLog =
	sourcePaths.length === 0
		? "(pick folder in app)"
		: sourcePaths.length === 1
			? sourcePaths[0]
			: `${sourcePaths.length} repos`;

console.log(`Patchline → ${sourceLog}${hmr ? " (HMR)" : ""}`);

if (hmr) {
	const vite = spawn("bun", ["run", "hmr"], {
		stdio: "inherit",
		env,
		cwd: import.meta.dir,
	});
	await Bun.sleep(1500);
	const electrobun = spawn("bun", ["run", "start"], {
		stdio: "inherit",
		env,
		cwd: import.meta.dir,
	});

	const cleanup = () => {
		vite.kill();
		electrobun.kill();
		process.exit();
	};
	process.on("SIGINT", cleanup);
	process.on("SIGTERM", cleanup);

	await Promise.race([
		new Promise((_, reject) => vite.on("exit", (code) => reject(code))),
		new Promise((_, reject) =>
			electrobun.on("exit", (code) => reject(code)),
		),
	]).catch(() => cleanup());
} else {
	const proc = spawn("bun", ["run", "start"], {
		stdio: "inherit",
		env,
		cwd: import.meta.dir,
	});
	proc.on("exit", (code) => process.exit(code ?? 0));
}

#!/usr/bin/env bun
/**
 * Patchline launcher
 * Usage:
 *   bun patchline.ts --source /path/to/project         # normal
 *   bun patchline.ts --source /path/to/project --hmr   # with Vite HMR
 */
import { resolve } from "path";
import { spawn } from "child_process";

const args = process.argv.slice(2);

const sourceIdx = args.indexOf("--source");
const rawSource = sourceIdx !== -1 && args[sourceIdx + 1] ? args[sourceIdx + 1] : ".";
const sourcePath = resolve(rawSource);
const hmr = args.includes("--hmr");

const env = {
	...process.env,
	PATCHLINE_SOURCE: sourcePath,
	GEODESIC_SOURCE: sourcePath,
};

console.log(`Patchline → ${sourcePath}${hmr ? " (HMR)" : ""}`);

if (hmr) {
	// Run Vite dev server and electrobun dev in parallel
	const vite = spawn("bun", ["run", "hmr"], { stdio: "inherit", env, cwd: import.meta.dir });
	// Give Vite a moment to start before launching the app
	await Bun.sleep(1500);
	const electrobun = spawn("bun", ["run", "start"], { stdio: "inherit", env, cwd: import.meta.dir });

	const cleanup = () => {
		vite.kill();
		electrobun.kill();
		process.exit();
	};
	process.on("SIGINT", cleanup);
	process.on("SIGTERM", cleanup);

	await Promise.race([
		new Promise((_, reject) => vite.on("exit", (code) => reject(code))),
		new Promise((_, reject) => electrobun.on("exit", (code) => reject(code))),
	]).catch(() => cleanup());
} else {
	const proc = spawn("bun", ["run", "start"], { stdio: "inherit", env, cwd: import.meta.dir });
	proc.on("exit", (code) => process.exit(code ?? 0));
}

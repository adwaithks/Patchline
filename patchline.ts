#!/usr/bin/env bun
/**
 * Patchline launcher
 * Usage:
 *   bun patchline.ts [--source /path/to/project] [--hmr]
 *   Omit --source to open the app and pick a repository in the UI.
 */
import { resolve } from "path";
import { spawn } from "child_process";

const args = process.argv.slice(2);

const sourceIdx = args.indexOf("--source");
const hasSource = sourceIdx !== -1 && Boolean(args[sourceIdx + 1]);
const sourcePath = hasSource ? resolve(args[sourceIdx + 1]!) : undefined;
const hmr = args.includes("--hmr");

const env: NodeJS.ProcessEnv = { ...process.env };
if (hasSource && sourcePath) {
	env.PATCHLINE_SOURCE = sourcePath;
} else {
	delete env.PATCHLINE_SOURCE;
}

console.log(
	`Patchline → ${hasSource ? sourcePath : "(pick folder in app)"}${hmr ? " (HMR)" : ""}`,
);

if (hmr) {
	// Run Vite dev server and electrobun dev in parallel
	const vite = spawn("bun", ["run", "hmr"], {
		stdio: "inherit",
		env,
		cwd: import.meta.dir,
	});
	// Give Vite a moment to start before launching the app
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

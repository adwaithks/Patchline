import { BrowserWindow, BrowserView, Updater } from "electrobun/bun";
import { resolve, relative, join } from "path";
import { readdirSync, statSync } from "fs";
import type { GeodesicRPCType, TreeNode, FileChange } from "../shared/types";

const DEV_SERVER_PORT = 5173;
const DEV_SERVER_URL = `http://localhost:${DEV_SERVER_PORT}`;

// ---- Resolve source path ----
// Electrobun's launcher doesn't forward CLI args to the bun process,
// so we use the GEODESIC_SOURCE env var instead.
// Usage:  GEODESIC_SOURCE=/my/project bun run start
// or add a wrapper script that sets it from --source before launching.
function getSourcePath(): string {
	const fromEnv = process.env.GEODESIC_SOURCE;
	if (fromEnv) return resolve(fromEnv);

	// Fallback: parse --source from argv (works in direct bun invocations)
	const args = process.argv;
	const idx = args.indexOf("--source");
	if (idx !== -1 && args[idx + 1]) {
		return resolve(args[idx + 1]);
	}

	// Last resort: use the directory of this script's location,
	// which in dev mode is the actual project root
	return resolve(import.meta.dir, "../../");
}

const sourcePath = getSourcePath();

// ---- Build file tree ----
const IGNORE = new Set([
	".git", "node_modules", ".DS_Store", "dist", "build",
	".next", ".nuxt", ".cache", "coverage", "__pycache__",
]);

function buildTree(dir: string, rootDir: string): TreeNode[] {
	let entries: string[];
	try {
		entries = readdirSync(dir).filter((e) => !IGNORE.has(e)).sort((a, b) => {
			// Folders first
			const aIsDir = statSync(join(dir, a)).isDirectory();
			const bIsDir = statSync(join(dir, b)).isDirectory();
			if (aIsDir && !bIsDir) return -1;
			if (!aIsDir && bIsDir) return 1;
			return a.localeCompare(b);
		});
	} catch {
		return [];
	}

	return entries.map((entry) => {
		const fullPath = join(dir, entry);
		const isDir = statSync(fullPath).isDirectory();
		if (isDir) {
			const children = buildTree(fullPath, rootDir);
			return [entry, ...children] as TreeNode;
		}
		return entry;
	});
}

// ---- Read git status ----
async function getGitChanges(dir: string): Promise<FileChange[]> {
	try {
		const proc = Bun.spawn(["git", "status", "--porcelain"], {
			cwd: dir,
			stdout: "pipe",
			stderr: "pipe",
		});
		const text = await new Response(proc.stdout).text();
		await proc.exited;

		return text
			.split("\n")
			.filter(Boolean)
			.map((line) => {
				const xy = line.slice(0, 2);
				const path = line.slice(3).trim().replace(/^"(.*)"$/, "$1");
				let state: FileChange["state"] = "M";
				if (xy.includes("?")) state = "?";
				else if (xy.includes("A")) state = "A";
				else if (xy.includes("D")) state = "D";
				else if (xy.includes("R")) state = "R";
				else if (xy.includes("U") || xy.trim() === "") state = "U";
				else state = "M";
				return { path, state };
			});
	} catch {
		return [];
	}
}

// ---- RPC ----
const rpc = BrowserView.defineRPC<GeodesicRPCType>({
	maxRequestTime: 10000,
	handlers: {
		requests: {
			getProjectData: async () => {
				const [tree, changes] = await Promise.all([
					Promise.resolve(buildTree(sourcePath, sourcePath)),
					getGitChanges(sourcePath),
				]);
				return { sourcePath, tree, changes };
			},
		},
		messages: {},
	},
});

// ---- Window ----
async function getMainViewUrl(): Promise<string> {
	const channel = await Updater.localInfo.channel();
	if (channel === "dev") {
		try {
			await fetch(DEV_SERVER_URL, { method: "HEAD" });
			return DEV_SERVER_URL;
		} catch {
			// fall through
		}
	}
	return "views://mainview/index.html";
}

const url = await getMainViewUrl();

const mainWindow = new BrowserWindow({
	title: `Geodesic — ${sourcePath}`,
	url,
	titleBarStyle: "hiddenInset",
	frame: {
		width: 900,
		height: 700,
		x: 200,
		y: 200,
	},
	rpc,
});

console.log(`Geodesic started — watching: ${sourcePath}`);

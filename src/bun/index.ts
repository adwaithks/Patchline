import { BrowserWindow, BrowserView, Updater } from "electrobun/bun";
import { resolve, join } from "path";
import { readdirSync, statSync, readFileSync } from "fs";
import type { GeodesicRPCType, TreeNode, FileChange, FileDiff } from "../shared/types";

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

const BLOG = "[geodesic:bun]";
console.log(`${BLOG} process starting`, { sourcePath });

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
				const X = line[0] as FileChange["indexState"];
				const Y = line[1] as FileChange["worktreeState"];
				// Handle rename: "R  old -> new" or "R  old\0new"
				const rawPath = line.slice(3).trim().replace(/^"(.*)"$/, "$1");
				const path = rawPath.includes(" -> ")
					? rawPath.split(" -> ")[1]
					: rawPath;
				return { path, indexState: X, worktreeState: Y };
			});
	} catch {
		return [];
	}
}

// ---- Stage / unstage ----
async function runGit(args: string[], cwd: string): Promise<{ ok: boolean }> {
	try {
		const proc = Bun.spawn(["git", ...args], {
			cwd,
			stdout: "pipe",
			stderr: "pipe",
		});
		const exit = await proc.exited;
		return { ok: exit === 0 };
	} catch {
		return { ok: false };
	}
}

// ---- Get file diff via git ----
async function getFileDiff(filePath: string): Promise<FileDiff> {
	const absPath = join(sourcePath, filePath);
	console.log(`${BLOG} getFileDiff start`, { filePath, absPath, cwd: sourcePath });

	// Get new content from disk
	let newContent = "";
	try {
		newContent = readFileSync(absPath, "utf-8");
	} catch { /* deleted file */ }

	// Check if file is tracked in HEAD (exit 0 = tracked, non-zero = untracked/new)
	const headCheckProc = Bun.spawn(
		["git", "cat-file", "-e", `HEAD:${filePath}`],
		{ cwd: sourcePath, stdout: "pipe", stderr: "pipe" },
	);
	const headCheckExit = await headCheckProc.exited;
	const isTracked = headCheckExit === 0;

	// Get old content only if tracked
	let oldContent = "";
	if (isTracked) {
		const oldProc = Bun.spawn(
			["git", "show", `HEAD:${filePath}`],
			{ cwd: sourcePath, stdout: "pipe", stderr: "pipe" },
		);
		oldContent = await new Response(oldProc.stdout).text();
		await oldProc.exited;
	}

	console.log(`${BLOG} file tracking status`, { isTracked, newContentLen: newContent.length });

	let rawDiff = "";

	if (!isTracked) {
		// Untracked / new file — diff against /dev/null to show all lines as added
		const proc = Bun.spawn(
			["git", "diff", "--no-index", "/dev/null", filePath],
			{ cwd: sourcePath, stdout: "pipe", stderr: "pipe" },
		);
		const out = await new Response(proc.stdout).text();
		await proc.exited; // exits 1 when files differ — that's expected
		rawDiff = out.replace(/\r\n/g, "\n");
		console.log(`${BLOG} git diff --no-index (untracked) done`, { rawLen: rawDiff.length });
	} else {
		// Tracked file — diff against HEAD
		const diffProc = Bun.spawn(
			["git", "diff", "HEAD", "--", filePath],
			{ cwd: sourcePath, stdout: "pipe", stderr: "pipe" },
		);
		const hunks = await new Response(diffProc.stdout).text();
		const diffExit = await diffProc.exited;
		const diffStderr = await new Response(diffProc.stderr).text();
		if (diffStderr) console.warn(`${BLOG} git diff stderr`, diffStderr.slice(0, 500));
		console.log(`${BLOG} git diff HEAD done`, { exit: diffExit, rawLen: hunks.length });
		rawDiff = hunks.replace(/\r\n/g, "\n");
	}

	console.log(`${BLOG} getFileDiff done`, {
		filePath,
		oldContentLen: oldContent.length,
		newContentLen: newContent.length,
		rawDiffLen: rawDiff.length,
		preview: rawDiff.slice(0, 200),
	});

	return { filePath, oldContent, newContent, hunks: rawDiff };
}

// ---- RPC ----
const rpc = BrowserView.defineRPC<GeodesicRPCType>({
	maxRequestTime: 10000,
	handlers: {
		requests: {
			getProjectData: async () => {
				console.log(`${BLOG} RPC getProjectData`);
				const [tree, changes] = await Promise.all([
					Promise.resolve(buildTree(sourcePath, sourcePath)),
					getGitChanges(sourcePath),
				]);
				console.log(`${BLOG} RPC getProjectData →`, {
					treeRoots: tree.length,
					changes: changes.length,
				});
				return { sourcePath, tree, changes };
			},
			getFileDiff: async ({ filePath }) => {
				console.log(`${BLOG} RPC getFileDiff`, { filePath });
				return getFileDiff(filePath);
			},
			stageFile: async ({ filePath }) => {
				console.log(`${BLOG} RPC stageFile`, { filePath });
				return runGit(["add", filePath], sourcePath);
			},
			unstageFile: async ({ filePath }) => {
				console.log(`${BLOG} RPC unstageFile`, { filePath });
				return runGit(["reset", "HEAD", "--", filePath], sourcePath);
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

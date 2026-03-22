import { BrowserWindow, BrowserView, Updater } from "electrobun/bun";
import { resolve, join } from "path";
import { readdirSync, readFileSync, type Dirent } from "fs";
import { simpleGit, type SimpleGit } from "simple-git";
import type {
	GeodesicRPCType,
	TreeNode,
	FileChange,
	FileDiff,
	DiffScope,
	BranchInfo,
} from "../shared/types";

const DEV_SERVER_PORT = 5173;
const DEV_SERVER_URL = `http://localhost:${DEV_SERVER_PORT}`;

// Resolve source path
// Usage:  GEODESIC_SOURCE=/my/project bun run start
function getSourcePath(): string {
	const fromEnv = process.env.GEODESIC_SOURCE;
	if (!fromEnv)
		throw new Error(
			"GEODESIC_SOURCE is not set. Usage: GEODESIC_SOURCE=/my/project bun run start",
		);
	return resolve(fromEnv);
}

const sourcePath = getSourcePath();

const BLOG = "[geodesic:bun]";
console.log(`${BLOG} process starting`, { sourcePath });

/** One git instance for the open project (simple-git wraps the `git` CLI). */
const repoGit: SimpleGit = simpleGit(sourcePath);

// ---- Build file tree ----
const IGNORE = new Set([
	".git",
	"node_modules",
	".DS_Store",
	"dist",
	"build",
	".next",
	".nuxt",
	".cache",
	"coverage",
	"__pycache__",
]);

function buildTree(dir: string): TreeNode[] {
	let entries: Dirent[];
	try {
		entries = readdirSync(dir, { withFileTypes: true })
			.filter((e) => !IGNORE.has(e.name))
			.sort((a, b) => {
				if (a.isDirectory() && !b.isDirectory()) return -1;
				if (!a.isDirectory() && b.isDirectory()) return 1;
				return a.name.localeCompare(b.name);
			});
	} catch {
		return [];
	}

	return entries.map((entry) => {
		const fullPath = join(dir, entry.name);
		if (entry.isDirectory()) {
			return {
				type: "dir",
				name: entry.name,
				children: buildTree(fullPath),
			} satisfies TreeNode;
		}
		return { type: "file", name: entry.name } satisfies TreeNode;
	});
}

type PorcelainChar = FileChange["indexState"];

function normalizePorcelainChar(c: string): PorcelainChar {
	const ch = (c?.[0] ?? " ") as string;
	const allowed = new Set([" ", "M", "A", "D", "R", "C", "U", "?"]);
	return (allowed.has(ch) ? ch : " ") as PorcelainChar;
}

// Read git status (simple-git parses porcelain into files[])
async function getGitChanges(git: SimpleGit): Promise<FileChange[]> {
	try {
		const status = await git.status();
		return status.files.map((f) => ({
			path: f.path,
			indexState: normalizePorcelainChar(f.index),
			worktreeState: normalizePorcelainChar(f.working_dir),
		}));
	} catch {
		return [];
	}
}

async function getBranchInfo(git: SimpleGit): Promise<BranchInfo> {
	try {
		const abbrev = (await git.revparse(["--abbrev-ref", "HEAD"])).trim();
		const detached = abbrev === "HEAD";
		const current = detached
			? (await git.revparse(["--short", "HEAD"])).trim()
			: abbrev;
		let upstream: string | null = null;
		try {
			upstream = (await git.revparse(["--abbrev-ref", "@{u}"])).trim();
		} catch {
			upstream = null;
		}
		return { current, upstream, detached };
	} catch {
		return { current: "unknown", upstream: null, detached: false };
	}
}

async function stagePath(
	git: SimpleGit,
	filePath: string,
): Promise<{ ok: boolean }> {
	try {
		await git.add(filePath);
		return { ok: true };
	} catch {
		return { ok: false };
	}
}

async function unstagePath(
	git: SimpleGit,
	filePath: string,
): Promise<{ ok: boolean }> {
	try {
		await git.reset(["HEAD", "--", filePath]);
		return { ok: true };
	} catch {
		return { ok: false };
	}
}

async function stageAll(git: SimpleGit): Promise<{ ok: boolean }> {
	try {
		await git.raw(["add", "-A"]);
		return { ok: true };
	} catch {
		return { ok: false };
	}
}

async function unstageAll(git: SimpleGit): Promise<{ ok: boolean }> {
	try {
		await git.raw(["reset", "HEAD"]);
		return { ok: true };
	} catch {
		return { ok: false };
	}
}

async function commitStaged(
	git: SimpleGit,
	title: string,
	description: string,
): Promise<{ ok: boolean }> {
	const subject = title.trim();
	if (!subject) return { ok: false };
	const body = description.trim();
	const message = body ? `${subject}\n\n${body}` : subject;
	try {
		await git.commit(message);
		return { ok: true };
	} catch {
		return { ok: false };
	}
}

// git diff --no-index always exits 1 when files differ, causing simple-git to throw.
// The diff output ends up on the error object rather than the return value.
async function diffNoIndex(filePath: string): Promise<string> {
	try {
		await repoGit.raw(["diff", "--no-index", "/dev/null", filePath]);
		return "";
	} catch (e: unknown) {
		return (e as any)?.git?.stdout ?? "";
	}
}

async function showHead(filePath: string): Promise<string> {
	try {
		return (await repoGit.show([`HEAD:${filePath}`])).replace(/\r\n/g, "\n");
	} catch {
		return "";
	}
}

/** Staged snapshot (index / next commit), when present */
async function showIndex(filePath: string): Promise<string> {
	try {
		return (await repoGit.raw(["show", `:${filePath}`])).replace(/\r\n/g, "\n");
	} catch {
		return "";
	}
}

async function getFileDiff(
	filePath: string,
	diffScope: DiffScope,
): Promise<FileDiff> {
	const absPath = join(sourcePath, filePath);

	const worktree = (() => {
		try {
			return readFileSync(absPath, "utf-8");
		} catch {
			return "";
		}
	})();

	const { files } = await repoGit.status(["--", filePath]);
	const { index = " ", working_dir = " " } = files[0] ?? {};

	const isUntracked = index === "?" && working_dir === "?";
	const hasStaged = index !== " " && index !== "?";
	const hasUnstaged = working_dir !== " ";

	const headContent = await showHead(filePath);
	const indexContent = isUntracked ? "" : await showIndex(filePath);

	let rawDiff = "";
	let oldContent = "";
	let newContent = "";

	if (isUntracked) {
		rawDiff = await diffNoIndex(filePath);
		oldContent = "";
		newContent = worktree;
	} else if (diffScope === "staged" && hasStaged) {
		try {
			rawDiff = await repoGit.raw([
				"diff",
				"--cached",
				"HEAD",
				"--",
				filePath,
			]);
		} catch {
			rawDiff = "";
		}
		oldContent = headContent;
		newContent = indexContent;
	} else if (diffScope === "unstaged" && hasUnstaged) {
		// Worktree vs index (what you’re still editing on top of staging)
		try {
			rawDiff = await repoGit.raw(["diff", "--", filePath]);
		} catch {
			rawDiff = "";
		}
		oldContent = indexContent;
		newContent = worktree;
	} else {
		rawDiff = "";
		oldContent = headContent;
		newContent = worktree;
	}

	return {
		filePath,
		oldContent,
		newContent,
		hunks: rawDiff.replace(/\r\n/g, "\n"),
	};
}

// ---- RPC ----
const rpc = BrowserView.defineRPC<GeodesicRPCType>({
	maxRequestTime: 10000,
	handlers: {
		requests: {
			getProjectData: async () => {
				console.log(`${BLOG} RPC getProjectData`);
				const [tree, changes, branch] = await Promise.all([
					Promise.resolve(buildTree(sourcePath)),
					getGitChanges(repoGit),
					getBranchInfo(repoGit),
				]);
				console.log(`${BLOG} RPC getProjectData →`, {
					treeRoots: tree.length,
					changes: changes.length,
					branch: branch.current,
				});
				return { sourcePath, tree, changes, branch };
			},
			getFileDiff: async ({ filePath, diffScope }) => {
				console.log(`${BLOG} RPC getFileDiff`, { filePath, diffScope });
				return getFileDiff(filePath, diffScope);
			},
			stageFile: async ({ filePath }) => {
				console.log(`${BLOG} RPC stageFile`, { filePath });
				return stagePath(repoGit, filePath);
			},
			unstageFile: async ({ filePath }) => {
				console.log(`${BLOG} RPC unstageFile`, { filePath });
				return unstagePath(repoGit, filePath);
			},
			stageAll: async () => {
				console.log(`${BLOG} RPC stageAll`);
				return stageAll(repoGit);
			},
			unstageAll: async () => {
				console.log(`${BLOG} RPC unstageAll`);
				return unstageAll(repoGit);
			},
			commit: async ({ title, description }) => {
				console.log(`${BLOG} RPC commit`, { titleLen: title.length });
				return commitStaged(repoGit, title, description);
			},
		},
		messages: {},
	},
});

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

new BrowserWindow({
	title: `Geodesic — ${sourcePath}`,
	url,
	titleBarStyle: "hiddenInset",
	frame: {
		width: 1200,
		height: 800,
		x: 200,
		y: 200,
	},
	rpc,
});

console.log(`Geodesic started — watching: ${sourcePath}`);

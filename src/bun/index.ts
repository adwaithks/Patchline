import {
	ApplicationMenu,
	BrowserWindow,
	BrowserView,
	Updater,
	Utils,
} from "electrobun/bun";
import { resolve, join } from "path";
import { readFileSync } from "fs";
import { simpleGit, type SimpleGit } from "simple-git";
import type {
	PatchlineRPCType,
	FileChange,
	FileDiff,
	DiffScope,
	BranchInfo,
} from "../shared/types";

const DEV_SERVER_PORT = 5173;
const DEV_SERVER_URL = `http://localhost:${DEV_SERVER_PORT}`;

function getInitialWorkspaceRoot(): string | null {
	const fromEnv = process.env.PATCHLINE_SOURCE?.trim();
	if (!fromEnv) return null;
	return resolve(fromEnv);
}

let workspaceRoot: string | null = getInitialWorkspaceRoot();
let repoGit: SimpleGit | null = workspaceRoot ? simpleGit(workspaceRoot) : null;

const BLOG = "[patchline:bun]";
console.log(`${BLOG} process starting`, {
	workspaceRoot,
	hasGit: Boolean(repoGit),
});

function requireGit(): SimpleGit {
	if (!repoGit) {
		throw new Error("No Git repository is open");
	}
	return repoGit;
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
		await requireGit().raw(["diff", "--no-index", "/dev/null", filePath]);
		return "";
	} catch (e: unknown) {
		return (e as any)?.git?.stdout ?? "";
	}
}

async function showHead(filePath: string): Promise<string> {
	try {
		return (await requireGit().show([`HEAD:${filePath}`])).replace(
			/\r\n/g,
			"\n",
		);
	} catch {
		return "";
	}
}

/** Staged snapshot (index / next commit), when present */
async function showIndex(filePath: string): Promise<string> {
	try {
		return (await requireGit().raw(["show", `:${filePath}`])).replace(
			/\r\n/g,
			"\n",
		);
	} catch {
		return "";
	}
}

async function getFileDiff(
	filePath: string,
	diffScope: DiffScope,
): Promise<FileDiff> {
	if (!workspaceRoot || !repoGit) {
		return { filePath, oldContent: "", newContent: "", hunks: "" };
	}

	const absPath = join(workspaceRoot, filePath);

	const worktree = (() => {
		try {
			return readFileSync(absPath, "utf-8");
		} catch {
			return "";
		}
	})();

	const { files } = await requireGit().status(["--", filePath]);
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
			rawDiff = await requireGit().raw([
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
			rawDiff = await requireGit().raw(["diff", "--", filePath]);
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

const emptyBranch: BranchInfo = {
	current: "—",
	upstream: null,
	detached: false,
};

// ---- RPC ----
const rpc = BrowserView.defineRPC<PatchlineRPCType>({
	maxRequestTime: 10000,
	handlers: {
		requests: {
			getProjectData: async () => {
				console.log(`${BLOG} RPC getProjectData`);
				if (!workspaceRoot || !repoGit) {
					return {
						sourcePath: null,
						changes: [],
						branch: emptyBranch,
					};
				}
				const [changes, branch] = await Promise.all([
					getGitChanges(repoGit),
					getBranchInfo(repoGit),
				]);
				console.log(`${BLOG} RPC getProjectData →`, {
					changes: changes.length,
					branch: branch.current,
				});
				return { sourcePath: workspaceRoot, changes, branch };
			},
			openProjectFolder: async () => {
				const picked = await Utils.openFileDialog({
					canChooseFiles: false,
					canChooseDirectory: true,
					allowsMultipleSelection: false,
				});
				const raw = picked.map((s) => s.trim()).find(Boolean);
				if (!raw) {
					return { ok: false, path: null, error: null };
				}
				const path = resolve(raw);
				const isRepo = await simpleGit(path).checkIsRepo();
				if (!isRepo) {
					return {
						ok: false,
						path: null,
						error: "That folder is not a Git repository (no .git).",
					};
				}
				workspaceRoot = path;
				repoGit = simpleGit(path);
				mainWindow.setTitle(`Patchline — ${path}`);
				console.log(`${BLOG} opened project`, { path });
				return { ok: true, path, error: null };
			},
			getFileDiff: async ({ filePath, diffScope }) => {
				console.log(`${BLOG} RPC getFileDiff`, { filePath, diffScope });
				return getFileDiff(filePath, diffScope);
			},
			stageFile: async ({ filePath }) => {
				console.log(`${BLOG} RPC stageFile`, { filePath });
				if (!repoGit) return { ok: false };
				return stagePath(repoGit, filePath);
			},
			unstageFile: async ({ filePath }) => {
				console.log(`${BLOG} RPC unstageFile`, { filePath });
				if (!repoGit) return { ok: false };
				return unstagePath(repoGit, filePath);
			},
			stageAll: async () => {
				console.log(`${BLOG} RPC stageAll`);
				if (!repoGit) return { ok: false };
				return stageAll(repoGit);
			},
			unstageAll: async () => {
				console.log(`${BLOG} RPC unstageAll`);
				if (!repoGit) return { ok: false };
				return unstageAll(repoGit);
			},
			commit: async ({ title, description }) => {
				console.log(`${BLOG} RPC commit`, { titleLen: title.length });
				if (!repoGit) return { ok: false };
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

/** macOS menu bar: app name → Quit*/
function setupApplicationMenu() {
	ApplicationMenu.setApplicationMenu([
		{
			label: "Patchline",
			submenu: [
				{ role: "hide", accelerator: "Command+H" },
				{ role: "hideOthers", accelerator: "Command+Option+H" },
				{ role: "showAll" },
				{ type: "divider" },
				{ role: "quit", accelerator: "Command+Q" },
			],
		},
	]);
}

const url = await getMainViewUrl();

setupApplicationMenu();

const mainWindow = new BrowserWindow({
	title: workspaceRoot ? `Patchline — ${workspaceRoot}` : "Patchline",
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

if (workspaceRoot) {
	console.log(`Patchline started — watching: ${workspaceRoot}`);
} else {
	console.log("Patchline started — choose a repository from the app window");
}

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
	RepoSnapshot,
} from "../shared/types";

const DEV_SERVER_PORT = 5173;
const DEV_SERVER_URL = `http://localhost:${DEV_SERVER_PORT}`;

const BLOG = "[patchline:bun]";

function repoKey(path: string): string {
	return resolve(path);
}

const repoByRoot = new Map<string, SimpleGit>();
const repoOrder: string[] = [];

/**
 * Production (and any process env): `PATCHLINE_SOURCE` is one string; split on `,`
 * for multiple repo roots. Segments are trimmed, resolved to absolute paths, deduped.
 */
function parsePatchlineSourceRoots(raw: string): string[] {
	const out: string[] = [];
	const seen = new Set<string>();
	for (const part of raw.split(",")) {
		const p = part.trim();
		if (!p) continue;
		const abs = resolve(p);
		const key = repoKey(abs);
		if (seen.has(key)) continue;
		seen.add(key);
		out.push(abs);
	}
	return out;
}

function ensureRepo(absRoot: string): SimpleGit {
	const key = repoKey(absRoot);
	if (!repoByRoot.has(key)) {
		repoByRoot.set(key, simpleGit(key));
		repoOrder.push(key);
	}
	return repoByRoot.get(key)!;
}

/** Register repos listed in `PATCHLINE_SOURCE` (comma-separated string) before the window loads. */
async function bootstrapReposFromEnv(): Promise<void> {
	const raw = process.env.PATCHLINE_SOURCE?.trim();
	if (!raw) return;
	const candidates = parsePatchlineSourceRoots(raw);
	for (const abs of candidates) {
		const isRepo = await simpleGit(abs).checkIsRepo();
		if (!isRepo) {
			console.warn(`${BLOG} PATCHLINE_SOURCE skipped (not a Git repo)`, {
				path: abs,
			});
			continue;
		}
		ensureRepo(abs);
	}
}

function getGitOrNull(root: string): SimpleGit | null {
	return repoByRoot.get(repoKey(root)) ?? null;
}

type PorcelainChar = FileChange["indexState"];

function normalizePorcelainChar(c: string): PorcelainChar {
	const ch = (c?.[0] ?? " ") as string;
	const allowed = new Set([" ", "M", "A", "D", "R", "C", "U", "?"]);
	return (allowed.has(ch) ? ch : " ") as PorcelainChar;
}

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

async function diffNoIndex(
	git: SimpleGit,
	repoRelativePath: string,
): Promise<string> {
	try {
		const out = await git.raw([
			"diff",
			"--no-color",
			"--no-index",
			"--",
			"/dev/null",
			repoRelativePath,
		]);
		return String(out ?? "").replace(/\r\n/g, "\n");
	} catch (e: unknown) {
		const stdout = (e as { git?: { stdout?: string } })?.git?.stdout ?? "";
		return String(stdout).replace(/\r\n/g, "\n");
	}
}

async function showHead(git: SimpleGit, filePath: string): Promise<string> {
	try {
		return (await git.show([`HEAD:${filePath}`])).replace(/\r\n/g, "\n");
	} catch {
		return "";
	}
}

async function showIndex(git: SimpleGit, filePath: string): Promise<string> {
	try {
		return (await git.raw(["show", `:${filePath}`])).replace(/\r\n/g, "\n");
	} catch {
		return "";
	}
}

async function getFileDiff(
	repoRoot: string,
	filePath: string,
	diffScope: DiffScope,
): Promise<FileDiff> {
	const root = repoKey(repoRoot);
	const git = getGitOrNull(root);
	if (!git) {
		return { filePath, oldContent: "", newContent: "", hunks: "" };
	}

	const absPath = join(root, filePath);

	const worktree = (() => {
		try {
			return readFileSync(absPath, "utf-8");
		} catch {
			return "";
		}
	})();

	const { files } = await git.status(["--", filePath]);
	const { index = " ", working_dir = " " } = files[0] ?? {};

	const isUntracked = index === "?" && working_dir === "?";
	const hasStaged = index !== " " && index !== "?";
	const hasUnstaged = working_dir !== " ";

	const headContent = await showHead(git, filePath);
	const indexContent = isUntracked ? "" : await showIndex(git, filePath);

	let rawDiff = "";
	let oldContent = "";
	let newContent = "";

	if (isUntracked) {
		rawDiff = await diffNoIndex(git, filePath);
		oldContent = "";
		newContent = worktree;
	} else if (diffScope === "staged" && hasStaged) {
		try {
			rawDiff = await git.raw([
				"diff",
				"--no-color",
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
		try {
			rawDiff = await git.raw([
				"diff",
				"--no-color",
				"--",
				filePath,
			]);
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

function windowTitleFromRepos(): string {
	if (repoOrder.length === 0) return "Patchline";
	if (repoOrder.length === 1) return `Patchline — ${repoOrder[0]}`;
	return `Patchline — ${repoOrder.length} repos`;
}

const mainWindowHolder: { w: BrowserWindow | null } = { w: null };

function refreshWindowTitle() {
	mainWindowHolder.w?.setTitle(windowTitleFromRepos());
}

// ---- RPC ----
const rpc = BrowserView.defineRPC<PatchlineRPCType>({
	maxRequestTime: 10000,
	handlers: {
		requests: {
			getProjectData: async () => {
				const repos: RepoSnapshot[] = [];
				for (const root of repoOrder) {
					const git = repoByRoot.get(root);
					if (!git) continue;
					const [changes, branch] = await Promise.all([
						getGitChanges(git),
						getBranchInfo(git),
					]);
					repos.push({ root, changes, branch });
				}
				return { repos };
			},
			openProjectFolder: async () => {
				const picked = await Utils.openFileDialog({
					canChooseFiles: false,
					canChooseDirectory: true,
					allowsMultipleSelection: true,
				});
				const rawPaths = picked.map((s) => s.trim()).filter(Boolean);
				if (rawPaths.length === 0) {
					return { ok: false, path: null, paths: [], error: null };
				}

				const added: string[] = [];
				const seen = new Set<string>();
				let skippedNonRepo = 0;

				for (const raw of rawPaths) {
					const abs = resolve(raw);
					const key = repoKey(abs);
					if (seen.has(key)) continue;
					seen.add(key);

					const isRepo = await simpleGit(abs).checkIsRepo();
					if (!isRepo) {
						skippedNonRepo += 1;
						continue;
					}
					ensureRepo(abs);
					added.push(key);
				}

				refreshWindowTitle();

				if (added.length === 0) {
					const error =
						skippedNonRepo === 1
							? "That folder is not a Git repository (no .git)."
							: `None of the selected folders are Git repositories (${skippedNonRepo} folders).`;
					return { ok: false, path: null, paths: [], error };
				}

				console.log(`${BLOG} added repo(s)`, {
					paths: added,
					total: repoOrder.length,
					skippedNonRepo,
				});
				return {
					ok: true,
					path: added[0]!,
					paths: added,
					error: null,
				};
			},
			getFileDiff: async ({ repoRoot, filePath, diffScope }) => {
				return getFileDiff(repoRoot, filePath, diffScope);
			},
			stageFile: async ({ repoRoot, filePath }) => {
				const git = getGitOrNull(repoRoot);
				if (!git) return { ok: false };
				return stagePath(git, filePath);
			},
			unstageFile: async ({ repoRoot, filePath }) => {
				const git = getGitOrNull(repoRoot);
				if (!git) return { ok: false };
				return unstagePath(git, filePath);
			},
			stageAll: async ({ repoRoot }) => {
				const git = getGitOrNull(repoRoot);
				if (!git) return { ok: false };
				return stageAll(git);
			},
			unstageAll: async ({ repoRoot }) => {
				const git = getGitOrNull(repoRoot);
				if (!git) return { ok: false };
				return unstageAll(git);
			},
			commit: async ({ repoRoot, title, description }) => {
				const git = getGitOrNull(repoRoot);
				if (!git) return { ok: false };
				return commitStaged(git, title, description);
			},
		},
		messages: {},
	},
});

await bootstrapReposFromEnv();

console.log(`${BLOG} process starting`, {
	repoCount: repoOrder.length,
	repos: repoOrder,
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
	title: windowTitleFromRepos(),
	url,
	titleBarStyle: "hiddenInset",
	transparent: false,
	frame: {
		width: 1200,
		height: 800,
		x: 200,
		y: 200,
	},
	rpc,
});
mainWindowHolder.w = mainWindow;

if (repoOrder.length > 0) {
	console.log(
		`Patchline started — ${repoOrder.length} repo(s): ${repoOrder.join(", ")}`,
	);
} else {
	console.log("Patchline started — add one or more repositories from the app");
}

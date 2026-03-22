import type { RPCSchema } from "electrobun/bun";

export type FileChange = {
	path: string;
	/** X column from git status --porcelain (index/staged status) */
	indexState: " " | "M" | "A" | "D" | "R" | "C" | "U" | "?";
	/** Y column from git status --porcelain (worktree status) */
	worktreeState: " " | "M" | "A" | "D" | "R" | "C" | "U" | "?";
};

/** Which sidebar bucket the user opened the diff from (matters when a file is both staged and unstaged, i.e. MM). */
export type DiffScope = "staged" | "unstaged";

export type SelectedFileChange = FileChange & {
	diffScope: DiffScope;
	/** Absolute repository root this file belongs to. */
	repoRoot: string;
};

export type FileDiff = {
	filePath: string;
	oldContent: string;
	newContent: string;
	hunks: string;
};

/** Current HEAD branch identity + optional upstream (answers “on” / “from”). */
export type BranchInfo = {
	/** Branch name, or short SHA when `detached`. */
	current: string;
	/** Remote-tracking branch (e.g. `origin/main`) when an upstream is set. */
	upstream: string | null;
	/** `true` when not on a named local branch. */
	detached: boolean;
};

/** One tracked repository’s snapshot for the sidebar. */
export type RepoSnapshot = {
	/** Absolute path to the repo root. */
	root: string;
	changes: FileChange[];
	branch: BranchInfo;
};

export type PatchlineRPCType = {
	bun: RPCSchema<{
		requests: {
			getProjectData: {
				params: void;
				response: {
					/** Empty until at least one folder is added (or `PATCHLINE_SOURCE` at launch). */
					repos: RepoSnapshot[];
				};
			};
			openProjectFolder: {
				params: void;
				response: {
					ok: boolean;
					/** First successfully added path when `ok`; otherwise `null`. */
					path: string | null;
					/** Every repo root added in this dialog session (multi-select). */
					paths: string[];
					/** Set when nothing valid was added (e.g. not Git, or dialog error). */
					error: string | null;
				};
			};
			getFileDiff: {
				params: {
					repoRoot: string;
					filePath: string;
					diffScope: DiffScope;
				};
				response: FileDiff;
			};
			stageFile: {
				params: { repoRoot: string; filePath: string };
				response: { ok: boolean };
			};
			unstageFile: {
				params: { repoRoot: string; filePath: string };
				response: { ok: boolean };
			};
			stageAll: {
				params: { repoRoot: string };
				response: { ok: boolean };
			};
			unstageAll: {
				params: { repoRoot: string };
				response: { ok: boolean };
			};
			commit: {
				params: { repoRoot: string; title: string; description: string };
				response: { ok: boolean };
			};
		};
		messages: Record<never, never>;
	}>;
	webview: RPCSchema<{
		requests: Record<never, never>;
		messages: Record<never, never>;
	}>;
};

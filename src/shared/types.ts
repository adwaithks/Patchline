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

export type SelectedFileChange = FileChange & { diffScope: DiffScope };

/** File tree entry — discriminated union for clearer UI + future metadata. */
export type TreeNode =
	| { type: "file"; name: string }
	| { type: "dir"; name: string; children: TreeNode[] };

export type FileDiff = {
	filePath: string;
	oldContent: string;
	newContent: string;
	hunks: string;
};

export type GeodesicRPCType = {
	bun: RPCSchema<{
		requests: {
			getProjectData: {
				params: void;
				response: {
					sourcePath: string;
					tree: TreeNode[];
					changes: FileChange[];
				};
			};
			getFileDiff: {
				params: { filePath: string; diffScope: DiffScope };
				response: FileDiff;
			};
			stageFile: {
				params: { filePath: string };
				response: { ok: boolean };
			};
			unstageFile: {
				params: { filePath: string };
				response: { ok: boolean };
			};
			stageAll: {
				params: void;
				response: { ok: boolean };
			};
			unstageAll: {
				params: void;
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

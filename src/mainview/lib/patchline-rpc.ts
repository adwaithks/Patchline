import type {
	FileDiff,
	FileChange,
	DiffScope,
	BranchInfo,
} from "../../shared/types";

/** Webview client that calls Bun-side RPC request handlers */
export type PatchlineRpcClient = {
	request: {
		getProjectData: () => Promise<{
			sourcePath: string | null;
			changes: FileChange[];
			branch: BranchInfo;
		}>;
		openProjectFolder: () => Promise<{
			ok: boolean;
			path: string | null;
			error: string | null;
		}>;
		getFileDiff: (params: {
			filePath: string;
			diffScope: DiffScope;
		}) => Promise<FileDiff>;
		stageFile: (params: { filePath: string }) => Promise<{ ok: boolean }>;
		unstageFile: (params: { filePath: string }) => Promise<{ ok: boolean }>;
		stageAll: () => Promise<{ ok: boolean }>;
		unstageAll: () => Promise<{ ok: boolean }>;
		commit: (params: {
			title: string;
			description: string;
		}) => Promise<{ ok: boolean }>;
	};
};

declare global {
	interface Window {
		__patchlineRPC?: PatchlineRpcClient;
	}
}

/** Returns the Electroview RPC bridge when running inside Patchline; otherwise `undefined`. */
export function getPatchlineRPC(): PatchlineRpcClient | undefined {
	return window.__patchlineRPC;
}

/** `true` when the webview can call Bun (same as `Boolean(getPatchlineRPC())`). */
export function isPatchlineRpcAvailable(): boolean {
	return getPatchlineRPC() !== undefined;
}

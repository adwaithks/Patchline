import type { FileDiff, DiffScope, RepoSnapshot } from "../../shared/types";

/** Webview client that calls Bun-side RPC request handlers */
export type PatchlineRpcClient = {
	request: {
		getProjectData: () => Promise<{ repos: RepoSnapshot[] }>;
		openProjectFolder: () => Promise<{
			ok: boolean;
			path: string | null;
			paths: string[];
			error: string | null;
		}>;
		getFileDiff: (params: {
			repoRoot: string;
			filePath: string;
			diffScope: DiffScope;
		}) => Promise<FileDiff>;
		stageFile: (params: {
			repoRoot: string;
			filePath: string;
		}) => Promise<{ ok: boolean }>;
		unstageFile: (params: {
			repoRoot: string;
			filePath: string;
		}) => Promise<{ ok: boolean }>;
		stageAll: (params: { repoRoot: string }) => Promise<{ ok: boolean }>;
		unstageAll: (params: { repoRoot: string }) => Promise<{ ok: boolean }>;
		commit: (params: {
			repoRoot: string;
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

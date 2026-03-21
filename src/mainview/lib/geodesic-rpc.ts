import type {
	FileDiff,
	FileChange,
	TreeNode,
	DiffScope,
} from "../../shared/types";

/** Webview client that calls Bun-side RPC request handlers */
export type GeodesicRpcClient = {
	request: {
		getProjectData: () => Promise<{
			sourcePath: string;
			tree: TreeNode[];
			changes: FileChange[];
		}>;
		getFileDiff: (params: {
			filePath: string;
			diffScope: DiffScope;
		}) => Promise<FileDiff>;
		stageFile: (params: { filePath: string }) => Promise<{ ok: boolean }>;
		unstageFile: (params: { filePath: string }) => Promise<{ ok: boolean }>;
	};
};

declare global {
	interface Window {
		__geodesicRPC?: GeodesicRpcClient;
	}
}

/** Returns the Electroview RPC bridge when running inside Geodesic; otherwise `undefined`. */
export function getGeodesicRPC(): GeodesicRpcClient | undefined {
	return window.__geodesicRPC;
}

/** `true` when the webview can call Bun (same as `Boolean(getGeodesicRPC())`). */
export function isGeodesicRpcAvailable(): boolean {
	return getGeodesicRPC() !== undefined;
}

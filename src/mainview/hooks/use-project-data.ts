import { useState, useEffect, useCallback } from "react";
import type { TreeNode, FileChange } from "../../shared/types";

const LOG = "[geodesic:webview]";

export type ProjectData = {
	sourcePath: string;
	tree: TreeNode[];
	changes: FileChange[];
};

export function useProjectData() {
	const [data, setData] = useState<ProjectData | null>(null);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);

	const load = useCallback(async () => {
		console.log(`${LOG} useProjectData: fetching project…`);
		try {
			const rpc = (window as any).__geodesicRPC;
			if (!rpc) {
				console.log(`${LOG} useProjectData: no RPC — using empty dev preview data`);
				setData({ sourcePath: "(dev preview)", tree: [], changes: [] });
				return;
			}
			const result = await rpc.request.getProjectData();
			console.log(`${LOG} useProjectData: getProjectData ok`, {
				sourcePath: result.sourcePath,
				treeRoots: result.tree?.length ?? 0,
				changes: result.changes?.length ?? 0,
			});
			setData(result);
		} catch (e) {
			const msg = e instanceof Error ? e.message : "Failed to load";
			console.error(`${LOG} useProjectData: error`, e);
			setError(msg);
		} finally {
			setLoading(false);
		}
	}, []);

	useEffect(() => { load(); }, [load]);

	return { data, loading, error, refresh: load };
}

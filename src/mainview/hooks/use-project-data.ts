import { useState, useEffect } from "react";
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

	useEffect(() => {
		async function load() {
			console.log(`${LOG} useProjectData: fetching project…`);
			try {
				const rpc = (window as any).__geodesicRPC;
				if (!rpc) {
					console.log(
						`${LOG} useProjectData: no RPC — using empty dev preview data`,
					);
					setData({ sourcePath: "(dev preview)", tree: [], changes: [] });
					return;
				}
				console.log(`${LOG} useProjectData: calling rpc.request.getProjectData()`);
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
				console.log(`${LOG} useProjectData: load finished`);
			}
		}
		load();
	}, []);

	return { data, loading, error };
}

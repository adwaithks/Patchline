import { useState, useEffect } from "react";
import type { TreeNode, FileChange } from "../../shared/types";

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
			try {
				const rpc = (window as any).__geodesicRPC;
				if (!rpc) {
					// Running in Vite HMR without Electrobun
					setData({ sourcePath: "(dev preview)", tree: [], changes: [] });
					setLoading(false);
					return;
				}
				const result = await rpc.requestProxy.getProjectData();
				setData(result);
			} catch (e) {
				setError(e instanceof Error ? e.message : "Failed to load");
			} finally {
				setLoading(false);
			}
		}

		// RPC may not be ready immediately — wait a tick for the dynamic import to settle
		const timer = setTimeout(load, 100);
		return () => clearTimeout(timer);
	}, []);

	return { data, loading, error };
}

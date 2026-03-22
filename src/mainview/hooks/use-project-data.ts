import { useState, useEffect, useCallback } from "react";
import { getGeodesicRPC } from "@/lib/geodesic-rpc";
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
		try {
			const rpc = getGeodesicRPC();
			if (!rpc) {
				setData({ sourcePath: "(dev preview)", tree: [], changes: [] });
				return;
			}
			const result = await rpc.request.getProjectData();
			setData(result);
		} catch (e) {
			const msg = e instanceof Error ? e.message : "Failed to load";
			console.error(`${LOG} useProjectData: error`, e);
			setError(msg);
		} finally {
			setLoading(false);
		}
	}, []);

	useEffect(() => {
		load();
	}, [load]);

	// Poll git snapshot ~1s — only consumed under SidebarGitProvider so main panel doesn’t re-render.
	useEffect(() => {
		const rpc = getGeodesicRPC();
		if (!rpc) return;
		const id = setInterval(() => {
			load();
		}, 1000);
		return () => clearInterval(id);
	}, [load]);

	return { data, loading, error, refresh: load };
}

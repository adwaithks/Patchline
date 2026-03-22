import { useState, useEffect, useCallback } from "react";
import { getGeodesicRPC } from "@/lib/geodesic-rpc";
import type { FileChange, BranchInfo } from "../../shared/types";

const LOG = "[geodesic:webview]";

export type ProjectData = {
	sourcePath: string;
	changes: FileChange[];
	branch: BranchInfo;
};

export function useProjectData() {
	const [data, setData] = useState<ProjectData | null>(null);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);

	const load = useCallback(async () => {
		try {
			const rpc = getGeodesicRPC();
			if (!rpc) {
				setData({
					sourcePath: "(dev preview)",
					changes: [],
					branch: {
						current: "—",
						upstream: null,
						detached: false,
					},
				});
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

	// Poll git snapshot (~1s + random 0–999ms jitter) — reduces lock alignment with other git calls.
	useEffect(() => {
		const rpc = getGeodesicRPC();
		if (!rpc) return;
		let cancelled = false;
		let timeoutId: ReturnType<typeof setTimeout>;

		const scheduleNext = () => {
			const ms = 1000 + Math.floor(Math.random() * 1000);
			timeoutId = setTimeout(() => {
				if (cancelled) return;
				void load().finally(() => {
					if (!cancelled) scheduleNext();
				});
			}, ms);
		};

		scheduleNext();
		return () => {
			cancelled = true;
			clearTimeout(timeoutId);
		};
	}, [load]);

	return { data, loading, error, refresh: load };
}

import {
	createContext,
	useContext,
	useEffect,
	useMemo,
	type ReactNode,
} from "react";
import { useProjectData, type ProjectData } from "@/hooks/use-project-data";
import { useWorkspace } from "@/context/workspace-context";

/** Live Git snapshot from the main process — updates on poll (~1–2s). */
export type GitSnapshotValue = {
	data: ProjectData | null;
	loading: boolean;
	error: string | null;
};

/** Imperative refresh — stable identity; does not tick with poll results. */
export type GitActionsValue = {
	refresh: () => void;
};

const GitSnapshotContext = createContext<GitSnapshotValue>({
	data: null,
	loading: true,
	error: null,
});

const GitActionsContext = createContext<GitActionsValue>({
	refresh: () => {},
});

/**
 * Owns `useProjectData` polling and splits it into:
 * - **Snapshot** — high-churn; use only in sidebar, empty-state gate, header bits that need repo list.
 * - **Actions** — stable `refresh`; safe for staging/commit handlers without subscribing to poll churn.
 */
export function SidebarGitProvider({ children }: { children: ReactNode }) {
	const projectData = useProjectData();
	const { setSourcePath } = useWorkspace();

	const snapshot = useMemo<GitSnapshotValue>(
		() => ({
			data: projectData.data,
			loading: projectData.loading,
			error: projectData.error,
		}),
		[projectData.data, projectData.loading, projectData.error],
	);

	const actions = useMemo<GitActionsValue>(
		() => ({ refresh: projectData.refresh }),
		[projectData.refresh],
	);

	useEffect(() => {
		const repos = projectData.data?.repos;
		if (repos === undefined) return;
		const first = repos[0]?.root;
		if (first === "(dev preview)") return;
		if (!first) {
			setSourcePath(null);
			return;
		}
		setSourcePath(first);
	}, [projectData.data?.repos, setSourcePath]);

	return (
		<GitSnapshotContext.Provider value={snapshot}>
			<GitActionsContext.Provider value={actions}>
				{children}
			</GitActionsContext.Provider>
		</GitSnapshotContext.Provider>
	);
}

export function useGitSnapshot() {
	return useContext(GitSnapshotContext);
}

export function useGitActions() {
	return useContext(GitActionsContext);
}

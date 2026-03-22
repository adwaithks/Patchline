import {
	createContext,
	useContext,
	useEffect,
	type ReactNode,
} from "react";
import { useProjectData, type ProjectData } from "@/hooks/use-project-data";
import { useWorkspace } from "@/context/workspace-context";

type SidebarGitContextValue = {
	data: ProjectData | null;
	loading: boolean;
	error: string | null;
	refresh: () => void;
};

const SidebarGitContext = createContext<SidebarGitContextValue>({
	data: null,
	loading: true,
	error: null,
	refresh: () => {},
});

/** Git snapshot + poll — only the sidebar should use this. Main panel uses `useWorkspace`. */
export function SidebarGitProvider({ children }: { children: ReactNode }) {
	const projectData = useProjectData();
	const { setSourcePath } = useWorkspace();

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
		<SidebarGitContext.Provider value={projectData}>
			{children}
		</SidebarGitContext.Provider>
	);
}

export function useSidebarGit() {
	return useContext(SidebarGitContext);
}

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
		const p = projectData.data?.sourcePath;
		if (p === undefined) return;
		if (p === "(dev preview)") return;
		if (p === null) {
			setSourcePath(null);
			return;
		}
		setSourcePath(p);
	}, [projectData.data?.sourcePath, setSourcePath]);

	return (
		<SidebarGitContext.Provider value={projectData}>
			{children}
		</SidebarGitContext.Provider>
	);
}

export function useSidebarGit() {
	return useContext(SidebarGitContext);
}

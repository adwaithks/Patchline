import { createContext, useContext, type ReactNode } from "react";
import { useProjectData, type ProjectData } from "@/hooks/use-project-data";

type ProjectContextValue = {
	data: ProjectData | null;
	loading: boolean;
	error: string | null;
};

const ProjectContext = createContext<ProjectContextValue>({
	data: null,
	loading: true,
	error: null,
});

export function ProjectProvider({ children }: { children: ReactNode }) {
	const value = useProjectData();
	return (
		<ProjectContext.Provider value={value}>
			{children}
		</ProjectContext.Provider>
	);
}

export function useProject() {
	return useContext(ProjectContext);
}

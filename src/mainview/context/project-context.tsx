import {
	createContext,
	useCallback,
	useContext,
	useState,
	type ReactNode,
} from "react";
import { useProjectData, type ProjectData } from "@/hooks/use-project-data";
import type { SelectedFileChange } from "../../shared/types";

type ProjectContextValue = {
	data: ProjectData | null;
	loading: boolean;
	error: string | null;
	selectedFile: SelectedFileChange | null;
	selectFile: (file: SelectedFileChange | null) => void;
	refresh: () => void;
};

const ProjectContext = createContext<ProjectContextValue>({
	data: null,
	loading: true,
	error: null,
	selectedFile: null,
	selectFile: () => {},
	refresh: () => {},
});

const LOG = "[geodesic:webview]";

export function ProjectProvider({ children }: { children: ReactNode }) {
	const projectData = useProjectData();
	const [selectedFile, setSelectedFile] = useState<SelectedFileChange | null>(
		null,
	);

	const selectFile = useCallback((file: SelectedFileChange | null) => {
		if (file) {
			console.log(`${LOG} selectFile`, {
				path: file.path,
				diffScope: file.diffScope,
			});
		}
		setSelectedFile(file);
	}, []);

	return (
		<ProjectContext.Provider
			value={{
				...projectData,
				selectedFile,
				selectFile,
				refresh: projectData.refresh,
			}}
		>
			{children}
		</ProjectContext.Provider>
	);
}

export function useProject() {
	return useContext(ProjectContext);
}

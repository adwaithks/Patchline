import {
	createContext,
	useCallback,
	useContext,
	useState,
	type ReactNode,
} from "react";
import { useProjectData, type ProjectData } from "@/hooks/use-project-data";
import type { FileChange } from "../../shared/types";

type ProjectContextValue = {
	data: ProjectData | null;
	loading: boolean;
	error: string | null;
	selectedFile: FileChange | null;
	selectFile: (file: FileChange | null) => void;
};

const ProjectContext = createContext<ProjectContextValue>({
	data: null,
	loading: true,
	error: null,
	selectedFile: null,
	selectFile: () => {},
});

const LOG = "[geodesic:webview]";

export function ProjectProvider({ children }: { children: ReactNode }) {
	const projectData = useProjectData();
	const [selectedFile, setSelectedFile] = useState<FileChange | null>(null);

	const selectFile = useCallback((file: FileChange | null) => {
		if (file) {
			console.log(`${LOG} selectFile (Changes tab click)`, {
				path: file.path,
				state: file.state,
			});
		} else {
			console.log(`${LOG} selectFile cleared`);
		}
		setSelectedFile(file);
	}, []);

	return (
		<ProjectContext.Provider value={{
			...projectData,
			selectedFile,
			selectFile,
		}}>
			{children}
		</ProjectContext.Provider>
	);
}

export function useProject() {
	return useContext(ProjectContext);
}

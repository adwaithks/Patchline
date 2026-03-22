import {
	createContext,
	useCallback,
	useContext,
	useState,
	type ReactNode,
} from "react";
import type { SelectedFileChange } from "../../shared/types";

type WorkspaceContextValue = {
	/** Absolute project root — updated when git data first reports it (not on every poll churn). */
	sourcePath: string | null;
	setSourcePath: (path: string) => void;
	selectedFile: SelectedFileChange | null;
	selectFile: (file: SelectedFileChange | null) => void;
};

const WorkspaceContext = createContext<WorkspaceContextValue>({
	sourcePath: null,
	setSourcePath: () => {},
	selectedFile: null,
	selectFile: () => {},
});

const LOG = "[geodesic:webview]";

export function WorkspaceProvider({ children }: { children: ReactNode }) {
	const [sourcePath, setSourcePathState] = useState<string | null>(null);
	const [selectedFile, setSelectedFile] = useState<SelectedFileChange | null>(
		null,
	);

	const setSourcePath = useCallback((path: string) => {
		setSourcePathState(path);
	}, []);

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
		<WorkspaceContext.Provider
			value={{
				sourcePath,
				setSourcePath,
				selectedFile,
				selectFile,
			}}
		>
			{children}
		</WorkspaceContext.Provider>
	);
}

export function useWorkspace() {
	return useContext(WorkspaceContext);
}

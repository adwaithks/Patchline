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
	setSourcePath: (path: string | null) => void;
	selectedFile: SelectedFileChange | null;
	selectFile: (file: SelectedFileChange | null) => void;
};

const WorkspaceContext = createContext<WorkspaceContextValue>({
	sourcePath: null,
	setSourcePath: () => {},
	selectedFile: null,
	selectFile: () => {},
});

export function WorkspaceProvider({ children }: { children: ReactNode }) {
	const [sourcePath, setSourcePathState] = useState<string | null>(null);
	const [selectedFile, setSelectedFile] = useState<SelectedFileChange | null>(
		null,
	);

	const setSourcePath = useCallback((path: string | null) => {
		setSourcePathState(path);
	}, []);

	const selectFile = useCallback((file: SelectedFileChange | null) => {
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

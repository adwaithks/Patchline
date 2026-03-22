import { useState } from "react";
import { AppSidebar } from "@/components/app-sidebar";
import { DiffViewer } from "@/components/diff-viewer";
import {
	SidebarInset,
	SidebarProvider,
	SidebarTrigger,
	useSidebar,
} from "@/components/ui/sidebar";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { SidebarGitProvider } from "@/context/sidebar-git-context";
import { useWorkspace, WorkspaceProvider } from "@/context/workspace-context";
import type { DiffLayoutMode } from "@/types/diff-layout";

function AppContent() {
	const { sourcePath, selectedFile } = useWorkspace();
	const { open } = useSidebar();
	const [diffLayout, setDiffLayout] = useState<DiffLayoutMode>("unified");

	return (
		<SidebarInset className="flex flex-col h-svh overflow-hidden">
			<header
				className="flex h-10 shrink-0 items-center gap-2 border-b electrobun-webkit-app-region-drag"
				style={{
					paddingLeft: open ? "1rem" : "5rem",
					paddingRight: "1rem",
				}}
			>
				<SidebarTrigger className="-ml-1 electrobun-webkit-app-region-no-drag shrink-0" />
				<span className="text-xs text-muted-foreground truncate select-none min-w-0 flex-1 direction-rtl">
					{selectedFile?.path ?? sourcePath ?? "Select a file to view"}
				</span>
				{selectedFile ? (
					<Tabs
						value={diffLayout}
						onValueChange={(v) =>
							setDiffLayout(v as DiffLayoutMode)
						}
						className="electrobun-webkit-app-region-no-drag shrink-0"
					>
						<TabsList className="h-6 rounded-lg gap-0.5 border border-zinc-800 bg-zinc-950 p-0.5">
							<TabsTrigger
								value="split"
								className="rounded-md h-5 px-2.5 text-[10px] font-medium text-zinc-400 data-[state=active]:bg-zinc-200 data-[state=active]:text-zinc-900 data-[state=active]:shadow-sm data-[state=inactive]:bg-transparent data-[state=inactive]:shadow-none"
							>
								Split
							</TabsTrigger>
							<TabsTrigger
								value="unified"
								className="rounded-md h-5 px-2.5 text-[10px] font-medium text-zinc-400 data-[state=active]:bg-zinc-200 data-[state=active]:text-zinc-900 data-[state=active]:shadow-sm data-[state=inactive]:bg-transparent data-[state=inactive]:shadow-none"
							>
								Unified
							</TabsTrigger>
						</TabsList>
					</Tabs>
				) : null}
			</header>
			<main className="flex flex-1 min-h-0 overflow-hidden">
				{selectedFile ? (
					<DiffViewer file={selectedFile} layout={diffLayout} />
				) : (
					<div className="flex flex-1 items-center justify-center text-muted-foreground text-sm">
						Select a changed file to view its diff
					</div>
				)}
			</main>
		</SidebarInset>
	);
}

function App() {
	return (
		<WorkspaceProvider>
			<SidebarProvider>
				<SidebarGitProvider>
					<AppSidebar />
				</SidebarGitProvider>
				<AppContent />
			</SidebarProvider>
		</WorkspaceProvider>
	);
}

export default App;

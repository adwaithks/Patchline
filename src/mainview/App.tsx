import { useState } from "react";
import { FolderPlus } from "lucide-react";
import { AppSidebar } from "@/components/app-sidebar";
import { DiffViewer } from "@/components/diff-viewer";
import { OpenProjectScreen } from "@/components/open-project-screen";
import {
	SidebarInset,
	SidebarProvider,
	SidebarTrigger,
	useSidebar,
} from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
	SidebarGitProvider,
	useSidebarGit,
} from "@/context/sidebar-git-context";
import { useWorkspace, WorkspaceProvider } from "@/context/workspace-context";
import { getPatchlineRPC } from "@/lib/patchline-rpc";
import type { DiffLayoutMode } from "@/types/diff-layout";

function repoBasename(absRoot: string): string {
	const t = absRoot.replace(/[/\\]+$/, "");
	const parts = t.split(/[/\\]/);
	return parts[parts.length - 1] ?? absRoot;
}

/** Prefer path relative to `repoRoot`; pass through if already relative or not under root. */
function pathRelativeToRepo(repoRoot: string, filePath: string): string {
	const forward = (s: string) => s.replace(/\\/g, "/");
	const root = forward(repoRoot).replace(/\/+$/, "");
	let p = forward(filePath);
	const prefix = `${root}/`;
	if (p.startsWith(prefix)) {
		const rest = p.slice(prefix.length);
		return rest || ".";
	}
	return p;
}

function AppContent() {
	const { selectedFile } = useWorkspace();
	const { data, loading, refresh } = useSidebarGit();
	const { open } = useSidebar();
	const rpc = getPatchlineRPC();
	const [diffLayout, setDiffLayout] = useState<DiffLayoutMode>("unified");

	async function handleAddRepository() {
		if (!rpc) return;
		const res = await rpc.request.openProjectFolder();
		if (res.ok && res.paths.length > 0) await refresh();
	}

	const headerSubtitle = (() => {
		if (selectedFile) {
			const repo = repoBasename(selectedFile.repoRoot);
			const rel = pathRelativeToRepo(
				selectedFile.repoRoot,
				selectedFile.path,
			);
			return `${repo}/${rel}`;
		}
		const repos = data?.repos ?? [];
		if (repos.length === 0) return "Add a repository";
		if (repos.length === 1) return repos[0].root;
		return `${repos.length} repositories`;
	})();

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
					{headerSubtitle}
				</span>
				{rpc || selectedFile ? (
					<div className="ml-auto flex shrink-0 items-center gap-1.5 electrobun-webkit-app-region-no-drag">
						{rpc ? (
							<Button
								type="button"
								variant="ghost"
								size="icon"
								title="Add repository"
								aria-label="Add repository"
								className="size-7 shrink-0 text-muted-foreground hover:text-foreground"
								disabled={loading}
								onClick={() => void handleAddRepository()}
							>
								<FolderPlus
									className="size-4"
									strokeWidth={1.75}
								/>
							</Button>
						) : null}
						{selectedFile ? (
							<Tabs
								value={diffLayout}
								onValueChange={(v) =>
									setDiffLayout(v as DiffLayoutMode)
								}
								className="shrink-0"
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
					</div>
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

console.log("AppContent");

/** Subscribes to git poll; lives under `SidebarGitProvider` only so `AppContent` is not a descendant. */
function SidebarGitColumn() {
	const { data, loading, error, refresh } = useSidebarGit();
	const { selectFile } = useWorkspace();
	const rpc = getPatchlineRPC();

	const needsOpen =
		Boolean(rpc) &&
		!loading &&
		data !== null &&
		(data.repos?.length ?? 0) === 0;

	if (needsOpen) {
		return (
			<div className="fixed inset-0 z-50 flex min-h-svh w-full flex-col bg-background">
				<OpenProjectScreen
					gitLoadError={error}
					onOpened={async () => {
						selectFile(null);
						await refresh();
					}}
				/>
			</div>
		);
	}

	return <AppSidebar />;
}

function App() {
	return (
		<WorkspaceProvider>
			<SidebarProvider>
				<SidebarGitProvider>
					<SidebarGitColumn />
					<AppContent />
				</SidebarGitProvider>
			</SidebarProvider>
		</WorkspaceProvider>
	);
}

export default App;

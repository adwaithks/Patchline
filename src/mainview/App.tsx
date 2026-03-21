import { AppSidebar } from "@/components/app-sidebar";
import {
	SidebarInset,
	SidebarProvider,
	SidebarTrigger,
} from "@/components/ui/sidebar";
import { useProject } from "@/context/project-context";

function App() {
	const { data } = useProject();

	return (
		<SidebarProvider>
			<AppSidebar />
			<SidebarInset>
				<header className="flex h-10 shrink-0 items-center gap-2 border-b px-4 electrobun-webkit-app-region-drag">
					<SidebarTrigger className="-ml-1 electrobun-webkit-app-region-no-drag shrink-0" />
					<span className="text-xs text-muted-foreground truncate select-none min-w-0 direction-rtl">
						{data?.sourcePath ?? "Select a file to view"}
					</span>
				</header>
				<main className="flex flex-1 items-center justify-center text-muted-foreground text-sm">
					No file selected
				</main>
			</SidebarInset>
		</SidebarProvider>
	);
}

export default App;

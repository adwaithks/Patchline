import { AppSidebar } from "@/components/app-sidebar";
import {
	SidebarInset,
	SidebarProvider,
	SidebarTrigger,
} from "@/components/ui/sidebar";

function App() {
	return (
		<SidebarProvider>
			<AppSidebar />
			<SidebarInset>
			<header className="flex h-10 shrink-0 items-center gap-2 border-b px-4 electrobun-webkit-app-region-drag bg-red-500/40">
					<SidebarTrigger className="-ml-1 electrobun-webkit-app-region-no-drag" />
					<span className="text-sm text-muted-foreground select-none">
						Select a file to view
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

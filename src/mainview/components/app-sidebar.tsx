import * as React from "react";
import { GitCompareArrows, FolderTree } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
	Sidebar,
	SidebarContent,
	SidebarHeader,
	SidebarRail,
} from "@/components/ui/sidebar";
import { SidebarChanges } from "@/components/sidebar-changes";
import { SidebarFileTree } from "@/components/sidebar-file-tree";

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
	return (
		<Sidebar {...props}>
			<SidebarHeader className="electrobun-webkit-app-region-drag h-10 p-0" />
			<SidebarContent>
				<Tabs defaultValue="changes" className="w-full">
					<TabsList className="mx-2 my-1 h-9 w-[calc(100%-1rem)] rounded-lg">
						<TabsTrigger
							value="changes"
							className="flex-1 text-xs gap-1.5 rounded-md"
						>
							<GitCompareArrows className="size-3.5" />
							Changes
						</TabsTrigger>
						<TabsTrigger
							value="files"
							className="flex-1 text-xs gap-1.5 rounded-md"
						>
							<FolderTree className="size-3.5" />
							Files
						</TabsTrigger>
					</TabsList>
					<TabsContent value="changes" className="mt-0">
						<SidebarChanges />
					</TabsContent>
					<TabsContent value="files" className="mt-0">
						<SidebarFileTree />
					</TabsContent>
				</Tabs>
			</SidebarContent>
			<SidebarRail />
		</Sidebar>
	);
}

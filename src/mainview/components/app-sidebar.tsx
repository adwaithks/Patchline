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
import { useSidebarGit } from "@/context/sidebar-git-context";

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
	const { data, loading } = useSidebarGit();

	return (
		<Sidebar {...props}>
			<SidebarHeader className="electrobun-webkit-app-region-drag h-10 p-0" />
			<SidebarContent>
				<Tabs defaultValue="changes" className="w-full">
					<TabsList className="mx-2 my-1 h-9 w-[calc(100%-1rem)] gap-1 rounded-xl border border-zinc-800 bg-zinc-950 p-1">
						<TabsTrigger
							value="changes"
							className="flex-1 gap-1.5 rounded-lg text-xs font-medium text-zinc-400 data-[state=active]:bg-zinc-200 data-[state=active]:text-zinc-900 data-[state=active]:shadow-sm data-[state=inactive]:bg-transparent data-[state=inactive]:shadow-none"
						>
							<GitCompareArrows className="size-3.5" />
							Changes
						</TabsTrigger>
						<TabsTrigger
							value="files"
							className="flex-1 gap-1.5 rounded-lg text-xs font-medium text-zinc-400 data-[state=active]:bg-zinc-200 data-[state=active]:text-zinc-900 data-[state=active]:shadow-sm data-[state=inactive]:bg-transparent data-[state=inactive]:shadow-none"
						>
							<FolderTree className="size-3.5" />
							Files
						</TabsTrigger>
					</TabsList>
					<TabsContent value="changes" className="mt-0">
						{loading ? (
							<LoadingState />
						) : (
							<SidebarChanges changes={data?.changes ?? []} />
						)}
					</TabsContent>
					<TabsContent value="files" className="mt-0">
						{loading ? (
							<LoadingState />
						) : (
							<SidebarFileTree tree={data?.tree ?? []} />
						)}
					</TabsContent>
				</Tabs>
			</SidebarContent>
			<SidebarRail />
		</Sidebar>
	);
}

function LoadingState() {
	return (
		<div className="space-y-1 px-3 py-2">
			{[...Array(5)].map((_, i) => (
				<div
					key={i}
					className="h-7 rounded-md bg-muted/50 animate-pulse"
					style={{ width: `${60 + (i % 3) * 15}%` }}
				/>
			))}
		</div>
	);
}

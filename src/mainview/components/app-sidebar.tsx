import * as React from "react";
import { GitBranch, GitCompareArrows, FolderTree } from "lucide-react";
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
import type { BranchInfo } from "../../shared/types";

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
	const { data, loading } = useSidebarGit();

	return (
		<Sidebar {...props}>
			<SidebarHeader className="electrobun-webkit-app-region-drag h-10 p-0" />
			<SidebarContent>
				<SidebarBranchBar loading={loading} branch={data?.branch} />
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

function SidebarBranchBar({
	loading,
	branch,
}: {
	loading: boolean;
	branch: BranchInfo | undefined;
}) {
	if (loading) {
		return (
			<div className="mx-3 mb-2 mt-1 space-y-1.5">
				<div className="h-3.5 w-[7.5rem] animate-pulse rounded bg-muted/40" />
				<div className="h-3 w-[9rem] animate-pulse rounded bg-muted/30" />
			</div>
		);
	}

	if (!branch) return null;

	return (
		<div className="mx-3 mb-2 mt-1">
			<div className="flex items-center gap-1.5 text-[11px] leading-tight">
				<GitBranch className="size-3.5 shrink-0 text-zinc-500" />
				<span className="text-zinc-500">On</span>
				<span
					className="truncate font-mono font-medium text-zinc-200"
					title={branch.detached ? `Detached at ${branch.current}` : branch.current}
				>
					{branch.current}
				</span>
				{branch.detached && (
					<span className="shrink-0 rounded bg-zinc-800 px-1 py-px text-[9px] font-medium uppercase tracking-wide text-zinc-400">
						detached
					</span>
				)}
			</div>
			<div className="mt-1 pl-5 text-[10px] leading-snug text-zinc-500">
				{branch.upstream ? (
					<>
						From{" "}
						<span className="font-mono text-zinc-400" title={branch.upstream}>
							{branch.upstream}
						</span>
					</>
				) : (
					<span className="italic text-zinc-600">No upstream branch</span>
				)}
			</div>
		</div>
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

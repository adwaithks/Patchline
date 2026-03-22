import * as React from "react";
import {
	Sidebar,
	SidebarContent,
	SidebarHeader,
	SidebarRail,
} from "@/components/ui/sidebar";
import { SidebarBranchBar } from "@/components/sidebar-branch-bar";
import { SidebarChanges } from "@/components/sidebar-changes";
import { useSidebarGit } from "@/context/sidebar-git-context";

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
	const { data, loading } = useSidebarGit();

	return (
		<Sidebar {...props}>
			<SidebarHeader className="electrobun-webkit-app-region-drag h-10 p-0" />
			<SidebarContent>
				<SidebarBranchBar loading={loading} branch={data?.branch} />
				{loading ? (
					<LoadingState />
				) : (
					<SidebarChanges changes={data?.changes ?? []} />
				)}
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

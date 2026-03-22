import * as React from "react";
import { ChevronDown } from "lucide-react";
import {
	Sidebar,
	SidebarContent,
	SidebarHeader,
	SidebarRail,
} from "@/components/ui/sidebar";
import {
	Collapsible,
	CollapsibleContent,
	CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { SidebarChanges } from "@/components/sidebar-changes";
import { useGitSnapshot } from "@/context/sidebar-git-context";
import { cn } from "@/lib/utils";

function folderLabel(absPath: string): string {
	const t = absPath.replace(/[/\\]+$/, "");
	const parts = t.split(/[/\\]/);
	return parts[parts.length - 1] ?? absPath;
}

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
	const { data, loading } = useGitSnapshot();

	return (
		<Sidebar {...props}>
			<SidebarHeader className="electrobun-webkit-app-region-drag h-10 shrink-0 border-b border-sidebar-border/50 p-0" />
			<SidebarContent>
				{loading ? (
					<LoadingState />
				) : (
					<div className="flex flex-col">
						{(data?.repos ?? []).map((repo) => (
							<Collapsible
								key={repo.root}
								defaultOpen
								className="group/collapsible border-b border-sidebar-border/40 last:border-b-0"
							>
								<CollapsibleTrigger
									type="button"
									aria-label={`Show or hide changes for ${folderLabel(repo.root)}`}
									className={cn(
										"flex w-full min-h-8 items-center gap-2 px-3 py-1.5",
										"rounded-none border-b border-sidebar-border/40 bg-sidebar-accent/45",
										"text-left outline-none electrobun-webkit-app-region-no-drag",
										"hover:bg-sidebar-accent/55 focus-visible:ring-2 focus-visible:ring-sidebar-ring",
									)}
								>
									<ChevronDown
										className="size-3.5 shrink-0 text-muted-foreground transition-transform duration-200 group-data-[state=open]/collapsible:rotate-180"
										aria-hidden
									/>
									<span
										className="min-w-0 flex-1 truncate font-mono text-[11px] font-normal text-sidebar-foreground/85"
										title={repo.root}
									>
										{folderLabel(repo.root)}
									</span>
									<span
										className="shrink-0 max-w-[45%] truncate rounded-md bg-sidebar/80 px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground"
										title={
											repo.branch.detached
												? `Detached at ${repo.branch.current}`
												: repo.branch.current
										}
									>
										{repo.branch.current}
									</span>
								</CollapsibleTrigger>
								<CollapsibleContent>
									<SidebarChanges
										repoRoot={repo.root}
										changes={repo.changes}
									/>
								</CollapsibleContent>
							</Collapsible>
						))}
					</div>
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

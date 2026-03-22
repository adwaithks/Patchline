import { Minus, Plus } from "lucide-react";
import {
	SidebarGroup,
	SidebarGroupContent,
	SidebarGroupLabel,
	SidebarMenu,
	SidebarMenuAction,
	SidebarMenuButton,
	SidebarMenuItem,
} from "@/components/ui/sidebar";
import { useSidebarGit } from "@/context/sidebar-git-context";
import { useWorkspace } from "@/context/workspace-context";
import { FileIcon } from "@/lib/file-icon";
import { cn } from "@/lib/utils";
import { getGeodesicRPC } from "@/lib/geodesic-rpc";
import type { DiffScope, FileChange } from "../../shared/types";

/** Porcelain `D` in either column — file deleted in index and/or worktree. */
function isDeletedChange(c: FileChange): boolean {
	return c.indexState === "D" || c.worktreeState === "D";
}

interface SidebarChangesProps {
	changes: FileChange[];
}

function splitPath(fullPath: string): { name: string; dir: string } {
	const parts = fullPath.split("/");
	return {
		name: parts[parts.length - 1],
		dir: parts.length > 1 ? parts.slice(0, -1).join("/") : "",
	};
}

function FileList({
	items,
	diffScope,
	actionIcon,
	actionTitle,
	onAction,
}: {
	items: FileChange[];
	diffScope: DiffScope;
	actionIcon: React.ReactNode;
	actionTitle: string;
	onAction: (f: FileChange) => void;
}) {
	const { selectedFile, selectFile } = useWorkspace();
	return (
		<SidebarMenu>
			{items.map((item) => {
				const { name, dir } = splitPath(item.path);
				const deleted = isDeletedChange(item);
				const strike = deleted ? "line-through" : "";
				return (
					<SidebarMenuItem key={`${item.path}-${diffScope}`}>
						<SidebarMenuButton
							className="pr-8 items-center"
							isActive={
								selectedFile?.path === item.path &&
								selectedFile?.diffScope === diffScope
							}
							onClick={() => selectFile({ ...item, diffScope })}
						>
							<FileIcon path={item.path} className="shrink-0" />
							<span
								className={cn(
									"truncate font-medium",
									strike,
									deleted && "text-muted-foreground",
								)}
							>
								{name}
							</span>
							{dir && (
								<span
									className={cn(
										"truncate text-[11px] text-muted-foreground/50 ml-1.5",
										strike,
									)}
								>
									{dir}
								</span>
							)}
						</SidebarMenuButton>
						<SidebarMenuAction
							title={actionTitle}
							className="right-1 opacity-0 group-hover/menu-item:opacity-100 transition-opacity"
							onClick={(e) => {
								e.stopPropagation();
								onAction(item);
							}}
						>
							{actionIcon}
						</SidebarMenuAction>
					</SidebarMenuItem>
				);
			})}
		</SidebarMenu>
	);
}

export function SidebarChanges({ changes }: SidebarChangesProps) {
	const { refresh } = useSidebarGit();

	async function stage(f: FileChange) {
		await getGeodesicRPC()?.request.stageFile({ filePath: f.path });
		refresh();
	}

	async function unstage(f: FileChange) {
		await getGeodesicRPC()?.request.unstageFile({ filePath: f.path });
		refresh();
	}

	// Staged: index column is non-space, non-?
	const staged = changes.filter(
		(c) => c.indexState !== " " && c.indexState !== "?",
	);

	// Unstaged: worktree has any change (includes untracked where both X=? Y=?)
	const unstaged = changes.filter((c) => c.worktreeState !== " ");

	if (changes.length === 0) {
		return (
			<SidebarGroup>
				<SidebarGroupContent>
					<p className="px-3 py-4 text-xs text-muted-foreground">
						No changes detected.
					</p>
				</SidebarGroupContent>
			</SidebarGroup>
		);
	}

	return (
		<>
			{staged.length > 0 && (
				<SidebarGroup>
					<SidebarGroupLabel className="text-[10px] uppercase tracking-wider text-muted-foreground/60 px-3 py-1">
						Staged
					</SidebarGroupLabel>
					<SidebarGroupContent>
						<FileList
							items={staged}
							diffScope="staged"
							actionIcon={<Minus className="size-3" />}
							actionTitle="Unstage"
							onAction={unstage}
						/>
					</SidebarGroupContent>
				</SidebarGroup>
			)}
			{unstaged.length > 0 && (
				<SidebarGroup>
					<SidebarGroupLabel className="text-[10px] uppercase tracking-wider text-muted-foreground/60 px-3 py-1">
						Changes
					</SidebarGroupLabel>
					<SidebarGroupContent>
						<FileList
							items={unstaged}
							diffScope="unstaged"
							actionIcon={<Plus className="size-3" />}
							actionTitle="Stage"
							onAction={stage}
						/>
					</SidebarGroupContent>
				</SidebarGroup>
			)}
		</>
	);
}

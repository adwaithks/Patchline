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
import { useProject } from "@/context/project-context";
import { FileIcon } from "@/lib/file-icon";
import type { FileChange } from "../../shared/types";

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
	actionIcon,
	actionTitle,
	onAction,
}: {
	items: FileChange[];
	actionIcon: React.ReactNode;
	actionTitle: string;
	onAction: (f: FileChange) => void;
}) {
	const { selectedFile, selectFile } = useProject();
	return (
		<SidebarMenu>
			{items.map((item) => {
				const { name, dir } = splitPath(item.path);
				return (
					<SidebarMenuItem key={item.path}>
						<SidebarMenuButton
							className="pr-8 items-center"
							isActive={selectedFile?.path === item.path}
							onClick={() => selectFile(item)}
						>
							<FileIcon path={item.path} className="shrink-0" />
							<span className="truncate font-medium">{name}</span>
							{dir && (
								<span className="truncate text-[11px] text-muted-foreground/50 ml-1.5">
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
	const { refresh } = useProject();

	const rpc = () => (window as any).__geodesicRPC;

	async function stage(f: FileChange) {
		await rpc()?.request.stageFile({ filePath: f.path });
		refresh();
	}

	async function unstage(f: FileChange) {
		await rpc()?.request.unstageFile({ filePath: f.path });
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

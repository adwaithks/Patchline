import { useState, type FormEvent } from "react";
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
import { Button } from "@/components/ui/button";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useSidebarGit } from "@/context/sidebar-git-context";
import { useWorkspace } from "@/context/workspace-context";
import { FileIcon } from "@/lib/file-icon";
import { cn } from "@/lib/utils";
import { getPatchlineRPC } from "@/lib/patchline-rpc";
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
	const { selectFile } = useWorkspace();
	const [commitOpen, setCommitOpen] = useState(false);
	const [commitTitle, setCommitTitle] = useState("");
	const [commitDescription, setCommitDescription] = useState("");
	const [committing, setCommitting] = useState(false);

	async function stage(f: FileChange) {
		await getPatchlineRPC()?.request.stageFile({ filePath: f.path });
		refresh();
	}

	async function unstage(f: FileChange) {
		await getPatchlineRPC()?.request.unstageFile({ filePath: f.path });
		refresh();
	}

	async function stageAll() {
		await getPatchlineRPC()?.request.stageAll();
		refresh();
	}

	async function unstageAll() {
		await getPatchlineRPC()?.request.unstageAll();
		refresh();
	}

	async function handleCommitSubmit(e: FormEvent) {
		e.preventDefault();
		const title = commitTitle.trim();
		if (!title) return;
		setCommitting(true);
		try {
			const res = await getPatchlineRPC()?.request.commit({
				title,
				description: commitDescription,
			});
			if (res?.ok) {
				setCommitOpen(false);
				setCommitTitle("");
				setCommitDescription("");
				selectFile(null);
				refresh();
			}
		} finally {
			setCommitting(false);
		}
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
				<>
					<SidebarGroup>
						<SidebarGroupLabel className="flex flex-row items-center justify-between gap-2 pr-2 text-[10px] uppercase tracking-wider text-muted-foreground/60 px-3 py-1">
							<span className="min-w-0 truncate">Staged</span>
							<div className="flex shrink-0 items-center gap-0.5">
								<Button
									type="button"
									variant="ghost"
									size="sm"
									className="electrobun-webkit-app-region-no-drag h-7 px-2 text-[10px] uppercase tracking-wider text-muted-foreground hover:bg-sidebar-accent hover:text-sidebar-foreground"
									onClick={() => setCommitOpen(true)}
								>
									Commit
								</Button>
								<button
									type="button"
									title="Unstage all"
									className="electrobun-webkit-app-region-no-drag flex size-6 shrink-0 items-center justify-center rounded-md text-muted-foreground hover:bg-sidebar-accent hover:text-sidebar-foreground"
									onClick={(e) => {
										e.preventDefault();
										void unstageAll();
									}}
								>
									<Minus className="size-3.5" />
								</button>
							</div>
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
					<Dialog
						open={commitOpen}
						onOpenChange={(open) => {
							setCommitOpen(open);
							if (!open) {
								setCommitTitle("");
								setCommitDescription("");
							}
						}}
					>
						<DialogContent className="electrobun-webkit-app-region-no-drag sm:max-w-lg sm:rounded-xl">
							<form onSubmit={handleCommitSubmit}>
								<DialogHeader>
									<DialogTitle>Commit</DialogTitle>
									<DialogDescription>
										Enter a title and optional description for this commit.
									</DialogDescription>
								</DialogHeader>
								<div className="grid gap-4 py-4">
									<div className="grid gap-2">
										<Label htmlFor="commit-title">Title</Label>
										<Input
											id="commit-title"
											value={commitTitle}
											onChange={(ev) => setCommitTitle(ev.target.value)}
											placeholder="Short summary"
											autoFocus
											disabled={committing}
										/>
									</div>
									<div className="grid gap-2">
										<Label htmlFor="commit-description">Description</Label>
										<Textarea
											id="commit-description"
											value={commitDescription}
											onChange={(ev) =>
												setCommitDescription(ev.target.value)
											}
											placeholder="Optional body"
											disabled={committing}
											rows={4}
										/>
									</div>
								</div>
								<DialogFooter>
									<Button
										type="button"
										variant="outline"
										onClick={() => setCommitOpen(false)}
										disabled={committing}
									>
										Cancel
									</Button>
									<Button
										type="submit"
										disabled={!commitTitle.trim() || committing}
									>
										{committing ? "Committing…" : "Commit"}
									</Button>
								</DialogFooter>
							</form>
						</DialogContent>
					</Dialog>
				</>
			)}
			{unstaged.length > 0 && (
				<SidebarGroup>
					<SidebarGroupLabel className="flex flex-row items-center justify-between gap-2 pr-2 text-[10px] uppercase tracking-wider text-muted-foreground/60 px-3 py-1">
						<span>Changes</span>
						<button
							type="button"
							title="Stage all"
							className="electrobun-webkit-app-region-no-drag flex size-6 shrink-0 items-center justify-center rounded-md text-muted-foreground hover:bg-sidebar-accent hover:text-sidebar-foreground"
							onClick={(e) => {
								e.preventDefault();
								void stageAll();
							}}
						>
							<Plus className="size-3.5" />
						</button>
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

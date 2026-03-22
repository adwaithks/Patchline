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
	repoRoot: string;
	changes: FileChange[];
}

function fileBaseName(fullPath: string): string {
	const parts = fullPath.split("/");
	return parts[parts.length - 1] ?? fullPath;
}

function FileList({
	repoRoot,
	items,
	diffScope,
	actionIcon,
	actionTitle,
	onAction,
}: {
	repoRoot: string;
	items: FileChange[];
	diffScope: DiffScope;
	actionIcon: React.ReactNode;
	actionTitle: string;
	onAction: (f: FileChange) => void;
}) {
	const { selectedFile, selectFile } = useWorkspace();
	return (
		<SidebarMenu className="gap-[0.5px]">
			{items.map((item) => {
				const name = fileBaseName(item.path);
				const deleted = isDeletedChange(item);
				return (
					<SidebarMenuItem
						key={`${repoRoot}-${item.path}-${diffScope}`}
					>
						<SidebarMenuButton
							size="sm"
							className={cn(
								"h-6 min-h-6 gap-1.5 px-1.5 py-0 pr-8 text-[12px] leading-tight [&>svg]:!size-3",
								deleted &&
									"text-rose-300/90 hover:text-rose-200/95 active:text-rose-200/95 data-[active=true]:text-rose-200",
							)}
							title={item.path}
							isActive={
								selectedFile?.repoRoot === repoRoot &&
								selectedFile?.path === item.path &&
								selectedFile?.diffScope === diffScope
							}
							onClick={() =>
								selectFile({ ...item, diffScope, repoRoot })
							}
						>
							<FileIcon
								path={item.path}
								className={
									deleted ? "[&_svg]:opacity-90" : undefined
								}
							/>
							<span
								className={cn(
									"truncate",
									deleted && "line-through",
								)}
							>
								{name}
							</span>
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

export function SidebarChanges({ repoRoot, changes }: SidebarChangesProps) {
	const { refresh } = useSidebarGit();
	const { selectFile } = useWorkspace();
	const [commitOpen, setCommitOpen] = useState(false);
	const [commitTitle, setCommitTitle] = useState("");
	const [commitDescription, setCommitDescription] = useState("");
	const [committing, setCommitting] = useState(false);

	async function stage(f: FileChange) {
		await getPatchlineRPC()?.request.stageFile({
			repoRoot,
			filePath: f.path,
		});
		refresh();
	}

	async function unstage(f: FileChange) {
		await getPatchlineRPC()?.request.unstageFile({
			repoRoot,
			filePath: f.path,
		});
		refresh();
	}

	async function stageAll() {
		await getPatchlineRPC()?.request.stageAll({ repoRoot });
		refresh();
	}

	async function unstageAll() {
		await getPatchlineRPC()?.request.unstageAll({ repoRoot });
		refresh();
	}

	async function handleCommitSubmit(e: FormEvent) {
		e.preventDefault();
		const title = commitTitle.trim();
		if (!title) return;
		setCommitting(true);
		try {
			const res = await getPatchlineRPC()?.request.commit({
				repoRoot,
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

	const staged = changes.filter(
		(c) => c.indexState !== " " && c.indexState !== "?",
	);

	const unstaged = changes.filter((c) => c.worktreeState !== " ");

	if (changes.length === 0) {
		return (
			<SidebarGroup className="px-2 py-0">
				<SidebarGroupContent>
					<p className="px-1.5 py-3 text-xs text-muted-foreground">
						No changes.
					</p>
				</SidebarGroupContent>
			</SidebarGroup>
		);
	}

	return (
		<>
			{staged.length > 0 && (
				<>
					<SidebarGroup className="px-2 py-0">
						<SidebarGroupLabel className="flex h-auto min-h-0 flex-row items-center justify-between gap-2 px-1.5 py-0.5 text-[10px] uppercase tracking-wider text-muted-foreground/60">
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
								repoRoot={repoRoot}
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
										Enter a title and optional description
										for this commit.
									</DialogDescription>
								</DialogHeader>
								<div className="grid gap-4 py-4">
									<div className="grid gap-2">
										<Label htmlFor="commit-title">
											Title
										</Label>
										<Input
											id="commit-title"
											value={commitTitle}
											onChange={(ev) =>
												setCommitTitle(ev.target.value)
											}
											placeholder="Short summary"
											autoFocus
											disabled={committing}
										/>
									</div>
									<div className="grid gap-2">
										<Label htmlFor="commit-description">
											Description
										</Label>
										<Textarea
											id="commit-description"
											value={commitDescription}
											onChange={(ev) =>
												setCommitDescription(
													ev.target.value,
												)
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
										disabled={
											!commitTitle.trim() || committing
										}
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
				<SidebarGroup className="px-2 py-0">
					<SidebarGroupLabel className="flex h-auto min-h-0 flex-row items-center justify-between gap-2 px-1.5 py-0.5 text-[10px] uppercase tracking-wider text-muted-foreground/60">
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
							repoRoot={repoRoot}
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

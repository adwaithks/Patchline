import { useEffect, useState } from "react";
import { DiffView, DiffModeEnum } from "@git-diff-view/react";
import "@git-diff-view/react/styles/diff-view-pure.css";
import type { DiffLayoutMode } from "@/types/diff-layout";
import { getPatchlineRPC } from "@/lib/patchline-rpc";
import type { FileDiff, SelectedFileChange } from "../../shared/types";

const LOG = "[patchline:webview]";

interface DiffViewerProps {
	file: SelectedFileChange;
	layout: DiffLayoutMode;
}

export function DiffViewer({ file, layout }: DiffViewerProps) {
	const [diffData, setDiffData] = useState<FileDiff | null>(null);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);

	useEffect(() => {
		console.log(`${LOG} DiffViewer: effect for file`, {
			path: file.path,
			diffScope: file.diffScope,
		});
		setLoading(true);
		setError(null);
		setDiffData(null);

		async function load() {
			try {
				const rpc = getPatchlineRPC();
				if (!rpc) {
					console.warn(`${LOG} DiffViewer: __patchlineRPC missing`);
					setError("RPC not available");
					return;
				}
				console.log(`${LOG} DiffViewer: rpc.request.getFileDiff`, {
					filePath: file.path,
					diffScope: file.diffScope,
				});
				const t0 = performance.now();
				const result: FileDiff = await rpc.request.getFileDiff({
					filePath: file.path,
					diffScope: file.diffScope,
				});
				const ms = Math.round(performance.now() - t0);
				console.log(`${LOG} DiffViewer: getFileDiff response`, {
					ms,
					oldContentLen: result.oldContent?.length ?? 0,
					newContentLen: result.newContent?.length ?? 0,
					hunksLen: result.hunks?.length ?? 0,
					hunksPreview: result.hunks?.slice(0, 120) ?? "",
				});
				setDiffData(result);
			} catch (e) {
				console.error(`${LOG} DiffViewer: getFileDiff failed`, e);
				setError(
					e instanceof Error ? e.message : "Failed to load diff",
				);
			} finally {
				setLoading(false);
				console.log(`${LOG} DiffViewer: load finished`);
			}
		}

		load();
	}, [file.path, file.diffScope]);

	if (loading) {
		return (
			<div className="flex flex-1 items-center justify-center text-muted-foreground text-sm">
				Loading diff…
			</div>
		);
	}

	if (error) {
		return (
			<div className="flex flex-1 items-center justify-center text-destructive text-sm">
				{error}
			</div>
		);
	}

	if (!diffData) return null;

	// A diff with no @@ hunks means the file is empty or binary — nothing to render
	const hasHunks = diffData.hunks.includes("@@");
	if (!hasHunks) {
		const isUntracked =
			file.indexState === "?" && file.worktreeState === "?";
		return (
			<div className="flex flex-1 items-center justify-center text-muted-foreground text-sm">
				{isUntracked ? "New empty file" : "No changes"}
			</div>
		);
	}

	const fileName = file.path.split("/").pop() ?? file.path;
	const diffViewMode =
		layout === "unified" ? DiffModeEnum.Unified : DiffModeEnum.Split;

	return (
		<div className="flex-1 overflow-auto" style={{ fontSize: 13 }}>
			<DiffView
				key={`${file.path}-${layout}`}
				data={{
					oldFile: {
						fileName,
						// null signals "no old file" (new/untracked) to the diff library
						content: diffData.oldContent || null,
					},
					newFile: {
						fileName,
						content: diffData.newContent || null,
					},
					hunks: diffData.hunks ? [diffData.hunks] : [],
				}}
				diffViewMode={diffViewMode}
				diffViewTheme="dark"
				diffViewHighlight
				diffViewWrap
				diffViewFontSize={14}
			/>
		</div>
	);
}

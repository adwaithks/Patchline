import { useEffect, useState } from "react";
import { DiffView, DiffModeEnum } from "@git-diff-view/react";
import "@git-diff-view/react/styles/diff-view-pure.css";
import type { DiffLayoutMode } from "@/types/diff-layout";
import type { FileChange, FileDiff } from "../../shared/types";

const LOG = "[geodesic:webview]";

interface DiffViewerProps {
	file: FileChange;
	layout: DiffLayoutMode;
}

export function DiffViewer({ file, layout }: DiffViewerProps) {
	const [diffData, setDiffData] = useState<FileDiff | null>(null);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);

	useEffect(() => {
		console.log(`${LOG} DiffViewer: effect for file`, {
			path: file.path,
			state: file.state,
		});
		setLoading(true);
		setError(null);
		setDiffData(null);

		async function load() {
			try {
				const rpc = (window as any).__geodesicRPC;
				if (!rpc) {
					console.warn(`${LOG} DiffViewer: __geodesicRPC missing`);
					setError("RPC not available");
					return;
				}
				console.log(`${LOG} DiffViewer: rpc.request.getFileDiff`, {
					filePath: file.path,
				});
				const t0 = performance.now();
				const result: FileDiff = await rpc.request.getFileDiff({
					filePath: file.path,
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
	}, [file.path]);

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
						content: diffData.oldContent,
					},
					newFile: {
						fileName,
						content: diffData.newContent,
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

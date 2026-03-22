import { useState } from "react";
import { FolderOpen } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getPatchlineRPC } from "@/lib/patchline-rpc";

type OpenProjectScreenProps = {
	onOpened: () => void | Promise<void>;
	gitLoadError: string | null;
};

export function OpenProjectScreen({
	onOpened,
	gitLoadError,
}: OpenProjectScreenProps) {
	const [busy, setBusy] = useState(false);
	const [pickError, setPickError] = useState<string | null>(null);

	async function handleOpenProject() {
		const rpc = getPatchlineRPC();
		if (!rpc) return;
		setBusy(true);
		setPickError(null);
		try {
			const res = await rpc.request.openProjectFolder();
			if (res.ok && res.path) {
				await onOpened();
			} else if (res.error) {
				setPickError(res.error);
			}
		} finally {
			setBusy(false);
		}
	}

	const banner = pickError ?? gitLoadError;

	return (
		<div className="flex flex-1 flex-col items-center justify-center gap-6 px-6 py-12 electrobun-webkit-app-region-drag">
			<div className="flex max-w-md flex-col items-center gap-3 text-center electrobun-webkit-app-region-no-drag">
				<div className="flex size-14 items-center justify-center rounded-2xl border border-zinc-800 bg-zinc-900/60 shadow-sm">
					<FolderOpen className="size-7 text-zinc-400" strokeWidth={1.5} />
				</div>
				<h1 className="text-lg font-semibold tracking-tight text-zinc-100">
					Open a project
				</h1>
				<p className="text-sm leading-relaxed text-zinc-500">
					Choose a folder that contains a Git repository. You can also launch
					Patchline with{" "}
					<code className="rounded bg-zinc-900 px-1.5 py-0.5 font-mono text-[11px] text-zinc-400">
						PATCHLINE_SOURCE=/path/to/repo
					</code>{" "}
					to skip this step.
				</p>
				{banner ? (
					<p className="w-full rounded-lg border border-red-500/25 bg-red-500/10 px-3 py-2 text-left text-xs text-red-200/90">
						{banner}
					</p>
				) : null}
				<Button
					type="button"
					size="lg"
					className="mt-1 min-w-[11rem] font-medium"
					disabled={busy}
					onClick={() => void handleOpenProject()}
				>
					{busy ? "Opening…" : "Choose folder…"}
				</Button>
			</div>
		</div>
	);
}

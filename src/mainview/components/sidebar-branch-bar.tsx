import { GitBranch } from "lucide-react";
import type { BranchInfo } from "../../shared/types";

const barShell =
	"mx-2 mb-2 mt-1 rounded-lg border border-zinc-800/50 bg-zinc-900/45 px-2.5 py-2 shadow-sm";

type SidebarBranchBarProps = {
	loading: boolean;
	branch: BranchInfo | undefined;
};

export function SidebarBranchBar({ loading, branch }: SidebarBranchBarProps) {
	if (loading) {
		return (
			<div className={barShell}>
				<div className="space-y-1.5">
					<div className="h-3.5 w-[7.5rem] animate-pulse rounded bg-zinc-800/80" />
					<div className="h-3 w-[9rem] animate-pulse rounded bg-zinc-800/60" />
				</div>
			</div>
		);
	}

	if (!branch) return null;

	return (
		<div className={barShell}>
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
					<span className="shrink-0 rounded bg-zinc-800/90 px-1 py-px text-[9px] font-medium uppercase tracking-wide text-zinc-400">
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

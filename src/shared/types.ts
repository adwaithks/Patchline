import type { RPCSchema } from "electrobun/bun";

export type FileChange = {
	path: string;
	state: "M" | "U" | "A" | "D" | "R" | "?";
};

// Recursive tree node: either a file (string) or a folder ([name, ...children])
export type TreeNode = string | [string, ...TreeNode[]];

export type GeodesicRPCType = {
	bun: RPCSchema<{
		requests: {
			getProjectData: {
				params: void;
				response: {
					sourcePath: string;
					tree: TreeNode[];
					changes: FileChange[];
				};
			};
		};
		messages: Record<never, never>;
	}>;
	webview: RPCSchema<{
		requests: Record<never, never>;
		messages: Record<never, never>;
	}>;
};

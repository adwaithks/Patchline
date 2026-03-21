import { ChevronRight, Folder } from "lucide-react";
import {
	Collapsible,
	CollapsibleContent,
	CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
	SidebarGroup,
	SidebarGroupContent,
	SidebarMenu,
	SidebarMenuButton,
	SidebarMenuItem,
	SidebarMenuSub,
} from "@/components/ui/sidebar";
import { FileIcon } from "@/lib/file-icon";
import type { TreeNode } from "../../shared/types";

interface SidebarFileTreeProps {
	tree: TreeNode[];
}

export function SidebarFileTree({ tree }: SidebarFileTreeProps) {
	if (tree.length === 0) {
		return (
			<SidebarGroup>
				<SidebarGroupContent>
					<p className="px-3 py-4 text-xs text-muted-foreground">
						No files found.
					</p>
				</SidebarGroupContent>
			</SidebarGroup>
		);
	}

	return (
		<SidebarGroup>
			<SidebarGroupContent>
				<SidebarMenu>
					{tree.map((item, index) => (
						<FileTreeNode key={index} node={item} />
					))}
				</SidebarMenu>
			</SidebarGroupContent>
		</SidebarGroup>
	);
}

function FileTreeNode({ node }: { node: TreeNode }) {
	if (node.type === "file") {
		return (
			<SidebarMenuButton className="data-[active=true]:bg-transparent">
				<FileIcon path={node.name} />
				<span className="truncate">{node.name}</span>
			</SidebarMenuButton>
		);
	}

	return (
		<SidebarMenuItem>
			<Collapsible className="group/collapsible [&[data-state=open]>button>svg:first-child]:rotate-90">
				<CollapsibleTrigger asChild>
					<SidebarMenuButton>
						<ChevronRight className="transition-transform" />
						<Folder />
						<span className="truncate">{node.name}</span>
					</SidebarMenuButton>
				</CollapsibleTrigger>
				<CollapsibleContent>
					<SidebarMenuSub>
						{node.children.map((child, index) => (
							<FileTreeNode key={index} node={child} />
						))}
					</SidebarMenuSub>
				</CollapsibleContent>
			</Collapsible>
		</SidebarMenuItem>
	);
}

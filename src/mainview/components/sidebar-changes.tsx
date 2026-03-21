import { File } from "lucide-react";
import {
	SidebarGroup,
	SidebarGroupContent,
	SidebarMenu,
	SidebarMenuBadge,
	SidebarMenuButton,
	SidebarMenuItem,
} from "@/components/ui/sidebar";
import { useProject } from "@/context/project-context";
import type { FileChange } from "../../shared/types";

interface SidebarChangesProps {
	changes: FileChange[];
}

export function SidebarChanges({ changes }: SidebarChangesProps) {
	const { selectedFile, selectFile } = useProject();

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
		<SidebarGroup>
			<SidebarGroupContent>
				<SidebarMenu>
					{changes.map((item, index) => (
						<SidebarMenuItem key={index}>
							<SidebarMenuButton
								className="pr-10"
								isActive={selectedFile?.path === item.path}
								onClick={() => selectFile(item)}
							>
								<File />
								<span className="truncate">{item.path}</span>
							</SidebarMenuButton>
							<SidebarMenuBadge className="right-2">{item.state}</SidebarMenuBadge>
						</SidebarMenuItem>
					))}
				</SidebarMenu>
			</SidebarGroupContent>
		</SidebarGroup>
	);
}

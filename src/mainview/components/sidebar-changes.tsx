import { File } from "lucide-react";
import {
	SidebarGroup,
	SidebarGroupContent,
	SidebarMenu,
	SidebarMenuBadge,
	SidebarMenuButton,
	SidebarMenuItem,
} from "@/components/ui/sidebar";
import type { FileChange } from "../../shared/types";

interface SidebarChangesProps {
	changes: FileChange[];
}

export function SidebarChanges({ changes }: SidebarChangesProps) {
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
							<SidebarMenuButton className="pr-6">
								<File />
								<span className="truncate">{item.path}</span>
							</SidebarMenuButton>
							<SidebarMenuBadge>{item.state}</SidebarMenuBadge>
						</SidebarMenuItem>
					))}
				</SidebarMenu>
			</SidebarGroupContent>
		</SidebarGroup>
	);
}

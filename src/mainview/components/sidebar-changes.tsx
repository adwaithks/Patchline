import { File } from "lucide-react";
import {
	SidebarGroup,
	SidebarGroupContent,
	SidebarMenu,
	SidebarMenuBadge,
	SidebarMenuButton,
	SidebarMenuItem,
} from "@/components/ui/sidebar";

const changes = [
	{ file: "README.md", state: "M" },
	{ file: "api/hello/route.ts", state: "U" },
	{ file: "app/layout.tsx", state: "M" },
];

export function SidebarChanges() {
	return (
		<SidebarGroup>
			<SidebarGroupContent>
				<SidebarMenu>
					{changes.map((item, index) => (
						<SidebarMenuItem key={index}>
							<SidebarMenuButton>
								<File />
								{item.file}
							</SidebarMenuButton>
							<SidebarMenuBadge>{item.state}</SidebarMenuBadge>
						</SidebarMenuItem>
					))}
				</SidebarMenu>
			</SidebarGroupContent>
		</SidebarGroup>
	);
}

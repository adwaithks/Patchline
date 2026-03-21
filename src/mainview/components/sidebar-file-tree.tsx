import { ChevronRight, File, Folder } from "lucide-react";
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

const tree = [
	[
		"app",
		[
			"api",
			["hello", ["route.ts"]],
			"page.tsx",
			"layout.tsx",
			["blog", ["page.tsx"]],
		],
	],
	[
		"components",
		["ui", "button.tsx", "card.tsx"],
		"header.tsx",
		"footer.tsx",
	],
	["lib", ["util.ts"]],
	["public", "favicon.ico", "vercel.svg"],
	".eslintrc.json",
	".gitignore",
	"next.config.js",
	"tailwind.config.js",
	"package.json",
	"README.md",
];

export function SidebarFileTree() {
	return (
		<SidebarGroup>
			<SidebarGroupContent>
				<SidebarMenu>
					{tree.map((item, index) => (
						<TreeNode key={index} item={item} />
					))}
				</SidebarMenu>
			</SidebarGroupContent>
		</SidebarGroup>
	);
}

function TreeNode({ item }: { item: string | any[] }) {
	const [name, ...items] = Array.isArray(item) ? item : [item];

	if (!items.length) {
		return (
			<SidebarMenuButton className="data-[active=true]:bg-transparent">
				<File />
				{name}
			</SidebarMenuButton>
		);
	}

	return (
		<SidebarMenuItem>
			<Collapsible
				className="group/collapsible [&[data-state=open]>button>svg:first-child]:rotate-90"
				defaultOpen={name === "components" || name === "ui"}
			>
				<CollapsibleTrigger asChild>
					<SidebarMenuButton>
						<ChevronRight className="transition-transform" />
						<Folder />
						{name}
					</SidebarMenuButton>
				</CollapsibleTrigger>
				<CollapsibleContent>
					<SidebarMenuSub>
						{items.map((subItem, index) => (
							<TreeNode key={index} item={subItem} />
						))}
					</SidebarMenuSub>
				</CollapsibleContent>
			</Collapsible>
		</SidebarMenuItem>
	);
}

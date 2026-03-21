import {
	Code, // ts, js
} from "lucide-react";
import { cn } from "@/lib/utils";

export function FileIcon({
	path,
	className,
}: {
	path: string;
	className?: string;
}) {
	return <Code className={cn("size-4 shrink-0", className)} aria-hidden />;
}

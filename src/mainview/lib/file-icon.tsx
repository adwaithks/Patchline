import type { ReactElement } from "react";
import { Code, Terminal } from "lucide-react";
import type { IconType } from "react-icons";
import {
	SiApachegroovy,
	SiApple,
	SiBun,
	SiC,
	SiClojure,
	SiCmake,
	SiCoffeescript,
	SiCommonlisp,
	SiCplusplus,
	SiCss,
	SiDart,
	SiDocker,
	SiDotnet,
	SiElixir,
	SiFsharp,
	SiGnubash,
	SiGo,
	SiGradle,
	SiGraphql,
	SiHaskell,
	SiHtml5,
	SiJavascript,
	SiJson,
	SiKotlin,
	SiLess,
	SiLua,
	SiMake,
	SiMarkdown,
	SiNim,
	SiNpm,
	SiOpenjdk,
	SiPerl,
	SiPhp,
	SiPostgresql,
	SiPrisma,
	SiPython,
	SiR,
	SiReact,
	SiReadme,
	SiRuby,
	SiRust,
	SiSass,
	SiScala,
	SiSvelte,
	SiSwift,
	SiTerraform,
	SiToml,
	SiTypescript,
	SiVim,
	SiVuedotjs,
	SiXml,
	SiYaml,
	SiZig,
} from "react-icons/si";
import { cn } from "@/lib/utils";

function fileBasename(path: string): string {
	return (path.split(/[/\\]/).pop() ?? "").toLowerCase();
}

function fileExtension(path: string): string {
	const base = fileBasename(path);
	const dot = base.lastIndexOf(".");
	return dot >= 0 ? base.slice(dot + 1).toLowerCase() : "";
}

const BUN_BASENAMES = new Set(["bun.lock", "bun.lockb", "bunfig.toml"]);

function isDockerfileBasename(base: string): boolean {
	return base === "dockerfile" || base.startsWith("dockerfile.");
}

/** Exact basename → brand icon (lowercase basename). */
const BRAND_BY_BASENAME: Record<string, IconType> = {
	"readme.md": SiReadme,
	"cmakelists.txt": SiCmake,
	makefile: SiMake,
	"go.mod": SiGo,
	"cargo.toml": SiRust,
	"package.json": SiNpm,
	"package-lock.json": SiNpm,
	"tsconfig.json": SiTypescript,
	"jsconfig.json": SiTypescript,
	"docker-compose.yml": SiDocker,
	"docker-compose.yaml": SiDocker,
};

const BRAND_BY_EXT: Record<string, IconType> = {
	py: SiPython,
	js: SiJavascript,
	mjs: SiJavascript,
	cjs: SiJavascript,
	ts: SiTypescript,
	tsx: SiReact,
	jsx: SiReact,
	html: SiHtml5,
	htm: SiHtml5,
	css: SiCss,
	scss: SiSass,
	sass: SiSass,
	less: SiLess,
	json: SiJson,
	md: SiMarkdown,
	mdx: SiMarkdown,
	rs: SiRust,
	go: SiGo,
	java: SiOpenjdk,
	c: SiC,
	h: SiC,
	cpp: SiCplusplus,
	cc: SiCplusplus,
	cxx: SiCplusplus,
	hpp: SiCplusplus,
	cs: SiDotnet,
	php: SiPhp,
	rb: SiRuby,
	swift: SiSwift,
	kt: SiKotlin,
	kts: SiKotlin,
	scala: SiScala,
	sh: SiGnubash,
	bash: SiGnubash,
	zsh: SiGnubash,
	sql: SiPostgresql,
	yaml: SiYaml,
	yml: SiYaml,
	toml: SiToml,
	xml: SiXml,
	vue: SiVuedotjs,
	svelte: SiSvelte,
	zig: SiZig,
	dart: SiDart,
	lua: SiLua,
	r: SiR,
	pl: SiPerl,
	pm: SiPerl,
	ex: SiElixir,
	exs: SiElixir,
	hs: SiHaskell,
	clj: SiClojure,
	edn: SiClojure,
	nim: SiNim,
	fs: SiFsharp,
	fsx: SiFsharp,
	fsproj: SiFsharp,
	m: SiApple,
	groovy: SiApachegroovy,
	gradle: SiGradle,
	tf: SiTerraform,
	tfvars: SiTerraform,
	graphql: SiGraphql,
	gql: SiGraphql,
	prisma: SiPrisma,
	vim: SiVim,
	coffee: SiCoffeescript,
	cl: SiCommonlisp,
	lisp: SiCommonlisp,
};

/** `!size-3` wins over `SidebarMenuButton`’s `[&>svg]:size-4` */
const baseIconClass = (className?: string) =>
	cn("!size-3 shrink-0", className);

function renderLucide(
	Icon: typeof Code,
	className?: string,
): ReactElement {
	const cls = baseIconClass(className);
	return <Icon className={cls} aria-hidden />;
}

export function FileIcon({
	path,
	className,
}: {
	path: string;
	className?: string;
}) {
	const base = fileBasename(path);
	const cls = baseIconClass(className);

	if (BUN_BASENAMES.has(base)) {
		return <SiBun className={cls} aria-hidden />;
	}

	if (isDockerfileBasename(base)) {
		return <SiDocker className={cls} aria-hidden />;
	}

	const byBase = BRAND_BY_BASENAME[base];
	if (byBase) {
		const Icon = byBase;
		return <Icon className={cls} aria-hidden />;
	}

	const ext = fileExtension(path);
	const byExt = BRAND_BY_EXT[ext];
	if (byExt) {
		const Icon = byExt;
		return <Icon className={cls} aria-hidden />;
	}

	if (ext === "ps1" || ext === "bat" || ext === "cmd") {
		return renderLucide(Terminal, className);
	}

	return renderLucide(Code, className);
}

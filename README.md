<div align="center">

# Patchline

### *Patches, line diffs, and commits — a lightweight window built for reading source changes.*

[![Bun](https://img.shields.io/badge/Bun-14151A?style=for-the-badge&logo=bun&logoColor=fff)](https://bun.sh)
[![React](https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)](https://react.dev)
[![Electrobun](https://img.shields.io/badge/Electrobun-5B4FFF?style=for-the-badge)](https://blackboard.sh/electrobun/)
[![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-0F172A?style=for-the-badge&logo=tailwindcss&logoColor=38BDF8)](https://tailwindcss.com)

<br />

**Native window · Local-first · Git at the speed of Bun**

[The problem](#the-problem) · [Scope](#scope) · [Supported](#supported-today) · [Incoming](#incoming--not-yet) · [Quick start](#quick-start) · [Development](#development) · [Build](#production-build) · [Layout](#repository-layout)

</div>

---

<br />

## The problem

Day-to-day coding often splits across **agents** (e.g. Claude Code) and **editors** (e.g. Cursor). Agent UIs are great for iteration, but **built-in diffs are usually not** — hard to scan, easy to miss hunks, and not where you want to live when you’re **reviewing** changes carefully.

**Patchline** exists because **review deserves its own surface**: a **small, fast, native window** whose only job is to show **what changed** (patch by patch, line by line), let you **stage** and **commit** with confidence, and stay out of the way of your IDE.

If you want a **quick, lightweight code diff** tool — not another full Git GUI — this is it.

---

## Scope

| | |
| :--- | :--- |
| **One project** | One repository path per launch (`PATCHLINE_SOURCE` — `GEODESIC_SOURCE` still works for older scripts). |
| **No worktrees yet** | [Git worktrees](https://git-scm.com/docs/git-worktree) are **not** supported; use a normal clone checkout. |

---

## Supported today

| Area | What works |
|--------|------------|
| **Repository** | Single open repo via `PATCHLINE_SOURCE` (or legacy `GEODESIC_SOURCE`) |
| **Changes** | Staged vs unstaged lists from `git status --porcelain` |
| **Diffs** | Per-file diff with **unified** or **split** layout ([`@git-diff-view`](https://github.com/MrWangJustToSay/git-diff-view)) |
| **Staging** | Stage / unstage one file; **stage all** / **unstage all** |
| **Commit** | **Title + description** (subject + body), then refresh |
| **Branch** | Current branch and **upstream** (`@{u}`) |
| **Platform** | macOS-oriented Electrobun app; dev + canary build pipeline |

---

## Incoming / not yet

| | |
| :--- | :--- |
| **Git worktrees** | Opening or switching worktrees inside the app |
| **Multiple projects** | In-app project picker / several roots without restart |
| **Broader Git** | Push, pull, merge, rebase, branches UI, remote management, etc. |
| **File tree / editor** | Full repo browser and in-app editing were intentionally trimmed for v1 |

*Roadmap is informal — PRs welcome for the gaps you care about.*

---

## Why Patchline? (technical)

| | |
| :--- | :--- |
| **Main process** | [Bun](https://bun.sh) + [Electrobun](https://blackboard.sh/electrobun/) — native window, Git via [simple-git](https://github.com/steveukx/git-js) |
| **UI** | [React](https://react.dev) + [Tailwind CSS](https://tailwindcss.com) + shadcn-style components |
| **Dev UX** | [Vite](https://vitejs.dev) HMR for instant UI feedback while you iterate |

---

## Quick start

**Prerequisites:** [Bun](https://bun.sh) installed.

```bash
git clone <repo-url>
cd patchline
bun install
```

Point the app at a repository on your machine:

```bash
export PATCHLINE_SOURCE=/absolute/path/to/your/repo
bun run patchline:hmr
```

The launcher script [`patchline.ts`](./patchline.ts) can also pass `--source` and optional `--hmr` — see its header comments.

---

## Development

| Command | What it does |
|--------|----------------|
| `bun run patchline:hmr` | **Recommended** — Vite on `:5173` + Electrobun; hot reload for the webview |
| `bun run dev` | Electrobun only (expects built assets; run `vite build` first if needed) |

---

## Production build

```bash
bun run build
```

Runs **Vite production** (`dist/`) then **Electrobun** (`--env=canary`). Outputs depend on your OS/arch:

| Output | Typical location |
|--------|------------------|
| **.app bundle** | `build/canary-macos-arm64/Patchline-canary.app` (folder name may include `linux` / `win` on other platforms) |
| **Installer** | `artifacts/canary-macos-arm64-Patchline-canary.dmg` (+ `.tar.zst` update payload) |

**Run the built app** (still needs a repo path):

```bash
# macOS — from the project root after a successful build
PATCHLINE_SOURCE=/absolute/path/to/a/git/repo \
  open "build/canary-macos-arm64/Patchline-canary.app"
```

Or open the `.dmg` in `artifacts/`, drag **Patchline** to Applications, then launch with `PATCHLINE_SOURCE` set (e.g. via the `open` line above for a one-off).

> `bun run build:canary` is the same as `bun run build`.

---

## Repository layout

```
src/
├── bun/index.ts          # Main process: window, RPC, Git operations
├── mainview/             # React app (webview)
└── shared/types.ts       # Shared RPC contracts (main ↔ webview)
electrobun.config.ts      # App identity, bundle id, copy paths
vite.config.ts            # Vite bundle for mainview
patchline.ts              # Dev launcher (--source, --hmr)
```

| Customize | Where |
|-----------|--------|
| Window, Git, RPC | `src/bun/index.ts` |
| UI & layout | `src/mainview/` |
| App name & bundle id | `electrobun.config.ts`, `package.json` |

---

## Tech stack

```text
┌─────────────┐     RPC      ┌──────────────┐
│  Bun main   │ ◄──────────► │ React view   │
│  (Git, fs)  │   typed      │ (Vite + TW)  │
└─────────────┘              └──────────────┘
```

---

<div align="center">

<sub>Built with Electrobun — not Electron. See <a href="https://blackboard.sh/electrobun/docs/">Electrobun docs</a> for the platform model.</sub>

</div>

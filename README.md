<div align="center">

# Patchline

### _Patches, line diffs, and commits — a lightweight window built for reading source changes._

[![Bun](https://img.shields.io/badge/Bun-14151A?style=for-the-badge&logo=bun&logoColor=fff)](https://bun.sh)
[![React](https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)](https://react.dev)
[![Electrobun](https://img.shields.io/badge/Electrobun-5B4FFF?style=for-the-badge)](https://blackboard.sh/electrobun/)
[![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-0F172A?style=for-the-badge&logo=tailwindcss&logoColor=38BDF8)](https://tailwindcss.com)

<br />

**Native window · Local-first · Git at the speed of Bun**

[The problem](#the-problem) · [Scope](#scope) · [Supported](#supported-today) · [Incoming](#incoming--not-yet) · [Quick start](#quick-start) · [Screenshots](#screenshots) · [Development](#development) · [Build](#production-build) · [Layout](#repository-layout)

</div>

---

<br />

## The problem

Day-to-day coding often splits across **agents** (e.g. Claude Code) and **editors** (e.g. Cursor). Agent UIs are great for iteration, but **built-in diffs are usually not** — hard to scan, easy to miss hunks, and not where you want to live when you’re **reviewing** changes carefully.

**Patchline** exists because **review deserves its own surface**: a **small, fast, native window** whose only job is to show **what changed** (patch by patch, line by line), let you **stage** and **commit** with confidence, and stay out of the way of your IDE.

If you want a **quick, lightweight code diff** tool — not another full Git GUI — this is it.

---

## Scope

|                      |                                                                                                            |
| :------------------- | :--------------------------------------------------------------------------------------------------------- |
| **Multiple repos**   | Track **several Git repositories** in one window — seed with `PATCHLINE_SOURCE` / `--source`, **Open project** / **Choose folders…** (multi-select where the OS allows), or **Add repository** (folder icon in the header) anytime. |
| **No worktrees yet** | [Git worktrees](https://git-scm.com/docs/git-worktree) are **not** supported; use a normal clone checkout. |

---

## Supported today

| Area           | What works                                                                                                                |
| -------------- | ------------------------------------------------------------------------------------------------------------------------- |
| **Repositories** | **Multi-repo:** each root has its own **Staged** / **Changes**, **branch** in the sidebar, and **collapsible** section. `PATCHLINE_SOURCE` / `--source` seeds the first repo; **Choose folders…** can add **multiple** valid `.git` directories in one sheet; **Add repository** appends more without restart. |
| **Changes**    | Per-repo lists from `git status --porcelain` — **staged** vs **unstaged** buckets                                                                    |
| **Diffs**      | Per-file diff (scoped to the correct repo) with **unified** or **split** layout ([`@git-diff-view`](https://github.com/MrWangJustToSay/git-diff-view)); title bar shows `repoFolder/path/in/repo` |
| **Staging**    | Stage / unstage one file; **stage all** / **unstage all** **per repository**                                                                 |
| **Commit**     | **Title + description** (subject + body) **per repo**, then refresh                                                                    |
| **Branch**     | Current branch (and **upstream** `@{u}`) **per repo** in each sidebar header                                                                                  |
| **Platform**   | macOS-oriented Electrobun app; dev + canary build pipeline                                                                |

---

## Incoming / not yet

|                        |                                                                        |
| :--------------------- | :--------------------------------------------------------------------- |
| **Git worktrees**      | Opening or switching worktrees inside the app                          |
| **Broader Git**        | Push, pull, merge, rebase, branches UI, remote management, etc.        |
| **File tree / editor** | Full repo browser and in-app editing were intentionally trimmed for v1 |

_Roadmap is informal — PRs welcome for the gaps you care about._

---

## Why Patchline? (technical)

|                  |                                                                                                                                                   |
| :--------------- | :------------------------------------------------------------------------------------------------------------------------------------------------ |
| **Main process** | [Bun](https://bun.sh) + [Electrobun](https://blackboard.sh/electrobun/) — native window, Git via [simple-git](https://github.com/steveukx/git-js) |
| **UI**           | [React](https://react.dev) + [Tailwind CSS](https://tailwindcss.com) + shadcn-style components                                                    |
| **Dev UX**       | [Vite](https://vitejs.dev) HMR for instant UI feedback while you iterate                                                                          |

---

## Quick start

**Prerequisites:** [Bun](https://bun.sh) install.

```bash
git clone <repo-url>
cd patchline
bun install
```

### Opening a repository

**Verified behavior (dev and production builds):** if `PATCHLINE_SOURCE` is set when the process starts, that repo is added immediately. If you have **no** repos yet, you get **Add a repository** and a native **Choose folders…** sheet (each selection must be a directory containing `.git`; you can pick **multiple** folders in one go where the OS dialog allows). After the first repo(s), use the **folder-plus** control in the **top bar** to add more anytime.

**Option A — environment variable**  
Best for scripts, agents, and “always this repo”. To dogfood on **this** repository:

```bash
cd /path/to/patchline   # your checkout of this repo
export PATCHLINE_SOURCE="$PWD"
bun run patchline:hmr
```

Use any other checkout path for a different project.

**Option B — no env var**  
From the clone root:

```bash
bun run patchline:hmr
# or: bun patchline.ts --hmr   (omit --source)
```

The launcher [`patchline.ts`](./patchline.ts) only injects `PATCHLINE_SOURCE` when you pass `--source` (e.g. `bun patchline.ts --source "$PWD" --hmr`). If you omit `--source`, it **clears** inherited `PATCHLINE_SOURCE` in the child process so you don’t accidentally open the wrong tree.

### Claude Code (and other agents)

Point Patchline at the **same** working tree the agent uses, then use Patchline for diffs, staging, and commits:

```bash
cd /path/to/patchline   # or whatever project the agent is editing
export PATCHLINE_SOURCE="$PWD"
bun run patchline:hmr
```

---

## Screenshots

Assets live in [`screenshots/`](./screenshots/).

**Sidebar — multiple repos** (collapsible sections, **Staged** / **Changes** per repo)

![Sidebar with multiple repositories](screenshots/splitviewwithsidebar.png)

**Unified diff**

![Unified diff](screenshots/unifiedview.png)

**Split diff**

![Split diff](screenshots/splitview.png)

**Commit dialog**

![Commit dialog](screenshots/commitdialog.png)

---

## Development

| Command                 | What it does                                                               |
| ----------------------- | -------------------------------------------------------------------------- |
| `bun run patchline:hmr` | **Recommended** — Vite on `:5173` + Electrobun; hot reload for the webview |
| `bun run dev`           | Electrobun only (expects built assets; run `vite build` first if needed)   |

---

## Production build

```bash
bun run build
```

Runs **Vite production** (`dist/`) then **Electrobun** (`--env=canary`). The `.app` uses the same Bun main as dev (`src/bun/index.ts`). Outputs depend on your OS/arch:

| Output          | Typical location                                                                                             |
| --------------- | ------------------------------------------------------------------------------------------------------------ |
| **.app bundle** | `build/canary-macos-arm64/Patchline-canary.app` (folder name may include `linux` / `win` on other platforms) |
| **Installer**   | `artifacts/canary-macos-arm64-Patchline-canary.dmg` (+ `.tar.zst` update payload)                            |

**Run the built app** — same rules as dev: optional env seeds a **first** repo; with **no** repos yet you get **Choose folders…**; add more anytime via the header **Add repository** (folder-plus) control.

- **Double-click** the app or `open Patchline-canary.app` → folder picker (no `PATCHLINE_SOURCE`).
- **Open this repo in Patchline** after a local build (path to `.app` may differ by arch / name):

```bash
cd /path/to/patchline
open --env PATCHLINE_SOURCE="$PWD" \
  "build/canary-macos-arm64/Patchline-canary.app"
```

**macOS note:** Prefixing the command (`VAR=value open …`) often **does not** pass environment variables into a GUI `.app`. Use `open --env PATCHLINE_SOURCE=/path` as above.

**Tip:** If you already launched Patchline with env vars and want a **second** instance without them (to see **Choose folder**), use `open -n /path/to/Patchline-canary.app` so macOS starts a new process.

Install from the `.dmg` in `artifacts/` if you prefer; drag **Patchline** to Applications, then use Finder or the `open` / `open --env` patterns above.

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
patchline.ts              # Dev launcher (`--source` optional, `--hmr`)
screenshots/              # README gallery
```

| Customize            | Where                                  |
| -------------------- | -------------------------------------- |
| Window, Git, RPC     | `src/bun/index.ts`                     |
| UI & layout          | `src/mainview/`                        |
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

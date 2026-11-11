# DSH Plugins — Mission Control & Checkpoint

Two DeepSeek Harness (DSH) Web UI plugins that add a dashboard and a deliverables inventory to the browser app.

| Plugin | Answers | Sidebar entry |
| --- | --- | --- |
| **Mission Control** | "What is happening right now?" | A radar icon that opens a session dashboard |
| **Checkpoint** | "What has my work produced?" | A folder icon that opens a workspace inventory |

Both are plain-JavaScript Client modules: no build step, no dependencies, no Harness Client package imports.

---

## What each plugin shows

### Mission Control

- One card per session (blank sessions and subagent children are skipped).
- Status badge: working, waiting, completed, error or inactive.
- Model and provider of the session, plus a `$$` marker for high-cost models.
- The current task and the **next** task, so you can see whether the session is heading anywhere.
- A task progress bar (`done/total`).
- Two timers: **time since the plan last changed** and total session age.
- Risk chips with an explicit precedence:
  `error with pending work` › `plan stalled` › `no plan` › `plan expanded` › `repeated tasks` › `plan complete but active`.
- A "stalled sessions" counter in the summary strip.
- A collapsible **task plan** with each task's state and the approximate goal.
- Status filters, free-text search across title, model and tasks, and a **Go** button that opens the session in the chat.

### Checkpoint

- Every registered workspace with its canonical path and session count.
- Expand a workspace to list its sessions, newest first, each with a relative time.
- A **Go** button per session that opens it in the chat.
- Filters (all / with sessions / empty) and search across workspace title, path and session titles.
- An explicit notice where the host publishes no data, instead of invented numbers.

---

## Requirements

- DSH with the Web app bundle (`@deepseek-ai/dsh-web-app`), version `0.2.2-rc.1` or a compatible build.
- The plugins read only public client services:
  `ctx.sessions` (session catalog and summary projections), `ctx.workspaces` (workspace registry) and `ctx.uiWorkspace.openSession` (navigation).

## Install

Each directory is a bundle that the Harness `plugin_manager` can install by path.

```text
# 1. Clone or download this repository anywhere on disk.
# 2. Install each bundle from the Harness UI (Settings → Plugins) or by asking the agent:
plugin_manager install_bundle  <absolute path>/mission-control
plugin_manager install_bundle  <absolute path>/checkpoint
```

After installation, restart DSH if the manager reports `restart-required`, then open the entry from the left sidebar.

### Optional configuration

Mission Control reads one knob from its plugin row config:

```yaml
- id: mission-control
  name: '@local/mission-control'
  config:
    staleMinutes: 20   # minutes without a plan change before "plan stalled"
```

---

## Repository layout

```text
tools/render-check.md deterministic render harness and its pitfalls
mission-control/
  package.json        bundle manifest + dsh.client wiring
  cordis.patch.yml    inserts only this row
  index.js            host half (no behaviour)
  client.js           the dashboard
  locale/es.json      plugin metadata (Spanish)
  locale/en.json      plugin metadata (English)
  icon.svg
checkpoint/
  package.json
  cordis.patch.yml
  index.js
  client.js
  locale/es.json
  locale/en.json
  icon.svg
```

## How the extension points are used

| Need | Extension point |
| --- | --- |
| Sidebar entry | `sidebar.panellist` list slot (`id`, `order`, `label`) |
| Full page | `main` keyed slot with the same key as the sidebar entry id |
| Session data | `ctx.sessions.list` snapshots; projection values carried by session summaries (`title`, `todos`, `usage`, `requestHeader`) |
| Workspace data | `ctx.workspaces.list` snapshots |
| Navigation | `ctx.uiWorkspace.openSession(sessionId)` |

Nothing reads session history, writes session events, polls, or touches another plugin's DOM.

## Data honesty

Where the host does not publish a value, the plugins say so rather than guessing:

- The "current task" timer measures **time since the plan last changed**, because DSH publishes no per-task start time.
- `usage`, tool-call counts and per-task cost are shown only when the summary carries them; otherwise the card reads "No metrics".
- Checkpoint states plainly that this DSH version publishes no per-session file inventory.

## Verifying a change

Both plugins were validated with a deterministic render harness: the real module is evaluated against a fake module loader, rendered with the props the slot renderer actually passes, and asserted on the resulting element tree (cards, badges, buttons, navigation calls, filters).

See [`tools/render-check.md`](tools/render-check.md) for a reference harness and the pitfalls that produced false test results.

## License

MIT — see [LICENSE](LICENSE).

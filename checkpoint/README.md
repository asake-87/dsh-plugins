# Checkpoint

A workspace inventory for **DeepSeek Harness**: every workspace, its path, and the
sessions it holds — so you can find where your work lives.

![Sidebar entry: folder icon](icon.svg)

## What it shows

- Every registered workspace with its canonical path and session count.
- Expand a workspace to list its sessions, newest first, each with a relative time.
- A **Go** button per session that opens it in the chat.
- Filters: all / with sessions / empty.
- Search across workspace title, path and session titles.
- An explicit notice where DSH publishes no data, instead of invented numbers.

## Install

```text
plugin_manager install_bundle  <absolute path>/checkpoint
```

Restart DSH if the manager reports `restart-required`. The entry appears in the
left sidebar with a folder icon.

## How it reads data

| Need | Source |
| --- | --- |
| Workspaces and their paths | `ctx.workspaces.list` snapshots |
| Session titles | `ctx.sessions.list` snapshots |
| Open in chat | `ctx.uiWorkspace.openSession(sessionId)` |

The bundle declares
`inject: ['slots', 'layout', 'workspaces', 'uiWorkspace', 'sessions']`.

> **Note for plugin authors:** `ctx.sessions` must be in `inject` even when the
> code guards with `ctx.sessions === undefined`. Cordis throws
> *"cannot get property without inject"* before that guard runs.

## Honest limit

This DSH version publishes **no per-session file inventory**, so Checkpoint shows
workspaces, paths and activity rather than files. The panel says this in a notice
instead of guessing at deliverables.

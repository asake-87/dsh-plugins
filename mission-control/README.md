# Mission Control

A session dashboard for **DeepSeek Harness**: one card per session showing what is
running, what comes next, and what looks stuck.

![Sidebar entry: radar icon](icon.svg)

## What it shows

- One card per session. Blank sessions and subagent children are skipped.
- Status badge: **working**, **waiting**, **completed**, **error** or **inactive**.
- Model and provider of the session, plus a `$$` marker for high-cost models.
- The **current task** and the **next** task, so you can see whether the session
  is heading anywhere.
- A task progress bar (`done/total`).
- Two timers: **time since the plan last changed** and total session age.
- Risk chips, only the most severe one per card, in this precedence:
  `error with pending work` › `plan stalled` › `no plan` › `plan expanded` ›
  `repeated tasks` › `plan complete but active`.
- A **stalled sessions** counter in the summary strip.
- A collapsible **task plan** with each task's state and the approximate goal.
- Status filters, free-text search across title, model and tasks.
- A **Go** button that opens the session in the chat.

## Install

```text
plugin_manager install_bundle  <absolute path>/mission-control
```

Restart DSH if the manager reports `restart-required`. The entry appears in the
left sidebar with a radar icon.

## Configuration

One knob, read from the plugin row:

```yaml
- id: mission-control
  name: '@local/mission-control'
  config:
    staleMinutes: 20   # minutes without a plan change before "plan stalled"
```

## How it reads data

Only public client services, through slot standard props:

| Need | Source |
| --- | --- |
| Session list, titles, model, usage | `ctx.sessions.list` snapshots |
| Tasks, plan state | `todos` projection in the session summary |
| Open in chat | `ctx.uiWorkspace.openSession(sessionId)` |

The bundle declares `inject: ['slots', 'layout', 'sessions', 'uiWorkspace']`.
Reading a Cordis service that is not declared there throws, so every service used
must be listed.

## Honest limits

- The "current task" timer is **time since the plan last changed**. DSH publishes
  no per-task start time, and the label says so.
- Cost and tool-call counts appear only when the summary carries them; otherwise
  the card reads "No metrics".
- Plan timestamps survive a panel re-mount through `sessionStorage`
  (`mission-control.plan-clock.v1`).

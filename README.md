# DSH Plugins

Independent plugins for **DeepSeek Harness** (DSH): each one adds a panel and a
sidebar entry to the Web UI. They are plain-JavaScript Client modules — no build
step, no dependencies, no Harness Client package imports.

**Pick only the ones you want.** Every plugin lives in its own directory and is
installed on its own; there is no shared code to install first.

---

## Catalog

| Plugin | Question it answers | Sidebar entry | Status |
| --- | --- | --- | --- |
| [**Mission Control**](mission-control/README.md) | *What is happening right now?* | Radar icon | Stable |
| [**Checkpoint**](checkpoint/README.md) | *What has my work produced?* | Folder icon | Stable |

More plugins are welcome and slot into the same structure — see
[Adding a plugin](CONTRIBUTING.md).

---

## Install

Each plugin directory is a DSH bundle. Install it by absolute path, from the
Harness UI (**Settings → Plugins**) or by asking the agent:

```text
plugin_manager install_bundle  <absolute path>/mission-control
plugin_manager install_bundle  <absolute path>/checkpoint
```

Install only what you need. Skip a directory and it simply will not exist in
your Harness.

After installing, restart DSH if the manager reports `restart-required`, then
open the entry in the left sidebar.

### What each plugin touches

| Plugin | Client services read | Slots used |
| --- | --- | --- |
| Mission Control | `sessions`, `uiWorkspace` | `sidebar.panellist`, `main` |
| Checkpoint | `workspaces`, `uiWorkspace`, `sessions` | `sidebar.panellist`, `main` |

Nothing reads session history, writes session events, polls, or touches another
plugin's DOM. If a service is missing the bundle simply stays inactive.

---

## Requirements

- DSH with the Web app bundle (`@deepseek-ai/dsh-web-app`), `0.2.2-rc.1` or a
  compatible build.

## Repository layout

```text
mission-control/        one self-contained plugin bundle
  package.json          manifest: dsh.bundle patch + dsh.client wiring
  cordis.patch.yml      inserts only its own row
  index.js              host half (no behaviour)
  client.js             the panel
  locale/en.json        plugin metadata (English)
  locale/es.json        plugin metadata (Spanish)
  icon.svg
checkpoint/             same shape
tools/
  publishing.md         how maintainers push to this repository
  render-check.md       reference test harness and its pitfalls
CONTRIBUTING.md         how to add a plugin
```

Each plugin is a **package root**: its `package.json` declares
`dsh.bundle.patch` and, for UI plugins, `dsh.client`. Nothing outside the plugin
directory is required at runtime.

## Data honesty

These plugins never invent numbers. Where DSH does not publish a value, they say
so:

- Mission Control's "current task" timer measures **time since the plan last
  changed**, because DSH publishes no per-task start time.
- Cost and tool-call counts appear only when the session summary carries them;
  otherwise the card reads "No metrics".
- Checkpoint states plainly that this DSH version publishes no per-session file
  inventory.

## Verifying a change

Every plugin is checked with a deterministic render harness: the real module is
evaluated against a fake loader, rendered with the props the slot renderer
passes, and asserted on the resulting element tree. See
[`tools/render-check.md`](tools/render-check.md) for the harness and the pitfalls
that produce false results.

## License

MIT — see [LICENSE](LICENSE).

# Adding a plugin

The repository is a catalog, not a single package. Each plugin is a
self-contained DSH bundle in its own top-level directory, and users install only
the ones they choose.

## 1. Create the directory

```text
my-plugin/
  package.json        required
  cordis.patch.yml    required
  index.js            required (host half)
  client.js           only for a UI plugin
  locale/en.json      plugin metadata
  locale/es.json
  icon.svg
```

Copy an existing plugin as the starting point — `checkpoint/` is the smallest
complete example.

## 2. Manifest

A UI plugin declares both the bundle patch and its browser module:

```json
{
  "name": "@local/my-plugin",
  "version": "1.0.0",
  "private": true,
  "type": "module",
  "exports": {
    ".": "./index.js",
    "./client": "./client.js",
    "./locale/*.json": "./locale/*.json",
    "./icon": "./icon.svg"
  },
  "files": ["index.js", "client.js", "cordis.patch.yml", "locale/*.json", "icon.svg"],
  "dsh": {
    "bundle": { "patch": "./cordis.patch.yml" },
    "client": {
      "platform": "web",
      "immediately": true,
      "inject": ["@deepseek-ai/dsh-client-ui-layout"]
    }
  }
}
```

`dsh.client.inject` lists the Client packages that must be loaded first. Add
`@deepseek-ai/dsh-client-ui-session` or `@deepseek-ai/dsh-client-ui-workspace`
when the panel reads those services.

## 3. Patch

The patch inserts **only this plugin's row**, so installing one plugin never
touches another:

```yaml
- insert:
    - id: my-plugin
      name: '@local/my-plugin'
```

## 4. Client module

Register into slots through the context; never append DOM or replace the app
root:

```js
ctx.effect(() => ctx.slots.inject('sidebar.panellist', () => ctx.slots.register({
  name: 'sidebar.panellist',
  id: 'my-plugin',
  order: 100,
  label: () => t('title'),
}, Glyph)), 'my-plugin: sidebar entry');
```

Style with theme tokens (`--dsw-alias-*`), keep an error boundary around the
panel, and route all visible text through the locale dictionary.

## Rules that matter

1. **Declare every service you read in `inject`.** Cordis throws
   *"cannot get property X without inject"* on an undeclared service — a guard
   such as `ctx.sessions === undefined` never runs.
2. **Read only public services and published projections.** No session history
   scans, no writing session events, no polling, no reading another plugin's DOM.
3. **Never invent data.** If DSH does not publish a value, show that plainly.
4. **Keep the plugin root self-contained.** Nothing outside its directory may be
   required at runtime.

## 5. Verify before committing

Use the harness in [`tools/render-check.md`](tools/render-check.md): evaluate the
module against a fake loader, render it with the props the slot renderer passes,
and assert on the element tree.

Minimum checks:

- `node --check client.js` and `index.js`
- Both locale files parse as JSON
- The panel renders with a fabricated catalog
- Buttons invoke the navigation they promise

## 6. Update the catalog

Add a row to the table in the root [`README.md`](README.md), and a short
`README.md` inside the plugin directory describing what it shows, how it reads
data, and its honest limits.

## 7. Ship it

```powershell
git add -A
git commit -m "Add my-plugin"
git push origin main
```

Maintainers publish with the token described in
[`tools/publishing.md`](tools/publishing.md).

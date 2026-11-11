# Reference render harness

The plugins are plain Client modules. A deterministic check is to evaluate the
bundle against a fake module loader, apply it to a fake Cordis context, render
the registered view with the props the slot renderer actually passes, and assert
on the resulting element tree.

## 1. Fake loader and React

```js
let factory;
globalThis.window = globalThis;
globalThis.navigator = { language: 'es-ES' };
globalThis.__ModuleLoader__ = { load: ({ factory: loaded }) => { factory = loaded; } };
new Function(readFileSync('client.js', 'utf8'))();

const React = {
  createElement: (type, props, ...children) => ({
    type,
    props: Object.assign({}, props || {}, children.length ? { children: children.length === 1 ? children[0] : children } : {}),
    children: children.length === 1 ? children[0] : children,
  }),
  Component: class {
    constructor(props) { this.props = props; this.state = {}; }
    get children() { return this.props && this.props.children; }
  },
  Fragment: 'Fragment',
  useEffect() {},
  useMemo: (fn) => fn(),
  useState: (initial) => [typeof initial === 'function' ? initial() : initial, () => {}],
  useRef: (initial) => ({ current: initial }),
};
```

## 2. Fake context

```js
const views = [];
const ctx = {
  effect: (fn) => { fn(); return () => {}; },
  slots: {
    inject: (name, create) => { create(); return () => {}; },
    register: (decl, component) => { views.push({ decl, component }); return () => {}; },
  },
  layout: {},
  sessions:   { list: { getSnapshot: () => catalog,  subscribe: () => () => {} }, refresh: async () => {} },
  workspaces: { list: { getSnapshot: () => workspaces, subscribe: () => () => {} }, refresh: async () => {} },
  uiWorkspace: { openSession: (id) => calls.push(id) },
};

const bundle = factory((name) => (name === 'react' ? React : {}));
bundle.apply(ctx);
```

## 3. Walk and assert

Walk the element tree, counting nodes by `type` and `className`, and invoke
`onClick` handlers to prove navigation calls:

```js
walk({ type: views.find((v) => v.decl.name === 'main').component,
       props: { ctx, t: (key) => key } });
// → count <article class="mc-card">, <button class="mc-open">, etc.
```

## Pitfalls that cost real debugging time

These are the ones that produced false greens and false reds while building the
plugins; check them before trusting a harness result.

1. **`props.children` must round-trip.** `createElement` must copy children into
   `props`, and a class component must expose `this.props.children`. Otherwise an
   error boundary renders an empty tree and every assertion silently "passes" on
   nothing.
2. **`useMemo` must not run without deps.** A harness that always returns the
   memoized value hides recomputation bugs. Only reuse a cached value when
   `deps` is defined and shallow-equal.
3. **A per-render `useRef` breaks persistence.** `useRef` must return the same
   object across renders of the same component path, or state kept in a ref is
   reset every pass.
4. **Test the module's own locale path.** The plugins build their translator
   internally and ignore any `t` prop. Set `window.__missionControlTestKeys = true`
   (or `window.__checkpointTestKeys`) to render labels as their keys, so
   assertions do not depend on display language.
5. **Collapsed UI needs an explicit expanded render.** Toggle state set inside a
   handler does not apply in the same pass; either render twice with preserved
   hook state, or verify the expanded branch with a copy of the module whose
   expansion flag is forced on.

## What to assert per plugin

**Mission Control:** card count, status badge, next-task arrow, progress bar
width, risk chip precedence, stalled counter, plan disclosure, `openSession`
called with the right id, and the plan-unchanged clock only firing after the
configured window.

**Checkpoint:** workspace card count, expand toggle, session rows, empty-workspace
message, the "no file inventory" notice, filters, and `openSession` per session.

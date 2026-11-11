window.__ModuleLoader__.load({
  id: '@local/checkpoint',
  factory(require) {
    const React = require('react');
    const h = React.createElement;
    const { useEffect, useMemo, useState } = React;

    const PANEL_ID = 'checkpoint';
    const RAIL_SLOT = 'sidebar.panellist';
    const MAIN_SLOT = 'main';

    /* ------------------------------------------------------------------ i18n */

    const MESSAGES = {
      es: {
        title: 'Checkpoint',
        subtitle: 'Entregables y actividad por espacio de trabajo',
        refresh: 'Actualizar',
        workspaces: 'Espacios de trabajo',
        sessions: 'Sesiones',
        recent: 'Con actividad reciente',
        filterAll: 'Todos',
        filterActive: 'Con sesiones',
        filterEmpty: 'Vacíos',
        searchLabel: 'Buscar espacio o sesión',
        searchHint: 'Buscar espacio, ruta o sesión…',
        openWorkspace: 'Abrir',
        openWorkspaceTitle: 'Abrir carpeta del espacio de trabajo',
        openSessionTitle: 'Abrir esta sesión en el chat',
        sessionCount: 'sesiones',
        lastUpdate: 'Actualizado',
        noSessions: 'Este espacio no tiene sesiones registradas',
        noWorkspaces: 'No hay espacios de trabajo registrados',
        empty: 'Ningún espacio coincide con el filtro',
        loading: 'Cargando espacios de trabajo…',
        path: 'Ruta',
        appError: 'Checkpoint no pudo dibujar el panel',
        appErrorHint: 'Recarga la página; el resto de la aplicación sigue funcionando.',
        filesUnavailable: 'Esta versión de DSH no publica el inventario de archivos por sesión, así que Checkpoint muestra espacios, rutas y actividad en lugar de archivos.',
        untitledSession: 'Sesión sin título',
      },
      en: {
        title: 'Checkpoint',
        subtitle: 'Deliverables and activity per workspace',
        refresh: 'Refresh',
        workspaces: 'Workspaces',
        sessions: 'Sessions',
        recent: 'With recent activity',
        filterAll: 'All',
        filterActive: 'With sessions',
        filterEmpty: 'Empty',
        searchLabel: 'Search workspace or session',
        searchHint: 'Search workspace, path or session…',
        openWorkspace: 'Open',
        openWorkspaceTitle: 'Open the workspace folder',
        openSessionTitle: 'Open this session in the chat',
        sessionCount: 'sessions',
        lastUpdate: 'Updated',
        noSessions: 'This workspace has no recorded sessions',
        noWorkspaces: 'No workspaces are registered',
        empty: 'No workspace matches the filter',
        loading: 'Loading workspaces…',
        path: 'Path',
        appError: 'Checkpoint could not render the panel',
        appErrorHint: 'Reload the page; the rest of the application keeps working.',
        filesUnavailable: 'This DSH version does not publish a per-session file inventory, so Checkpoint shows workspaces, paths and activity instead of files.',
        untitledSession: 'Untitled session',
      },
    };

    function makeTranslator() {
      if (typeof window !== 'undefined' && window.__checkpointTestKeys === true) return (key) => key;
      let locale = 'es';
      try {
        const lang = String(navigator.language || 'es').slice(0, 2).toLowerCase();
        if (MESSAGES[lang] !== undefined) locale = lang;
      } catch (_) { /* keep the Spanish default */ }
      const table = MESSAGES[locale];
      return (key) => (table[key] === undefined ? key : table[key]);
    }

    /* ----------------------------------------------------------- formatting */

    function relativeTime(time, now) {
      if (!Number.isFinite(time)) return undefined;
      const sec = Math.max(0, Math.round((now - time) / 1000));
      if (sec < 60) return `${sec}s`;
      if (sec < 3600) return `${Math.floor(sec / 60)}m`;
      if (sec < 86400) return `${Math.floor(sec / 3600)}h`;
      return `${Math.floor(sec / 86400)}d`;
    }

    const asMillis = (value) => {
      if (typeof value === 'string') {
        const parsed = Date.parse(value);
        return Number.isFinite(parsed) ? parsed : undefined;
      }
      return Number.isFinite(value) ? value : undefined;
    };

    function baseName(path) {
      if (typeof path !== 'string' || path.length === 0) return '';
      const parts = path.split(/[\\/]+/).filter((part) => part.length > 0);
      return parts.length === 0 ? path : parts[parts.length - 1];
    }

    const EMPTY_WORKSPACES = { items: [], archivedSessionIds: [], pinnedSessionIds: [], state: 'idle', phase: 'pending', error: null };

    /* ------------------------------------------------------- styles (tokens) */

    const FONT = 'system-ui,-apple-system,"Segoe UI",Roboto,sans-serif';
    const MONO = 'ui-monospace,SFMono-Regular,Menlo,Consolas,monospace';
    const CSS = `
.cp-page{display:flex;flex-direction:column;gap:16px;min-height:100%;box-sizing:border-box;
padding:calc(var(--dsh-frame-top-clearance,0px) + 22px) 26px 30px;font:14px/1.45 ${FONT};
color:var(--dsw-alias-label-primary,var(--dsw-alias-text-primary,inherit));background:var(--dsw-alias-bg-primary,transparent);}
.cp-head{display:flex;align-items:flex-start;gap:12px;}
.cp-title{display:flex;align-items:center;gap:10px;margin:0;font-size:20px;font-weight:600;letter-spacing:.01em;}
.cp-sub{margin:4px 0 0;font-size:12.5px;color:var(--dsw-alias-label-secondary,inherit);}
.cp-grow{flex:1 1 auto;}
.cp-btn{display:inline-flex;align-items:center;justify-content:center;height:32px;padding:0 12px;border-radius:8px;cursor:pointer;
font:inherit;font-size:13px;color:var(--dsw-alias-label-primary,inherit);border:.5px solid var(--dsw-alias-border-l3,currentColor);
background:var(--dsw-alias-button-elevated-fill,transparent);}
.cp-btn:hover{background:var(--dsw-alias-button-floating-hover,var(--dsw-alias-interactive-bg-hover,transparent));}
.cp-metrics{display:grid;grid-template-columns:repeat(auto-fit,minmax(150px,1fr));gap:12px;}
.cp-metric{padding:12px 14px;border-radius:10px;border:.5px solid var(--dsw-alias-border-l3,rgba(127,127,127,.28));
background:var(--dsw-alias-bg-l2,transparent);}
.cp-metric small{display:block;font-size:11px;text-transform:uppercase;letter-spacing:.07em;color:var(--dsw-alias-label-secondary,inherit);}
.cp-metric strong{display:block;margin-top:4px;font-size:22px;font-weight:600;font-variant-numeric:tabular-nums;}
.cp-toolbar{display:flex;flex-wrap:wrap;align-items:center;gap:8px;}
.cp-chip{height:28px;padding:0 12px;border-radius:999px;cursor:pointer;font:inherit;font-size:12.5px;
color:var(--dsw-alias-label-secondary,inherit);border:.5px solid var(--dsw-alias-border-l3,currentColor);background:transparent;}
.cp-chip[aria-pressed="true"]{font-weight:600;color:var(--dsw-alias-label-primary,inherit);
background:var(--dsw-alias-interactive-bg-hover,rgba(127,127,127,.16));}
.cp-search{height:30px;min-width:220px;padding:0 10px;border-radius:8px;font:inherit;font-size:13px;
color:var(--dsw-alias-label-primary,inherit);border:.5px solid var(--dsw-alias-border-l3,currentColor);background:transparent;}
.cp-note{display:flex;gap:8px;align-items:flex-start;padding:10px 12px;border-radius:8px;font-size:12.5px;
color:var(--dsw-alias-label-secondary,inherit);border:.5px dashed var(--dsw-alias-border-l3,currentColor);}
.cp-list{display:flex;flex-direction:column;gap:12px;}
.cp-ws{border-radius:10px;border:.5px solid var(--dsw-alias-border-l3,rgba(127,127,127,.28));
background:var(--dsw-alias-bg-l2,transparent);overflow:hidden;}
.cp-ws-head{display:flex;align-items:center;gap:10px;padding:12px 14px;cursor:pointer;
background:var(--dsw-alias-bg-l1,rgba(127,127,127,.06));border:none;width:100%;text-align:left;font:inherit;color:inherit;}
.cp-ws-head:hover{background:var(--dsw-alias-interactive-bg-hover,rgba(127,127,127,.12));}
.cp-ws-name{font-weight:600;font-size:14px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;}
.cp-ws-path{font-family:${MONO};font-size:11.5px;color:var(--dsw-alias-label-secondary,inherit);
overflow:hidden;text-overflow:ellipsis;white-space:nowrap;}
.cp-ws-meta{font-size:11.5px;color:var(--dsw-alias-label-secondary,inherit);white-space:nowrap;}
.cp-chevron{flex:none;width:12px;color:var(--dsw-alias-label-secondary,inherit);}
.cp-ws-body{padding:4px 14px 12px;display:flex;flex-direction:column;gap:6px;}
.cp-row{display:flex;align-items:center;gap:10px;padding:7px 8px;border-radius:8px;font-size:12.5px;
background:var(--dsw-alias-bg-primary,rgba(127,127,127,.05));}
.cp-row-name{flex:1;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;}
.cp-row-time{font-size:11.5px;color:var(--dsw-alias-label-secondary,inherit);white-space:nowrap;}
.cp-open{flex:none;height:24px;padding:0 10px;border-radius:999px;cursor:pointer;font:inherit;font-size:11.5px;font-weight:600;
color:var(--dsw-alias-label-primary-inverted,#0b1a18);background:var(--dsw-alias-label-primary,currentColor);border:none;}
.cp-open:hover{opacity:.88;}
.cp-empty{padding:44px 16px;text-align:center;color:var(--dsw-alias-label-secondary,inherit);}
.cp-empty-inline{padding:10px 4px;font-size:12.5px;color:var(--dsw-alias-label-secondary,inherit);}
.cp-fallback{display:inline-flex;align-items:center;justify-content:center;width:16px;height:16px;}
.cp-btn:focus-visible,.cp-chip:focus-visible,.cp-search:focus-visible,.cp-ws-head:focus-visible,.cp-open:focus-visible{
outline:var(--dsw-focus-ring-width,2px) solid var(--dsw-focus-ring-color,currentColor);outline-offset:2px;}
`;

    function Styles() {
      return h('style', { 'data-checkpoint': '' }, CSS);
    }

    function FolderIcon({ size }) {
      return h('svg', { width: size, height: size, viewBox: '0 0 24 24', fill: 'none', 'aria-hidden': 'true', focusable: 'false', style: { display: 'block' } },
        h('path', { d: 'M3.5 7.5A1.5 1.5 0 0 1 5 6h4l1.6 2H19a1.5 1.5 0 0 1 1.5 1.5v7A1.5 1.5 0 0 1 19 18H5a1.5 1.5 0 0 1-1.5-1.5z', stroke: 'currentColor', strokeWidth: 1.6, strokeLinejoin: 'round' }));
    }

    /* -------------------------------------------------------- error guard */

    class Guard extends React.Component {
      constructor(props) {
        super(props);
        this.state = { failed: false };
      }
      static getDerivedStateFromError(error) {
        if (typeof window !== 'undefined') window.__checkpointError = String((error && error.stack) || error);
        return { failed: true };
      }
      render() {
        if (this.state.failed) {
          return h('div', { className: 'cp-page' },
            h('div', { className: 'cp-empty' },
              h('strong', null, this.props.t('appError')),
              h('div', null, this.props.t('appErrorHint'))));
        }
        return this.props.children;
      }
    }

    /* -------------------------------------------------------- data access */

    /** `ctx.workspaces` is the public client Workspace service. */
    function useWorkspaceService(ctx) {
      return ctx.workspaces === undefined ? undefined : ctx.workspaces;
    }

    function useWorkspaceSnapshot(service) {
      const [snapshot, setSnapshot] = useState(() => (service === undefined ? undefined : service.list.getSnapshot()));
      useEffect(() => {
        if (service === undefined) return undefined;
        const read = () => service.list.getSnapshot();
        setSnapshot((previous) => {
          const next = read();
          return previous !== undefined && previous !== null && previous.items === next.items && previous.phase === next.phase ? previous : next;
        });
        return service.list.subscribe(() => {
          setSnapshot((previous) => {
            const next = read();
            return previous !== undefined && previous !== null && previous.items === next.items && previous.phase === next.phase ? previous : next;
          });
        });
      }, [service]);
      return snapshot === undefined || snapshot === null ? EMPTY_WORKSPACES : snapshot;
    }

    function useSessionCatalog(ctx) {
      const service = ctx.sessions === undefined ? undefined : ctx.sessions;
      const [snapshot, setSnapshot] = useState(() => (service === undefined ? undefined : service.list.getSnapshot()));
      useEffect(() => {
        if (service === undefined) return undefined;
        const read = () => service.list.getSnapshot();
        setSnapshot(() => read());
        return service.list.subscribe(() => setSnapshot(() => read()));
      }, [service]);
      return snapshot === undefined || snapshot === null ? undefined : snapshot;
    }

    function buildGroups(snapshot, catalog, now, t) {
      const items = Array.isArray(snapshot.items) ? snapshot.items : [];
      const sessions = catalog === undefined || catalog === null ? {} : (catalog.byId || {});
      const groups = items.map((workspace) => {
        const ids = Array.isArray(workspace.sessionIds) ? workspace.sessionIds : [];
        const sessionsOf = ids.map((id) => {
          const summary = sessions[id] || {};
          const title = typeof summary.title === 'string' && summary.title.length > 0
            ? summary.title
            : (typeof summary.displayTitle === 'string' && summary.displayTitle.length > 0 ? summary.displayTitle : t('untitledSession'));
          const updatedAt = asMillis(summary.updatedAt);
          return { id, title, updatedAt, running: summary.running === true };
        }).sort((left, right) => (right.updatedAt || 0) - (left.updatedAt || 0));
        const updatedAt = asMillis(workspace.updatedAt);
        return {
          id: workspace.workspaceId,
          title: typeof workspace.title === 'string' && workspace.title.length > 0 ? workspace.title : baseName(workspace.path),
          path: typeof workspace.path === 'string' ? workspace.path : '',
          sessions: sessionsOf,
          sessionCount: sessionsOf.length,
          updatedAt,
          running: sessionsOf.filter((session) => session.running).length,
        };
      });
      groups.sort((left, right) => right.sessionCount - left.sessionCount || (right.updatedAt || 0) - (left.updatedAt || 0));
      return groups;
    }

    /* ------------------------------------------------------------- views */

    function Metric({ label, value }) {
      return h('div', { className: 'cp-metric' }, h('small', null, label), h('strong', null, value));
    }

    function openSession(ctx, id) {
      const service = ctx.uiWorkspace;
      if (service === undefined || service === null || typeof service.openSession !== 'function') return;
      try {
        Promise.resolve(service.openSession(id)).catch(() => {});
      } catch (_) { /* navigation is best effort */ }
    }

    function WorkspaceCard({ group, t, now, ctx, expanded, onToggle }) {
      const recent = group.updatedAt === undefined ? undefined : relativeTime(group.updatedAt, now);
      return h('section', { className: 'cp-ws' },
        h('button', {
          type: 'button',
          className: 'cp-ws-head',
          'aria-expanded': expanded ? 'true' : 'false',
          onClick: onToggle,
        },
          h('span', { className: 'cp-chevron', 'aria-hidden': 'true' }, expanded ? '▾' : '▸'),
          h('span', { style: { display: 'flex', flexDirection: 'column', minWidth: 0, flex: 1 } },
            h('span', { className: 'cp-ws-name', title: group.title }, group.title),
            h('span', { className: 'cp-ws-path', title: group.path }, group.path)),
          h('span', { className: 'cp-ws-meta' }, `${group.sessionCount} ${t('sessionCount')}${recent === undefined ? '' : ` · ${recent}`}`)),
        expanded
          ? h('div', { className: 'cp-ws-body' },
              group.sessionCount === 0
                ? h('div', { className: 'cp-empty-inline' }, t('noSessions'))
                : group.sessions.map((session) => h('div', { className: 'cp-row', key: session.id },
                    h('span', { className: 'cp-row-name', title: session.title }, session.title),
                    session.updatedAt === undefined ? null : h('span', { className: 'cp-row-time' }, relativeTime(session.updatedAt, now)),
                    h('button', {
                      type: 'button',
                      className: 'cp-open',
                      title: t('openSessionTitle'),
                      'aria-label': `${t('openSessionTitle')}: ${session.title}`,
                      onClick: () => openSession(ctx, session.id),
                    }, t('openWorkspace')))))
          : null);
    }

    function Panel({ ctx, t }) {
      const service = useWorkspaceService(ctx);
      const snapshot = useWorkspaceSnapshot(service);
      const catalog = useSessionCatalog(ctx);
      const [filter, setFilter] = useState('all');
      const [query, setQuery] = useState('');
      const [expanded, setExpanded] = useState({});
      const [now, setNow] = useState(() => Date.now());

      if (typeof window !== 'undefined') window.__checkpointMounted = (window.__checkpointMounted || 0) + 1;

      const groups = useMemo(() => buildGroups(snapshot, catalog, now, t), [snapshot, catalog, now, t]);
      const totalSessions = groups.reduce((sum, group) => sum + group.sessionCount, 0);
      const withSessions = groups.filter((group) => group.sessionCount > 0).length;

      useEffect(() => {
        const timer = setInterval(() => setNow(Date.now()), 15000);
        return () => clearInterval(timer);
      }, []);

      const needle = query.trim().toLowerCase();
      const visible = groups.filter((group) => {
        if (needle.length > 0) {
          const haystack = `${group.title} ${group.path} ${group.sessions.map((session) => session.title).join(' ')}`.toLowerCase();
          if (!haystack.includes(needle)) return false;
        }
        if (filter === 'active') return group.sessionCount > 0;
        if (filter === 'empty') return group.sessionCount === 0;
        return true;
      });

      const chips = [['all', t('filterAll')], ['active', t('filterActive')], ['empty', t('filterEmpty')]];
      const onRefresh = () => {
        setNow(Date.now());
        if (service !== undefined && typeof service.refresh === 'function') Promise.resolve(service.refresh()).catch(() => {});
      };

      return h('div', { className: 'cp-page' },
        h(Styles),
        h('header', { className: 'cp-head' },
          h('div', null,
            h('h1', { className: 'cp-title' },
              h('span', { 'aria-hidden': 'true', style: { display: 'inline-flex' } }, h(FolderIcon, { size: 22 })),
              t('title')),
            h('p', { className: 'cp-sub' }, t('subtitle'))),
          h('div', { className: 'cp-grow' }),
          h('button', { type: 'button', className: 'cp-btn', onClick: onRefresh }, t('refresh'))),
        h('section', { className: 'cp-metrics', 'aria-label': t('title') },
          h(Metric, { label: t('workspaces'), value: String(groups.length) }),
          h(Metric, { label: t('sessions'), value: String(totalSessions) }),
          h(Metric, { label: t('recent'), value: String(withSessions) })),
        h('div', { className: 'cp-note' },
          h('span', { 'aria-hidden': 'true' }, 'ⓘ'),
          h('span', null, t('filesUnavailable'))),
        h('div', { className: 'cp-toolbar' },
          chips.map(([key, label]) => h('button', {
            key, type: 'button', className: 'cp-chip',
            'aria-pressed': filter === key ? 'true' : 'false',
            onClick: () => setFilter(key),
          }, label)),
          h('div', { className: 'cp-grow' }),
          h('input', {
            type: 'search', className: 'cp-search',
            'aria-label': t('searchLabel'), placeholder: t('searchHint'),
            value: query, onChange: (event) => setQuery(event.target.value),
          })),
        groups.length === 0
          ? h('div', { className: 'cp-empty' }, snapshot.phase === 'pending' ? t('loading') : t('noWorkspaces'))
          : visible.length === 0
            ? h('div', { className: 'cp-empty' }, t('empty'))
            : h('div', { className: 'cp-list' }, visible.map((group) => h(WorkspaceCard, {
                key: group.id,
                group,
                t,
                now,
                ctx,
                expanded: expanded[group.id] === true,
                onToggle: () => setExpanded({ ...expanded, [group.id]: expanded[group.id] !== true }),
              }))));
    }

    function PanelGlyph({ size }) {
      return h('span', { className: 'cp-fallback' }, h(FolderIcon, { size: Number.isFinite(size) ? size : 16 }));
    }

    function view(Component, ctx, t, fill) {
      function CheckpointView(props) {
        const tree = h(Guard, { t }, h(Component, { ...props, ctx, t }));
        return fill === true ? h('div', { style: { height: '100%', minHeight: 0, overflow: 'auto' } }, tree) : tree;
      }
      CheckpointView.displayName = `Checkpoint(${Component.name || 'View'})`;
      return CheckpointView;
    }

    /* --------------------------------------------------------------- apply */

    function apply(ctx) {
      const t = makeTranslator();
      ctx.effect(() => ctx.slots.inject(MAIN_SLOT, () => ctx.slots.register({
        name: MAIN_SLOT,
        key: PANEL_ID,
      }, view(Panel, ctx, t, true))), 'checkpoint: panel');

      ctx.effect(() => ctx.slots.inject(RAIL_SLOT, () => ctx.slots.register({
        name: RAIL_SLOT,
        id: PANEL_ID,
        order: 90,
        label: () => t('title'),
      }, view(PanelGlyph, ctx, t, false))), 'checkpoint: sidebar entry');
    }

    return {
      name: 'checkpoint',
      inject: ['slots', 'layout', 'workspaces', 'uiWorkspace'],
      apply,
    };
  },
});

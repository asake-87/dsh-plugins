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


    const FONT = 'system-ui,-apple-system,"Segoe UI",Roboto,sans-serif';
    const MONO = 'ui-monospace,SFMono-Regular,Menlo,Consolas,monospace';

    function FolderIcon({ size }) {
      return h('svg', { width: size, height: size, viewBox: '0 0 24 24', fill: 'none', 'aria-hidden': 'true' });
    }

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
        if (this.state.failed) return h('div', { className: 'cp-page' }, h('div', { className: 'cp-empty' }, h('strong', null, this.props.t('appError'))));
        return this.props.children;
      }
    }

    function useWorkspaceSnapshot(service) {
      const [snapshot, setSnapshot] = useState(() => (service === undefined ? undefined : service.list.getSnapshot()));
      useEffect(() => {
        if (service === undefined) return undefined;
        const read = () => service.list.getSnapshot();
        setSnapshot(() => read());
        return service.list.subscribe(() => setSnapshot(() => read()));
      }, [service]);
      return snapshot == null ? EMPTY_WORKSPACES : snapshot;
    }

    function useSessionCatalog(ctx) {
      const service = ctx.sessions;
      const [snapshot, setSnapshot] = useState(() => (service === undefined ? undefined : service.list.getSnapshot()));
      useEffect(() => {
        if (service === undefined) return undefined;
        const read = () => service.list.getSnapshot();
        setSnapshot(() => read());
        return service.list.subscribe(() => setSnapshot(() => read()));
      }, [service]);
      return snapshot == null ? undefined : snapshot;
    }

    function buildGroups(snapshot, catalog, now, t) {
      const items = Array.isArray(snapshot.items) ? snapshot.items : [];
      const sessions = catalog == null ? {} : (catalog.byId || {});
      const groups = items.map((workspace) => {
        const ids = Array.isArray(workspace.sessionIds) ? workspace.sessionIds : [];
        const sessionsOf = ids.map((id) => {
          const summary = sessions[id] || {};
          const title = typeof summary.title === 'string' && summary.title.length > 0
            ? summary.title
            : (typeof summary.displayTitle === 'string' && summary.displayTitle.length > 0 ? summary.displayTitle : t('untitledSession'));
          return { id, title, updatedAt: asMillis(summary.updatedAt), running: summary.running === true };
        }).sort((left, right) => (right.updatedAt || 0) - (left.updatedAt || 0));
        return {
          id: workspace.workspaceId,
          title: typeof workspace.title === 'string' && workspace.title.length > 0 ? workspace.title : baseName(workspace.path),
          path: typeof workspace.path === 'string' ? workspace.path : '',
          sessions: sessionsOf,
          sessionCount: sessionsOf.length,
          updatedAt: asMillis(workspace.updatedAt),
        };
      });
      groups.sort((left, right) => right.sessionCount - left.sessionCount);
      return groups;
    }

    function Metric({ label, value }) {
      return h('div', { className: 'cp-metric' }, h('small', null, label), h('strong', null, value));
    }

    function openSession(ctx, id) {
      const service = ctx.uiWorkspace;
      if (service == null || typeof service.openSession !== 'function') return;
      try { Promise.resolve(service.openSession(id)).catch(() => {}); } catch (_) { }
    }

    function WorkspaceCard({ group, t, now, ctx, expanded, onToggle }) {
      return h('section', { className: 'cp-ws' },
        h('button', { type: 'button', className: 'cp-ws-head', 'aria-expanded': expanded ? 'true' : 'false', onClick: onToggle },
          h('span', { className: 'cp-chevron' }, expanded ? '▾' : '▸'),
          h('span', { className: 'cp-ws-name' }, group.title),
          h('span', { className: 'cp-ws-meta' }, group.sessionCount + ' ' + t('sessionCount'))),
        expanded
          ? h('div', { className: 'cp-ws-body' },
              group.sessions.map((session) => h('div', { className: 'cp-row', key: session.id },
                h('span', { className: 'cp-row-name' }, session.title),
                h('button', { type: 'button', className: 'cp-open', onClick: () => openSession(ctx, session.id) }, t('openWorkspace')))))
          : null);
    }

    function Panel({ ctx, t }) {
      const service = ctx.workspaces;
      const snapshot = useWorkspaceSnapshot(service);
      const catalog = useSessionCatalog(ctx);
      const [filter, setFilter] = useState('all');
      const [query, setQuery] = useState('');
      const [expanded, setExpanded] = useState({});
      const [now, setNow] = useState(() => Date.now());
      if (typeof window !== 'undefined') window.__checkpointMounted = (window.__checkpointMounted || 0) + 1;
      const groups = useMemo(() => buildGroups(snapshot, catalog, now, t), [snapshot, catalog, now, t]);
      const totalSessions = groups.reduce((sum, group) => sum + group.sessionCount, 0);
      useEffect(() => { const timer = setInterval(() => setNow(Date.now()), 15000); return () => clearInterval(timer); }, []);
      const needle = query.trim().toLowerCase();
      const visible = groups.filter((group) => {
        if (needle.length > 0) {
          const haystack = `${group.title} ${group.path}`.toLowerCase();
          if (!haystack.includes(needle)) return false;
        }
        if (filter === 'active') return group.sessionCount > 0;
        if (filter === 'empty') return group.sessionCount === 0;
        return true;
      });
      const chips = [['all', t('filterAll')], ['active', t('filterActive')], ['empty', t('filterEmpty')]];
      return h('div', { className: 'cp-page' },
        h('header', { className: 'cp-head' },
          h('div', null,
            h('h1', { className: 'cp-title' }, h(FolderIcon, { size: 22 }), t('title')),
            h('p', { className: 'cp-sub' }, t('subtitle'))),
          h('button', { type: 'button', className: 'cp-btn', onClick: () => setNow(Date.now()) }, t('refresh'))),
        h('section', { className: 'cp-metrics' },
          h(Metric, { label: t('workspaces'), value: String(groups.length) }),
          h(Metric, { label: t('sessions'), value: String(totalSessions) })),
        h('div', { className: 'cp-note' }, h('span', null, t('filesUnavailable'))),
        h('div', { className: 'cp-toolbar' },
          chips.map(([key, label]) => h('button', { key, type: 'button', className: 'cp-chip', 'aria-pressed': filter === key ? 'true' : 'false', onClick: () => setFilter(key) }, label)),
          h('input', { type: 'search', className: 'cp-search', placeholder: t('searchHint'), value: query, onChange: (e) => setQuery(e.target.value) })),
        groups.length === 0
          ? h('div', { className: 'cp-empty' }, snapshot.phase === 'pending' ? t('loading') : t('noWorkspaces'))
          : visible.length === 0
            ? h('div', { className: 'cp-empty' }, t('empty'))
            : h('div', { className: 'cp-list' }, visible.map((group) => h(WorkspaceCard, {
                key: group.id, group, t, now, ctx,
                expanded: expanded[group.id] === true,
                onToggle: () => setExpanded(Object.assign({}, expanded, { [group.id]: expanded[group.id] !== true })),
              }))));
    }

    function PanelGlyph({ size }) {
      return h('span', { className: 'cp-fallback' }, h(FolderIcon, { size: 16 }));
    }

    function view(Component, ctx, t, fill) {
      function CheckpointView(props) {
        return h(Guard, { t }, h(Component, Object.assign({}, props, { ctx, t })));
      }
      CheckpointView.displayName = 'CheckpointView';
      return CheckpointView;
    }

    function apply(ctx) {
      const t = makeTranslator();
      ctx.effect(() => ctx.slots.inject(MAIN_SLOT, () => ctx.slots.register({ name: MAIN_SLOT, key: PANEL_ID }, view(Panel, ctx, t, true))), 'checkpoint: panel');
      ctx.effect(() => ctx.slots.inject(RAIL_SLOT, () => ctx.slots.register({ name: RAIL_SLOT, id: PANEL_ID, order: 90, label: () => t('title') }, view(PanelGlyph, ctx, t, false))), 'checkpoint: sidebar entry');
    }

    return { name: 'checkpoint', inject: ['slots', 'layout', 'workspaces', 'uiWorkspace'], apply };
  },
});

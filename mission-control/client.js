window.__ModuleLoader__.load({
  id: '@local/mission-control',
  factory(require) {
    const React = require('react');
    const h = React.createElement;
    const { useEffect, useMemo, useRef, useState } = React;

    /**
     * Slots this bundle occupies. The sidebar row is the panel SWITCHER entry
     * (the host sidebar owns the button and its label); the main seat is the
     * dashboard itself.
     */
    const PANEL_ID = 'mission-control';
    const RAIL_SLOT = 'sidebar.panellist';
    const MAIN_SLOT = 'main';

    /* ------------------------------------------------------------------ i18n */

    const MESSAGES = {
      es: {
        title: 'Mission Control',
        subtitle: 'Sesiones, tareas y coste de DeepSeek Harness',
        filterAll: 'Todas',
        filterActive: 'Activas',
        filterDone: 'Completadas',
        filterIdle: 'Inactivas',
        searchLabel: 'Buscar sesiones',
        searchHint: 'Buscar sesión o tarea…',
        refresh: 'Actualizar',
        metricSessions: 'Sesiones',
        metricRunning: 'Trabajando',
        metricTasks: 'Tareas hechas',
        metricBudget: 'Barra de sesiones',
        statusRunning: 'Trabajando',
        statusWaiting: 'Esperando',
        statusCompleted: 'Completado',
        statusError: 'Error',
        statusInactive: 'Inactivo',
        taskTimer: 'Tarea actual',
        sessionTimer: 'Sesión',
        noTask: 'Sin tarea en curso',
        noTitle: 'Sesión sin título',
        tasks: 'tareas',
        tokens: 'tokens',
        noMetrics: 'Sin métricas',
        activity: 'Actividad reciente',
        noActivity: 'Sin actividad registrada',
        open: 'Ir',
        openTitle: 'Abrir esta sesión en el chat',
        planTurbo: 'Sin cambios',
        sectionRoot: 'Objetivo (aprox.)',
        moreInProgress: 'más',
        showPlan: 'Ver plan',
        hidePlan: 'Ocultar plan',
        planTitle: 'Plan de tareas',
        riskErrorPending: 'Error con pendientes',
        riskNoPlan: 'Sin plan de tareas',
        riskFrozen: 'Plan congelado',
        riskRewritten: 'Plan ampliado',
        riskRepeated: 'Tareas repetidas',
        riskMonitoring: 'Plan completado, sigue activo',
        riskFrozenHint: 'La lista de tareas no cambia desde hace un tiempo mientras la sesión sigue trabajando.',
        riskShrunkHint: 'Además, el plan ha encogido sin completar tareas: se reescribió.',
        riskNoPlanHint: 'La sesión está trabajando sin una lista de tareas que la guíe.',
        riskErrorPendingHint: 'La última ejecución falló dejando tareas sin completar.',
        riskRewrittenHint: 'El plan ha crecido sin avanzar: posible ampliación de alcance.',
        riskRepeatedHint: 'Hay tareas con el mismo texto repetido.',
        riskMonitoringHint: 'Todas las tareas están completadas pero la sesión sigue marcada como activa.',
        statStalled: 'estancadas',
        metricStalled: 'Sesiones estancadas',
        modelCostly: 'modelo de coste alto',
        provider: 'proveedor',
        sectionSession: 'Sesión',
        empty: 'Ninguna sesión coincide con el filtro',
        loading: 'Cargando sesiones…',
        estimate: 'est.',
        appError: 'Mission Control no pudo dibujar el panel',
        appErrorHint: 'Recarga la página; el resto de la aplicación sigue funcionando.',
      },
      en: {
        title: 'Mission Control',
        subtitle: 'DeepSeek Harness sessions, tasks and cost',
        filterAll: 'All',
        filterActive: 'Active',
        filterDone: 'Completed',
        filterIdle: 'Idle',
        searchLabel: 'Search sessions',
        searchHint: 'Search session or task…',
        refresh: 'Refresh',
        metricSessions: 'Sessions',
        metricRunning: 'Working',
        metricTasks: 'Tasks done',
        metricBudget: 'Session bar',
        statusRunning: 'Working',
        statusWaiting: 'Waiting',
        statusCompleted: 'Completed',
        statusError: 'Error',
        statusInactive: 'Inactive',
        taskTimer: 'Current task',
        sessionTimer: 'Session',
        noTask: 'No task in progress',
        noTitle: 'Untitled session',
        tasks: 'tasks',
        tokens: 'tokens',
        noMetrics: 'No metrics',
        activity: 'Recent activity',
        noActivity: 'No recorded activity',
        open: 'Go',
        openTitle: 'Open this session in the chat',
        planTurbo: 'Unchanged',
        sectionRoot: 'Goal (approx.)',
        moreInProgress: 'more',
        showPlan: 'Show plan',
        hidePlan: 'Hide plan',
        planTitle: 'Task plan',
        riskErrorPending: 'Error with pending work',
        riskNoPlan: 'No task plan',
        riskFrozen: 'Plan stalled',
        riskRewritten: 'Plan expanded',
        riskRepeated: 'Repeated tasks',
        riskMonitoring: 'Plan complete, still active',
        riskFrozenHint: 'The task list has not changed for a while while the session keeps working.',
        riskShrunkHint: 'The plan also shrank without completing tasks: it was rewritten.',
        riskNoPlanHint: 'The session is working without a task list to guide it.',
        riskErrorPendingHint: 'The last run failed leaving tasks unfinished.',
        riskRewrittenHint: 'The plan grew without progress: possible scope creep.',
        riskRepeatedHint: 'Some tasks share the same text.',
        riskMonitoringHint: 'Every task is complete but the session still reads as active.',
        statStalled: 'stalled',
        metricStalled: 'Stalled sessions',
        modelCostly: 'high-cost model',
        provider: 'provider',
        sectionSession: 'Session',
        empty: 'No session matches the filter',
        loading: 'Loading sessions…',
        estimate: 'est.',
        appError: 'Mission Control could not render the panel',
        appErrorHint: 'Reload the page; the rest of the application keeps working.',
      },
    };

    function makeTranslator() {
      // `window.__missionControlTestKeys` makes every label render as its key,
      // so automated checks assert on stable identifiers instead of prose.
      if (typeof window !== 'undefined' && window.__missionControlTestKeys === true) {
        return (key) => key;
      }
      let locale = 'es';
      try {
        const lang = String(navigator.language || 'es').slice(0, 2).toLowerCase();
        if (MESSAGES[lang] !== undefined) locale = lang;
      } catch (_) { /* keep the Spanish default */ }
      const table = MESSAGES[locale];
      return (key) => (table[key] === undefined ? key : table[key]);
    }

    /* ----------------------------------------------------------- formatting */

    const pad = (value) => String(value).padStart(2, '0');

    function formatDuration(ms) {
      if (!Number.isFinite(ms) || ms < 0) return '—';
      const total = Math.floor(ms / 1000);
      const min = Math.floor(total / 60) % 60;
      const hr = Math.floor(total / 3600);
      return hr > 0 ? `${hr}:${pad(min)}:${pad(total % 60)}` : `${min}:${pad(total % 60)}`;
    }

    function formatCompact(value) {
      const n = Number(value) || 0;
      if (n >= 1e6) return `${(n / 1e6).toFixed(1)}M`;
      if (n >= 1e3) return `${(n / 1e3).toFixed(1)}k`;
      return String(Math.round(n));
    }

    function relativeTime(time, now) {
      if (!Number.isFinite(time)) return undefined;
      const sec = Math.max(0, Math.round((now - time) / 1000));
      if (sec < 60) return `${sec}s`;
      if (sec < 3600) return `${Math.floor(sec / 60)}m`;
      if (sec < 86400) return `${Math.floor(sec / 3600)}h`;
      return `${Math.floor(sec / 86400)}d`;
    }

    const asMillis = (value) => (Number.isFinite(value) ? value : undefined);
    const same = (left, right) => Object.is(left, right);
    const EMPTY_CATALOG = { ids: [], byId: {}, projectionsBySession: {}, phase: 'pending' };

    /* ------------------------------------------------------- styles (tokens) */

    const FONT = 'system-ui,-apple-system,"Segoe UI",Roboto,sans-serif';
    const MONO = 'ui-monospace,SFMono-Regular,Menlo,Consolas,monospace';
    const CSS = `
.mc-page{display:flex;flex-direction:column;gap:16px;min-height:100%;box-sizing:border-box;
padding:calc(var(--dsh-frame-top-clearance,0px) + 22px) 26px 30px;font:14px/1.45 ${FONT};
color:var(--dsw-alias-label-primary,var(--dsw-alias-text-primary,inherit));background:var(--dsw-alias-bg-primary,transparent);}
.mc-head{display:flex;align-items:flex-start;gap:12px;}
.mc-title{display:flex;align-items:center;gap:10px;margin:0;font-size:20px;font-weight:600;letter-spacing:.01em;}
.mc-sub{margin:4px 0 0;font-size:12.5px;color:var(--dsw-alias-label-secondary,inherit);}
.mc-grow{flex:1 1 auto;}
.mc-btn{display:inline-flex;align-items:center;justify-content:center;height:32px;padding:0 12px;border-radius:8px;cursor:pointer;
font:inherit;font-size:13px;color:var(--dsw-alias-label-primary,inherit);border:.5px solid var(--dsw-alias-border-l3,currentColor);
background:var(--dsw-alias-button-elevated-fill,transparent);}
.mc-btn:hover{background:var(--dsw-alias-button-floating-hover,var(--dsw-alias-interactive-bg-hover,transparent));}
.mc-metrics{display:grid;grid-template-columns:repeat(auto-fit,minmax(150px,1fr));gap:12px;}
.mc-metric{padding:12px 14px;border-radius:10px;border:.5px solid var(--dsw-alias-border-l3,rgba(127,127,127,.28));
background:var(--dsw-alias-bg-l2,transparent);}
.mc-metric small{display:block;font-size:11px;text-transform:uppercase;letter-spacing:.07em;color:var(--dsw-alias-label-secondary,inherit);}
.mc-metric strong{display:block;margin-top:4px;font-size:22px;font-weight:600;font-variant-numeric:tabular-nums;}
.mc-toolbar{display:flex;flex-wrap:wrap;align-items:center;gap:8px;}
.mc-chip{height:28px;padding:0 12px;border-radius:999px;cursor:pointer;font:inherit;font-size:12.5px;
color:var(--dsw-alias-label-secondary,inherit);border:.5px solid var(--dsw-alias-border-l3,currentColor);background:transparent;}
.mc-chip[aria-pressed="true"]{font-weight:600;color:var(--dsw-alias-label-primary,inherit);
background:var(--dsw-alias-interactive-bg-hover,rgba(127,127,127,.16));}
.mc-search{height:30px;min-width:210px;padding:0 10px;border-radius:8px;font:inherit;font-size:13px;
color:var(--dsw-alias-label-primary,inherit);border:.5px solid var(--dsw-alias-border-l3,currentColor);background:transparent;}
.mc-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(330px,1fr));gap:12px;align-items:start;}
.mc-card{display:flex;flex-direction:column;gap:10px;padding:14px;border-radius:10px;
border:.5px solid var(--dsw-alias-border-l3,rgba(127,127,127,.28));background:var(--dsw-alias-bg-l2,transparent);}
.mc-card[data-running="true"]{border-color:var(--dsw-alias-state-business-primary,currentColor);}
.mc-card-top{display:flex;align-items:center;gap:8px;}
.mc-card-title{flex:1;min-width:0;font-size:14px;font-weight:600;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;}
.mc-badge{display:inline-flex;align-items:center;gap:5px;height:20px;padding:0 8px;border-radius:999px;font-size:11px;font-weight:600;white-space:nowrap;}
.mc-badge i{width:6px;height:6px;border-radius:50%;background:currentColor;}
.mc-s-running{background:rgba(63,208,201,.16);color:#1f9b94;}
.mc-s-waiting{background:rgba(214,158,46,.18);color:#9c6d10;}
.mc-s-completed{background:rgba(76,190,113,.18);color:#2f7847;}
.mc-s-error{background:rgba(226,74,74,.18);color:#b73131;}
.mc-s-inactive{background:rgba(127,127,127,.16);color:var(--dsw-alias-label-secondary,inherit);}
.mc-meta{display:flex;flex-wrap:wrap;gap:10px;font-size:12px;color:var(--dsw-alias-label-secondary,inherit);min-width:0;}
.mc-meta span{overflow:hidden;text-overflow:ellipsis;white-space:nowrap;max-width:100%;}
.mc-model{font-family:${MONO};font-size:11.5px;}
.mc-task{font-size:12.5px;padding:8px 10px;border-radius:8px;overflow:hidden;display:-webkit-box;-webkit-line-clamp:2;
-webkit-box-orient:vertical;background:var(--dsw-alias-bg-l1,rgba(127,127,127,.08));}
.mc-timers{display:grid;grid-template-columns:1fr 1fr;gap:8px;}
.mc-timer{padding:8px 10px;border-radius:8px;border:.5px solid var(--dsw-alias-border-l3,rgba(127,127,127,.24));
background:var(--dsw-alias-bg-l1,rgba(127,127,127,.08));}
.mc-timer small{display:block;font-size:10px;text-transform:uppercase;letter-spacing:.07em;color:var(--dsw-alias-label-secondary,inherit);}
.mc-timer strong{font-family:${MONO};font-size:17px;font-weight:600;font-variant-numeric:tabular-nums;}
.mc-stats{display:flex;flex-wrap:wrap;gap:6px;font-size:11.5px;}
.mc-stat{padding:2px 8px;border-radius:6px;color:var(--dsw-alias-label-secondary,inherit);background:var(--dsw-alias-bg-l1,rgba(127,127,127,.1));}
.mc-card-foot{display:flex;align-items:flex-end;gap:10px;}
.mc-card-foot .mc-stats{flex:1;min-width:0;}
.mc-open{flex:none;display:inline-flex;align-items:center;justify-content:center;height:28px;padding:0 14px;border-radius:999px;
cursor:pointer;font:inherit;font-size:12.5px;font-weight:600;color:var(--dsw-alias-label-primary-inverted,#0b1a18);
background:var(--dsw-alias-label-primary,currentColor);border:none;}
.mc-open:hover{opacity:.88;}
.mc-act{display:flex;flex-direction:column;gap:2px;font-size:11.5px;color:var(--dsw-alias-label-secondary,inherit);}
.mc-act-row{display:flex;gap:8px;min-width:0;}
.mc-act-row span,.mc-act-row code{white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}
.mc-act-row code{font-family:${MONO};font-size:11px;}
.mc-empty{padding:48px 16px;text-align:center;color:var(--dsw-alias-label-secondary,inherit);}
.mc-risk{display:inline-flex;align-items:center;gap:5px;height:20px;padding:0 8px;border-radius:999px;font-size:11px;font-weight:600;white-space:nowrap;}
.mc-risk i{width:6px;height:6px;border-radius:50%;background:currentColor;}
.mc-risk-error{background:rgba(226,74,74,.2);color:#b73131;}
.mc-risk-warn{background:rgba(214,158,46,.2);color:#9c6d10;}
.mc-risk-info{background:rgba(127,127,127,.18);color:var(--dsw-alias-label-secondary,inherit);}
.mc-card[data-stalled="true"]{border-color:rgba(214,158,46,.75);}
.mc-task-now{display:flex;align-items:baseline;gap:6px;min-width:0;}
.mc-task-now>span{overflow:hidden;text-overflow:ellipsis;white-space:nowrap;}
.mc-task-extra{flex:none;font-size:11px;font-style:normal;padding:0 6px;border-radius:999px;
background:var(--dsw-alias-bg-l1,rgba(127,127,127,.14));color:var(--dsw-alias-label-secondary,inherit);}
.mc-task-next{display:flex;align-items:baseline;gap:6px;margin-top:4px;font-size:12px;
color:var(--dsw-alias-label-secondary,inherit);min-width:0;}
.mc-task-next>span:last-child{overflow:hidden;text-overflow:ellipsis;white-space:nowrap;}
.mc-progress{height:4px;border-radius:999px;overflow:hidden;background:var(--dsw-alias-bg-l1,rgba(127,127,127,.16));}
.mc-progress-fill{height:100%;border-radius:999px;background:var(--dsw-alias-state-business-primary,currentColor);transition:width .25s ease;}
.mc-stat-alert{color:#9c6d10;font-weight:600;}
.mc-metric-alert strong{color:#9c6d10;}
.mc-plan{display:flex;flex-direction:column;gap:8px;}
.mc-plan-toggle{align-self:flex-start;height:24px;padding:0 10px;border-radius:999px;cursor:pointer;font:inherit;font-size:11.5px;
color:var(--dsw-alias-label-secondary,inherit);border:.5px solid var(--dsw-alias-border-l3,currentColor);background:transparent;}
.mc-plan-body{display:flex;flex-direction:column;gap:8px;padding:10px;border-radius:8px;
background:var(--dsw-alias-bg-l1,rgba(127,127,127,.08));}
.mc-plan-root{display:flex;flex-direction:column;gap:2px;font-size:12px;}
.mc-plan-root small{font-size:10px;text-transform:uppercase;letter-spacing:.07em;color:var(--dsw-alias-label-secondary,inherit);}
.mc-plan-root span{overflow:hidden;text-overflow:ellipsis;white-space:nowrap;}
.mc-todos{list-style:none;margin:0;padding:0;display:flex;flex-direction:column;gap:3px;}
.mc-todo{display:flex;align-items:baseline;gap:7px;font-size:12px;min-width:0;}
.mc-todo-mark{flex:none;width:12px;text-align:center;color:var(--dsw-alias-label-secondary,inherit);}
.mc-todo-text{overflow:hidden;text-overflow:ellipsis;white-space:nowrap;}
.mc-todo[data-status="completed"]{opacity:.6;}
.mc-todo[data-status="completed"] .mc-todo-text{text-decoration:line-through;}
.mc-todo[data-status="in_progress"]{font-weight:600;}
.mc-plan-more{font-size:11px;color:var(--dsw-alias-label-secondary,inherit);}
.mc-fallback{display:inline-flex;align-items:center;justify-content:center;width:16px;height:16px;color:inherit;}
.mc-btn:focus-visible,.mc-chip:focus-visible,.mc-search:focus-visible{outline:var(--dsw-focus-ring-width,2px) solid var(--dsw-focus-ring-color,currentColor);outline-offset:2px;}
`;

    function Styles() {
      return h('style', { 'data-mission-control': '' }, CSS);
    }

    function Alarm({ size }) {
      return h('svg', { width: size, height: size, viewBox: '0 0 24 24', fill: 'none', 'aria-hidden': 'true', focusable: 'false', style: { display: 'block' } },
        h('circle', { cx: 12, cy: 13, r: 8, stroke: 'currentColor', strokeWidth: 1.7 }),
        h('path', { d: 'M12 9.4V13l2.6 1.7', stroke: 'currentColor', strokeWidth: 1.7, strokeLinecap: 'round', strokeLinejoin: 'round' }),
        h('path', { d: 'M6.2 8.4 4.6 6.8M17.8 8.4l1.6-1.6', stroke: 'currentColor', strokeWidth: 1.7, strokeLinecap: 'round' }));
    }

    /* -------------------------------------------------------- error guard */

    class Guard extends React.Component {
      constructor(props) {
        super(props);
        this.state = { failed: false };
      }
      static getDerivedStateFromError(error) {
        // The host reports the crash itself; keep the cause discoverable.
        if (typeof console !== 'undefined') console.error('[mission-control] render failed', error);
        if (typeof window !== 'undefined') window.__missionControlError = String((error && error.stack) || error);
        return { failed: true };
      }
      render() {
        if (this.state.failed) {
          return h('div', { className: 'mc-page' },
            h('div', { className: 'mc-empty' },
              h('strong', null, this.props.t('appError')),
              h('div', null, this.props.t('appErrorHint'))));
        }
        return this.props.children;
      }
    }

    /* -------------------------------------------------------- data access */

    /**
     * `ctx.sessions` is the public client Session service (published by
     * @deepseek-ai/dsh-client-ui-session). It is listed in `inject`, so a
     * missing one keeps this bundle inactive instead of rendering half a page;
     * the guard below only keeps a teardown race from throwing.
     */
    function useSessionService(ctx) {
      return ctx.sessions === undefined ? undefined : ctx.sessions;
    }

    function sameCatalog(left, right) {
      return left !== null && right !== null
        && left.ids === right.ids
        && left.byId === right.byId
        && left.projectionsBySession === right.projectionsBySession
        && left.phase === right.phase;
    }

    /**
     * Catalog snapshot: ids, summaries and the projection values each summary
     * carries. The store publishes a new object per change, so an unchanged
     * reference keeps React from re-rendering this subtree.
     */
    function useCatalog(service) {
      const [snapshot, setSnapshot] = useState(() => (service === undefined ? undefined : service.list.getSnapshot()));
      useEffect(() => {
        if (service === undefined) return undefined;
        const read = () => service.list.getSnapshot();
        setSnapshot((previous) => {
          const next = read();
          return sameCatalog(previous, next) ? previous : next;
        });
        return service.list.subscribe(() => {
          setSnapshot((previous) => {
            const next = read();
            return sameCatalog(previous, next) ? previous : next;
          });
        });
      }, [service]);
      return snapshot === undefined || snapshot === null ? EMPTY_CATALOG : snapshot;
    }

    /* ------------------------------------------------------ reading values */

    /**
     * Fold one `todos` projection into the plan facts the card shows. The
     * projection is the latest whole-list snapshot, so everything here is a
     * pure read of published state.
     */
    function readPlan(value) {
      const plan = {
        items: [],
        total: 0,
        done: 0,
        current: undefined,
        next: undefined,
        extraInProgress: 0,
        root: undefined,
        repeated: 0,
        empty: true,
      };
      if (!Array.isArray(value)) return plan;
      const seen = new Map();
      let firstPending;
      let firstText;
      for (const item of value) {
        if (item === null || typeof item !== 'object') continue;
        const text = typeof item.content === 'string' ? item.content.trim() : '';
        if (text.length === 0) continue;
        const status = item.status === 'completed' || item.status === 'in_progress' ? item.status : 'pending';
        plan.items.push({ text, status });
        plan.total += 1;
        if (firstText === undefined) firstText = text;
        if (status === 'completed') plan.done += 1;
        if (status === 'in_progress') {
          if (plan.current === undefined) plan.current = text;
          else plan.extraInProgress += 1;
        }
        if (status === 'pending' && firstPending === undefined) firstPending = text;
        const normalized = text.toLowerCase();
        seen.set(normalized, (seen.get(normalized) || 0) + 1);
      }
      for (const count of seen.values()) if (count > 1) plan.repeated += 1;
      plan.empty = plan.total === 0;
      plan.next = firstPending;
      plan.root = plan.current !== firstText && plan.total > 1 ? firstText : undefined;
      return plan;
    }

    function readModel(values) {
      const header = values.requestHeader;
      const config = header !== null && typeof header === 'object' ? header.config : undefined;
      if (config === null || typeof config !== 'object') return {};
      return {
        provider: typeof config.provider === 'string' ? config.provider : undefined,
        model: typeof config.model === 'string' ? config.model : undefined,
        effort: typeof config.reasoningEffort === 'string' ? config.reasoningEffort : undefined,
      };
    }

    function readUsage(values) {
      const usage = values.usage;
      if (usage === null || typeof usage !== 'object') return undefined;
      const input = Number(usage.inputTokens);
      const output = Number(usage.outputTokens);
      if (!Number.isFinite(input) && !Number.isFinite(output)) return undefined;
      return {
        input: Number.isFinite(input) ? input : 0,
        output: Number.isFinite(output) ? output : 0,
      };
    }

    function statusOf(running, pendingInteraction, lastAgentError) {
      if (running) return pendingInteraction === undefined || pendingInteraction === null ? 'running' : 'waiting';
      if (lastAgentError !== undefined && lastAgentError !== null) return 'error';
      return 'inactive';
    }

    /**
     * Risk signals in precedence order: the card shows the first one found.
     * `errorPending` and `noPlan` come first because they change what the user
     * should do; `rewritten` is the weakest and is reported as context only.
     */
    function riskOf(row, plan, prev, now, staleMs) {
      const pending = plan.total - plan.done;
      if (row.lastError !== undefined && row.lastError !== null && pending > 0) {
        return { kind: 'errorPending', pending };
      }
      if (row.running && plan.empty) return { kind: 'noPlan' };
      if (row.running && plan.total > 0 && pending === 0) return { kind: 'monitoring' };
      if (row.running && pending > 0) {
        const since = prev !== undefined && prev.changedAt !== undefined ? prev.changedAt : row.seenSince;
        const frozenFor = since === undefined ? 0 : now - since;
        if (frozenFor >= staleMs) {
          return {
            kind: 'frozen',
            since,
            shrunk: prev !== undefined && prev.total !== undefined && plan.total < prev.total && prev.done === plan.done,
          };
        }
      }
      if (prev !== undefined && prev.total !== undefined && plan.total > prev.total && plan.done === prev.done && row.running) {
        return { kind: 'rewritten' };
      }
      if (plan.repeated > 0) return { kind: 'repeated', count: plan.repeated };
      return undefined;
    }

    /**
     * Track the previous plan per session so staleness is measured against the
     * last time the list actually changed. The map lives in the Dashboard and
     * is pruned to the sessions currently listed.
     */
    function observePlans(plans, catalog, now) {
      const ids = Array.isArray(catalog.ids) ? catalog.ids : [];
      const projections = catalog.projectionsBySession || {};
      const live = new Set(ids);
      for (const id of Array.from(plans.keys())) if (!live.has(id)) plans.delete(id);
      for (const id of ids) {
        const raw = projections[id];
        const values = raw !== null && typeof raw === 'object' && raw.values !== null && typeof raw.values === 'object' ? raw.values : undefined;
        if (values === undefined) continue;
        const todos = values.todos;
        const previous = plans.get(id);
        const signature = JSON.stringify(Array.isArray(todos) ? todos : null);
        if (previous === undefined) {
          // First sighting after a mount is a baseline only when nothing was
          // remembered; otherwise keep the remembered change time so the clock
          // survives a re-mount (panel switch, host re-render).
          plans.set(id, {
            signature,
            changedAt: readRememberedClock(id, signature, now),
            total: Array.isArray(todos) ? todos.length : 0,
            done: countDone(todos),
          });
          continue;
        }
        if (previous.signature !== signature) {
          previous.signature = signature;
          previous.changedAt = now;
          previous.total = Array.isArray(todos) ? todos.length : 0;
          previous.done = countDone(todos);
        }
        rememberClock(id, previous.signature, previous.changedAt);
      }
      return plans;
    }

    /** Session-scoped change times survive a panel re-mount; storage is optional. */
    const CLOCK_KEY = 'mission-control.plan-clock.v1';

    function storage() {
      try {
        return typeof window !== 'undefined' && window.sessionStorage !== undefined ? window.sessionStorage : undefined;
      } catch (_) {
        return undefined;
      }
    }

    function readClocks() {
      const store = storage();
      if (store === undefined) return {};
      try {
        const raw = store.getItem(CLOCK_KEY);
        return raw === null ? {} : JSON.parse(raw);
      } catch (_) {
        return {};
      }
    }

    function readRememberedClock(id, signature, now) {
      const remembered = readClocks()[id];
      if (remembered !== undefined && remembered !== null && remembered.signature === signature && Number.isFinite(remembered.changedAt)) {
        return remembered.changedAt;
      }
      rememberClock(id, signature, now);
      return now;
    }

    function rememberClock(id, signature, changedAt) {
      const store = storage();
      if (store === undefined) return;
      const clocks = readClocks();
      const current = clocks[id];
      if (current !== undefined && current !== null && current.signature === signature && current.changedAt === changedAt) return;
      clocks[id] = { signature, changedAt };
      try {
        store.setItem(CLOCK_KEY, JSON.stringify(clocks));
      } catch (_) { /* quota or privacy mode: the in-memory map still works */ }
    }

    function countDone(todos) {
      if (!Array.isArray(todos)) return 0;
      let done = 0;
      for (const item of todos) if (item !== null && typeof item === 'object' && item.status === 'completed') done += 1;
      return done;
    }

    function buildRows(catalog, plans, now, staleMs, t) {
      const rows = [];
      const ids = Array.isArray(catalog.ids) ? catalog.ids : [];
      const byId = catalog.byId || {};
      const projections = catalog.projectionsBySession || {};
      for (const id of ids) {
        const summary = byId[id];
        if (summary === null || typeof summary !== 'object') continue;
        if (summary.blank === true || summary.origin === 'subagent') continue;
        const raw = projections[id];
        const values = raw !== null && typeof raw === 'object' && raw.values !== null && typeof raw.values === 'object' ? raw.values : {};
        const plan = readPlan(values.todos);
        const model = readModel(values);
        const usage = readUsage(values);
        const running = summary.running === true;
        const lastError = summary.lastAgentError;
        const title = typeof summary.title === 'string' && summary.title.length > 0
          ? summary.title
          : (typeof summary.displayTitle === 'string' && summary.displayTitle.length > 0 ? summary.displayTitle : t('noTitle'));
        const prev = plans.get(id);
        const row = {
          id,
          title,
          cwd: typeof summary.cwd === 'string' ? summary.cwd : undefined,
          model: model.model,
          provider: model.provider,
          effort: model.effort,
          running,
          lastError,
          status: statusOf(running, undefined, lastError),
          plan,
          task: plan.current,
          tasksDone: plan.done,
          tasksTotal: plan.total,
          planChangedAt: prev === undefined ? undefined : prev.changedAt,
          seenSince: now,
          usage,
          createdAt: asMillis(summary.createdAt),
          updatedAt: asMillis(summary.updatedAt),
        };
        row.risk = riskOf(row, plan, prev, now, staleMs);
        row.stalled = row.risk !== undefined && (row.risk.kind === 'frozen' || row.risk.kind === 'noPlan');
        rows.push(row);
      }
      rows.sort((left, right) => riskRank(left) - riskRank(right)
        || Number(right.running) - Number(left.running)
        || (right.updatedAt || 0) - (left.updatedAt || 0));
      return rows;
    }

    /** Ascending display order: the first signal a user should look at comes first. */
    function riskRank(row) {
      if (row.risk === undefined) return 40;
      switch (row.risk.kind) {
        case 'errorPending': return 0;
        case 'frozen': return 10;
        case 'noPlan': return 20;
        case 'rewritten': return 30;
        case 'repeated': return 35;
        default: return 40;
      }
    }

    /* ------------------------------------------------------------- views */

    const STATUS_CLASS = {
      running: 'mc-s-running',
      waiting: 'mc-s-waiting',
      completed: 'mc-s-completed',
      error: 'mc-s-error',
      inactive: 'mc-s-inactive',
    };

    const STATUS_KEY = {
      running: 'statusRunning',
      waiting: 'statusWaiting',
      completed: 'statusCompleted',
      error: 'statusError',
      inactive: 'statusInactive',
    };

    function Badge({ status, t }) {
      const key = STATUS_KEY[status] === undefined ? 'statusInactive' : STATUS_KEY[status];
      return h('span', { className: `mc-badge ${STATUS_CLASS[status] || STATUS_CLASS.inactive}` },
        h('i', { 'aria-hidden': 'true' }), t(key));
    }

    const RISK_STYLE = {
      errorPending: 'mc-risk-error',
      noPlan: 'mc-risk-warn',
      frozen: 'mc-risk-warn',
      rewritten: 'mc-risk-info',
      repeated: 'mc-risk-info',
      monitoring: 'mc-risk-info',
    };

    const RISK_KEY = {
      errorPending: 'riskErrorPending',
      noPlan: 'riskNoPlan',
      frozen: 'riskFrozen',
      rewritten: 'riskRewritten',
      repeated: 'riskRepeated',
      monitoring: 'riskMonitoring',
    };

    const RISK_HINT = {
      errorPending: 'riskErrorPendingHint',
      noPlan: 'riskNoPlanHint',
      frozen: 'riskFrozenHint',
      rewritten: 'riskRewrittenHint',
      repeated: 'riskRepeatedHint',
      monitoring: 'riskMonitoringHint',
    };

    /** The single most important signal, rendered as one chip with a tooltip. */
    function RiskChip({ risk, t }) {
      if (risk === undefined) return null;
      const label = t(RISK_KEY[risk.kind]);
      const detail = risk.kind === 'errorPending'
        ? `${t(RISK_HINT[risk.kind])} (${risk.pending})`
        : (risk.kind === 'frozen' && risk.shrunk ? `${t(RISK_HINT[risk.kind])} ${t('riskShrunkHint')}` : t(RISK_HINT[risk.kind]));
      return h('span', { className: `mc-risk ${RISK_STYLE[risk.kind] || 'mc-risk-info'}`, title: detail },
        h('i', { 'aria-hidden': 'true' }), label);
    }

    function TodoRow({ item, index }) {
      const mark = item.status === 'completed' ? '☑' : item.status === 'in_progress' ? '▶' : '☐';
      return h('li', { className: 'mc-todo', 'data-status': item.status, key: `${index}-${item.text}` },
        h('span', { className: 'mc-todo-mark', 'aria-hidden': 'true' }, mark),
        h('span', { className: 'mc-todo-text', title: item.text }, item.text));
    }

    /** Collapsed by default: the plan is context, not the primary reading. */
    function PlanDisclosure({ row, t }) {
      const [open, setOpen] = useState(false);
      const plan = row.plan;
      if (plan === undefined || plan.total === 0) return null;
      const items = plan.items.slice(0, 12);
      return h('div', { className: 'mc-plan' },
        h('button', {
          type: 'button',
          className: 'mc-plan-toggle',
          'aria-expanded': open ? 'true' : 'false',
          onClick: () => setOpen(!open),
        }, open ? t('hidePlan') : `${t('showPlan')} (${plan.total})`),
        open
          ? h('div', { className: 'mc-plan-body' },
              row.plan.root === undefined ? null : h('div', { className: 'mc-plan-root' },
                h('small', null, t('sectionRoot')),
                h('span', { title: row.plan.root }, row.plan.root)),
              h('ul', { className: 'mc-todos', 'aria-label': t('planTitle') }, items.map((item, index) => h(TodoRow, { item, index }))),
              plan.total > items.length ? h('div', { className: 'mc-plan-more' }, `+${plan.total - items.length}`) : null)
          : null);
    }

    /**
     * `ctx.uiWorkspace.openSession(id)` selects the Session and shows its
     * Conversation as one navigation action; any current main panel yields to it.
     */
    function openSession(ctx, id) {
      const service = ctx.uiWorkspace;
      if (service === undefined || service === null || typeof service.openSession !== 'function') {
        if (typeof console !== 'undefined') console.warn('[mission-control] session navigation is unavailable in this profile');
        return;
      }
      try {
        const result = service.openSession(id);
        if (result !== undefined && result !== null && typeof result.then === 'function') {
          result.then(undefined, (error) => {
            if (typeof console !== 'undefined') console.warn('[mission-control] openSession failed', error);
          });
        }
      } catch (error) {
        if (typeof console !== 'undefined') console.warn('[mission-control] openSession failed', error);
      }
    }

    /** One line under the title: what runs now and what comes next. */
    function TaskLines({ row, t }) {
      const plan = row.plan;
      if (plan === undefined || plan.total === 0) {
        return h('div', { className: 'mc-task' }, t('noPlan'));
      }
      const current = plan.current;
      const next = plan.next;
      const finished = plan.done === plan.total;
      const extra = plan.extraInProgress > 0 ? `+${plan.extraInProgress} ${t('moreInProgress')}` : undefined;
      return h('div', { className: 'mc-task' },
        h('div', { className: 'mc-task-now' },
          current === undefined
            ? (finished ? t('statusCompleted') : t('noTask'))
            : h('span', { title: current }, current),
          extra === undefined ? null : h('em', { className: 'mc-task-extra' }, extra)),
        next === undefined ? null : h('div', { className: 'mc-task-next' },
          h('span', { 'aria-hidden': 'true' }, '→'),
          h('span', { title: next }, next)));
    }

    function SessionCard({ row, t, now, onOpen }) {
      const sessionElapsed = row.createdAt === undefined ? undefined : now - row.createdAt;
      // The host publishes no per-task start, so this clock measures how long
      // the plan has gone unchanged, and says so.
      const planElapsed = row.running && row.planChangedAt !== undefined ? now - row.planChangedAt : undefined;
      const planPending = row.tasksTotal - row.tasksDone;
      const stalled = row.risk !== undefined && row.risk.kind === 'frozen';
      const costly = row.model !== undefined && /pro/i.test(row.model);
      return h('article', {
        className: 'mc-card',
        'data-running': row.running ? 'true' : 'false',
        'data-stalled': stalled ? 'true' : 'false',
      },
        h('div', { className: 'mc-card-top' },
          h('span', { className: 'mc-card-title', title: row.title }, row.title),
          h(RiskChip, { risk: row.risk, t }),
          h(Badge, { status: row.status, t })),
        h('div', { className: 'mc-meta' },
          h('span', { className: 'mc-model', title: `${row.provider || ''}/${row.model || ''}` }, row.model || '—'),
          costly ? h('span', { className: 'mc-costly', title: t('modelCostly') }, '$$') : null,
          row.updatedAt === undefined ? null : h('span', null, relativeTime(row.updatedAt, now)),
          row.cwd === undefined ? null : h('span', { title: row.cwd }, row.cwd)),
        h(TaskLines, { row, t }),
        h('div', { className: 'mc-timers' },
          h('div', { className: 'mc-timer' },
            h('small', null, `${t('taskTimer')} · ${t('planTurbo')}`),
            h('strong', null, formatDuration(planElapsed))),
          h('div', { className: 'mc-timer' },
            h('small', null, t('sessionTimer')),
            h('strong', null, formatDuration(sessionElapsed)))),
        h('div', { className: 'mc-progress', role: 'img', 'aria-label': `${row.tasksDone}/${row.tasksTotal}` },
          h('div', {
            className: 'mc-progress-fill',
            style: { width: `${row.tasksTotal === 0 ? 0 : Math.round((row.tasksDone / row.tasksTotal) * 100)}%` },
          })),
        h('div', { className: 'mc-card-foot' },
          h('div', { className: 'mc-stats' },
            h('span', { className: 'mc-stat' }, `${row.tasksDone}${row.tasksTotal > 0 ? `/${row.tasksTotal}` : ''} ${t('tasks')}`),
            planPending > 1 && stalled ? h('span', { className: 'mc-stat mc-stat-alert' }, `${planPending} ${t('statStalled')}`) : null,
            row.usage === undefined
              ? h('span', { className: 'mc-stat' }, t('noMetrics'))
              : h('span', { className: 'mc-stat' }, `${formatCompact(row.usage.input)}/${formatCompact(row.usage.output)} ${t('tokens')}`)),
          h('button', {
            type: 'button',
            className: 'mc-open',
            title: t('openTitle'),
            'aria-label': `${t('openTitle')}: ${row.title}`,
            onClick: () => onOpen(row.id),
          }, t('open'))),
        h(PlanDisclosure, { row, t }));
    }

    function Metric({ label, value, alert }) {
      return h('div', { className: alert === true ? 'mc-metric mc-metric-alert' : 'mc-metric' },
        h('small', null, label),
        h('strong', null, value));
    }

    function Dashboard({ ctx, t }) {
      const service = useSessionService(ctx);
      const catalog = useCatalog(service);
      const [filter, setFilter] = useState('all');
      const [query, setQuery] = useState('');
      const [now, setNow] = useState(() => Date.now());

      // Observable proof that this component mounted inside the host page.
      if (typeof window !== 'undefined') window.__missionControlMounted = (window.__missionControlMounted || 0) + 1;

      // One observer for the whole panel: the plan-change clock has to outlive
      // individual card renders, so it lives in a ref keyed by session.
      const plans = useRef(new Map()).current;
      const staleMinutes = useConfigNumber(ctx, 'staleMinutes', 20);
      const staleMs = staleMinutes * 60000;

      // Recomputed whenever the catalog or the shared clock publishes; the map
      // only records when each plan last changed.
      const rows = useMemo(() => {
        observePlans(plans, catalog, Date.now());
        return buildRows(catalog, plans, now, staleMs, t);
      }, [catalog, t, staleMs, now]);

      const runningCount = rows.filter((row) => row.running).length;
      const stalledCount = rows.filter((row) => row.stalled).length;

      useEffect(() => {
        if (runningCount === 0) return undefined;
        const timer = setInterval(() => setNow(Date.now()), 1000);
        return () => clearInterval(timer);
      }, [runningCount]);

      const needle = query.trim().toLowerCase();
      const visible = rows.filter((row) => {
        if (needle.length > 0) {
          const planText = row.plan === undefined ? '' : row.plan.items.map((item) => item.text).join(' ');
          const haystack = `${row.title} ${row.model || ''} ${row.task || ''} ${planText}`.toLowerCase();
          if (!haystack.includes(needle)) return false;
        }
        if (filter === 'active') return row.running || row.status === 'error';
        if (filter === 'done') return !row.running && row.tasksTotal > 0 && row.tasksDone === row.tasksTotal;
        if (filter === 'idle') return !row.running;
        return true;
      });

      const tasksDone = rows.reduce((total, row) => total + row.tasksDone, 0);
      const chips = [['all', t('filterAll')], ['active', t('filterActive')], ['done', t('filterDone')], ['idle', t('filterIdle')]];
      const onRefresh = () => {
        setNow(Date.now());
        if (service === undefined || typeof service.refresh !== 'function') return;
        Promise.resolve(service.refresh()).catch(() => {});
      };

      return h('div', { className: 'mc-page' },
        h(Styles),
        h('header', { className: 'mc-head' },
          h('div', null,
            h('h1', { className: 'mc-title' },
              h('span', { 'aria-hidden': 'true', style: { display: 'inline-flex' } }, h(Alarm, { size: 22 })),
              t('title')),
            h('p', { className: 'mc-sub' }, t('subtitle'))),
          h('div', { className: 'mc-grow' }),
          h('button', { type: 'button', className: 'mc-btn', onClick: onRefresh }, t('refresh'))),
        h('section', { className: 'mc-metrics', 'aria-label': t('title') },
          h(Metric, { label: t('metricSessions'), value: String(rows.length) }),
          h(Metric, { label: t('metricRunning'), value: String(runningCount) }),
          h(Metric, { label: t('metricTasks'), value: String(tasksDone) }),
          h(Metric, {
            label: t('metricStalled'),
            value: String(stalledCount),
            alert: stalledCount > 0,
          })),
        h('div', { className: 'mc-toolbar' },
          chips.map(([key, label]) => h('button', {
            key, type: 'button', className: 'mc-chip',
            'aria-pressed': filter === key ? 'true' : 'false',
            onClick: () => setFilter(key),
          }, label)),
          h('div', { className: 'mc-grow' }),
          h('input', {
            type: 'search', className: 'mc-search',
            'aria-label': t('searchLabel'), placeholder: t('searchHint'),
            value: query, onChange: (event) => setQuery(event.target.value),
          })),
        rows.length === 0
          ? h('div', { className: 'mc-empty' }, catalog.phase === 'pending' ? t('loading') : t('empty'))
          : visible.length === 0
            ? h('div', { className: 'mc-empty' }, t('empty'))
            : h('div', { className: 'mc-grid' }, visible.map((row) => h(SessionCard, {
                key: row.id,
                row,
                t,
                now,
                onOpen: (id) => openSession(ctx, id),
              }))));
    }

    /** Optional numeric knob read from the plugin row's own `config`. */
    function useConfigNumber(ctx, key, fallback) {
      const entry = ctx !== undefined && ctx !== null && ctx.fiber !== undefined ? ctx.fiber.entry : undefined;
      const config = entry !== undefined && entry !== null ? entry.config : undefined;
      const value = config !== undefined && config !== null ? Number(config[key]) : NaN;
      return Number.isFinite(value) && value > 0 ? value : fallback;
    }

    /** The sidebar row's glyph; the host button owns label, tooltip and selection. */
    function PanelGlyph({ size }) {
      return h('span', { className: 'mc-fallback' }, h(Alarm, { size: Number.isFinite(size) ? size : 16 }));
    }

    function MainPanel({ ctx, t }) {
      return h(Guard, { t }, h(Dashboard, { ctx, t }));
    }

    function view(Component, ctx, t, fill) {
      function MissionControlView(props) {
        const tree = h(Guard, { t }, h(Component, { ...props, ctx, t }));
        return fill === true ? h('div', { style: { height: '100%', minHeight: 0, overflow: 'auto' } }, tree) : tree;
      }
      MissionControlView.displayName = `MissionControl(${Component.name || 'View'})`;
      return MissionControlView;
    }

    /* --------------------------------------------------------------- apply */

    function apply(ctx) {
      const t = makeTranslator();
      ctx.effect(() => ctx.slots.inject(MAIN_SLOT, () => ctx.slots.register({
        name: MAIN_SLOT,
        key: PANEL_ID,
      }, view(MainPanel, ctx, t, true))), 'mission-control: dashboard panel');

      ctx.effect(() => ctx.slots.inject(RAIL_SLOT, () => ctx.slots.register({
        name: RAIL_SLOT,
        id: PANEL_ID,
        order: 80,
        label: () => t('title'),
      }, view(PanelGlyph, ctx, t, false))), 'mission-control: sidebar entry');
    }

    return {
      name: 'mission-control',
      inject: ['slots', 'layout', 'sessions', 'uiWorkspace'],
      apply,
    };
  },
});

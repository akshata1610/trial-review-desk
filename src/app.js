(function () {
  'use strict';
  const M = window.TrialDesk;
  const KEY = 'trial-review-desk-v2';
  const app = document.getElementById('app');
  const modal = document.getElementById('modal');
  let state, storageOK = true, recovery = false, toastTimer;
  try {
    const saved = localStorage.getItem(KEY);
    if (saved) { const parsed = JSON.parse(saved); if (M.isState(parsed)) state = parsed; else recovery = true; }
  } catch { storageOK = false; }
  if (!state) state = M.createSeed();
  const ui = { page: 'queue', caseId: 'C001', checkId: 'L2', tab: 'evidence', actor: 'Coordinator A', filters: { search: '', protocol: '', owner: '', status: '' }, taskFilter: 'open' };
  const h = value => String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const iconPaths = {
    mark: '<path d="M5 3v4c0 4 14 6 14 10v4M19 3v4C19 11 5 13 5 17v4M6 5h12M6 19h12M8 9h8M8 15h8"/>',
    queue: '<rect x="4" y="4" width="16" height="16" rx="3"/><path d="M9 4v16M9 10h11M4 10h5M9 15h11"/>',
    tasks: '<rect x="5" y="5" width="14" height="16" rx="2"/><path d="M9 3h6v4H9zM9 12l2 2 4-4M9 18h6"/>',
    chart: '<path d="M4 4v16h17M8 15v-4M13 15V7M18 15v-7"/>',
    book: '<path d="M12 5v15M12 5C9 3 5 3 3 4v15c3-1 6-1 9 1 3-2 6-2 9-1V4c-2-1-6-1-9 1z"/>',
    arrow: '<path d="M5 12h14M13 6l6 6-6 6"/>',
    back: '<path d="M19 12H5M11 6l-6 6 6 6"/>',
    chevron: '<path d="m9 5 7 7-7 7"/>',
    reset: '<path d="M3 10a9 9 0 1 1 1 8M3 4v6h6"/>',
    search: '<circle cx="10.5" cy="10.5" r="6.5"/><path d="m16 16 4.5 4.5"/>',
    check: '<path d="m5 12 4 4L19 6"/>',
    circlecheck: '<circle cx="12" cy="12" r="9"/><path d="m8 12 3 3 5-6"/>',
    clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
    info: '<circle cx="12" cy="12" r="9"/><path d="M12 11v6M12 7h.01"/>',
    patient: '<circle cx="12" cy="8" r="3"/><path d="M5 21v-3a7 7 0 0 1 14 0v3"/>',
    file: '<path d="M14 3H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9zM14 3v6h6M8 13h8M8 17h5"/>',
    alert: '<path d="m12 3 10 18H2zM12 9v5M12 18h.01"/>',
    split: '<path d="M8 20V9a4 4 0 0 1 4-4h7M15 1l4 4-4 4M8 13h4a4 4 0 0 1 4 4v3M4 17l4 4 4-4"/>',
    x: '<path d="m6 6 12 12M18 6 6 18"/>',
    plus: '<path d="M12 5v14M5 12h14"/>',
    shield: '<path d="m12 3 8 3v6c0 5-8 9-8 9s-8-4-8-9V6zM8 12l3 3 5-6"/>',
    calendar: '<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M16 3v4M8 3v4M3 11h18M8 15h3"/>',
    dots: '<circle cx="5" cy="12" r="1"/><circle cx="12" cy="12" r="1"/><circle cx="19" cy="12" r="1"/>',
    save: '<path d="M5 3h12l4 4v14H3V3zM7 3v6h10V3M7 21v-8h10v8"/>',
    flag: '<path d="M5 21V3c5-3 9 4 14 1v10c-5 3-9-4-14-1"/>'
  };
  const icon = name => '<svg viewBox="0 0 24 24" aria-hidden="true">' + (iconPaths[name] || iconPaths.info) + '</svg>';
  const now = () => M.scenarioNow(state);
  function format(iso, options = {}) { return new Intl.DateTimeFormat('en-IN', { timeZone: 'Asia/Kolkata', day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit', hour12: false, ...options }).format(new Date(iso)); }
  function dateOnly(iso) { return new Intl.DateTimeFormat('en-IN', { timeZone: 'Asia/Kolkata', day: '2-digit', month: 'short', year: 'numeric' }).format(new Date(iso)); }
  function timeOnly(iso) { return new Intl.DateTimeFormat('en-IN', { timeZone: 'Asia/Kolkata', hour: '2-digit', minute: '2-digit', hour12: false }).format(new Date(iso)); }
  const pct = (n,d) => d ? Math.round(n/d*100) + '%' : 'No data';
  const shortOutcome = value => value === 'Potential fit for clinical review' ? 'Potential fit · clinical review required' : value;
  const initial = person => person === 'Clinical Lead A' ? 'CL' : person === 'Coordinator B' ? 'CB' : 'CA';
  function statusClass(status) { return ({'Met':'green','Not met':'red','Exclusion ruled out':'green','Exclusion present':'red','Insufficient information':'amber','Conflicting evidence':'red','Not reviewed':'gray','Not started':'gray','In review':'purple','Follow up needed':'amber','Ready for clinical review':'blue','Review complete':'green','Unresolved':'amber'})[status] || 'purple'; }
  function badge(label, type) { const name = ['Met','Review complete'].includes(label) ? 'check' : ['Follow up needed','Insufficient information','Unresolved'].includes(label) ? 'clock' : label === 'Conflicting evidence' ? 'split' : ''; return `<span class="badge ${h(type || statusClass(label))}">${name ? icon(name) : ''}${h(label)}</span>`; }
  function options(values, selected, empty) { return (empty !== undefined ? `<option value="">${h(empty)}</option>` : '') + values.map(v => { const [value,label] = Array.isArray(v) ? v : [v,v]; return `<option value="${h(value)}" ${value === selected ? 'selected' : ''}>${h(label)}</option>`; }).join(''); }
  function reviewerField(id = 'reviewer') { return `<div class="form-field"><label for="${id}">Reviewer <span class="muted">· simulated role</span></label><select id="${id}" name="reviewer" required>${options(M.PEOPLE,ui.actor,'Choose reviewer')}</select></div>`; }
  function footer() { return `<footer class="footer"><span>${icon('shield')}Fictional records. Independent portfolio project by Akshata Anil Urs.</span><span>${icon(storageOK ? 'save' : 'info')}${storageOK ? 'Changes saved in this browser' : 'Session only · saving unavailable'}</span></footer>`; }
  function navButton(page, label, image, count = null, extra = '') { return `<button data-action="nav" data-page="${page}" class="${ui.page === page || (page === 'queue' && ui.page === 'case') ? 'active ' : ''}${extra}" ${ui.page === page ? 'aria-current="page"' : ''}>${icon(image)}${label}${count !== null ? `<span class="count">${count}</span>` : ''}</button>`; }
  function filterbar() { return `<div class="filterbar"><div class="search">${icon('search')}<label for="search" class="sr-only" hidden>Search patient or pair</label><input id="search" type="search" placeholder="Search patient or pair…" aria-label="Search patient or pair" value="${h(ui.filters.search)}"></div><div class="filter-field"><label for="protocol-filter">Protocol</label><select id="protocol-filter" data-filter="protocol">${options([['lung','Lung protocol'],['breast','Breast protocol']],ui.filters.protocol,'All protocols')}</select></div><div class="filter-field"><label for="owner-filter">Case owner</label><select id="owner-filter" data-filter="owner">${options(M.PEOPLE.slice(0,2),ui.filters.owner,'All case owners')}</select></div><div class="filter-field"><label for="status-filter">Workflow status</label><select id="status-filter" data-filter="status">${options(M.WORKFLOWS,ui.filters.status,'All statuses')}</select></div>${Object.values(ui.filters).some(Boolean) ? '<button class="btn subtle" data-action="clear-filters">Clear</button>' : ''}</div>`; }
  function metric(label, value, note, image, color = '') { return `<article class="metric"><div class="metric-label">${label}${icon(image)}</div><div class="metric-value ${color}">${value}</div><div class="metric-note">${note}</div></article>`; }
  function row(c) {
    const reviewed = c.checks.filter(ch => ch.status !== 'Not reviewed').length;
    const missing = c.checks.filter(ch => ch.status === 'Insufficient information').length, conflicting = c.checks.some(ch => ch.status === 'Conflicting evidence');
    return `<tr><td><button class="pair-button" data-action="open-case" data-id="${c.id}" aria-label="Open ${c.id} ${c.patient}"><span class="patient-symbol">${icon('patient')}</span><span><span class="patient-name">${h(c.patient)}</span><span class="patient-id">${c.id} · fictional patient</span></span></button></td><td><span class="protocol-name">${h(M.PROTOCOLS[c.protocol].id)}</span><span class="protocol-tag">${h(M.PROTOCOLS[c.protocol].version)} · ${c.checks.length} protocol checks</span></td><td><span class="patient-name" style="font-size:11px;font-weight:500">${timeOnly(c.visit)}</span><span class="patient-id">18 Nov · IST</span></td><td>${badge(M.workflow(c))}${conflicting ? `<span class="flag conflict">${icon('split')}Conflicting sources</span>` : missing ? `<span class="flag">${icon('file')}${missing} information gap${missing > 1 ? 's' : ''}</span>` : ''}</td><td><span class="progress-text"><span class="progress-track"><span style="width:${reviewed/c.checks.length*100}%"></span></span>${reviewed}/${c.checks.length}</span></td><td><span class="owner-chip"><span class="owner-mini">${initial(c.owner)}</span>${h(c.owner)}</span></td><td><button class="arrow-button" data-action="open-case" data-id="${c.id}" aria-label="Review ${c.id}">${icon('arrow')}</button></td></tr>`;
  }
  function queuePage() {
    const cases = M.selectCases(state, ui.filters), m = M.metrics(cases, now());
    return `<div class="page-head"><div><div class="eyebrow">Screening workspace</div><h1>Review queue</h1><p>Review evidence and keep the next step clear.</p></div><div class="head-buttons"><button class="btn" data-action="reset">${icon('reset')}Reset demo</button></div></div>
    <div class="intro-strip"><div class="intro-text"><span class="intro-icon">${icon('book')}</span><div><strong>New to trial screening? Start with two example cases.</strong><p>Find a missing result, then work through conflicting records.</p></div></div><div class="intro-links"><button class="btn" data-action="open-case" data-id="C001">Missing result ${icon('arrow')}</button><button class="btn" data-action="open-case" data-id="C002">Conflicting records ${icon('arrow')}</button><button class="btn" data-action="nav" data-page="watch">Open watchlist</button></div></div>
    <div class="metrics-row">${metric('Pairs in this view',m.total,`${m.patients} unique fictional patients`,'patient')}${metric('Reviews complete',`${m.completed}<small>/ ${m.total}</small>`,`${pct(m.completed,m.total)} of the selected queue`,'circlecheck','purple')}${metric('Needs clarification',m.unresolved,'Missing information, conflicts or open tasks','info','amber')}${metric('Open follow-ups',m.tasks,`<span id="overdue-tag">${m.overdue}</span> overdue at the scenario time`,'tasks')}</div>
    <div class="section-line"><h2>Patient–trial pairs</h2><span class="muted">Ordered by upcoming visit</span></div>
    <section class="panel" aria-label="Patient and trial review queue">${filterbar()}${cases.length ? `<div class="table-scroll"><table class="data-table"><thead><tr><th>Patient / pair</th><th>Trial protocol</th><th>Visit</th><th>Review status</th><th>Reviewed</th><th>Case owner</th><th><span class="muted">Open</span></th></tr></thead><tbody>${cases.map(row).join('')}</tbody></table></div>` : empty('No pairs match these filters','Try another patient ID or clear the filters.','filters')}<div class="table-footer"><span>Showing ${cases.length} of ${state.cases.length} pairs</span><span>Filters also apply to analytics · fictional data</span></div></section>`;
  }
  function empty(title, message, action = '') { return `<div class="empty">${icon('search')}<h3>${h(title)}</h3><p>${h(message)}</p>${action === 'filters' ? '<button class="btn" data-action="clear-filters">Clear filters</button>' : ''}</div>`; }
  function currentCase() { return M.getCase(state,ui.caseId); }
  function evidenceView(c) {
    const ch = c.checks.find(x => x.id === ui.checkId) || c.checks[0]; ui.checkId = ch.id;
    return `<div class="review-grid"><aside class="panel criteria" aria-label="Protocol checks"><div class="criteria-head"><h2>Protocol checks</h2><span>${c.checks.filter(x => x.status !== 'Not reviewed').length} / ${c.checks.length} reviewed</span></div>${c.checks.map((x,i) => `${i===0 || x.kind==='exclusion' ? '<p class="criterion-group">'+(x.kind==='exclusion'?'Exclusion':'Inclusion')+'</p>' : ''}<button class="criterion ${x.id === ch.id ? 'selected' : ''}" data-action="select-check" data-id="${x.id}" ${x.id === ch.id ? 'aria-current="true"' : ''}><span class="criterion-code">${x.id}</span><span><strong>${h(x.title)}</strong>${badge(x.status)}</span></button>`).join('')}<p class="criteria-note">Fictional rules for this protocol. All applicable checks need review.</p></aside>
    <div class="evidence-column"><section class="panel"><div class="evidence-head"><div><div class="eyebrow">${ch.id} · Source evidence</div><h2>${h(ch.title)}</h2><p>Inspect the excerpts before recording an assessment.</p></div>${badge(ch.status)}</div><div class="source-list">${ch.sources.length ? ch.sources.map(source => sourceCard(c,ch,source)).join('') : '<div class="no-source"><strong>No source document available</strong><p>The fictional record does not include the information required for this check.</p></div>'}<p class="evidence-note">${icon('info')}Every excerpt is authored simulation data. ${ch.sources.length > 1 ? 'Multiple sources remain visible; a newer date does not resolve a disagreement.' : 'A pending test is not a negative test result.'}</p></div>
    ${suggestionCard(c,ch)}<form class="assessment" data-form="assessment"><input type="hidden" name="caseId" value="${c.id}"><input type="hidden" name="checkId" value="${ch.id}"><h3>Record your assessment</h3><p>Your assessment applies to this fictional check, not final trial eligibility.</p><div class="form-grid"><div class="form-field"><label for="assessment-status">Assessment</label><select id="assessment-status" name="status" required>${options(M.allStatuses(ch).slice(1),ch.status,'Choose an assessment')}</select></div>${reviewerField('assessment-reviewer')}<div class="form-field wide"><label for="assessment-reason">Evidence and reason</label><textarea id="assessment-reason" name="reason" maxlength="1200" required placeholder="Explain your assessment and reference the source document…"></textarea></div></div><div class="error" id="assessment-error" role="alert"></div><div class="form-actions"><span class="muted">Changes are recorded in decision history.</span><button class="btn primary" type="submit">${icon('check')}Save assessment</button></div></form></section>
    ${!c.updates.includes('marker-update') && ['C001','C006'].includes(c.id) ? `<div class="snapshot-note" style="margin:15px 0 0">Try a change in evidence: <button class="btn subtle" data-action="demo-evidence" data-id="${c.id}">${icon('plus')}${c.id === 'C001' ? 'Load fictional result' : 'Load conflicting update'}</button></div>` : ''}${outcomePanel(c)}</div></div>`;
  }
  function outcomePanel(c) {
    const reasons = M.handoffReasons(c), done = !!c.completedAt;
    const remaining = M.blockingChecks(c).length, tasks = M.openTasks(c).length;
    return `<section class="panel review-outcome"><div class="outcome-head"><div><h2>Coordinator review outcome</h2><p>${done ? 'Completed ' + format(c.completedAt) + ' IST' : c.handoffAt ? 'Handoff saved ' + format(c.handoffAt) + ' IST' : 'Save a handoff or complete the coordinator review when the checks are resolved.'}</p></div>${badge(done ? 'Review complete' : c.outcome === 'Unresolved' ? 'Unresolved' : 'Potential fit for clinical review')}</div>${c.outcome !== 'Unresolved' ? `<p class="outcome-reason"><strong>Recorded outcome:</strong> ${h(shortOutcome(c.outcome))}</p>` : ''}${c.outcomeReason ? `<p class="outcome-reason">${h(c.outcomeReason)}</p>` : ''}<p class="outcome-rules">${icon(done ? 'circlecheck' : 'info')}${done ? 'Coordinator review complete. Clinical eligibility has not been determined by this demo.' : reasons.length ? 'Handoff blocked: ' + h(reasons.join('; ')) + '.' : 'All inclusion checks are met, all exclusions are ruled out, and follow-ups are closed. Handoff is available.'}</p>${c.disposition ? `<p class="outcome-reason"><strong>Disposition</strong> · ${h(c.disposition.outcome)}</p>` : ''}<div class="outcome-actions"><button class="btn" data-action="brief" data-id="${c.id}">Preview visit brief</button>${(c.handoffAt || c.completedAt) && !c.disposition ? `<button class="btn" data-action="disposition" data-id="${c.id}">Record disposition</button>` : ''}<button class="btn" data-action="new-task" data-id="${c.id}">${icon('plus')}Add follow-up</button><button class="btn" data-action="handoff" data-id="${c.id}" ${!M.canHandoff(c) || done ? 'disabled' : ''}>${icon('arrow')}Save clinical handoff</button><button class="btn primary" data-action="complete" data-id="${c.id}" ${!M.canComplete(c) || done ? 'disabled' : ''}>${icon('circlecheck')}Complete review</button></div>${!done && (remaining || tasks) ? `<p class="small muted" style="margin-top:10px;font-size:10px">Completion requires every check assessed, no missing or conflicting evidence, and no open follow-ups.</p>` : ''}</section>`;
  }
  function tasksForCase(c) {
    return `<div class="task-toolbar"><p class="muted small">${c.tasks.length} task${c.tasks.length === 1 ? '' : 's'} · ${M.openTasks(c).length} open</p><button class="btn primary" data-action="new-task" data-id="${c.id}">${icon('plus')}Add follow-up</button></div>${c.tasks.length ? `<div class="task-list">${c.tasks.map(t => taskCard(c,t)).join('')}</div>` : `<section class="panel">${empty('No follow-up tasks','Add a task when a check needs clarification.')}</section>`}${outcomePanel(c)}`;
  }
  function taskCard(c,t,global = false) {
    const overdue = !t.resolvedAt && Date.parse(t.dueAt) < Date.parse(now());
    return `<article class="panel task-card"><div><div class="pill-row" style="margin-bottom:10px">${badge(t.resolvedAt ? 'Resolved' : overdue ? 'Overdue' : 'Open',t.resolvedAt ? 'green' : 'amber')}<span class="small muted">${h(c.id)} · ${h(t.checkId)}</span></div><h3>${h(t.issue)}</h3><div class="task-meta"><span>Owner: ${h(t.owner)}</span><span>Due ${format(t.dueAt)} IST</span>${global ? `<button data-action="open-case" data-id="${c.id}" class="btn subtle" style="min-height:20px;padding:0;font-size:10px">${h(c.patient)} ${icon('arrow')}</button>` : ''}</div>${t.resolvedAt ? `<p><strong>Resolution:</strong> ${h(t.resolution)}</p><p>Recorded ${format(t.resolvedAt)} IST. The check assessment was not changed automatically.</p>` : ''}</div>${!t.resolvedAt ? `<button class="btn" data-action="resolve-task" data-id="${c.id}" data-task="${h(t.id)}">${icon('check')}Resolve task</button>` : ''}</article>`;
  }
  function historyView(c) {
    return `<p class="snapshot-note">Starting events and their times were authored for the scenario. New actions are labelled “Your demo action”.</p><section class="panel history">${c.events.length ? c.events.slice().reverse().map(e => `<article class="event"><span class="event-mark">${icon(e.kind.includes('reopen') ? 'reset' : e.kind.includes('Follow') ? 'tasks' : e.kind.includes('evidence') ? 'file' : 'check')}</span><div class="event-content"><h3>${h(e.kind)}</h3><p>${h(e.detail)}</p>${e.reason && e.reason !== e.detail ? `<p><strong>Reason:</strong> ${h(e.reason)}</p>` : ''}${e.previous ? `<p><strong>Previous outcome:</strong> ${h(e.previous.outcome)}. ${h(e.previous.reason)}</p>` : ''}<div class="event-meta"><span>${h(e.reviewer)}</span><span>·</span><span>${format(e.at)} IST</span><span>·</span><span>${e.seeded ? 'Authored starting event' : 'Your demo action'}</span></div></div></article>`).join('') : empty('No decisions recorded yet','Save an assessment to begin this review.')}</section><p class="history-note">This browser-local history demonstrates traceability. It is editable local data, not a tamper-resistant clinical audit log.</p>`;
  }
  function casePage() {
    const c = currentCase();
    return `<button class="back-link" data-action="nav" data-page="queue">${icon('back')}Back to review queue</button><div class="page-head detail-head"><div><div class="eyebrow">${c.id} · ${h(M.PROTOCOLS[c.protocol].id)} ${h(M.PROTOCOLS[c.protocol].version)}</div><h1><span class="patient-symbol">${icon('patient')}</span>${h(c.patient)}</h1><div class="detail-meta"><span>${icon('calendar')}Visit ${format(c.visit)} IST</span><span>${icon('patient')}${h(c.owner)}</span><span>Fictional patient and protocol</span><span>${visitLabel(c)}</span></div></div><div>${badge(M.workflow(c))}</div></div><div class="tabs" role="tablist" aria-label="Case views">${[['evidence','Evidence review',c.checks.length],['tasks','Follow-ups',c.tasks.length],['history','Decision history',c.events.length]].map(([id,label,count]) => `<button role="tab" aria-selected="${ui.tab === id}" class="tab ${ui.tab === id ? 'active' : ''}" data-action="case-tab" data-id="${id}">${label}<small>${count}</small></button>`).join('')}</div><div role="tabpanel" aria-label="${ui.tab === 'evidence' ? 'Evidence review' : ui.tab === 'tasks' ? 'Follow-ups' : 'Decision history'}">${ui.tab === 'tasks' ? tasksForCase(c) : ui.tab === 'history' ? historyView(c) : evidenceView(c)}</div>`;
  }
  function tasksPage() {
    const cases = M.selectCases(state,ui.filters);
    const tasks = cases.flatMap(c => c.tasks.map(t => ({c,t}))).filter(({t}) => ui.taskFilter === 'all' || (ui.taskFilter === 'open' ? !t.resolvedAt : !!t.resolvedAt)).sort((a,b) => Date.parse(a.t.dueAt) - Date.parse(b.t.dueAt));
    return `<div class="page-head"><div><div class="eyebrow">Review operations</div><h1>Follow-ups</h1><p>Keep unresolved questions attached to a check and an owner.</p></div></div><section class="panel" style="margin-bottom:22px">${filterbar()}</section><div class="task-toolbar"><div class="segmented" role="group" aria-label="Task filter">${[['open','Open'],['resolved','Resolved'],['all','All tasks']].map(([id,label]) => `<button class="${ui.taskFilter === id ? 'active' : ''}" data-action="task-filter" data-id="${id}" aria-pressed="${ui.taskFilter === id}">${label}</button>`).join('')}</div><p class="muted small">${tasks.length} tasks in the selected queue</p></div>${tasks.length ? `<div class="task-list">${tasks.map(({c,t}) => taskCard(c,t,true)).join('')}</div>` : `<section class="panel">${empty('No tasks in this view','Change the task tab or queue filters.')}</section>`}`;
  }
  function analyticsPage() {
    const cases = M.selectCases(state,ui.filters), m=M.metrics(cases,now());
    const colors=['#d7d5df','#b3a2d0','#e5bf7b','#92a8ce','#7fbaa5'];
    return `<div class="page-head"><div><div class="eyebrow">Workflow measures</div><h1>Analytics</h1><p>Operational measures for the fictional queue. No clinical outcomes are measured.</p></div></div><section class="panel">${filterbar()}</section><p class="analytic-filter-note">Denominator: ${m.total} selected patient–trial pairs · ${m.patients} unique patients. One patient may appear against multiple trials.</p><div class="analytics-grid">${metric('Review coverage',pct(m.reviewed,m.total),`${m.reviewed} of ${m.total} pairs have a saved assessment`,'queue','purple')}${metric('Completion rate',pct(m.completed,m.total),`${m.completed} of ${m.total} coordinator reviews complete`,'circlecheck')}${metric('Unresolved share',pct(m.unresolved,m.total),`${m.unresolved} of ${m.total} pairs need clarification`,'info','amber')}${metric('Open follow-ups',m.tasks,`<span id="overdue-tag">${m.overdue}</span> overdue at the scenario time`,'tasks')}${metric('Median turnaround',m.turnaround === null ? '—' : `${Number(m.turnaround.toFixed(1))}<small>min</small>`,m.turnaround === null ? 'No completed reviews in this view' : `Elapsed time · ${m.samples} completed pairs · includes waiting`,'clock','purple')}${metric('Unique patients',m.patients,`${m.total} selected pairs across ${new Set(cases.map(c=>c.protocol)).size} fictional protocols`,'patient')}</div><div class="analysis-row"><section class="panel chart-panel"><h2>Queue progress</h2><p>Current workflow status, counted once per pair.</p><div class="stacked" role="img" aria-label="${h(M.WORKFLOWS.map(s=>s+': '+m.byStatus[s]).join(', '))}">${M.WORKFLOWS.map((s,i)=>`<span style="width:${m.total ? m.byStatus[s]/m.total*100 : 0}%;background:${colors[i]}"></span>`).join('')}</div><div class="legend-list">${M.WORKFLOWS.map((s,i)=>`<div class="legend-item"><span><i class="legend-dot" style="background:${colors[i]}"></i>${s}</span><strong>${m.byStatus[s]}</strong></div>`).join('')}</div></section><section class="panel chart-panel"><h2>Read these measures correctly</h2><ul class="definition-list"><li><strong>Review complete</strong> means a coordinator task is complete. It does not mean the patient can enroll.</li><li><strong>Turnaround</strong> runs from the first saved action to the latest completion. It includes waiting and excludes unfinished pairs.</li><li><strong>Unresolved share</strong> includes missing or conflicting checks and open tasks. A pair is counted once, even with several issues.</li><li><strong>Starting values are authored.</strong> The initial 68-minute median comes from two fictional reviews lasting 54 and 82 minutes. It is not a measured product benefit.</li><li><strong>No baseline study has been run.</strong> No claim of time savings or clinical accuracy is supported by this demonstration.</li></ul></section></div>${bottleneckCard(cases)}`;
  }
  function guidePage() {
    return `<div class="page-head"><div><div class="eyebrow">Independent portfolio project</div><h1>Understand the project</h1><button class="btn" data-action="nav" data-page="memo">Read the product memo</button><p class="guide-intro">Trial Review Desk demonstrates how a coordinator might review a possible patient–trial match, inspect evidence, and track the next step. All protocols, records, marker names and staff roles in this app are fictional.</p></div></div><div class="guide-grid">${[
      ['01','Find a missing result','A test was ordered, but its result is unavailable. Review C001, load the fictional result, reassess L2 and resolve the task before saving a handoff.','C001','Try the missing-result case'],
      ['02','Keep a conflict visible','Two fictional documents disagree. In C002, inspect both sources, record why the check remains unresolved and assign a follow-up.','C002','Try the conflict case'],
      ['03','Correct outdated evidence','Open L4, compare the two ECOG notes, and override the stale suggestion using DOC C007P2.','C007','Try the stale AI suggestion'],
      ['04','Confirm an exclusion','Inspect E1 and see how prior participation blocked handoff and produced a structured disposition.','C005','Try the confirmed exclusion']
    ].map(([n,title,body,id,label])=>`<article class="panel scenario-card"><span class="step-number">SCENARIO ${n}</span><h2>${title}</h2><p>${body}</p><button class="btn" data-action="open-case" data-id="${id}" ${id==='C005'?'data-check="E1"':id==='C007'?'data-check="L4"':''} aria-label="${label}">Open ${id} ${icon('arrow')}</button></article>`).join('')}</div><div class="guide-body"><section class="panel guide-section"><h2>What happens in the review?</h2><ol><li><strong>Open a pair.</strong> One row links a fictional patient to one fictional protocol. These protocols have invented inclusion and exclusion checks.</li><li><strong>Compare the evidence.</strong> Read the cited note or report. “Result pending” means information is missing. Conflicting notes remain visible together.</li><li><strong>Save an assessment and reason.</strong> Met, Not met, Insufficient information or Conflicting evidence applies to an individual check.</li><li><strong>Track follow-up.</strong> Assign an issue, owner and deadline. Resolving a task does not automatically change the assessment.</li><li><strong>Record the outcome.</strong> A potential-fit handoff needs all inclusion checks met, all exclusions ruled out, and no open tasks. A coordinator review can also close as Not supported when an inclusion is unmet or an exclusion is present and remaining work is resolved.</li></ol><div class="mini-divider"><h3>Where clinical decisions begin</h3><p>A possible match does not confirm eligibility. The study team conducts the required screening and informed-consent process. Enrollment and treatment decisions are outside this demonstration.</p></div></section><section class="panel guide-section"><h2>The product thinking</h2><p><strong>Problem hypothesis:</strong> when evidence is incomplete or inconsistent, coordinators may need a clearer way to track the question, next action and owner.</p><p class="muted">Public sources establish the domain. Coordinator interviews, workflow observation and clinical-user validation have not been conducted.</p><div class="mini-divider"><h3>About this portfolio project</h3><p>This independent prototype explores a coordinator workflow applicable across oncology research programs. It uses invented protocols and documents.</p></div><div class="mini-divider"><h3>Research to do next</h3><p>Ask coordinators about their last incomplete case, how they resolve contradictory records and what they need at handoff. Observe them working through synthetic scenarios before claiming a benefit.</p></div><div class="mini-divider"><h3>Primary sources</h3><ul><li><a href="https://www.cancer.gov/research/participate/clinical-trials/what-are-clinical-trials" target="_blank" rel="noopener noreferrer">NCI · What are clinical trials?</a></li><li><a href="https://www.cancer.gov/publications/dictionaries/cancer-terms/def/eligibility-criteria" target="_blank" rel="noopener noreferrer">NCI · Eligibility criteria</a></li><li><a href="https://www.cancer.gov/research/participate/clinical-trials/what-to-expect" target="_blank" rel="noopener noreferrer">NCI · What to expect</a></li></ul><p class="muted">Source context checked for Checkpoint 1 on 17 November 2026. Clinical terminology is simplified for learning.</p></div><div class="mini-divider"><h3>Using this demo</h3><p>The scenario starts at 18 Nov 2026, 08:30 IST and advances with elapsed time. Your changes save in this browser where permitted. Use Reset demo to restore starting examples. Local history demonstrates traceability; it is not protected clinical storage.</p></div></section></div>`;
  }
  function sourceCard(c, check, source) {
    const prediction = M.prediction(c.id,check.id);
    const quoted = check.sourceId === source.id ? source.body : prediction?.sourceId === source.id ? prediction.quote : '';
    const start = quoted ? source.body.indexOf(quoted) : -1;
    const body = start < 0 ? h(source.body) : h(source.body.slice(0,start)) +
      '<mark>' + h(quoted) + '</mark>' + h(source.body.slice(start+quoted.length));
    return `<article class="source" tabindex="-1" id="source-${h(source.id.replaceAll(' ','-'))}"><div class="source-head"><strong>${icon('file')}${h(source.id)} · ${h(source.title)}</strong><span>${dateOnly(source.date)}</span></div><p>${body}</p></article>`;
  }
  function suggestionCard(c,check) {
    const prediction = M.prediction(c.id,check.id);
    if (!prediction) return '';
    const latest = c.events.findLast(e=>e.kind==='AI suggestion reviewed' && e.checkId===check.id);
    return `<section class="ai-inline"><div><h3>Simulated AI suggestion</h3><p>${h(prediction.status)} · ${prediction.sourceId ? `<button class="citation-link" data-action="evidence-link" data-id="${h(prediction.sourceId.replaceAll(' ','-'))}">${h(prediction.sourceId)}</button>` : 'No source cited'}</p>
      ${latest ? `<p class="muted">${latest.tag ? 'Overridden' : 'Kept'} by ${h(latest.reviewer)} · ${format(latest.at)} IST${latest.tag ? ' · '+h(latest.tag) : ''}</p>` : ''}</div>
      <div class="v2-actions">${['keep','override'].map(decision=>`<button class="btn ${decision==='override'?'primary':''}" data-action="ai-feedback" data-id="${c.id}" data-check="${check.id}" data-decision="${decision}">${decision==='keep'?'Keep suggestion':'Override'}</button>`).join('')}</div></section>`;
  }
  function feedbackDialog(id,checkId,decision) {
    const c=M.getCase(state,id), ch=c.checks.find(x=>x.id===checkId), model=M.prediction(id,checkId);
    showModal(decision==='override'?'Override simulated suggestion':'Keep simulated suggestion',`<p>Original suggestion: <strong>${h(model.status)}</strong>${model.sourceId?' · '+h(model.sourceId):''}</p>
      <form data-form="ai-feedback"><input type="hidden" name="caseId" value="${id}"><input type="hidden" name="checkId" value="${checkId}"><input type="hidden" name="decision" value="${decision}">
      ${decision==='override'?`<div class="form-grid"><div class="form-field"><label for="corrected">Corrected assessment</label><select id="corrected" name="status" required>${options(M.allStatuses(ch).slice(1),model.status,'Choose assessment')}</select></div>
      <div class="form-field"><label for="error-tag">Error tag</label><select id="error-tag" name="tag" required>${options(M.ERROR_TAGS,'','Choose error type')}</select></div></div><div class="form-field"><label for="correct-source">Supporting source</label><select id="correct-source" name="sourceId" ${ch.sources.length?'required':''}>${options(ch.sources.map(x=>[x.id,x.id+' · '+x.title]),'','Choose source')}</select></div>`:''}
      <div class="form-field"><label for="feedback-reason">Review reason</label><textarea id="feedback-reason" name="reason" maxlength="1200" ${decision==='override'?'required':''}></textarea></div>
      ${reviewerField('feedback-reviewer')}${formError()}${formActions('Save AI review')}</form>`);
  }
  function dispositionDialog(id) {
    showModal('Record match disposition',`<p>Choose the outcome for this fictional match. Pending cases can stay open with a follow-up.</p>
      <form data-form="disposition"><input type="hidden" name="caseId" value="${id}">
      <div class="form-field"><label for="disposition-category">Disposition category</label><select id="disposition-category" name="outcome" required>${options(M.DISPOSITIONS,'','Choose outcome')}</select></div>
      <div class="form-field"><label for="verification">Eligibility verification</label><select id="verification" name="verified" required>${options([['yes','Verified eligible'],['no','Not eligible'],['unknown','Verification pending or unknown']],'','Choose verification status')}</select></div>
      <div class="form-field"><label for="disposition-detail">Optional detail</label><textarea id="disposition-detail" name="reason" maxlength="1200"></textarea></div>${reviewerField('disposition-reviewer')}${formError()}${formActions('Save disposition')}</form>`);
  }
  function visitLabel(c) {
    const minutes=Math.ceil((Date.parse(c.visit)-Date.parse(now()))/60000);
    if (minutes<=0) return badge('Visit time passed','gray');
    if (minutes<=120) return badge('Visit within 2 hours','amber');
    return '';
  }
  function briefDialog(id) {
    const c=M.getCase(state,id), b=M.visitBrief(c);
    showModal('Visit brief preview',`<p>Fictional in-basket preview · Visit ${format(c.visit)} IST · ${h(c.owner)}</p><ul class="brief-list">
      <li><strong>Potential trial</strong><span>${h(b.protocol)}</span></li>
      <li><strong>Reviewed evidence</strong><span>${h(b.evidence)}${b.source ? ` · <button class="citation-link" data-action="brief-source" data-id="${h(c.id)}" data-check="${h(b.checkId)}" data-source="${h(b.source.id.replaceAll(' ','-'))}">${h(b.source.id)} (${dateOnly(b.source.date)})</button>` : ''}</span></li>
      <li><strong>Remaining question</strong><span>${h(b.remaining)}</span></li>
      <li><strong>Next action</strong><span>${h(b.next)}</span></li></ul><div class="v2-actions"><button class="btn" data-action="close-modal">Close preview</button></div>`);
  }
  function watchPage() {
    const rows=M.watchlist(M.selectCases(state,ui.filters));
    return `<div class="page-head"><div><h1>Near-miss watchlist</h1><p>Fictional cases with one reversible blocker and all other checks cleared.</p></div></div>
      <section class="panel">${filterbar()}${rows.length?`<div class="table-scroll"><table class="data-table"><thead><tr><th>Pair</th><th>Remaining check</th><th>Owner</th><th>Review by</th><th>Trigger</th></tr></thead><tbody>${rows.map(({case:c,check,arrived,trigger,owner,due})=>`<tr><td><button class="btn" data-action="open-case" data-id="${c.id}" data-check="${check.id}">${c.id}</button></td><td>${h(check.title)}</td><td>${h(owner)}</td><td>${format(due)} IST</td><td><p>${h(trigger)}</p>${arrived?badge('Ready for reassessment','blue'):`<button class="btn primary" data-action="demo-evidence" data-id="${c.id}">Simulate new result</button>`}</td></tr>`).join('')}</tbody></table></div>`:empty('No watchlist cases in this view','Check the filters or reset the scenario to replay the pending result.')}</section>
      <p class="snapshot-note v2-spaced">The simulated event appends a source and returns the check to review. Follow-up remains open until the coordinator resolves it.</p>`;
  }
  function bottleneckCard(cases) {
    const rows=M.bottlenecks(cases);
    return `<section class="panel chart-panel v2-spaced"><h2>Top disqualifying criteria</h2><p>Fictional sponsor view · All scenario dates · Applies queue filters. Denominators are fully reviewed pairs in each protocol.</p>
      ${rows.length?`<div class="table-scroll"><table class="data-table"><thead><tr><th>Criterion</th><th>Protocol</th><th>Blocked pairs</th><th>Sole blocker</th><th>Reviewed pairs</th></tr></thead><tbody>${rows.map(x=>`<tr><td>${h(x.criterion)}</td><td>${h(x.protocol)}</td><td>${x.blocked}</td><td>${x.sole}</td><td>${x.total}</td></tr>`).join('')}</tbody></table></div>`:'<p>No disqualifiers among fully reviewed pairs in this view.</p>'}</section>`;
  }
  function inspectorPage() {
    const e=M.evaluation(state), tagged=e.feedback.filter(row=>row.tag);
    const activity=M.reviewActivity(e.feedback);
    const counts=M.ERROR_TAGS.map(tag=>[tag,tagged.filter(row=>row.tag===tag).length]);
    const dispositions=state.cases.filter(c=>c.disposition), verified=dispositions.filter(c=>c.disposition.verified==='yes');
    const enrolled=dispositions.filter(c=>c.disposition.outcome==='Enrolled').length;
    return `<div class="page-head"><div><h1>AI Evaluation Inspector</h1><p>Compare authored predictions to a fixed synthetic reference set, then inspect the corrections recorded during review.</p></div><button class="btn" data-action="nav" data-page="memo">Read the product memo</button></div>
      <div class="analytics-grid">${metric('Blocker precision',pct(e.tp,e.tp+e.fp),`${e.tp} of ${e.tp+e.fp} predicted blockers`,'chart')}${metric('Blocker recall',pct(e.tp,e.tp+e.fn),`${e.tp} of ${e.tp+e.fn} reference blockers`,'chart')}${metric('Citation accuracy',pct(e.correct,e.cited),`${e.correct} of ${e.cited} cited predictions`,'file')}</div>
      <p class="snapshot-note">Fixed benchmark · ${e.total} authored criterion predictions. A blocker includes a check needing clarification. Citations require both the correct source and an exact excerpt. Review actions do not change the benchmark.</p>
      <details class="panel chart-panel v2-spaced"><summary>Compare AI suggestions with expected answers</summary><div class="table-scroll"><table class="data-table"><thead><tr><th>Pair / criterion</th><th>Original AI suggestion</th><th>Expected result</th><th>Expected evidence</th></tr></thead><tbody>${e.rows.map(row=>`<tr><td><button class="citation-link" data-action="open-case" data-id="${row.caseId}" data-check="${row.checkId}">${row.caseId} · ${row.checkId}</button></td><td>${h(row.status)}</td><td>${row.referenceBlocks?'Blocks or needs review':'Criterion passes'}</td><td>${h(row.referenceSource || 'No single sufficient source')}</td></tr>`).join('')}</tbody></table></div></details>
      <section class="v2-spaced" aria-labelledby="manual-review-title">
        <div class="section-line"><h2 id="manual-review-title">Human review activity</h2></div>
        <div class="analytics-grid manual-metrics">
          ${metric('Suggestions reviewed',activity.reviewed,`Of ${e.total} simulated suggestions · includes kept and overridden`,'check')}
          ${metric('Suggestions overridden',activity.overridden,`${activity.reviewed?pct(activity.overridden,activity.reviewed)+' of reviewed suggestions':'No reviewed suggestions yet'} · counted once per criterion`,'flag','purple')}
          ${metric('Override actions',activity.overrideActions,'Includes repeat corrections to the same suggestion','tasks')}
        </div>
        <p class="snapshot-note">Activity is recorded for the simulated reviewer roles in this browser. The benchmark scores above use a fixed reference set.</p>
      </section>
      <div class="analysis-row v2-spaced"><section class="panel chart-panel"><h2>Failure modes</h2><p>Counts tagged override actions.</p><div class="legend-list v2-spaced">${counts.map(([tag,n])=>`<div class="legend-item"><span>${h(tag)}</span><strong>${n}</strong></div>`).join('')}</div></section>
      <section class="panel chart-panel"><h2>Coordinator feedback</h2>${e.feedback.length ? `<ul class="definition-list">${e.feedback.map(row=>`<li><button class="citation-link" data-action="open-case" data-id="${row.caseId}" data-check="${row.checkId}">${row.caseId} · ${row.checkId}</button> · ${h(row.tag || 'Kept suggestion')}<br><strong>${row.tag ? 'Overridden' : 'Kept'} by ${h(row.reviewer)}</strong> · ${format(row.at)} IST<br>${h(row.originalStatus)} (${h(row.originalSource || 'no citation')}) → ${h(row.correctedStatus)} (${h(row.correctedSource || 'no citation')})<br>${h(row.reason)}<br><button class="btn review-brief" data-action="brief" data-id="${row.caseId}">Preview visit brief</button></li>`).join('')}</ul>` : '<p>Start with case C007 and override the outdated note to see feedback here.</p>'}</section></div>
      <div class="analysis-row v2-spaced"><section class="panel chart-panel"><h2>Enrollment disposition</h2><p>Fictional portfolio cohort · a pair can close before formal handoff.</p><ul class="definition-list"><li>Suggested pairs <strong>${state.cases.length}</strong></li><li>Coordinator reviews completed <strong>${state.cases.filter(c=>c.completedAt).length}</strong></li><li>Clinical handoffs saved <strong>${state.cases.filter(c=>c.handoffAt).length}</strong></li><li>Recorded dispositions <strong>${dispositions.length}</strong></li><li>Verified eligible among recorded dispositions <strong>${verified.length}</strong></li><li>Enrolled <strong>${enrolled}</strong></li><li>Pairs without a recorded disposition <strong>${state.cases.length-dispositions.length}</strong></li>${M.DISPOSITIONS.filter(x=>x!=='Enrolled').map(label=>`<li>${label} <strong>${dispositions.filter(c=>c.disposition.outcome===label).length}</strong></li>`).join('')}</ul></section>
      <section class="panel chart-panel"><h2>How to read the disposition counts</h2><p>Each row counts a fictional patient–trial pair. A verified outcome requires follow-up after screening. A documented patient decline is a valid disposition, and pairs still in progress remain open.</p></section></div>`;
  }
  function memoPage() {
    return `<article class="panel guide-section product-memo"><h1>Beyond the Match</h1><p>Making oncology trial drop-offs visible · Akshata Anil Urs</p><h2 class="v2-spaced">Why this matters</h2><p>A potential match starts a review. A team still needs to distinguish an evidence gap, a confirmed blocker, and a documented patient or provider decision. The product question is whether capturing these outcomes in the review workflow gives the next person enough information to act. Scientific and clinical validation would require separate research.</p>
      <h2 class="v2-spaced">What this prototype explores</h2><p>Capture a structured reason when a match closes. Keep reversible uncertainty on a watchlist and reopen review when new evidence arrives. Record coordinator corrections with links to the original and replacement sources so they can be inspected for evaluation and quality review.</p>
      <h2 class="v2-spaced">How to measure it</h2><p>For a pilot, measure confirmed enrollments per clinically verified eligible pair within a defined follow-up window. Track the share of closed cases with a documented disposition, plus aging of open cases. A decline is a valid outcome. Count correction review time and agreement between reviewers before claiming less annotation work or improvement in model quality.</p>
      <h2 class="v2-spaced">Evidence and scope</h2><p>The demo uses fictional cases and prewritten AI suggestions. The small evaluation set illustrates metric definitions. Clinical validity and operational impact would require a separate study.</p><ul><li><a href="https://www.cancer.gov/publications/dictionaries/cancer-terms/def/eligibility-criteria" target="_blank" rel="noopener noreferrer">National Cancer Institute · Eligibility criteria</a></li><li><a href="https://www.cancer.gov/research/participate/clinical-trials/what-to-expect" target="_blank" rel="noopener noreferrer">National Cancer Institute · What to expect during a clinical trial</a></li></ul></article>`;
  }


  function render(focusId = null) {
    const focused = focusId && document.getElementById(focusId);
    const selection = focused && focused.selectionStart;
    const all = M.metrics(state.cases,now());
    app.innerHTML = `<div class="layout"><aside class="sidebar"><a class="brand" href="#queue" aria-label="Trial Review Desk home"><span class="brand-mark">${icon('mark')}</span><span><strong>Trial Review Desk</strong><small>Research operations</small></span></a><div class="nav-caption">WORKSPACE</div><nav class="nav" aria-label="Workspace navigation">${navButton('queue','Review queue','queue',state.cases.length)}${navButton('tasks','Follow-ups','tasks',all.tasks)}${navButton('analytics','Analytics','chart')}${navButton('watch','Watchlist','clock',M.watchlist(state.cases).length)}${navButton('guide','Project guide','book',null,'nav-guide')}</nav><div class="sidebar-bottom"><p class="project-label">PORTFOLIO PROJECT</p><div class="author"><span class="avatar">AU</span><span><strong>Akshata Anil Urs</strong><small>Product management portfolio</small></span></div></div></aside><div class="workspace"><header class="topbar"><div class="breadcrumbs"><span>Research operations</span>${icon('chevron')}<span>${ui.page === 'inspector' ? 'AI Evaluation Inspector' : 'Coordinator Workbench'}</span></div><div class="top-actions"><div class="clock-block">Scenario time <strong id="clock">${format(now())} IST</strong></div><div class="actor"><label for="acting-as">Reviewing as · simulated</label><select id="acting-as">${options(M.PEOPLE,ui.actor)}</select></div></div></header><div class="scenario-banner">${icon('info')}Portfolio demo · fictional records and protocols · clinical eligibility requires professional review<button data-action="nav" data-page="guide">About this project ${icon('arrow')}</button></div><main class="main" id="main" tabindex="-1"><nav class="modes" aria-label="Workspace mode"><button class="btn ${ui.page==='inspector'?'':'primary'}" aria-pressed="${ui.page!=='inspector'}" data-action="nav" data-page="queue">Coordinator Workbench</button><button class="btn ${ui.page==='inspector'?'primary':''}" aria-pressed="${ui.page==='inspector'}" data-action="nav" data-page="inspector">AI Evaluation Inspector</button></nav>${!storageOK ? '<p class="storage-warning">Changes are available for this session only because this browser blocked local saving. Keep the tab open while reviewing.</p>' : ''}${recovery ? '<p class="storage-warning">The previous saved demo could not be restored. A fresh fictional dataset has been loaded.</p>' : ''}${ui.page === 'case' ? casePage() : ui.page === 'analytics' ? analyticsPage() : ui.page === 'tasks' ? tasksPage() : ui.page === 'guide' ? guidePage() : ui.page === 'watch' ? watchPage() : ui.page === 'inspector' ? inspectorPage() : ui.page === 'memo' ? memoPage() : queuePage()}${footer()}</main></div></div>`;
    if (focusId) { const f = document.getElementById(focusId); if (f) { f.focus(); if (selection !== null && typeof selection === 'number' && f.type === 'search') f.setSelectionRange(selection,selection); } }
  }
  function persist() { try { localStorage.setItem(KEY,JSON.stringify(state)); storageOK = true; recovery = false; } catch { storageOK = false; } }
  function toast(message) { const el=document.getElementById('toast'); clearTimeout(toastTimer); el.textContent=message; el.classList.add('visible'); toastTimer=setTimeout(()=>el.classList.remove('visible'),4300); }
  function readRoute() {
    const parts = location.hash.slice(1).split('/');
    if (parts[0] === 'case' && state.cases.some(c=>c.id===parts[1])) {
      const changed = ui.caseId !== parts[1] || ui.page !== 'case' || !!parts[2]; ui.page='case'; ui.caseId=parts[1];
      if (changed) { const c=currentCase(); ui.tab='evidence'; ui.checkId=c.checks.find(ch=>ch.id===parts[2])?.id || (c.checks.find(ch=>['Insufficient information','Conflicting evidence','Not reviewed'].includes(ch.status)) || c.checks[0]).id; }
    } else ui.page = ['queue','tasks','analytics','guide','watch','inspector','memo'].includes(parts[0]) ? parts[0] : 'queue';
    render();
    if (ui.pendingSource && ui.page === 'case') {
      const target = document.getElementById('source-' + ui.pendingSource);
      ui.pendingSource = null;
      if (target) { target.focus(); target.scrollIntoView({block:'center'}); return; }
    }
    window.scrollTo({top:0});
  }
  function navigate(path) { if (location.hash === '#'+path) { readRoute(); } else location.hash=path; }
  function closeModal() { modal.close(); }
  function showModal(title, body) {
    modal.innerHTML=`<div class="modal-body"><div class="modal-top"><h2 id="modal-title">${h(title)}</h2><button class="close-btn" data-action="close-modal" aria-label="Close dialog">${icon('x')}</button></div>${body}</div>`;
    modal.showModal();
  }
  function formError() { return '<p class="error" id="modal-error" role="alert"></p>'; }
  function formActions(label,danger=false) { return `<div class="form-actions"><button type="button" class="btn" data-action="close-modal">Cancel</button><button type="submit" class="btn ${danger?'danger':'primary'}">${label}</button></div>`; }
  function taskDialog(caseId) {
    const c=M.getCase(state,caseId);
    showModal('Assign a follow-up',`<p>Attach the question to a check and record who should resolve it. This saves a fictional task; no message is sent.</p><form data-form="task"><input type="hidden" name="caseId" value="${c.id}"><div class="form-field"><label for="task-check">Protocol check</label><select id="task-check" name="checkId" required>${options(c.checks.map(x=>[x.id,x.id+' · '+x.title]),ui.checkId)}</select></div><div class="form-field"><label for="task-issue">Question or missing information</label><textarea id="task-issue" name="issue" required maxlength="1200" placeholder="Describe the clarification needed…"></textarea></div><div class="form-grid"><div class="form-field"><label for="task-owner">Follow-up owner</label><select id="task-owner" name="owner" required>${options(M.PEOPLE,'','Choose owner')}</select></div><div class="form-field"><label for="task-due">Due date and time · IST</label><input id="task-due" name="due" type="datetime-local" required value="2026-11-18T09:00"></div></div>${reviewerField('task-reviewer')}${formError()}${formActions('Save follow-up')}</form>`);
  }
  function resolveDialog(caseId,taskId) {
    const c=M.getCase(state,caseId),t=c.tasks.find(x=>x.id===taskId);
    showModal('Resolve follow-up',`<p>${h(t.issue)}</p><p class="modal-note">Resolving this task will not change ${h(t.checkId)} automatically. Reassess the check separately when evidence is available.</p><form data-form="resolve"><input type="hidden" name="caseId" value="${c.id}"><input type="hidden" name="taskId" value="${h(t.id)}"><div class="form-field"><label for="resolve-reason">Resolution note</label><textarea id="resolve-reason" name="reason" required maxlength="1200" placeholder="Explain what was resolved and reference the source…"></textarea></div>${reviewerField('resolve-reviewer')}${formError()}${formActions('Resolve task')}</form>`);
  }
  function outcomeDialog(kind,caseId) {
    const c=M.getCase(state,caseId), completion=kind==='complete', expected=M.negativeOutcome(c)?'Not supported on current evidence':'Potential fit for clinical review';
    showModal(completion?'Complete coordinator review':'Save clinical handoff',`<p>${completion?'Record the outcome of the coordinator task. This does not determine clinical eligibility or enroll a patient.':'Record a potential fit for qualified clinical review. This saves a local handoff entry; it does not send a referral.'}</p><form data-form="${kind}"><input type="hidden" name="caseId" value="${c.id}">${completion?`<div class="form-field"><label for="outcome">Recorded outcome</label><select id="outcome" name="outcome" required>${options([expected],expected)}</select></div>${M.negativeOutcome(c) ? '<div class="form-field"><label for="closure-disposition">Closure reason category</label><select id="closure-disposition" name="disposition" required><option value="">Choose reason</option><option>Ineligible</option></select></div>' : ''}`:''}<div class="form-field"><label for="outcome-reason">${completion?'Completion':'Handoff'} reason</label><textarea id="outcome-reason" name="reason" required maxlength="1200" placeholder="Summarize the reviewed evidence and next step…"></textarea></div>${reviewerField('outcome-reviewer')}${formError()}${formActions(completion?'Complete review':'Save handoff')}</form>`);
  }
  function updateDialog(caseId) {
    showModal('Load a fictional evidence update',`<p>${caseId==='C001'?'Add DOC A4, an invented result report saying DemoMarker A detected. The existing pending-result note will remain visible.':'Add an invented note that disagrees with the marker report in C006. This will reopen the completed coordinator review.'}</p><p class="modal-note">The affected check returns to Not reviewed. Prior assessments and outcomes stay in history. You must review the new evidence explicitly.</p><form data-form="evidence"><input type="hidden" name="caseId" value="${caseId}">${reviewerField('update-reviewer')}${formError()}${formActions('Load fictional update')}</form>`);
  }
  document.addEventListener('click',function(e){
    const button=e.target.closest('[data-action]'); if(!button || button.disabled)return;
    const {action,id,page,task}=button.dataset;
    try {
      if(action==='nav')navigate(page);
      else if(action==='open-case')navigate('case/'+id+(button.dataset.check?'/'+button.dataset.check:''));
      else if(action==='evidence-link') {
        const target = document.getElementById('source-' + id);
        if (modal.open) closeModal();
        if (target) { target.focus(); target.scrollIntoView({block:'center'}); }
      }
      else if(action==='ai-feedback') feedbackDialog(id,button.dataset.check,button.dataset.decision);
      else if(action==='brief') briefDialog(id);
      else if(action==='brief-source') {
        closeModal();
        ui.pendingSource = button.dataset.source;
        navigate('case/' + id + '/' + button.dataset.check);
      }
      else if(action==='disposition') dispositionDialog(id);
      else if(action==='clear-filters'){ui.filters={search:'',protocol:'',owner:'',status:''};render();}
      else if(action==='select-check'){ui.checkId=id;render();}
      else if(action==='case-tab'){ui.tab=id;render();}
      else if(action==='task-filter'){ui.taskFilter=id;render();}
      else if(action==='new-task')taskDialog(id);
      else if(action==='resolve-task')resolveDialog(id,task);
      else if(action==='handoff'||action==='complete')outcomeDialog(action,id);
      else if(action==='demo-evidence')updateDialog(id);
      else if(action==='close-modal')closeModal();
      else if(action==='reset')showModal('Reset the fictional workspace',`<p>This restores all 10 starting pairs, original fictional events, filters and scenario time. Your demonstration actions in this browser will be cleared.</p><form data-form="reset">${formActions('Reset demo',true)}</form>`);
    }catch(err){toast(err.message);}
  });
  document.addEventListener('input',e=>{if(e.target.id==='search'){ui.filters.search=e.target.value;render('search');}});
  document.addEventListener('change',e=>{if(e.target.dataset.filter){ui.filters[e.target.dataset.filter]=e.target.value;render(e.target.id);}else if(e.target.id==='acting-as'){ui.actor=e.target.value;render('acting-as');}});
  document.addEventListener('submit',function(e){
    const form=e.target.closest('[data-form]'); if(!form)return; e.preventDefault();
    const data=Object.fromEntries(new FormData(form)),type=form.dataset.form;
    const error=document.getElementById(type==='assessment'?'assessment-error':'modal-error'); if(error)error.textContent='';
    try {
      const next=M.clone(state),at=now(); let message='Saved.';
      if(type==='assessment'){M.assess(next,data,at);message='Assessment saved. Decision history updated.';}
      else if(type==='ai-feedback'){M.reviewPrediction(next,data,at);message='AI review saved in the Evaluation Inspector and decision history.';}
      else if(type==='disposition'){M.disposition(next,data,at);message='Structured disposition recorded.';}
      else if(type==='task'){data.dueAt=data.due+'+05:30';M.addTask(next,data,at);message='Follow-up assigned. No message was sent.';}
      else if(type==='resolve'){M.resolveTask(next,data,at);message='Task resolved. The check assessment is unchanged.';}
      else if(type==='handoff'){M.handoff(next,data,at);message='Clinical handoff saved for this demonstration.';}
      else if(type==='complete'){M.complete(next,data,at);message='Coordinator review complete. Clinical eligibility still requires verification.';}
      else if(type==='evidence'){M.addDemoEvidence(next,data,at);ui.checkId=M.getCase(next,data.caseId).checks[1].id;ui.tab='evidence';message='Fictional evidence added. A fresh assessment is required.';}
      else if(type==='reset'){state=M.createSeed();ui.filters={search:'',protocol:'',owner:'',status:''};ui.actor='Coordinator A';ui.tab='evidence';persist();closeModal();navigate('queue');toast('Demo reset. Starting examples restored.');return;}
      else throw new Error('Unknown action.');
      state=next;if(data.reviewer)ui.actor=data.reviewer;persist();if(type!=='assessment')closeModal();render();toast(message);
    }catch(err){if(error)error.textContent=err.message;else toast(err.message);}
  });
  document.addEventListener('keydown',e=>{
    const tab=e.target.closest('[role="tab"]');
    if(tab&&['ArrowLeft','ArrowRight','Home','End'].includes(e.key)){
      e.preventDefault();const tabs=[...document.querySelectorAll('[role="tab"]')],i=tabs.indexOf(tab),n=e.key==='Home'?0:e.key==='End'?tabs.length-1:(i+(e.key==='ArrowRight'?1:-1)+tabs.length)%tabs.length;
      ui.tab=tabs[n].dataset.id;render();document.querySelector(`[role="tab"][data-id="${ui.tab}"]`).focus();
    }
  });
  window.addEventListener('hashchange',readRoute);
  setInterval(()=>{const clock=document.getElementById('clock');if(clock)clock.textContent=format(now())+' IST';const overdue=document.getElementById('overdue-tag');if(overdue)overdue.textContent=M.metrics(M.selectCases(state,ui.filters),now()).overdue;},15000);
  persist(); readRoute();
})();

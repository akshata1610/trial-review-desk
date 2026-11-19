(function (root, factory) {
  'use strict';
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  root.TrialDesk = api;
})(globalThis, function () {
  'use strict';
  const STATUSES = ['Not reviewed', 'Met', 'Not met', 'Insufficient information', 'Conflicting evidence'];
  const EXCLUSION_STATUSES = ['Exclusion ruled out', 'Exclusion present'];
  const ERROR_TAGS = ['Outdated note', 'Wrong tumor context', 'Citation mismatch', 'Boolean rule error', 'Other'];
  const DISPOSITIONS = ['Enrolled', 'Ineligible', 'Patient declined', 'Provider decision', 'Operational barrier'];
  const WORKFLOWS = ['Not started', 'In review', 'Follow up needed', 'Ready for clinical review', 'Review complete'];
  const PEOPLE = ['Coordinator A', 'Coordinator B', 'Clinical Lead A'];
  const START = '2026-11-18T08:30:00+05:30';
  const PROTOCOLS = {
    lung: { id: 'DEMO LUNG 01', version: 'v1', type: 'Lung', marker: 'DemoMarker A', prefix: 'L', checks: ['Lung cancer documented', 'DemoMarker A detected', 'Prior treatment documented'] },
    breast: { id: 'DEMO BREAST 01', version: 'v1', type: 'Breast', marker: 'DemoMarker B', prefix: 'B', checks: ['Breast cancer documented', 'DemoMarker B detected', 'Prior treatment documented'] }
  };
  const clone = x => JSON.parse(JSON.stringify(x));
  const iso = text => new Date(text).toISOString();
  const stamp = time => iso('2026-11-18T' + time + ':00+05:30');
  const assert = (test, message) => { if (!test) throw new Error(message); };
  const text = (value, label, max = 1200) => {
    assert(typeof value === 'string' && value.trim().length > 0, label + ' is required.');
    assert(value.trim().length <= max, label + ' is too long.');
    return value.trim();
  };
  const actor = value => { assert(PEOPLE.includes(value), 'Choose a reviewer.'); return value; };
  function source(id, date, title, body) { return { id, date: date + 'T09:00:00+05:30', title, body }; }
  function seedEvent(c, time, kind, detail, reviewer = c.owner, extra = {}) {
    c.events.push({ id: c.id + '-seed-' + (c.events.length + 1), at: stamp(time), kind, detail, reviewer, seeded: true, ...extra });
  }
  function makeCase(id, patient, protocol, visit, owner, statuses, mode = '') {
    const pr = PROTOCOLS[protocol];
    const tag = id === 'C001' ? 'A' : id === 'C002' ? 'B' : id;
    const c = { id, patient, protocol, owner, visit: stamp(visit), checks: [], tasks: [], events: [], firstActionAt: null, completedAt: null, handoffAt: null, outcome: 'Unresolved', outcomeReason: '', updates: [] };
    const diagnosis = mode === 'wrong-type' ? 'lung cancer' : pr.type.toLowerCase() + ' cancer';
    const notes = [
      [source('DOC ' + tag + '1', '2026-11-10', 'Pathology summary', 'Fictional pathology summary records ' + diagnosis + '.')],
      [source('DOC ' + tag + '2', '2026-11-12', 'Marker report', pr.marker + (mode === 'negative' ? ' not detected.' : ' detected.'))],
      [source('DOC ' + tag + '3', '2026-11-13', 'Treatment history', 'Fictional history records one prior treatment course.')]
    ];
    if (mode === 'missing-marker') notes[1] = [source('DOC ' + tag + '2', '2026-11-12', 'Test request', pr.marker + ' test ordered; result pending. No result report is available.')];
    if (mode === 'conflict') {
      notes[1].push(source('DOC ' + tag + '3', '2026-11-13', 'Consultation summary', 'Summary note says ' + pr.marker + ' not detected.'));
      notes[2] = [source('DOC ' + tag + '4', '2026-11-14', 'Treatment history', 'Fictional history records one prior treatment course.')];
    }
    if (mode === 'missing-history') notes[2] = [];
    c.checks = pr.checks.map((title, i) => ({ id: pr.prefix + (i + 1), title, status: statuses[i], sources: notes[i], reviewer: statuses[i] === 'Not reviewed' ? '' : owner, reason: statuses[i] === 'Not reviewed' ? '' : 'Authored starting assessment for this fictional scenario.', updatedAt: statuses[i] === 'Not reviewed' ? null : stamp('08:00') }));
    const started = statuses.some(s => s !== 'Not reviewed');
    const exclusion = { id: 'E1', kind: 'exclusion', title: 'Prior participation in this fictional study', sources: [
      source('DOC ' + tag + 'E1', '2026-11-14', 'Fictional study register',
        id === 'C005' ? 'Prior participation in this study is documented.' : 'The study register confirms no prior participation.')
    ] };
    if (protocol === 'lung') {
      const performanceSources = [
        source('DOC ' + tag + 'P1', id === 'C007' ? '2026-10-12' : '2026-11-16', 'Performance status note',
          id === 'C007' ? 'ECOG performance status 2 was recorded at the earlier visit.' : 'ECOG performance status 1 is documented at the current assessment.')
      ];
      if (id === 'C007') performanceSources.push(source('DOC C007P2', '2026-11-17', 'Updated performance status', 'ECOG performance status 1 is documented at the current assessment.'));
      c.checks.push(startingCheck({id:'L4', title:'Current performance status meets fictional protocol', sources:performanceSources}, !started || id === 'C007' ? 'Not reviewed' : 'Met', owner));
    }
    c.checks.push(startingCheck(exclusion, !started ? 'Not reviewed' : id === 'C005' ? 'Exclusion present' : 'Exclusion ruled out', owner));
    if (started) {
      c.firstActionAt = stamp('08:00');
      for (const ch of c.checks.filter(x => x.status !== 'Not reviewed')) seedEvent(c, '08:00', 'Assessment saved', ch.id + ': ' + ch.status, owner, { checkId: ch.id, oldValue: 'Not reviewed', newValue: ch.status, reason: ch.reason });
    }
    return c;
  }
  function startingCheck(check, status, owner) {
    return { ...check, status, reviewer: status === 'Not reviewed' ? '' : owner,
      reason: status === 'Not reviewed' ? '' : 'Authored starting assessment for this fictional scenario.',
      updatedAt: status === 'Not reviewed' ? null : stamp('08:00') };
  }
  function createSeed(realTime = Date.now()) {
    const cases = [
      makeCase('C001', 'DEMO 001', 'lung', '10:00', 'Coordinator A', ['Met', 'Insufficient information', 'Met'], 'missing-marker'),
      makeCase('C002', 'DEMO 002', 'breast', '11:00', 'Coordinator B', ['Met', 'Conflicting evidence', 'Met'], 'conflict'),
      makeCase('C003', 'DEMO 003', 'lung', '11:30', 'Coordinator A', ['Not reviewed', 'Not reviewed', 'Not reviewed']),
      makeCase('C004', 'DEMO 004', 'breast', '12:00', 'Coordinator B', ['Met', 'Met', 'Met']),
      makeCase('C005', 'DEMO 005', 'lung', '12:30', 'Coordinator A', ['Met', 'Met', 'Met']),
      makeCase('C006', 'DEMO 006', 'breast', '13:00', 'Coordinator B', ['Met', 'Met', 'Met']),
      makeCase('C007', 'DEMO 007', 'lung', '13:30', 'Coordinator B', ['Met', 'Met', 'Met']),
      makeCase('C008', 'DEMO 008', 'breast', '14:00', 'Coordinator B', ['Met', 'Insufficient information', 'Not reviewed'], 'missing-marker'),
      makeCase('C009', 'DEMO 003', 'breast', '11:30', 'Coordinator A', ['Not met', 'Met', 'Met'], 'wrong-type'),
      makeCase('C010', 'DEMO 009', 'lung', '15:00', 'Coordinator A', ['Met', 'Met', 'Insufficient information'], 'missing-history')
    ];
    const byId = id => cases.find(x => x.id === id);
    const tasks = [
      ['C001', 'L2', 'Obtain the missing marker result', 'Coordinator A', '09:00'],
      ['C002', 'B2', 'Clarify disagreement between the report and note', 'Clinical Lead A', '09:30'],
      ['C008', 'B2', 'Follow up on the pending marker report', 'Coordinator B', '08:00'],
      ['C010', 'L3', 'Obtain the missing treatment history', 'Coordinator A', '09:15']
    ];
    for (const [id, checkId, issue, owner, due] of tasks) {
      const c = byId(id);
      c.tasks.push({ id: id + '-task-seed', checkId, issue, owner, dueAt: stamp(due), createdAt: stamp('08:05'), resolvedAt: null, resolution: '' });
      seedEvent(c, '08:05', 'Follow-up assigned', issue + ' · ' + owner, c.owner, { checkId, reason: 'Authored follow-up task for the fictional scenario.' });
    }
    const ready = byId('C004'); ready.handoffAt = stamp('08:15'); ready.outcome = 'Potential fit for clinical review'; ready.outcomeReason = 'All three fictional checks were reviewed; no open follow-up tasks.';
    seedEvent(ready, '08:15', 'Clinical handoff saved', ready.outcomeReason);
    const negatives = byId('C005'); const complete = byId('C006');
    for (const [c, first, finished, outcome, why] of [
      [negatives, '06:10', '07:04', 'Not supported on current evidence', 'Prior participation is an explicit exclusion in this fictional protocol.'],
      [complete, '06:00', '07:22', 'Potential fit for clinical review', 'All fictional checks are Met; coordinator review is complete.']
    ]) {
      c.events = []; c.firstActionAt = stamp(first); c.completedAt = stamp(finished); c.outcome = outcome; c.outcomeReason = why;
      for (const ch of c.checks) { ch.updatedAt = stamp(first); seedEvent(c, first, 'Assessment saved', ch.id + ': ' + ch.status, c.owner, { checkId: ch.id, oldValue: 'Not reviewed', newValue: ch.status, reason: ch.reason }); }
      seedEvent(c, finished, 'Coordinator review completed', why);
    }
    byId('C001').recheck = {checkId:'L2', label:'New fictional biomarker report', update:'marker-update'};
    negatives.disposition = { outcome:'Ineligible', verified:'no', at:stamp('07:04'), reviewer:negatives.owner, reason:'Fictional prior participation exclusion.' };
    seedEvent(negatives, '07:04', 'Disposition recorded', 'Ineligible', negatives.owner, {reason:negatives.disposition.reason});
    return { schema: 2, clock: { anchor: iso(START), startedAt: realTime }, cases };
  }
  function scenarioNow(state, realTime = Date.now()) {
    return new Date(new Date(state.clock.anchor).getTime() + Math.max(0, realTime - state.clock.startedAt)).toISOString();
  }
  function isState(state) {
    try {
      if (state?.schema !== 2 || !Number.isFinite(state.clock.startedAt) || !Number.isFinite(Date.parse(state.clock.anchor)) || !Array.isArray(state.cases) || state.cases.length !== 10) return false;
      const expected = createSeed(0).cases;
      return state.cases.every((c, index) => c.id === expected[index].id && c.patient === expected[index].patient && c.protocol === expected[index].protocol && PEOPLE.includes(c.owner) && Number.isFinite(Date.parse(c.visit)) && Array.isArray(c.checks) && c.checks.length === expected[index].checks.length && c.checks.every((ch, i) => ch.id === expected[index].checks[i].id && typeof ch.title === 'string' && allStatuses(ch).includes(ch.status) && Array.isArray(ch.sources) && ch.sources.every(s => typeof s.id === 'string' && typeof s.body === 'string' && typeof s.title === 'string' && Number.isFinite(Date.parse(s.date)))) && Array.isArray(c.tasks) && c.tasks.every(t => typeof t.id === 'string' && typeof t.issue === 'string' && PEOPLE.includes(t.owner) && c.checks.some(ch => ch.id === t.checkId) && Number.isFinite(Date.parse(t.dueAt))) && Array.isArray(c.events) && c.events.every(e => typeof e.id === 'string' && typeof e.kind === 'string' && typeof e.detail === 'string' && typeof e.reviewer === 'string' && Number.isFinite(Date.parse(e.at))) && Array.isArray(c.updates));
    } catch { return false; }
  }
  function allStatuses(check) {
    return check.kind === 'exclusion' ? [STATUSES[0], ...EXCLUSION_STATUSES, ...STATUSES.slice(3)] : STATUSES;
  }
  const passes = ch => ch.status === (ch.kind === 'exclusion' ? 'Exclusion ruled out' : 'Met');
  const disqualifies = ch => ch.status === (ch.kind === 'exclusion' ? 'Exclusion present' : 'Not met');
  const negativeOutcome = c => c.checks.some(disqualifies);
  function openTasks(c) { return c.tasks.filter(t => !t.resolvedAt); }
  function blockingChecks(c) { return c.checks.filter(ch => ['Not reviewed', 'Insufficient information', 'Conflicting evidence'].includes(ch.status)); }
  function handoffReasons(c) {
    const reasons = [];
    const unmet = c.checks.filter(ch => !passes(ch)).length;
    if (unmet) reasons.push(unmet + ' check' + (unmet === 1 ? ' is' : 's are') + ' unresolved or blocking');
    const tasks = openTasks(c).length;
    if (tasks) reasons.push(tasks + ' follow-up task' + (tasks === 1 ? ' is' : 's are') + ' open');
    return reasons;
  }
  const canHandoff = c => handoffReasons(c).length === 0;
  const canComplete = c => blockingChecks(c).length === 0 && openTasks(c).length === 0;
  function workflow(c) {
    if (c.completedAt) return 'Review complete';
    if (c.handoffAt && canHandoff(c)) return 'Ready for clinical review';
    if (openTasks(c).length || c.checks.some(ch => ['Insufficient information', 'Conflicting evidence'].includes(ch.status))) return 'Follow up needed';
    if (c.firstActionAt || c.checks.some(ch => ch.status !== 'Not reviewed')) return 'In review';
    return 'Not started';
  }
  function unresolved(c) { return openTasks(c).length > 0 || c.checks.some(ch => ['Insufficient information', 'Conflicting evidence'].includes(ch.status)); }
  function selectCases(state, filters = {}) {
    const query = (filters.search || '').trim().toLowerCase();
    return state.cases.filter(c => (!filters.protocol || c.protocol === filters.protocol) && (!filters.owner || c.owner === filters.owner) && (!filters.status || workflow(c) === filters.status) && (!query || [c.id, c.patient, PROTOCOLS[c.protocol].id, c.owner].some(v => v.toLowerCase().includes(query)))).sort((a,b) => Date.parse(a.visit) - Date.parse(b.visit) || a.id.localeCompare(b.id));
  }
  function median(values) {
    if (!values.length) return null;
    const sorted = values.slice().sort((a,b) => a-b); const mid = Math.floor(sorted.length / 2);
    return sorted.length % 2 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
  }
  function metrics(cases, now) {
    const done = cases.filter(c => c.completedAt);
    const tasks = cases.flatMap(c => openTasks(c));
    const durations = done.filter(c => c.firstActionAt && Date.parse(c.completedAt) >= Date.parse(c.firstActionAt)).map(c => (Date.parse(c.completedAt) - Date.parse(c.firstActionAt)) / 60000);
    return { total: cases.length, patients: new Set(cases.map(c => c.patient)).size, reviewed: cases.filter(c => c.checks.some(ch => ch.status !== 'Not reviewed')).length, completed: done.length, unresolved: cases.filter(unresolved).length, tasks: tasks.length, overdue: tasks.filter(t => Date.parse(t.dueAt) < Date.parse(now)).length, turnaround: median(durations), samples: durations.length, byStatus: Object.fromEntries(WORKFLOWS.map(s => [s, cases.filter(c => workflow(c) === s).length])) };
  }
  function record(state, c, at, reviewer, kind, detail, fields = {}) {
    assert(Number.isFinite(Date.parse(at)), 'A valid event time is required.');
    if (!c.firstActionAt) c.firstActionAt = at;
    c.events.push({ id: c.id + '-event-' + (c.events.length + 1) + '-' + Date.parse(at), at, reviewer, kind, detail, seeded: false, ...fields });
  }
  function invalidate(state, c, at, reviewer, reason) {
    assert(c.disposition?.outcome !== 'Enrolled', 'This fictional match has a recorded enrollment. Its review history is closed.');
    const previous = { workflow: workflow(c), outcome: c.outcome, reason: c.outcomeReason, disposition: c.disposition ?? null, completedAt: c.completedAt, handoffAt: c.handoffAt };
    c.completedAt = null; c.handoffAt = null; c.outcome = 'Unresolved'; c.outcomeReason = ''; c.disposition = null;
    if (previous.completedAt || previous.handoffAt || previous.disposition) record(state, c, at, reviewer, 'Review reopened', reason, { previous });
  }
  function getCase(state, caseId) { const c = state.cases.find(x => x.id === caseId); assert(c, 'The case could not be found.'); return c; }
  function getCheck(c, checkId) { const check = c.checks.find(x => x.id === checkId); assert(check, 'Choose a valid check.'); return check; }
  function assess(state, data, at) {
    const reviewer = actor(data.reviewer), reason = text(data.reason, 'Assessment reason');
    const c = getCase(state, data.caseId), ch = getCheck(c, data.checkId);
    assert(allStatuses(ch).slice(1).includes(data.status), 'Choose an assessment for this criterion.');
    assert(allStatuses(ch).slice(3).includes(data.status) || ch.sources.length > 0, 'A definitive assessment needs source evidence.');
    if (data.sourceId) assert(ch.sources.some(item => item.id === data.sourceId), 'Choose evidence from this criterion.');
    const oldValue = ch.status;
    invalidate(state, c, at, reviewer, 'A check assessment changed. Previous outcome retained in history.');
    Object.assign(ch, { status: data.status, reason, reviewer, sourceId: data.sourceId || null, updatedAt: at });
    record(state, c, at, reviewer, 'Assessment saved', ch.id + ': ' + oldValue + ' → ' + ch.status, { checkId: ch.id, oldValue, newValue: ch.status, sourceId: ch.sourceId, reason });
  }
  function addTask(state, data, at) {
    const reviewer = actor(data.reviewer), issue = text(data.issue, 'Follow-up issue'), owner = actor(data.owner);
    assert(Number.isFinite(Date.parse(data.dueAt)), 'Choose a due date and time.');
    const c = getCase(state, data.caseId); getCheck(c, data.checkId);
    invalidate(state, c, at, reviewer, 'A follow-up task was added.');
    const task = { id: c.id + '-task-' + (c.tasks.length + 1), checkId: data.checkId, issue, owner, dueAt: iso(data.dueAt), createdAt: at, resolvedAt: null, resolution: '' };
    c.tasks.push(task);
    record(state, c, at, reviewer, 'Follow-up assigned', issue + ' · ' + owner, { checkId: data.checkId, taskId: task.id, dueAt: task.dueAt, reason: issue });
  }
  function resolveTask(state, data, at) {
    const reviewer = actor(data.reviewer), reason = text(data.reason, 'Resolution note');
    const c = getCase(state, data.caseId), t = c.tasks.find(t => t.id === data.taskId);
    assert(t && !t.resolvedAt, 'This task is already resolved or unavailable.');
    t.resolvedAt = at; t.resolution = reason;
    record(state, c, at, reviewer, 'Follow-up resolved', t.issue, { checkId: t.checkId, taskId: t.id, reason });
  }
  function handoff(state, data, at) {
    const reviewer = actor(data.reviewer), reason = text(data.reason, 'Handoff reason'), c = getCase(state, data.caseId);
    assert(canHandoff(c), 'Handoff blocked: ' + handoffReasons(c).join('; ') + '.');
    assert(!c.completedAt, 'Reopen or change the review before saving another handoff.');
    c.handoffAt = at; c.outcome = 'Potential fit for clinical review'; c.outcomeReason = reason;
    record(state, c, at, reviewer, 'Clinical handoff saved', 'Potential fit for clinical review. ' + reason, { reason });
  }
  function complete(state, data, at) {
    const reviewer = actor(data.reviewer), reason = text(data.reason, 'Completion reason'), c = getCase(state, data.caseId);
    assert(canComplete(c), 'Review cannot be completed while checks or follow-up tasks are unresolved.');
    assert(!c.completedAt, 'This coordinator review is already complete.');
    const expected = negativeOutcome(c) ? 'Not supported on current evidence' : 'Potential fit for clinical review';
    assert(data.outcome === expected, 'Choose the outcome that matches the recorded assessments.');
    if (negativeOutcome(c)) {
      assert(data.disposition === 'Ineligible', 'Record the structured Ineligible disposition to close this review.');
      saveDisposition(c, data.disposition, 'no', reviewer, reason, at);
    }
    c.completedAt = at; c.outcome = data.outcome; c.outcomeReason = reason;
    record(state, c, at, reviewer, 'Coordinator review completed', c.outcome + '. ' + reason, { reason, outcome: c.outcome });
  }
  function addDemoEvidence(state, data, at) {
    const reviewer = actor(data.reviewer), c = getCase(state, data.caseId);
    assert(['C001', 'C006'].includes(c.id), 'This case has no staged update.');
    assert(!c.updates.includes('marker-update'), 'The fictional update has already been added.');
    const ch = c.checks[1]; const oldValue = ch.status;
    invalidate(state, c, at, reviewer, 'New fictional marker evidence arrived. The previous outcome needs review.');
    const item = c.id === 'C001' ? source('DOC A4', '2026-11-17', 'New marker result', 'DemoMarker A detected. This is the fictional result that was previously pending.') : source('DOC C0065', '2026-11-18', 'New clarification note', 'New fictional summary records DemoMarker B not detected. It disagrees with the earlier marker report. A reviewer must clarify the discrepancy.');
    if (c.id === 'C006') item.date = at;
    ch.sources.push(item); ch.status = 'Not reviewed'; ch.reviewer = ''; ch.reason = ''; ch.updatedAt = null;
    c.updates.push('marker-update');
    record(state, c, at, reviewer, 'Fictional evidence added', item.id + ' added. ' + ch.id + ' needs a fresh assessment.', { checkId: ch.id, oldValue, newValue: 'Not reviewed', sourceId: item.id, reason: 'Staged demonstration update; original sources retained.' });
  }
  function saveDisposition(c, outcome, verified, reviewer, reason, at) {
    const previous = c.disposition || null;
    c.disposition = {outcome, verified, reviewer, reason, at};
    record(null, c, at, reviewer, 'Disposition recorded', outcome, {reason, priorDisposition: previous?.outcome});
  }
  function disposition(state, data, at) {
    const c = getCase(state, data.caseId);
    const reviewer = actor(data.reviewer);
    assert(c.handoffAt || c.completedAt, 'Save a handoff or complete the review first.');
    assert(!c.disposition, 'This match already has a recorded disposition.');
    assert(DISPOSITIONS.includes(data.outcome), 'Choose a disposition reason.');
    assert(['yes','no','unknown'].includes(data.verified), 'Choose the verification status.');
    assert(data.outcome !== 'Enrolled' || (data.verified === 'yes' && canHandoff(c)), 'Enrollment needs verified eligibility and a cleared review.');
    assert(data.outcome !== 'Ineligible' || data.verified === 'no', 'An ineligible disposition requires a negative verification status.');
    assert(!negativeOutcome(c) || data.outcome === 'Ineligible', 'The confirmed exclusion or unmet inclusion must be recorded as Ineligible.');
    saveDisposition(c, data.outcome, data.verified, reviewer, data.reason?.trim().slice(0,1200) || data.outcome, at);
  }
  function watchlist(cases) {
    return cases.flatMap(c => {
      const outstanding = c.checks.filter(ch => !passes(ch));
      const check = c.checks.find(ch => ch.id === c.recheck?.checkId);
      if (!check || c.completedAt || c.disposition || outstanding.length !== 1 || outstanding[0] !== check) return [];
      const arrived = c.updates.includes(c.recheck.update);
      if ((!arrived && check.status !== 'Insufficient information') || (arrived && check.status !== 'Not reviewed')) return [];
      const task = openTasks(c).find(t => t.checkId === check.id);
      return [{case:c, check, arrived, trigger:c.recheck.label, owner:task?.owner || c.owner, due:task?.dueAt || c.visit}];
    });
  }

  // Frozen authored predictions and independent reference labels. A positive
  // label means that one check blocks progression or needs clarification.
  const EVAL = Object.freeze([
    ['C001','L2','Insufficient information','DOC A2','DOC A2',true,'test ordered'],
    ['C002','B2','Met','DOC B2',null,true,'DemoMarker B detected.'],
    ['C004','B1','Met','DOC C0041','DOC C0041',false,'records breast cancer.'],
    ['C005','E1','Exclusion present','DOC C005E1','DOC C005E1',true,'Prior participation in this study is documented.'],
    ['C007','L4','Not met','DOC C007P1','DOC C007P2',false,'ECOG performance status 2'],
    ['C009','B1','Not met','DOC C0091','DOC C0091',true,'records lung cancer.'],
    ['C010','L3','Insufficient information',null,null,true,'']
  ].map(([caseId,checkId,status,sourceId,referenceSource,referenceBlocks,quote]) =>
    Object.freeze({caseId,checkId,status,sourceId,referenceSource,referenceBlocks,quote})));
  const prediction = (caseId, checkId) => EVAL.find(row => row.caseId === caseId && row.checkId === checkId);
  function evaluation(state) {
    const rows = EVAL;
    const predictedBlocks = row => !['Met','Exclusion ruled out'].includes(row.status);
    const tp = rows.filter(row => row.referenceBlocks && predictedBlocks(row)).length;
    const fp = rows.filter(row => !row.referenceBlocks && predictedBlocks(row)).length;
    const fn = rows.filter(row => row.referenceBlocks && !predictedBlocks(row)).length;
    const cited = rows.filter(row => row.sourceId);
    const correct = cited.filter(row => {
      const check = getCheck(getCase(state,row.caseId),row.checkId);
      return row.sourceId === row.referenceSource && check.sources.some(source => source.id === row.sourceId && source.body.includes(row.quote));
    }).length;
    const feedback = state.cases.flatMap(c => c.events.slice().reverse().filter(e => e.kind === 'AI suggestion reviewed').map(e => ({caseId:c.id, ...e})))
      .sort((a,b) => Date.parse(b.at)-Date.parse(a.at));
    return {tp,fp,fn,correct,cited:cited.length,total:rows.length,rows,feedback};
  }
  function reviewActivity(feedback) {
    const reviewed = new Set();
    const overridden = new Set();
    let overrideActions = 0;
    for (const action of feedback) {
      const key = action.caseId + '/' + action.checkId;
      reviewed.add(key);
      if (action.tag) {
        overridden.add(key);
        overrideActions++;
      }
    }
    return {reviewed:reviewed.size, overridden:overridden.size, overrideActions};
  }
  function reviewPrediction(state, data, at) {
    const c = getCase(state,data.caseId);
    const check = getCheck(c,data.checkId);
    const original = prediction(c.id,check.id);
    assert(original, 'This check has no simulated suggestion.');
    assert(['keep','override'].includes(data.decision), 'Choose Keep or Override.');
    if (data.decision === 'override') {
      assert(ERROR_TAGS.includes(data.tag), 'Choose an error tag.');
      assert(data.sourceId || !check.sources.length, 'Select the evidence that supports the correction.');
      assert(data.status !== original.status || data.sourceId !== original.sourceId, 'Change the assessment or its evidence citation.');
    }
    const input = data.decision === 'keep' ? {...data,status:original.status,sourceId:original.sourceId,reason:data.reason || 'Reviewed and kept the simulated suggestion.'} : data;
    assess(state,input,at);
    record(state,c,at,data.reviewer,'AI suggestion reviewed',data.decision === 'keep' ? 'Kept simulated suggestion' : 'Overrode simulated suggestion', {
      checkId:check.id, reason:check.reason, tag:data.decision === 'override' ? data.tag : null,
      originalStatus:original.status, originalSource:original.sourceId, correctedStatus:check.status, correctedSource:check.sourceId
    });
  }
  function bottlenecks(cases) {
    const reviewed = cases.filter(c => c.completedAt && c.checks.every(ch => passes(ch) || disqualifies(ch)));
    const counts = new Map();
    for (const c of reviewed) {
      const blockers = c.checks.filter(disqualifies);
      for (const ch of blockers) {
        const id = c.protocol + '/' + ch.id;
        const row = counts.get(id) || {criterion:ch.title, protocol:PROTOCOLS[c.protocol].id,
          total:reviewed.filter(r => r.protocol === c.protocol).length, blocked:0, sole:0};
        row.blocked++;
        if (blockers.length === 1) row.sole++;
        counts.set(id,row);
      }
    }
    return [...counts.values()].sort((a,b) => b.sole-a.sole || b.blocked-a.blocked);
  }
  function visitBrief(c) {
    const reviewed = c.checks.filter(passes);
    const blocker = c.checks.find(ch => !passes(ch));
    const task = openTasks(c)[0];
    const best = reviewed.find(ch => ch.sourceId) || reviewed.find(ch => ch.id.endsWith('2')) || reviewed[0];
    const sourceId = best?.sourceId || best?.sources[0]?.id;
    const source = best?.sources.find(item => item.id === sourceId);
    return {protocol:PROTOCOLS[c.protocol].id, checkId:best?.id, evidence:source ? best.title + ' · ' + source.body : 'Reviewed evidence pending',
      source, remaining:blocker?.title || task?.issue || 'No open protocol check or follow-up in this demo.',
      next:negativeOutcome(c) ? 'Review the documented blocker before discussing this trial.' : blocker || task ? 'Review the remaining question with the named coordinator.' : 'Discuss this potential match with the qualified study team.'};
  }
  return { EXCLUSION_STATUSES, ERROR_TAGS, DISPOSITIONS, allStatuses, passes, negativeOutcome, disposition, watchlist, evaluation, reviewActivity, prediction, reviewPrediction, bottlenecks, visitBrief, STATUSES, WORKFLOWS, PEOPLE, PROTOCOLS, START, clone, createSeed, scenarioNow, isState, openTasks, blockingChecks, canHandoff, canComplete, handoffReasons, workflow, unresolved, selectCases, metrics, median, getCase, assess, addTask, resolveTask, handoff, complete, addDemoEvidence };
});

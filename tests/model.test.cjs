const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const M = require('../src/model.js');
const REAL = 1000000;
const AT = '2026-11-18T08:35:00+05:30';
const seed = () => M.createSeed(REAL);
const get = (s,id) => M.getCase(s,id);
const assessment = (caseId,checkId,status,extra={}) => ({caseId,checkId,status,reviewer:'Coordinator A',reason:'Reviewed the named fictional source.',...extra});

test('seed has ten distinct pairs, nine patients and two protocols',()=>{
  const s=seed();assert.equal(s.cases.length,10);assert.equal(new Set(s.cases.map(c=>c.id)).size,10);assert.equal(new Set(s.cases.map(c=>c.patient)).size,9);assert.equal(new Set(s.cases.map(c=>c.protocol)).size,2);assert.ok(M.isState(s));
});
test('independent initial metric expectations match the authored records',()=>{
  const m=M.metrics(seed().cases,M.START);
  assert.deepEqual({total:m.total,patients:m.patients,reviewed:m.reviewed,completed:m.completed,unresolved:m.unresolved,tasks:m.tasks,overdue:m.overdue,turnaround:m.turnaround,samples:m.samples},{total:10,patients:9,reviewed:9,completed:2,unresolved:4,tasks:4,overdue:1,turnaround:68,samples:2});
  assert.deepEqual(m.byStatus,{'Not started':1,'In review':2,'Follow up needed':4,'Ready for clinical review':1,'Review complete':2});
});
test('two trials for one patient count as two pairs and one patient',()=>{
  const s=seed(), pairs=M.selectCases(s,{search:'DEMO 003'}),m=M.metrics(pairs,M.START);assert.equal(m.total,2);assert.equal(m.patients,1);
});
test('owner, protocol, status and search filters use the same pair set',()=>{
  const s=seed();assert.equal(M.selectCases(s,{protocol:'lung'}).length,5);assert.equal(M.selectCases(s,{owner:'Coordinator B'}).length,5);
  const c=M.selectCases(s,{protocol:'breast',owner:'Coordinator B',status:'Follow up needed',search:'C002'});assert.deepEqual(c.map(c=>c.id),['C002']);assert.equal(M.metrics(c,M.START).total,1);
});
test('default queue order is by visit, with pair ID as tie breaker',()=>{
  assert.deepEqual(M.selectCases(seed()).map(c=>c.id),['C001','C002','C003','C009','C004','C005','C006','C007','C008','C010']);
});
test('empty filters produce an empty denominator and no turnaround sample',()=>{
  const m=M.metrics(M.selectCases(seed(),{search:'NO SUCH PAIR'}),M.START);assert.equal(m.total,0);assert.equal(m.turnaround,null);assert.equal(m.samples,0);assert.equal(m.tasks,0);
});
test('median calculates odd, even and empty sets without altering input',()=>{
  const a=[82,54];assert.equal(M.median(a),68);assert.deepEqual(a,[82,54]);assert.equal(M.median([4,1,3]),3);assert.equal(M.median([]),null);
});
test('scenario clock uses elapsed time and never moves before its anchor',()=>{
  const s=seed();assert.equal(M.scenarioNow(s,REAL),new Date(M.START).toISOString());assert.equal(Date.parse(M.scenarioNow(s,REAL+60000))-Date.parse(M.START),60000);assert.equal(M.scenarioNow(s,REAL-1),new Date(M.START).toISOString());
});
test('Case A pending result remains missing rather than negative',()=>{
  const c=get(seed(),'C001');assert.equal(c.checks[1].status,'Insufficient information');assert.match(c.checks[1].sources[0].body,/result pending/);assert.equal(M.canHandoff(c),false);assert.equal(M.canComplete(c),false);
});
test('Case B preserves two contradictory sources and blocks handoff',()=>{
  const s=seed(),c=get(s,'C002');assert.equal(c.checks[1].sources.length,2);assert.match(c.checks[1].sources[0].body,/detected/);assert.match(c.checks[1].sources[1].body,/not detected/);assert.throws(()=>M.handoff(s,{caseId:c.id,reviewer:'Coordinator A',reason:'Attempt'},AT),/blocked/);
});
test('blank and invalid reviewers cannot save assessments',()=>{
  const s=seed();assert.throws(()=>M.assess(s,assessment('C001','L2','Met',{reviewer:''}),AT),/reviewer/);assert.throws(()=>M.assess(s,assessment('C001','L2','Met',{reviewer:'Unknown'}),AT),/reviewer/);
});
test('assessment reasons are required and whitespace is rejected',()=>{
  assert.throws(()=>M.assess(seed(),assessment('C001','L2','Met',{reason:'   '}),AT),/reason/);
});
test('assessment cannot be set to an unrecognized or unreviewed value',()=>{
  assert.throws(()=>M.assess(seed(),assessment('C001','L2','Eligible'),AT),/assessment/);assert.throws(()=>M.assess(seed(),assessment('C001','L2','Not reviewed'),AT),/assessment/);
});
test('a check without any source cannot be assessed Met or Not met',()=>{
  const s=seed();assert.throws(()=>M.assess(s,assessment('C010','L3','Met'),AT),/source evidence/);M.assess(s,assessment('C010','L3','Insufficient information'),AT);assert.equal(get(s,'C010').checks[2].status,'Insufficient information');
});
test('saved assessment records actor, reason, prior value, new value and time',()=>{
  const s=seed();M.assess(s,assessment('C001','L2','Conflicting evidence'),AT);const e=get(s,'C001').events.at(-1);assert.equal(e.oldValue,'Insufficient information');assert.equal(e.newValue,'Conflicting evidence');assert.equal(e.checkId,'L2');assert.equal(e.reviewer,'Coordinator A');assert.equal(e.reason,'Reviewed the named fictional source.');assert.equal(e.at,AT);assert.equal(e.seeded,false);
});
test('follow-up requires issue, owner, due time and valid check',()=>{
  const data={caseId:'C003',checkId:'L1',reviewer:'Coordinator A',owner:'Coordinator B',issue:'Clarify source',dueAt:AT};
  for(const [key,value] of [['issue',''],['owner',''],['dueAt','invalid'],['checkId','BAD']]) assert.throws(()=>M.addTask(seed(),{...data,[key]:value},AT));
});
test('adding a follow-up assigns ownership and reopens a completed review',()=>{
  const s=seed();M.addTask(s,{caseId:'C006',checkId:'B2',reviewer:'Coordinator A',owner:'Clinical Lead A',issue:'Clarify new evidence',dueAt:AT},AT);const c=get(s,'C006');assert.equal(c.completedAt,null);assert.equal(c.outcome,'Unresolved');assert.equal(c.tasks.at(-1).owner,'Clinical Lead A');assert.equal(M.workflow(c),'Follow up needed');assert.ok(c.events.some(e=>e.kind==='Review reopened'&&e.previous.completedAt));
});
test('resolving a task requires a meaningful note',()=>{
  const s=seed();assert.throws(()=>M.resolveTask(s,{caseId:'C001',taskId:'C001-task-seed',reviewer:'Coordinator A',reason:' '},AT),/Resolution/);assert.equal(get(s,'C001').tasks[0].resolvedAt,null);
});
test('closing a follow-up does not modify the check or unblock a conflict',()=>{
  const s=seed();M.resolveTask(s,{caseId:'C002',taskId:'C002-task-seed',reviewer:'Clinical Lead A',reason:'Requested clarification; assessment still needs review.'},AT);const c=get(s,'C002');assert.equal(c.checks[1].status,'Conflicting evidence');assert.equal(M.canComplete(c),false);assert.equal(c.outcome,'Unresolved');
});
test('a resolved task cannot be resolved twice',()=>{
  const s=seed(),d={caseId:'C001',taskId:'C001-task-seed',reviewer:'Coordinator A',reason:'Resolved.'};M.resolveTask(s,d,AT);assert.throws(()=>M.resolveTask(s,d,AT),/already resolved/);
});
test('new Case A evidence preserves the old source and requires reassessment',()=>{
  const s=seed();M.addDemoEvidence(s,{caseId:'C001',reviewer:'Coordinator A'},AT);const c=get(s,'C001');assert.equal(c.checks[1].sources.length,2);assert.equal(c.checks[1].sources[0].id,'DOC A2');assert.equal(c.checks[1].sources[1].id,'DOC A4');assert.equal(c.checks[1].status,'Not reviewed');assert.equal(M.canHandoff(c),false);
});
test('a staged fictional evidence update cannot be applied twice',()=>{
  const s=seed(),d={caseId:'C001',reviewer:'Coordinator A'};M.addDemoEvidence(s,d,AT);assert.throws(()=>M.addDemoEvidence(s,d,AT),/already been added/);
});
test('complete Case A sequence requires explicit assessment and task resolution',()=>{
  const s=seed(),d={caseId:'C001',reviewer:'Coordinator A',reason:'Reviewed DOC A4 and resolved the missing result.'};
  M.addDemoEvidence(s,d,AT);M.assess(s,assessment('C001','L2','Met'),AT);assert.equal(M.canHandoff(get(s,'C001')),false);
  M.resolveTask(s,{...d,taskId:'C001-task-seed'},AT);assert.equal(M.canHandoff(get(s,'C001')),true);
  M.handoff(s,d,AT);assert.equal(M.workflow(get(s,'C001')),'Ready for clinical review');assert.equal(get(s,'C001').completedAt,null);
  M.complete(s,{...d,outcome:'Potential fit for clinical review'},AT);assert.equal(M.workflow(get(s,'C001')),'Review complete');
  const m=M.metrics(s.cases,AT);assert.equal(m.completed,3);assert.equal(m.unresolved,3);assert.equal(m.tasks,3);assert.equal(m.turnaround,54);
});
test('Not met assessment blocks potential-fit handoff but supports explicit negative closure',()=>{
  const s=seed(),c=get(s,'C009');assert.equal(M.canHandoff(c),false);assert.equal(M.canComplete(c),true);
  assert.throws(()=>M.complete(s,{caseId:c.id,reviewer:'Coordinator A',reason:'Reviewed',outcome:'Potential fit for clinical review'},AT),/matches/);
  M.complete(s,{caseId:c.id,reviewer:'Coordinator A',reason:'Cancer type does not match this fictional protocol.',outcome:'Not supported on current evidence',disposition:'Ineligible'},AT);assert.equal(c.outcome,'Not supported on current evidence');
});
test('completion blocked with unreviewed checks, gaps, conflicts or open tasks',()=>{
  for(const id of ['C001','C002','C003','C008','C010'])assert.throws(()=>M.complete(seed(),{caseId:id,reviewer:'Coordinator A',reason:'Attempt',outcome:'Potential fit for clinical review'},AT),/unresolved/);
});
test('new evidence reopens a completed case and retains the old outcome in history',()=>{
  const s=seed(),before=get(s,'C006').events.length;M.addDemoEvidence(s,{caseId:'C006',reviewer:'Coordinator B'},AT);const c=get(s,'C006');assert.equal(c.completedAt,null);assert.equal(c.outcome,'Unresolved');assert.equal(c.checks[1].status,'Not reviewed');assert.equal(M.workflow(c),'In review');assert.ok(c.events.length>before);assert.ok(c.events.some(e=>e.previous?.outcome==='Potential fit for clinical review'));assert.equal(M.metrics(s.cases,AT).completed,1);assert.equal(M.metrics(s.cases,AT).turnaround,54);
});
test('changed assessment invalidates a saved handoff',()=>{
  const s=seed();M.assess(s,assessment('C004','B2','Conflicting evidence'),AT);const c=get(s,'C004');assert.equal(c.handoffAt,null);assert.equal(c.outcome,'Unresolved');assert.equal(M.workflow(c),'Follow up needed');
});
test('new evidence is dated at its arrival time rather than later in the scenario',()=>{
  const s=seed();M.addDemoEvidence(s,{caseId:'C006',reviewer:'Coordinator B'},AT);assert.equal(get(s,'C006').checks[1].sources.at(-1).date,AT);
});
test('elapsed turnaround excludes currently reopened reviews',()=>{
  const s=seed();M.assess(s,assessment('C005','L2','Met'),AT);const m=M.metrics(s.cases,AT);assert.equal(m.samples,1);assert.equal(m.turnaround,82);
});
test('unresolved pairs are counted once even with multiple open tasks',()=>{
  const s=seed();M.addTask(s,{caseId:'C001',checkId:'L2',reviewer:'Coordinator A',owner:'Coordinator B',issue:'A second question',dueAt:AT},AT);const m=M.metrics(s.cases,AT);assert.equal(m.unresolved,4);assert.equal(m.tasks,5);
});
test('state serializes and validates after a real demonstration action',()=>{
  const s=seed();M.assess(s,assessment('C003','L1','Met'),AT);assert.ok(M.isState(JSON.parse(JSON.stringify(s))));
});
test('malformed persisted data is rejected rather than used for metrics',()=>{
  assert.equal(M.isState({schema:100}),false);assert.equal(M.isState(null),false);const s=seed();s.cases[0].checks[0].status='Eligible';assert.equal(M.isState(s),false);
});
test('reset returns original task counts, history and metrics',()=>{
  const s=seed();M.resolveTask(s,{caseId:'C001',taskId:'C001-task-seed',reviewer:'Coordinator A',reason:'Done'},AT);const reset=seed();assert.equal(M.metrics(reset.cases,M.START).tasks,4);assert.equal(reset.cases.flatMap(c=>c.events).filter(e=>!e.seeded).length,0);assert.equal(M.metrics(reset.cases,M.START).turnaround,68);
});
test('distributed HTML contains all behavior and no external resource dependencies',()=>{
  const html=fs.readFileSync(path.resolve(__dirname,'../dist/index.html'),'utf8');assert.ok(html.includes('window.TrialDesk'));assert.ok(html.includes('Fictional records'));assert.ok(!/<script[^>]+src=/.test(html));assert.ok(!/<link[^>]+stylesheet/.test(html));assert.ok(!/@import/.test(html));assert.ok(!/fetch\(/.test(html));
});

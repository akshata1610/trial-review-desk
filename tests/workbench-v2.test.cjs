const test = require('node:test');
const assert = require('node:assert/strict');
const model = require('../src/model.js');
const at = '2026-11-18T08:36:00+05:30';
const seed = () => model.createSeed(0);
const reviewer = 'Coordinator A';
const staleCorrection = {caseId:'C007', checkId:'L4', reviewer, decision:'override', tag:'Outdated note',
  status:'Met', sourceId:'DOC C007P2', reason:'Current assessment supersedes the older note.'};

test('explicit exclusion blocks handoff even when every inclusion passes', () => {
  const c = model.getCase(seed(),'C005');
  assert.ok(c.checks.filter(ch => ch.kind !== 'exclusion').every(model.passes));
  assert.equal(c.checks.find(ch => ch.kind === 'exclusion').status,'Exclusion present');
  assert.equal(model.canHandoff(c),false);
  assert.equal(c.disposition.outcome,'Ineligible');
});

test('negative closure requires a structured category and an auditable reason', () => {
  const state=seed(), data={caseId:'C009',reviewer, outcome:'Not supported on current evidence',reason:'Cancer type differs.'};
  assert.throws(()=>model.complete(state,data,at),/structured/);
  model.complete(state,{...data,disposition:'Ineligible'},at);
  assert.equal(model.getCase(state,data.caseId).disposition.outcome,'Ineligible');
});

test('structured enrollment requires that eligibility was verified', () => {
  const state=seed(), data={caseId:'C004',reviewer,outcome:'Enrolled'};
  assert.throws(()=>model.disposition(state,{...data,verified:'unknown'},at),/verified eligibility/);
  model.disposition(state,{...data,verified:'yes'},at);
  assert.equal(model.getCase(state,'C004').disposition.outcome,'Enrolled');
  assert.throws(()=>model.assess(state,{caseId:'C004',checkId:'B1',reviewer,status:'Not met',reason:'Changed.'},at),/recorded enrollment/);
});

test('watchlist trigger leaves the case blocked until reassessed', () => {
  const state=seed();
  assert.deepEqual(model.watchlist(state.cases).map(x=>x.case.id),['C001']);
  model.addDemoEvidence(state,{caseId:'C001',reviewer},at);
  const row=model.watchlist(state.cases)[0];
  assert.equal(row.arrived,true);
  assert.equal(row.check.status,'Not reviewed');
  assert.equal(model.canHandoff(row.case),false);
  model.assess(state,{caseId:'C001',checkId:'L2',reviewer,status:'Met',reason:'New result.'},at);
  assert.equal(model.watchlist(state.cases).length,0);
  assert.equal(model.canHandoff(row.case),false);
});

test('a confirmed exclusion removes a case from the near-miss list', () => {
  const state=seed();
  model.assess(state,{caseId:'C001',checkId:'E1',reviewer,status:'Exclusion present',reason:'Synthetic exclusion evidence.'},at);
  assert.equal(model.watchlist(state.cases).length,0);
});

test('override keeps the initial citation, persists feedback and leaves benchmark fixed', () => {
  const state=seed(), before=model.evaluation(state);
  assert.deepEqual([before.tp,before.fp,before.fn,before.correct,before.cited,before.total],[4,1,1,4,6,7]);
  assert.throws(()=>model.reviewPrediction(state,{...staleCorrection,tag:''},at),/error tag/);
  assert.throws(()=>model.reviewPrediction(state,{...staleCorrection,sourceId:'DOC B2'},at),/from this criterion/);
  model.reviewPrediction(state,staleCorrection,at);
  const {feedback,...after}=model.evaluation(state);
  assert.deepEqual(after,Object.fromEntries(Object.entries(before).filter(([key])=>key!=='feedback')));
  assert.equal(feedback[0].originalSource,'DOC C007P1');
  assert.equal(feedback[0].correctedSource,'DOC C007P2');
  assert.equal(feedback[0].tag,'Outdated note');
  assert.equal(model.canHandoff(model.getCase(state,'C007')),true);
  assert.ok(model.isState(JSON.parse(JSON.stringify(state))));
});

test('bottlenecks distinguish sole causes from criteria with multiple blockers', () => {
  const state=seed();
  assert.equal(model.bottlenecks(state.cases)[0].sole,1);
  model.assess(state,{caseId:'C005',checkId:'L2',reviewer,status:'Not met',reason:'Second fictional blocker.'},at);
  model.complete(state,{caseId:'C005',reviewer,reason:'Two blockers.',outcome:'Not supported on current evidence',disposition:'Ineligible'},at);
  const rows=model.bottlenecks(state.cases);
  assert.equal(rows.length,2);
  assert.ok(rows.every(row=>row.blocked===1 && row.sole===0 && row.total===1));
});

test('visit brief prefers the coordinator’s selected source and reflects the review', () => {
  const state=seed();
  model.reviewPrediction(state,staleCorrection,at);
  const brief=model.visitBrief(model.getCase(state,'C007'));
  assert.equal(brief.source.id,'DOC C007P2');
  assert.match(brief.next,/qualified study team/);
});

test('human review counts distinguish repeated corrections and keep decisions', () => {
  const state=seed();
  model.reviewPrediction(state,staleCorrection,at);
  model.reviewPrediction(state,{...staleCorrection,reviewer:'Coordinator B',reason:'Second review of the current note.'},at);
  model.reviewPrediction(state,{caseId:'C004',checkId:'B1',reviewer,decision:'keep'},at);
  const {feedback}=model.evaluation(state);
  assert.deepEqual(model.reviewActivity(feedback),{reviewed:2,overridden:1,overrideActions:2});
  const corrections=feedback.filter(row=>row.tag);
  assert.deepEqual(corrections.map(row=>row.reviewer),['Coordinator B','Coordinator A']);
  assert.ok(corrections.every(row=>row.at===at && row.originalSource==='DOC C007P1' && row.correctedSource==='DOC C007P2'));
  assert.deepEqual(model.reviewActivity(model.evaluation(seed()).feedback),{reviewed:0,overridden:0,overrideActions:0});
});

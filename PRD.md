# Trial Review Desk Product Requirements Document

**Version 2.1 · Independent product portfolio project · Akshata Anil Urs**

## 1. Problem and audience

An oncology trial coordinator may need to compare a possible patient–trial pair against a protocol, account for missing or conflicting evidence, and explain the next action to another reviewer. The product hypothesis is that keeping the source, assessment, and follow-up owner together can make that handoff clearer. Desk research informed the concept. Coordinator discovery and clinical validation remain future work.

The primary user is a clinical research coordinator. A clinical lead receives questions requiring professional judgment. The demo starts with a shortlist of possible matches. It uses ten fictional patient–trial pairs, nine fictional patients, and two invented protocols.

## 2. Goals and scope

**Goal.** Give coordinators traceable decisions and a clear next action for each possible match. Give product teams visibility into where manual review is needed.

**In scope.** The prototype includes the review queue, criterion-level evidence review, task assignment and resolution, decision history, coordinator handoff and completion, and filtered workflow metrics. Records and evidence updates are prewritten. The prototype runs in one browser using local storage where available. **Future scope.** Shared workspaces, hospital integrations, and automated matching would require separate discovery. Qualified study teams make eligibility and enrollment decisions.

## 3. Workflow

1. Open a patient–trial pair in the queue.
2. Compare a protocol check with its dated source excerpts. Save an assessment and a reason.
3. For missing or conflicting information, assign a follow-up to an owner with a deadline. Resolve the task with a note when the question is addressed. Reassess separately when needed.
4. Save a handoff when all inclusions are marked **Met**, all exclusions are ruled out, and there are no open tasks. Record the coordinator review outcome and reason to complete the review.
5. If evidence changes, recheck the affected item. Retain the prior outcome in decision history.

See the [workflow diagram](docs/Workflow.md) and [user stories](docs/User_Stories.md) for example scenarios.

## 4. Requirements and acceptance criteria

| ID | Requirement | Acceptance criterion |
|---|---|---|
| R1 | Find a pair and its evidence | Sort the queue by upcoming visit. Search or filter by protocol, owner, or status. Opening a check shows the dated source ID and excerpt. An absent source is visible as a gap. |
| R2 | Record uncertainty | Support Met, Not met, Insufficient information, and Conflicting evidence. Require reviewer and reason on save. C001 shows a pending report. C002 shows both conflicting records and leaves their interpretation to the reviewer. |
| R3 | Keep follow-up separate | Require a linked check, issue, owner, and deadline. Require a note when resolving a task. Closing a task leaves the criterion assessment unchanged. |
| R4 | Preserve decisions | Record reviewer, timestamp, reason, and previous and new values when relevant. C006 reopens on new evidence, asks for reassessment, and retains the prior outcome. |
| R5 | Gate handoff | Enable handoff only when all inclusion criteria are Met, all exclusions are ruled out, and tasks are closed. Label the state Ready for clinical review. |
| R6 | Close coordinator work explicitly | Require all checks assessed, no unresolved evidence or open tasks, and a recorded outcome and reason. A confirmed exclusion or unmet inclusion allows closure as Not supported on current evidence after remaining work is resolved. Require the Ineligible disposition to complete that closure. |
| R7 | Keep metrics consistent | Apply queue filters to metric denominators. Empty rate denominators show No data. Reset restores the fictional dataset and scenario time. |
| R8 | Support independent review | Provide a project guide and keyboard-accessible controls. Reopen saved state after reload when browser storage is available. Provide a session-only fallback. |

### Watchlist, AI evaluation, and outcome tracking

| ID | Requirement | Acceptance criterion |
|---|---|---|
| R9 | Model exclusions explicitly | C005 has all inclusions met and one confirmed exclusion. Handoff is blocked and the structured disposition is visible. Gaps and conflicts stay unresolved. |
| R10 | Track a reversible blocker | C001 appears with the blocker, owner, deadline, and trigger. A simulated biomarker update appends evidence and asks for reassessment. The existing follow-up stays open. |
| R11 | Capture AI review with traceable evidence | A cited passage is clickable. In C007, overriding the stale suggestion preserves its original citation and captures the revised assessment, source, reason, and error tag. |
| R12 | Separate evaluation from feedback | Show blocker precision and recall and cited-prediction accuracy over seven frozen examples. Log human decisions separately with reviewer, time and original/corrected values. Show the number of suggestions reviewed and overridden, plus total override actions. Label the enrollment panel as fictional. |
| R13 | Show disqualifiers by protocol | Display total blocks, sole blockers, and fully reviewed denominators for the selected cohort. Exclude unresolved cases. |
| R14 | Preview a visit brief | Build four fields from the simulated record: trial, reviewed evidence, remaining question, and next action. Link reviewed evidence to its source. |
| R15 | Document match closure | Require a structured disposition for a terminal match outcome. A simulated enrollment additionally requires confirmed eligibility and cleared review. |

## 5. Measures

| Measure | Definition |
|---|---|
| Coverage | Selected pairs with at least one saved assessment divided by selected pairs. |
| Completion | Selected pairs with a completed coordinator review divided by selected pairs. |
| Unresolved | Selected pairs with missing or conflicting evidence or an open follow-up divided by selected pairs. Count each pair once. |
| Open follow-ups | Open tasks in the selected queue, including the count overdue at the scenario time. |
| Median turnaround | Median elapsed time from first saved action to latest completion for currently completed pairs. Includes waiting. |

Pilot outcomes to test are the share of surfaced matches with a documented next step or terminal disposition and the share of verified eligible pairs that enroll. Measure both for a defined cohort and follow-up window. Report manual review activity alongside the fixed benchmark to show the effort behind corrections.

The starting queue has two completed reviews and four unresolved pairs out of ten. The 68-minute starting median comes from two authored examples of 54 and 82 minutes. These figures demonstrate the calculations.

## 6. Validation and next decision

Forty-three automated checks and browser walkthroughs covered missing and conflicting evidence, handoff conditions, reopening, history, filtering, reset, and persistence in the browser preview. The next research step is to observe two to three coordinators using C001 and C002. Record whether they find the evidence gap, assign an owner, and correctly explain what must happen before handoff. Use observed errors and hesitation to prioritize revisions.

The [product memo](docs/Product_Memo.md) defines the proposed pilot outcome measures. The Inspector’s benchmark and in-basket preview use authored examples.

## 7. Sources

- [National Cancer Institute eligibility criteria](https://www.cancer.gov/publications/dictionaries/cancer-terms/def/eligibility-criteria)
- [National Cancer Institute clinical trial participation](https://www.cancer.gov/research/participate/clinical-trials/what-to-expect)

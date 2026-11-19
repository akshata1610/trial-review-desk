# Beyond the Match

**Making oncology trial drop-offs visible**  
Akshata Anil Urs · Independent product portfolio project

## Decision

Test whether the team can account for what happened after each suggested match and route reversible blockers back to review. Start by recording a structured disposition with the least additional work for the coordinator.

## Screening and follow-up

A candidate match starts a review of the trial’s eligibility criteria. The research team then confirms eligibility and follows up on whether the patient wants to participate. This creates several distinct outcomes to capture, including unresolved evidence, an exclusion, or a documented decision to decline. The prototype tests a way to record those outcomes and hand off unresolved questions. [National Cancer Institute clinical trial participation](https://www.cancer.gov/research/participate/clinical-trials/what-to-expect) · [National Cancer Institute eligibility criteria](https://www.cancer.gov/publications/dictionaries/cancer-terms/def/eligibility-criteria)

## Proposed workflow

1. Keep one reversible blocker visible with an owner, a review deadline, and a trigger. A new result reopens the specific criterion for review.
2. Ask for a structured reason at closure. Record patient decline as a valid outcome. Keep pending results open and review aging cases so the documentation metric cannot improve just by delaying closure.
3. Preserve the original AI suggestion and citation when a reviewer overrides it. Capture the corrected assessment, evidence, and failure tag at the time of review.
4. Surface repeated blockers as aggregate counts and make the reviewed evidence available in a visit brief. The prototype uses fictional records and a local brief preview.

## Measures and learning

- **Verified accrual conversion:** confirmed enrollments divided by clinically verified eligible patient–trial pairs with a completed follow-up window. Review the rate by protocol and site when volumes support comparison.
- **Documented disposition rate:** closed pairs with a recorded outcome and applicable reason divided by all closed pairs. Aim for zero undocumented closures and monitor how long pending cases remain open.
- **Evaluation quality:** score a fixed reference set independently of reviewer overrides. Track unique suggestions reviewed, unique suggestions overridden, and total override actions. Each action records the reviewer, time, original and corrected assessments, evidence, and reason. In a pilot, track which corrections are actionable, where reviewers disagree, and how much time review takes. Sampling unchanged suggestions helps catch errors that nobody overrides.

A pilot would compare documentation completeness and coordinator effort before and after introducing the workflow. Reviewed corrections could support regression tests or identify annotation priorities. Any improvement in production model reliability or annotation cost would require evidence from that pilot.

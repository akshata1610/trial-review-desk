# Trial Review Desk Portfolio Case Study

**Akshata Anil Urs · Independent product project**

Trial Review Desk explores how an oncology trial coordinator might handle an initially plausible match when the source material is incomplete or inconsistent. The premise came from public guidance on clinical trial screening and eligibility. The workflow remains a hypothesis to validate with coordinators. [National Cancer Institute clinical trial participation](https://www.cancer.gov/research/participate/clinical-trials/what-to-expect)

| Scenario | Product decision | Reason |
|---|---|---|
| C001 · Missing result | Keep the check unresolved until a reviewer reassesses it. | A pending report leaves a gap. Closing the task alone cannot resolve that gap. |
| C002 · Conflicting records | Preserve both excerpts and assign a clarification owner. | The next reviewer needs to see the disagreement and who owns the next action. |
| C006 · Evidence changes | Reopen the case and retain its previous outcome. | New evidence can invalidate a prior assessment. |

The demo uses manual review and ten fictional patient–trial pairs. The dashboard measures operational progress, including coverage, completed reviews, unresolved cases, open tasks, and elapsed turnaround. Its starting values are authored examples. Project scope and review were led by the portfolio owner with AI assistance for drafting, implementation, and testing.

The next step is to observe coordinators working through the missing and conflicting evidence scenarios. Their feedback would determine whether to simplify the labels, change the handoff summary, or reduce the number of steps.

See the [requirements and acceptance criteria](../PRD.md) and [verification notes](../QA.md).

# Trial Review Desk walkthrough

Current website walkthrough with synthetic narration. All cases, trial protocols and AI suggestions are fictional.

## The problem

Imagine a trial coordinator opens a promising match. One test result is missing. Who checks for it? And how will the next reviewer know what happened?

Trial Review Desk is my independent product portfolio prototype for oncology trial pre-screening. I built it around the work that follows a possible match: reviewing evidence, assigning the next step, and making the decision traceable.

Everything you see uses fictional cases and simulated AI suggestions.

## 01  /  Review queue

In the Coordinator Workbench, each row pairs a fictional patient with a trial protocol. The queue makes it easy to see upcoming visits, review progress, and who owns the case.

## 02  /  Near-miss watchlist

Here, case one is a near miss. A single biomarker result is outstanding. The watchlist keeps the remaining check, the owner, and the event that should bring it back to review.

I simulate the new report. The case is now ready for reassessment.

## 02  /  Near-miss watchlist

The new excerpt appears alongside the original pending note. The coordinator reviews the new evidence explicitly.

## 02  /  Follow-up controls

The follow-up stays open until someone resolves it with a note. A new result and a completed task are two separate events.

## 03  /  Exclusion and disposition

Case five shows the other path. A confirmed exclusion blocks the handoff, even when the inclusion checks pass. A structured reason records why this match was closed.

## 04  /  Catch a stale AI citation

Now the part I find most interesting. In case seven, the simulated AI says a check is not met. Its citation points to an older note. The fictional protocol asks for the current assessment, which supports a different answer.

## 04  /  Override with evidence

I open Override, mark the check as met, choose Outdated note, and cite the current excerpt. Then I save the reason as Coordinator B.

## 04  /  Make human work visible

The original suggestion remains visible. The case now shows who overrode it, when, and why.

## 05  /  AI Evaluation Inspector

The Inspector shows blocker precision, recall, and citation accuracy against seven authored examples. Below that, I can see how many suggestions humans reviewed, how many they overrode, and how many override actions they took. A repeat correction increases the action count.

## 05  /  Review feedback

The correction log shows the original and revised answers with their sources. That gives a product team a concrete error to investigate.

## 06  /  Visit brief and outcomes

From the same entry, I can preview a short visit brief with the reviewed evidence, the open question, and the next action. Its citation takes me back to the source.

## 06  /  Workflow analytics

The analytics view brings together review progress, unresolved work, and turnaround. The broader product question is simple: after a match is surfaced, can the team explain what happened next?

I would test that with coordinators and measure how often they reach a documented next step. Try cases one and seven in the live demo.

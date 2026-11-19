# Trial Review Desk verification notes

Validation date: 18 November 2026.

## Automated checks

34 checks passed using the Node.js test runner. Zero failures, skipped tests or external package dependencies.

The checks cover initial metrics computed from the authored records; duplicate-patient denominators; filters and default sorting; empty results; odd and even medians; scenario time; missing and conflicting evidence; required reviewers, reasons and task fields; evidence requirements; task resolution; explicit handoff and closure rules; invalidation and retained history after changes; completed-only turnaround; reset; malformed persisted data; and the self-contained app output.

## Browser walkthroughs

- Queue shows the 10 starting pairs, 9 unique patients, 2 completed coordinator reviews and 4 open follow-ups.
- C001: missing evidence blocks handoff. Loading the fictional result requires a fresh assessment. An explicit assessment plus task resolution enables handoff. Completion and its notes persisted after a page reload.
- C002: both conflicting sources remain visible. An owner and due time are required for a new task. Assignment does not unblock the case.
- C006: a new evidence update reopens a completed review and resets the affected check. History retains the previous outcome and completed event.
- C005: the recorded negative outcome is shown explicitly; Review complete is not labelled as eligibility.
- Analytics: filters change the denominator, a Not started filter produces no completed-turnaround sample, and an unmatched search produces No data rates. Clear restores the full queue.
- Keyboard: arrow and End keys change case tabs; Tab reaches Save assessment from its textarea; Enter successfully submits the assessment.
- Responsive view: tested at a 454 CSS-pixel effective browser width using browser zoom. The page width did not overflow the viewport and the review form submitted through the keyboard. This is not a physical mobile-device test.

## Verification limits

- UI walkthroughs used a local HTTP preview of the identical self-contained HTML. The testing environment blocks file-protocol navigation, so opening the downloaded HTML directly from disk could not be verified here. The user should confirm that path on their own computer. No workaround of that browser restriction was used.
- Browser-local persistence was verified over HTTP. Local-file storage varies by browser; the app falls back to session-only operation if storage is unavailable.
- No actual oncology professional has validated the examples or workflow. No clinical accuracy, enrollment lift, or time-saving result is claimed.
- The live app was verified in Chromium. Cross-browser and physical mobile testing remain future checks.

## Version 2 checkpoint

The combined model suite has 42 passing checks. Eight cover exclusions, structured closure, simulated enrollment prerequisites, watchlist triggers, retained AI feedback, frozen evaluation scores, multiple versus sole blockers, and source-linked visit briefs.

In the browser, the C007 stale citation scrolled to the highlighted source. Saving the override added the dated correction to the Inspector and used the corrected citation in the visit brief. The correction persisted after reload. The C001 watchlist trigger appended the staged report and kept handoff unavailable. Completing C009 with a structured reason updated the bottleneck card. The product memo opened from the Inspector.

The test environment served the standalone HTML through a local browser preview. Model scores use seven authored reference examples. The visit brief and biomarker update are simulated.

## Version 2.1

43 automated checks pass. The additional check verifies that repeated corrections count as separate actions while the suggestion is counted once. Browser verification confirmed reviewer attribution in C007, the three human-review counters, and the visit brief citation returning to the relevant excerpt.

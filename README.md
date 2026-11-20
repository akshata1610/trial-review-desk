# Trial Review Desk

An independent product management portfolio project by **Akshata Anil Urs**. Trial Review Desk is a browser-based prototype for reviewing possible oncology trial matches. It connects a protocol check to its source evidence, records who owns the next step, and shows how coordinators corrected simulated AI suggestions.

**[Open the live website](https://trial-review-desk-akshata.lovelybell1.chatgpt.site/)** · **[Watch the 2:45 walkthrough](https://trial-review-desk-akshata.lovelybell1.chatgpt.site/demo)** · [Read the transcript](docs/Walkthrough_Transcript.md)

[Download the walkthrough MP4](dist/media/trial-review-desk-demo.mp4)

## What to try

| Scenario | What it demonstrates |
|---|---|
| **C001 · Pending biomarker** | Open the Watchlist and simulate a new result. Review the new source and resolve the follow-up separately. |
| **C002 · Conflicting records** | Compare both dated excerpts and identify who owns the clarification. |
| **C005 · Confirmed exclusion** | Open E1. An exclusion blocks handoff even when the inclusions are met. Review the recorded disposition. |
| **C007 · Outdated AI citation** | Open L4, correct the suggestion with the current fictional note, then find the reviewer, evidence and action count in the AI Evaluation Inspector. Use **Preview visit brief** to see the proposed handoff. |

Use **Analytics** to see how filters affect the queue metrics and protocol bottleneck counts. **Reset demo** restores the ten starting pairs.

## Product documentation

| Document | Contents |
|---|---|
| [Product requirements document](PRD.md) | Problem, users, scope, requirements, acceptance criteria, and proposed pilot measures |
| [User stories](docs/User_Stories.md) | Eight stories with acceptance scenarios and links to requirements |
| [Screening workflow](docs/Workflow.md) | Flowchart from review through clarification, disposition, and handoff |
| [Product memo](docs/Product_Memo.md) | The product hypothesis, post-match measures, and feedback loop |
| [Case study](docs/Case_Study.md) | Design decisions, tradeoffs, and research questions |
| [Verification notes](QA.md) | Automated test coverage, browser scenarios, and limitations |

## Run locally

The prototype uses plain HTML, CSS, and JavaScript with no package installation. Use a recent Node.js release for the build and tests.

```sh
node scripts/build.mjs
node --test tests/*.test.cjs
```

Open `dist/index.html` in a modern browser. For a predictable browser-storage origin, serve `dist` locally, for example with `python3 -m http.server 8000 --directory dist`, and open `http://localhost:8000`. The coordinator’s changes are saved locally in that browser where storage is available.

- `src/` contains the interface, styles, and workflow logic.
- `scripts/` builds the standalone HTML. `dist/` contains a runnable copy and the walkthrough.
- `tests/` contains 43 automated checks for workflow and reporting behavior.

The archive includes ten fictional patient–trial pairs and seven authored AI predictions. Benchmark scores describe those examples. Qualified study teams determine eligibility and enrollment. Akshata scoped and reviewed this project, with AI assistance for drafting, implementation, and testing.

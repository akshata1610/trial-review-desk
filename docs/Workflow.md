# Coordinator screening workflow

Each review starts from a possible patient–trial pair. The coordinator resolves evidence questions and records a next step. A qualified study team handles formal screening.

```mermaid
flowchart TD
    Queue["Select a pair from the review queue"] --> Evidence["Review inclusion, exclusion, and source excerpts"]
    Evidence --> Suggestion{"Does an AI suggestion need correction?"}
    Suggestion -->|Yes| Override["Save reviewer, reason, error tag, and source"]
    Suggestion -->|No or no suggestion| Assess["Record criterion assessment and evidence"]
    Override --> Decision{"What's the review outcome?"}
    Assess --> Decision
    Decision -->|Missing or conflicting evidence| Follow["Assign a follow-up or watch for a new result"]
    Follow -->|Clarification arrives| Evidence
    Decision -->|Confirmed clinical blocker and review resolved| Close["Close with a structured disposition"]
    Decision -->|Checks clear and tasks closed| Handoff["Save handoff for clinical review"]
```

The [AI Evaluation Inspector](https://trial-review-desk-akshata.lovelybell1.chatgpt.site/#inspector) displays the original suggestion, the reviewer’s correction, and the evidence behind both. The benchmark uses a fixed set of seven fictional examples. The human-review counts use saved actions and distinguish unique suggestions from repeated overrides.

A watchlist event appends evidence and sends a criterion back to review. Closing a follow-up is a separate action. The visit brief summarizes reviewed evidence, the remaining question, and a proposed next action.

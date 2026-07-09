---
name: research-brief
description: Produces source-backed research briefs with clear evidence quality, uncertainty, and recommendations. Use when choosing vendors, APIs, tools, markets, regulations, competitors, standards, current facts, or strategic direction where claims need citations or fast-moving information may have changed.
---

# Research Brief

## Workflow

1. Define the decision, audience, time horizon, and required confidence before collecting sources.
2. Browse or search when facts may be current, contested, price-sensitive, legal, security-relevant, vendor-specific, or otherwise likely to have changed.
3. Prefer primary sources: official docs, standards, release notes, filings, source repositories, pricing pages, policy pages, and original research.
4. Separate evidence types: facts, signals, testimonials, adoption evidence, risks, and recommendations.
5. Record source dates or retrieval dates for fast-moving facts. Mark stale, inferred, or weak evidence explicitly.
6. Compare alternatives on the dimensions that matter to the decision: user impact, technical fit, cost, lock-in, reversibility, operational burden, security/privacy, and team speed.
7. Avoid laundering uncertainty into certainty. If evidence is missing, say what would change the recommendation.

## Output

Produce a concise brief:

- Decision: the question being answered.
- Bottom line: the recommendation and confidence.
- Evidence table: claim, evidence type, source, date, confidence, and implication.
- Options: 2-4 viable paths when the decision is not obvious.
- Risks and unknowns: what could break the recommendation.
- Recommendation: what to do next, what to monitor, and when to revisit.

Include source links for claims that drive the recommendation. If browsing or source access is unavailable, state that limitation and avoid presenting current facts as verified.

Example evidence row:

```text
Claim: Vendor A caps webhook delivery at 30/s | Type: fact | Source: vendor docs
(link) | Date: 2026-07-01 | Confidence: high | Implication: we need queueing at
our expected volume.
```

## Checklist

- Facts come from primary sources when they drive the decision.
- Signals and testimonials are labeled as weaker evidence.
- Fast-moving claims include source or retrieval dates.
- Alternatives are compared on the same dimensions.
- Recommendations state confidence, risks, and what evidence would change the answer.

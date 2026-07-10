---
name: research-brief
description: Produces source-backed research briefs with clear evidence quality, uncertainty, evidence conclusions, and optional provisional recommendations. Use when the primary deliverable is verified current evidence about vendors, APIs, tools, markets, regulations, competitors, standards, pricing, compatibility, or other fast-moving claims. Use strategy-to-options instead when the evidence is already sufficient and the primary deliverable is a choice among decision-ready paths; for mixed work, research first and then form options.
---

# Research Brief

## Workflow

1. Confirm that evidence is the missing primary deliverable. If the user already has sufficient verified evidence and mainly needs a choice among paths, use `strategy-to-options` instead.
2. Define the decision, audience, time horizon, and required confidence before collecting sources.
3. Check repo-local context, lessons, glossary, ADRs, or similar stores when the decision depends on local constraints or prior choices.
4. Scale depth to risk. Low-risk, reversible choices can use a short primary-source check; legal, security, compliance, sensitive-data, vendor-lock-in, or irreversible choices need deeper sourcing and clearer uncertainty.
5. Browse or search when facts may be current, contested, price-sensitive, legal, security-relevant, vendor-specific, or otherwise likely to have changed.
6. Prefer primary sources: official docs, standards, release notes, filings, source repositories, pricing pages, policy pages, and original research.
7. Separate evidence types: facts, signals, testimonials, adoption evidence, risks, and recommendations made by the sources.
8. Record source dates or retrieval dates for fast-moving facts. Mark stale, inferred, or weak evidence explicitly.
9. Compare alternatives on the dimensions that matter to the decision: user impact, technical fit, cost, lock-in, reversibility, operational burden, security/privacy, and team speed.
10. Human owns the decision; agent owns evidence and uncertainty. If unattended, state the evidence conclusion and assumptions, then stop before downstream commitments. Include a provisional recommendation only when the original task explicitly requests one and the risk permits it.
11. Avoid laundering uncertainty into certainty. If evidence is missing, say what would change the evidence conclusion or any explicitly requested provisional recommendation. If the evidence becomes sufficient and a decision is still needed, hand off to `strategy-to-options`.

## Output

Produce a concise brief:

- Decision: the question being answered.
- Evidence bottom line: what the sources establish, confidence, and the most important limitation.
- Evidence table: claim, evidence type, source, date, confidence, and implication.
- Alternatives: evidence-backed comparison of relevant vendors, approaches, or standards without turning it into decision-option scoring.
- Risks and unknowns: what could weaken the evidence conclusion or remains unresolved.
- Handoff condition: whether the evidence is sufficient for `strategy-to-options`, or what research remains before a decision is responsible.

Include a provisional source-backed recommendation only when the user explicitly asks for one. Label it provisional, state confidence and what could change it, and leave decision-ready option scoring to `strategy-to-options`.

Include source links for claims that drive the evidence conclusion. When a provisional recommendation is requested, cite the claims that drive it as well. If browsing or source access is unavailable, state that limitation and avoid presenting current facts as verified.

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
- Evidence conclusions state confidence, risks, and what evidence would change them.
- The brief names when evidence is sufficient to hand off to `strategy-to-options`.

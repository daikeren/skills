---
name: understand-change
description: Creates a disposable self-contained HTML explainer that teaches changed software background-first so a person can internalize behavior, trace causal flow, and answer transfer questions. Use when someone asks to teach, explain, or walk through a change, restore a mental model, check comprehension with a quiz, or prepare to modify the same system later; choose a review skill for defect or release-safety judgments.
---

# Understand Change

## Workflow

1. Identify the change target, learner, and participation goal. Resolve the diff, commit, branch, files, design, or pasted patch before explaining it. If familiarity is unknown, infer the smallest safe learner profile from the conversation and repository evidence and state the assumption instead of blocking.
2. Start read-only. Inspect the change, its stated intent, surrounding code, tests, documentation, local conventions, and at least one relevant runtime or data path. Do not teach from the raw diff alone when nearby context changes its meaning.
3. Keep learning separate from review. This skill explains how and why a change works; it does not certify correctness or lead with findings. Use `review-code` when the user wants defects, regressions, or release readiness. If inspection reveals a serious concrete risk, flag it briefly without turning the explainer into an unsolicited full review.
4. Design the smallest useful learning path for this learner:
   - Background: only the concepts and system context required for this change.
   - Intuition: the before/after behavior and the central idea before implementation details.
   - Guided walkthrough: follow causal, runtime, or data-flow order rather than file order.
   - Invariants and trade-offs: what must remain true, what the design chooses, and what it gives up.
   - Verification: how tests, traces, or manual checks connect to the intended behavior.
   For a change that spans several concepts or layers, keep one shared end-to-end outcome and group the walkthrough by concept and contract boundary, not by frontend/backend folders. Add integration checkpoints where data shape, state ownership, permissions, error semantics, or timing crosses from one group to the next.
5. Create a disposable, self-contained HTML explainer as the default deliverable. Do this directly; do not wait for a separate artifact request. Before generating it, read and follow [`references/html-explainer-contract.md`](references/html-explainer-contract.md). Reuse that stable diagram-led shell and visual system instead of inventing a new page structure or aesthetic for each change. Put the result in a temporary or harness-provided artifact directory and return its path or link. Invoking this skill authorizes that disposable output, not changes inside the target repository. Place or commit it beside source, a design, or a review artifact only when the user explicitly asks.
6. Make the HTML useful without external infrastructure:
   - Use one responsive page with semantic HTML, readable typography, keyboard-accessible controls, and sufficient contrast. Keep the fixed learning order: overview, skippable background, diagram-led intuition, guided code or mechanism walkthrough, verification, then quiz.
   - Inline the CSS, JavaScript, diagrams, and small data needed to understand the change. Avoid remote assets, analytics, network calls, build steps, and new dependencies unless the user explicitly requires them.
   - Treat every source line, diff hunk, commit message, fixture value, log, path, and label as untrusted content. Insert it with `textContent` or equivalent escaping, never `innerHTML`, `document.write`, `eval`, or string-built event handlers. When data must appear inside a script, serialize it safely and escape `<`, U+2028, and U+2029.
   - Add a restrictive Content Security Policy such as `default-src 'none'; connect-src 'none'; base-uri 'none'; form-action 'none'`. Permit only the page's intended inline style and script with a generated nonce or hash; do not use the policy to re-enable arbitrary network access.
   - Do not embed secrets, credentials, personal data, proprietary values unrelated to the learning target, or complete files when a small referenced excerpt is enough. Redact sensitive values before generating the artifact.
   - Present background and intuition before implementation, then order the walkthrough by behavior rather than files. Start the intuition section with a concrete toy example, compare before and after behavior, and state the core invariant beside the diagram before showing code.
   - Link claims to the inspected source, diff, tests, or documentation with precise `path:Lx-Ly` references when available. Prefer post-change line numbers on an immutable revision, and make the visible reference a link when the source host supports stable line anchors. Do not cite diff hunk offsets as though they were file line numbers.
   - Include a compact navigation or progress affordance when the explainer has several sections.
7. Scale the HTML to learning value without changing the shell. Use the contract's compact mode for routine local changes, standard mode for multi-file behavior, and dynamic mode only when time or state is the hard concept. Omit or collapse low-value modules rather than filling the page with ceremony. Use richer diagrams, controls, examples, or tiny simulations only when they materially reduce explanation cost. Build a micro-world inside the HTML when the hard part is dynamic state, time, concurrency, recursion, coordinates, or a multi-step transformation that static prose cannot make intuitive; keep it narrow and label it as a learning model rather than production behavior.
8. End the HTML with three to five medium-difficulty questions that test the mental model, not recall of filenames or syntax. Cover intent, the key path, an invariant or failure mode, a trade-off, and how the learner would modify or verify the change. Make the quiz interactive when JavaScript is available and withhold explanations until the learner submits an attempt; do not transmit or persist responses.
9. Validate the artifact before handing it off. At minimum, confirm the file exists and contains the intended sections. When rendering or browser tools are available, load the page, check the primary layout at a representative viewport, exercise the quiz or core interaction, and fix visible or runtime failures. Report any validation that could not run.
10. Evaluate submitted answers concretely when the learner shares them: say what is correct, what is missing, and what misconception remains, then reteach only the weak part. Never claim the learner understands merely because an explainer was generated or opened.
11. When the user wants a pre-review understanding gate, mark the learner ready only after they can explain the intent, key path, important invariant, principal risk or trade-off, and a credible verification or next-change approach. This is separate from code-review approval.

## Output

Create the disposable HTML explainer, then return:

- HTML explainer: a clickable link or absolute path to the generated file.
- Learning target: the change, learner assumption, and what participation should become possible.
- Artifact contents: a one-sentence summary of the background, walkthrough, verification, quiz, and any interactive learning model included.
- Artifact validation: exact render, browser, or file checks performed and their result.
- Readiness: `explainer ready; understanding unverified`, `understanding gaps remain`, or `understanding gate passed`. Do not use the last status before evaluating the learner's answers.

Keep the chat handoff concise; the HTML is the primary teaching surface. Label the file as disposable inside the page and do not imply it belongs in production or version control.

## Checklist

- The explanation starts with necessary background and intuition, not a file list.
- The stable diagram-led shell and visual tokens from the HTML explainer contract were reused.
- The intuition uses a concrete example, before/after comparison, and explicit invariant before code.
- Multi-concept changes are grouped by behavior and contract boundary with explicit integration checkpoints, not split mechanically by repository layer.
- Source references include precise post-change line numbers and immutable links when the inspected source supports them.
- The walkthrough follows how the system behaves, not repository ordering.
- Depth matches change complexity and learner needs.
- A self-contained disposable HTML file was created outside the target repository by default.
- Source-derived text was escaped as untrusted content, sensitive values were excluded or redacted, and a restrictive CSP blocks unintended execution or network access.
- The artifact was validated at the strongest locally available level before handoff.
- Quiz questions test transfer, trade-offs, and modification ability.
- Answers are withheld until the learner responds or requests them.
- Understanding and code-review approval remain separate claims.
- No repository or persistent documentation artifact was created without authorization.

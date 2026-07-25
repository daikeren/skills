# HTML Explainer Contract

Use this reference whenever `understand-change` selects a disposable HTML artifact. The shell, sequence, and visual language stay stable so repeat users spend attention on the change rather than relearning the interface. Content depth and optional teaching modules remain adaptive.

## Fixed Learning Sequence

Use one long page with these landmarks and anchor IDs:

1. `overview`: title, one-sentence learning goal, learner assumption, estimated time, source scope, and a short “how to use this explainer” note.
2. `background`: only prerequisite system context. Put beginner detail in a native `<details>` disclosure so experienced readers can skip it.
3. `intuition`: a concrete toy example, a before/after causal comparison, and one prominent invariant. This is the visual center of the page.
4. `walkthrough`: implementation chapters in runtime or data-flow order. Each chapter states role, behavior, relevant code, and edge case before moving on.
5. `verification`: map each important claim or invariant to a test, trace, log, or manual check.
6. `quiz`: three to five medium-difficulty transfer questions with per-question submission and feedback.

Use a persistent table of contents on wide screens and a compact `<details>` table of contents on narrow screens. The table of contents follows learning order, never file order.

## Adaptive Modes

Keep the same landmarks while scaling content:

| Mode | Use when | Required treatment |
| --- | --- | --- |
| Compact | One local behavior or configuration change | One small before/after card, one invariant or compatibility statement, one walkthrough chapter, focused verification, three questions. Collapse background when it adds no value. |
| Standard | Multi-file or cross-layer behavior | Full before/after causal diagram, two to five walkthrough chapters, explicit trade-off and edge cases, four or five questions. |
| Dynamic | State, time, concurrency, recursion, coordinates, or multi-step transformation is the hard concept | Standard mode plus one narrow interactive model. Clearly label it as a learning model rather than production behavior. |

Do not add tabs, dashboards, decorative hero art, or unrelated metrics. Prefer one coherent reading path with skippable depth.

## Cross-Concept Changes

When a change spans several concepts, services, or frontend/backend layers, keep the fixed page sequence and add structure inside it:

1. State one shared end-to-end outcome in `overview`. Do not present several unrelated mini-PRs unless the change truly has no coherent outcome.
2. Use `intuition` for one system flow that crosses the important boundaries. Show what evidence enters, where it is normalized, which decision is made, and what the user observes.
3. Add a compact concept map before the detailed walkthrough. Each concept card names its question, local invariant, inputs, outputs, and relevant chapters.
4. Group walkthrough chapters by concept or contract boundary, not by directory, language, team, or frontend/backend label. A chapter may cite several files when they jointly implement one behavior.
5. Insert an `.integration-checkpoint` between groups wherever a data shape, state owner, permission, error, fallback, or timing guarantee crosses the boundary. State both sides of the contract and what a mismatch would look like.
6. End with an integration verification map and at least one quiz question that requires tracing across two concept groups.

Use hierarchical navigation for these pages: the top level keeps the fixed learning sequence, while the walkthrough entry may show indented concept groups and chapters. Do not turn concept groups into top-level tabs; readers need to preserve the end-to-end story.

## Page Frame

Use this semantic shape:

```html
<body>
  <a class="skip-link" href="#main">Skip to explanation</a>
  <div class="page-shell">
    <aside class="sidebar" aria-label="Explainer navigation">...</aside>
    <main id="main" class="main-content">
      <header class="explainer-header" id="overview">...</header>
      <details class="mobile-toc">...</details>
      <section id="background">...</section>
      <section id="intuition">...</section>
      <section id="walkthrough">...</section>
      <section id="verification">...</section>
      <section id="quiz">...</section>
      <footer>Disposable learning artifact · not production documentation</footer>
    </main>
  </div>
</body>
```

On wide screens use a `272px` sticky sidebar and a flexible main column. Keep readable content at `1120px` or narrower. At `960px` and below, remove the sidebar from layout, show the mobile table of contents, stack comparisons, and keep all controls at least `44px` high. At `640px` and below, reduce section padding and code font size without horizontal page scrolling; code blocks may scroll internally.

## Visual Tokens

Use these tokens as the default light theme. Preserve their semantic roles when small contrast adjustments are necessary.

```css
:root {
  color-scheme: light;
  --canvas: #f6f8fb;
  --surface: #ffffff;
  --surface-subtle: #f8fafc;
  --ink: #172033;
  --muted: #5d687a;
  --line: #d9e0ea;
  --line-strong: #bcc7d6;
  --accent: #175cd3;
  --accent-soft: #eef4ff;
  --success: #16794a;
  --success-soft: #edf8f2;
  --danger: #c4322b;
  --danger-soft: #fff1f0;
  --warning: #9a6700;
  --warning-soft: #fff8e6;
  --code-bg: #111827;
  --code-ink: #e5eefc;
  --radius-sm: 8px;
  --radius-md: 12px;
  --radius-lg: 18px;
  --shadow: 0 16px 40px rgb(23 32 51 / 8%);
  --font-sans: Inter, "Noto Sans TC", "PingFang TC", "Microsoft JhengHei", system-ui, sans-serif;
  --font-mono: "SFMono-Regular", Consolas, "Liberation Mono", monospace;
}
```

Use `--font-sans` for all prose, including Chinese and English. Use `--font-mono` only for code, paths, literals, state names, and compact technical labels. Body text is at least `16px` with `1.7` line height. Do not use light font weights for essential text.

## Core Components

### Intuition comparison

Use a two-column `.comparison-grid` containing a `Before` panel and an `After` panel. Each panel must:

- start from the same concrete input or user action;
- show numbered causal steps or a time axis;
- distinguish actors, system components, state or buffer, and external effects through labels plus color, never color alone;
- state the observable result in one sentence.

Prefer semantic ordered lists, tables, and labelled boxes over decorative diagrams. Connections must remain understandable to screen readers and when CSS is unavailable. Never use ASCII diagrams. If the flow is too dense for this pattern, reduce it to the smallest example that exposes the idea.

Place a bordered `.invariant` callout directly after the comparison. Phrase it as a rule that stays true, not as a feature slogan.

### Walkthrough chapter

Each `.code-chapter` contains:

1. a behavior-oriented heading;
2. a one-line before/after outcome strip when behavior changes;
3. a code or mechanism excerpt showing only relevant lines;
4. an annotation rail with `Role`, `Intuition`, and `Edge case`;
5. an optional compact state or data summary when it reinforces the same concept.

Keep source references visible near the excerpt. Format each one as `path:Lx-Ly`; use a single line as `path:Lx`. Prefer post-change lines on an immutable commit or revision and link the visible reference to stable source anchors. If exact lines do not exist for a design, generated artifact, or runtime observation, name the evidence type instead of inventing a range. Preserve whitespace in code with `<pre><code>`. Escape all source-derived content as text. Do not use syntax highlighting libraries or external fonts.

### Integration checkpoint

Use a bordered `.integration-checkpoint` between concept groups. It contains:

- `Upstream guarantees`: the shape, identity, state, permission, or timing the producer promises;
- `Downstream assumes`: how the consumer interprets that contract;
- `Mismatch signal`: the visible bug, test failure, stale state, or unsafe fallback that exposes drift;
- precise source references for both sides.

Keep this compact. It is a bridge in the learning path, not another full chapter.

### Verification map

Use a compact table with columns `Claim`, `Evidence`, and `What failure would mean`. This makes verification part of the mental model instead of a detached test list.

### Quiz

Use native radio inputs grouped in `<fieldset>` elements. Each question has its own submit button and feedback region with `aria-live="polite"`. Hide correctness and explanation until that question is submitted. Do not persist or transmit answers.

Balance option lengths so the correct answer is not consistently the longest. Rotate correct-answer positions across the quiz; when ordering is generated, use a deterministic seed so rendering and evaluation remain reproducible. After submission, preserve the learner's selection, show correct or incorrect state in text as well as color, and explain the underlying model rather than merely naming the answer.

## Language And Copy

- Set the document `lang` to the learner's primary language.
- Write paragraphs in one primary language. Do not duplicate every paragraph bilingually.
- Use short bilingual section labels or diagram labels only when both languages materially improve navigation, for example `核心直覺 / Core intuition`.
- Keep code, identifiers, paths, commands, and established technical terms in their original language.
- Prefer short sentences and concrete nouns. Define an unfamiliar technical term where it first appears.
- Let Chinese and English wrap naturally; never force letter spacing onto Chinese text.

## Interaction And Safety

- Use semantic links, buttons, details, fieldsets, and radio inputs. Provide visible `:focus-visible` styles and honor `prefers-reduced-motion`.
- Keep all CSS and JavaScript inline. Use one generated nonce for the CSP, `<style>`, and `<script>` tags.
- Use `textContent`, attributes, and class changes for dynamic output. Never insert source-derived strings with `innerHTML`, `outerHTML`, `document.write`, `eval`, or string-built event handlers.
- Use a restrictive CSP with no network access. A typical policy is `default-src 'none'; img-src data:; connect-src 'none'; base-uri 'none'; form-action 'none'; style-src 'nonce-{nonce}'; script-src 'nonce-{nonce}'`.
- Keep the page functional without JavaScript: navigation, prose, diagrams, code, and questions remain visible; JavaScript adds quiz feedback and an optional dynamic learning model.

## Visual QA

Before handoff, verify at least one wide viewport and one narrow viewport. Check:

- learning order and active anchor navigation;
- Chinese and English wrapping, code overflow, and minimum text size;
- before/after comparison clarity without relying on color;
- keyboard access, focus visibility, disclosure behavior, and quiz feedback;
- no network requests, CSP violations, console errors, unsafe fixture execution, or unreplaced template markers;
- every source citation resolves to the inspected revision and shows a precise line or line range when one exists;
- the page is labelled disposable and contains no unrelated sensitive values.

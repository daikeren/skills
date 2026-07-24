# 軟體交付 Agent Skills

[English](README.md) | [繁體中文（台灣）](README.zh-TW.md)

這是一組可重複使用的 agent skills，提供給不只需要產生程式碼的 coding agents。這些 skills 協助 agent 在交付小而可驗證的變更時，同時考量產品目標、architecture、使用者影響、security 與 privacy、成本、維運，以及團隊速度。

這個 repo 是公開、通用的核心，不是特定公司的 workflow pack。它不預設 GitHub、Linear、Django、Next.js、monorepo 或任何單一 toolchain。Skills 應該先從 repository、CI、文件與使用者提供的 context 偵測本地工具，再採取行動。

## 安裝

主要安裝方式：

```bash
npx skills@latest add daikeren/skills
```

其他常用方式：

```bash
npx skills@latest add daikeren/skills --list
npx skills@latest add daikeren/skills --skill scope-work --skill review-code
npx skills@latest add daikeren/skills -a codex -a claude-code -a opencode -a pi
```

## 相容性說明

核心格式遵循開放的 Agent Skills standard：每個 skill 都是一個包含 `SKILL.md` 的目錄，frontmatter 必須提供 `name` 與 `description`，也可以加入選用的支援檔案。

Codex 會從 repository 內的 `.agents/skills` 與 user-level skill folders 讀取 skills。Codex plugins 使用 `.codex-plugin/plugin.json` 作為 plugin manifest，並可透過 `./skills/` 指向 skills。

Claude Code 支援獨立的 `.claude/skills/<name>/SKILL.md` skills，也能透過 `.claude-plugin/plugin.json` 發布 plugin；plugin skills 放在 plugin root 下的 `skills/`。

OpenCode 會從 `.opencode/skills`、`.agents/skills` 與 Claude-compatible skill directories 載入 project 與 global skills。

Pi 會從 `.pi/skills` 與 `.agents/skills` 載入 project skills，從 `~/.pi/agent/skills` 與 `~/.agents/skills` 載入 global skills，也能載入 package 提供的 `skills/` 目錄或設定好的 skill paths。

這個 repo 目前包含以下輕量的 tool-specific adapters：

- `.codex-plugin/plugin.json`：Codex plugin distribution。
- `.claude-plugin/plugin.json`：Claude Code plugin metadata。
- `.claude/commands/`：Claude Code slash-command wrappers。
- `.opencode/opencode.json` 與 `.opencode/commands/`：OpenCode command wrappers。
- `.pi/settings.json` 與 `.pi/extensions/`：Pi skill discovery support。

## 內含 Skills

- `route-work`：把工作導向正確、聚焦的 skill。
- `scope-work`：在執行前界定模糊或影響較大的工作。
- `research-brief`：產出有來源支持、清楚標示證據品質的研究 brief。
- `prototype`：進行可丟棄的 proof-of-concept 探索，避免直接膨脹成 production work。
- `setup-repo-context`：從本地證據偵測並維護精簡的 repo-specific context。
- `strategy-to-options`：把策略或技術問題轉成 2–4 個實際選項。
- `to-spec`：把已確認的方向轉成精簡的 implementation spec。
- `to-tickets`：把 spec 拆成可獨立 review 與 release 的 slices。
- `architecture-review`：review architecture、dependencies、data flow 與 migration risk。
- `product-surface-review`：review workflows、states、accessibility、trust 與 support burden。
- `security-privacy-review`：review permissions、sensitive data、trust boundaries 與 abuse cases。
- `implement-change`：引導 coding work 維持小、符合慣例、可逆且經過驗證。
- `understand-change`：產生可丟棄的 HTML explainer，依照學習順序解釋 change，並檢查使用者是否建立正確 mental model。
- `review-code`：review diff，涵蓋 regressions、product risk、security/privacy、operations 與 tests。
- `compound-learning`：在工作或 review 前後讀取與記錄可重複利用、已驗證的 lessons。

## 快速對照

| 我想要…… | 使用這個 skill |
| --- | --- |
| 不確定該從哪個 skill 開始 | `route-work` |
| 界定模糊或高影響的工作 | `scope-work` |
| 研究最新事實或證據 | `research-brief` |
| 用可丟棄的 proof 測試想法 | `prototype` |
| 建立或更新 repo-specific context | `setup-repo-context` |
| 比較策略或技術選項 | `strategy-to-options` |
| 把方向轉成 implementation spec | `to-spec` |
| 把工作拆成可 release 的 tickets | `to-tickets` |
| Review architecture 或 migration risk | `architecture-review` |
| Review product surfaces 與 workflows | `product-surface-review` |
| Review security、privacy 或 abuse risk | `security-privacy-review` |
| 實作小而可驗證的 change | `implement-change` |
| 取得用來理解 code change 的可丟棄 HTML explainer | `understand-change` |
| Release 前 review code diff | `review-code` |
| 讀取或記錄可重複使用的 lessons | `compound-learning` |

## Repo 結構

```text
skills/                 Agent Skills standard directories 與 skill-local references
commands/               每個 skill 的通用 command wrappers
references/             這個 pack 的 authoring 與 maintenance rubrics
evals/cases/            Structural、routing 與 behavioral eval cases
evals/fixtures/         Behavioral evals 使用的 throwaway fixtures
evals/results/          產生的 eval summaries
scripts/                零 dependency 的 validation 與 eval scripts
.codex-plugin/          Codex plugin manifest
.claude-plugin/         Claude Code plugin metadata
.claude/commands/       Claude Code slash commands
.opencode/              OpenCode config 與 commands
.pi/                    Pi settings 與 extension metadata
```

## Reference Material

Runtime-essential guidance 應該放在所屬 skill 的目錄，或直接寫進該 skill 的 `SKILL.md`，確保只安裝單一 skill 時仍然完整。Top-level `references/` 只放這個 pack 的 authoring 與 maintenance source material，不是個別 skills 的 runtime dependency。

目前 top-level references 是通用 rubrics，用來在維護 repo 時對齊 skill wording、review severity、implementation discipline、decision quality 與 evidence standards。Skill-specific supporting material 則跟著所屬 skill；例如 `compound-learning` 的 pack-maintenance workflow log 位於 `skills/compound-learning/references/observed-workflows.md`。

## 驗證

執行：

```bash
npm run validate
npm run diagnose:routing
```

Validation errors 是 deterministic hard gate。Validators 會檢查 skill frontmatter、kebab-case names、description specificity、必要的 body sections、禁止出現的 per-skill READMEs、reference files、manifests、command wrapper parity、eval case JSON shape、fixture safety，以及 skills 與 eval datasets 是否一對一完整覆蓋。

Routing diagnostic 會用 deterministic lexical heuristic 比較 prompts 與 skill descriptions。Positive、negative、boundary 與 margin mismatches 都是 non-blocking authoring signals；validation 也會把 pairwise description-similarity 當成 non-blocking diagnostic 回報。這些 heuristics 不是真實 agents 使用的 routing mechanism。Routing command 會把產生的結果寫入已被 ignore 的 `evals/results/`。`npm run eval` 會保留為相同 diagnostic 的 compatibility alias。

若要對真正的 agent 執行 opt-in behavioral evaluation：

```bash
LIVE_EVAL_AGENT=codex npm run eval:live
LIVE_EVAL_AGENT=claude-code npm run eval:live
```

只執行指定 cases：

```bash
LIVE_EVAL_AGENT=codex \
LIVE_EVAL_CASES=implement-change/cross-stack-change,review-code/permission-regression \
npm run eval:live
```

Live runner 會把準備發布的 repository surfaces 複製到 disposable workspace，並在另一個空白 temporary directory 執行 judge。它會拒絕不安全的 fixture paths 與 symbolic links，對每個 command 套用 timeout，並清理 process group。Codex runs 會使用只包含 authentication file 的 private temporary home；正常結束、`SIGHUP`、`SIGINT` 或 `SIGTERM` 時，runner 會清除 active process trees、temporary workspaces 與 credential copy。Hard kill 或 host failure 仍可能留下 temporary credential residue，必須手動清除。Runner 會在 source checkout 寫入 `evals/results/live-latest.json`。不要把它放進快速 CI gate，因為它依賴本地 agent installation、credentials、model availability 與費用。

## 日常 Workflow

剛進入新 repository、本地 conventions 已過期，或 repo 需要一份精簡的共用 context 時，使用 `setup-repo-context`。不確定入口時，使用 `route-work` router。其他情況則從最早有幫助的階段開始：

```text
setup-repo-context（每個 repo 選用）
  -> scope-work
  -> strategy-to-options
  -> 缺少證據時使用 research-brief 或 prototype
  -> to-spec
  -> to-tickets
  -> implement-change
  -> understand-change（作者或 reviewer 需要建立 mental model 時）
  -> review-code
  -> compound-learning
```

Review shortcuts：

- Service boundaries、data flow、scaling、reliability、migrations 與 dependencies：使用 `architecture-review`。
- User workflows、states、trust、support burden 與 accessibility：使用 `product-surface-review`。
- Auth、permissions、sensitive data、integrations、billing/admin surfaces 與 abuse cases：使用 `security-privacy-review`。

如果缺少的是人對 change 的理解，而不是另一輪 correctness check，請在 review 前使用 `understand-change`。它會直接在 target repository 外產生一份 self-contained、可丟棄的 HTML explainer，依照 background、intuition、implementation、verification 的學習順序組織內容，並用 interactive quiz 找出理解缺口；不會因為 artifact 已經產生，就假裝使用者已經開啟、驗證或理解它。

## 選用的 Per-Repo Context

`setup-repo-context` 會先在 read mode 偵測 repository conventions；只有使用者或 repo instructions 明確授權 maintenance 時，才會更新精簡的 repo context file。既有的 context location 只會決定授權後的寫入位置，本身不構成 write authorization。

Context 應優先指向既有 instructions，並記錄有證據支持的 conventions，例如 spec 與 ticket locations、review severity policy、verification commands、tracker/CI/tooling signals、`compound-learning` lesson store path、decision records 與 AFK handoff expectations。

這個 skill 刻意保持 tool-agnostic：它不要求特定 host、issue tracker、CI system、package manager、framework 或 monorepo layout。如果 repo 沒有既有 convention，它應該回傳 context snapshot 與 candidate location，而不是默默導入一套新規則。

## 開發流程

從 `commands/` 重新產生 tool-specific command wrappers：

```bash
npm run sync-commands
```

透過 symlink 把本地修改安裝到 local skill directory，並在下一個 agent session dogfood：

```bash
npm run link
npm run link -- --agent claude-code
npm run link -- --agent codex
npm run link -- --dry-run
```

準備 package 與 plugin manifests 的 version bump：

```bash
npm run release:prepare -- 0.2.0
```

發布前請 review 產生的 `CHANGELOG.md` entry。

## 設計規則

- 每個 skill 都要維持小、可觸發、可測試。
- Runtime behavior 放在 `skills/`；top-level references 只保留 authoring 與 maintenance material。
- 不要把個人預設放進 public core。
- 優先使用精簡的 `SKILL.md` 搭配選用 references，不要堆疊大量 instructions。
- 不要預設特定 repo host、issue tracker、package manager、framework 或 CI system。
- 保留使用者的工作，並驗證最小但有意義的 surface。

## 參考經驗

這個 pack 借用下列 public repos 的結構思路，而不是直接搬進它們的完整內容：

- `mattpocock/skills`：小、可組合、適合日常使用的 skills；區分 user-invoked orchestration 與 model-invoked discipline；以 tracer-bullet tickets 拆分工作。
- `obra/superpowers`：evidence-driven workflows、跨 agent harnesses 的 packaging，以及完成宣告前的 verification。
- `everyinc/compound-engineering-plugin`：把 planning、review 與 captured learning 視為會持續累積價值的 engineering infrastructure。
- `addyosmani/agent-skills`：依 development lifecycle 組織 skills；以 commands 搭配 skills；使用 evals 與 structural checks 防止品質漂移。

實作刻意維持得比完整 methodology framework 更輕量。

## 已檢查的 Source Contracts

- Agent Skills specification: https://agentskills.io/specification
- Agent Skills creator quickstart: https://agentskills.io/skill-creation/quickstart
- Codex skills: https://developers.openai.com/codex/skills
- Codex plugin build docs: https://developers.openai.com/codex/plugins/build
- Claude Code skills: https://code.claude.com/docs/en/skills
- Claude Code plugins: https://code.claude.com/docs/en/plugins
- OpenCode skills: https://opencode.ai/docs/skills
- Pi skills: https://github.com/earendil-works/pi/blob/main/packages/coding-agent/docs/skills.md
- skills CLI package: https://www.npmjs.com/package/skills

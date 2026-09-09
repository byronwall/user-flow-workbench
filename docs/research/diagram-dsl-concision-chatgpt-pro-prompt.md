# ChatGPT Pro prompt: Diagram DSL concision and usability evaluation

Repository: https://github.com/byronwall/user-flow-workbench

Target: `main`, starting from commit `cbf10c63df6fdcbebdd26929736672ae4a082a87` or a later commit that contains the same DSL features.

## Primary mission

Evaluate the complete User Flow Workbench Diagram DSL. Decide whether its syntax can become more concise and easier for agents to author without losing its semantics, diagnostics, readable diffs, or inspectability.

Do the evaluation. Do not only propose an evaluation plan.

Create several candidate DSL designs. Rewrite a representative corpus in each design. Test each candidate against the same authoring and change tasks. Then recommend the smallest design that performs best.

The correct result can be one of these outcomes:

- Keep the current language.
- Make a few compatible syntax changes.
- Replace the syntax before the format has more users.
- Split or align parts of the language where one answer does not fit all four document types.

Do not assume that shorter source is better. A short syntax can hide behavior, weaken diagnostics, or move work into the parser and documentation.

## Decision context

User Flow Workbench has one `.diagram` envelope and four body types:

- `flow` for operational graphs, semantic records, variants, and optional positions;
- `overview` for grouped capabilities and typed artifact links;
- `wireframe` for low-fidelity screens, reusable parts, interaction shots, references, and review marks;
- `application` for pages, states, objects, ownership, navigation, and typed artifact links.

Agents create and revise most source files. A person reviews the source, rendered diagrams, and diffs. Hand-entry speed matters less than these qualities:

- agents produce valid source on the first attempt;
- the source remains easy to inspect;
- a small request causes a small, local edit;
- IDs and semantics remain explicit;
- parser errors identify the exact problem and recovery action;
- one syntax does not force unrelated document models into one abstraction.

The repository already has real parsers, tests, examples, and a canonical formatter. This review must account for them. It is not a greenfield language exercise.

## Role and posture

Act as a language designer, developer-tooling researcher, and adversarial API reviewer. Be practical. Favor boring syntax and a small grammar when they perform well.

Challenge both the current DSL and your own alternatives. State strengths, weaknesses, tradeoffs, rejected ideas, and uncertainty. Do not support a design because it is novel or concise.

Use primary sources only for prior art. Useful comparisons can include official documentation for Graphviz DOT, Mermaid, D2, PlantUML, Structurizr DSL, HCL, or another directly relevant notation. Use only comparisons that affect this decision.

## Access preflight

### GO

Continue only when all checks pass:

1. You can access `https://github.com/byronwall/user-flow-workbench`.
2. The owner and repository name match the URL.
3. You can inspect `main` at commit `cbf10c63df6fdcbebdd26929736672ae4a082a87` or later.
4. The repository contains the required specification, parser, examples, and tests listed below.
5. You can return a complete report in your response if the environment cannot write files.

Record the inspected branch and commit. The local checkout used to prepare this prompt was on `main` at `cbf10c6`. It had four unrelated untracked `.tickets/*.md` files. A concurrent user-owned change to `src/components/WireframeWorkbench.tsx` appeared after the initial inspection. None of these local changes are part of the review baseline.

### NO-GO

Stop and report `NO-GO` when any condition applies:

- The repository is unavailable, private access is missing, or the repository is wrong.
- The required ref or key source files are absent.
- You can inspect only fragments that do not support semantic comparison.
- You cannot distinguish current behavior from a proposed design.
- A candidate cannot represent the baseline semantics, but you would still score it as equivalent.
- A material product choice is missing and any assumed answer would determine the winner.

Name the failed gate and the smallest action that will unblock the work. Do not claim a complete review from partial access.

## Required reading route

Read these files in order. Verify that the prompt facts still match the selected ref.

1. Repository rules and product context
   - `AGENTS.md`
   - `README.md`
   - `package.json`
   - `docs/product-context.md`
   - `docs/flow-authoring-workflow.md`
2. Current language contracts
   - `docs/diagram-dsl-spec.md`
   - `skills/author-flow-diagrams/SKILL.md`
   - `skills/author-flow-diagrams/references/flow-dsl-base.md`
   - `skills/author-flow-diagrams/references/wireframe-authoring.md`
3. Parsers, models, and dispatch
   - `src/lib/diagram-dsl.ts`
   - `src/lib/graph-dsl.ts`
   - `src/lib/overview-dsl.ts`
   - `src/lib/wireframe-dsl.ts`
   - `src/lib/application-dsl.ts`
   - `src/types/diagram.ts`
   - `src/types/graph.ts`
   - `src/types/overview.ts`
   - `src/types/wireframe.ts`
   - `src/types/application.ts`
4. Tests and executable contracts
   - `src/lib/graph-dsl.test.ts`
   - `src/lib/overview-dsl.test.ts`
   - `src/lib/wireframe-dsl.test.ts`
   - `src/lib/application-dsl.test.ts`
   - `src/lib/diagram-dsl.test.ts`
   - `src/cli/flow.test.ts`
5. Representative source corpus
   - `docs/examples/checkout.diagram`
   - `docs/intent/wireframe-dsl/examples/minimal.diagram`
   - `docs/intent/wireframe-dsl/examples/settings.diagram`
   - `docs/intent/wireframe-dsl/examples/workbench.diagram`
   - `docs/intent/wireframe-dsl/examples/narrow-error.diagram`
   - `docs/intent/wireframe-dsl/examples/disclosure.diagram`
   - `docs/intent/application-map/resume-studio.diagram`
   - `src/data/wireframes/sharing-disclosure.diagram`
   - representative files under `src/data/flows/`, `src/data/overviews/`, and `src/data/wireframes/`
6. Prior wireframe review and later evidence
   - `docs/intent/wireframe-dsl/pro-review/chatgpt-pro-prompt.md`
   - `docs/intent/wireframe-dsl/pro-review/feedback/wireframe-dsl-review.md`
   - `docs/intent/wireframe-dsl/feedback-integration.md`
   - `docs/intent/wireframe-content-fidelity/shape-brief.md`

Search for other call sites and fixtures when a finding depends on them. Cite the exact path and symbol or command.

## Priority questions

Answer these questions in ranked order.

### 1. Where does the current syntax create avoidable author work?

Identify repeated tokens, inconsistent command shapes, unnecessary quoting, noisy IDs, deep nesting, duplicated reference forms, verbose mutations, and concepts that require too much documentation.

Separate these categories:

- essential semantic detail;
- accidental syntax cost;
- complexity caused by the underlying product model;
- complexity that belongs in better defaults, tools, examples, or diagnostics instead of grammar changes.

Use source and parser evidence. Do not treat every repeated word as waste.

### 2. Which simplifications improve real authoring tasks?

Test changes against common work:

- create a minimal flow;
- add a process between two flow nodes;
- add a semantic need and UX relation;
- add and revise a flow variant;
- create an overview with grouped and ungrouped capabilities;
- link one capability to flow and wireframe targets;
- create an application page with states and artifact links;
- add a navigation condition;
- create a simple form wireframe;
- extract repeated wireframe content into a part and reuse it;
- add rest, hover, and open disclosure shots;
- make a one-screen copy change without changing sibling screens;
- diagnose an unknown option, missing ID, unsafe path, and invalid target.

Measure whether the edit is local, clear, and hard to get wrong.

### 3. Should the four body types share more syntax, less syntax, or the current amount?

Inspect the common envelope, IDs, strings, references, blocks, options, variants, and diagnostics. Decide where consistency earns its cost.

Do not force the four semantic models into one node system. Do not keep inconsistency merely because separate parsers already exist.

### 4. What is the smallest recommended language change?

Choose a concrete language shape. Show exact syntax. Explain why it beats the baseline and the rejected candidates.

The recommendation must state whether it changes:

- the envelope;
- quoting and escaping;
- IDs and generated IDs;
- command and option order;
- blocks and indentation;
- references;
- flow or overview variants;
- wireframe parts, uses, shots, marks, and controls;
- application pages, states, ownership, and navigation;
- canonical formatting;
- diagnostics;
- compatibility and migration.

### 5. What process should produce the best final DSL?

Recommend a bounded next step. It must use executable examples and rejection gates. It must not become an open-ended language redesign.

## Baseline examples

Use these short forms as orientation. Confirm their full contracts in the repository.

### Flow

```text
diagram 1
type flow

graph signup "New user signup"
node visitor actor "Visitor"
node form process "Complete form"
node account deliverable "Account"
edge visitor-form visitor -> form
edge form-account form -> account label="creates"

variant assisted "Assisted signup" {
  set node form title="Complete form with support"
}
```

### Overview

```text
diagram 1
type overview

overview studio "Evidence Studio"
group review "Review" {
  capability inspect "Inspect evidence"
    flow "flows/review.diagram"
    wireframe "wireframes/review.diagram" screen=review
}
capability export "Export approved result"
```

### Application map

```text
diagram 1
type application

application studio "Evidence Studio"
object project "Project"
page home "Projects" route="/projects" primary=project {
  state ready "Project selected"
  overview "scope.diagram" capability=home
  wireframe "studio.diagram" screen=home
}
page review "Review" route="/review" primary=project
nav home-review home -> review trigger="Open review"
```

### Wireframe

```text
diagram 1
type wireframe

wireframe settings "Account settings"
viewport 1280 800
theme default

part account-fields {
  field name "Name" value="Ada Lovelace"
  field email "Email" value="ada@example.com"
}

screen account "Account" basis=proposed {
  shot rest
  frame page content=720 {
    body {
      form account-form {
        use fields account-fields
        button save "Save changes"
      }
    }
  }
}
```

## Candidate design loop

Create four to six candidate language designs. The unchanged baseline is a separate control and does not count as a new design.

Include at least these contrasts:

1. An evolutionary design with only small syntax reductions and stronger defaults.
2. A design that makes command and reference forms more consistent across body types.
3. A more concise nested or indentation-led design.
4. One serious alternative that uses an established data notation or embedded host format instead of a custom grammar.

You can add one or two stronger hybrids. Do not create superficial variants that differ only in punctuation.

For each candidate:

1. State its design rules in ten lines or fewer.
2. Provide a compact grammar sketch. It need not be parser-complete.
3. Rewrite the same representative corpus. Include all four document types.
4. Show at least one complex case for flow variants and wireframe reuse or shots.
5. Perform the common edit tasks listed above.
6. Show invalid examples and the expected diagnostics.
7. Record what became shorter, longer, implicit, ambiguous, or harder to validate.
8. Reject the candidate when it loses required semantics or needs hidden heuristics.

Keep every candidate semantically equivalent to the compared baseline. Mark a trial `invalid` when it drops behavior, changes identity rules, or makes a required distinction unrepresentable.

## Evaluation dimensions

Score the baseline and each valid candidate from 0 to 10. Define what a high score means for every dimension. Show both raw scores and weighted results.

Use these dimensions:

- semantic fidelity;
- agent first-pass authoring reliability;
- human readability;
- learnability and recall;
- source concision;
- edit locality;
- diff clarity and merge behavior;
- explicit identity and stable references;
- grammar consistency across document types;
- composability and reuse;
- useful defaults without hidden behavior;
- parser simplicity;
- formatter simplicity and idempotence;
- diagnostic precision and recovery guidance;
- static validation strength;
- round-trip safety;
- typo resistance and ambiguity;
- support for partial or iterative authoring;
- discoverability from examples;
- inspectability by agents and tools;
- public language surface size;
- implementation cost;
- maintenance cost;
- migration cost for current `.diagram` files;
- future extension pressure;
- accessibility and rendering semantics that the source must preserve;
- path and reference safety;
- performance on large source files where syntax affects parsing or editing.

Weight semantic fidelity, agent reliability, edit locality, diagnostics, inspectability, and readable diffs highest. Give raw concision a moderate weight. Explain the weights.

Also report these descriptive measures for the shared corpus:

- physical lines;
- non-whitespace characters;
- approximate tokens;
- required explicit IDs;
- distinct command and option forms;
- maximum nesting depth;
- number of files or declarations touched for each edit task;
- number of invalid or ambiguous trials.

Do not use a composite score as the sole decision. A candidate with a fatal semantic or validation flaw cannot win on averages.

## Evidence rules

- Cite exact repository paths and symbols for observed facts.
- Use short excerpts only when they improve clarity.
- Separate facts, inferences, experiments, and recommendations.
- Label missing or conflicting evidence.
- Distinguish common authoring from advanced cases.
- Distinguish grammar problems from model, documentation, example, parser, formatter, renderer, and tooling problems.
- Explain the benefit and cost of every recommended change.
- Reject changes that do not earn their complexity.
- Do not infer authoring success from source size alone.
- Do not claim parser or renderer behavior that you did not verify.

If you can run repository commands, use:

```sh
pnpm test:dsl
pnpm test:overview
pnpm typecheck
pnpm check:flows
```

These checks verify the current baseline. They do not validate invented candidate grammars unless you create and run a separate disposable evaluator.

## Scope and non-goals

- Do not edit production code.
- Do not change Git state, create a branch, commit, push, or open a pull request.
- Do not design a production UI language, CSS replacement, general vector format, or programming language.
- Do not merge the four domain models into one universal node model.
- Do not weaken validation, path safety, accessibility basics, or stable identity to reduce syntax.
- Do not add compatibility layers by default. State whether a one-time hand edit is cheaper.
- Do not add dependencies unless the final recommendation proves a concrete need.
- Do not preserve current syntax only to avoid implementation work.
- Do not recommend a public helper for one isolated example.
- Do not overwrite or reinterpret the prior wireframe review as current proof.

## Decision gates

Classify each candidate as `better`, `not-better`, or `invalid`.

### A candidate is better only when

- it represents the required corpus without semantic loss;
- it improves at least two high-weight dimensions;
- it does not materially reduce another high-weight dimension;
- common edits remain local and clear;
- invalid input can still produce precise diagnostics;
- its implementation and migration cost match the gain;
- it needs no arbitrary style escape hatch or hidden inference.

### A candidate is not better when

- its main gain is fewer characters;
- it moves complexity from source into undocumented defaults;
- it improves one body type while making the full language less coherent;
- it needs substantially more parser or formatter code for a small authoring gain;
- it makes generated source harder for a person to review.

### A candidate is invalid when

- it drops required semantics;
- references or identities become ambiguous;
- equivalent round trips cannot preserve meaning;
- safe paths or typed targets cannot be validated;
- one common edit can silently change unrelated output;
- the comparison corpus is not semantically equivalent.

Stop the experiment after two consecutive new candidates fail for the same reason. Do not invent more dialects to force a winner.

## Required deliverable

Produce one stand-alone report named `diagram-dsl-concision-evaluation.md`.

If the active environment has a writable checkout, save it at:

`docs/research/diagram-dsl-concision-evaluation.md`

The GitHub app is read-only. If write access is absent, return the complete report in the response. State that no file, commit, push, or pull request was created.

The report must contain:

1. Access status, inspected ref, files read, and commands run.
2. An executive decision in ten lines or fewer.
3. A concise map of the current language and its real authoring costs.
4. The evaluation method, weights, invariants, and corpus.
5. The baseline results.
6. Four to six complete candidate summaries with representative syntax.
7. A shared-corpus measurement table.
8. A full score table across all required dimensions.
9. Edit-task results and diagnostic examples.
10. Findings from targeted prior art with primary-source links.
11. Accepted, rejected, and invalid candidate ledger.
12. The final recommended DSL shape with exact before-and-after examples for all four document types.
13. A compatibility and migration decision.
14. A bounded proof plan with GO, REVISE, NO-GO, and stop conditions.
15. Open questions that truly require Byron's decision.

For each recommendation, include:

- the affected author and task;
- repository evidence;
- the exact change;
- a before-and-after example;
- effects on semantics, parsing, formatting, diagnostics, diffs, and migration;
- alternatives considered;
- confidence;
- a cheap rejection check and a full acceptance check.

Use this final classification:

- **Keep** — current syntax or behavior is already strong.
- **Fix now** — high-value and low-regret.
- **Prototype** — promising but needs an executable proof.
- **Avoid** — added cost or hidden behavior exceeds the gain.
- **Remove or replace** — current syntax does not justify its cost.

## Final recommendation standard

Do not declare success until:

- every priority question has an evidence-backed answer;
- all candidates use the same semantic corpus;
- invalid trials are excluded from winner selection;
- the recommendation includes exact syntax for all four document types;
- the recommendation explains why it beats keeping the baseline;
- the next proof can reject the recommendation;
- all claims stay within the available evidence.

End with a compact status block. List access status, inspected ref, files read, checks run, deliverable location or response fallback, rejected assumptions, and unresolved blockers.

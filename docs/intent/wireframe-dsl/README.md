# Wireframe DSL: revised direction

Status: planning draft 0.2, revised after the Pro review on 2026-08-31. No wireframe interpreter exists yet.

Build a smaller custom language over browser layout. Keep semantic diagrams in their existing renderers. Prove the visual result before building the parser.

This folder is the current wireframe plan. Other project plans and application files remain outside this change.

## What this tool should do

Help Byron reduce an app idea through conversation and pictures. Agents edit the source. Byron inspects the result and asks for changes.

The useful loop is conversation → visual → revision → small implementation. The source should explain the screen without pixel positioning.

Keep the real app screenshot beside the wireframe. Label the screenshot's captured state and the wireframe's evidence basis. A simplified reconstruction is not an exact trace.

Keep only current ideas and real alternatives. Do not add a backlog, rejected-idea archive, or production UI generator.

## The decision

Own the authoring language, two frame templates, a small control set, diagnostics, and the review gallery. Use browser layout and text measurement internally.

The language shares the `.diagram` extension and envelope with flows and overviews. It does not share their semantic node model.

```text
diagram 1
type wireframe
wireframe settings "Account settings"
viewport 1280 720

screen account "Account settings" basis=proposed {
  frame page content=720 {
    body {
      text "Account settings" role=title
      field name "Display name" value="Byron"
      bar {
        end {
          button save "Save changes"
        }
      }
    }
  }
}
```

Controls depict a proposed state. They do not run application logic. Only `goto` navigates between gallery screens.

## What changed after the review

| Earlier draft | Revised plan | Reason |
| --- | --- | --- |
| Custom geometry engine | Browser layout, then a limited SVG serializer | Reuse text wrapping and size calculation. |
| Three shells | Workbench and page frames | Cover the proof corpus with fewer rules. |
| Wrapping toolbar rows | Fixed-height, non-wrapping bars | A label edit must not resize the diagram area. |
| One selected tree path | State on each element; stable owner and instance IDs | A selected tab and capability can coexist. |
| Duplicate capability cards | Embed the canonical overview | Keep capability meaning in one source. |
| Expanding root SVG | Fixed viewport and explicit overflow | Preserve honest screenshot comparison. |
| Broad diagram adapter assumption | Narrow read-only snapshot around current renderers | Prove the difficult integration before committing to it. |
| Parser first | Typed-fixture rendering experiment first | Reject the design before investing in syntax. |

Exact shared parts remain. Parameters, overrides, nested uses, and variant operations do not enter this version.

## The next experiment

Render six typed fixtures: a flow screen, capability detail, linked flow, settings form, narrow error state, and progressive disclosure. Use the proposed model before writing a parser.

Compare browser renders with standalone SVGs. Then change inspector text, toolbar labels, and shared parts. Measure which regions move.

The experiment must show readable overflow and stable diagram bounds. It must also preserve flow positions and routes without writing to source.

If this needs arbitrary styles, coordinates, or a second flow layout engine, revise or stop the custom language. Do not expand it automatically.

## Documents and evidence

- [Language contract](language.md): syntax, state, layout, references, and limits.
- [TypeScript model](model.ts): proposed data and capture records; not an implementation.
- [Implementation plan](implementation-plan.md): proof stages and acceptance gates.
- [Quick experiment](experiment/index.html): isolated browser-layout proof with six screens.
- [Progressive disclosure example](examples/disclosure.diagram): one real popover and three capture states.
- [Feedback integration](feedback-integration.md): adopted feedback and changes to the review's recommendations.
- [Full Pro review](pro-review/feedback/wireframe-dsl-review.md): unchanged downloaded report.
- [Download receipt](pro-review/feedback/receipt.json): report hash and working-tree evidence.
- [Submission](pro-review/submission.md): prompt, source packet, and conversation link.
- [Original drawing program](reference/original-generator.py.txt): historical Python source, not the proposed runtime.
- [Existing screenshot](reference/current-ui.jpg): historical visual baseline, not a fresh capture of today's working tree.

The screenshot copy has a corrected `.jpg` extension. The original `current-ui.png` contains JPEG bytes and remains unchanged.

The submitted packet preserves the earlier proposal. It remains evidence; it is not the current language specification.

## Draft examples

| File | Purpose |
| --- | --- |
| [minimal.diagram](examples/minimal.diagram) | Small embedded flow with review guidance. |
| [workbench.diagram](examples/workbench.diagram) | Current structure, overview, capability detail, linked flow, and picker. |
| [settings.diagram](examples/settings.diagram) | An ordinary form outside this workbench. |
| [narrow-error.diagram](examples/narrow-error.diagram) | Long labels and an error on a narrow page. |
| [resume-flow.diagram](examples/resume-flow.diagram) | A small flow fixture under the shared envelope. |

Wireframe examples are proposed syntax. The current application cannot parse them. Flow and overview references use workspace-root-relative paths.

## Current integration baseline

The review used commit `c1d47705f00db2167e1e4661043c641f1b743eec` plus local drafts. At integration, the same HEAD had newer uncommitted diagram and overview support.

The working tree already contains the common dispatcher, overview parser, catalog APIs, overview viewer, and navigation. Extend these after the proof. Do not create a second envelope or repeat completed migration work.

Keep the shared extension decision. Hand-update any remaining known documents, including the soccer repository when authorized in implementation. Do not add a converter or legacy-reader path.

## Confidence and limits

Pro judged the revised direction more likely to succeed than the first proposal. That judgment depends on browser-to-SVG fidelity and diagram snapshots.

The report includes layout experiments. Those experiments have not been reproduced here. The old gallery proves the desired appearance, not this language's ability to produce it.

This revision changes planning artifacts only. Renderer, parser, capture hooks, and GUI work remain unstarted.

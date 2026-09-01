---
title: "Diagram adoption verification"
slug: "visual-idea-overview-adoption-verification"
phase: implementation
status: current
last_updated: "2026-08-30"
---

# Diagram adoption verification

Date: 2026-08-30

This record covers the manual `.flow` to `.diagram` adoption and the maintained
authoring guidance for milestones 2 through 4. It does not include unrelated
work already present in either checkout.

## File mappings

Workbench examples:

- `docs/examples/checkout.flow` -> `docs/examples/checkout.diagram`
- `skills/author-flow-diagrams/references/examples/checkout.flow` -> `skills/author-flow-diagrams/references/examples/checkout.diagram`

Soccer diagrams:

- `docs/flows/00-coaching-cycle.flow` -> `docs/flows/00-coaching-cycle.diagram`
- `docs/flows/01-coach-access.flow` -> `docs/flows/01-coach-access.diagram`
- `docs/flows/02-roster-and-preferences.flow` -> `docs/flows/02-roster-and-preferences.diagram`
- `docs/flows/03-game-and-availability.flow` -> `docs/flows/03-game-and-availability.diagram`
- `docs/flows/04-schedule-planning.flow` -> `docs/flows/04-schedule-planning.diagram`
- `docs/flows/05-publish-print-and-revise.flow` -> `docs/flows/05-publish-print-and-revise.diagram`
- `docs/flows/06-position-settings.flow` -> `docs/flows/06-position-settings.diagram`
- `docs/flows/07-live-game.flow` -> `docs/flows/07-live-game.diagram`
- `docs/flows/08-confirm-and-review-history.flow` -> `docs/flows/08-confirm-and-review-history.diagram`

Each adopted flow begins with:

```text
diagram 1
type flow
```

The old `flow 3` line was removed. Graph content starts after the new envelope.

## Body equality

The body hash excludes the two-line envelope and its following separator. The
soccer hashes below were captured before and after each manual rename and header
edit. Every before hash equals its after hash.

| Source | Before SHA-256 | After SHA-256 |
| --- | --- | --- |
| `00-coaching-cycle` | `cd835c2325d47558412040ea0496d60f42fc30ec29deb283061069ef7f3861cc` | `cd835c2325d47558412040ea0496d60f42fc30ec29deb283061069ef7f3861cc` |
| `01-coach-access` | `46efebb1f430979045f00e5c727a97643cc234163f3c79478a1659dda067fd22` | `46efebb1f430979045f00e5c727a97643cc234163f3c79478a1659dda067fd22` |
| `02-roster-and-preferences` | `690e7fc0b8efe05f5a846a72810d43842da27ce5b02b6a948f82d3dd0d9e9318` | `690e7fc0b8efe05f5a846a72810d43842da27ce5b02b6a948f82d3dd0d9e9318` |
| `03-game-and-availability` | `4d8daf1c0b28b894d2e983ad2ef1200d4af3727e1ff6bad82727961583edfe0b` | `4d8daf1c0b28b894d2e983ad2ef1200d4af3727e1ff6bad82727961583edfe0b` |
| `04-schedule-planning` | `8a2cbec1fd20c811503f4ceaf1c6ea28b2dee4fe26744bd807c7423ed18f979e` | `8a2cbec1fd20c811503f4ceaf1c6ea28b2dee4fe26744bd807c7423ed18f979e` |
| `05-publish-print-and-revise` | `a8915911d619e888ffc10d4382ea0f6825264aad06cde005d0d977c90191baa1` | `a8915911d619e888ffc10d4382ea0f6825264aad06cde005d0d977c90191baa1` |
| `06-position-settings` | `72eb8a4b48a4d705492bf218fe43e9c8022bf9f3d9859b81a9b9cf7ade4d38aa` | `72eb8a4b48a4d705492bf218fe43e9c8022bf9f3d9859b81a9b9cf7ade4d38aa` |
| `07-live-game` | `ad18a811d70fb9377fcd67d65481f139790274370af58083c3c103e37ba78c6c` | `ad18a811d70fb9377fcd67d65481f139790274370af58083c3c103e37ba78c6c` |
| `08-confirm-and-review-history` | `9762baa6ddd8c51c4f547ed82a0c7ad9bba4d8d2d0191fbceeed97de821fe3f5` | `9762baa6ddd8c51c4f547ed82a0c7ad9bba4d8d2d0191fbceeed97de821fe3f5` |

The maintained checkout example body also matches its distributed and installed
copies. Its before and after SHA-256 is
`76767820bfde51df02e69647240475c3d967807a3f0b004784ec96b0f382910a`.

## Parity checks

- `docs/diagram-dsl-spec.md` equals `skills/author-flow-diagrams/references/flow-dsl-spec.md` byte-for-byte.
- The shared specification now contains the full maintained flow reference:
  fields, graph rules, edges, variants, positions, diagnostics, and formatting.
  It also contains the overview reference, many-to-many flow references,
  optional target variants, overview variants and operations, and the pure
  materialization/adoption workflow.
- `docs/flow-dsl-spec.md` is a short pointer to the shared specification. It is
  not a second public syntax reference.
- The maintained and installed `SKILL.md`, compact guide, full specification,
  and `.diagram` example are identical.
- Installed `agents/openai.yaml` was preserved, including its local custom
  wording.
- The skill creator validator passed.
- `git diff --check` passed in both checkouts.

## Passed checks

Workbench:

- Installed `flow check docs/examples/checkout.diagram`: passed.
- Installed `flow check src/data/overviews/resume-app.diagram`: passed.
- `pnpm prepack`: passed. The installed package resolves the rebuilt checkout
  distribution through the existing global symlink.
- Maintained and installed skill parity checks: passed.

Soccer:

- Installed `flow check docs/flows/*.diagram`: 9 files passed.
- Installed `flow format --check docs/flows/*.diagram`: passed.
- Repository Markdown formatter check for `docs/flows/README.md`: passed.
- Targeted gate tests: 4 tests passed.
- `pnpm -C app verify`: 25 test files and 164 tests passed; TypeScript,
  Prettier, and ESLint passed.
- `pnpm -C app check:docs`: passed. It checked changed Markdown links, four
  gate files, all nine diagrams, and the mixed application gate.

## Pre-existing failures and notices

`flow format --check docs/examples/checkout.diagram` reports that the example
is not canonical because it contains source comments. The authoring guidance
documents this formatter limitation and preserves the comments. Structural
checking still passes. The overview fixture now omits the default
`status "Intended"` line, so its canonical format check passes. The parser
still materializes the same `Intended` status when the source omits it.

The soccer verification reports 18 existing ESLint warnings in unrelated
application files. It reports no ESLint errors. Vitest also emits the existing
missing `MASTER_PASSWORD` diagnostic from its expected auth error test and an
outdated Browserslist data notice.

The initial sandbox attempt to rename soccer files returned `EPERM`; the same
authorized rename completed with checkout access. No dependency install,
configuration bypass, commit, branch, or worktree was used.

## Blockers

None. Adoption and documentation handoff are complete. The checkout example's
comment formatting notice is a known source condition, not an adoption blocker.

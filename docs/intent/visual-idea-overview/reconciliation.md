# CLI and authoring baseline reconciliation

Date: 2026-08-30

## Baseline

The CLI and skill changes landed during this review as `c1d4770`, **Release 0.2.0 with PNG flow rendering and contact sheets**. The local branch was one commit ahead of `origin/main` when checked. There is one checkout and no separate Git worktree. This initiative's folder remained untracked; all other workbench changes were committed.

The soccer repository is `/Users/byronwall/Projects/soccer-schedule`, at `78547b6` with uncommitted documentation-gate work and nine flow files. Read its current working tree, not only that commit. No files in that repository were changed by this reconciliation.

## What the plan now reuses

- `src/cli/runtime.ts`: owned local servers, launch identity, startup failure handling, and confirmed cleanup.
- `src/cli/cdp.ts`: local Chromium capture, fresh profiles, requested-URL readiness, final-paint checks, and browser cleanup.
- `src/cli/contact-sheet.ts`: native-size PNG tiles, SVG output, scaling, and paginated sheets.
- `src/cli/flow.ts`: source protection, file/batch capture, source hashes, pure JSON, variant selection, and overwrite protection.
- The compact authoring reference and runbook: narrow source reads, explicit evidence labels, image inspection, and bounded retries.

The overview still needs its own semantic model, board, source refresh, and file-type dispatch. The committed CLI does not provide those features. The first fixture proof can use ordinary browser capture. Source-backed overview rendering then uses the existing CLI infrastructure.

## Integration points that cannot be skipped

The `.diagram` change affects more than file names. Update CLI discovery, input checks, output-name derivation, catalog loading, source exports, and references. Preserve the launch-identity handshake used by server startup. Extend capture readiness and report layout identifiers for the board without weakening existing flow checks.

The catalog handler currently requires the launch token when the server sets one. The browser picker fetches `/api/flows` without that token. This is a source-level mismatch, not a browser reproduction from this turn. Add separate picker and startup checks when adapting the endpoints; successful direct-file renders do not cover it.

The maintained full specification and its distributed copy currently match byte-for-byte. The checkout example and distributed example also match. The installed compact and full references match the repository. The installed `SKILL.md` lacks the latest contact-sheet paragraph. Its `agents/openai.yaml` has local wording differences. Update the installed skill deliberately after validation; preserve unrelated customization.

Soccer's `app/scripts/check-docs.ts` classifies `.flow` as documentation and invokes the installed `flow` executable. Update that classification, tests, instructions, and source index for `.diagram`. Verify the executable supports the new header before using the gate. Gate-code edits require soccer's mixed-change checks. Keep its targeted formatter and full-verification fallback.

## Verification evidence and limits

The earlier [verification record](../flow-authoring-efficiency/verification-record.md) reports 35 passing tests, typecheck, package build, and nine successful soccer renders. Those are prior results, not reruns from this review.

This review inspected the committed source, soccer's working changes, and installed reference equality. Fresh `pnpm test:dsl` and `pnpm typecheck` attempts stopped before project execution. pnpm attempted dependency refresh and returned `ERR_PNPM_ABORTED_REMOVE_MODULES_DIR_NO_TTY`. No install was approved or retried. This does not establish a test failure in the project.

The planning documents were reconciled without changing application code, existing skills, dependency settings, or other ongoing work. Product intent, manual file updates, and the prohibition on migration tooling remain unchanged.

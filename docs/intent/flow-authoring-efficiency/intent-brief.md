# Reliable and efficient flow authoring

## My read

Make it easy for an agent to create valid, readable, durable flow diagrams from an existing application. The immediate request is a set of plans grouped by domain and owner. Implementation is not part of this request.

The soccer task showed that the DSL and authoring skill already support useful documentation. It produced nine base diagrams without user correction during execution. The agent preserved current application behavior and provided an index with maintenance instructions. Those strengths should remain.

The missing capability is direct visual feedback. An agent can check graph structure through the CLI, but must operate a browser separately to inspect layout. A render command should make that inspection a normal part of authoring.

## What matters most

- Produce a diagram image directly from a `.diagram` file.
- Keep exported images consistent with the interactive viewer.
- Report startup and rendering failures accurately.
- Reduce unnecessary source reads and application checks.
- Preserve semantic accuracy while shortening the feedback loop.
- Give each improvement a clear owner and observable completion criteria.

## Boundaries

Keep the DSL, semantic types, renderer, and existing viewer. Keep source files separate from browser state and generated images. Preserve manual positions when the source contains them.

Do not change application behavior, publish packages, or install global updates while preparing these plans. Do not add automatic diagram generation or a large test platform. A browser runtime decision remains a bounded implementation investigation.

## What seems settled

PNG rendering is the first product improvement. Directory rendering follows a successful single-file proof. A contact sheet can then reduce the cost of inspecting a diagram set.

The soccer repository owns its quality gates. The authoring skill must not silently override them. General agent guidance owns source-reading and evidence-reporting practices.

## Next step after confirmation

Use the [owner plan index](implementation-plan.md) to assign implementation. Start with the Flow CLI plan. The soccer documentation gate and skill reference work can proceed independently. No further product decision is required to begin the bounded proofs.

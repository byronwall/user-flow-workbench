export function VariantBar() {
  return (
    <section class="variant-bar" aria-label="Flow views">
      <div class="variant-picker">
        <span class="variant-picker-label" id="variantPickerLabel">View</span>
        <div
          class="variant-tabs"
          id="variantTabs"
          role="tablist"
          aria-labelledby="variantPickerLabel"
        />
      </div>
      <div class="variant-context" id="variantContext" aria-live="polite" />
    </section>
  );
}

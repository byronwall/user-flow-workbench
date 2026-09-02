export interface CapturedTextLine {
  text: string;
  x: number;
  y: number;
  fontSize: number;
  fontWeight: string;
  color: string;
}

export function svgEscape(value: unknown): string {
  return String(value ?? "").replace(/[&<>"']/g, (character) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&apos;",
  })[character]!);
}

/** Capture the browser's real line breaks. This is intentionally limited to plain text. */
export function captureTextLines(element: HTMLElement, origin: DOMRect): CapturedTextLine[] {
  const style = getComputedStyle(element);
  const lines: Array<CapturedTextLine & { top: number }> = [];
  const walker = document.createTreeWalker(element, NodeFilter.SHOW_TEXT);
  let node: Node | null;
  while ((node = walker.nextNode())) {
    const value = node.textContent || "";
    for (let index = 0; index < value.length; index += 1) {
      const range = document.createRange();
      range.setStart(node, index);
      range.setEnd(node, index + 1);
      const rect = range.getBoundingClientRect();
      if (!rect.width && !rect.height) continue;
      const top = Math.round(rect.top * 2) / 2;
      let line = lines.find((candidate) => candidate.top === top);
      if (!line) {
        line = { text: "", x: rect.left - origin.left, y: rect.top - origin.top + Number.parseFloat(style.fontSize) * 0.82, top, fontSize: Number.parseFloat(style.fontSize), fontWeight: style.fontWeight, color: style.color };
        lines.push(line);
      }
      line.text += value[index];
    }
  }
  return lines.map(({ top: _top, ...line }) => ({ ...line, text: line.text.trim() })).filter((line) => line.text);
}

export function textLinesToSvg(lines: readonly CapturedTextLine[]): string {
  return lines.map((line) => `<text x="${line.x.toFixed(1)}" y="${line.y.toFixed(1)}" font-family="Arial,Helvetica,sans-serif" font-size="${line.fontSize}" font-weight="${svgEscape(line.fontWeight)}" fill="${svgEscape(line.color)}">${svgEscape(line.text)}</text>`).join("");
}

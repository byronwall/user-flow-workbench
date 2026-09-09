export const DSL_IDENTIFIER = /^[A-Za-z0-9][A-Za-z0-9._-]*$/;

export type QuotedStringResult =
  | { readonly value: string }
  | { readonly error: string; readonly offset: number };

export function decodeDslQuoted(raw: string): QuotedStringResult {
  if (!raw.startsWith('"') || !raw.endsWith('"')) return { error: "Expected a quoted string.", offset: 0 };
  let value = "";
  for (let index = 1; index < raw.length - 1; index += 1) {
    const character = raw[index];
    if (character !== "\\") {
      value += character;
      continue;
    }
    const escaped = raw[index + 1];
    if (!escaped || index + 1 >= raw.length - 1) return { error: 'Unknown string escape "\\\\".', offset: index };
    if (escaped === '"' || escaped === "\\") value += escaped;
    else if (escaped === "n") value += "\n";
    else return { error: `Unknown string escape "\\${escaped}".`, offset: index };
    index += 1;
  }
  return { value };
}

export function encodeDslQuoted(value: string): string {
  return `"${value.replace(/\\/g, "\\\\").replace(/"/g, '\\"').replace(/\n/g, "\\n")}"`;
}

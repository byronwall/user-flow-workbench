import { mkdir, readFile, rename, unlink, writeFile } from "node:fs/promises";
import { randomUUID } from "node:crypto";
import { basename, dirname, extname, resolve } from "node:path";

export interface ContactSheetItem { label: string; path: string; status: "success" | "failed"; error?: string }

interface ImageDimensions {
  width: number;
  height: number;
}

interface EmbeddedContactSheetItem extends ContactSheetItem {
  image?: string;
  imageDimensions?: ImageDimensions;
}

export interface ContactSheetOptions {
  /** Rasterize each generated SVG sheet when the requested output is PNG. */
  rasterize?: (svg: string, width: number, height: number) => Promise<Uint8Array>;
}

export function contactSheetFormat(outputPath: string): "png" | "svg" {
  const extension = extname(outputPath).toLowerCase();
  if (extension === ".png") return "png";
  if (extension === ".svg") return "svg";
  throw new Error("--contact-sheet must use a .png or .svg extension.");
}

export function contactSheetOutputPaths(outputPath: string, itemCount: number): string[] {
  const count = Math.max(1, Math.ceil(itemCount / 12));
  const extension = extname(outputPath);
  const stem = basename(outputPath, extension);
  return Array.from({ length: count }, (_, index) => {
    const suffix = count > 1 ? `-${String(index + 1).padStart(2, "0")}` : "";
    return resolve(dirname(outputPath), `${stem}${suffix}${extension}`);
  });
}

function esc(value: string): string {
  return value.replace(/[&<>"']/g, char => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&apos;" }[char]!));
}

/** Read the intrinsic pixel size from a PNG without decoding its pixels. */
export function pngDimensions(content: Uint8Array): ImageDimensions | undefined {
  if (content.length < 24) return undefined;
  const signature = [137, 80, 78, 71, 13, 10, 26, 10];
  if (!signature.every((byte, index) => content[index] === byte)) return undefined;
  if (String.fromCharCode(...content.slice(12, 16)) !== "IHDR") return undefined;
  const view = new DataView(content.buffer, content.byteOffset, content.byteLength);
  const width = view.getUint32(16);
  const height = view.getUint32(20);
  return width > 0 && height > 0 ? { width, height } : undefined;
}

function sheetSvg(items: EmbeddedContactSheetItem[], marker: string): { svg: string; width: number; height: number } {
  // Keep malformed fixtures and failure-only sheets usable. Successful PNGs
  // normally provide their native size, which sets the geometry for the page.
  const fallbackDimensions = { width: 340, height: 210 };
  const dimensions = items.map(item => item.imageDimensions || (item.status === "success" ? fallbackDimensions : undefined)).filter((value): value is ImageDimensions => Boolean(value));
  const imageWidth = Math.max(fallbackDimensions.width, ...dimensions.map(value => value.width));
  const imageHeight = Math.max(fallbackDimensions.height, ...dimensions.map(value => value.height));
  const nativePixels = dimensions.some(value => value.width > fallbackDimensions.width || value.height > fallbackDimensions.height);
  const cellWidth = nativePixels ? imageWidth + 40 : 360;
  const cellHeight = nativePixels ? imageHeight + 50 : 250;
  const columns = Math.min(3, Math.max(1, items.length || 1));
  const rows = Math.max(1, Math.ceil((items.length || 1) / columns));
  const width = columns * cellWidth;
  const height = rows * cellHeight;
  const renderedCells: string[] = [];
  for (const [index, item] of items.entries()) {
    const x = (index % columns) * cellWidth;
    const y = Math.floor(index / columns) * cellHeight;
    if (item.status === "success") {
      const dimensions = item.imageDimensions || fallbackDimensions;
      const imageX = Math.round((cellWidth - dimensions.width) / 2);
      const imageY = 10;
      const labelY = imageY + dimensions.height + (nativePixels ? 28 : 18);
      renderedCells.push(`<g transform="translate(${x},${y})"><rect width="${cellWidth}" height="${cellHeight}" fill="#f7f8fb" stroke="#d9deea"/><a href="${esc(item.path)}"><image x="${imageX}" y="${imageY}" width="${dimensions.width}" height="${dimensions.height}" preserveAspectRatio="none" href="data:image/png;base64,${item.image || ""}"/><title>${esc(item.label)}</title></a><text x="12" y="${labelY}" font-family="system-ui,sans-serif" font-size="16" fill="#182033">${esc(item.label)}</text></g>`);
    } else {
      renderedCells.push(`<g transform="translate(${x},${y})"><rect width="${cellWidth}" height="${cellHeight}" fill="#fff4f4" stroke="#e4a6a6"/><text x="16" y="36" font-family="system-ui,sans-serif" font-size="16" font-weight="700" fill="#8f2727">Failed render</text><text x="16" y="64" font-family="system-ui,sans-serif" font-size="16" fill="#552020">${esc(item.label)}</text><foreignObject x="16" y="82" width="${Math.max(1, cellWidth - 32)}" height="${Math.max(1, cellHeight - 98)}"><div xmlns="http://www.w3.org/1999/xhtml" style="font:16px system-ui,sans-serif;color:#552020;overflow-wrap:anywhere">${esc(item.error || "Unknown error")}</div></foreignObject></g>`);
    }
  }
  return { svg: `<svg xmlns="http://www.w3.org/2000/svg" data-flow-contact-sheet="${marker}" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">${renderedCells.join("")}</svg>\n`, width, height };
}

async function atomicWrite(path: string, content: Uint8Array | string): Promise<void> {
  await mkdir(dirname(path), { recursive: true });
  const temporary = `${path}.tmp-${process.pid}-${Date.now()}`;
  try {
    await writeFile(temporary, content);
    await rename(temporary, path);
  } catch (error) {
    await unlink(temporary).catch(() => undefined);
    throw error;
  }
}

export async function writeContactSheets(items: ContactSheetItem[], outputPath: string, options: ContactSheetOptions = {}): Promise<string[]> {
  const format = contactSheetFormat(outputPath);
  if (format === "png" && !options.rasterize) throw new Error("PNG contact sheets require the browser rasterizer.");
  const chunkSize = 12;
  const chunks = Array.from({ length: Math.max(1, Math.ceil(items.length / chunkSize)) }, (_, index) => items.slice(index * chunkSize, (index + 1) * chunkSize));
  const outputs: string[] = [];
  const paths = contactSheetOutputPaths(outputPath, items.length);
  for (const [sheetIndex, chunk] of chunks.entries()) {
    const embeddedItems: EmbeddedContactSheetItem[] = [];
    for (const item of chunk) {
      if (item.status !== "success") {
        embeddedItems.push(item);
        continue;
      }
      const content = await readFile(item.path);
      embeddedItems.push({ ...item, image: content.toString("base64"), imageDimensions: pngDimensions(content) });
    }
    const { svg, width, height } = sheetSvg(embeddedItems, randomUUID());
    const output = paths[sheetIndex];
    if (format === "svg") await atomicWrite(output, svg);
    else await atomicWrite(output, await options.rasterize!(svg, width, height));
    outputs.push(output);
  }
  return outputs;
}

export async function writeContactSheet(items: ContactSheetItem[], outputPath: string, options: ContactSheetOptions = {}): Promise<void> {
  await writeContactSheets(items, outputPath, options);
}

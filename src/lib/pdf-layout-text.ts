type PdfTextLikeItem = {
  str?: string;
  transform?: number[];
  width?: number;
  height?: number;
} | Record<string, unknown>;

type PositionedItem = {
  text: string;
  x: number;
  y: number;
  width: number;
  height: number;
};

function normalizeWhitespace(value: string) {
  return value.replace(/\s+/g, " ").trim();
}

function positionItems(items: PdfTextLikeItem[]) {
  return items
    .map((item) => {
      const text = normalizeWhitespace(typeof item?.str === "string" ? item.str : "");
      const transform = Array.isArray(item?.transform) ? item.transform : [];

      return {
        text,
        x: Number(transform[4] ?? 0),
        y: Number(transform[5] ?? 0),
        width: Math.abs(Number(item?.width ?? 0)),
        height: Math.abs(Number(item?.height ?? transform[3] ?? 0)),
      } satisfies PositionedItem;
    })
    .filter((item) => item.text);
}

function groupItemsIntoLines(items: PositionedItem[]) {
  const sorted = [...items].sort((left, right) => {
    const verticalDelta = right.y - left.y;
    if (Math.abs(verticalDelta) > 2) return verticalDelta;
    return left.x - right.x;
  });

  const lines: Array<{ y: number; height: number; items: PositionedItem[] }> = [];

  for (const item of sorted) {
    const currentLine = lines[lines.length - 1];
    const tolerance = Math.max(2.5, Math.max(item.height, currentLine?.height || 0) * 0.45);

    if (!currentLine || Math.abs(currentLine.y - item.y) > tolerance) {
      lines.push({
        y: item.y,
        height: item.height,
        items: [item],
      });
      continue;
    }

    currentLine.items.push(item);
    currentLine.height = Math.max(currentLine.height, item.height);
  }

  return lines;
}

function renderLine(items: PositionedItem[]) {
  const ordered = [...items].sort((left, right) => left.x - right.x);
  const parts: string[] = [];
  let previousRightEdge: number | null = null;

  for (const item of ordered) {
    if (previousRightEdge !== null) {
      const gap = item.x - previousRightEdge;
      if (gap > 120) {
        parts.push(" | ");
      } else if (gap > 8) {
        parts.push(" ");
      }
    }

    parts.push(item.text);
    previousRightEdge = item.x + Math.max(item.width, item.text.length * 4.5);
  }

  return parts.join("").replace(/\s+\|\s+/g, " | ").trim();
}

export function reconstructPdfTextFromItems(items: PdfTextLikeItem[]) {
  const positioned = positionItems(items);
  if (!positioned.length) return "";

  return groupItemsIntoLines(positioned)
    .map((line) => renderLine(line.items))
    .filter(Boolean)
    .join("\n")
    .replace(/[ \t]+\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

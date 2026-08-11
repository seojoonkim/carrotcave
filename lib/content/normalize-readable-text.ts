const REACTION_LINE = /(?:\s|^)(?:[\p{Extended_Pictographic}\uFE0F]+\s*\d+\s*)+$/u;

function comparable(value: string): string {
  return value.normalize('NFKC').replace(/^#{1,6}\s+/, '').replace(/[.!?。！？]+$/, '').replace(/\s+/g, ' ').trim().toLocaleLowerCase('ko-KR');
}

/** The canonical form used both for rendering-derived evidence and ontology audits. */
export function normalizeReadableText(content: string, title = ''): string {
  let value = String(content ?? '').normalize('NFC').replace(/[“”]/g, '"').replace(/[‘’]/g, "'").trim();
  value = value.replace(REACTION_LINE, '').trim();
  if (title) {
    const lines = value.split(/\r?\n/);
    const first = lines.findIndex((line) => line.trim());
    if (first >= 0) {
      const normalizedTitle = comparable(title);
      const normalizedLine = comparable(lines[first]);
      if (normalizedLine === normalizedTitle) lines.splice(first, 1);
      else if (normalizedLine.startsWith(`${normalizedTitle} `)) {
        const raw = lines[first].trim();
        lines[first] = raw.slice(Math.min(raw.length, title.trim().length)).replace(/^\s*[-–—:：]\s*/, '');
      }
    }
    value = lines.join('\n');
  }
  return value.replace(/\s+/g, ' ').trim();
}

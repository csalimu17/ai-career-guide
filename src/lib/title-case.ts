const SKIP_WORDS = new Set([
  'a', 'an', 'the', 'at', 'by', 'for', 'in', 'of', 'on', 'to', 'up',
  'and', 'as', 'but', 'or', 'nor', 'via', 'vs', 'etc',
]);

export function toTitleCase(str: string): string {
  if (!str || !str.trim()) return str;
  const words = str.trim().split(/\s+/);
  return words
    .map((word, i) => {
      if (!word) return word;
      // Keep all-caps acronyms (MBA, PhD, CEO, etc.) as-is
      if (word.length > 1 && word === word.toUpperCase() && /[A-Z]/.test(word)) {
        return word;
      }
      // Always capitalize first and last word; skip small words in the middle
      if (i === 0 || i === words.length - 1 || !SKIP_WORDS.has(word.toLowerCase())) {
        return word.charAt(0).toUpperCase() + word.slice(1);
      }
      return word.toLowerCase();
    })
    .join(' ');
}

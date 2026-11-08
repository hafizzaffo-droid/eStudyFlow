const normalizeForComparison = (value: string) =>
  value
    .normalize('NFKC')
    .replace(/\s+/g, ' ')
    .trim()
    .replace(/[.!?…]+$/u, '')
    .toLocaleLowerCase();

export function hasDistinctArticleContent(summary: string, content: string): boolean {
  const normalizedContent = normalizeForComparison(content);
  return Boolean(normalizedContent && normalizedContent !== normalizeForComparison(summary));
}
